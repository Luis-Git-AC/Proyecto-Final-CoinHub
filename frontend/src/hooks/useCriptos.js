import { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchTopCoins } from '../services/coinGecko'

const CACHE_KEY = 'coingecko_top100_cache_v1'
const CACHE_TTL_MS = 10 * 60 * 1000 

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !parsed?.data) return null
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS
    return isExpired ? null : parsed
  } catch (err) {
    console.warn('No se pudo leer la cache de CoinGecko:', err)
    return null
  }
}

function writeCache(data) {
  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() })
    sessionStorage.setItem(CACHE_KEY, payload)
  } catch (err) {
    console.warn('No se pudo guardar la cache de CoinGecko:', err)
  }
}

function useCriptos() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadCoins = useCallback(async ({ ignoreCache = false } = {}) => {
    const cached = !ignoreCache ? readCache() : null

    if (cached) {
      setCoins(cached.data)
      setLastUpdated(cached.timestamp)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const data = await fetchTopCoins({ signal: controller.signal })

      const enriched = data.map(coin => ({ ...coin, tvCandidates: [] }))
      setCoins(enriched)
      writeCache(enriched)
      const timestamp = Date.now()
      setLastUpdated(timestamp)
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Error al obtener criptos:', err)
      setError(err.message ?? 'Error al obtener criptomonedas')
    } finally {
      setLoading(false)
    }

    return () => controller.abort()
  }, [])

  useEffect(() => {
    loadCoins()

    let interval

    const startPolling = () => {
      interval = setInterval(() => {
        loadCoins({ ignoreCache: true })
      }, 60000)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval)
      } else {
        loadCoins({ ignoreCache: true })
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadCoins])

  const refresh = useCallback(() => {
    loadCoins({ ignoreCache: true })
  }, [loadCoins])

  const filteredCoins = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return coins

    return coins.filter((coin) => {
      return (
        coin.name.toLowerCase().includes(normalizedQuery) ||
        coin.symbol.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [coins, query])

  return {
    coins,
    filteredCoins,
    loading,
    error,
    query,
    setQuery,
    refresh,
    lastUpdated
  }
}

export default useCriptos
