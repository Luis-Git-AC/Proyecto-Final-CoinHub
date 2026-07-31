import styles from './SearchCell.module.css'

interface SearchCellProps {
  id?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  label?: string
}

export default function SearchCell({
  id = 'search-input',
  inputRef,
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  label = 'Buscar',
}: SearchCellProps) {
  return (
    <div className={styles.cell}>
      <span className={styles.icon} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={onClear}
          aria-label="Limpiar búsqueda"
          tabIndex={0}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}
