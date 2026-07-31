import { useRef, useState } from 'react'
import styles from './SpotlightCard.module.css'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  /** Tag to render as (default: div) */
  as?: React.ElementType
  spotlightColor?: string
}

export default function SpotlightCard({
  children,
  className,
  as: Tag = 'div',
  spotlightColor = 'rgba(79, 142, 247, 0.13)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseLeave = () => setPos(null)

  const spotlightStyle: React.CSSProperties = pos
    ? {
        background: `radial-gradient(350px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
      }
    : {}

  return (
    <Tag
      ref={ref}
      className={`${styles.card} ${className ?? ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className={styles.spotlight} style={spotlightStyle} aria-hidden />
      {children}
    </Tag>
  )
}
