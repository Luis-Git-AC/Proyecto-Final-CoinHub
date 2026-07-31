import { memo, useState, useEffect, useRef } from 'react'
import styles from './CoinCard.module.css'
import BaseButton from '../Button/BaseButton'
import SpotlightCard from '../ui/SpotlightCard/SpotlightCard'
import Tooltip from '../ui/Tooltip/Tooltip'
import type { CoinEnriched } from '../../types/coin'

interface CoinCardProps {
  coin: CoinEnriched
  isInPortfolio?: boolean
  onTogglePortfolio?: (coin: CoinEnriched) => void
  onUpdateQuantity?: (value: string) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value)
}

function formatCompactCurrency(value: number | null | undefined): string {
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

function formatPercentage(value: number | null | undefined): string {
  if (value == null) return 'N/A'
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 2
  })
  return formatter.format(value / 100)
}

function CoinCard({ coin, isInPortfolio = false, onTogglePortfolio, onUpdateQuantity }: CoinCardProps) {
  const priceChange = coin.priceChangePercentage24h
  const isPositive = typeof priceChange === 'number' && priceChange >= 0
  const prevPriceRef = useRef<number>(coin.currentPrice)
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | ''>('')
  const [isAnimating, setIsAnimating] = useState(false)
  const [localQuantity, setLocalQuantity] = useState<string | number>(coin.cantidad ?? 1)

  useEffect(() => {
    setLocalQuantity(coin.cantidad ?? 1)
  }, [coin.cantidad])

  useEffect(() => {
    const prevPrice = prevPriceRef.current
    const currentPrice = coin.currentPrice

    if (prevPrice && currentPrice !== prevPrice) {
      const newTrend: 'up' | 'down' = currentPrice > prevPrice ? 'up' : 'down'
      setPriceTrend(newTrend)
      setIsAnimating(true)

      const timer = setTimeout(() => setIsAnimating(false), 800)
      prevPriceRef.current = currentPrice
      return () => clearTimeout(timer)
    }
  }, [coin.currentPrice])

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (onTogglePortfolio) {
      onTogglePortfolio(coin)
    }
  }

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setLocalQuantity(value)
    if (onUpdateQuantity) {
      onUpdateQuantity(value)
    }
  }

  const parsedQuantity = parseFloat(String(localQuantity))
  const cantidad = isNaN(parsedQuantity) ? 0 : parsedQuantity
  const subtotal = coin.currentPrice * cantidad

  return (
    <SpotlightCard as="article" className={styles.card} aria-label={`Información de ${coin.name}`}>
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
        <Tooltip content={isInPortfolio ? 'Quitar del portfolio' : 'Añadir a portfolio'} position="top">
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
        </Tooltip>
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
          <span className={styles.value}>{formatCompactCurrency(coin.marketCap)}</span>
        </div>
        <div>
          <span className={styles.label}>Vol 24h</span>
          <span className={styles.value}>{formatCompactCurrency(coin.totalVolume)}</span>
        </div>
      </footer>
    </SpotlightCard>
  )
}

export default memo(CoinCard)
