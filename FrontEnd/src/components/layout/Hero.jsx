import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getBooks } from '../../api/books'
import HeroBookShowcase from './HeroBookShowcase'

export default function Hero() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchBoxRef = useRef(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      setShowDropdown(false)
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timeoutId = setTimeout(async () => {
      try {
        const { data } = await getBooks({ q: trimmed })
        if (!cancelled) {
          setResults(Array.isArray(data) ? data.slice(0, 5) : [])
          setShowDropdown(true)
        }
      } catch {
        if (!cancelled) {
          setResults([])
          setShowDropdown(true)
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
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

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    setShowDropdown(false)
    if (trimmed) {
      navigate(`/catalog?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/catalog')
    }
  }

  const handleSelectBook = (bookId) => {
    setShowDropdown(false)
    navigate(`/books/${bookId}`)
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-6 md:px-12 pt-32 md:pt-40 lg:pt-44 pb-20 md:pb-28 lg:pb-32">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:items-stretch relative">
        {/* Columna Izquierda: Contenido y Buscador (borde superior e inferior alineados con los arcos) */}
        <div className="order-2 lg:order-1 relative z-20 flex flex-col lg:justify-between text-center lg:text-left">
          <div>
            {isAuthenticated && user?.name ? (
              <h1 className="font-hero-display max-w-170 mx-auto lg:mx-0 text-[34px] min-[400px]:text-4xl sm:text-5xl lg:text-[50px] xl:text-[58px] font-semibold leading-[1.04] tracking-[-0.02em] text-primary lg:-mt-2">
                <span className="hero-slide-track">
                  <span className="hero-from-left whitespace-nowrap" style={{ animationDelay: '40ms' }}>
                    ¡Hola, {user.name}!
                  </span>
                </span>
                <span className="hero-slide-track">
                  <span className="hero-from-left" style={{ animationDelay: '150ms' }}>
                    ¿Qué vamos a{' '}
                    <span className="italic font-medium text-secondary-dark whitespace-nowrap">descubrir hoy?</span>
                  </span>
                </span>
              </h1>
            ) : (
              <h1 className="font-hero-display font-semibold text-primary leading-[1.02] tracking-[-0.02em] lg:-mt-2">
                <span className="hero-slide-track">
                  <span
                    className="hero-from-left text-[40px] min-[400px]:text-[44px] sm:text-[56px] lg:text-[54px] xl:text-[66px] whitespace-nowrap"
                    style={{ animationDelay: '40ms' }}
                  >
                    Encuentra tu
                  </span>
                </span>
                <span className="hero-slide-track">
                  <span
                    className="hero-from-left italic font-medium text-[40px] min-[400px]:text-[44px] sm:text-[56px] lg:text-[54px] xl:text-[66px] text-secondary-dark whitespace-nowrap"
                    style={{ animationDelay: '150ms' }}
                  >
                    próxima lectura
                  </span>
                </span>
              </h1>
            )}

            <div className="hero-slide-track mt-5 max-w-[440px] mx-auto lg:mx-0">
              <p
                className="hero-from-left font-hero-sans text-[14.5px] sm:text-[15.5px] leading-[1.7] tracking-[-0.005em] text-on-surface-variant/90"
                style={{ animationDelay: '260ms' }}
              >
                Lleva el registro de lo que lees, opina sobre tus libros favoritos y recibe recomendaciones personalizadas con la ayuda de un asistente de IA.
              </p>
            </div>
          </div>

          <div
            ref={searchBoxRef}
            className="hero-search-enter relative mt-7 lg:mt-6 w-full max-w-[470px] mx-auto lg:mx-0"
            style={{ animationDelay: '340ms' }}
          >
            <form
              onSubmit={handleSubmit}
              className="flex items-center rounded-xl sm:rounded-2xl bg-white p-1 sm:p-1.5 border border-outline-variant/80 shadow-[0_12px_32px_-8px_rgba(14,81,70,0.09),0_2px_8px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-primary/40 focus-within:shadow-[0_16px_38px_-8px_rgba(14,81,70,0.16)]"
            >
              <label htmlFor="hero-book-search" className="sr-only">
                Buscar en el catálogo
              </label>
              <span className="grid w-7 sm:w-10 shrink-0 place-items-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">search</span>
              </span>
              <input
                id="hero-book-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (query.trim() && (results.length > 0 || !searching)) {
                    setShowDropdown(true)
                  }
                }}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent hover:bg-transparent! px-1 font-hero-sans text-xs sm:text-sm text-primary outline-none! focus:outline-none! focus-visible:outline-none! focus:translate-y-0! placeholder:text-[11.5px] sm:placeholder:text-sm placeholder:text-outline"
                placeholder="Busca por título, autor o género..."
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setShowDropdown(false)
                  }}
                  aria-label="Limpiar búsqueda"
                  className="grid w-6 sm:w-8 shrink-0 place-items-center text-outline hover:text-primary transition-colors duration-150 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[18px]">close</span>
                </button>
              )}
              <button
                type="submit"
                className="hero-btn-sheen shrink-0 rounded-lg sm:rounded-xl bg-secondary px-3 sm:px-6 py-2 sm:py-3 font-hero-sans text-[10.5px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.16em] font-semibold text-on-secondary transition-[background-color,transform] duration-150 ease-out hover:bg-secondary-hover active:scale-[0.97] cursor-pointer"
              >
                Buscar
              </button>
            </form>

            {/* Dropdown de resultados en vivo */}
            {showDropdown && (
              <div className="origin-top absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-outline-variant/40 bg-white text-left shadow-[0_18px_40px_rgba(28,28,22,0.18)] animate-[dropdownIn_180ms_var(--ease-out-strong)_both]">
                {searching ? (
                  <div className="flex items-center gap-3 px-4 py-4 text-sm font-body text-on-surface-variant">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant/40 border-t-tertiary" />
                    Buscando libros...
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <ul className="divide-y divide-surface-container-low max-h-80 overflow-y-auto">
                      {results.map((book) => (
                        <li key={book.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectBook(book.id)}
                            className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-surface-container-low cursor-pointer"
                          >
                            <div className="h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-surface-container">
                              {book.img ? (
                                <img
                                  src={book.img}
                                  alt={book.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs">📖</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-headline text-sm font-bold text-primary">
                                {book.title}
                              </p>
                              <p className="truncate font-body text-xs text-on-surface-variant">
                                {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                              </p>
                            </div>
                            {Number(book.rate) > 0 && (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 font-label text-xs font-bold text-primary">
                                <span
                                  className="material-symbols-outlined text-[14px] text-[#E5B02E]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                {Number(book.rate).toFixed(1)}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex w-full items-center justify-center gap-1.5 border-t border-surface-container-high bg-surface-container-low/70 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest text-tertiary transition-colors hover:bg-surface-container-low cursor-pointer"
                    >
                      Ver todos los resultados
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="font-headline text-sm font-bold text-primary">
                      No encontramos resultados para «{query.trim()}»
                    </p>
                    <p className="mt-1 font-body text-xs text-outline">
                      Probá con otro título, autor o género.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Carrusel de 3 portadas con arcos decorativos */}
        <div className="order-1 lg:order-2 relative z-10 flex items-center lg:items-end justify-center lg:justify-end">
          <div
            className="hero-from-right w-full"
            style={{ animationDelay: '80ms' }}
          >
            <HeroBookShowcase />
          </div>
        </div>
      </div>
    </section>
  )
}
