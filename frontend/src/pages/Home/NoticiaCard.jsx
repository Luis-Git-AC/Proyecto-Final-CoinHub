import styles from './NoticiaCard.module.css'

function NoticiaCard({ noticia }) {
  const {
    titulo,
    fecha,
    moneda
  } = noticia

  const formatearFecha = (fecha) => {
    const date = new Date(fecha)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
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
