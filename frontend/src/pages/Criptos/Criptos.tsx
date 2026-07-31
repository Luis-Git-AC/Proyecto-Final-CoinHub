import { useMemo, useState } from 'react'
import useCriptos from '../../hooks/useCriptos'
import CoinCard from '../../components/CoinCard/CoinCard'
import CoinCardSkeleton from '../../components/CoinCard/CoinCardSkeleton'
import usePortfolio from '../../hooks/usePortfolio'
import { SearchForm } from '../../components/SearchForm/SearchForm'
import StaggerChars from '../../components/ui/StaggerChars/StaggerChars'
import AnimatedTabs from '../../components/ui/AnimatedTabs/AnimatedTabs'
import styles from './Criptos.module.css'
import BaseButton from '../../components/Button/BaseButton'

type SortKey = 'marketcap' | 'best24h' | 'worst24h'

const SORT_TABS: { value: SortKey; label: string }[] = [
  { value: 'marketcap', label: 'Market Cap' },
  { value: 'best24h', label: '↑ Mejor 24h' },
  { value: 'worst24h', label: '↓ Peor 24h' },
]

function Criptos() {
  const { filteredCoins, loading, error, query, setQuery, refresh, lastUpdated } = useCriptos()
  const { toggleCoin, isInPortfolio } = usePortfolio()
  const [sort, setSort] = useState<SortKey>('marketcap')

  const sortedCoins = useMemo(() => {
    if (sort === 'marketcap') return filteredCoins
    return [...filteredCoins].sort((a, b) => {
      const aChange = a.priceChangePercentage24h ?? 0
      const bChange = b.priceChangePercentage24h ?? 0
      return sort === 'best24h' ? bChange - aChange : aChange - bChange
    })
  }, [filteredCoins, sort])

  const handleRefresh = () => {
    if (!loading) refresh()
  }

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={styles.container}>
      <section className={styles.cryptoHeader}>
        <div>
          <StaggerChars text="Top 100 Coins" as="h1" />
          <p>Actualización de precios cada 1 min - CoinGecko</p>
        </div>
        <div className={styles.cryptoActions}>
          <SearchForm onSearch={setQuery} placeholder="Buscar..." label="Buscar criptomoneda" defaultValue={query} />
        </div>
      </section>

      <div className={styles.cryptoSort}>
        <AnimatedTabs tabs={SORT_TABS} active={sort} onChange={setSort} />
      </div>

      {lastUpdatedLabel && (
        <div className={styles.cryptoLastUpdated}>
          <span>Última actualización: <strong>{lastUpdatedLabel}</strong></span>
          <BaseButton type="button" className={styles.btnRefresh} variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </BaseButton>
        </div>
      )}

      {error && (
        <div className={styles.cryptoError} role="alert">
          <p>{error}</p>
          <BaseButton type="button" variant="primary" size="sm" onClick={handleRefresh} disabled={loading}>Reintentar</BaseButton>
        </div>
      )}

      {loading && !filteredCoins.length ? (
        <div className={styles.cryptoGrid} role="list" aria-label="Cargando criptomonedas">
          {Array.from({ length: 12 }).map((_, i) => <CoinCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className={styles.cryptoGrid} role="list">
          {sortedCoins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              isInPortfolio={isInPortfolio(coin.id)}
              onTogglePortfolio={toggleCoin}
            />
          ))}
        </div>
      )}

      {!loading && !error && filteredCoins.length === 0 && (
        <p className={styles.cryptoEmpty}>No se encontraron criptomonedas para tu búsqueda.</p>
      )}
    </div>
  )
}

export default Criptos
