import { useMemo } from 'react'
import styles from './BackgroundMeteors.module.css'

interface Meteor {
  id: number
  top: string
  left: string
  width: number
  delay: string
  duration: string
}

function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

interface BackgroundMeteorsProps {
  count?: number
}

export default function BackgroundMeteors({ count = 20 }: BackgroundMeteorsProps) {
  const meteors = useMemo<Meteor[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${seeded(i * 7 + 1) * 80}%`,
        left: `${10 + seeded(i * 13 + 3) * 90}%`,
        width: 80 + Math.floor(seeded(i * 3 + 9) * 140),
        delay: `${(seeded(i * 5 + 2) * 10).toFixed(2)}s`,
        duration: `${(4 + seeded(i * 11 + 4) * 7).toFixed(2)}s`,
      })),
    [count],
  )

  return (
    <div className={styles.root} aria-hidden="true">
      {meteors.map((m) => (
        <span
          key={m.id}
          className={styles.meteor}
          style={{
            top: m.top,
            left: m.left,
            width: `${m.width}px`,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </div>
  )
}
