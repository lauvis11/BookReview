import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { getBooks } from '../api/books'
import BookGrid from '../components/books/BookGrid'
import SearchBar from '../components/books/SearchBar'
import { useSEO } from '../hooks/useSEO'

export default function Catalog() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()

  const qParam = searchParams.get('q')
  const genre = searchParams.get('genre')
  const author = searchParams.get('author')
  const titleParam = searchParams.get('title')
  const hasFilters = Boolean(searchParams.toString())

  const seoTitle = qParam
    ? `Búsqueda: "${qParam}"`
    : genre
    ? `Catálogo de ${genre.charAt(0) + genre.slice(1).toLowerCase()}`
    : author
    ? `Libros de ${author}`
    : titleParam
    ? `Búsqueda: "${titleParam}"`
    : 'Catálogo de Libros'

  const seoDescription = genre
    ? `Explorá todos los libros de ${genre.charAt(0) + genre.slice(1).toLowerCase()} disponibles en BookReview. Calificaciones, reseñas y más.`
    : 'Explorá el catálogo completo de BookReview. Buscá por título, autor o género y descubrí tu próxima lectura.'

  useSEO({
    title: seoTitle,
    description: seoDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${seoTitle} — BookReview`,
      description: seoDescription,
      url: `https://book-review-six-rho.vercel.app/catalog${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`,
      isPartOf: {
        '@type': 'WebSite',
        name: 'BookReview',
        url: 'https://book-review-six-rho.vercel.app/',
      },
    },
  })

  useEffect(() => {
    let cancelled = false
    const params = Object.fromEntries(searchParams.entries())

    const loadBooks = async () => {
      setLoading(true)
      try {
        const { data } = await getBooks({ ...params, page })
        if (!cancelled) setBooks(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        if (!cancelled) setBooks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBooks()
    return () => {
      cancelled = true
    }
  }, [page, searchParams])

  const handleSearch = (filters) => {
    setPage(1)
    setSearchParams(filters)
  }

  return (
    <main className="pt-28 md:pt-36 pb-16 md:pb-24 max-w-[1440px] mx-auto px-6 md:px-12 min-h-screen">
      <section className="mb-12">
        {/* Cabecera editorial coherente con Hero y Home */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pb-6 border-b border-outline-variant/50 dark:border-outline-variant/80">
          <div>
            <h1 className="font-hero-display text-4xl sm:text-5xl font-semibold tracking-[-0.02em] text-primary dark:text-[#e8e3d6] leading-[1.04]">
              {hasFilters ? (
                <>
                  Resultados del{' '}
                  <span className="italic font-medium text-secondary-dark">catálogo</span>
                </>
              ) : (
                <>
                  Catálogo{' '}
                  <span className="italic font-medium text-secondary-dark">completo</span>
                </>
              )}
            </h1>
            <p className="mt-2 font-hero-sans text-[15px] leading-relaxed text-on-surface-variant max-w-xl">
              Explora toda la colección y filtra por título, autor, género o editorial para encontrar tu próxima lectura.
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchParams({})
                setPage(1)
              }}
              className="inline-flex items-center gap-1.5 font-hero-sans text-xs font-semibold text-primary dark:text-[#d6e8b5] hover:text-secondary-dark transition-colors cursor-pointer pb-1"
            >
              <RotateCcw size={13} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              <span>Ver todo el catálogo</span>
            </button>
          )}
        </div>

        {/* Sistema de filtrado y búsqueda */}
        <div className="mb-10">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Grilla de catálogo (diseño limpio sin estrellas) */}
        <BookGrid books={books} loading={loading} variant="catalog" />

        {/* Paginación */}
        {books.length > 0 && (
          <div className="flex items-center justify-center gap-4 sm:gap-5 mt-14 md:mt-16">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] border border-outline-variant/80 dark:border-outline-variant bg-white dark:bg-surface-container-low hover:border-primary/40 dark:hover:border-secondary/50 hover:bg-surface-container-low/60 dark:hover:bg-surface-container text-primary dark:text-[#e8e3d6] font-hero-sans text-xs font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              <span>Anterior</span>
            </button>
            <span className="font-hero-sans text-sm font-semibold text-primary dark:text-[#e8e3d6] tabular-nums px-2">
              Página {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={books.length < 10}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] border border-outline-variant/80 dark:border-outline-variant bg-white dark:bg-surface-container-low hover:border-primary/40 dark:hover:border-secondary/50 hover:bg-surface-container-low/60 dark:hover:bg-surface-container text-primary dark:text-[#e8e3d6] font-hero-sans text-xs font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Siguiente</span>
              <ArrowRight size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
