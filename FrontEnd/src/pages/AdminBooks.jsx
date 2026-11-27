import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  Globe,
  BookOpen,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { getBooks, deleteBook } from '../api/books'
import BookModal from '../components/admin/BookModal'

const FILTERS = [
  { key: 'title', label: 'Título' },
  { key: 'author', label: 'Autor' },
  { key: 'genre', label: 'Género' },
  { key: 'editorial', label: 'Editorial' },
]

export default function AdminBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [refreshTick, setRefreshTick] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalFocusSearch, setModalFocusSearch] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState('title')
  const [activeParams, setActiveParams] = useState({})
  const [dropdownResults, setDropdownResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch paginated/filtered books
  useEffect(() => {
    let cancelled = false
    getBooks({ page, ...activeParams })
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setBooks(list)
        setHasMore(list.length === 10)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setBooks([])
        setHasMore(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, activeParams, refreshTick])

  // Debounced autocomplete
  useEffect(() => {
    let cancelled = false
    const id = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await getBooks({ [searchFilter]: searchQuery.trim() })
          if (!cancelled) {
            const list = Array.isArray(res.data) ? res.data : []
            setDropdownResults(list.slice(0, 4))
            setShowDropdown(true)
          }
        } catch {
          if (!cancelled) setDropdownResults([])
        }
      } else {
        setDropdownResults([])
        setShowDropdown(false)
      }
    }, 550)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [searchQuery, searchFilter])

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close delete confirmation on Escape
  useEffect(() => {
    if (!deleteConfirm) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) setDeleteConfirm(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteConfirm, deleting])

  const handleCreateManual = () => {
    setEditingBook(null)
    setModalFocusSearch(false)
    setModalOpen(true)
  }

  const handleImportGoogle = () => {
    setEditingBook(null)
    setModalFocusSearch(true)
    setModalOpen(true)
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setModalFocusSearch(false)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await deleteBook(id)
      setDeleteConfirm(null)
      setLoading(true)
      setRefreshTick((t) => t + 1)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setModalFocusSearch(false)
    setEditingBook(null)
  }

  const handleModalSave = () => {
    handleModalClose()
    setLoading(true)
    setRefreshTick((t) => t + 1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowDropdown(false)
    setLoading(true)
    setPage(1)
    if (searchQuery.trim()) {
      setActiveParams({ [searchFilter]: searchQuery.trim() })
    } else {
      setActiveParams({})
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setDropdownResults([])
    setShowDropdown(false)
    if (Object.keys(activeParams).length > 0 || page !== 1) {
      setLoading(true)
      setActiveParams({})
      setPage(1)
    }
  }

  const handleDropdownClick = (book) => {
    setShowDropdown(false)
    handleEdit(book)
  }

  const handleChangePage = (nextPage) => {
    if (nextPage === page) return
    setLoading(true)
    setPage(nextPage)
  }

  const currentFilterLabel =
    FILTERS.find((f) => f.key === searchFilter)?.label.toLowerCase() || 'título'
  const hasActiveFilter = Object.keys(activeParams).length > 0

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-hero-display text-3xl sm:text-[34px] font-semibold tracking-tight text-[#0e5146] dark:text-[#f0ede6] leading-tight">
            Libros
          </h1>
          <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-1">
            Administrá las fichas del catálogo o importá nuevos títulos desde Google Books.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleImportGoogle}
            className="h-9 ps-3 pe-3.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] text-sm font-medium text-[#18332f] dark:text-[#f0ede6] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] inline-flex items-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
          >
            <Globe
              size={15}
              strokeWidth={1.75}
              absoluteStrokeWidth
              className="text-[#0e5146] dark:text-[#edbd79]"
            />
            <span>Importar de Google Books</span>
          </button>

          <button
            type="button"
            onClick={handleCreateManual}
            className="h-9 ps-3.5 pe-4 rounded-xl bg-[#0e5146] hover:bg-[#0c453c] dark:bg-[#166e5e] dark:hover:bg-[#1b806e] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            <Plus size={16} strokeWidth={2} absoluteStrokeWidth />
            <span>Nuevo libro</span>
          </button>
        </div>
      </header>

      {/* Search & Segmented Filter Toolbar */}
      <section aria-label="Búsqueda y filtros" className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Segmented Control (Concentric radii: outer 12px, padding 4px, inner 8px) */}
          <div
            role="group"
            aria-label="Campo de búsqueda"
            className="inline-flex p-1 rounded-xl bg-[#ecefe9] dark:bg-[#131f1c] border border-[#18332f]/[0.07] dark:border-white/[0.08] self-start overflow-x-auto max-w-full"
          >
            {FILTERS.map((f) => {
              const selected = searchFilter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setSearchFilter(f.key)
                    setSearchQuery('')
                    setDropdownResults([])
                    setShowDropdown(false)
                  }}
                  aria-pressed={selected}
                  className={`h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer ${
                    selected
                      ? 'bg-white text-[#0e5146] shadow-[0_1px_2px_rgba(24,51,47,0.08)] dark:bg-[#192824] dark:text-[#f0ede6] dark:shadow-none'
                      : 'text-[#4a615b] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6]'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Search Input + Actions */}
          <div className="flex items-center gap-2 flex-1">
            <form
              onSubmit={handleSearch}
              className="relative flex-1"
              ref={dropdownRef}
            >
              <Search
                size={15}
                strokeWidth={1.75}
                absoluteStrokeWidth
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5d726c] dark:text-[#a6b7b1] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (dropdownResults.length > 0) setShowDropdown(true)
                }}
                placeholder={`Buscar por ${currentFilterLabel}...`}
                aria-label={`Buscar por ${currentFilterLabel}`}
                className="w-full h-10 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] pl-9 pr-20 text-sm text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#edbd79]/20 transition-[border-color,box-shadow] duration-150"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setDropdownResults([])
                      setShowDropdown(false)
                    }}
                    aria-label="Borrar texto de búsqueda"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5d726c] hover:text-[#18332f] hover:bg-[#f3f4ef] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-[#192824] transition-colors cursor-pointer"
                  >
                    <X size={14} strokeWidth={1.75} absoluteStrokeWidth />
                  </button>
                )}
                <button
                  type="submit"
                  className="h-7 px-2.5 rounded-lg bg-[#f3f4ef] hover:bg-[#e3e9e1] dark:bg-[#192824] dark:hover:bg-[#223631] text-xs font-medium text-[#0e5146] dark:text-[#edbd79] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                >
                  Buscar
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && dropdownResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.1] dark:border-white/[0.12] shadow-[0_16px_40px_rgba(12,20,18,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.48)] overflow-hidden max-h-72 overflow-y-auto overscroll-contain p-1.5 z-40">
                  <ul className="space-y-0.5">
                    {dropdownResults.map((book) => (
                      <li key={book.id}>
                        <button
                          type="button"
                          onClick={() => handleDropdownClick(book)}
                          className="w-full text-left flex items-center gap-3 p-2 rounded-[10px] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] transition-colors duration-100 cursor-pointer"
                        >
                          <div className="w-8 aspect-[2/3] rounded bg-[#e7ece5] dark:bg-[#192824] overflow-hidden shrink-0">
                            {book.img ? (
                              <img
                                src={book.img}
                                alt={book.title}
                                className="w-full h-full object-cover rounded outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]">
                                <BookOpen size={13} strokeWidth={1.5} absoluteStrokeWidth />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                              {book.title}
                            </p>
                            <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                              {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-[#0e5146] dark:text-[#edbd79] shrink-0 pr-1">
                            Editar
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] text-xs font-medium text-[#4a615b] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Active filter pill */}
        {hasActiveFilter && (
          <div className="flex items-center gap-2 text-xs text-[#4a615b] dark:text-[#a6b7b1]">
            <span>Filtrado por {currentFilterLabel}:</span>
            <span
              style={{ borderRadius: '9999px' }}
              className="inline-flex items-center gap-1.5 ps-2.5 pe-2 py-0.5 font-medium bg-[#f7e4cd] text-[#7a4d16] dark:bg-[#edbd79]/15 dark:text-[#edbd79]"
            >
              <span>{Object.values(activeParams)[0]}</span>
              <button
                type="button"
                onClick={handleClear}
                aria-label="Quitar filtro activo"
                className="hover:opacity-75 cursor-pointer"
              >
                <X size={12} strokeWidth={2} absoluteStrokeWidth />
              </button>
            </span>
          </div>
        )}
      </section>

      {/* Catalog List / Table */}
      <section aria-label="Listado de libros">
        <div className="bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.08] dark:border-white/[0.08] overflow-hidden">
          {loading ? (
            <div className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-10 aspect-[2/3] rounded-md bg-[#ebf0e9] dark:bg-[#192824] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-56 max-w-[70%] rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                    <div className="h-3 w-32 rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                  </div>
                  <div className="hidden sm:block h-3.5 w-24 rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-3">
              <div
                style={{ borderRadius: '9999px' }}
                className="w-11 h-11 mx-auto bg-[#f3f4ef] dark:bg-[#192824] flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]"
              >
                <BookOpen size={20} strokeWidth={1.5} absoluteStrokeWidth />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                  No se encontraron libros
                </p>
                <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] mt-1">
                  {hasActiveFilter
                    ? 'Probá con otro término o limpiá el filtro activo.'
                    : 'Agregá el primer título manualmente o importalo desde Google Books.'}
                </p>
              </div>
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline cursor-pointer"
                >
                  Ver todos los libros
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImportGoogle}
                  className="h-9 px-4 rounded-xl bg-[#0e5146] hover:bg-[#0c453c] dark:bg-[#166e5e] dark:hover:bg-[#1b806e] text-white text-xs font-semibold transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                >
                  Importar de Google Books
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#18332f]/[0.08] dark:border-white/[0.08]">
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Libro
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Autor
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Géneros
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Editorial
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                    {books.map((book) => {
                      const genres = (Array.isArray(book.genre) ? book.genre : [book.genre]).filter(Boolean)
                      return (
                        <tr
                          key={book.id}
                          className="group hover:bg-[#f8f7f2]/80 dark:hover:bg-[#192824]/60 transition-colors duration-100"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 aspect-[2/3] rounded-md bg-[#e7ece5] dark:bg-[#192824] overflow-hidden shrink-0">
                                {book.img ? (
                                  <img
                                    src={book.img}
                                    alt={book.title}
                                    className="w-full h-full object-cover rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]">
                                    <BookOpen size={14} strokeWidth={1.5} absoluteStrokeWidth />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate max-w-[260px]">
                                  {book.title}
                                </p>
                                <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums mt-0.5">
                                  {[
                                    book.year ? String(book.year) : null,
                                    book.pages ? `${book.pages} págs.` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || `ID ${String(book.id).slice(0, 8)}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] max-w-[200px] truncate">
                              {Array.isArray(book.author) ? book.author.join(', ') : book.author || '—'}
                            </p>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                              {genres.length > 0 ? (
                                genres.slice(0, 3).map((g, i) => (
                                  <span
                                    key={`${g}-${i}`}
                                    style={{ borderRadius: '9999px' }}
                                    className="inline-block px-2.5 py-0.5 text-xs font-medium bg-[#f7e4cd]/70 text-[#7a4d16] dark:bg-[#edbd79]/15 dark:text-[#edbd79]"
                                  >
                                    {g}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">—</span>
                              )}
                              {genres.length > 3 && (
                                <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums self-center">
                                  +{genres.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] max-w-[160px] truncate">
                              {book.editorial || '—'}
                            </p>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(book)}
                                aria-label={`Editar ${book.title}`}
                                title="Editar libro"
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#5d726c] hover:text-[#0e5146] hover:bg-[#e3eee9]/70 dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.08] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                              >
                                <Pencil size={15} strokeWidth={1.75} absoluteStrokeWidth />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(book)}
                                aria-label={`Eliminar ${book.title}`}
                                title="Eliminar libro"
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#5d726c] hover:text-[#ba1a1a] hover:bg-[#ffedea] dark:text-[#a6b7b1] dark:hover:text-[#f87171] dark:hover:bg-[#3a181c] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                              >
                                <Trash2 size={15} strokeWidth={1.75} absoluteStrokeWidth />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <ul className="md:hidden divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                {books.map((book) => {
                  const genres = (Array.isArray(book.genre) ? book.genre : [book.genre]).filter(Boolean)
                  return (
                    <li key={book.id} className="p-4 flex items-start gap-3.5">
                      <div className="w-12 aspect-[2/3] rounded-md bg-[#e7ece5] dark:bg-[#192824] overflow-hidden shrink-0">
                        {book.img ? (
                          <img
                            src={book.img}
                            alt={book.title}
                            className="w-full h-full object-cover rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]">
                            <BookOpen size={16} strokeWidth={1.5} absoluteStrokeWidth />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] leading-snug">
                          {book.title}
                        </p>
                        <p className="text-xs text-[#4a615b] dark:text-[#a6b7b1] truncate">
                          {Array.isArray(book.author) ? book.author.join(', ') : book.author || 'Autor sin especificar'}
                        </p>
                        {book.editorial && (
                          <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                            {book.editorial}
                            {book.year ? ` · ${book.year}` : ''}
                          </p>
                        )}
                        {genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {genres.slice(0, 2).map((g, i) => (
                              <span
                                key={`${g}-${i}`}
                                style={{ borderRadius: '9999px' }}
                                className="inline-block px-2 py-0.5 text-xs font-medium bg-[#f7e4cd]/70 text-[#7a4d16] dark:bg-[#edbd79]/15 dark:text-[#edbd79]"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEdit(book)}
                          aria-label={`Editar ${book.title}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#4a615b] hover:text-[#0e5146] hover:bg-[#f3f4ef] dark:text-[#a6b7b1] dark:hover:bg-[#192824] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                        >
                          <Pencil size={16} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(book)}
                          aria-label={`Eliminar ${book.title}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#ba1a1a] dark:text-[#f87171] hover:bg-[#ffedea] dark:hover:bg-[#3a181c] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        {/* Pagination Bar */}
        {!loading && books.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1">
            <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
              Mostrando {books.length} {books.length === 1 ? 'libro' : 'libros'} en página {page}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChangePage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-9 ps-2.5 pe-3.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] text-xs font-medium text-[#18332f] dark:text-[#f0ede6] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] inline-flex items-center gap-1 transition-[background-color,transform,opacity] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={15} strokeWidth={1.75} absoluteStrokeWidth />
                <span>Anterior</span>
              </button>

              <span className="min-w-8 text-center text-xs font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                {page}
              </span>

              <button
                type="button"
                onClick={() => handleChangePage(page + 1)}
                disabled={!hasMore}
                className="h-9 ps-3.5 pe-2.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] text-xs font-medium text-[#18332f] dark:text-[#f0ede6] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] inline-flex items-center gap-1 transition-[background-color,transform,opacity] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight size={15} strokeWidth={1.75} absoluteStrokeWidth />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Book Create/Edit Modal */}
      {modalOpen && (
        <BookModal
          book={editingBook}
          initialFocusSearch={modalFocusSearch}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1412]/45 dark:bg-black/65 font-hero-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-book-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteConfirm(null)
          }}
        >
          <div className="bg-white dark:bg-[#131f1c] w-full max-w-md rounded-[20px] border border-[#18332f]/[0.09] dark:border-white/[0.1] shadow-[0_24px_60px_rgba(12,20,18,0.2)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-6 space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-start gap-3.5">
              <div
                style={{ borderRadius: '9999px' }}
                className="w-10 h-10 bg-[#ffedea] dark:bg-[#3a181c] text-[#ba1a1a] dark:text-[#f87171] flex items-center justify-center shrink-0"
              >
                <AlertTriangle size={18} strokeWidth={1.75} absoluteStrokeWidth />
              </div>
              <div className="min-w-0">
                <h2
                  id="delete-book-title"
                  className="text-base font-semibold text-[#18332f] dark:text-[#f0ede6]"
                >
                  Eliminar libro
                </h2>
                <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-1 leading-relaxed">
                  ¿Querés eliminar <strong className="font-semibold text-[#18332f] dark:text-[#f0ede6]">“{deleteConfirm.title}”</strong> del catálogo? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="h-9 px-4 rounded-xl bg-white dark:bg-[#192824] border border-[#18332f]/15 dark:border-[#293e38] text-sm font-medium text-[#4a615b] dark:text-[#a6b7b1] hover:bg-[#f3f4ef] dark:hover:bg-[#223631] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirm.id)}
                className="h-9 px-4 rounded-xl bg-[#ba1a1a] hover:bg-[#9e1616] text-white text-sm font-semibold inline-flex items-center gap-2 transition-[background-color,transform,opacity] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-50 cursor-pointer"
              >
                {deleting && (
                  <Loader2 size={14} strokeWidth={2} absoluteStrokeWidth className="animate-spin" />
                )}
                <span>{deleting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
