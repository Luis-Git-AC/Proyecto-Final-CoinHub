import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './Tooltip.module.css'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  style?: React.CSSProperties
}

interface Coords {
  top: number
  left: number
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className,
  style,
}: TooltipProps) {
  const [coords, setCoords] = useState<Coords | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  const show = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let top: number
    let left: number
    if (position === 'top') {
      top = r.top
      left = r.left + r.width / 2
    } else if (position === 'bottom') {
      top = r.bottom
      left = r.left + r.width / 2
    } else if (position === 'left') {
      top = r.top + r.height / 2
      left = r.left
    } else {
      top = r.top + r.height / 2
      left = r.right
    }
    setCoords({ top, left })
  }, [position])

  const hide = useCallback(() => setCoords(null), [])

  return (
    <span
      ref={wrapperRef}
      className={`${styles.wrapper} ${className ?? ''}`}
      style={style}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={hide}
    >
      {children}
      {coords !== null &&
        createPortal(
          <span
            className={`${styles.bubble} ${styles[position] ?? ''}`}
            style={{ top: coords.top, left: coords.left }}
            role="tooltip"
            aria-hidden
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  )
}
