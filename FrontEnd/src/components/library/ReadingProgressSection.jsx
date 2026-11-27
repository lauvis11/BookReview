import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Plus,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { getBooks } from '../../api/books'
import {
  DEFAULT_PAGES_PER_HOUR,
  computeBookProgressFromState,
  getTodayDateStr,
  logPagesReadRemote,
  resolveBookId,
  resolveBookTotalPages,
  useReadingTracker,
} from '../../utils/readingTrackerStore'

const QUICK_PAGE_PRESETS = [10, 20, 30, 50]

function formatAuthor(author) {
  if (Array.isArray(author)) {
    const joined = author.filter(Boolean).join(', ')
    return joined || 'Autor desconocido'
  }
  return author || 'Autor desconocido'
}

function formatLogDate(dateStr, todayStr) {
  if (!dateStr) return ''
  if (dateStr === todayStr) return 'Hoy'

  const [y, m, d] = String(dateStr).split('-').map(Number)
  if (!y || !m || !d) return dateStr

  const todayParts = String(todayStr).split('-').map(Number)
  const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2])
  const targetDate = new Date(y, m - 1, d)
  const diffDays = Math.round((todayDate - targetDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Ayer'

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
  }).format(targetDate)
}

function normalizeCandidateBook(book, sourceLabel) {
  const bookId = resolveBookId(book)
  if (!bookId) return null
  return {
    id: bookId,
    bookId,
    title: book.title || 'Libro sin título',
    author: formatAuthor(book.author),
    img: book.img || null,
    pages: book.pages ?? book.totalPages ?? null,
    sourceLabel,
  }
}

