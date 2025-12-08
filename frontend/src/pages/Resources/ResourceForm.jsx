import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createResource, updateResource, getResource } from '../../services/resources'
import { useAuth } from '../../context/useAuth'
import useToast from '../../components/Toasts/useToast'
import BaseButton from '../../components/Button/BaseButton'
import styles from './Resources.module.css'

export default function ResourceForm() {
  const { resourceId, id } = useParams()
  const resolvedResourceId = resourceId || id
  const navigate = useNavigate()
  const { token } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', type: 'pdf', category: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (resolvedResourceId) {
      (async () => {
        try {
          const res = await getResource(resolvedResourceId)
          if (res.resource) setForm({ title: res.resource.title || '', description: res.resource.description || '', type: res.resource.type || 'pdf', category: res.resource.category || '' })
        } catch (err) { console.error(err) }
      })()
    }
  }, [resolvedResourceId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) return toast.error('Inicia sesión para subir recursos')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('type', form.type)
      formData.append('category', form.category)

      if (!id && !file) {
        setLoading(false)
        return toast.error('El archivo es requerido al crear un recurso')
      }
      if (file) formData.append('file', file)

      if (resolvedResourceId) {
        await updateResource(token, resolvedResourceId, formData)
        toast.success('Recurso actualizado')
        navigate(`/resources/${resolvedResourceId}`)
      } else {
        const res = await createResource(token, formData)
        toast.success('Recurso creado')
        navigate(`/resources/${res.resource._id}`)
      }
    } catch (err) {
      console.error(err)

      const data = err && err.data
      if (data && data.errors && Array.isArray(data.errors)) {
        const msgs = data.errors.map(errorItem => errorItem.msg || errorItem.message).join('\n')
        toast.error(msgs)
      } else if (data && data.error) {
        toast.error(data.error)
      } else if (err.message) {
        toast.error(err.message)
      } else {
        toast.error('Error al guardar recurso')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className={`${styles.root} ${styles.containerNarrow}`}>
      <h2>{id ? 'Editar Recurso' : 'Subir Recurso'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Título</label>
          <input className={styles.input} value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea className={styles.textarea} value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} rows={6} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tipo</label>
          <select className={styles.select} value={form.type} onChange={event => setForm(prev => ({ ...prev, type: event.target.value }))}>
            <option value="pdf">pdf</option>
            <option value="image">image</option>
            <option value="guide">guide</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Categoría</label>
          <select className={styles.select} value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}>
            <option value="">Selecciona...</option>
            <option value="análisis-técnico">análisis-técnico</option>
            <option value="fundamentos">fundamentos</option>
            <option value="trading">trading</option>
            <option value="seguridad">seguridad</option>
            <option value="defi">defi</option>
            <option value="otro">otro</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Archivo</label>
          <input className={styles.input} type="file" onChange={event => setFile(event.target.files && event.target.files[0] ? event.target.files[0] : null)} />
        </div>
        <div className={styles.actionsRow}>
          <BaseButton type="submit" variant="primary-action" size="md" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</BaseButton>
          <BaseButton type="button" variant="cancel-action" size="md" onClick={() => navigate('/resources')}>Cancelar</BaseButton>
        </div>
      </form>
    </div>
  )
}
