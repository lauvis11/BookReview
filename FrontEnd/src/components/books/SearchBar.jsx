import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { getBooks } from '../../api/books'

const FILTERS = [
  { key: 'title', label: 'Título' },
  { key: 'author', label: 'Autor' },
  { key: 'genre', label: 'Género' },
  { key: 'editorial', label: 'Editorial' },
]

export default function SearchBar({ onSearch, initialQuery = '', initialFilter = 'title' }) {
  const [query, setQuery] = useState(initialQuery)
  const [filterType, setFilterType] = useState(initialFilter)
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return
    }

    let cancelled = false
    const timeoutId = setTimeout(async () => {
      try {
        const res = await getBooks({ [filterType]: trimmed })
        if (!cancelled) {
          setResults(Array.isArray(res.data) ? res.data.slice(0, 4) : [])
          setShowDropdown(true)
        }
      } catch {
        if (!cancelled) setResults([])
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query, filterType])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowDropdown(false)
    if (query.trim()) {
      onSearch({ [filterType]: query.trim() })
    } else {
      onSearch({})
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setShowDropdown(false)
    onSearch({})
  }

  const handleResultClick = (bookId) => {
    setShowDropdown(false)
    navigate(`/books/${bookId}`)
  }

  const activeFilterLabel =
    FILTERS.find((f) => f.key === filterType)?.label.toLowerCase() || 'título'

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Chips de filtrado editorial */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar búsqueda por">
        {FILTERS.map((f) => {
          const isActive = filterType === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilterType(f.key)
                setQuery('')
                setResults([])
                setShowDropdown(false)
              }}
              style={{ borderRadius: '9999px' }}
              className={`px-4 py-2 font-hero-sans text-xs font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer [-webkit-tap-highlight-color:transparent] ${
                isActive
                  ? 'bg-primary text-white shadow-[0_4px_12px_-2px_rgba(14,81,70,0.28)] dark:shadow-[0_4px_14px_-2px_rgba(0,0,0,0.45)]'
                  : 'bg-[#eae6da]/75 dark:bg-surface-container-low text-on-surface-variant hover:bg-[#eae6da] dark:hover:bg-surface-container hover:text-primary dark:hover:text-[#e8e3d6]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Buscador limpio coherente con el Hero */}
      <div className="flex items-center gap-2.5 w-full lg:max-w-[460px]">
        <form onSubmit={handleSubmit} className="relative flex-1" ref={dropdownRef}>
          <div className="flex items-center rounded-xl bg-white dark:bg-surface-container-low border border-outline-variant/80 dark:border-outline-variant px-3.5 h-11 shadow-[0_6px_20px_-6px_rgba(14,81,70,0.08)] dark:shadow-[0_8px_22px_-6px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow] duration-200 focus-within:border-primary/45 dark:focus-within:border-secondary/60 focus-within:shadow-[0_10px_26px_-6px_rgba(14,81,70,0.14)] dark:focus-within:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.58)]">
            <Search
              size={16}
              strokeWidth={1.9}
              absoluteStrokeWidth
              aria-hidden="true"
              className="text-outline shrink-0"
            />
            <input
              className="min-w-0 flex-1 bg-transparent hover:bg-transparent! px-2.5 font-hero-sans text-sm text-primary dark:text-on-surface outline-none! focus:outline-none! focus-visible:outline-none! focus:translate-y-0! placeholder:text-outline"
              placeholder={`Buscar por ${activeFilterLabel}...`}
              type="text"
              value={query}
              onChange={(e) => {
                const next = e.target.value
                setQuery(next)
                if (!next.trim()) {
                  setResults([])
                  setShowDropdown(false)
                }
              }}
              onFocus={() => {
                if (query.trim() && results.length > 0) setShowDropdown(true)
              }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpiar búsqueda"
                className="p-1 text-outline hover:text-primary dark:hover:text-[#e8e3d6] transition-colors cursor-pointer"
              >
                <X size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-container-low rounded-2xl shadow-[0_18px_40px_rgba(24,51,47,0.16)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.68)] border border-outline-variant/50 dark:border-outline-variant overflow-hidden z-50 animate-[dropdownIn_180ms_var(--ease-out-strong)_both]">
              <ul className="divide-y divide-surface-container-low dark:divide-outline-variant/60 max-h-80 overflow-y-auto overscroll-contain">
                {results.map((book) => (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(book.id)}
                      className="w-full px-4 py-3 hover:bg-surface-container-low dark:hover:bg-surface-container cursor-pointer transition-colors flex items-center gap-3.5 text-left"
                    >
                      <div className="w-9 h-12 bg-[#eae6da] dark:bg-surface-container rounded-[4px] overflow-hidden shrink-0">
                        {book.img ? (
                          <img src={book.img} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-hero-sans font-semibold text-primary dark:text-[#e8e3d6] truncate text-sm">
                          {book.title}
                        </p>
                        <p className="font-hero-sans text-xs text-on-surface-variant truncate">
                          {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <button
          type="button"
          onClick={handleClear}
          className="h-11 px-4 rounded-xl border border-outline-variant/80 dark:border-outline-variant bg-white dark:bg-surface-container-low hover:border-primary/40 dark:hover:border-secondary/50 hover:bg-surface-container-low/60 dark:hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-[#e8e3d6] font-hero-sans text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
