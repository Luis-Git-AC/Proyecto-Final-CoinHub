import useCriptos from '../../hooks/useCriptos'
import CoinCard from '../../components/CoinCard/CoinCard'
import usePortfolio from '../../hooks/usePortfolio'
import { SearchForm } from '../../components/SearchForm/SearchForm'
import styles from './Criptos.module.css'
import React from 'react'
import BaseButton from '../../components/Button/BaseButton'

function Criptos() {
  const {
    filteredCoins,
    loading,
    error,
    query,
    setQuery,
    refresh,
    lastUpdated
  } = useCriptos()
  const { toggleCoin, isInPortfolio } = usePortfolio()

  const handleRefresh = () => {
    if (!loading) {
      refresh()
    }
  }

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  return (
    <div className={styles.container}>
      <section className={styles.cryptoHeader}>
        <div>
          <h1>Top 100 Coins</h1>
          <p>Actualización de precios cada 1 min - CoinGecko</p>
        </div>

        <div className={styles.cryptoActions}>
          <SearchForm
            onSearch={setQuery}
            placeholder="Buscar..."
            label="Buscar criptomoneda"
            defaultValue={query}
          />
        </div>
      </section>

      {lastUpdatedLabel && (
        <div className={styles.cryptoLastUpdated}>
          <span>Última actualización: <strong>{lastUpdatedLabel}</strong></span>
          <BaseButton
            type="button"
            className={styles.btnRefresh}
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
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
        <div className={styles.cryptoLoading}>Cargando datos…</div>
      ) : (
        <div className={styles.cryptoGrid} role="list">
          {filteredCoins.map((coin) => (
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