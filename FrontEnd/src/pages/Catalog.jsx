import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getBooks } from '../api/books'
import BookGrid from '../components/books/BookGrid'
import SearchBar from '../components/books/SearchBar'
import { useSEO } from '../hooks/useSEO'

export default function Catalog() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()

  // Build a dynamic SEO title based on active filters
  const genre = searchParams.get('genre')
  const author = searchParams.get('author')
  const titleParam = searchParams.get('title')
  const seoTitle = genre
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
      url: `https://book-review-six-rho.vercel.app/catalog${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
      isPartOf: { '@type': 'WebSite', name: 'BookReview', url: 'https://book-review-six-rho.vercel.app/' },
    },
  })


  const fetchBooks = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await getBooks({ ...params, page })
      setBooks(data)
    } catch (err) {
      console.error(err)
      setBooks([])
    }
    setLoading(false)
  }

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    fetchBooks(params)
  }, [page, searchParams])

  const handleSearch = (filters) => {
    setPage(1)
    setSearchParams(filters)
  }

  return (
    <main className="pt-20 md:pt-32 pb-16 md:pb-24 max-w-[1440px] mx-auto px-6 md:px-12 min-h-screen">
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-8">
          <div>
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">La colección</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary font-headline">
              {searchParams.toString() ? 'Catálogo' : 'Catálogo Completo'}
            </h2>
          </div>
          {searchParams.toString() && (
            <button
              onClick={() => { setSearchParams({}); setPage(1) }}
              className="text-primary font-label text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-primary/20 hover:border-primary transition-all cursor-pointer pb-1"
            >
              Ver todo el catálogo
            </button>
          )}
        </div>

        <div className="mb-12 space-y-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        <BookGrid books={books} loading={loading} />

        {books.length > 0 && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-12 md:mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2 bg-primary text-white font-label text-xs uppercase tracking-widest rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              ← Anterior
            </button>
            <span className="font-headline text-lg font-bold text-primary">{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={books.length < 10}
              className="px-6 py-2 bg-primary text-white font-label text-xs uppercase tracking-widest rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
