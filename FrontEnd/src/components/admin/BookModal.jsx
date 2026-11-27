import { useState, useEffect, useRef } from 'react'
import {
  X,
  Search,
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { createBook, updateBook, searchGoogleBooks } from '../../api/books'

export default function BookModal({
  book,
  onClose,
  onSave,
  initialFocusSearch = false,
}) {
  const isEditing = !!book

  const getInitialFormData = () => {
    if (book) {
      return {
        title: book.title || '',
        author: Array.isArray(book.author)
          ? book.author
          : book.author
            ? [book.author]
            : [],
        genre: Array.isArray(book.genre)
          ? book.genre
          : book.genre
            ? [book.genre]
            : [],
        editorial: book.editorial || '',
        pages: book.pages || '',
        year: book.year || '',
        img: book.img || '',
        sinopsis: book.sinopsis || '',
      }
    }
    return {
      title: '',
      author: [],
      genre: [],
      editorial: '',
      pages: '',
      year: '',
      img: '',
      sinopsis: '',
      googleBooksId: '',
    }
  }

  const [formData, setFormData] = useState(getInitialFormData)
  const [authorInput, setAuthorInput] = useState('')
  const [genreInput, setGenreInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewImg, setPreviewImg] = useState(book?.img || '')

  // Google Books search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (initialFocusSearch && !isEditing && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [initialFocusSearch, isEditing])

  // Escape key closes dropdown first, then modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      if (showDropdown) {
        setShowDropdown(false)
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDropdown, onClose])

  // Debounced Google Books search
  useEffect(() => {
    let cancelled = false
    const id = setTimeout(async () => {
      if (searchQuery.trim().length > 2 && !isEditing) {
        setIsSearching(true)
        try {
          const res = await searchGoogleBooks(searchQuery.trim())
          if (!cancelled) {
            setSearchResults(res.data || [])
            setShowDropdown(true)
          }
        } catch {
          if (!cancelled) {
            setSearchResults([])
          }
        } finally {
          if (!cancelled) setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 550)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [searchQuery, isEditing])

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectGoogleBook = (gBook) => {
    setFormData({
      ...formData,
      googleBooksId: gBook.googleBooksId,
      title: gBook.title || '',
      author: gBook.author ? [gBook.author] : [],
      genre: gBook.genres || [],
      editorial: gBook.publisher || '',
      pages: gBook.pages || '',
      year: gBook.publishedYear || '',
      sinopsis: gBook.synopsis || '',
      img: gBook.coverUrl || '',
    })
    setPreviewImg(gBook.coverUrl || '')
    setShowDropdown(false)
    setSearchQuery('')
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'img') {
      setPreviewImg(value)
    }
  }

  const handleAddAuthor = (e) => {
    e.preventDefault()
    const trimmed = authorInput.trim()
    if (trimmed && !formData.author.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        author: [...prev.author, trimmed],
      }))
      setAuthorInput('')
    }
  }

  const handleRemoveAuthor = (author) => {
    setFormData((prev) => ({
      ...prev,
      author: prev.author.filter((a) => a !== author),
    }))
  }

  const handleAddGenre = (e) => {
    e.preventDefault()
    const trimmed = genreInput.trim()
    if (trimmed && !formData.genre.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        genre: [...prev.genre, trimmed],
      }))
      setGenreInput('')
    }
  }

  const handleRemoveGenre = (genre) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.filter((g) => g !== genre),
    }))
  }

  const handleClearForm = () => {
    setFormData(getInitialFormData())
    setPreviewImg(book?.img || '')
    setSearchQuery('')
    setSearchResults([])
    setShowDropdown(false)
    setAuthorInput('')
    setGenreInput('')
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const pages = parseInt(formData.pages, 10) || 1
    const year = parseInt(formData.year, 10) || new Date().getFullYear()

    if (!formData.title || formData.title.length < 2) {
      setError('El título debe tener al menos 2 caracteres.')
      setLoading(false)
      return
    }
    if (pages < 1) {
      setError('Las páginas deben ser un número positivo.')
      setLoading(false)
      return
    }
    if (!formData.editorial || formData.editorial.length < 2) {
      setError('La editorial debe tener al menos 2 caracteres.')
      setLoading(false)
      return
    }
    if (!formData.sinopsis || formData.sinopsis.length < 2) {
      setError('La sinopsis debe tener al menos 2 caracteres.')
      setLoading(false)
      return
    }
    if (formData.author.length === 0) {
      setError('Agregá al menos un autor para guardar el libro.')
      setLoading(false)
      return
    }
    if (formData.genre.length === 0) {
      setError('Agregá al menos un género para guardar el libro.')
      setLoading(false)
      return
    }

    try {
      if (isEditing) {
        const payload = {
          title: formData.title,
          pages,
          year,
          editorial: formData.editorial,
          author: formData.author,
          genre: formData.genre,
          sinopsis: formData.sinopsis,
          img: formData.img || undefined,
        }
        await updateBook(book.id, payload)
      } else {
        const payload = {
          googleBooksId: formData.googleBooksId || `manual-${Date.now()}`,
          title: formData.title,
          author: formData.author.join(', '),
          genres: formData.genre,
          publisher: formData.editorial,
          pages,
          publishedYear: year,
          synopsis: formData.sinopsis,
          coverUrl: formData.img || undefined,
        }
        await createBook(payload)
      }
      onSave()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'No se pudo guardar el libro. Intentá nuevamente.')
    }
    setLoading(false)
  }

  const inputBaseClass =
    'w-full h-10 rounded-xl bg-white dark:bg-[#192824] border border-[#18332f]/15 dark:border-[#293e38] px-3.5 text-sm text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#edbd79]/20 transition-[border-color,box-shadow] duration-150 ease-out'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0c1412]/45 dark:bg-black/65 font-hero-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[#fdfcf9] dark:bg-[#131f1c] w-full max-w-4xl max-h-[90vh] rounded-[20px] border border-[#18332f]/[0.09] dark:border-white/[0.1] shadow-[0_24px_64px_rgba(12,20,18,0.22)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col md:flex-row relative">
        {/* Left Cover Preview Pane (Desktop) */}
        <aside className="hidden md:flex md:w-[272px] shrink-0 flex-col justify-between bg-[#f3f4ef] dark:bg-[#101a17] border-r border-[#18332f]/[0.08] dark:border-white/[0.08] p-6">
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
              Vista previa de portada
            </p>
            <div className="w-full aspect-[2/3] rounded-xl bg-[#e7ece5] dark:bg-[#192824] relative overflow-hidden">
              {previewImg ? (
                <img
                  src={previewImg}
                  alt={formData.title || 'Vista previa de portada'}
                  className="w-full h-full object-cover rounded-xl outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  onError={() => setPreviewImg('')}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5d726c] dark:text-[#a6b7b1] p-6 text-center gap-2.5">
                  <BookOpen size={28} strokeWidth={1.5} absoluteStrokeWidth />
                  <p className="text-xs leading-relaxed">
                    Pegá una URL de portada o elegí un libro de Google Books.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <p className="font-hero-display text-lg font-semibold leading-snug text-[#18332f] dark:text-[#f0ede6] line-clamp-2">
                {formData.title || 'Sin título'}
              </p>
              <p className="text-xs text-[#4a615b] dark:text-[#a6b7b1] truncate">
                {formData.author.length > 0 ? formData.author.join(', ') : 'Autor por definir'}
              </p>
              {(formData.year || formData.pages) && (
                <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums pt-0.5">
                  {[
                    formData.year ? `${formData.year}` : null,
                    formData.pages ? `${formData.pages} págs.` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] leading-relaxed border-t border-[#18332f]/[0.08] dark:border-white/[0.08] pt-4">
            Revisá el título, los autores y la portada antes de publicar en el catálogo de BookReview.
          </p>
        </aside>

        {/* Right Scrollable Form Column */}
        <div className="flex-1 min-w-0 flex flex-col max-h-[90vh]">
          {/* Sticky Header */}
          <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b border-[#18332f]/[0.08] dark:border-white/[0.08] shrink-0">
            <div>
              <h2
                id="book-modal-title"
                className="font-hero-display text-2xl sm:text-[28px] font-semibold tracking-tight text-[#0e5146] dark:text-[#f0ede6] leading-tight"
              >
                {isEditing ? 'Editar libro' : 'Nuevo libro'}
              </h2>
              <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-0.5">
                {isEditing
                  ? 'Actualizá los metadatos de esta edición en el catálogo.'
                  : 'Importá los datos desde Google Books o cargalos manualmente.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5d726c] hover:text-[#18332f] hover:bg-[#18332f]/[0.06] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.08] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
            >
              <X size={18} strokeWidth={1.75} absoluteStrokeWidth />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form
            id="book-modal-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-6 space-y-6"
          >
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#ffedea] dark:bg-[#3a181c] border border-[#ba1a1a]/20 dark:border-[#f87171]/25 text-[#93000a] dark:text-[#fca5a5] text-sm"
              >
                <AlertCircle
                  size={16}
                  strokeWidth={2}
                  absoluteStrokeWidth
                  className="shrink-0 mt-0.5"
                />
                <span>{error}</span>
              </div>
            )}

            {/* Google Books Quick Import */}
            {!isEditing && (
              <div className="relative" ref={dropdownRef}>
                <div className="rounded-2xl bg-[#f3f4ef] dark:bg-[#192824]/70 border border-[#18332f]/[0.08] dark:border-white/[0.08] p-3">
                  <label
                    htmlFor="google-books-search"
                    className="block text-xs font-medium text-[#4a615b] dark:text-[#a6b7b1] mb-2 px-0.5"
                  >
                    Autocompletar desde Google Books
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      strokeWidth={1.75}
                      absoluteStrokeWidth
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5d726c] dark:text-[#a6b7b1] pointer-events-none"
                    />
                    <input
                      ref={searchInputRef}
                      id="google-books-search"
                      type="text"
                      placeholder="Buscá por título, autor o ISBN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowDropdown(true)
                      }}
                      className="w-full h-10 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] pl-9 pr-9 text-sm text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#edbd79]/20 transition-[border-color,box-shadow] duration-150"
                    />
                    {isSearching ? (
                      <Loader2
                        size={16}
                        strokeWidth={2}
                        absoluteStrokeWidth
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0e5146] dark:text-[#edbd79] animate-spin"
                      />
                    ) : (
                      searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setSearchResults([])
                            setShowDropdown(false)
                          }}
                          aria-label="Limpiar búsqueda de Google Books"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5d726c] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] cursor-pointer"
                        >
                          <X size={14} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 inset-x-0 bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.1] dark:border-white/[0.12] shadow-[0_16px_40px_rgba(12,20,18,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] max-h-64 overflow-y-auto overscroll-contain p-1.5 z-50">
                    <ul className="space-y-0.5">
                      {searchResults.map((gBook) => (
                        <li key={gBook.googleBooksId}>
                          <button
                            type="button"
                            onClick={() => handleSelectGoogleBook(gBook)}
                            className="w-full text-left flex items-center gap-3 p-2 rounded-[10px] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] transition-colors duration-150 cursor-pointer"
                          >
                            <div className="w-9 aspect-[2/3] rounded-md bg-[#e7ece5] dark:bg-[#192824] shrink-0 overflow-hidden">
                              {gBook.coverUrl ? (
                                <img
                                  src={gBook.coverUrl}
                                  alt={gBook.title}
                                  className="w-full h-full object-cover rounded-md outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]">
                                  <BookOpen size={14} strokeWidth={1.5} absoluteStrokeWidth />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                                {gBook.title}
                              </p>
                              <p className="text-xs text-[#4a615b] dark:text-[#a6b7b1] truncate">
                                {gBook.author || 'Autor desconocido'}
                              </p>
                              <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums mt-0.5">
                                {[
                                  gBook.publisher,
                                  gBook.publishedYear ? String(gBook.publishedYear) : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Metadatos básicos'}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-[#0e5146] dark:text-[#edbd79] shrink-0 pr-1">
                              Importar
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="book-title"
                  className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                >
                  Título
                </label>
                <input
                  id="book-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ej. Cien años de soledad"
                  className={`${inputBaseClass} h-11 text-base font-medium`}
                />
              </div>

              {/* Authors & Genres */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Authors */}
                <div>
                  <label
                    htmlFor="book-author-input"
                    className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                  >
                    Autores
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="book-author-input"
                      type="text"
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddAuthor(e)
                        }
                      }}
                      placeholder="Nombre del autor"
                      className={inputBaseClass}
                    />
                    <button
                      type="button"
                      onClick={handleAddAuthor}
                      aria-label="Agregar autor"
                      className="h-10 w-10 shrink-0 rounded-xl bg-[#f3f4ef] hover:bg-[#e6ece4] dark:bg-[#192824] dark:hover:bg-[#223631] border border-[#18332f]/15 dark:border-[#293e38] text-[#0e5146] dark:text-[#edbd79] flex items-center justify-center transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
                    >
                      <Plus size={16} strokeWidth={2} absoluteStrokeWidth />
                    </button>
                  </div>
                  {formData.author.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {formData.author.map((a) => (
                        <span
                          key={a}
                          style={{ borderRadius: '9999px' }}
                          className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 text-xs font-medium bg-[#0e5146]/[0.08] text-[#0e5146] dark:bg-[#166e5e]/25 dark:text-[#a8e2d4]"
                        >
                          <span>{a}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(a)}
                            aria-label={`Quitar autor ${a}`}
                            style={{ borderRadius: '9999px' }}
                            className="p-0.5 hover:bg-[#0e5146]/15 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X size={12} strokeWidth={2} absoluteStrokeWidth />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div>
                  <label
                    htmlFor="book-genre-input"
                    className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                  >
                    Géneros
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="book-genre-input"
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddGenre(e)
                        }
                      }}
                      placeholder="Ej. Ficción literaria"
                      className={inputBaseClass}
                    />
                    <button
                      type="button"
                      onClick={handleAddGenre}
                      aria-label="Agregar género"
                      className="h-10 w-10 shrink-0 rounded-xl bg-[#f3f4ef] hover:bg-[#e6ece4] dark:bg-[#192824] dark:hover:bg-[#223631] border border-[#18332f]/15 dark:border-[#293e38] text-[#0e5146] dark:text-[#edbd79] flex items-center justify-center transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
                    >
                      <Plus size={16} strokeWidth={2} absoluteStrokeWidth />
                    </button>
                  </div>
                  {formData.genre.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {formData.genre.map((g) => (
                        <span
                          key={g}
                          style={{ borderRadius: '9999px' }}
                          className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 text-xs font-medium bg-[#f7e4cd]/75 text-[#7a4d16] dark:bg-[#edbd79]/15 dark:text-[#edbd79]"
                        >
                          <span>{g}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(g)}
                            aria-label={`Quitar género ${g}`}
                            style={{ borderRadius: '9999px' }}
                            className="p-0.5 hover:bg-[#c9833b]/20 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X size={12} strokeWidth={2} absoluteStrokeWidth />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cover URL */}
              <div>
                <label
                  htmlFor="book-img"
                  className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                >
                  URL de la portada
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="book-img"
                    type="url"
                    name="img"
                    value={formData.img}
                    onChange={handleChange}
                    placeholder="https://..."
                    className={inputBaseClass}
                  />
                  {/* Compact preview on mobile */}
                  {previewImg && (
                    <img
                      src={previewImg}
                      alt="Miniatura"
                      className="md:hidden w-8 aspect-[2/3] rounded object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                      onError={() => setPreviewImg('')}
                    />
                  )}
                </div>
              </div>

              {/* Pages, Year, Editorial */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="book-pages"
                    className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                  >
                    Páginas
                  </label>
                  <input
                    id="book-pages"
                    type="number"
                    name="pages"
                    min={1}
                    value={formData.pages}
                    onChange={handleChange}
                    placeholder="432"
                    className={`${inputBaseClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="book-year"
                    className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                  >
                    Año
                  </label>
                  <input
                    id="book-year"
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2024"
                    className={`${inputBaseClass} tabular-nums`}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="book-editorial"
                    className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                  >
                    Editorial
                  </label>
                  <input
                    id="book-editorial"
                    type="text"
                    name="editorial"
                    value={formData.editorial}
                    onChange={handleChange}
                    placeholder="Salamandra"
                    className={inputBaseClass}
                  />
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <label
                  htmlFor="book-sinopsis"
                  className="block text-sm font-medium text-[#18332f] dark:text-[#f0ede6] mb-1.5"
                >
                  Sinopsis
                </label>
                <textarea
                  id="book-sinopsis"
                  name="sinopsis"
                  value={formData.sinopsis}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Breve descripción editorial del libro..."
                  className="w-full rounded-xl bg-white dark:bg-[#192824] border border-[#18332f]/15 dark:border-[#293e38] px-3.5 py-2.5 text-sm leading-relaxed text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#edbd79]/20 resize-none transition-[border-color,box-shadow] duration-150"
                />
              </div>
            </div>
          </form>

          {/* Sticky Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-[#18332f]/[0.08] dark:border-white/[0.08] bg-[#f8f7f2]/80 dark:bg-[#101a17]/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-1.5 ps-2.5 pe-3 py-2 rounded-xl text-xs font-medium text-[#5d726c] hover:text-[#18332f] hover:bg-[#18332f]/[0.05] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.06] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
            >
              <RotateCcw size={14} strokeWidth={1.75} absoluteStrokeWidth />
              <span>Restablecer</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl text-sm font-medium text-[#4a615b] dark:text-[#a6b7b1] bg-white dark:bg-[#192824] border border-[#18332f]/15 dark:border-[#293e38] hover:bg-[#f3f4ef] dark:hover:bg-[#223631] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="book-modal-form"
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-[#0e5146] hover:bg-[#0c453c] dark:bg-[#166e5e] dark:hover:bg-[#1b806e] text-white text-sm font-semibold inline-flex items-center gap-2 transition-[background-color,transform,opacity] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
              >
                {loading && (
                  <Loader2
                    size={15}
                    strokeWidth={2}
                    absoluteStrokeWidth
                    className="animate-spin"
                  />
                )}
                <span>
                  {loading
                    ? 'Guardando...'
                    : isEditing
                      ? 'Guardar cambios'
                      : 'Crear libro'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
