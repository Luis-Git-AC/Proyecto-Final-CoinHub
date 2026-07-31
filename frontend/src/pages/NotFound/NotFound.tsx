import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotFound.module.css'

interface Star {
  id: number
  top: string
  left: string
  size: number
  delay: string
  duration: string
}

function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export default function NotFound() {
  const navigate = useNavigate()

  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        top: `${seeded(i * 3 + 7) * 100}%`,
        left: `${seeded(i * 11 + 2) * 100}%`,
        size: 1 + Math.floor(seeded(i * 5 + 1) * 2.5),
        delay: `${(seeded(i * 7 + 4) * 6).toFixed(2)}s`,
        duration: `${(2 + seeded(i * 13 + 9) * 4).toFixed(2)}s`,
      })),
    [],
  )

  return (
    <div className={styles.page}>
      <div className={styles.stars} aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.id}
            className={styles.star}
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.description}>
          Parece que esta ruta no existe en el universo CoinHub.
        </p>
        <button
          type="button"
          className={styles.btn}
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
