import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBooks } from '../../api/books'

export default function SearchBar({ onSearch, initialQuery = '', initialFilter = 'title' }) {
  const [query, setQuery] = useState(initialQuery)
  const [filterType, setFilterType] = useState(initialFilter)
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Debounce logic (1 second)
    const timeoutId = setTimeout(async () => {
      if (query.trim().length > 0) {
        try {
          const res = await getBooks({ [filterType]: query.trim() })
          setResults(res.data.slice(0, 4))
          setShowDropdown(true)
        } catch (e) {
          setResults([])
        }
      } else {
        setResults([])
        setShowDropdown(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [query, filterType])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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

  const handleResultClick = (bookId) => {
    navigate(`/book/${bookId}`)
  }

  const filters = [
    { key: 'title', label: 'Título' },
    { key: 'author', label: 'Autor' },
    { key: 'genre', label: 'Género' },
    { key: 'editorial', label: 'Editorial' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setFilterType(f.key)
              setQuery('')
              setResults([])
            }}
            className={`px-4 py-2 text-xs font-label uppercase tracking-widest rounded-sm border-b transition-all cursor-pointer ${
              filterType === f.key
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-lowest text-primary border-outline-variant/50 hover:bg-primary hover:text-on-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {/* Search input and clear button */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl items-stretch sm:items-center">
        <form onSubmit={handleSubmit} className="relative flex-1" ref={dropdownRef}>
          <input
            className="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary rounded-full px-6 py-3 text-sm placeholder:text-stone-400 font-body"
            placeholder={`Buscar por ${filters.find(f => f.key === filterType)?.label.toLowerCase()}...`}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true)
            }}
          />
          <button type="submit" className="absolute right-4 top-3 cursor-pointer">
            <span className="material-symbols-outlined text-stone-400">search</span>
          </button>

          {/* Autocomplete Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-surface-container-high overflow-hidden z-50">
              <ul className="max-h-80 overflow-y-auto">
                {results.map(book => (
                  <li 
                    key={book.id} 
                    className="px-4 py-3 hover:bg-[#fdf9f0] cursor-pointer border-b border-surface-container-low last:border-b-0 transition-colors flex items-center gap-4"
                    onClick={() => handleResultClick(book.id)}
                  >
                    <div className="w-10 h-14 bg-surface-container rounded-sm overflow-hidden flex-shrink-0">
                      {book.img ? (
                        <img src={book.img} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline font-bold text-primary truncate text-sm">{book.title}</span>
                      <span className="font-body text-xs text-secondary truncate">{Array.isArray(book.author) ? book.author.join(', ') : book.author}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
        
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setResults([])
            setShowDropdown(false)
            onSearch({})
          }}
          className="px-6 py-3 border border-outline-variant text-secondary rounded-full font-label font-bold uppercase tracking-widest text-xs hover:bg-surface-container-low transition-colors cursor-pointer text-center whitespace-nowrap"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}
