import { useState, useEffect, useRef } from 'react'
import { createBook, updateBook, searchGoogleBooks } from '../../api/books'

export default function BookModal({ book, onClose, onSave }) {
  const isEditing = !!book

  const getInitialFormData = () => {
    if (book) {
      return {
        title: book.title || '',
        author: Array.isArray(book.author) ? book.author : book.author ? [book.author] : [],
        genre: Array.isArray(book.genre) ? book.genre : book.genre ? [book.genre] : [],
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

  // Google Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Debounce search
  useEffect(() => {
    const id = setTimeout(async () => {
      if (searchQuery.trim().length > 3 && !isEditing) {
        setIsSearching(true)
        try {
          const res = await searchGoogleBooks(searchQuery.trim())
          setSearchResults(res.data || [])
          setShowDropdown(true)
        } catch {
          setSearchResults([])
        }
        setIsSearching(false)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 1000)
    return () => clearTimeout(id)
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
      img: gBook.coverUrl || ''
    })
    setPreviewImg(gBook.coverUrl || '')
    setShowDropdown(false)
    setSearchQuery('')
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
    if (authorInput.trim() && !formData.author.includes(authorInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        author: [...prev.author, authorInput.trim()],
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
    if (genreInput.trim() && !formData.genre.includes(genreInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        genre: [...prev.genre, genreInput.trim()],
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
    setAuthorInput('')
    setGenreInput('')
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate required fields
    const pages = parseInt(formData.pages) || 1
    const year = parseInt(formData.year) || new Date().getFullYear()

    if (!formData.title || formData.title.length < 2) {
      setError('El título debe tener al menos 2 caracteres')
      setLoading(false)
      return
    }
    if (pages < 1) {
      setError('Las páginas deben ser un número positivo')
      setLoading(false)
      return
    }
    if (!formData.editorial || formData.editorial.length < 2) {
      setError('La editorial debe tener al menos 2 caracteres')
      setLoading(false)
      return
    }
    if (!formData.sinopsis || formData.sinopsis.length < 2) {
      setError('La sinopsis debe tener al menos 2 caracteres')
      setLoading(false)
      return
    }
    if (formData.author.length === 0) {
      setError('Al menos un autor es requerido')
      setLoading(false)
      return
    }
    if (formData.genre.length === 0) {
      setError('Al menos un género es requerido')
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
          pages: pages,
          publishedYear: year,
          synopsis: formData.sinopsis,
          coverUrl: formData.img || undefined,
        }
        await createBook(payload)
      }
      onSave()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al guardar el libro')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#1c1c16]/30 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_20px_60px_rgba(28,28,22,0.15)] flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#82746d] hover:text-[#412817] z-10"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Sidebar Preview */}
        <div className="hidden md:block w-1/3 bg-[#f7f3ea] p-10 space-y-8">
          <div className="space-y-4">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[#82746d]">
              Vista Previa
            </p>
            <div className="aspect-[3/4] bg-[#ece8df] relative overflow-hidden shadow-md">
              {previewImg ? (
                <img
                  src={previewImg}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewImg('')}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#d3c3bb] p-6 text-center">
                  <span className="material-symbols-outlined text-4xl mb-2">
                    auto_stories
                  </span>
                  <p className="text-xs font-body">
                    La portada aparecerá aquí cuando ingreses la URL
                  </p>
                </div>
              )}
              {/* Book spine effect */}
              <div className="absolute left-0 inset-y-0 w-2 bg-black/5"></div>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-[#412817] italic">
              Notas Editoriales
            </h4>
            <p className="font-body text-sm text-[#50453e] leading-relaxed">
              Asegurate de que todos los metadatos coincidan. Se requiere verificación manual de la portada para evitar enlaces rotos.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <header className="mb-10">
            <h3 className="text-3xl font-serif font-black text-[#412817] leading-tight">
              {isEditing ? 'Editar Libro' : 'Añadir Nuevo Libro'}
            </h3>
            <p className="text-[#50453e] font-body mt-2">
              Actualizá el catálogo digital con nuevas adquisiciones.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-[#ffdad6] text-[#93000a] rounded text-sm font-body">
              {error}
            </div>
          )}

          {!isEditing && (
            <div className="mb-8 relative" ref={dropdownRef}>
              <div className="flex items-center bg-[#412817] text-white rounded shadow-md px-4 py-3 gap-3">
                <span className="material-symbols-outlined text-lg">search</span>
                <input
                  type="text"
                  placeholder="Buscar en Google Books para autocompletar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                  className="bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 w-full font-body text-sm outline-none"
                />
                {isSearching && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
              </div>

              {/* Google Books Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white shadow-xl border border-[#d3c3bb]/30 rounded max-h-64 overflow-y-auto z-50">
                  <ul className="divide-y divide-[#d3c3bb]/10">
                    {searchResults.map((gBook) => (
                      <li
                        key={gBook.googleBooksId}
                        onClick={() => handleSelectGoogleBook(gBook)}
                        className="flex gap-4 p-3 hover:bg-[#f7f3ea] cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-14 bg-[#ece8df] flex-shrink-0">
                          {gBook.coverUrl ? (
                            <img src={gBook.coverUrl} alt={gBook.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#d3c3bb] text-[10px]">Sin<br/>Imagen</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-sm text-[#412817] truncate">{gBook.title}</p>
                          <p className="text-xs font-body text-[#50453e] truncate">{gBook.author}</p>
                          <p className="text-[10px] font-label text-[#82746d] uppercase mt-1">Año: {gBook.publishedYear || 'N/A'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Info */}
            <div className="space-y-6">
              <div className="relative group">
                <label className="block font-serif font-bold text-[#412817] mb-2 italic transition-colors duration-200 group-focus-within:text-[#745a34]">
                  Título
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-serif text-xl py-3 px-1 placeholder:text-[#d3c3bb] transition-all duration-300"
                    placeholder="Harry Potter y la piedra filosofal"
                  />
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Author with chips */}
                <div className="relative group">
                  <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                    Autor
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={authorInput}
                        onChange={(e) => setAuthorInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddAuthor(e))
                        }
                        className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 transition-all duration-300"
                        placeholder="J.K. Rowling"
                      />
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAuthor}
                      className="text-[#412817] hover:text-[#c2a878] active:scale-90 transition-all duration-200"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>
                  {formData.author.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.author.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#fedaaa] hover:bg-[#f5d89a] text-[#795e38] text-xs font-label transition-colors duration-200"
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(a)}
                            className="hover:text-[#ba1a1a] active:scale-90 transition-all duration-200"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Genre with chips */}
                <div className="relative group">
                  <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                    Género
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddGenre(e))
                        }
                        className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 transition-all duration-300"
                        placeholder="Fantasía"
                      />
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGenre}
                      className="text-[#412817] hover:text-[#c2a878] active:scale-90 transition-all duration-200"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                    </button>
                  </div>
                  {formData.genre.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.genre.map((g) => (
                        <span
                          key={g}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#fedaaa] hover:bg-[#f5d89a] text-[#795e38] text-xs font-label transition-colors duration-200"
                        >
                          {g}
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(g)}
                            className="hover:text-[#ba1a1a] active:scale-90 transition-all duration-200"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative group">
                <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                  URL de la Portada
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="img"
                    value={formData.img}
                    onChange={handleChange}
                    className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 text-sm transition-all duration-300"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="relative group">
                  <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                    Páginas
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="pages"
                      value={formData.pages}
                      onChange={handleChange}
                      className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 transition-all duration-300"
                      placeholder="512"
                    />
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                  </div>
                </div>
                <div className="relative group">
                  <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                    Año
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 transition-all duration-300"
                      placeholder="1997"
                    />
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                  </div>
                </div>
                <div className="relative col-span-2 md:col-span-1 group">
                  <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors duration-200 group-focus-within:text-[#412817]">
                    Editorial
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="editorial"
                      value={formData.editorial}
                      onChange={handleChange}
                      className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-2 px-1 transition-all duration-300"
                      placeholder="Salamandra"
                    />
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <label className="block font-serif font-bold text-[#412817] mb-2 italic transition-colors duration-200 group-focus-within:text-[#745a34]">
                  Sinopsis
                </label>
                <div className="relative">
                  <textarea
                    name="sinopsis"
                    value={formData.sinopsis}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-3 px-1 resize-none leading-relaxed transition-all duration-300"
                  />
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-focus-within:w-full"></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 flex items-center justify-end gap-6 border-t border-[#d3c3bb]/20">
              <button
                type="button"
                onClick={handleClearForm}
                className="text-[#412817] font-body font-semibold text-sm hover:text-[#745a34] hover:underline underline-offset-4 transition-all duration-200"
              >
                Limpiar Formulario
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-10 py-4 rounded font-body font-bold text-sm tracking-widest shadow-lg hover:shadow-xl hover:brightness-110 hover:scale-[1.02] active:scale-95 active:brightness-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'GUARDANDO...'
                  : isEditing
                  ? 'ACTUALIZAR LIBRO'
                  : 'CREAR LIBRO'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
