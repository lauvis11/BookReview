import { useState, useEffect, useCallback, useRef } from 'react'
import { getBooks, deleteBook } from '../api/books'
import BookModal from '../components/admin/BookModal'

export default function AdminBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState('title')
  const [activeParams, setActiveParams] = useState({})
  const [dropdownResults, setDropdownResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getBooks({ page, ...activeParams })
      setBooks(data)
      setHasMore(data.length === 10)
    } catch (err) {
      console.error(err)
      setBooks([])
    }
    setLoading(false)
  }, [page, activeParams])

  // Debounced autocomplete
  useEffect(() => {
    const id = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await getBooks({ [searchFilter]: searchQuery.trim() })
          setDropdownResults(res.data.slice(0, 4))
          setShowDropdown(true)
        } catch {
          setDropdownResults([])
        }
      } else {
        setDropdownResults([])
        setShowDropdown(false)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [searchQuery, searchFilter])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleCreate = () => {
    setEditingBook(null)
    setModalOpen(true)
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteBook(id)
      setDeleteConfirm(null)
      fetchBooks()
    } catch (err) {
      console.error(err)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingBook(null)
  }

  const handleModalSave = () => {
    handleModalClose()
    fetchBooks()
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setShowDropdown(false)
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
    setActiveParams({})
    setPage(1)
  }

  const handleDropdownClick = (book) => {
    setShowDropdown(false)
    handleEdit(book)
  }

  const filters = [
    { key: 'title', label: 'Título' },
    { key: 'author', label: 'Autor' },
    { key: 'genre', label: 'Género' },
    { key: 'editorial', label: 'Editorial' },
  ]

  return (
    <div className="p-8 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <span className="font-label text-xs uppercase tracking-[0.2em] text-[#50453e] mb-2 block">
            Catálogo
          </span>
          <h2 className="text-4xl font-serif font-black text-[#412817] leading-tight">
            Gestión de Libros
          </h2>
        </div>
        <button
          onClick={handleCreate}
          className="hidden md:flex items-center gap-2 bg-primary text-white px-6 py-3 rounded font-body font-bold text-sm tracking-widest shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Añadir Libro
        </button>
      </header>

      {/* Table Section */}
      <section className="space-y-6">
        {/* Search Bar */}
        <div className="space-y-3">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => { setSearchFilter(f.key); setSearchQuery(''); setDropdownResults([]) }}
                className={`px-3 py-1.5 text-[10px] font-label uppercase tracking-widest border-b transition-all cursor-pointer ${
                  searchFilter === f.key
                    ? 'bg-[#412817] text-white border-[#412817]'
                    : 'bg-[#f7f3ea] text-[#412817] border-[#d3c3bb]/50 hover:bg-[#ece8df]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Input + clear */}
          <div className="flex gap-3 items-center">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-xl" ref={dropdownRef}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#82746d] text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (dropdownResults.length > 0) setShowDropdown(true) }}
                placeholder={`Buscar por ${filters.find(f => f.key === searchFilter)?.label.toLowerCase()}...`}
                className="w-full bg-[#f7f3ea] border border-[#d3c3bb]/40 focus:border-[#c2a878] focus:ring-0 rounded pl-10 pr-10 py-2.5 text-sm font-body text-[#412817] placeholder:text-[#82746d]/60 outline-none transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#82746d] hover:text-[#412817] cursor-pointer">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              {/* Autocomplete Dropdown */}
              {showDropdown && dropdownResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded shadow-xl border border-[#d3c3bb]/20 overflow-hidden z-50">
                  <ul>
                    {dropdownResults.map(book => (
                      <li
                        key={book.id}
                        onClick={() => handleDropdownClick(book)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#f7f3ea] cursor-pointer border-b border-[#d3c3bb]/10 last:border-b-0 transition-colors"
                      >
                        <div className="w-8 h-11 bg-[#ece8df] overflow-hidden flex-shrink-0">
                          {book.img
                            ? <img src={book.img} alt={book.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[10px]">📖</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-[#412817] text-sm truncate">{book.title}</p>
                          <p className="font-body text-xs text-[#50453e] truncate">{Array.isArray(book.author) ? book.author.join(', ') : book.author}</p>
                        </div>
                        <span className="ml-auto text-[10px] font-label text-[#82746d] uppercase tracking-wider whitespace-nowrap">Editar →</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 border border-[#d3c3bb]/50 text-[#50453e] text-[10px] font-label uppercase tracking-widest hover:bg-[#f7f3ea] transition-colors cursor-pointer whitespace-nowrap"
            >
              Limpiar
            </button>
          </div>

          {/* Active filter indicator */}
          {Object.keys(activeParams).length > 0 && (
            <p className="text-xs font-body text-[#745a34] italic">
              Mostrando resultados para: <strong>{Object.values(activeParams)[0]}</strong>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-[#f7f3ea]/50 rounded">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#f7f3ea]">
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30">
                  Título
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30">
                  Autor
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30">
                  Género
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30">
                  Editorial
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-6">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="w-10 h-14 bg-[#ece8df] rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-[#ece8df] rounded w-3/4"></div>
                          <div className="h-3 bg-[#ece8df] rounded w-1/4"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#d3c3bb] mb-4 block">
                      menu_book
                    </span>
                    <p className="font-body text-[#50453e]">No se encontraron libros</p>
                  </td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className="group hover:bg-white transition-colors"
                  >
                    <td className="px-6 py-5 border-b border-[#d3c3bb]/10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 bg-[#ece8df] shadow-sm overflow-hidden flex-shrink-0">
                          {book.img ? (
                            <img
                              src={book.img}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#d3c3bb] text-sm">
                                menu_book
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-[#412817] group-hover:text-[#745a34] transition-colors">
                            {book.title}
                          </p>
                          <p className="text-[10px] font-label text-[#50453e] uppercase mt-1">
                            ID: {String(book.id).slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-[#d3c3bb]/10">
                      <p className="font-body text-sm text-[#1c1c16]">
                        {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                      </p>
                    </td>
                    <td className="px-6 py-5 border-b border-[#d3c3bb]/10">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(book.genre) ? book.genre : [book.genre])
                          .filter(Boolean)
                          .map((g, i) => (
                            <span
                              key={i}
                              className="inline-block px-3 py-1 bg-[#fedaaa] text-[#795e38] text-[10px] font-label uppercase tracking-wider rounded-b-sm"
                            >
                              {g}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-b border-[#d3c3bb]/10">
                      <p className="font-body text-sm text-[#1c1c16]">{book.editorial}</p>
                    </td>
                    <td className="px-6 py-5 border-b border-[#d3c3bb]/10 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="text-[#412817]/60 hover:text-[#412817] hover:bg-[#f7f3ea] p-2 rounded-full transition-all duration-200 active:scale-90 cursor-pointer"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(book)}
                          className="text-[#ba1a1a]/60 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 p-2 rounded-full transition-all duration-200 active:scale-90 cursor-pointer"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {books.length > 0 && (
          <div className="flex justify-between items-center px-4 pt-4">
            <p className="text-xs font-body text-[#50453e] italic">
              Mostrando {books.length} libros
            </p>
            <div className="flex items-center gap-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[10px] font-label uppercase tracking-[0.2em] text-[#50453e] hover:text-[#412817] flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Anterior
              </button>
              <span className="text-xs font-serif font-bold text-[#412817]">
                {String(page).padStart(2, '0')}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="text-[10px] font-label uppercase tracking-[0.2em] text-[#50453e] hover:text-[#412817] flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Mobile Create Button */}
      <button
        onClick={handleCreate}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-30 cursor-pointer"
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      {/* Book Modal */}
      {modalOpen && (
        <BookModal
          book={editingBook}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c16]/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-[#1c1c16] text-lg">Eliminar libro</h3>
                <p className="font-body text-sm text-[#50453e]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="font-body text-[#50453e] mb-8">
              ¿Estás seguro de que querés eliminar "{deleteConfirm.title}"?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-3 text-[#412817] font-body font-semibold text-sm hover:underline cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-6 py-3 bg-[#ba1a1a] text-white font-body font-bold text-sm rounded hover:opacity-90 transition-opacity cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
