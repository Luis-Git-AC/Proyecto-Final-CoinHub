import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    TradingView?: {
      widget: new (opts: Record<string, unknown>) => { remove?: () => void }
    }
  }
}

interface TradingViewWidgetProps {
  symbol?: string
  interval?: string
  theme?: 'dark' | 'light'
  autosize?: boolean
}

export default function TradingViewWidget({
  symbol = 'BINANCE:BTCUSD',
  interval = 'D',
  theme = 'dark',
  autosize = true,
}: TradingViewWidgetProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<{ remove?: () => void } | null>(null)
  const idRef = useRef<string>(`tv-widget-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    let cancelled = false
    const containerId = idRef.current

    const create = () => {
      if (!rootRef.current || typeof window === 'undefined') return
      const container = document.getElementById(containerId)
      if (container) container.innerHTML = ''

      try {
        if (window.TradingView && window.TradingView.widget) {
          widgetRef.current = new window.TradingView.widget({
            autosize,
            symbol,
            interval,
            timezone: 'Etc/UTC',
            theme: theme === 'dark' ? 'Dark' : 'Light',
            style: '1',
            locale: 'es',
            toolbar_bg: theme === 'dark' ? '#0f1720' : '#ffffff',
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: containerId,
          })
        }
      } catch (err) {
        console.error('TradingView init error', err)
      }
    }

    const ensureScript = () => {
      if (window.TradingView && window.TradingView.widget) {
        create()
        return
      }
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://s3.tradingview.com/tv.js"]')
      if (existing) {
        existing.addEventListener('load', create)
        return
      }
      const scriptEl = document.createElement('script')
      scriptEl.src = 'https://s3.tradingview.com/tv.js'
      scriptEl.async = true
      scriptEl.onload = () => { if (!cancelled) create() }
      scriptEl.onerror = () => { console.error('Error loading TradingView script') }
      document.head.appendChild(scriptEl)
    }

    ensureScript()

    return () => {
      cancelled = true
      if (widgetRef.current && widgetRef.current.remove) {
        try { widgetRef.current.remove() } catch { /* intentional */ }
      }
      const container = document.getElementById(containerId)
      if (container) container.innerHTML = ''
    }
  }, [symbol, interval, theme, autosize])

  return (
    <div ref={rootRef} style={{ width: '100%' }}>
      <div id={idRef.current} style={{ width: '100%', height: 500 }} />
    </div>
  )
}
