import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import BaseButton from '../../components/Button/BaseButton'
import btnStyles from '../../components/Button/BaseButton.module.css'
import TypeAnimation from '../../components/ui/TypeAnimation/TypeAnimation'
import BackgroundMeteors from '../../components/ui/BackgroundMeteors/BackgroundMeteors'
import PasswordInput from '../../components/PasswordInput/PasswordInput'
import authStyles from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (clearError) clearError()
  }, [clearError])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) return
    try {
      await loginUser({ email, password })
      const from = location.state && (location.state as { from?: { pathname?: string } }).from?.pathname
      navigate(from ?? '/', { replace: true })
    } catch { void 0 }
  }

  return (
    <div className={authStyles.page}>
      <BackgroundMeteors />
      <div className={authStyles.card}>
      <h2>Iniciar sesión</h2>
      <TypeAnimation
        sequences={[
          'Consulta el mercado en tiempo real.',
          'Gestiona tu portfolio.',
          'Comparte análisis con la comunidad.',
        ]}
        speed={50}
        deletionSpeed={30}
        repeat
        className={authStyles.tagline}
      />
      <form onSubmit={handleSubmit}>
        <div className={authStyles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={authStyles.input} />
        </div>
        <div className={authStyles.field}>
          <label htmlFor="password">Contraseña</label>
          <PasswordInput id="password" value={password} onChange={setPassword} required />
        </div>
        {error ? <div className={authStyles.error}>{error}</div> : null}
        <BaseButton type="submit" variant="cta" size="md" className={btnStyles.fullWidth} disabled={loading} aria-busy={loading}>
          {loading ? <><span className={btnStyles.btnSpinner} aria-hidden></span>Entrando...</> : 'Entrar'}
        </BaseButton>
      </form>
      <p className={authStyles.footer}>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </div>
    </div>
  )
}
