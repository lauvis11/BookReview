import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getByStatus } from '../api/status'
import { getFavorites } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import BookGrid from '../components/books/BookGrid'

const TABS = [
  { key: 'reading', label: 'Leyendo' },
  { key: 'completed', label: 'Completados' },
  { key: 'want_to_read', label: 'Quiero Leerlo' },
  { key: 'favorites', label: 'Favoritos' },
]

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('reading')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (isAuthenticated) fetchBooks() }, [activeTab, isAuthenticated])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      if (activeTab === 'favorites') {
        const { data } = await getFavorites()
        setBooks(Array.isArray(data) ? data : [])
      } else {
        const { data } = await getByStatus(activeTab)
        setBooks(Array.isArray(data) ? data : [])
      }
    } catch (_) { setBooks([]) }
    setLoading(false)
  }

  if (authLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  return (
    <main className="pt-20 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl md:text-5xl font-headline font-black text-on-surface tracking-tight mb-8 md:mb-12">Mi Biblioteca</h1>

      {/* Reading Status Tabs */}
      <div className="flex items-center gap-4 md:gap-12 mb-8 md:mb-12 border-b border-outline-variant/20 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 md:pb-4 font-label text-xs md:text-sm uppercase tracking-wider md:tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-b-2 border-primary text-primary font-bold'
                : 'text-stone-500 hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Book Library Grid (Standardized Style) */}
      <BookGrid 
        books={books} 
        loading={loading} 
        emptyTitle="No hay libros aquí todavía" 
        emptySubtitle="Explora el catálogo para agregar libros a tu biblioteca" 
      />
    </main>
  )
}
