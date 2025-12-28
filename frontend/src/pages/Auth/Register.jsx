import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import BaseButton from '../../components/Button/BaseButton'
import btnStyles from '../../components/Button/BaseButton.module.css'

export default function Register() {
  const navigate = useNavigate()
  const { registerUser, loading, error, clearError } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wallet, setWallet] = useState('')

  useEffect(() => {
    if (clearError) clearError()
  }, [clearError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!username || !email || !password) return
    try {
      await registerUser({ username, email, password, wallet_address: wallet || undefined })
      navigate('/', { replace: true })
    } catch { void 0 }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="username">Usuario</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="wallet">Wallet (opcional)</label>
          <input id="wallet" value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="0x..." style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
        </div>
        {error ? <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{error}</div> : null}
        <BaseButton
          type="submit"
          variant="cta"
          size="md"
          className={btnStyles.fullWidth}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <><span className={btnStyles.btnSpinner} aria-hidden></span>Creando...</> : 'Registrarse'}
        </BaseButton>
      </form>
      <p style={{ marginTop: '1rem' }}>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  )
}
