import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Flame,
  Heart,
  Plus,
} from 'lucide-react'
import { getFavorites } from '../api/favorites'
import { getByStatus } from '../api/status'
import BookGrid from '../components/books/BookGrid'
import MonthlyStatsSection from '../components/library/MonthlyStatsSection'
import ReadingProgressSection from '../components/library/ReadingProgressSection'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'
import { syncReadingTracker, useReadingTracker } from '../utils/readingTrackerStore'

const VALID_SECTIONS = new Set([
  'progress',
  'stats',
  'reading',
  'want_to_read',
  'completed',
  'favorites',
])

const TRACKING_NAV_ITEMS = [
  { key: 'progress', label: 'Progreso', icon: Flame },
  { key: 'stats', label: 'Estadísticas', icon: BarChart3 },
]

const COLLECTION_NAV_ITEMS = [
  { key: 'reading', label: 'Leyendo', icon: BookOpen },
  { key: 'want_to_read', label: 'Por leer', icon: Bookmark },
  { key: 'completed', label: 'Completados', icon: CheckCircle2 },
  { key: 'favorites', label: 'Favoritos', icon: Heart },
]

const COLLECTION_META = {
  reading: {
    eyebrow: 'En tu mesa de lectura',
    title: 'Leyendo',
    accent: 'actualmente',
    subtitle: 'Los títulos que estás leyendo ahora mismo. Sumá páginas para actualizar tu racha.',
    emptyTitle: 'Todavía no estás leyendo ningún libro',
    emptySubtitle: 'Explorá el catálogo y marcá un libro como "Leyendo" o registrá tus primeras páginas.',
  },
  want_to_read: {
    eyebrow: 'Lista de deseos',
    title: 'Por',
    accent: 'leer',
    subtitle: 'Tus próximas lecturas guardadas para cuando termines el libro actual.',
    emptyTitle: 'Tu lista "Por leer" está vacía',
    emptySubtitle: 'Explorá el catálogo y guardá libros para tenerlos siempre a mano.',
  },
  completed: {
    eyebrow: 'Historial de obras terminadas',
    title: 'Libros',
    accent: 'completados',
    subtitle: 'Todas las lecturas que llevaste hasta la última página.',
    emptyTitle: 'Aún no completaste ningún libro',
    emptySubtitle: 'Cuando termines un libro o llegues al 100% de sus páginas, aparecerá acá.',
  },
  favorites: {
    eyebrow: 'Selección personal',
    title: 'Tus',
    accent: 'favoritos',
    subtitle: 'Los libros que más te marcaron y querés recomendar o volver a leer.',
    emptyTitle: 'No marcaste favoritos todavía',
    emptySubtitle: 'Tocá el corazón en la ficha de cualquier libro para destacarlo en esta colección.',
  },
}

function normalizeArray(res) {
  return Array.isArray(res?.data) ? res.data : []
}

