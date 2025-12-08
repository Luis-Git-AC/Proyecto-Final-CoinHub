import { useEffect, useRef } from 'react'
import styles from './MobileDrawer.module.css'

export default function MobileDrawer({ open, onClose, children }) {
  const drawerRef = useRef(null)
  const prevActiveRef = useRef(null)

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && drawerRef.current) {

        const focusable = drawerRef.current.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    if (open) {
      prevActiveRef.current = document.activeElement
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'

      setTimeout(() => {
        const firstFocusable = drawerRef.current && drawerRef.current.querySelector('a,button,[tabindex]:not([tabindex="-1"])')
        if (firstFocusable) firstFocusable.focus()
      }, 0)
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      if (prevActiveRef.current && prevActiveRef.current.focus) prevActiveRef.current.focus()
    }
  }, [open, onClose])

  if (!open) {
    return (
      <div aria-hidden className={styles.wrapperHidden} />
    )
  }

  return (
    <div className={styles.wrapper} aria-hidden={!open}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside
        id="mobile-drawer"
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        ref={drawerRef}
      >
        <div className={styles.topRow}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.89 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {children}
        </nav>
      </aside>
    </div>
  )
}
