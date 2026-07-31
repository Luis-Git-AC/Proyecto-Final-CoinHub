import { useEffect, useRef, useState } from 'react'

interface StatsCountProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
  formatter?: (v: number) => string
}

export default function StatsCount({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 800,
  className,
  formatter,
}: StatsCountProps) {
  const [displayed, setDisplayed] = useState(0)
  const containerRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setDisplayed(value)
      return
    }

    let started = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started) {
          started = true
          observer.unobserve(el)

          const startTime = performance.now()

          function step(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayed(eased * value)

            if (progress < 1) {
              rafRef.current = requestAnimationFrame(step)
            } else {
              setDisplayed(value)
            }
          }

          rafRef.current = requestAnimationFrame(step)
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = formatter
    ? formatter(displayed)
    : `${prefix}${displayed.toFixed(decimals)}${suffix}`

  return (
    <span ref={containerRef} className={className}>
      {formatted}
    </span>
  )
}
