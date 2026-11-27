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
  Trophy,
  X,
} from 'lucide-react'
import AiSparkleIcon from '../ui/AiSparkleIcon'
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
        className="absolute inset-0 bg-[#18332f]/45 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-pages-modal-title"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain bg-[#f8f7f2] border border-[#d6d0c0] rounded-2xl shadow-[0_24px_64px_-12px_rgba(14,81,70,0.28)] p-5 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#d6d0c0]/80">
          <div>
            <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-dark">
              Registro diario
            </span>
            <h3
              id="log-pages-modal-title"
              className="mt-0.5 font-hero-display text-2xl sm:text-[28px] font-semibold text-primary leading-tight"
            >
              Registrar páginas leídas
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar ventana"
            style={{ borderRadius: '9999px' }}
            className="size-8 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-[#eae6da] transition-[background-color,color,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
          >
            <X size={18} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Selector de libro */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="tracker-book-select"
                className="font-hero-sans text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Libro
              </label>
              {!catalogLoaded && candidateBooks.length > 0 && (
                <button
                  type="button"
                  onClick={handleLoadMoreFromCatalog}
                  disabled={loadingCatalog}
                  className="font-hero-sans text-[11.5px] font-semibold text-primary hover:text-secondary-dark transition-colors cursor-pointer"
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
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#d6d0c0] font-hero-sans text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {allOptions.length === 0 ? (
                <option value="">
                  {loadingCatalog ? 'Buscando libros...' : 'No hay libros disponibles'}
                </option>
              ) : (
                allOptions.map((book) => {
                  const prog = computeBookProgressFromState(trackerState, book)
                  return (
                    <option key={book.bookId} value={book.bookId}>
                      {book.title} ({prog.percentage}% · {book.sourceLabel})
                    </option>
                  )
                })
              )}
            </select>
          </div>

          {/* Vista previa del libro elegido */}
          {selectedBook && (
            <div className="bg-white/90 border border-[#d6d0c0]/85 rounded-xl p-3.5 flex items-center gap-3.5">
              <div className="w-12 aspect-[2/3] rounded-[4px] overflow-hidden shrink-0 bg-[#eae6da] ring-1 ring-black/10">
                {selectedBook.img ? (
                  <img
                    src={selectedBook.img}
                    alt={`Portada de ${selectedBook.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/40">
                    <BookOpen size={18} strokeWidth={1.75} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-hero-sans text-sm font-semibold text-primary truncate">
                  {selectedBook.title}
                </p>
                <p className="font-hero-sans text-xs text-on-surface-variant truncate">
                  {selectedBook.author}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs font-hero-sans tabular-nums">
                  <span className="text-on-surface-variant">
                    <strong className="text-primary font-semibold">{currentProgress.pagesRead}</strong> /{' '}
                    {currentProgress.totalPages} págs.
                  </span>
                  <span className="font-semibold text-primary">
                    {currentProgress.remainingPages} restantes · {currentProgress.percentage}%
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full bg-[#eae6da] overflow-hidden"
                  style={{ borderRadius: '9999px' }}
                >
                  <div
                    className="h-full bg-primary transition-[width] duration-300 ease-out"
                    style={{
                      width: `${currentProgress.percentage}%`,
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modo de registro */}
          <div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#eae6da]/80 border border-[#d6d0c0]/80 rounded-xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('add')}
                className={`h-9 px-3 rounded-lg font-hero-sans text-xs sm:text-[13px] transition-[background-color,color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer ${
                  mode === 'add'
                    ? 'bg-white text-primary font-semibold shadow-xs border border-[#d6d0c0]/70'
                    : 'text-on-surface-variant hover:text-primary font-medium border border-transparent'
                }`}
              >
                Sumar páginas leídas
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('set')}
                className={`h-9 px-3 rounded-lg font-hero-sans text-xs sm:text-[13px] transition-[background-color,color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer ${
                  mode === 'set'
                    ? 'bg-white text-primary font-semibold shadow-xs border border-[#d6d0c0]/70'
                    : 'text-on-surface-variant hover:text-primary font-medium border border-transparent'
                }`}
              >
                Página actual
              </button>
            </div>

            {mode === 'add' ? (
              <div className="mt-3 space-y-3">
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
                        className={`px-3.5 h-8 font-hero-sans text-xs font-semibold tabular-nums border transition-[background-color,border-color,color,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-primary border-[#d6d0c0] hover:border-primary/45'
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
                    className="block font-hero-sans text-xs font-medium text-on-surface-variant mb-1"
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
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#d6d0c0] font-hero-sans text-sm font-semibold tabular-nums text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#eae6da]/50"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <label
                  htmlFor="tracker-pages-set-input"
                  className="block font-hero-sans text-xs font-medium text-on-surface-variant mb-1"
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
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#d6d0c0] font-hero-sans text-sm font-semibold tabular-nums text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-[#eae6da]/50"
                />
              </div>
            )}

            {/* Resumen del cálculo */}
            {selectedBook && (
              <div className="mt-3 rounded-xl bg-[#eae6da]/60 border border-[#d6d0c0]/75 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-hero-sans">
                {currentProgress.isCompleted ? (
                  <span className="text-[#7a4d16] font-medium">
                    Este libro ya está completado al 100%. Elegí otro libro para seguir sumando páginas.
                  </span>
                ) : previewDelta > 0 ? (
                  <>
                    <span className="text-on-surface-variant">
                      Nuevo avance:{' '}
                      <strong className="text-primary tabular-nums">
                        {nextPagesRead} / {currentProgress.totalPages} págs. ({previewPercentage}%)
                      </strong>
                    </span>
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="px-2.5 py-0.5 bg-primary/10 text-primary font-semibold tabular-nums shrink-0"
                    >
                      +{previewDelta} págs.
                    </span>
                  </>
                ) : (
                  <span className="text-[#7a4d16]">
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
              className="block font-hero-sans text-xs font-medium text-on-surface-variant mb-1"
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
                  ? `Estimado automático según tu ritmo: ~${estimatedMinutes} min`
                  : 'Se calcula automáticamente si lo dejás vacío'
              }
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#d6d0c0] font-hero-sans text-sm text-on-surface placeholder:text-on-surface-variant/65 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {errorMsg && (
            <p className="font-hero-sans text-xs font-medium text-[#ba1a1a] bg-[#ffdad6]/50 border border-[#ba1a1a]/25 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="pt-1 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-[10px] border border-[#d6d0c0] bg-white/80 hover:bg-white text-on-surface-variant hover:text-primary font-hero-sans text-xs font-semibold transition-[background-color,color,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="h-10 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(14,81,70,0.22)] transition-[background-color,box-shadow,scale,opacity] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flame size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              <span>{submitting ? 'Guardando...' : 'Guardar avance y activar racha'}</span>
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
    <div className="space-y-8">
      {/* Cabecera editorial de sección */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#d6d0c0]/75">
        <div>
          <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-dark">
            Seguimiento diario
          </span>
          <h1 className="mt-1 font-hero-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-primary leading-tight">
            Progreso de{' '}
            <span className="italic font-medium text-secondary-dark">lectura</span>
          </h1>
          <p className="mt-1.5 font-hero-sans text-sm text-on-surface-variant max-w-2xl">
            Registrá tus páginas cada día para mantener viva tu racha y seguir el avance real de cada libro.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openModal()}
          className="h-10 px-4 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(14,81,70,0.18)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} strokeWidth={2.1} absoluteStrokeWidth aria-hidden="true" />
          <span>Registrar páginas leídas</span>
        </button>
      </header>

      {/* Banner de confirmación tras registrar páginas */}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 ${
            feedback.type === 'completed'
              ? 'bg-[#f7e4cd]/70 border-[#c9833b]/40 text-[#7a4d16]'
              : 'bg-primary/[0.08] border-primary/25 text-primary'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {feedback.type === 'completed' ? (
              <Trophy size={18} strokeWidth={2} absoluteStrokeWidth className="shrink-0" aria-hidden="true" />
            ) : (
              <AiSparkleIcon size={18} className="shrink-0" />
            )}
            <p className="font-hero-sans text-xs sm:text-sm font-semibold leading-snug">
              {feedback.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Ocultar aviso"
            style={{ borderRadius: '9999px' }}
            className="size-7 flex items-center justify-center shrink-0 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        </div>
      )}

      {/* A. Tarjeta principal de Racha Diaria + Últimos 7 días */}
      <section
        aria-label="Racha diaria de lectura"
        className="bg-[#eae6da]/70 border border-[#d6d0c0]/85 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div
              style={{ borderRadius: '9999px' }}
              className={`inline-flex items-center gap-2 px-3 py-1 border text-xs font-hero-sans font-semibold ${
                streakStats.isActiveToday
                  ? 'bg-primary/10 border-primary/25 text-primary'
                  : 'bg-[#f7e4cd]/85 border-[#c9833b]/35 text-[#7a4d16]'
              }`}
            >
              <span
                style={{ borderRadius: '9999px' }}
                className={`size-2 shrink-0 ${
                  streakStats.isActiveToday ? 'bg-primary' : 'bg-[#c9833b]'
                }`}
                aria-hidden="true"
              />
              <span className="tabular-nums">
                {streakStats.isActiveToday
                  ? `Racha del día activa (+${streakStats.todayPages} págs.)`
                  : 'Pendiente hoy — registrá páginas para activar tu racha'}
              </span>
            </div>

            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              {/* Racha actual */}
              <div className="flex items-center gap-3">
                <div
                  style={{ borderRadius: '9999px' }}
                  className={`size-12 flex items-center justify-center border ${
                    streakStats.isActiveToday
                      ? 'bg-white/90 border-[#c9833b]/40 text-[#c9833b] shadow-xs'
                      : 'bg-white/75 border-[#d6d0c0] text-on-surface-variant/65'
                  }`}
                >
                  <Flame size={23} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
                </div>
                <div>
                  <p className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                    Racha actual
                  </p>
                  <p className="font-hero-display text-4xl sm:text-5xl font-semibold text-primary tabular-nums leading-none mt-0.5">
                    {streakStats.currentStreak}{' '}
                    <span className="text-xl sm:text-2xl font-medium text-on-surface-variant">
                      {streakStats.currentStreak === 1 ? 'día' : 'días'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-11 w-px bg-[#d6d0c0]/90" aria-hidden="true" />

              {/* Mejor racha */}
              <div>
                <p className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  Mejor racha
                </p>
                <p className="font-hero-display text-2xl sm:text-3xl font-semibold text-primary tabular-nums leading-none mt-1">
                  {streakStats.bestStreak}{' '}
                  <span className="text-base font-hero-sans font-medium text-on-surface-variant">
                    {streakStats.bestStreak === 1 ? 'día' : 'días'}
                  </span>
                </p>
              </div>

              <div className="hidden sm:block h-11 w-px bg-[#d6d0c0]/90" aria-hidden="true" />

              {/* Días activos totales */}
              <div>
                <p className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  Días con lectura
                </p>
                <p className="font-hero-display text-2xl sm:text-3xl font-semibold text-primary tabular-nums leading-none mt-1">
                  {streakStats.totalActiveDays}{' '}
                  <span className="text-base font-hero-sans font-medium text-on-surface-variant">
                    {streakStats.totalActiveDays === 1 ? 'día' : 'días'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="h-11 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(14,81,70,0.2)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer shrink-0 self-start lg:self-center"
          >
            <Flame size={16} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            <span>Registrar páginas leídas</span>
          </button>
        </div>

        {/* Tira visual: Últimos 7 días */}
        <div className="mt-6 pt-5 border-t border-[#d6d0c0]/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-hero-sans text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Últimos 7 días
            </span>
            <span className="font-hero-sans text-xs font-medium text-primary tabular-nums">
              {activeLast7Count} de 7 días activos
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {streakStats.last7Days.map((day) => {
              const titleText = day.active
                ? `${day.label} ${day.dayNum}: ${day.pages} páginas leídas`
                : `${day.label} ${day.dayNum}: Sin lectura registrada`
              return (
                <div
                  key={day.date}
                  title={titleText}
                  className={`rounded-xl py-2.5 px-1 flex flex-col items-center gap-1.5 border transition-[background-color,border-color] duration-150 ${
                    day.isToday
                      ? 'bg-white/95 border-primary/35 shadow-xs'
                      : 'bg-white/55 border-[#d6d0c0]/75'
                  }`}
                >
                  <span
                    className={`font-hero-sans text-[11px] font-semibold uppercase ${
                      day.isToday ? 'text-primary' : 'text-on-surface-variant/85'
                    }`}
                  >
                    {day.shortLabel}
                  </span>

                  <div
                    style={{ borderRadius: '9999px' }}
                    className={`size-7 sm:size-8 flex items-center justify-center ${
                      day.active
                        ? day.isToday
                          ? 'bg-primary text-white ring-2 ring-[#edbd79]'
                          : 'bg-primary text-white'
                        : day.isToday
                        ? 'bg-[#f7e4cd]/75 border border-[#c9833b]/55 text-[#7a4d16]'
                        : 'bg-[#f8f7f2] border border-[#d6d0c0] text-on-surface-variant/65'
                    }`}
                  >
                    {day.active ? (
                      <Check size={14} strokeWidth={2.4} absoluteStrokeWidth aria-hidden="true" />
                    ) : (
                      <span className="font-hero-sans text-[11px] font-semibold tabular-nums">
                        {day.dayNum}
                      </span>
                    )}
                  </div>

                  <span className="font-hero-sans text-[10.5px] font-semibold tabular-nums text-on-surface-variant">
                    {day.active ? `${day.pages}p` : day.isToday ? 'Hoy' : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* C. Libros en Progreso */}
      <section aria-label="Libros en progreso" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-hero-display text-2xl sm:text-[28px] font-semibold text-primary leading-tight">
              Libros en{' '}
              <span className="italic font-medium text-secondary-dark">progreso</span>
            </h2>
            <p className="mt-0.5 font-hero-sans text-xs sm:text-sm text-on-surface-variant">
              Porcentaje de avance, páginas leídas y páginas faltantes por cada obra.
            </p>
          </div>
          <span
            style={{ borderRadius: '9999px' }}
            className="px-3 py-1 bg-[#eae6da] border border-[#d6d0c0] font-hero-sans text-xs font-semibold text-primary tabular-nums shrink-0"
          >
            {inProgressBooks.length} {inProgressBooks.length === 1 ? 'libro' : 'libros'}
          </span>
        </div>

        {inProgressBooks.length === 0 ? (
          <div className="bg-white/75 border border-[#d6d0c0]/85 rounded-2xl p-8 sm:p-10 text-center">
            <div
              style={{ borderRadius: '9999px' }}
              className="mx-auto size-12 bg-[#eae6da] border border-[#d6d0c0] flex items-center justify-center text-primary mb-4"
            >
              <BookOpen size={22} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            </div>
            <h3 className="font-hero-display text-2xl sm:text-3xl font-semibold text-primary">
              No tenés libros en curso todavía
            </h3>
            <p className="mt-2 font-hero-sans text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
              Registrá tus primeras páginas desde cualquier libro del catálogo o de tu lista &ldquo;Por leer&rdquo; para ver tu porcentaje de avance acá.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openModal()}
                className="h-10 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center gap-2 transition-[background-color,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.1} absoluteStrokeWidth aria-hidden="true" />
                <span>Registrar páginas leídas</span>
              </button>
              <Link
                to="/catalog"
                className="h-10 px-5 rounded-[10px] bg-[#eae6da]/80 hover:bg-[#eae6da] border border-[#d6d0c0] text-primary font-hero-sans text-[13px] font-semibold inline-flex items-center transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {inProgressBooks.map((item) => {
              const { progress } = item
              return (
                <article
                  key={item.bookId}
                  className="bg-white/85 border border-[#d6d0c0]/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center shadow-[0_2px_10px_-4px_rgba(24,51,47,0.06)]"
                >
                  <Link
                    to={`/books/${item.bookId}`}
                    className="w-[64px] sm:w-[74px] aspect-[2/3] rounded-[5px] overflow-hidden shrink-0 bg-[#eae6da] ring-1 ring-black/10 relative block group"
                  >
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={`Portada de ${item.title}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/35">
                        <BookOpen size={20} strokeWidth={1.6} aria-hidden="true" />
                      </div>
                    )}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-[5px] bg-gradient-to-r from-black/18 via-white/10 to-transparent"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/books/${item.bookId}`}
                            className="font-hero-sans text-[15px] sm:text-[17px] font-semibold text-primary hover:text-secondary-dark transition-colors line-clamp-1"
                          >
                            {item.title}
                          </Link>
                          {item.completedToday && (
                            <span
                              style={{ borderRadius: '9999px' }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#f7e4cd] text-[#7a4d16] font-hero-sans text-[11px] font-semibold"
                            >
                              <CheckCircle2 size={12} strokeWidth={2.2} aria-hidden="true" />
                              Completado hoy
                            </span>
                          )}
                        </div>
                        <p className="font-hero-sans text-xs sm:text-[13px] text-on-surface-variant line-clamp-1 mt-0.5">
                          {item.author}
                        </p>
                      </div>

                      <span className="font-hero-display text-2xl sm:text-3xl font-semibold text-primary tabular-nums leading-none shrink-0">
                        {progress.percentage}%
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div
                      role="progressbar"
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso de ${item.title}: ${progress.percentage}%`}
                      className="mt-3 h-2.5 w-full bg-[#eae6da] overflow-hidden"
                      style={{ borderRadius: '9999px' }}
                    >
                      <div
                        className={`h-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          progress.isCompleted ? 'bg-[#c9833b]' : 'bg-primary'
                        }`}
                        style={{
                          width: `${progress.percentage}%`,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>

                    {/* Páginas leídas vs restantes */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-hero-sans text-xs text-on-surface-variant">
                      <p className="tabular-nums">
                        <strong className="font-semibold text-primary">{progress.pagesRead}</strong>{' '}
                        págs. leídas ·{' '}
                        <strong className="font-semibold text-primary">
                          {progress.remainingPages}
                        </strong>{' '}
                        págs. restantes{' '}
                        <span className="text-on-surface-variant/75">
                          (de {progress.totalPages} totales)
                        </span>
                      </p>
                      {progress.lastReadDate && (
                        <span className="text-[11.5px] text-on-surface-variant/80">
                          Último registro: {formatLogDate(progress.lastReadDate, todayStr)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0 flex sm:justify-end">
                    {progress.isCompleted ? (
                      <Link
                        to={`/books/${item.bookId}`}
                        className="w-full sm:w-auto h-9 px-4 rounded-[10px] bg-[#f7e4cd]/70 hover:bg-[#f7e4cd] border border-[#c9833b]/35 text-[#7a4d16] font-hero-sans text-xs font-semibold inline-flex items-center justify-center transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
                      >
                        Ver detalle
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openModal(item.bookId)}
                        className="w-full sm:w-auto h-9 px-4 rounded-[10px] bg-[#eae6da]/80 hover:bg-primary text-primary hover:text-white border border-[#d6d0c0] hover:border-primary font-hero-sans text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,border-color,color,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
                      >
                        <Plus size={14} strokeWidth={2.2} absoluteStrokeWidth aria-hidden="true" />
                        <span>Registrar páginas</span>
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* E. Historial reciente */}
      <section
        aria-label="Historial reciente de sesiones"
        className="bg-[#eae6da]/50 border border-[#d6d0c0]/80 rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <History
              size={17}
              strokeWidth={1.9}
              absoluteStrokeWidth
              className="text-primary"
              aria-hidden="true"
            />
            <h2 className="font-hero-display text-xl sm:text-2xl font-semibold text-primary">
              Historial reciente
            </h2>
          </div>
          <span className="font-hero-sans text-xs text-on-surface-variant tabular-nums">
            Últimas {recentLogs.length} {recentLogs.length === 1 ? 'sesión' : 'sesiones'}
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="font-hero-sans text-sm text-on-surface-variant py-2">
            Todavía no registraste sesiones de lectura. Cuando sumes páginas, verás acá tu actividad más reciente.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentLogs.map((entry) => (
              <li
                key={entry.id}
                className="bg-white/80 border border-[#d6d0c0]/75 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    style={{ borderRadius: '9999px' }}
                    className="px-2.5 py-0.5 bg-[#eae6da] text-primary font-hero-sans text-[11px] font-semibold shrink-0"
                  >
                    {formatLogDate(entry.date, todayStr)}
                  </span>
                  <Link
                    to={`/books/${entry.bookId}`}
                    className="font-hero-sans text-xs sm:text-sm font-semibold text-primary hover:text-secondary-dark transition-colors truncate"
                  >
                    {entry.bookTitle || 'Libro'}
                  </Link>
                  {entry.completedBook && (
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#f7e4cd] text-[#7a4d16] font-hero-sans text-[10.5px] font-semibold shrink-0"
                    >
                      Completado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 font-hero-sans tabular-nums">
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    +{entry.pagesDelta} págs.
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                    <Clock size={12} strokeWidth={1.85} aria-hidden="true" />
                    ~{entry.minutesSpent} min
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
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
