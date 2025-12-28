import { useState, useEffect, useRef } from 'react'
import pStyles from './Profile.module.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { updateProfile, changePassword } from '../../services/users'
import useToast from '../../components/Toasts/useToast'
import BaseButton from '../../components/Button/BaseButton'
import useConfirm from '../../components/Confirm/useConfirm'
import { deleteAccount } from '../../services/users'

export default function Profile() {
  const { user, token, loadCurrentUser, logoutUser } = useAuth()
  const navigate = useNavigate()
  const [editingFields, setEditingFields] = useState({ username: false, wallet: false })
  const [form, setForm] = useState({ username: '', wallet_address: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const confirm = useConfirm()

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || '', wallet_address: user.wallet_address || '' })
    }
  }, [user])

  const usernameRef = useRef(null)
  const walletRef = useRef(null)
  const avatarInputRef = useRef(null)
  const [savingFields, setSavingFields] = useState({ username: false, wallet: false })

  const handleChange = (event) => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }))

  const handleFile = (event) => setAvatarFile(event.target.files && event.target.files[0] ? event.target.files[0] : null)

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [avatarFile])

  const handleSaveField = async (field) => {
    if (!token) return toast.error('No autorizado')
    setSavingFields(prev => ({ ...prev, [field]: true }))
    try {
      const payload = {}
      if (field === 'username') payload.username = form.username
      if (field === 'wallet') payload.wallet_address = form.wallet_address
      await updateProfile(token, payload)
      await loadCurrentUser()
      toast.success('Campo guardado')
      setEditingFields(prev => ({ ...prev, [field]: false }))
    } catch (err) {
      const msg = err && err.message ? err.message : 'Error guardando campo'
      toast.error(msg)
    } finally {
      setSavingFields(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleCancelField = (field) => {

    setForm(prev => ({ ...prev, [field === 'wallet' ? 'wallet_address' : 'username']: user[field === 'wallet' ? 'wallet_address' : 'username'] || '' }))
    setEditingFields(prev => ({ ...prev, [field]: false }))
  }

  const openAvatarPicker = () => {
    if (avatarInputRef && avatarInputRef.current) avatarInputRef.current.click()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      if (form.username) formData.append('username', form.username)
      if (form.wallet_address) formData.append('wallet_address', form.wallet_address)
      if (avatarFile) formData.append('image', avatarFile)
      await updateProfile(token, formData)
      await loadCurrentUser()
      setMessage('Perfil actualizado correctamente')
      setEditingFields({ username: false, wallet: false })

      setAvatarFile(null)
      setAvatarPreview(null)
      if (avatarInputRef && avatarInputRef.current) avatarInputRef.current.value = ''
    } catch (err) {
      setMessage(err.message || 'Error actualizando perfil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (!currentPassword) return toast.error('Introduce la contraseña actual')
    if (!newPassword || newPassword.length < 16) return toast.error('La nueva contraseña debe tener al menos 16 caracteres')
    if (newPassword !== confirmPassword) return toast.error('La nueva contraseña y la confirmación no coinciden')
    setPwLoading(true)
    try {
      await changePassword(token, { currentPassword, newPassword, confirmPassword })
      toast.success('Contraseña actualizada correctamente — por seguridad vuelve a iniciar sesión')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      logoutUser()
      navigate('/login')
    } catch (err) {
      const data = err && err.data
      if (data && data.errors && Array.isArray(data.errors)) {
        const msgs = data.errors.map(e => e.msg || e.message).join('\n')
        toast.error(msgs)
      } else if (data && data.error) {
        toast.error(data.error)
      } else if (err.message) {
        toast.error(err.message)
      } else {
        toast.error('Error cambiando la contraseña')
      }
    } finally {
      setPwLoading(false)
    }
  }

  const handlePasswordCancel = (event) => {
    event.preventDefault()
    setPwLoading(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.info('Cambios descartados')
  }

  const handleDelete = async (event) => {
    event.preventDefault()
    if (!deletePassword) return toast.error('Introduce la contraseña actual para eliminar la cuenta')
    const confirmed = await confirm('¿Eliminar cuenta? Esta acción es irreversible')
    if (!confirmed) return
    setDeleteLoading(true)
    try {
      await deleteAccount(token, { currentPassword: deletePassword })
      toast.success('Cuenta eliminada')

      logoutUser()
      navigate('/')
    } catch (err) {
      const data = err && err.data
      if (data && data.errors && Array.isArray(data.errors)) {
        const msgs = data.errors.map(e => e.msg || e.message).join('\n')
        toast.error(msgs)
      } else if (data && data.error) {
        toast.error(data.error)
      } else if (err.message) {
        toast.error(err.message)
      } else {
        toast.error('Error eliminando la cuenta')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!user) return <div className={pStyles.container}>Cargando usuario...</div>

  const copyWallet = async () => {
    if (!user || !user.wallet_address) return
    try {
      await navigator.clipboard.writeText(user.wallet_address)
      toast.success('Wallet copiada al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const formatWalletShort = (wallet) => {
    if (!wallet) return '-'
    if (wallet.length <= 16) return wallet
    const prefix = wallet.slice(0, 8)
    const suffix = wallet.slice(-4)
    return `${prefix}...${suffix}`
  }

  return (
    <div className={pStyles.container}>
      {message && <div className={pStyles.message}>{message}</div>}
      <div className={pStyles.header}>
        <div className={pStyles.avatarWrapper}>
          <div className={pStyles.avatarInner}>
            {}
            {avatarPreview || user.avatar ? (
              <img src={avatarPreview || user.avatar} alt={avatarPreview ? 'Avatar preview' : user.username} className={pStyles.avatarImg} />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ddd' }} />
            )}
          </div>
          {}
          {avatarPreview && (
            <div className={pStyles.previewOverlay}>
              <BaseButton className={pStyles.previewOverlayButton} iconOnly variant="ghost" size="md" aria-label="Eliminar selección" title="Eliminar selección" onClick={(e) => {
                e.preventDefault()
                setAvatarFile(null)
                setAvatarPreview(null)
                if (avatarInputRef && avatarInputRef.current) avatarInputRef.current.value = ''
              }}>
                <span aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z"/></svg>
                </span>
              </BaseButton>
            </div>
          )}
          <BaseButton className={pStyles.avatarOverlay} iconOnly variant="ghost" size="md" aria-label="Cambiar foto" title="Cambiar foto" onClick={(e) => { e.preventDefault(); openAvatarPicker() }}>
            <span aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V7a2 2 0 00-2-2h-3.17l-1.84-2H10.01L8.17 5H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2zM12 17a5 5 0 110-10 5 5 0 010 10z"/>
              </svg>
            </span>
          </BaseButton>
        </div>
        <div className={pStyles.infoCard}>
          <dl>
            <div className={pStyles.infoRow}>
              <dt className={pStyles.infoLabel}>Usuario</dt>
              <dd className={pStyles.infoValue}>{user.username}</dd>
            </div>
            <div className={pStyles.infoRow}>
              <dt className={pStyles.infoLabel}>Email</dt>
              <dd className={pStyles.infoValue}>{user.email}</dd>
            </div>
            <div className={pStyles.infoRow}>
              <dt className={pStyles.infoLabel}>Wallet</dt>
              <dd className={pStyles.infoValueWallet}>
                <span className={pStyles.mono} title={user.wallet_address}>{user.wallet_address ? formatWalletShort(user.wallet_address) : '-'}</span>
                <BaseButton className={pStyles.copyBtn} iconOnly variant="ghost" size="sm" onClick={copyWallet} title="Copiar wallet" aria-label="Copiar wallet">
                  <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                  </span>
                </BaseButton>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={pStyles.form}>
        <div className={pStyles.field}>
          <label htmlFor="username">Usuario</label>
          <div className={`${pStyles.inputGroup} ${editingFields.username ? pStyles.editing : ''}`}>
            <input ref={usernameRef} id="username" name="username" value={form.username} onChange={handleChange} required readOnly={!editingFields.username} className={pStyles.input} />
            {!editingFields.username ? (
              <BaseButton className={pStyles.inputAction} iconOnly variant="ghost" size="md" aria-label="Editar usuario" title="Editar usuario" onClick={(e) => { e.preventDefault(); setEditingFields(prev => ({ ...prev, username: true })); setTimeout(() => usernameRef.current && usernameRef.current.focus(), 0) }}>
                <span aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                  </svg>
                </span>
              </BaseButton>
            ) : (
              <div className={pStyles.inputActions}>
                <BaseButton className={pStyles.inputAction} iconOnly variant="primary" size="md" aria-label="Guardar usuario" title="Guardar usuario" onClick={(e) => { e.preventDefault(); handleSaveField('username') }} disabled={savingFields.username}>
                  {savingFields.username ? <span aria-hidden>⏳</span> : <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </span>}
                </BaseButton>
                <BaseButton className={pStyles.inputAction} iconOnly variant="cancel-action" size="md" aria-label="Cancelar" title="Cancelar" onClick={(e) => { e.preventDefault(); handleCancelField('username') }}>
                  <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z"/></svg>
                  </span>
                </BaseButton>
              </div>
            )}
          </div>
        </div>
        <div className={pStyles.field}>
          <label htmlFor="wallet">Wallet (opcional)</label>
          <div className={`${pStyles.inputGroup} ${editingFields.wallet ? pStyles.editing : ''}`}>
            <input ref={walletRef} id="wallet" name="wallet_address" value={form.wallet_address} onChange={handleChange} placeholder="0x..." readOnly={!editingFields.wallet} className={pStyles.input} />
            {!editingFields.wallet ? (
              <BaseButton className={pStyles.inputAction} iconOnly variant="ghost" size="md" aria-label="Editar wallet" title="Editar wallet" onClick={(e) => { e.preventDefault(); setEditingFields(prev => ({ ...prev, wallet: true })); setTimeout(() => walletRef.current && walletRef.current.focus(), 0) }}>
                <span aria-hidden>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                  </svg>
                </span>
              </BaseButton>
            ) : (
              <div className={pStyles.inputActions}>
                <BaseButton className={pStyles.inputAction} iconOnly variant="primary" size="md" aria-label="Guardar wallet" title="Guardar wallet" onClick={(e) => { e.preventDefault(); handleSaveField('wallet') }} disabled={savingFields.wallet}>
                  {savingFields.wallet ? <span aria-hidden>⏳</span> : <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </span>}
                </BaseButton>
                <BaseButton className={pStyles.inputAction} iconOnly variant="cancel-action" size="md" aria-label="Cancelar" title="Cancelar" onClick={(e) => { e.preventDefault(); handleCancelField('wallet') }}>
                  <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.41 4.29 19.71 2.88 18.3 9.18 12 2.88 5.71 4.29 4.29 10.59 10.59 16.88 4.29z"/></svg>
                  </span>
                </BaseButton>
              </div>
            )}
          </div>
        </div>
        <div className={pStyles.field}>
          <input ref={avatarInputRef} id="avatar" name="avatar" type="file" accept="image/*" onChange={handleFile} className={pStyles.hiddenFile} />
        </div>
        <div className={pStyles.actions}>
          <BaseButton type="submit" variant="primary-action" size="md" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</BaseButton>
          <BaseButton type="button" variant="cancel-action" size="md" onClick={() => {

            setForm({ username: user.username || '', wallet_address: user.wallet_address || '' })
              setAvatarFile(null)
              setAvatarPreview(null)
              if (avatarInputRef && avatarInputRef.current) avatarInputRef.current.value = ''
              setEditingFields({ username: false, wallet: false })
          }}>Cancelar</BaseButton>
        </div>
      </form>

      <div style={{ marginTop: '1.5rem', border: '1px solid #eee', padding: '1rem', borderRadius: 8 }}>
        <h3>Cambiar contraseña</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: '.75rem' }}>
            <label>Contraseña actual</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '.5rem' }} />
          </div>
          <div style={{ marginBottom: '.75rem' }}>
            <label>Nueva contraseña (mínimo 16 caracteres)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '.5rem' }} />
          </div>
          <div style={{ marginBottom: '.75rem' }}>
            <label>Confirmar nueva contraseña</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '.5rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <BaseButton type="submit" variant="primary-action" size="md" disabled={pwLoading}>{pwLoading ? 'Cambiando...' : 'Cambiar contraseña'}</BaseButton>
            <BaseButton type="button" variant="cancel-action" size="md" onClick={handlePasswordCancel}>Cancelar</BaseButton>
          </div>
        </form>
      </div>

      {user.role === 'owner' ? (
        <div style={{ marginTop: '1.25rem', border: '1px solid #eef2ff', background: '#f7fbff', padding: '1rem', borderRadius: 8 }}>
          <h3 style={{ color: '#0b3b8b' }}>Eliminar cuenta</h3>
          <p style={{ marginTop: 0, color: '#444' }}>Tu cuenta tiene el rol de <strong>owner</strong>. Por seguridad, las cuentas owner no pueden eliminarse desde el perfil.</p>
        </div>
      ) : (
        <div style={{ marginTop: '1.25rem', border: '1px solid rgb(220 38 38 / 30%)', background: 'var(--bg-error)', padding: '1rem', borderRadius: 8 }}>
          <h3 style={{ color: 'var(--color-error)' }}>Eliminar cuenta</h3>
          <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>Esta acción eliminará tu cuenta y todo su contenido. Introduce tu contraseña para confirmar.</p>
          <form onSubmit={handleDelete}>
            <div style={{ marginBottom: '.75rem' }}>
              <label>Contraseña actual</label>
              <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} required style={{ width: '100%', padding: '.5rem' }} />
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <BaseButton type="submit" variant="danger" size="md" disabled={deleteLoading}>{deleteLoading ? 'Eliminando...' : 'Eliminar cuenta'}</BaseButton>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
