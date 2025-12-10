import { Link } from 'react-router-dom'
import styles from './Logo.module.css'

export default function Logo() {
  return (
    <Link to="/" className={styles.logoLink}>
      <div className={styles.logoContainer}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logoSvg}
      >
        <circle cx="20" cy="20" r="6" fill="#0EA5E9" />
        <circle cx="20" cy="8" r="4" fill="#0EA5E9" opacity="0.8" />
        <line x1="20" y1="12" x2="20" y2="14" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.6" />
        <circle cx="20" cy="32" r="4" fill="#0EA5E9" opacity="0.8" />
        <line x1="20" y1="26" x2="20" y2="28" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.6" />
        <circle cx="8" cy="20" r="4" fill="#0EA5E9" opacity="0.8" />
        <line x1="12" y1="20" x2="14" y2="20" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.6" />
        <circle cx="32" cy="20" r="4" fill="#0EA5E9" opacity="0.8" />
        <line x1="26" y1="20" x2="28" y2="20" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.6" />
        <circle cx="28" cy="12" r="3" fill="#0EA5E9" opacity="0.6" />
        <line x1="23.5" y1="16.5" x2="25.5" y2="14.5" stroke="#0EA5E9" strokeWidth="1" opacity="0.5" />
        <circle cx="12" cy="12" r="3" fill="#0EA5E9" opacity="0.6" />
        <line x1="16.5" y1="16.5" x2="14.5" y2="14.5" stroke="#0EA5E9" strokeWidth="1" opacity="0.5" />
        <circle cx="28" cy="28" r="3" fill="#0EA5E9" opacity="0.6" />
        <line x1="23.5" y1="23.5" x2="25.5" y2="25.5" stroke="#0EA5E9" strokeWidth="1" opacity="0.5" />
        <circle cx="12" cy="28" r="3" fill="#0EA5E9" opacity="0.6" />
        <line x1="16.5" y1="23.5" x2="14.5" y2="25.5" stroke="#0EA5E9" strokeWidth="1" opacity="0.5" />
      </svg>
      </div>
    </Link>
  )
}
