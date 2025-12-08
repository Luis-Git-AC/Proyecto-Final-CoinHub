import { useState, useEffect, useCallback } from 'react'
import { fetchCryptoPanicNews } from '../services/cryptoPanic'

const CACHE_KEY = 'cryptopanic_news_cache_v1'
const MIN_INTERVAL_MS = 60 * 60 * 1000
const CACHE_TTL_MS = MIN_INTERVAL_MS

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !parsed?.data) return null
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS
    return isExpired ? null : parsed
  } catch (err) {
    console.warn('No se pudo leer la cache de noticias:', err)
    return null
  }
}

function writeCache(data) {
  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() })
    sessionStorage.setItem(CACHE_KEY, payload)
  } catch (err) {
    console.warn('No se pudo guardar la cache de noticias:', err)
  }
}

function useNoticias() {
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroMoneda, setFiltroMoneda] = useState('todas')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [nextUpdate, setNextUpdate] = useState(null)

  const loadNews = useCallback(async ({ ignoreCache = false, force = false, signal } = {}) => {
    const cached = !ignoreCache ? readCache() : null

    if (cached) {
      setNoticias(cached.data)
      setLastUpdated(cached.timestamp)
      setNextUpdate(cached.timestamp + MIN_INTERVAL_MS)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!force && lastUpdated && (Date.now() - lastUpdated) < MIN_INTERVAL_MS) {
        const cachedRecent = readCache()
        if (cachedRecent) {
          setNoticias(cachedRecent.data)
          setLastUpdated(cachedRecent.timestamp)
          setNextUpdate(cachedRecent.timestamp + MIN_INTERVAL_MS)
          return
        }
      }

      const data = await fetchCryptoPanicNews({ signal })
      setNoticias(data)
      const timestamp = Date.now()
      setLastUpdated(timestamp)
      setNextUpdate(timestamp + MIN_INTERVAL_MS)
      writeCache(data)
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Error al obtener noticias:', err)
      setError(err.message ?? 'Error al obtener noticias')
    } finally {
      setLoading(false)
    }

  }, [lastUpdated])

  useEffect(() => {
    const controller = new AbortController()
    loadNews({ signal: controller.signal })
    return () => controller.abort()
  }, [loadNews])

  const refresh = useCallback(() => {
    loadNews({ ignoreCache: true, force: true })
  }, [loadNews])

  const noticiasFiltradas = noticias.filter(noticia => {
    if (filtroMoneda === 'todas') return true
    return noticia.moneda.toLowerCase() === filtroMoneda.toLowerCase()
  })

  const obtenerNoticiaPorId = (id) => {
    return noticias.find(noticia => noticia.id === parseInt(id))
  }

  const cambiarFiltroMoneda = (nuevaMoneda) => {
    setFiltroMoneda(nuevaMoneda)
  }

  const monedasDisponibles = [...new Set(noticias.map(noticia => noticia.moneda))]

  return {
    noticias: noticiasFiltradas,
    loading,
    error,
    filtroMoneda,
    obtenerNoticiaPorId,
    cambiarFiltroMoneda,
    monedasDisponibles,
    totalNoticias: noticias.length,
    refresh,
    lastUpdated,
    nextUpdate,
    minIntervalMs: MIN_INTERVAL_MS
  }
}

export default useNoticias