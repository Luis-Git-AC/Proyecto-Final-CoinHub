import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import BaseButton from '../../components/Button/BaseButton'
import btnStyles from '../../components/Button/BaseButton.module.css'
import TypeAnimation from '../../components/ui/TypeAnimation/TypeAnimation'
import BackgroundMeteors from '../../components/ui/BackgroundMeteors/BackgroundMeteors'
import PasswordInput from '../../components/PasswordInput/PasswordInput'
import authStyles from './Auth.module.css'

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username || !email || !password) return
    try {
      await registerUser({ username, email, password, wallet_address: wallet || undefined })
      navigate('/', { replace: true })
    } catch { void 0 }
  }

  return (
    <div className={authStyles.page}>
      <BackgroundMeteors />
      <div className={authStyles.card}>
      <h2>Crear cuenta</h2>
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
          <label htmlFor="username">Usuario</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required className={authStyles.input} />
        </div>
        <div className={authStyles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={authStyles.input} />
        </div>
        <div className={authStyles.field}>
          <label htmlFor="password">Contraseña</label>
          <PasswordInput id="password" value={password} onChange={setPassword} required />
        </div>
        <div className={authStyles.field}>
          <label htmlFor="wallet">Wallet (opcional)</label>
          <input id="wallet" value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="0x..." className={authStyles.input} />
        </div>
        {error ? <div className={authStyles.error}>{error}</div> : null}
        <BaseButton type="submit" variant="cta" size="md" className={btnStyles.fullWidth} disabled={loading} aria-busy={loading}>
          {loading ? <><span className={btnStyles.btnSpinner} aria-hidden></span>Creando...</> : 'Registrarse'}
        </BaseButton>
      </form>
      <p className={authStyles.footer}>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  )
}
