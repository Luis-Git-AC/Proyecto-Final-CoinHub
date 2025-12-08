import { useState, useRef } from 'react'
import styles from './SearchForm.module.css'
import BaseButton from '../Button/BaseButton'

export function SearchForm({ 
  onSearch, 
  placeholder = 'Buscar...', 
  defaultValue = '',
  label = 'Buscar'
}) {
  const [query, setQuery] = useState(defaultValue)
  const inputRef = useRef(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(query.trim())
  }

  const handleChange = (event) => {
    const value = event.target.value
    setQuery(value)
    onSearch(value.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <div className={styles.wrapper}>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.input}
        />
        {query && (
          <BaseButton type="button" variant="ghost" size="sm" onClick={handleClear} className={styles.clear} aria-label="Limpiar búsqueda">✕</BaseButton>
        )}
        <BaseButton type="submit" variant="ghost" size="sm" className={styles.submit} aria-label="Buscar">🔍</BaseButton>
      </div>
    </form>
  )
}
