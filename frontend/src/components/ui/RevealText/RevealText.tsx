import { useEffect, useRef, useState } from 'react'
import styles from './RevealText.module.css'

interface RevealTextProps {
  text: string
  className?: string
  staggerMs?: number
}

export default function RevealText({ text, className, staggerMs = 80 }: RevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => { observer.disconnect() }
  }, [])

  const words = text.split(' ')

  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className={`${styles.word} ${inView ? styles.visible : ''}`}
          style={inView ? { animationDelay: `${i * staggerMs}ms` } : undefined}
        >
          {word}
          {i < words.length - 1 ? '\u00a0' : ''}
        </span>
      ))}
    </p>
  )
}
