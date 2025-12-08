import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PortfolioContext from './PortfolioContext'
import { useAuth } from './useAuth'
import { getPortfolio, putPortfolio } from '../services/portfolio'

const STORAGE_KEY = 'portfolio_v1'

function storageKeyFor(userId) {
  if (!userId) return STORAGE_KEY
  return `portfolio_${userId}_v1`
}

function readStorage(userId) {
  try {
    const key = storageKeyFor(userId)
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.warn('No se pudo leer el portfolio desde localStorage:', err)
    return []
  }
}

function writeStorage(portfolio, userId) {
  try {
    const key = storageKeyFor(userId)
    localStorage.setItem(key, JSON.stringify(portfolio))
  } catch (err) {
    console.warn('No se pudo guardar el portfolio en localStorage:', err)
  }
}

function sanitizeCoin(coin) {
  const {
    id,
    symbol,
    name,
    image,
    currentPrice,
    marketCap,
    marketCapRank,
    priceChangePercentage24h,
    totalVolume,
    cantidad
  } = coin

  return {
    id,
    symbol,
    name,
    image,
    currentPrice,
    marketCap,
    marketCapRank,
    priceChangePercentage24h,
    totalVolume,
    cantidad: cantidad || 1,
    addedAt: Date.now(),
    metadata: {
      coinGeckoId: id
    }
  }
}

function PortfolioProvider({ children }) {
  const { user, token } = useAuth()
  const [portfolio, setPortfolio] = useState([])
  const syncTimer = useRef(null)
  const lastSynced = useRef(0)

  useEffect(() => {
    writeStorage(portfolio, user && user._id)
  }, [portfolio, user])

  useEffect(() => {
    if (!user) {

      setPortfolio([])
      return
    }
    const local = readStorage(user._id)
    if (Array.isArray(local) && local.length) setPortfolio(local)
  }, [user])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!token) return
      try {
        const res = await getPortfolio(token)
        if (!mounted) return
        const items = Array.isArray(res?.items) ? res.items : []
        const mapped = items.map((item) => ({
          id: item.metadata?.coinGeckoId || item.symbol,
          symbol: item.symbol,
          name: item.name || item.metadata?.name || item.symbol,
          image: item.image || item.metadata?.image || '',
          currentPrice: item.avgPrice || item.metadata?.currentPrice || 0,
          marketCap: item.metadata?.marketCap || null,
          marketCapRank: item.metadata?.marketCapRank || null,
          priceChangePercentage24h: item.metadata?.priceChangePercentage24h || null,
          totalVolume: item.metadata?.totalVolume || null,
          cantidad: item.amount || 0,
          addedAt: Date.now(),
          metadata: item.metadata || {}
        }))
        setPortfolio(mapped)
      } catch (err) {

        console.warn('No se pudo cargar portfolio desde servidor:', err.message || err)
      }
    }
    load()
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (!token) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(async () => {
      try {

        const payload = portfolio.map((item) => ({
          symbol: (item.symbol || item.id || '').toString().toUpperCase(),
          amount: Number(item.cantidad || item.amount || 0),
          avgPrice: Number(item.currentPrice || item.avgPrice || 0),
          notes: item.notes || undefined,
          metadata: {
            name: item.name,
            image: item.image,
            currentPrice: item.currentPrice,
            marketCap: item.marketCap,
            marketCapRank: item.marketCapRank,
            priceChangePercentage24h: item.priceChangePercentage24h,
            totalVolume: item.totalVolume,
            ...(item.metadata || {}),
            coinGeckoId: (item.metadata && item.metadata.coinGeckoId) || item.id || undefined
          }
        }))
        await putPortfolio(token, payload)
        lastSynced.current = Date.now()
      } catch (err) {
        console.warn('Error sincronizando portfolio al servidor:', err.message || err)
      }
    }, 1000)
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [portfolio, token])

  const isInPortfolio = useCallback(
    (coinId, coin) => {
      return portfolio.some((item) => {
        if (item.id && item.id === coinId) return true
        if (coin && item.symbol && coin.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true
        if (item.metadata && item.metadata.coinGeckoId && item.metadata.coinGeckoId === coinId) return true
        return false
      })
    },
    [portfolio]
  )

  const addCoin = useCallback((coin) => {
    setPortfolio((prev) => {
      const exists = prev.some((item) => {
        if (item.id && item.id === coin.id) return true
        if (item.symbol && coin.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true
        if (item.metadata && item.metadata.coinGeckoId && item.metadata.coinGeckoId === coin.id) return true
        return false
      })
      if (exists) return prev
      return [...prev, sanitizeCoin(coin)]
    })
  }, [])

  const removeCoin = useCallback((coinId) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== coinId))
  }, [])

  const toggleCoin = useCallback(
    (coin) => {
      setPortfolio((prev) => {
        const exists = prev.some((item) => {
          if (item.id && item.id === coin.id) return true
          if (item.symbol && coin.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return true
          if (item.metadata && item.metadata.coinGeckoId && item.metadata.coinGeckoId === coin.id) return true
          return false
        })
        if (exists) {
          return prev.filter((item) => {
            if (item.id && item.id === coin.id) return false
            if (item.metadata && item.metadata.coinGeckoId && item.metadata.coinGeckoId === coin.id) return false
            if (item.symbol && coin.symbol && item.symbol.toLowerCase() === coin.symbol.toLowerCase()) return false
            return true
          })
        }
        return [...prev, sanitizeCoin(coin)]
      })
    },
    []
  )

  const clearPortfolio = useCallback(() => {
    setPortfolio([])
  }, [])

  const updateCoinQuantity = useCallback((coinId, newQuantity) => {
    setPortfolio((prev) =>
      prev.map((coin) => {
        if (coin.id === coinId) {
          const parsedValue = parseFloat(newQuantity)
          const cantidad = isNaN(parsedValue) ? 0 : Math.max(0, parsedValue)
          return { ...coin, cantidad }
        }
        return coin
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      portfolio,
      addCoin,
      removeCoin,
      toggleCoin,
      clearPortfolio,
      updateCoinQuantity,
      isInPortfolio
    }),
    [portfolio, addCoin, removeCoin, toggleCoin, clearPortfolio, updateCoinQuantity, isInPortfolio]
  )

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

export default PortfolioProvider
