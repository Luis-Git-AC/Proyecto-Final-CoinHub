import styles from './NoticiaCard.module.css'
import type { NewsItem } from '../../services/news'

interface NoticiaCardProps {
  noticia: NewsItem
}

function NoticiaCard({ noticia }: NoticiaCardProps) {
  const { titulo, fecha, moneda } = noticia

  const formatearFecha = (fechaStr: string): string => {
    const date = new Date(fechaStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <article className={styles.card}>
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cardLink}
        onClick={() => {
          console.log('Noticia click', { id: noticia.id, url: noticia.url, titulo })
        }}
      >
        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <span className={styles.monedaTag}>{moneda}</span>
            <span className={styles.fecha}>{formatearFecha(fecha)}</span>
          </div>
          <h3 className={styles.titulo}>{titulo}</h3>
        </div>
      </a>
    </article>
  )
}

export default NoticiaCard
