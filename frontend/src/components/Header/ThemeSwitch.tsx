import { useTheme } from '../../hooks/useTheme'
import styles from './ThemeSwitch.module.css'

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={styles.switch}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span className={`${styles.track} ${isDark ? styles.trackDark : styles.trackLight}`}>
        <span className={`${styles.thumb} ${isDark ? styles.thumbDark : styles.thumbLight}`}>
          {isDark ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </span>
    </button>
  )
}
