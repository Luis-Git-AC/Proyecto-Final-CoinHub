import { useEffect, useRef, useState } from 'react'
import styles from './AnimatedTabs.module.css'

export interface Tab<T extends string = string> {
  value: T
  label: string
}

interface AnimatedTabsProps<T extends string = string> {
  tabs: Tab<T>[]
  active: T
  onChange: (value: T) => void
  className?: string
}

export default function AnimatedTabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className,
}: AnimatedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.value === active)
    const container = containerRef.current
    const btn = tabRefs.current[activeIndex]
    if (!container || !btn) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    setIndicator({ left: bRect.left - cRect.left, width: bRect.width })
  }, [active, tabs])

  return (
    <div
      ref={containerRef}
      className={`${styles.tabs} ${className ?? ''}`}
      role="tablist"
    >
      <span
        className={styles.indicator}
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden
      />
      {tabs.map((tab, i) => (
        <button
          key={tab.value}
          ref={(el) => { tabRefs.current[i] = el }}
          role="tab"
          aria-selected={tab.value === active}
          className={`${styles.tab} ${tab.value === active ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
