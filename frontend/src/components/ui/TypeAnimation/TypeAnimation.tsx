import { useEffect, useRef, useState } from 'react'
import styles from './TypeAnimation.module.css'

interface TypeAnimationProps {
  sequences: string[]
  speed?: number
  deletionSpeed?: number
  pauseMs?: number
  repeat?: boolean
  className?: string
  style?: React.CSSProperties
}

type Phase = 'typing' | 'pausing' | 'deleting'

export default function TypeAnimation({
  sequences,
  speed = 50,
  deletionSpeed = 30,
  pauseMs = 1500,
  repeat = true,
  className,
  style,
}: TypeAnimationProps) {
  const [seqIndex, setSeqIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [phase, setPhase] = useState<Phase>('typing')

  const current = sequences[seqIndex % sequences.length] ?? ''
  const isLastSeq = seqIndex >= sequences.length - 1

  const prefersReduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReduced.current) {
      setDisplayText(sequences[sequences.length - 1] ?? '')
      return
    }

    let id: ReturnType<typeof setTimeout>

    if (phase === 'typing') {
      if (displayText.length < current.length) {
        id = setTimeout(() => {
          setDisplayText(current.slice(0, displayText.length + 1))
        }, speed)
      } else {
        if (!repeat && isLastSeq) return
        id = setTimeout(() => setPhase('deleting'), pauseMs)
      }
    } else if (phase === 'deleting') {
      if (displayText.length > 0) {
        id = setTimeout(() => {
          setDisplayText((t) => t.slice(0, -1))
        }, deletionSpeed)
      } else {
        setSeqIndex((prev) => prev + 1)
        setPhase('typing')
      }
    }

    return () => clearTimeout(id)
  }, [displayText, phase, current, speed, deletionSpeed, pauseMs, repeat, isLastSeq, sequences])

  return (
    <span className={`${styles.typeAnim} ${className ?? ''}`} style={style} aria-live="polite" aria-label={current}>
      <span aria-hidden>{displayText}</span>
      <span className={styles.cursor} aria-hidden>
        |
      </span>
    </span>
  )
}
