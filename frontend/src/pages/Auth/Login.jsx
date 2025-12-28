import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import BaseButton from '../../components/Button/BaseButton'
import btnStyles from '../../components/Button/BaseButton.module.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (clearError) clearError()
  }, [clearError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) return
    try {
      await loginUser({ email, password })
      const from = location.state && location.state.from ? location.state.from.pathname : '/'
      navigate(from, { replace: true })
  } catch { void 0 }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required style={{ width: '100%', padding: '0.5rem 0.75rem', height: '40px', fontSize: '16px' }} />
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
          {loading ? <><span className={btnStyles.btnSpinner} aria-hidden></span>Entrando...</> : 'Entrar'}
        </BaseButton>
      </form>
      <p style={{ marginTop: '1rem' }}>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </div>
  )
}