function LogPagesModal({
  userId,
  trackerState,
  candidateBooks,
  initialBookId,
  readingIds,
  completedIds,
  onClose,
  onSuccess,
}) {
  const [catalogFallback, setCatalogFallback] = useState([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(false)

  const allOptions = useMemo(() => {
    const map = new Map()
    for (const item of candidateBooks) {
      if (item?.bookId && !map.has(item.bookId)) {
        map.set(item.bookId, item)
      }
    }
    for (const item of catalogFallback) {
      if (item?.bookId && !map.has(item.bookId)) {
        map.set(item.bookId, item)
      }
    }
    return Array.from(map.values())
  }, [candidateBooks, catalogFallback])

  const [selectedBookId, setSelectedBookId] = useState(() => {
    if (initialBookId && candidateBooks.some((b) => b.bookId === String(initialBookId))) {
      return String(initialBookId)
    }
    if (initialBookId && trackerState.booksProgress?.[String(initialBookId)]) {
      return String(initialBookId)
    }
    const firstNonCompleted = candidateBooks.find((b) => {
      const progress = computeBookProgressFromState(trackerState, b)
      return !progress.isCompleted
    })
    return firstNonCompleted?.bookId || candidateBooks[0]?.bookId || ''
  })

  const [mode, setMode] = useState('add')
  const [pagesInput, setPagesInput] = useState(() => {
    const initialOption =
      candidateBooks.find((b) => b.bookId === String(initialBookId || '')) ||
      candidateBooks.find((b) => !computeBookProgressFromState(trackerState, b).isCompleted) ||
      candidateBooks[0]
    if (!initialOption) return '20'
    const prog = computeBookProgressFromState(trackerState, initialOption)
    if (prog.remainingPages > 0) {
      return String(Math.min(20, prog.remainingPages))
    }
    return '10'
  })
  const [minutesInput, setMinutesInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, submitting])

  useEffect(() => {
    if (candidateBooks.length > 0 || catalogLoaded) return
    let cancelled = false

    const loadFallbackCatalog = async () => {
      setLoadingCatalog(true)
      try {
        const { data } = await getBooks({ limit: 25 })
        if (cancelled) return
        const items = Array.isArray(data)
          ? data
              .map((book) => normalizeCandidateBook(book, 'Catálogo'))
              .filter(Boolean)
          : []
        setCatalogFallback(items)
        setCatalogLoaded(true)
        if (items.length > 0) {
          setSelectedBookId((prev) => prev || items[0].bookId)
        }
      } catch {
        if (!cancelled) {
          setCatalogFallback([])
          setCatalogLoaded(true)
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false)
      }
    }

    loadFallbackCatalog()
    return () => {
      cancelled = true
    }
  }, [candidateBooks.length, catalogLoaded])

  const handleLoadMoreFromCatalog = async () => {
    if (loadingCatalog || catalogLoaded) return
    setLoadingCatalog(true)
    try {
      const { data } = await getBooks({ limit: 25 })
      const items = Array.isArray(data)
        ? data
            .map((book) => normalizeCandidateBook(book, 'Catálogo'))
            .filter(Boolean)
        : []
      setCatalogFallback(items)
      setCatalogLoaded(true)
      if (!selectedBookId && items.length > 0) {
        setSelectedBookId(items[0].bookId)
      }
    } catch {
      setCatalogLoaded(true)
    } finally {
      setLoadingCatalog(false)
    }
  }

  const selectedBook = useMemo(() => {
    const found = allOptions.find((b) => b.bookId === selectedBookId)
    if (found) return found
    if (selectedBookId && trackerState.booksProgress?.[selectedBookId]) {
      const entry = trackerState.booksProgress[selectedBookId]
      return {
        id: selectedBookId,
        bookId: selectedBookId,
        title: entry.title || 'Libro sin título',
        author: entry.author || 'Autor desconocido',
        img: entry.img || null,
        pages: entry.totalPages,
        sourceLabel: 'En progreso',
      }
    }
    return null
  }, [allOptions, selectedBookId, trackerState.booksProgress])

  const currentProgress = useMemo(() => {
    if (!selectedBook) {
      return {
        pagesRead: 0,
        totalPages: 250,
        remainingPages: 250,
        percentage: 0,
        isCompleted: false,
      }
    }
    return computeBookProgressFromState(trackerState, selectedBook)
  }, [selectedBook, trackerState])

  const handleSelectBookChange = (nextId) => {
    setSelectedBookId(nextId)
    setErrorMsg('')
    const nextBook = allOptions.find((b) => b.bookId === nextId)
    const nextProg = nextBook ? computeBookProgressFromState(trackerState, nextBook) : null
    if (!nextProg) return
    if (mode === 'add') {
      setPagesInput(
        nextProg.remainingPages > 0 ? String(Math.min(20, nextProg.remainingPages)) : '0'
      )
    } else {
      setPagesInput(
        String(
          Math.min(nextProg.totalPages, nextProg.pagesRead + Math.min(20, nextProg.remainingPages))
        )
      )
    }
  }

  const handleSwitchMode = (nextMode) => {
    setMode(nextMode)
    setErrorMsg('')
    if (nextMode === 'add') {
      setPagesInput(
        currentProgress.remainingPages > 0
          ? String(Math.min(20, currentProgress.remainingPages))
          : '0'
      )
    } else {
      setPagesInput(
        String(
          Math.min(
            currentProgress.totalPages,
            currentProgress.pagesRead + Math.min(20, currentProgress.remainingPages)
          )
        )
      )
    }
  }

  const parsedValue = Math.max(0, Math.round(Number(pagesInput) || 0))
  const nextPagesRead =
    mode === 'set'
      ? Math.min(currentProgress.totalPages, parsedValue)
      : Math.min(currentProgress.totalPages, currentProgress.pagesRead + parsedValue)
  const previewDelta = Math.max(0, nextPagesRead - currentProgress.pagesRead)
  const previewPercentage =
    currentProgress.totalPages > 0
      ? Math.min(100, Math.round((nextPagesRead / currentProgress.totalPages) * 100))
      : 0

  const pagesPerHour = trackerState.preferences?.pagesPerHour || DEFAULT_PAGES_PER_HOUR
  const estimatedMinutes =
    previewDelta > 0 ? Math.max(1, Math.round((previewDelta * 60) / pagesPerHour)) : 0

  const canSubmit = Boolean(selectedBook) && previewDelta > 0 && !submitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit || !selectedBook) return

    setSubmitting(true)
    setErrorMsg('')

    try {
      const parsedMinutes = Number(minutesInput) > 0 ? Math.round(Number(minutesInput)) : undefined
      const result = await logPagesReadRemote(userId, {
        book: selectedBook,
        mode,
        pagesInput: parsedValue,
        minutesSpent: parsedMinutes,
      })

      if (result.pagesDelta <= 0) {
        setErrorMsg('Ingresá una cantidad de páginas mayor para sumar avance hoy.')
        setSubmitting(false)
        return
      }

      const idStr = String(selectedBook.bookId)
      const isAlreadyReading = readingIds.has(idStr)
      const isAlreadyCompleted = completedIds.has(idStr)
      const shouldRefreshCollections = Boolean(
        result.statusChanged || result.justCompleted || (!isAlreadyReading && !isAlreadyCompleted)
      )

      await onSuccess(result, selectedBook, shouldRefreshCollections)
    } catch {
      setErrorMsg('No se pudo guardar el avance en el servidor. Intentá nuevamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => {
          if (!submitting) onClose()
        }}
        className="absolute inset-0 bg-[#0c1412]/45 dark:bg-black/65 backdrop-blur-[4px]"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-pages-modal-title"
        className="relative z-10 w-full max-w-[500px] max-h-[90vh] overflow-y-auto overscroll-contain bg-white dark:bg-[#131f1c] border border-black/[0.08] dark:border-white/[0.1] rounded-[24px] shadow-[0_24px_64px_-16px_rgba(12,20,18,0.28)] dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.07] dark:border-white/[0.08]">
          <div>
            <h3
              id="log-pages-modal-title"
              className="font-hero-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#152e29] dark:text-[#f0ede6] leading-tight"
            >
              Registrar páginas leídas
            </h3>
            <p className="mt-1 font-hero-sans text-[13px] text-[#5c726c] dark:text-[#a6b7b1]">
              Sumá tu lectura de hoy para actualizar el avance y tu racha.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar ventana"
            style={{ borderRadius: '9999px' }}
            className="size-8 flex items-center justify-center shrink-0 text-[#5c726c] hover:text-[#152e29] hover:bg-black/[0.05] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.08] transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
          >
            <X size={17} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Selector de libro */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="tracker-book-select"
                className="font-hero-sans text-[13px] font-medium text-[#152e29] dark:text-[#f0ede6]"
              >
                Libro
              </label>
              {!catalogLoaded && candidateBooks.length > 0 && (
                <button
                  type="button"
                  onClick={handleLoadMoreFromCatalog}
                  disabled={loadingCatalog}
                  className="font-hero-sans text-[12px] font-semibold text-[#0e5146] hover:text-[#166e5e] dark:text-[#4fb39d] dark:hover:text-[#73cbb8] transition-[color] duration-150 cursor-pointer"
                >
                  {loadingCatalog ? 'Cargando catálogo...' : '+ Incluir catálogo'}
                </button>
              )}
            </div>

            <select
              id="tracker-book-select"
              value={selectedBookId}
              onChange={(e) => handleSelectBookChange(e.target.value)}
              disabled={loadingCatalog && allOptions.length === 0}
              className="w-full h-11 px-3.5 rounded-[12px] bg-[#f8f7f2] dark:bg-[#192824] border border-black/[0.12] dark:border-white/[0.12] font-hero-sans text-[14px] text-[#152e29] dark:text-[#f0ede6] focus:outline-none focus:border-[#0e5146] dark:focus:border-[#4fb39d] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#4fb39d]/20"
            >
              {allOptions.length === 0 ? (
                <option value="" className="bg-white dark:bg-[#131f1c]">
                  {loadingCatalog ? 'Buscando libros...' : 'No hay libros disponibles'}
                </option>
              ) : (
                allOptions.map((book) => {
                  const prog = computeBookProgressFromState(trackerState, book)
                  return (
                    <option
                      key={book.bookId}
                      value={book.bookId}
                      className="bg-white dark:bg-[#131f1c] text-[#152e29] dark:text-[#f0ede6]"
                    >
                      {book.title} ({prog.percentage}% · {book.sourceLabel})
                    </option>
                  )
                })
              )}
            </select>
          </div>

          {/* Vista previa del libro elegido (radios concéntricos: 14px contenedor, 3.5px/6px portada) */}
          {selectedBook && (
            <div className="rounded-[14px] bg-[#f6f4ee] dark:bg-[#192824] border border-black/[0.06] dark:border-white/[0.07] p-3.5 flex items-center gap-3.5">
              <div className="w-11 aspect-[2/3] rounded-[6px] overflow-hidden shrink-0 bg-[#eae6da] dark:bg-[#223530] outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10">
                {selectedBook.img ? (
                  <img
                    src={selectedBook.img}
                    alt={`Portada de ${selectedBook.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#0e5146]/40 dark:text-[#4fb39d]/40">
                    <BookOpen size={17} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-hero-sans text-[14px] font-semibold text-[#152e29] dark:text-[#f0ede6] truncate">
                  {selectedBook.title}
                </p>
                <p className="font-hero-sans text-[12px] text-[#5c726c] dark:text-[#a6b7b1] truncate">
                  {selectedBook.author}
                </p>
                <div className="mt-2 flex items-center justify-between text-[12px] font-hero-sans tabular-nums">
                  <span className="text-[#5c726c] dark:text-[#a6b7b1]">
                    <strong className="text-[#152e29] dark:text-[#f0ede6] font-semibold">
                      {currentProgress.pagesRead}
                    </strong>{' '}
                    / {currentProgress.totalPages} págs.
                  </span>
                  <span className="font-semibold text-[#0e5146] dark:text-[#4fb39d]">
                    {currentProgress.remainingPages} rest. · {currentProgress.percentage}%
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full bg-black/[0.08] dark:bg-white/[0.1] overflow-hidden"
                  style={{ borderRadius: '9999px' }}
                >
                  <div
                    className="h-full bg-[#0e5146] dark:bg-[#4fb39d] transition-[width] duration-300 ease-out"
                    style={{
                      width: `${currentProgress.percentage}%`,
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Control segmentado estilo Apple (12px exterior = 8px interior + 4px padding) */}
          <div>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-[12px] bg-[#f0eee6] dark:bg-[#192824] border border-black/[0.05] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => handleSwitchMode('add')}
                className={`h-9 px-3 rounded-[8px] font-hero-sans text-[13px] transition-[background-color,color,box-shadow,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer ${
                  mode === 'add'
                    ? 'bg-white dark:bg-[#243832] text-[#152e29] dark:text-[#f0ede6] font-semibold shadow-[0_1px_3px_rgba(12,20,18,0.08)] dark:shadow-none'
                    : 'text-[#5c726c] hover:text-[#152e29] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] font-medium'
                }`}
              >
                Sumar páginas
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('set')}
                className={`h-9 px-3 rounded-[8px] font-hero-sans text-[13px] transition-[background-color,color,box-shadow,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer ${
                  mode === 'set'
                    ? 'bg-white dark:bg-[#243832] text-[#152e29] dark:text-[#f0ede6] font-semibold shadow-[0_1px_3px_rgba(12,20,18,0.08)] dark:shadow-none'
                    : 'text-[#5c726c] hover:text-[#152e29] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] font-medium'
                }`}
              >
                Página actual
              </button>
            </div>

            {mode === 'add' ? (
              <div className="mt-3.5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_PAGE_PRESETS.map((amount) => {
                    const effective =
                      currentProgress.remainingPages > 0
                        ? Math.min(amount, currentProgress.remainingPages)
                        : amount
                    const isSelected = Number(pagesInput) === effective && effective > 0
                    return (
                      <button
                        key={amount}
                        type="button"
                        disabled={currentProgress.isCompleted}
                        onClick={() => setPagesInput(String(effective))}
                        style={{ borderRadius: '9999px' }}
                        className={`px-3.5 h-8 font-hero-sans text-[12px] font-semibold tabular-nums border transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-[#0e5146] dark:bg-[#166e5e] text-white border-[#0e5146] dark:border-[#166e5e]'
                            : 'bg-white dark:bg-[#192824] text-[#152e29] dark:text-[#f0ede6] border-black/[0.1] dark:border-white/[0.1] hover:border-[#0e5146]/45 dark:hover:border-[#4fb39d]/50'
                        }`}
                      >
                        +{amount} págs.
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label
                    htmlFor="tracker-pages-add-input"
                    className="block font-hero-sans text-[12.5px] font-medium text-[#5c726c] dark:text-[#a6b7b1] mb-1.5"
                  >
                    ¿Cuántas páginas leíste en esta sesión?
                  </label>
                  <input
                    id="tracker-pages-add-input"
                    type="number"
                    min={1}
                    max={Math.max(1, currentProgress.remainingPages || currentProgress.totalPages)}
                    value={pagesInput}
                    disabled={currentProgress.isCompleted}
                    onChange={(e) => setPagesInput(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[12px] bg-[#f8f7f2] dark:bg-[#192824] border border-black/[0.12] dark:border-white/[0.12] font-hero-sans text-[15px] font-semibold tabular-nums text-[#152e29] dark:text-[#f0ede6] focus:outline-none focus:border-[#0e5146] dark:focus:border-[#4fb39d] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#4fb39d]/20 disabled:opacity-50"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3.5">
                <label
                  htmlFor="tracker-pages-set-input"
                  className="block font-hero-sans text-[12.5px] font-medium text-[#5c726c] dark:text-[#a6b7b1] mb-1.5"
                >
                  ¿En qué página te quedaste? (actual: {currentProgress.pagesRead} de{' '}
                  {currentProgress.totalPages})
                </label>
                <input
                  id="tracker-pages-set-input"
                  type="number"
                  min={0}
                  max={currentProgress.totalPages}
                  value={pagesInput}
                  disabled={currentProgress.isCompleted}
                  onChange={(e) => setPagesInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[12px] bg-[#f8f7f2] dark:bg-[#192824] border border-black/[0.12] dark:border-white/[0.12] font-hero-sans text-[15px] font-semibold tabular-nums text-[#152e29] dark:text-[#f0ede6] focus:outline-none focus:border-[#0e5146] dark:focus:border-[#4fb39d] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#4fb39d]/20 disabled:opacity-50"
                />
              </div>
            )}

            {/* Resumen del cálculo */}
            {selectedBook && (
              <div className="mt-3 rounded-[12px] bg-[#f6f4ee] dark:bg-[#192824] border border-black/[0.05] dark:border-white/[0.06] px-3.5 py-2.5 flex items-center justify-between gap-2 text-[12.5px] font-hero-sans">
                {currentProgress.isCompleted ? (
                  <span className="text-[#8d571b] dark:text-[#edbd79] font-medium">
                    Este libro ya está completado al 100%. Elegí otro libro para seguir sumando páginas.
                  </span>
                ) : previewDelta > 0 ? (
                  <>
                    <span className="text-[#5c726c] dark:text-[#a6b7b1]">
                      Nuevo avance:{' '}
                      <strong className="text-[#152e29] dark:text-[#f0ede6] tabular-nums font-semibold">
                        {nextPagesRead} / {currentProgress.totalPages} págs. ({previewPercentage}%)
                      </strong>
                    </span>
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="px-2.5 py-0.5 bg-[#0e5146]/10 dark:bg-[#4fb39d]/15 text-[#0e5146] dark:text-[#4fb39d] font-semibold tabular-nums shrink-0"
                    >
                      +{previewDelta} págs.
                    </span>
                  </>
                ) : (
                  <span className="text-[#8d571b] dark:text-[#edbd79]">
                    Ingresá una página mayor a {currentProgress.pagesRead} para registrar avance hoy.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Minutos opcionales */}
          <div>
            <label
              htmlFor="tracker-minutes-input"
              className="block font-hero-sans text-[12.5px] font-medium text-[#5c726c] dark:text-[#a6b7b1] mb-1.5"
            >
              Tiempo dedicado (opcional, en minutos)
            </label>
            <input
              id="tracker-minutes-input"
              type="number"
              min={1}
              max={600}
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              placeholder={
                estimatedMinutes > 0
                  ? `Estimado automático: ~${estimatedMinutes} min`
                  : 'Se calcula automáticamente si lo dejás vacío'
              }
              className="w-full h-10 px-3.5 rounded-[12px] bg-[#f8f7f2] dark:bg-[#192824] border border-black/[0.12] dark:border-white/[0.12] font-hero-sans text-[14px] text-[#152e29] dark:text-[#f0ede6] placeholder:text-[#7c908a] dark:placeholder:text-[#738882] focus:outline-none focus:border-[#0e5146] dark:focus:border-[#4fb39d] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#4fb39d]/20"
            />
          </div>

          {errorMsg && (
            <p className="font-hero-sans text-[12.5px] font-medium text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6]/55 dark:bg-[#93000a]/30 border border-[#ba1a1a]/25 dark:border-[#ffb4ab]/25 rounded-[10px] px-3.5 py-2.5">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-[12px] border border-black/[0.1] dark:border-white/[0.12] bg-white hover:bg-[#f4f2eb] dark:bg-[#192824] dark:hover:bg-[#223530] text-[#4a615b] hover:text-[#152e29] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] font-hero-sans text-[13px] font-semibold transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-10 ps-4 pe-4.5 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color,transform,opacity] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Flame size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              <span>{submitting ? 'Guardando...' : 'Guardar avance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ReadingProgressSection({
  userId,
  readingBooks = [],
  wantToReadBooks = [],
  completedBooks = [],
  favoriteBooks = [],
  openLogModalSignal,
  isLogModalOpen,
  initialBookId = '',
  onOpenLogModal,
  onCloseLogModal,
  onStatusSynced,
}) {
  const { trackerState, booksProgress, logs, streakStats } = useReadingTracker(userId)

  const isControlledModal = typeof isLogModalOpen === 'boolean'
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  const [internalBookId, setInternalBookId] = useState('')
  const [dismissedSignalKey, setDismissedSignalKey] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const signalActive = Boolean(
    openLogModalSignal?.key && openLogModalSignal.key !== dismissedSignalKey
  )
  const modalOpen = isControlledModal ? isLogModalOpen : internalModalOpen || signalActive
  const resolvedInitialBookId = isControlledModal
    ? initialBookId
    : openLogModalSignal?.bookId || internalBookId

  const openModal = (bookId = '') => {
    if (onOpenLogModal) {
      onOpenLogModal(bookId)
      return
    }
    setInternalBookId(bookId ? String(bookId) : '')
    setInternalModalOpen(true)
  }

  const closeModal = () => {
    if (onCloseLogModal) {
      onCloseLogModal()
      return
    }
    if (openLogModalSignal?.key) {
      setDismissedSignalKey(openLogModalSignal.key)
    }
    setInternalModalOpen(false)
    setInternalBookId('')
  }

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => {
      setFeedback(null)
    }, 5500)
    return () => clearTimeout(timer)
  }, [feedback])

  const todayStr = getTodayDateStr()

  const readingIds = useMemo(
    () => new Set(readingBooks.map(resolveBookId).filter(Boolean)),
    [readingBooks]
  )
  const completedIds = useMemo(
    () => new Set(completedBooks.map(resolveBookId).filter(Boolean)),
    [completedBooks]
  )

  const inProgressBooks = useMemo(() => {
    const mergedMap = new Map()

    for (const book of readingBooks) {
      const bookId = resolveBookId(book)
      if (!bookId) continue
      const progress = computeBookProgressFromState(trackerState, book)
      mergedMap.set(bookId, {
        bookId,
        title: book.title || trackerState.booksProgress?.[bookId]?.title || 'Libro sin título',
        author: formatAuthor(book.author ?? trackerState.booksProgress?.[bookId]?.author),
        img: book.img || trackerState.booksProgress?.[bookId]?.img || null,
        totalPages: progress.totalPages,
        progress,
        completedToday: progress.isCompleted && progress.completedAt === todayStr,
      })
    }

    for (const entry of Object.values(booksProgress || {})) {
      const bookId = resolveBookId(entry)
      if (!bookId || mergedMap.has(bookId)) continue
      const progress = computeBookProgressFromState(trackerState, entry)
      const isMarkedCompletedElsewhere = completedIds.has(bookId)
      const completedToday = progress.isCompleted && entry?.completedAt === todayStr

      if ((!progress.isCompleted && !isMarkedCompletedElsewhere) || completedToday) {
        mergedMap.set(bookId, {
          bookId,
          title: entry.title || 'Libro sin título',
          author: formatAuthor(entry.author),
          img: entry.img || null,
          totalPages: resolveBookTotalPages(entry),
          progress,
          completedToday,
        })
      }
    }

    return Array.from(mergedMap.values()).sort((a, b) => {
      if (a.progress.isCompleted !== b.progress.isCompleted) {
        return Number(a.progress.isCompleted) - Number(b.progress.isCompleted)
      }
      const dateA = a.progress.lastReadDate || ''
      const dateB = b.progress.lastReadDate || ''
      if (dateA !== dateB) return dateB.localeCompare(dateA)
      return b.progress.pagesRead - a.progress.pagesRead
    })
  }, [readingBooks, booksProgress, trackerState, completedIds, todayStr])

  const candidateBooks = useMemo(() => {
    const map = new Map()
    const pushList = (list, label) => {
      for (const rawBook of list || []) {
        const normalized = normalizeCandidateBook(rawBook, label)
        if (!normalized) continue
        if (!map.has(normalized.bookId)) {
          const prog = computeBookProgressFromState(trackerState, normalized)
          if (!prog.isCompleted) {
            map.set(normalized.bookId, normalized)
          }
        }
      }
    }

    pushList(readingBooks, 'Leyendo')

    for (const entry of Object.values(booksProgress || {})) {
      const normalized = normalizeCandidateBook(entry, 'En progreso')
      if (!normalized || map.has(normalized.bookId)) continue
      const prog = computeBookProgressFromState(trackerState, normalized)
      if (!prog.isCompleted && !completedIds.has(normalized.bookId)) {
        map.set(normalized.bookId, normalized)
      }
    }

    pushList(wantToReadBooks, 'Por leer')
    pushList(favoriteBooks, 'Favoritos')

    return Array.from(map.values())
  }, [readingBooks, booksProgress, wantToReadBooks, favoriteBooks, trackerState, completedIds])

  const recentLogs = useMemo(() => (logs || []).slice(0, 5), [logs])
  const activeLast7Count = useMemo(
    () => streakStats.last7Days.filter((day) => day.active).length,
    [streakStats.last7Days]
  )

  const handleLogSuccess = async (result, book, shouldSyncCollections) => {
    closeModal()
    if (shouldSyncCollections && onStatusSynced) {
      await onStatusSynced()
    }
    setFeedback({
      id: Date.now(),
      type: result.justCompleted ? 'completed' : 'success',
      message: result.justCompleted
        ? `¡Libro completado al 100%! "${book.title}" se movió a Completados (+${result.pagesDelta} págs.).`
        : `+${result.pagesDelta} págs. registradas en "${book.title}" · ¡Racha diaria activada!`,
    })
  }

  return (
    <div className="space-y-7">
      {/* Cabecera editorial limpia */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-black/[0.07] dark:border-white/[0.08]">
        <div className="min-w-0">
          <h1 className="font-hero-display text-[32px] sm:text-[38px] font-semibold tracking-[-0.025em] text-[#152e29] dark:text-[#f0ede6] leading-[1.08]">
            Progreso de lectura
          </h1>
          <p className="mt-1.5 font-hero-sans text-[14px] text-[#566d67] dark:text-[#a6b7b1] max-w-2xl leading-relaxed">
            Registrá tus páginas cada día para sostener tu racha y seguir el avance real de cada libro.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="h-10 ps-3.5 pe-4 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer shrink-0 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
        >
          <Plus size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          <span>Registrar páginas</span>
        </button>
      </header>

      {/* Banner de confirmación tras registrar páginas */}
      {feedback && (
        <div
          role="status"
          className={`rounded-[16px] px-4 py-3 border flex items-center justify-between gap-3 ${
            feedback.type === 'completed'
              ? 'bg-[#f7e4cd]/75 dark:bg-[#edbd79]/[0.12] border-[#c9833b]/30 dark:border-[#edbd79]/25 text-[#7a4d16] dark:text-[#edbd79]'
              : 'bg-[#0e5146]/[0.07] dark:bg-[#4fb39d]/[0.12] border-[#0e5146]/20 dark:border-[#4fb39d]/25 text-[#0e5146] dark:text-[#a3e3d3]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedback.type === 'completed' ? (
              <Trophy size={17} strokeWidth={2} absoluteStrokeWidth className="shrink-0" aria-hidden="true" />
            ) : (
              <Sparkles size={17} strokeWidth={2} absoluteStrokeWidth className="shrink-0" aria-hidden="true" />
            )}
            <p className="font-hero-sans text-[13px] sm:text-[13.5px] font-semibold leading-snug">
              {feedback.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Ocultar aviso"
            style={{ borderRadius: '9999px' }}
            className="size-7 flex items-center justify-center shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-[background-color] duration-150 cursor-pointer"
          >
            <X size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>
      )}

      {/* A. Tarjeta principal de Racha Diaria + Actividad de 7 días (Apple Health / Books) */}
      <section
        aria-label="Racha diaria de lectura"
        className="bg-white dark:bg-[#131f1c] border border-black/[0.07] dark:border-white/[0.08] rounded-[20px] p-5 sm:p-7 shadow-[0_1px_2px_rgba(16,42,36,0.04),0_8px_24px_-8px_rgba(16,42,36,0.06)] dark:shadow-none"
      >
        {/* Estado de hoy + KPIs de racha */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                style={{ borderRadius: '9999px' }}
                className={`inline-flex items-center gap-2 px-3 py-1 text-[12px] font-hero-sans font-medium ${
                  streakStats.isActiveToday
                    ? 'bg-[#0e5146]/[0.09] text-[#0e5146] dark:bg-[#4fb39d]/[0.14] dark:text-[#4fb39d]'
                    : 'bg-[#c9833b]/[0.12] text-[#8d571b] dark:bg-[#edbd79]/[0.14] dark:text-[#edbd79]'
                }`}
              >
                <span
                  style={{ borderRadius: '9999px' }}
                  className={`size-1.5 shrink-0 ${
                    streakStats.isActiveToday
                      ? 'bg-[#0e5146] dark:bg-[#4fb39d]'
                      : 'bg-[#c9833b] dark:bg-[#edbd79]'
                  }`}
                  aria-hidden="true"
                />
                <span className="tabular-nums">
                  {streakStats.isActiveToday
                    ? `Racha activa hoy · +${streakStats.todayPages} págs.`
                    : 'Pendiente hoy · registrá páginas para activar tu racha'}
                </span>
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <div className="flex items-center gap-2.5">
                <Flame
                  size={28}
                  strokeWidth={1.85}
                  absoluteStrokeWidth
                  className={
                    streakStats.isActiveToday
                      ? 'text-[#c9833b] dark:text-[#edbd79] shrink-0'
                      : 'text-[#879b95] dark:text-[#657b75] shrink-0'
                  }
                  aria-hidden="true"
                />
                <span className="font-hero-display text-[48px] sm:text-[54px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums leading-none tracking-[-0.03em]">
                  {streakStats.currentStreak}
                </span>
              </div>
              <span className="font-hero-sans text-[16px] sm:text-[17px] font-medium text-[#5c726c] dark:text-[#a6b7b1]">
                {streakStats.currentStreak === 1 ? 'día de racha' : 'días de racha'}
              </span>
            </div>
          </div>

          {/* Métricas secundarias alineadas con divisores finos */}
          <div className="flex items-center gap-6 sm:gap-8 pt-4 md:pt-0 border-t md:border-t-0 border-black/[0.06] dark:border-white/[0.07]">
            <div>
              <p className="font-hero-sans text-[12px] font-medium text-[#647a74] dark:text-[#869b94]">
                Mejor racha
              </p>
              <p className="mt-1 font-hero-display text-[26px] sm:text-[28px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums leading-none">
                {streakStats.bestStreak}{' '}
                <span className="font-hero-sans text-[13px] font-normal text-[#5c726c] dark:text-[#a6b7b1]">
                  {streakStats.bestStreak === 1 ? 'día' : 'días'}
                </span>
              </p>
            </div>

            <div className="h-9 w-px bg-black/[0.07] dark:bg-white/[0.08]" aria-hidden="true" />

            <div>
              <p className="font-hero-sans text-[12px] font-medium text-[#647a74] dark:text-[#869b94]">
                Días con lectura
              </p>
              <p className="mt-1 font-hero-display text-[26px] sm:text-[28px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums leading-none">
                {streakStats.totalActiveDays}{' '}
                <span className="font-hero-sans text-[13px] font-normal text-[#5c726c] dark:text-[#a6b7b1]">
                  {streakStats.totalActiveDays === 1 ? 'día' : 'días'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tira semanal estilo Apple Fitness: 7 anillos respirables sin tarjetas anidadas */}
        <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.07]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="font-hero-sans text-[13px] font-semibold text-[#152e29] dark:text-[#f0ede6]">
              Últimos 7 días
            </span>
            <span className="font-hero-sans text-[12.5px] font-medium text-[#5c726c] dark:text-[#a6b7b1] tabular-nums">
              {activeLast7Count} de 7 días activos
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {streakStats.last7Days.map((day) => {
              const titleText = day.active
                ? `${day.label} ${day.dayNum}: ${day.pages} páginas leídas`
                : `${day.label} ${day.dayNum}: Sin lectura registrada`
              return (
                <div
                  key={day.date}
                  title={titleText}
                  className={`rounded-[14px] py-2.5 px-1 flex flex-col items-center gap-2 transition-[background-color] duration-150 ${
                    day.isToday
                      ? 'bg-[#f4f2eb] dark:bg-[#192824]'
                      : 'bg-transparent'
                  }`}
                >
                  <span
                    className={`font-hero-sans text-[11.5px] font-medium ${
                      day.isToday
                        ? 'text-[#0e5146] dark:text-[#4fb39d] font-semibold'
                        : 'text-[#647a74] dark:text-[#869b94]'
                    }`}
                  >
                    {day.shortLabel}
                  </span>

                  <div
                    style={{ borderRadius: '9999px' }}
                    className={`size-8 sm:size-9 flex items-center justify-center transition-[background-color,border-color] duration-150 ${
                      day.active
                        ? day.isToday
                          ? 'bg-[#0e5146] dark:bg-[#4fb39d] text-white dark:text-[#0c1412] ring-2 ring-offset-2 ring-[#c9833b]/70 dark:ring-[#edbd79]/80 dark:ring-offset-[#192824]'
                          : 'bg-[#0e5146] dark:bg-[#166e5e] text-white'
                        : day.isToday
                        ? 'bg-[#f7e4cd]/70 dark:bg-[#edbd79]/15 border border-[#c9833b]/50 dark:border-[#edbd79]/45 text-[#8d571b] dark:text-[#edbd79]'
                        : 'bg-[#f4f2eb] dark:bg-[#192824] border border-black/[0.07] dark:border-white/[0.08] text-[#6d827c] dark:text-[#7f948e]'
                    }`}
                  >
                    {day.active ? (
                      <Check size={15} strokeWidth={2.4} absoluteStrokeWidth aria-hidden="true" />
                    ) : (
                      <span className="font-hero-sans text-[11.5px] font-semibold tabular-nums">
                        {day.dayNum}
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-hero-sans text-[11px] tabular-nums ${
                      day.active
                        ? 'font-semibold text-[#152e29] dark:text-[#f0ede6]'
                        : day.isToday
                        ? 'font-medium text-[#8d571b] dark:text-[#edbd79]'
                        : 'text-[#879b95] dark:text-[#657b75]'
                    }`}
                  >
                    {day.active ? `${day.pages}p` : day.isToday ? 'Hoy' : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* B. Libros en progreso: lista unificada estilo Apple Books */}
      <section aria-label="Libros en progreso" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-4 px-0.5">
          <div>
            <h2 className="font-hero-display text-[24px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#152e29] dark:text-[#f0ede6] leading-tight">
              Libros en progreso
            </h2>
            <p className="mt-0.5 font-hero-sans text-[13px] text-[#5c726c] dark:text-[#a6b7b1]">
              Avance actual, páginas leídas y páginas faltantes por cada obra.
            </p>
          </div>
          <span className="font-hero-sans text-[12.5px] font-medium text-[#5c726c] dark:text-[#a6b7b1] tabular-nums shrink-0">
            {inProgressBooks.length} {inProgressBooks.length === 1 ? 'libro' : 'libros'}
          </span>
        </div>

        {inProgressBooks.length === 0 ? (
          <div className="bg-white dark:bg-[#131f1c] border border-black/[0.07] dark:border-white/[0.08] rounded-[20px] p-8 sm:p-10 text-center shadow-[0_1px_2px_rgba(16,42,36,0.04),0_8px_24px_-8px_rgba(16,42,36,0.05)] dark:shadow-none">
            <div
              style={{ borderRadius: '9999px' }}
              className="mx-auto size-12 bg-[#f4f2eb] dark:bg-[#192824] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#0e5146] dark:text-[#4fb39d] mb-4"
            >
              <BookOpen size={21} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            </div>
            <h3 className="font-hero-display text-[24px] sm:text-[26px] font-semibold text-[#152e29] dark:text-[#f0ede6]">
              No tenés libros en curso todavía
            </h3>
            <p className="mt-1.5 font-hero-sans text-[14px] text-[#5c726c] dark:text-[#a6b7b1] max-w-md mx-auto leading-relaxed">
              Registrá tus primeras páginas desde cualquier libro del catálogo o de tu lista &ldquo;Por leer&rdquo; para ver tu avance acá.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => openModal()}
                className="h-10 ps-4 pe-4.5 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
              >
                <Plus size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                <span>Registrar páginas</span>
              </button>
              <Link
                to="/catalog"
                className="h-10 px-4 rounded-[12px] bg-[#f4f2eb] hover:bg-[#eae6da] dark:bg-[#192824] dark:hover:bg-[#223530] border border-black/[0.06] dark:border-white/[0.08] text-[#152e29] dark:text-[#f0ede6] font-hero-sans text-[13px] font-semibold inline-flex items-center transition-[background-color,transform] duration-150 ease-out motion-safe:active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#131f1c] border border-black/[0.07] dark:border-white/[0.08] rounded-[20px] divide-y divide-black/[0.06] dark:divide-white/[0.07] shadow-[0_1px_2px_rgba(16,42,36,0.04),0_8px_24px_-8px_rgba(16,42,36,0.06)] dark:shadow-none">
            {inProgressBooks.map((item) => {
              const { progress } = item
              return (
                <article
                  key={item.bookId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
                >
                  <Link
                    to={`/books/${item.bookId}`}
                    className="w-[58px] sm:w-[66px] aspect-[2/3] rounded-[6px] overflow-hidden shrink-0 bg-[#f0eee6] dark:bg-[#192824] outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 relative block"
                  >
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={`Portada de ${item.title}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#0e5146]/35 dark:text-[#4fb39d]/35">
                        <BookOpen size={19} strokeWidth={1.6} absoluteStrokeWidth aria-hidden="true" />
                      </div>
                    )}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-r from-black/18 via-white/10 to-transparent"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/books/${item.bookId}`}
                            className="font-hero-sans text-[15px] sm:text-[16px] font-semibold text-[#152e29] hover:text-[#0e5146] dark:text-[#f0ede6] dark:hover:text-[#4fb39d] transition-[color] duration-150 line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          {item.completedToday && (
                            <span
                              style={{ borderRadius: '9999px' }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#f7e4cd] dark:bg-[#edbd79]/15 text-[#7a4d16] dark:text-[#edbd79] font-hero-sans text-[11px] font-semibold"
                            >
                              <CheckCircle2 size={12} strokeWidth={2.1} absoluteStrokeWidth aria-hidden="true" />
                              Completado hoy
                            </span>
                          )}
                        </div>
                        <p className="font-hero-sans text-[12.5px] sm:text-[13px] text-[#5c726c] dark:text-[#a6b7b1] line-clamp-1 mt-0.5">
                          {item.author}
                        </p>
                      </div>

                      <span className="font-hero-display text-[26px] sm:text-[30px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums leading-none shrink-0">
                        {progress.percentage}%
                      </span>
                    </div>

                    {/* Barra de progreso limpia */}
                    <div
                      role="progressbar"
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de ${item.title}: ${progress.percentage}%`}
                      className="mt-3 h-2 w-full bg-[#efede6] dark:bg-[#1f312c] overflow-hidden"
                      style={{ borderRadius: '9999px' }}
                    >
                      <div
                        className={`h-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          progress.isCompleted
                            ? 'bg-[#c9833b] dark:bg-[#edbd79]'
                            : 'bg-[#0e5146] dark:bg-[#4fb39d]'
                        }`}
                        style={{
                          width: `${progress.percentage}%`,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>

                    {/* Metadatos de páginas y fecha */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-hero-sans text-[12px] text-[#5c726c] dark:text-[#a6b7b1]">
                      <p className="tabular-nums">
                        <strong className="font-semibold text-[#152e29] dark:text-[#f0ede6]">
                          {progress.pagesRead}
                        </strong>{' '}
                        leídas ·{' '}
                        <strong className="font-semibold text-[#152e29] dark:text-[#f0ede6]">
                          {progress.remainingPages}
                        </strong>{' '}
                        restantes{' '}
                        <span className="text-[#7c908a] dark:text-[#7f948e]">
                          de {progress.totalPages} págs.
                        </span>
                      </p>
                      {progress.lastReadDate && (
                        <span className="text-[11.5px] text-[#7c908a] dark:text-[#7f948e]">
                          Último registro: {formatLogDate(progress.lastReadDate, todayStr)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0 flex sm:justify-end">
                    {progress.isCompleted ? (
                      <Link
                        to={`/books/${item.bookId}`}
                        className="w-full sm:w-auto h-9 px-3.5 rounded-[10px] bg-[#f7e4cd]/75 hover:bg-[#f7e4cd] dark:bg-[#edbd79]/15 dark:hover:bg-[#edbd79]/25 text-[#7a4d16] dark:text-[#edbd79] font-hero-sans text-[12.5px] font-semibold inline-flex items-center justify-center transition-[background-color,transform] duration-150 ease-out motion-safe:active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
                      >
                        Ver detalle
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openModal(item.bookId)}
                        className="w-full sm:w-auto h-9 ps-3 pe-3.5 rounded-[10px] bg-[#f4f2eb] hover:bg-[#0e5146] dark:bg-[#192824] dark:hover:bg-[#166e5e] text-[#152e29] hover:text-white dark:text-[#f0ede6] border border-black/[0.07] hover:border-[#0e5146] dark:border-white/[0.08] dark:hover:border-[#166e5e] font-hero-sans text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
                      >
                        <Plus size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                        <span>Sumar páginas</span>
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* C. Historial reciente: superficie única con filas divididas */}
      <section aria-label="Historial reciente de sesiones" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2">
            <History
              size={17}
              strokeWidth={1.85}
              absoluteStrokeWidth
              className="text-[#5c726c] dark:text-[#8ea39c]"
              aria-hidden="true"
            />
            <h2 className="font-hero-display text-[22px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#152e29] dark:text-[#f0ede6]">
              Historial reciente
            </h2>
          </div>
          <span className="font-hero-sans text-[12.5px] text-[#5c726c] dark:text-[#a6b7b1] tabular-nums">
            Últimas {recentLogs.length} {recentLogs.length === 1 ? 'sesión' : 'sesiones'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131f1c] border border-black/[0.07] dark:border-white/[0.08] rounded-[20px] shadow-[0_1px_2px_rgba(16,42,36,0.04),0_8px_24px_-8px_rgba(16,42,36,0.05)] dark:shadow-none">
          {recentLogs.length === 0 ? (
            <p className="font-hero-sans text-[13.5px] text-[#5c726c] dark:text-[#a6b7b1] px-5 py-6">
              Todavía no registraste sesiones de lectura. Cuando sumes páginas, verás acá tu actividad más reciente.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {recentLogs.map((entry) => (
                <li
                  key={entry.id}
                  className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="px-2.5 py-0.5 bg-[#f4f2eb] dark:bg-[#192824] text-[#485f59] dark:text-[#a6b7b1] font-hero-sans text-[11.5px] font-medium shrink-0 tabular-nums"
                    >
                      {formatLogDate(entry.date, todayStr)}
                    </span>
                    <Link
                      to={`/books/${entry.bookId}`}
                      className="font-hero-sans text-[13.5px] sm:text-[14px] font-semibold text-[#152e29] hover:text-[#0e5146] dark:text-[#f0ede6] dark:hover:text-[#4fb39d] transition-[color] duration-150 truncate"
                    >
                      {entry.bookTitle || 'Libro'}
                    </Link>
                    {entry.completedBook && (
                      <span
                        style={{ borderRadius: '9999px' }}
                        className="hidden sm:inline-flex items-center px-2 py-0.5 bg-[#f7e4cd] dark:bg-[#edbd79]/15 text-[#7a4d16] dark:text-[#edbd79] font-hero-sans text-[11px] font-semibold shrink-0"
                      >
                        Completado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0 font-hero-sans tabular-nums">
                    <span className="text-[13px] sm:text-[13.5px] font-semibold text-[#0e5146] dark:text-[#4fb39d]">
                      +{entry.pagesDelta} págs.
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-[#647a74] dark:text-[#869b94]">
                      <Clock size={12.5} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
                      ~{entry.minutesSpent} min
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Modal de Registro de Páginas */}
      {modalOpen && (
        <LogPagesModal
          key={`${resolvedInitialBookId || 'default'}-${modalOpen ? 'open' : 'closed'}`}
          userId={userId}
          trackerState={trackerState}
          candidateBooks={candidateBooks}
          initialBookId={resolvedInitialBookId}
          readingIds={readingIds}
          completedIds={completedIds}
          onClose={closeModal}
          onSuccess={handleLogSuccess}
        />
      )}
    </div>
  )
}
