import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import MobileDrawer from './MobileDrawer'
import stylesMobile from './MobileDrawer.module.css'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import BaseButton from '../Button/BaseButton'
import useConfirm from '../Confirm/useConfirm'
import Logo from './Logo'

function Header() {
  const location = useLocation()

  const { isAuthenticated, user, logoutUser } = useAuth()
  const confirm = useConfirm()
  const linkClass = (path) => location.pathname === path ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
  const handleLogout = async () => {
    const confirmed = await confirm('Cerrar sesión?')
    if (confirmed) logoutUser()
  }
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const toggleDrawer = () => setDrawerOpen(v => !v)
  const closeDrawer = () => setDrawerOpen(false)
  const handleNavClick = (event, path, opts = {}) => {
    const { close = false } = opts
    if (location.pathname === path) {
      event.preventDefault()
      if (close) closeDrawer()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      if (close) closeDrawer()
    }
  }

  return (
    <header className={`${styles.header} ${!isVisible ? styles.hidden : ''}`}>
      <Logo />
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <h1>CoinHub</h1>
          </Link>
        </div>
        
        <div className={styles.mobileControls}>
          <BaseButton variant="ghost" size="md" onClick={toggleDrawer} aria-expanded={drawerOpen} aria-controls="mobile-drawer" aria-label="Abrir menú">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
            </svg>
          </BaseButton>
        </div>

        <nav className={styles.navigation}>
          <Link to="/" onClick={(event) => handleNavClick(event, '/')} className={linkClass('/')}>Home</Link>
          <Link to="/posts" onClick={(event) => handleNavClick(event, '/posts')} className={linkClass('/posts')}>Foro</Link>
          <Link to="/resources" onClick={(event) => handleNavClick(event, '/resources')} className={linkClass('/resources')}>Recursos</Link>
          <Link to="/criptos" onClick={(event) => handleNavClick(event, '/criptos')} className={linkClass('/criptos')}>Criptos</Link>
          <Link to="/portfolio" onClick={(event) => handleNavClick(event, '/portfolio')} className={linkClass('/portfolio')}>Portfolio</Link>
          {isAuthenticated && <Link to="/perfil" onClick={(event) => handleNavClick(event, '/perfil')} className={linkClass('/perfil')}>Perfil</Link>}
          {isAuthenticated && user && (user.role === 'admin' || user.role === 'owner') && (
            <Link to="/admin/users" onClick={(e) => handleNavClick(e, '/admin/users')} className={linkClass('/admin/users')}>Admin</Link>
          )}
        </nav>
          <div>
            {!isAuthenticated && (
              <div className={styles.authInline}>
                <Link to="/login" className={linkClass('/login')}>Login</Link>
                <Link to="/register" className={linkClass('/register')}>Registro</Link>
              </div>
            )}
            {isAuthenticated && (
              <div className={styles.authUser}>
                {user && user.avatar && <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />}
                <span>{user ? user.username : ''}</span>
                <BaseButton variant="danger" size="sm" onClick={handleLogout} iconOnly aria-label="Cerrar sesión" title="Cerrar sesión">
                  <span aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 13v-2H7V8l-5 4 5 4v-3z" />
                      <path d="M20 3H10v2h10v14H10v2h10a1 1 0 001-1V4a1 1 0 00-1-1z" />
                    </svg>
                  </span>
                </BaseButton>
              </div>
            )}
          </div>
        
          <MobileDrawer open={drawerOpen} onClose={closeDrawer}>
            {isAuthenticated ? (
              <div className={stylesMobile.userRow}>
                <div className={stylesMobile.userAvatar}>
                  {user && user.avatar ? (
                    <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)' }} />
                  )}
                </div>
                <div>
                  <div className={stylesMobile.userName}>{user ? user.username : 'Usuario'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user ? user.email : ''}</div>
                </div>
              </div>
            ) : null}

            <Link to="/" onClick={(event) => handleNavClick(event, '/', { close: true })} className={linkClass('/')}>{/* Home */}
              <span className={stylesMobile.linkIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 11.5L12 3l9 8.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>
              </span>
              <span>Home</span>
            </Link>

            <Link to="/posts" onClick={(event) => handleNavClick(event, '/posts', { close: true })} className={linkClass('/posts')}>
              <span className={stylesMobile.linkIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v12H5.17L4 17.17V4z"/></svg>
              </span>
              <span>Foro</span>
            </Link>

            <Link to="/resources" onClick={(event) => handleNavClick(event, '/resources', { close: true })} className={linkClass('/resources')}>
              <span className={stylesMobile.linkIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18v2H3zM6 10h12v8H6z"/></svg>
              </span>
              <span>Recursos</span>
            </Link>

            <Link to="/criptos" onClick={(event) => handleNavClick(event, '/criptos', { close: true })} className={linkClass('/criptos')}>
              <span className={stylesMobile.linkIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8"/></svg>
              </span>
              <span>Criptos</span>
            </Link>

            <Link to="/portfolio" onClick={(event) => handleNavClick(event, '/portfolio', { close: true })} className={linkClass('/portfolio')}>
              <span className={stylesMobile.linkIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18v13H3z"/></svg>
              </span>
              <span>Portfolio</span>
            </Link>

            {isAuthenticated && <Link to="/perfil" onClick={(event) => handleNavClick(event, '/perfil', { close: true })} className={linkClass('/perfil')}><span className={stylesMobile.linkIcon} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-5 0-8 2.5-8 4.5V22h16v-3.5c0-2-3-4.5-8-4.5z"/></svg></span><span>Perfil</span></Link>}

            {isAuthenticated && user && (user.role === 'admin' || user.role === 'owner') && (
              <Link to="/admin/users" onClick={(event) => handleNavClick(event, '/admin/users', { close: true })} className={linkClass('/admin/users')}><span className={stylesMobile.linkIcon} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h18v8H3zM3 3h18v8H3z"/></svg></span><span>Admin</span></Link>
            )}

            {!isAuthenticated && <Link to="/login" onClick={(event) => handleNavClick(event, '/login', { close: true })} className={linkClass('/login')}><span className={stylesMobile.linkIcon} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6l4-3-4-3z"/></svg></span><span>Login</span></Link>}

            {!isAuthenticated && <Link to="/register" onClick={(event) => handleNavClick(event, '/register', { close: true })} className={linkClass('/register')}><span className={stylesMobile.linkIcon} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zM4 20c0-3.3 4.4-6 8-6s8 2.7 8 6v2H4v-2z"/></svg></span><span>Registro</span></Link>}

            {isAuthenticated && <button onClick={() => { closeDrawer(); handleLogout(); }} className={styles.logoutBtn}><span className={stylesMobile.linkIcon} aria-hidden><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16 13v-2H7V8l-5 4 5 4v-3z"/></svg></span><span>Cerrar sesión</span></button>}
          </MobileDrawer>
      </div>
    </header>
  )
}

export default Header