export default function Library() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const sectionParam = searchParams.get('section') || searchParams.get('tab')
  const activeSection = VALID_SECTIONS.has(sectionParam) ? sectionParam : 'progress'

  const [readingBooks, setReadingBooks] = useState([])
  const [wantToReadBooks, setWantToReadBooks] = useState([])
  const [completedBooks, setCompletedBooks] = useState([])
  const [favoriteBooks, setFavoriteBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [failedAvatarSrc, setFailedAvatarSrc] = useState(null)

  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logModalBookId, setLogModalBookId] = useState('')

  const { streakStats } = useReadingTracker(user?.id)

  useSEO({
    title: 'Mi Biblioteca',
    description:
      'Gestioná tus lecturas en curso, libros por leer, completados, favoritos, racha diaria y estadísticas mensuales en BookReview.',
    noindex: true,
  })

  const fetchAllCollections = useCallback(async () => {
    const [readingRes, wantRes, completedRes, favRes] = await Promise.all([
      getByStatus('reading').catch(() => ({ data: [] })),
      getByStatus('want_to_read').catch(() => ({ data: [] })),
      getByStatus('completed').catch(() => ({ data: [] })),
      getFavorites().catch(() => ({ data: [] })),
    ])

    return {
      reading: normalizeArray(readingRes),
      wantToRead: normalizeArray(wantRes),
      completed: normalizeArray(completedRes),
      favorites: normalizeArray(favRes),
    }
  }, [])

  const applyCollections = useCallback((collections) => {
    setReadingBooks(collections.reading)
    setWantToReadBooks(collections.wantToRead)
    setCompletedBooks(collections.completed)
    setFavoriteBooks(collections.favorites)
  }, [])

  const refreshCollections = useCallback(async () => {
    if (!isAuthenticated) return
    const [collections] = await Promise.all([
      fetchAllCollections(),
      syncReadingTracker(user?.id, { force: true }),
    ])
    applyCollections(collections)
  }, [isAuthenticated, user?.id, fetchAllCollections, applyCollections])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false

    const loadInitial = async () => {
      setLoading(true)
      const [collections] = await Promise.all([
        fetchAllCollections(),
        syncReadingTracker(user?.id, { force: true }),
      ])
      if (!cancelled) {
        applyCollections(collections)
        setLoading(false)
      }
    }

    loadInitial()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id, fetchAllCollections, applyCollections])

  const handleSelectSection = useCallback(
    (sectionKey) => {
      if (!VALID_SECTIONS.has(sectionKey)) return
      setSearchParams(sectionKey === 'progress' ? {} : { section: sectionKey }, { replace: true })
    },
    [setSearchParams]
  )

  const handleOpenLogModal = useCallback(
    (bookId = '') => {
      if (activeSection !== 'progress') {
        setSearchParams({}, { replace: true })
      }
      setLogModalBookId(bookId ? String(bookId) : '')
      setIsLogModalOpen(true)
    },
    [activeSection, setSearchParams]
  )

  const handleCloseLogModal = useCallback(() => {
    setIsLogModalOpen(false)
    setLogModalBookId('')
  }, [])

  const collectionCounts = useMemo(
    () => ({
      reading: readingBooks.length,
      want_to_read: wantToReadBooks.length,
      completed: completedBooks.length,
      favorites: favoriteBooks.length,
    }),
    [readingBooks.length, wantToReadBooks.length, completedBooks.length, favoriteBooks.length]
  )

  const activeCollection = useMemo(() => {
    const booksByKey = {
      reading: readingBooks,
      want_to_read: wantToReadBooks,
      completed: completedBooks,
      favorites: favoriteBooks,
    }
    const meta = COLLECTION_META[activeSection]
    if (!meta) return null
    return {
      ...meta,
      books: booksByKey[activeSection] || [],
    }
  }, [activeSection, readingBooks, wantToReadBooks, completedBooks, favoriteBooks])

  if (authLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  const showAvatarImage = Boolean(user?.profile_img) && failedAvatarSrc !== user?.profile_img
  const readerInitial = user?.name?.charAt(0)?.toUpperCase() || 'L'

  return (
    <main className="min-h-screen w-full max-w-[1440px] mx-auto pt-24 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 md:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-[276px_minmax(0,1fr)] gap-7 lg:gap-10 items-start">
        {/* Panel lateral izquierdo */}
        <aside
          aria-label="Panel de gestión de biblioteca"
          className="lg:sticky lg:top-28 bg-[#eae6da]/65 border border-[#d6d0c0]/85 rounded-2xl p-4 sm:p-5"
        >
          {/* Resumen del lector + racha en vivo */}
          <div className="pb-4 border-b border-[#d6d0c0]/80">
            <div className="flex items-center gap-3">
              <div
                style={{ borderRadius: '9999px' }}
                className="size-11 shrink-0 overflow-hidden bg-primary text-secondary-light font-hero-display font-semibold text-lg flex items-center justify-center ring-1 ring-black/10"
              >
                {showAvatarImage ? (
                  <img
                    src={user.profile_img}
                    alt={user?.name || 'Lector'}
                    onError={() => setFailedAvatarSrc(user.profile_img)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{readerInitial}</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="font-hero-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-secondary-dark">
                  Mi Biblioteca
                </p>
                <p className="font-hero-display text-xl font-semibold text-primary leading-tight truncate">
                  {user?.name || 'Lector'}
                </p>
              </div>
            </div>

            <div
              style={{ borderRadius: '9999px' }}
              className={`mt-3.5 w-full px-3 py-1.5 border flex items-center justify-between gap-2 text-xs font-hero-sans ${
                streakStats.isActiveToday
                  ? 'bg-white/85 border-primary/25 text-primary'
                  : 'bg-[#f8f7f2]/85 border-[#d6d0c0] text-on-surface-variant'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
                <span
                  style={{ borderRadius: '9999px' }}
                  className={`size-2 shrink-0 ${
                    streakStats.isActiveToday ? 'bg-primary' : 'bg-[#c9833b]/75'
                  }`}
                  aria-hidden="true"
                />
                <Flame
                  size={13}
                  strokeWidth={2}
                  absoluteStrokeWidth
                  className={streakStats.isActiveToday ? 'text-[#c9833b]' : 'text-on-surface-variant/75'}
                  aria-hidden="true"
                />
                <span>
                  {streakStats.currentStreak}{' '}
                  {streakStats.currentStreak === 1 ? 'día de racha' : 'días de racha'}
                </span>
              </span>

              <span className="text-[11px] font-medium shrink-0">
                {streakStats.isActiveToday ? 'Activa hoy' : 'Pendiente'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLogModal()}
              className="mt-3.5 w-full h-10 px-4 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_10px_rgba(14,81,70,0.18)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus size={15} strokeWidth={2.2} absoluteStrokeWidth aria-hidden="true" />
              <span>Registrar páginas leídas</span>
            </button>
          </div>

          {/* Navegación agrupada */}
          <nav aria-label="Secciones de biblioteca" className="mt-4 space-y-4">
            {/* Grupo: Seguimiento */}
            <div>
              <p className="px-2.5 mb-1.5 font-hero-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/75">
                Seguimiento
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                {TRACKING_NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectSection(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-hero-sans text-[13.5px] text-left transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-[#f8f7f2] border border-[#d6d0c0]/85 shadow-sm text-primary font-semibold'
                          : 'border border-transparent text-on-surface-variant hover:text-primary hover:bg-[#f8f7f2]/60 font-medium'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          style={{ borderRadius: '9999px' }}
                          className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary"
                        />
                      )}
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2.1 : 1.75}
                          absoluteStrokeWidth
                          className={isActive ? 'text-primary shrink-0' : 'text-on-surface-variant/80 shrink-0'}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Grupo: Colecciones */}
            <div>
              <p className="px-2.5 mb-1.5 font-hero-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant/75">
                Colecciones
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5">
                {COLLECTION_NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.key
                  const count = collectionCounts[item.key]
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectSection(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-hero-sans text-[13.5px] text-left transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-[#f8f7f2] border border-[#d6d0c0]/85 shadow-sm text-primary font-semibold'
                          : 'border border-transparent text-on-surface-variant hover:text-primary hover:bg-[#f8f7f2]/60 font-medium'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          style={{ borderRadius: '9999px' }}
                          className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary"
                        />
                      )}
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2.1 : 1.75}
                          absoluteStrokeWidth
                          className={isActive ? 'text-primary shrink-0' : 'text-on-surface-variant/80 shrink-0'}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      <span
                        style={{ borderRadius: '9999px' }}
                        className={`px-2 py-0.5 text-[11px] tabular-nums shrink-0 ${
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'bg-[#d6d0c0]/45 text-on-surface-variant font-medium'
                        }`}
                      >
                        {loading ? '—' : count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>
        </aside>

        {/* Panel principal */}
        <section className="min-w-0">
          {activeSection === 'progress' && (
            <ReadingProgressSection
              userId={user?.id}
              readingBooks={readingBooks}
              wantToReadBooks={wantToReadBooks}
              completedBooks={completedBooks}
              favoriteBooks={favoriteBooks}
              isLogModalOpen={isLogModalOpen}
              initialBookId={logModalBookId}
              onOpenLogModal={handleOpenLogModal}
              onCloseLogModal={handleCloseLogModal}
              onStatusSynced={refreshCollections}
            />
          )}

          {activeSection === 'stats' && (
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#d6d0c0]/75">
                <div>
                  <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-dark">
                    Resumen mensual
                  </span>
                  <h1 className="mt-1 font-hero-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-primary leading-tight">
                    Actividad y ritmo{' '}
                    <span className="italic font-medium text-secondary-dark">mensual</span>
                  </h1>
                  <p className="mt-1.5 font-hero-sans text-sm text-on-surface-variant max-w-2xl">
                    Revisá tus páginas leídas, tiempo dedicado y constancia diaria de cada mes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenLogModal()}
                  className="h-10 px-4 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(14,81,70,0.18)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Plus size={16} strokeWidth={2.1} absoluteStrokeWidth aria-hidden="true" />
                  <span>Registrar páginas leídas</span>
                </button>
              </header>

              <MonthlyStatsSection
                userId={user?.id}
                completedBooks={completedBooks}
                readingBooks={readingBooks}
                onRequestLogPages={() => handleOpenLogModal()}
              />
            </div>
          )}

          {activeCollection && (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#d6d0c0]/75">
                <div>
                  <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-dark">
                    {activeCollection.eyebrow}
                  </span>
                  <div className="mt-1 flex flex-wrap items-baseline gap-3">
                    <h1 className="font-hero-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-primary leading-tight">
                      {activeCollection.title}{' '}
                      <span className="italic font-medium text-secondary-dark">
                        {activeCollection.accent}
                      </span>
                    </h1>
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="px-3 py-0.5 bg-[#eae6da] border border-[#d6d0c0] font-hero-sans text-xs font-semibold text-primary tabular-nums"
                    >
                      {loading
                        ? 'Cargando...'
                        : `${activeCollection.books.length} ${
                            activeCollection.books.length === 1 ? 'libro' : 'libros'
                          }`}
                    </span>
                  </div>
                  <p className="mt-1.5 font-hero-sans text-sm text-on-surface-variant max-w-2xl">
                    {activeCollection.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {activeSection === 'reading' && (
                    <button
                      type="button"
                      onClick={() => handleOpenLogModal()}
                      className="h-10 px-4 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center gap-2 shadow-[0_3px_12px_rgba(14,81,70,0.18)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer"
                    >
                      <Plus size={15} strokeWidth={2.1} absoluteStrokeWidth aria-hidden="true" />
                      <span>Registrar páginas leídas</span>
                    </button>
                  )}

                  <Link
                    to="/catalog"
                    className="group h-10 px-4 rounded-[10px] bg-[#eae6da]/75 hover:bg-[#eae6da] border border-[#d6d0c0] text-primary font-hero-sans text-[13px] font-semibold inline-flex items-center gap-1.5 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </header>

              <BookGrid
                books={activeCollection.books}
                loading={loading}
                emptyTitle={activeCollection.emptyTitle}
                emptySubtitle={activeCollection.emptySubtitle}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
