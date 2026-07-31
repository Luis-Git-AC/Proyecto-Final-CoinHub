import { useEffect, useState, Suspense, lazy, useCallback } from 'react'
import { getResources } from '../../services/resources'
import { API_URL } from '../../services/api'
import { Link } from 'react-router-dom'
import useToast from '../../components/Toasts/useToast'
import BaseButton from '../../components/Button/BaseButton'
import ResourceCardSkeleton from './ResourceCardSkeleton'
import StaggerChars from '../../components/ui/StaggerChars/StaggerChars'
import Pagination from '../../components/ui/Pagination/Pagination'
import styles from './Resources.module.css'
import type { Resource } from '../../types/resource'

const TradingViewWidget = lazy(() => import('../../components/TradingViewWidget/TradingViewWidget'))

export default function ResourcesList() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const toast = useToast()
  const [showChart, setShowChart] = useState(true)
  const [symbol] = useState('BINANCE:BTCUSD')

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await getResources({ page: p, limit: 12 })
      setResources(res.resources || [])
      setPage(res.pagination?.page ?? p)
      setTotalPages(res.pagination?.pages ?? 1)
    } catch (err) {
      console.error(err)
      toast.error('Error cargando recursos')
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  return (
    <div className={`${styles.root} ${styles.containerMax}`}>
      <div className={styles.headerBar}>
        <StaggerChars text="Recursos" as="h2" />
        <div className={styles.headerActions}>
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setShowChart(v => !v)}
            title={showChart ? 'Ocultar gráfico' : 'Mostrar gráfico'}
            aria-pressed={showChart}
            iconOnly
            startIcon={showChart ? (
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
                <circle cx="12" cy="12" r="2.5"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3l18 18-1.5 1.5L15.5 17A11.9 11.9 0 0112 19c-7 0-11-7-11-7 1.2-2.1 3-3.9 5.1-5.1L4.5 4.5 3 3zM9.5 6.5l1.6 1.6A5 5 0 0117.5 12c0 .8-.2 1.6-.5 2.3l1.5 1.5C20 15.3 22 12 22 12s-4-7-10-7c-1.2 0-2.3.2-3.5.5L9.5 6.5z"/>
              </svg>
            )}
          />
          <BaseButton
            as="link"
            to="/resources/new"
            variant="cta"
            size="sm"
            iconOnly
            aria-label="Subir recurso"
            title="Subir recurso"
            startIcon={
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M19 15v4a1 1 0 01-1 1H6a1 1 0 01-1-1v-4" />
                <path d="M12 3v12" />
                <path d="M8 7l4-4 4 4" />
              </svg>
            }
          />
        </div>
      </div>

      {loading && <div>Cargando...</div>}

      <div className={styles.grid}>
        {showChart && (
          <div className={styles.chartBox}>
            <Suspense fallback={<div>Cargando widget...</div>}>
              <TradingViewWidget symbol={symbol} theme="dark" />
            </Suspense>
          </div>
        )}
        {loading && resources.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <ResourceCardSkeleton key={i} />)
          : resources.map(resource => (
            <article key={resource._id} className={styles.card}>
              <h3><Link to={`/resources/${resource._id}`}>{resource.title}</Link></h3>
              <div className={styles.meta}>{resource.type} • {resource.category}</div>
              <p className={styles.desc}>{resource.description}</p>
              <div className={styles.links}>
                <a href={`${API_URL}/resources/${resource._id}/open`} target="_blank" rel="noopener noreferrer" className={styles.link}>Abrir</a>
                <a href={`${API_URL}/resources/${resource._id}/download`} className={styles.link}>Descargar</a>
              </div>
            </article>
          ))
        }
        {!loading && resources.length === 0 && <div>No hay recursos</div>}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => load(p)} />
    </div>
  )
}
