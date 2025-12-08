import { memo, useState, useEffect, useRef } from 'react'
import styles from './CoinCard.module.css'
import BaseButton from '../Button/BaseButton'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value)
}

function formatCompactCurrency(value) {
  if (value == null) return 'N/A'
  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD'
    }).format(value)
  } catch {
    return formatCurrency(value)
  }
}

function formatPercentage(value) {
  if (value == null) return 'N/A'
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2
  })
  return formatter.format(value / 100)
}

function CoinCard({ coin, isInPortfolio = false, onTogglePortfolio, onUpdateQuantity }) {
  const priceChange = coin.priceChangePercentage24h
  const isPositive = typeof priceChange === 'number' && priceChange >= 0
  const prevPriceRef = useRef(coin.currentPrice)
  const [priceTrend, setPriceTrend] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(coin.cantidad ?? 1)

  useEffect(() => {
    setLocalQuantity(coin.cantidad ?? 1)
  }, [coin.cantidad])

  useEffect(() => {
    const prevPrice = prevPriceRef.current
    const currentPrice = coin.currentPrice

    if (prevPrice && currentPrice !== prevPrice) {
      const newTrend = currentPrice > prevPrice ? 'up' : 'down'
      setPriceTrend(newTrend)
      setIsAnimating(true)
      
      const timer = setTimeout(() => setIsAnimating(false), 800)
      prevPriceRef.current = currentPrice
      return () => clearTimeout(timer)
    }
  }, [coin.currentPrice])

  const handleToggle = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (onTogglePortfolio) {
      onTogglePortfolio(coin)
    }
  }

  const handleQuantityChange = (event) => {
    const value = event.target.value
    setLocalQuantity(value)
    
    if (onUpdateQuantity) {
      onUpdateQuantity(value)
    }
  }

  const parsedQuantity = parseFloat(localQuantity)
  const cantidad = isNaN(parsedQuantity) ? 0 : parsedQuantity
  const subtotal = coin.currentPrice * cantidad

  return (
    <article className={styles.card} aria-label={`Información de ${coin.name}`}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.rank}>#{coin.marketCapRank}</span>
          <img
            className={styles.image}
            src={coin.image}
            alt={coin.name}
            title={coin.name}
            loading="lazy"
            width="40"
            height="40"
          />
          <div>
            <h3
              className={styles.name}
              title={coin.name}
              aria-label={`${coin.name} (${coin.symbol.toUpperCase()})`}
            >
              {coin.symbol.toUpperCase()}
            </h3>
          </div>
        </div>
        <BaseButton
          type="button"
          className={`${styles.favorite} ${isInPortfolio ? styles.favoriteActive : ''}`}
          onClick={handleToggle}
          aria-pressed={isInPortfolio}
          variant="like"
          size="sm"
        >
          {isInPortfolio ? '★' : '☆'}
        </BaseButton>
      </header>

      {isInPortfolio && onUpdateQuantity && (
        <div className={styles.quantitySection}>
          <label htmlFor={`quantity-${coin.id}`} className={styles.quantityLabel}>
            Cantidad:
          </label>
          <input
            id={`quantity-${coin.id}`}
            type="number"
            min="0"
            step="0.00000001"
            value={localQuantity}
            onChange={handleQuantityChange}
            onFocus={(e) => e.target.select()}
            className={styles.quantityInput}
            aria-label={`Cantidad de ${coin.symbol.toUpperCase()}`}
          />
        </div>
      )}

      <section className={styles.body}>
        <div 
          className={`${styles.price} ${priceTrend === 'up' ? styles.priceUp : ''} ${priceTrend === 'down' ? styles.priceDown : ''} ${isAnimating ? styles.animating : ''}`}
          aria-label="Precio actual"
        >
          {formatCurrency(coin.currentPrice)}
        </div>
        <div className={`${styles.change} ${isPositive ? styles.changePositive : styles.changeNegative}`} aria-label="Variación 24 horas">
          {formatPercentage(priceChange)}
        </div>
        {isInPortfolio && onUpdateQuantity && (
          <div className={styles.subtotal}>
            <span className={styles.label}>Subtotal:</span>
            <span className={styles.subtotalValue}>{formatCurrency(subtotal)}</span>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <div>
          <span className={styles.label}>Market Cap</span>
          <span
            className={styles.value}
            title={formatCurrency(coin.marketCap)}
            aria-label={formatCurrency(coin.marketCap)}
          >
            {formatCompactCurrency(coin.marketCap)}
          </span>
        </div>
        <div>
          <span className={styles.label}>Volumen 24h</span>
          <span
            className={styles.value}
            title={formatCurrency(coin.totalVolume)}
            aria-label={formatCurrency(coin.totalVolume)}
          >
            {formatCompactCurrency(coin.totalVolume)}
          </span>
        </div>
      </footer>
    </article>
  )
}

export default memo(CoinCard)
