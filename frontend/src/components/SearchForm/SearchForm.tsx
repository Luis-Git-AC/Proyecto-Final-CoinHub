import { useState, useRef } from 'react'
import styles from './SearchForm.module.css'
import SearchCell from '../ui/SearchCell/SearchCell'

interface SearchFormProps {
  onSearch: (query: string) => void
  placeholder?: string
  defaultValue?: string
  label?: string
}

export function SearchForm({
  onSearch,
  placeholder = 'Buscar...',
  defaultValue = '',
  label = 'Buscar',
}: SearchFormProps) {
  const [query, setQuery] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch(value.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(query.trim()) }}
      className={styles.form}
      role="search"
    >
      <SearchCell
        inputRef={inputRef}
        value={query}
        onChange={handleChange}
        onClear={handleClear}
        placeholder={placeholder}
        label={label}
      />
    </form>
  )
}
