import styles from './Pagination.module.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function getPages(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  if (page > 3) pages.push('…')

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (page < totalPages - 2) pages.push('…')

  pages.push(totalPages)
  return pages
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPages(page, totalPages)

  return (
    <nav
      className={`${styles.nav} ${className ?? ''}`}
      aria-label="Paginación"
      role="navigation"
    >
      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
          <path d="M15.41 7.41 10.83 12l4.58 4.59L14 18l-6-6 6-6z" />
        </svg>
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis} aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${styles.btn} ${p === page ? styles.btnActive : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Página ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        className={styles.btn}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
          <path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z" />
        </svg>
      </button>
    </nav>
  )
}
