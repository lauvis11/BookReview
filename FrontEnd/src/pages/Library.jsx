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
    title: 'Leyendo actualmente',
    subtitle: 'Los títulos en tu mesa de lectura. Sumá páginas cada día para sostener tu racha.',
    emptyTitle: 'Todavía no estás leyendo ningún libro',
    emptySubtitle: 'Explorá el catálogo y marcá un libro como "Leyendo" o registrá tus primeras páginas.',
  },
  want_to_read: {
    title: 'Por leer',
    subtitle: 'Tus próximas lecturas guardadas para cuando termines el libro actual.',
    emptyTitle: 'Tu lista "Por leer" está vacía',
    emptySubtitle: 'Explorá el catálogo y guardá libros para tenerlos siempre a mano.',
  },
  completed: {
    title: 'Libros completados',
    subtitle: 'Todas las lecturas que llevaste hasta la última página.',
    emptyTitle: 'Aún no completaste ningún libro',
    emptySubtitle: 'Cuando termines un libro o llegues al 100% de sus páginas, aparecerá acá.',
  },
  favorites: {
    title: 'Tus favoritos',
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
    <main className="min-h-screen w-full max-w-[1380px] mx-auto pt-24 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 lg:grid-cols-[268px_minmax(0,1fr)] gap-6 lg:gap-9 items-start">
        {/* Panel lateral estilo Apple Books / macOS Settings */}
        <aside
          aria-label="Panel de gestión de biblioteca"
          className="lg:sticky lg:top-28 bg-white dark:bg-[#131f1c] border border-black/[0.07] dark:border-white/[0.08] rounded-[22px] p-4 shadow-[0_1px_2px_rgba(16,42,36,0.04),0_8px_24px_-8px_rgba(16,42,36,0.07)] dark:shadow-none"
        >
          {/* Identidad del lector */}
          <div className="flex items-center gap-3 px-1">
            <div
              style={{ borderRadius: '9999px' }}
              className="size-10 shrink-0 overflow-hidden bg-[#0e5146] dark:bg-[#166e5e] text-[#edbd79] font-hero-display font-semibold text-lg flex items-center justify-center outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
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
              <p className="font-hero-display text-[21px] font-semibold text-[#152e29] dark:text-[#f0ede6] leading-tight truncate">
                {user?.name || 'Lector'}
              </p>
              <p className="font-hero-sans text-[12px] font-medium text-[#5c726c] dark:text-[#8ea39c] leading-tight mt-0.5">
                Mi Biblioteca
              </p>
            </div>
          </div>

          {/* Estado compacto de racha diaria */}
          <div className="mt-4 rounded-[14px] bg-[#f6f4ee] dark:bg-[#192824] border border-black/[0.05] dark:border-white/[0.06] px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Flame
                size={15}
                strokeWidth={2}
                absoluteStrokeWidth
                className={
                  streakStats.isActiveToday
                    ? 'text-[#c9833b] dark:text-[#edbd79] shrink-0'
                    : 'text-[#738781] dark:text-[#7f948e] shrink-0'
                }
                aria-hidden="true"
              />
              <span className="font-hero-sans text-[13px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums truncate">
                {streakStats.currentStreak}{' '}
                {streakStats.currentStreak === 1 ? 'día de racha' : 'días de racha'}
              </span>
            </div>

            <span
              style={{ borderRadius: '9999px' }}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-hero-sans text-[11px] font-medium shrink-0 ${
                streakStats.isActiveToday
                  ? 'bg-[#0e5146]/10 text-[#0e5146] dark:bg-[#4fb39d]/15 dark:text-[#4fb39d]'
                  : 'bg-[#c9833b]/12 text-[#8d571b] dark:bg-[#edbd79]/12 dark:text-[#edbd79]'
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
              {streakStats.isActiveToday ? 'Hoy' : 'Pendiente'}
            </span>
          </div>

          {/* Acción primaria de la biblioteca */}
          <button
            type="button"
            onClick={() => handleOpenLogModal()}
            className="mt-3 w-full h-10 ps-3.5 pe-4 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
          >
            <Plus size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            <span>Registrar páginas</span>
          </button>

          <div className="my-4 h-px bg-black/[0.06] dark:bg-white/[0.07]" aria-hidden="true" />

          {/* Navegación agrupada */}
          <nav aria-label="Secciones de biblioteca" className="space-y-4">
            {/* Grupo: Seguimiento */}
            <div>
              <p className="px-2.5 mb-1.5 font-hero-sans text-[12px] font-medium text-[#647a74] dark:text-[#869b94]">
                Seguimiento
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                {TRACKING_NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleSelectSection(item.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 h-9 rounded-[10px] font-hero-sans text-[13.5px] text-left transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d] ${
                        isActive
                          ? 'bg-[#0e5146]/[0.09] text-[#0e5146] dark:bg-[#4fb39d]/[0.14] dark:text-[#f0ede6] font-semibold'
                          : 'text-[#485f59] hover:text-[#152e29] hover:bg-black/[0.035] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.05] font-medium'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.65}
                          absoluteStrokeWidth
                          className={
                            isActive
                              ? 'text-[#0e5146] dark:text-[#4fb39d] shrink-0'
                              : 'text-[#6c817b] dark:text-[#7f948e] shrink-0'
                          }
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
              <p className="px-2.5 mb-1.5 font-hero-sans text-[12px] font-medium text-[#647a74] dark:text-[#869b94]">
                Colecciones
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
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
                      className={`w-full flex items-center justify-between gap-2 px-2.5 h-9 rounded-[10px] font-hero-sans text-[13.5px] text-left transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d] ${
                        isActive
                          ? 'bg-[#0e5146]/[0.09] text-[#0e5146] dark:bg-[#4fb39d]/[0.14] dark:text-[#f0ede6] font-semibold'
                          : 'text-[#485f59] hover:text-[#152e29] hover:bg-black/[0.035] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.05] font-medium'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.65}
                          absoluteStrokeWidth
                          className={
                            isActive
                              ? 'text-[#0e5146] dark:text-[#4fb39d] shrink-0'
                              : 'text-[#6c817b] dark:text-[#7f948e] shrink-0'
                          }
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      <span
                        className={`text-[12px] tabular-nums shrink-0 ${
                          isActive
                            ? 'text-[#0e5146] dark:text-[#4fb39d] font-semibold'
                            : 'text-[#738781] dark:text-[#7f948e] font-normal'
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
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-black/[0.07] dark:border-white/[0.08]">
                <div className="min-w-0">
                  <h1 className="font-hero-display text-[32px] sm:text-[38px] font-semibold tracking-[-0.025em] text-[#152e29] dark:text-[#f0ede6] leading-[1.08]">
                    Estadísticas mensuales
                  </h1>
                  <p className="mt-1.5 font-hero-sans text-[14px] text-[#566d67] dark:text-[#a6b7b1] max-w-2xl leading-relaxed">
                    Revisá tus páginas leídas, tiempo dedicado y constancia diaria de cada mes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenLogModal()}
                  className="h-10 ps-3.5 pe-4 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer shrink-0 self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
                >
                  <Plus size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                  <span>Registrar páginas</span>
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
            <div className="space-y-7">
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-black/[0.07] dark:border-white/[0.08]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-hero-display text-[32px] sm:text-[38px] font-semibold tracking-[-0.025em] text-[#152e29] dark:text-[#f0ede6] leading-[1.08]">
                      {activeCollection.title}
                    </h1>
                    <span
                      style={{ borderRadius: '9999px' }}
                      className="px-2.5 py-0.5 bg-[#efede6] dark:bg-[#192824] border border-black/[0.06] dark:border-white/[0.08] font-hero-sans text-[12px] font-semibold text-[#152e29] dark:text-[#f0ede6] tabular-nums"
                    >
                      {loading
                        ? 'Cargando...'
                        : `${activeCollection.books.length} ${
                            activeCollection.books.length === 1 ? 'libro' : 'libros'
                          }`}
                    </span>
                  </div>
                  <p className="mt-1.5 font-hero-sans text-[14px] text-[#566d67] dark:text-[#a6b7b1] max-w-2xl leading-relaxed">
                    {activeCollection.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {activeSection === 'reading' && (
                    <button
                      type="button"
                      onClick={() => handleOpenLogModal()}
                      className="h-10 ps-3.5 pe-4 rounded-[12px] bg-[#0e5146] hover:bg-[#166e5e] dark:bg-[#166e5e] dark:hover:bg-[#1d8572] text-white font-hero-sans text-[13px] font-semibold inline-flex items-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
                    >
                      <Plus size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                      <span>Registrar páginas</span>
                    </button>
                  )}

                  <Link
                    to="/catalog"
                    className="group h-10 ps-4 pe-3.5 rounded-[12px] bg-white hover:bg-[#f4f2eb] dark:bg-[#131f1c] dark:hover:bg-[#192824] border border-black/[0.08] dark:border-white/[0.1] text-[#152e29] dark:text-[#f0ede6] font-hero-sans text-[13px] font-semibold inline-flex items-center gap-1.5 transition-[background-color,transform] duration-150 ease-out motion-safe:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] dark:focus-visible:outline-[#4fb39d]"
                  >
                    <span>Explorar catálogo</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="text-[#5c726c] dark:text-[#a6b7b1] transition-transform duration-150 ease-out group-hover:translate-x-0.5"
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
