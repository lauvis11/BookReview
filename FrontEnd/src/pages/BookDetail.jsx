import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import {
  ReducedMotionConfig,
  blur,
  scale,
  spring,
  transition as motionTransition,
  useShouldReduceMotion,
  useTempoTransition,
} from '@animate-ui/react/utils/motion'
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  CornerDownRight,
  Heart,
  MessageSquare,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { getBookById } from '../api/books'
import {
  createComment,
  deleteComment,
  deleteLike,
  getComments,
  getReplies,
  likeComment,
} from '../api/comments'
import { deleteFavorite, getFavorites, saveFavorite } from '../api/favorites'
import { getUserRating, saveRating } from '../api/rating'
import { deleteStatus, getByStatus, saveStatus } from '../api/status'
import ReadingTimeCalculator from '../components/book-detail/ReadingTimeCalculator'
import AiSparkleIcon from '../components/ui/AiSparkleIcon'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'
import {
  computeBookProgressFromState,
  syncReadingTracker,
  useReadingTracker,
} from '../utils/readingTrackerStore'

const STATUS_OPTIONS = [
  {
    id: 'reading',
    label: 'Leyendo',
    description: 'Libro en curso en tu mesa de lectura',
    icon: BookOpen,
    accentClass:
      'bg-[#0e5146] text-white dark:bg-[#166e5e] dark:text-white',
  },
  {
    id: 'want_to_read',
    label: 'Por leer',
    description: 'Guardalo para tu próxima lectura',
    icon: Bookmark,
    accentClass:
      'bg-[#c9833b] text-white dark:bg-[#edbd79] dark:text-[#18332f]',
  },
  {
    id: 'completed',
    label: 'Completado',
    description: 'Ya lo terminaste hasta la última página',
    icon: CheckCircle2,
    accentClass:
      'bg-[#183f38] text-[#d6e8b5] dark:bg-[#1f3b34] dark:text-[#d6e8b5]',
  },
]

const STATUS_BUTTON_LABELS = {
  none: 'Guardar en biblioteca',
  want_to_read: 'Por leer',
  reading: 'Leyendo',
  completed: 'Completado',
}

const FAVORITE_LABELS = {
  idle: 'Favorito',
  active: 'En favoritos',
}

const SYNOPSIS_COLLAPSE_THRESHOLD = 460

function useCanHover() {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return canHover
}

function formatShortDate(dateValue) {
  if (!dateValue) return ''
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateValue))
  } catch {
    return ''
  }
}

export default function BookDetail() {
  return (
    <ReducedMotionConfig>
      <BookDetailContent />
    </ReducedMotionConfig>
  )
}

function BookDetailContent() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { trackerState } = useReadingTracker(user?.id)
  const reduce = useShouldReduceMotion()
  const canHover = useCanHover()

  const pressTransition = useTempoTransition(spring.press)
  const swapTransition = useTempoTransition(motionTransition.swap)
  const disclosureTransition = useTempoTransition(motionTransition.disclosure)
  const toastTransition = useTempoTransition(spring.toast)
  const dismissTransition = useTempoTransition(motionTransition.dismiss)
  const checkPopTransition = useTempoTransition(spring.checkPop)
  const progressTransition = useTempoTransition(spring.progress)

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState(null)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [ratingBusy, setRatingBusy] = useState(false)

  const [currentStatus, setCurrentStatus] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [repliesMap, setRepliesMap] = useState({})
  const [openReplies, setOpenReplies] = useState({})
  const [loadingReplies, setLoadingReplies] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [submittingReply, setSubmittingReply] = useState({})
  const [likedComments, setLikedComments] = useState(() => new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const statusTriggerRef = useRef(null)
  const commentAreaRef = useRef(null)

  const flash = useCallback((message, tone = 'default') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ id: Date.now(), message, tone })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 2600)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const genresList = useMemo(() => {
    if (!book?.genre) return []
    if (Array.isArray(book.genre)) return book.genre.filter(Boolean)
    return String(book.genre)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }, [book])

  const authorsText = useMemo(() => {
    if (!book?.author) return ''
    if (Array.isArray(book.author)) return book.author.filter(Boolean).join(', ')
    return String(book.author)
  }, [book])

  // Build JSON-LD Book schema from loaded book data
  const bookJsonLd = useMemo(() => {
    if (!book) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      author: book.author
        ? (Array.isArray(book.author) ? book.author : String(book.author).split(',')).map((a) => ({
            '@type': 'Person',
            name: String(a).trim(),
          }))
        : undefined,
      genre: book.genre,
      numberOfPages: book.pages,
      datePublished: String(book.year),
      image: book.img || undefined,
      description: book.sinopsis || undefined,
      publisher: book.editorial ? { '@type': 'Organization', name: book.editorial } : undefined,
      aggregateRating:
        book.rate && Number(book.rate) > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: Number(book.rate),
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      url: `https://book-review-six-rho.vercel.app/books/${id}`,
    }
  }, [book, id])

  useSEO({
    title: book ? book.title : 'Cargando libro...',
    description: book
      ? `${book.title}${authorsText ? ` de ${authorsText}` : ''}. ${
          book.sinopsis
            ? book.sinopsis.slice(0, 140) + '...'
            : 'Leé reseñas, calificá y agregá a tus favoritos en BookReview.'
        }`
      : 'Detalle de libro en BookReview.',
    image: book?.img || undefined,
    type: 'book',
    jsonLd: bookJsonLd,
  })

  const refreshBookOnly = useCallback(async () => {
    try {
      const { data } = await getBookById(id)
      setBook(data)
    } catch {
      // Keep current book state if background refresh fails
    }
  }, [id])

  const refreshComments = useCallback(async () => {
    try {
      const { data } = await getComments(id)
      const list = Array.isArray(data) ? data : []
      setComments(list)
      setLikedComments((prev) => {
        const next = new Set(prev)
        list.forEach((c) => {
          if (c.user_liked) next.add(c.id)
          else next.delete(c.id)
        })
        return next
      })
    } catch {
      // Ignore comment fetch failure
    }
  }, [id])

  useEffect(() => {
    let cancelled = false

    async function loadPageData() {
      setLoading(true)
      setBook(null)
      setSynopsisExpanded(false)
      setOpenReplies({})
      setRepliesMap({})
      setConfirmDeleteId(null)

      try {
        const { data } = await getBookById(id)
        if (!cancelled) setBook(data)
      } catch {
        if (!cancelled) setBook(null)
      } finally {
        if (!cancelled) setLoading(false)
      }

      try {
        const { data } = await getComments(id)
        if (!cancelled) {
          const list = Array.isArray(data) ? data : []
          setComments(list)
          const liked = new Set()
          list.forEach((c) => {
            if (c.user_liked) liked.add(c.id)
          })
          setLikedComments(liked)
        }
      } catch {
        if (!cancelled) setComments([])
      }

      if (!isAuthenticated) {
        if (!cancelled) {
          setMyRating(null)
          setIsFavorite(false)
          setCurrentStatus(null)
        }
        return
      }

      const [ratingRes, favRes, readingRes, wantRes, completedRes] = await Promise.allSettled([
        getUserRating(id),
        getFavorites(),
        getByStatus('reading'),
        getByStatus('want_to_read'),
        getByStatus('completed'),
      ])

      if (cancelled) return

      if (ratingRes.status === 'fulfilled') {
        setMyRating(ratingRes.value?.data?.rate ?? null)
      }

      if (favRes.status === 'fulfilled') {
        const favList = Array.isArray(favRes.value?.data) ? favRes.value.data : []
        setIsFavorite(
          favList.some((b) => String(b.id) === String(id) || String(b.book_id) === String(id))
        )
      }

      const matchesBook = (res) => {
        if (res.status !== 'fulfilled') return false
        const arr = Array.isArray(res.value?.data) ? res.value.data : []
        return arr.some((b) => String(b.id) === String(id) || String(b.book_id) === String(id))
      }

      if (matchesBook(readingRes)) setCurrentStatus('reading')
      else if (matchesBook(completedRes)) setCurrentStatus('completed')
      else if (matchesBook(wantRes)) setCurrentStatus('want_to_read')
      else setCurrentStatus(null)
    }

    loadPageData()
    return () => {
      cancelled = true
    }
  }, [id, isAuthenticated])

  const bookProgress = useMemo(() => {
    if (!book || !isAuthenticated) return null
    const computed = computeBookProgressFromState(trackerState, book)
    if (!computed || computed.pagesRead <= 0) return null
    return computed
  }, [book, isAuthenticated, trackerState])

  const handleRate = async (rate) => {
    if (!isAuthenticated || ratingBusy) return
    const previous = myRating
    setMyRating(rate)
    setRatingBusy(true)
    try {
      await saveRating(id, rate)
      await refreshBookOnly()
      flash(`Calificación guardada: ${rate} de 5`)
    } catch {
      setMyRating(previous)
      flash('No se pudo guardar tu calificación', 'error')
    } finally {
      setRatingBusy(false)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) return
    const prev = isFavorite
    setIsFavorite(!prev)
    try {
      if (prev) {
        await deleteFavorite(id)
        flash('Quitado de tus favoritos')
      } else {
        await saveFavorite(id)
        flash('Guardado en favoritos')
      }
    } catch {
      setIsFavorite(prev)
      flash('No se pudo actualizar favoritos', 'error')
    }
  }

  const handleStatusSelect = async (status) => {
    if (!isAuthenticated) return
    const prev = currentStatus
    setCurrentStatus(status)
    setStatusModalOpen(false)
    try {
      await saveStatus({ book_id: id, status })
      void syncReadingTracker(user?.id, { force: true })
      flash(`Guardado en ${STATUS_BUTTON_LABELS[status] || status}`)
    } catch {
      setCurrentStatus(prev)
      flash('No se pudo actualizar el estado de lectura', 'error')
    }
  }

  const handleRemoveStatus = async () => {
    if (!isAuthenticated || !currentStatus) return
    const prev = currentStatus
    setCurrentStatus(null)
    setStatusModalOpen(false)
    try {
      await deleteStatus(id)
      void syncReadingTracker(user?.id, { force: true })
      flash('Quitado de tu biblioteca')
    } catch {
      setCurrentStatus(prev)
      flash('No se pudo quitar de tu biblioteca', 'error')
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    const content = newComment.trim()
    if (!content || submittingComment) return
    setSubmittingComment(true)
    try {
      await createComment(id, { content, parent_id: null })
      setNewComment('')
      await refreshComments()
      flash('Reseña publicada')
    } catch {
      flash('No se pudo publicar tu reseña', 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (cid) => {
    try {
      await deleteComment(cid)
      setConfirmDeleteId(null)
      await refreshComments()
      flash('Reseña eliminada')
    } catch {
      flash('No se pudo eliminar la reseña', 'error')
    }
  }

  const handleToggleReplies = async (cid) => {
    if (openReplies[cid]) {
      setOpenReplies((prev) => ({ ...prev, [cid]: false }))
      return
    }
    setOpenReplies((prev) => ({ ...prev, [cid]: true }))
    setLoadingReplies((prev) => ({ ...prev, [cid]: true }))
    try {
      const { data } = await getReplies(cid)
      const list = Array.isArray(data) ? data : []
      setRepliesMap((prev) => ({ ...prev, [cid]: list }))
      setLikedComments((prev) => {
        const next = new Set(prev)
        list.forEach((r) => {
          if (r.user_liked) next.add(r.id)
        })
        return next
      })
    } catch {
      setRepliesMap((prev) => ({ ...prev, [cid]: prev[cid] || [] }))
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [cid]: false }))
    }
  }

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault()
    const content = (replyDrafts[parentId] || '').trim()
    if (!content || submittingReply[parentId]) return
    setSubmittingReply((prev) => ({ ...prev, [parentId]: true }))
    try {
      await createComment(id, { content, parent_id: parentId })
      setReplyDrafts((prev) => ({ ...prev, [parentId]: '' }))
      const { data } = await getReplies(parentId)
      setRepliesMap((prev) => ({ ...prev, [parentId]: Array.isArray(data) ? data : [] }))
      flash('Respuesta publicada')
    } catch {
      flash('No se pudo publicar la respuesta', 'error')
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [parentId]: false }))
    }
  }

  const handleLike = async (cid) => {
    if (!isAuthenticated) {
      flash('Iniciá sesión para dar me gusta')
      return
    }
    const isLiked = likedComments.has(cid)

    setLikedComments((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(cid)
      else next.add(cid)
      return next
    })

    try {
      if (isLiked) await deleteLike(cid)
      else await likeComment(cid)

      const { data } = await getComments(id)
      setComments(Array.isArray(data) ? data : [])

      const openIds = Object.keys(openReplies).filter((key) => openReplies[key])
      await Promise.all(
        openIds.map(async (commentId) => {
          try {
            const { data: replies } = await getReplies(commentId)
            setRepliesMap((prev) => ({
              ...prev,
              [commentId]: Array.isArray(replies) ? replies : [],
            }))
          } catch {
            // Keep existing replies on error
          }
        })
      )
    } catch {
      setLikedComments((prev) => {
        const next = new Set(prev)
        if (isLiked) next.add(cid)
        else next.delete(cid)
        return next
      })
    }
  }

  const handleOpenLibChat = () => {
    if (!book) return
    window.dispatchEvent(
      new CustomEvent('open-ai-chat', {
        detail: {
          message: `Contame más sobre el libro "${book.title}" sin spoilers.`,
        },
      })
    )
  }

  const activeStatusMeta = STATUS_OPTIONS.find((item) => item.id === currentStatus) || null
  const StatusButtonIcon = activeStatusMeta ? activeStatusMeta.icon : Bookmark
  const statusKey = currentStatus || 'none'
  const pressTap = reduce ? undefined : { transform: `scale(${scale.press})` }

  const synopsisText = book?.sinopsis?.trim() || ''
  const isLongSynopsis = synopsisText.length > SYNOPSIS_COLLAPSE_THRESHOLD
  const synopsisPreview = isLongSynopsis
    ? `${synopsisText.slice(0, SYNOPSIS_COLLAPSE_THRESHOLD).replace(/\s+\S*$/, '')}…`
    : synopsisText

  const avgRating = Number(book?.rate) || 0
  const ratingsCount = Number(book?.ratings_count) || 0

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f7f2] dark:bg-[#0c1412] pt-24 md:pt-28 pb-20 px-5 sm:px-8 lg:px-10">
        <div className="max-w-[1240px] mx-auto animate-pulse">
          <div className="h-5 w-40 rounded-lg bg-[#18332f]/[0.07] dark:bg-white/[0.06] mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-4 space-y-5">
              <div className="aspect-[2/3] w-full max-w-[280px] mx-auto lg:max-w-none rounded-2xl bg-[#18332f]/[0.08] dark:bg-white/[0.06]" />
              <div className="h-32 rounded-2xl bg-[#18332f]/[0.06] dark:bg-white/[0.05]" />
            </div>
            <div className="lg:col-span-8 space-y-6">
              <div className="flex gap-2">
                <div className="h-7 w-24 rounded-lg bg-[#18332f]/[0.07] dark:bg-white/[0.06]" />
                <div className="h-7 w-28 rounded-lg bg-[#18332f]/[0.07] dark:bg-white/[0.06]" />
              </div>
              <div className="h-14 w-4/5 rounded-xl bg-[#18332f]/[0.08] dark:bg-white/[0.06]" />
              <div className="h-7 w-56 rounded-lg bg-[#18332f]/[0.06] dark:bg-white/[0.05]" />
              <div className="h-20 w-full rounded-2xl bg-[#18332f]/[0.06] dark:bg-white/[0.05]" />
              <div className="flex gap-3">
                <div className="h-12 w-52 rounded-xl bg-[#18332f]/[0.08] dark:bg-white/[0.06]" />
                <div className="h-12 w-36 rounded-xl bg-[#18332f]/[0.06] dark:bg-white/[0.05]" />
              </div>
              <div className="h-44 w-full rounded-2xl bg-[#18332f]/[0.05] dark:bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="min-h-screen bg-[#f8f7f2] dark:bg-[#0c1412] pt-28 pb-24 px-5 sm:px-8 flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div
            style={{ borderRadius: '9999px' }}
            className="w-14 h-14 mx-auto bg-[#18332f]/[0.06] dark:bg-white/[0.06] flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]"
          >
            <BookOpen size={24} strokeWidth={1.6} absoluteStrokeWidth />
          </div>
          <h1 className="font-hero-display text-3xl font-semibold text-[#18332f] dark:text-[#f0ede6]">
            No encontramos este libro
          </h1>
          <p className="font-hero-sans text-sm text-[#4a615b] dark:text-[#a6b7b1] leading-relaxed">
            Puede haber sido retirado del catálogo o el enlace ya no está disponible.
          </p>
          <div className="pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 ps-4 pe-5 py-2.5 rounded-xl bg-[#0e5146] hover:bg-[#146c5c] text-white font-hero-sans text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
            >
              <ArrowLeft size={16} strokeWidth={1.85} absoluteStrokeWidth />
              <span>Explorar el catálogo</span>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] dark:bg-[#0c1412] text-[#18332f] dark:text-[#f0ede6] font-hero-sans pt-24 md:pt-28 pb-20 md:pb-28 px-5 sm:px-8 lg:px-10">
      <div className="max-w-[1240px] mx-auto">
        {/* Top Navigation Back Link */}
        <nav aria-label="Navegación de retorno" className="mb-7 md:mb-9">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4a615b] hover:text-[#0e5146] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0e5146] rounded-md"
          >
            <ArrowLeft size={16} strokeWidth={1.75} absoluteStrokeWidth />
            <span>Volver al catálogo</span>
          </Link>
        </nav>

        {/* Asymmetric 12-Column Editorial Reading Folio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* ==================== LEFT STICKY RAIL (4 COLS) ==================== */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            {/* Hero Dust-Jacket Book Cover */}
            <Motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: blur.surface }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: reduce
                  ? motionTransition.fade
                  : { ...spring.entrance, opacity: motionTransition.reveal },
              }}
              className="max-w-[260px] sm:max-w-[300px] lg:max-w-none mx-auto"
            >
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#eae6da] dark:bg-[#192824] outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 shadow-[0_24px_48px_-16px_rgba(24,51,47,0.28),0_4px_12px_-2px_rgba(24,51,47,0.08)] dark:shadow-[0_28px_56px_-16px_rgba(0,0,0,0.75)]">
                {book.img ? (
                  <img
                    src={book.img}
                    alt={`Portada de ${book.title}`}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-[#5d726c] dark:text-[#a6b7b1]">
                    <BookOpen size={44} strokeWidth={1.25} absoluteStrokeWidth />
                    <span className="font-hero-display text-lg font-medium line-clamp-3">
                      {book.title}
                    </span>
                  </div>
                )}

                {/* Subtle physical book spine & top edge sheen */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-[14px] w-px bg-white/25"
                />
              </div>
            </Motion.div>

            {/* User Reading Progress Mini Card (only if progress exists) */}
            {bookProgress && (
              <div className="bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,51,47,0.04)] dark:shadow-none space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#18332f] dark:text-[#f0ede6]">
                    Tu progreso de lectura
                  </span>
                  <span className="text-xs font-semibold text-[#0e5146] dark:text-[#4fb39d] tabular-nums">
                    {bookProgress.percentage}%
                  </span>
                </div>

                <div
                  style={{ borderRadius: '9999px' }}
                  className="h-2 w-full bg-[#18332f]/[0.08] dark:bg-white/[0.08] overflow-hidden"
                >
                  <Motion.div
                    initial={false}
                    animate={{
                      transform: `translateX(-${100 - Math.min(100, Math.max(0, bookProgress.percentage))}%)`,
                    }}
                    transition={reduce ? motionTransition.instant : progressTransition}
                    style={{ borderRadius: '9999px' }}
                    className="h-full w-full bg-[#0e5146] dark:bg-[#166e5e]"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-[#4a615b] dark:text-[#a6b7b1] tabular-nums">
                  <span>
                    {bookProgress.pagesRead} de {bookProgress.totalPages} págs.
                  </span>
                  <Link
                    to="/library?section=progress"
                    className="font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] rounded"
                  >
                    Registrar avance
                  </Link>
                </div>
              </div>
            )}

            {/* Compact Lib IA Companion Card */}
            <div className="bg-[#0e5146] dark:bg-[#132924] border border-transparent dark:border-white/[0.08] rounded-2xl p-5 text-white shadow-[0_12px_28px_-12px_rgba(14,81,70,0.45)] dark:shadow-none">
              <div className="flex items-start gap-3.5">
                <div
                  style={{ borderRadius: '9999px' }}
                  className="w-10 h-10 shrink-0 bg-white/12 border border-white/15 flex items-center justify-center text-[#edbd79]"
                >
                  <AiSparkleIcon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-hero-display text-xl font-semibold leading-snug text-white">
                    ¿Querés saber si es para vos?
                  </h2>
                  <p className="mt-1 text-xs sm:text-[13px] text-[#cee1dc] dark:text-[#a6b7b1] leading-relaxed">
                    Pedile a Lib un resumen de tono, ritmo o lecturas parecidas, siempre sin spoilers.
                  </p>
                </div>
              </div>

              <Motion.button
                type="button"
                onClick={handleOpenLibChat}
                whileTap={pressTap}
                transition={pressTransition}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#edbd79] hover:bg-[#f3cc90] text-[#18332f] text-sm font-semibold transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#edbd79]"
              >
                <AiSparkleIcon size={15} className="text-[#18332f]" />
                <span>Preguntar a Lib</span>
              </Motion.button>
            </div>
          </aside>

          {/* ==================== RIGHT EDITORIAL COLUMN (8 COLS) ==================== */}
          <div className="lg:col-span-8 space-y-10 md:space-y-12 min-w-0">
            {/* 1. Title, Author, Colophon & Actions */}
            <section aria-labelledby="book-title-heading" className="space-y-6">
              {/* Clickable Genre Pills */}
              {genresList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genresList.map((genre) => (
                    <Link
                      key={genre}
                      to={`/catalog?genre=${encodeURIComponent(genre)}`}
                      style={{ borderRadius: '9999px' }}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium bg-[#18332f]/[0.05] hover:bg-[#18332f]/[0.1] text-[#18332f] dark:bg-white/[0.06] dark:hover:bg-white/[0.11] dark:text-[#d6e8b5] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              )}

              {/* Title & Author — Always visible on first paint */}
              <div className="space-y-2.5">
                <h1
                  id="book-title-heading"
                  className="font-hero-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-[#18332f] dark:text-[#f0ede6] leading-[1.04] tracking-[-0.02em] text-balance"
                >
                  {book.title}
                </h1>
                {authorsText && (
                  <p className="font-hero-display italic text-xl sm:text-2xl text-[#4a615b] dark:text-[#a6b7b1]">
                    por {authorsText}
                  </p>
                )}
              </div>

              {/* Editorial Colophon Strip (Single Hairline-Divided Surface) */}
              <div className="bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-2xl grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#18332f]/[0.08] dark:divide-white/[0.08] shadow-[0_1px_2px_rgba(24,51,47,0.03)] dark:shadow-none overflow-hidden">
                <div className="px-4 py-3.5 sm:px-5">
                  <span className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] block">
                    Valoración
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 tabular-nums">
                    <Star
                      size={16}
                      strokeWidth={1.75}
                      absoluteStrokeWidth
                      className="text-[#c9833b] dark:text-[#edbd79] fill-current shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-base font-semibold text-[#18332f] dark:text-[#f0ede6]">
                      {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                      ({ratingsCount})
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3.5 sm:px-5">
                  <span className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] block">
                    Extensión
                  </span>
                  <span className="mt-1 block text-base font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                    {book.pages ? `${book.pages} págs.` : 'Sin dato'}
                  </span>
                </div>

                <div className="px-4 py-3.5 sm:px-5">
                  <span className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] block">
                    Publicado
                  </span>
                  <span className="mt-1 block text-base font-semibold text-[#18332f] dark:text-[#f0ede6] tabular-nums">
                    {book.year || 'Sin dato'}
                  </span>
                </div>

                <div className="px-4 py-3.5 sm:px-5">
                  <span className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] block">
                    Editorial
                  </span>
                  <span
                    className="mt-1 block text-base font-semibold text-[#18332f] dark:text-[#f0ede6] truncate"
                    title={book.editorial || 'Sin editorial'}
                  >
                    {book.editorial || 'Independiente'}
                  </span>
                </div>
              </div>

              {/* Action Bar & Personal Rating */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-4 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Primary Reading Status Trigger with Animate UI Swap */}
                    <Motion.button
                      ref={statusTriggerRef}
                      type="button"
                      onClick={() => setStatusModalOpen(true)}
                      whileTap={pressTap}
                      transition={pressTransition}
                      aria-haspopup="dialog"
                      aria-expanded={statusModalOpen}
                      className="inline-flex items-center justify-center gap-2.5 ps-4 pe-5 py-3 rounded-xl bg-[#0e5146] hover:bg-[#146c5c] dark:bg-[#166e5e] dark:hover:bg-[#1b8270] text-white text-sm font-semibold shadow-[0_6px_18px_-8px_rgba(14,81,70,0.55)] dark:shadow-none transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
                    >
                      <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <Motion.span
                            key={statusKey}
                            className="inline-flex items-center justify-center"
                            initial={{
                              opacity: 0,
                              scale: reduce ? 1 : scale.icon,
                              filter: blur.icon,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              filter: 'blur(0px)',
                              transition: swapTransition,
                            }}
                            exit={{
                              opacity: 0,
                              scale: reduce ? 1 : scale.icon,
                              filter: blur.icon,
                              transition: swapTransition,
                            }}
                          >
                            <StatusButtonIcon size={17} strokeWidth={1.9} absoluteStrokeWidth />
                          </Motion.span>
                        </AnimatePresence>
                      </span>

                      <span className="relative inline-grid place-items-center text-left">
                        {Object.values(STATUS_BUTTON_LABELS).map((label) => (
                          <span
                            key={label}
                            aria-hidden="true"
                            className="invisible [grid-area:1/1] whitespace-nowrap"
                          >
                            {label}
                          </span>
                        ))}
                        <span className="[grid-area:1/1] justify-self-start">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <Motion.span
                              key={statusKey}
                              className="inline-block whitespace-nowrap"
                              initial={{ opacity: 0, filter: blur.icon }}
                              animate={{
                                opacity: 1,
                                filter: 'blur(0px)',
                                transition: swapTransition,
                              }}
                              exit={{
                                opacity: 0,
                                filter: blur.icon,
                                transition: swapTransition,
                              }}
                            >
                              {STATUS_BUTTON_LABELS[statusKey]}
                            </Motion.span>
                          </AnimatePresence>
                        </span>
                      </span>

                      <ChevronDown
                        size={15}
                        strokeWidth={2}
                        absoluteStrokeWidth
                        className="opacity-80 ms-0.5"
                      />
                    </Motion.button>

                    {/* Favorite Toggle Button with Animate UI Icon & Label Swap */}
                    <Motion.button
                      type="button"
                      onClick={handleFavorite}
                      aria-pressed={isFavorite}
                      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      whileTap={pressTap}
                      transition={pressTransition}
                      className={`inline-flex items-center justify-center gap-2 ps-4 pe-5 py-3 rounded-xl border text-sm font-semibold transition-[background-color,border-color,color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] ${
                        isFavorite
                          ? 'bg-[#f7e4cd]/70 dark:bg-[#3a2b17] border-[#c9833b]/45 dark:border-[#edbd79]/40 text-[#7a4d16] dark:text-[#edbd79]'
                          : 'bg-white dark:bg-[#131f1c] border-[#18332f]/[0.12] dark:border-white/[0.1] text-[#18332f] dark:text-[#f0ede6] hover:bg-[#f2f5f0] dark:hover:bg-[#192824]'
                      }`}
                    >
                      <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <Motion.span
                            key={isFavorite ? 'fav-on' : 'fav-off'}
                            className="inline-flex items-center justify-center"
                            initial={{
                              opacity: 0,
                              scale: reduce ? 1 : scale.icon,
                              filter: blur.icon,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              filter: 'blur(0px)',
                              transition: isFavorite ? checkPopTransition : swapTransition,
                            }}
                            exit={{
                              opacity: 0,
                              scale: reduce ? 1 : scale.icon,
                              filter: blur.icon,
                              transition: swapTransition,
                            }}
                          >
                            <Heart
                              size={17}
                              strokeWidth={1.9}
                              absoluteStrokeWidth
                              className={isFavorite ? 'fill-current' : ''}
                            />
                          </Motion.span>
                        </AnimatePresence>
                      </span>

                      <span className="relative inline-grid place-items-center">
                        {Object.values(FAVORITE_LABELS).map((label) => (
                          <span
                            key={label}
                            aria-hidden="true"
                            className="invisible [grid-area:1/1] whitespace-nowrap"
                          >
                            {label}
                          </span>
                        ))}
                        <span className="[grid-area:1/1]">
                          <AnimatePresence mode="popLayout" initial={false}>
                            <Motion.span
                              key={isFavorite ? 'fav-on' : 'fav-off'}
                              className="inline-block whitespace-nowrap"
                              initial={{ opacity: 0, filter: blur.icon }}
                              animate={{
                                opacity: 1,
                                filter: 'blur(0px)',
                                transition: swapTransition,
                              }}
                              exit={{
                                opacity: 0,
                                filter: blur.icon,
                                transition: swapTransition,
                              }}
                            >
                              {isFavorite ? FAVORITE_LABELS.active : FAVORITE_LABELS.idle}
                            </Motion.span>
                          </AnimatePresence>
                        </span>
                      </span>
                    </Motion.button>
                  </div>

                  {/* Interactive Personal Star Rating Bar */}
                  <div className="inline-flex flex-wrap items-center gap-3 self-start px-4 py-2.5 rounded-xl bg-[#f1efe7]/80 dark:bg-[#131f1c] border border-[#18332f]/[0.07] dark:border-white/[0.08]">
                    <span className="text-xs font-semibold text-[#4a615b] dark:text-[#a6b7b1]">
                      Tu calificación
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Calificar este libro de 1 a 5 estrellas"
                      className="flex items-center gap-0.5"
                      onMouseLeave={canHover ? () => setHoveredStar(0) : undefined}
                    >
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const displayValue = hoveredStar || Math.round(Number(myRating) || 0)
                        const isFilled = starValue <= displayValue
                        const isSelected = Math.round(Number(myRating) || 0) === starValue
                        return (
                          <Motion.button
                            key={starValue}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
                            disabled={ratingBusy}
                            onClick={() => handleRate(starValue)}
                            onMouseEnter={canHover ? () => setHoveredStar(starValue) : undefined}
                            whileTap={pressTap}
                            transition={pressTransition}
                            className={`p-1 rounded-lg cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e5146] disabled:opacity-60 ${
                              isFilled
                                ? 'text-[#c9833b] dark:text-[#edbd79]'
                                : 'text-[#18332f]/20 dark:text-white/20 hover:text-[#c9833b]/70 dark:hover:text-[#edbd79]/70'
                            }`}
                          >
                            <Star
                              size={19}
                              strokeWidth={1.75}
                              absoluteStrokeWidth
                              className={isFilled ? 'fill-current' : ''}
                            />
                          </Motion.button>
                        )
                      })}
                    </div>
                    <span className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] tabular-nums min-w-[3.2rem]">
                      {myRating ? `${Number(myRating).toFixed(0)} / 5` : 'Sin votar'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08]">
                  <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1]">
                    Iniciá sesión para guardar este libro en tu biblioteca, calificarlo o publicar una reseña.
                  </p>
                  <Link
                    to="/auth"
                    className="shrink-0 px-4 py-2 rounded-lg bg-[#0e5146] hover:bg-[#146c5c] text-white text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              )}
            </section>

            {/* 2. Editorial Synopsis */}
            {synopsisText && (
              <section
                aria-labelledby="synopsis-heading"
                className="pt-8 border-t border-[#18332f]/[0.09] dark:border-white/[0.08] space-y-4"
              >
                <h2
                  id="synopsis-heading"
                  className="font-hero-display text-2xl sm:text-[28px] font-semibold text-[#18332f] dark:text-[#f0ede6] tracking-[-0.015em]"
                >
                  Sinopsis
                </h2>

                <div className="max-w-[66ch] text-[15.5px] sm:text-[16.5px] leading-[1.76] text-[#354c46] dark:text-[#c7d3ce]">
                  {isLongSynopsis ? (
                    <>
                      <p>{synopsisExpanded ? synopsisText : synopsisPreview}</p>
                      <button
                        type="button"
                        onClick={() => setSynopsisExpanded((prev) => !prev)}
                        aria-expanded={synopsisExpanded}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] rounded"
                      >
                        <span>{synopsisExpanded ? 'Mostrar menos' : 'Leer sinopsis completa'}</span>
                        <ChevronDown
                          size={15}
                          strokeWidth={2}
                          absoluteStrokeWidth
                          className={`transition-transform duration-350 ease-[cubic-bezier(0.215,0.61,0.355,1)] ${
                            synopsisExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </>
                  ) : (
                    <p>{synopsisText}</p>
                  )}
                </div>
              </section>
            )}

            {/* 3. Reading Time Calculator */}
            <ReadingTimeCalculator book={book} />

            {/* 4. Reader Reviews Section */}
            <section
              aria-labelledby="reviews-heading"
              className="pt-8 border-t border-[#18332f]/[0.09] dark:border-white/[0.08] space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <h2
                    id="reviews-heading"
                    className="font-hero-display text-2xl sm:text-[28px] font-semibold text-[#18332f] dark:text-[#f0ede6] tracking-[-0.015em]"
                  >
                    Reseñas de lectores
                  </h2>
                  <span
                    style={{ borderRadius: '9999px' }}
                    className="px-2.5 py-0.5 text-xs font-semibold bg-[#18332f]/[0.06] dark:bg-white/[0.08] text-[#4a615b] dark:text-[#a6b7b1] tabular-nums"
                  >
                    {comments.length}
                  </span>
                </div>

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => commentAreaRef.current?.focus()}
                    className="text-sm font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] rounded"
                  >
                    Escribir reseña
                  </button>
                )}
              </div>

              {/* Clean Review Composer */}
              {isAuthenticated && (
                <form
                  onSubmit={handleCommentSubmit}
                  className="bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.1] dark:border-white/[0.09] rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_rgba(24,51,47,0.04)] dark:shadow-none focus-within:border-[#0e5146]/55 dark:focus-within:border-[#edbd79]/55 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {user?.profile_img ? (
                      <img
                        src={user.profile_img}
                        alt={user.name}
                        style={{ borderRadius: '9999px' }}
                        className="w-8 h-8 object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                      />
                    ) : (
                      <div
                        style={{ borderRadius: '9999px' }}
                        className="w-8 h-8 shrink-0 bg-[#0e5146] dark:bg-[#166e5e] text-white text-xs font-semibold flex items-center justify-center"
                      >
                        {user?.name?.charAt(0)?.toUpperCase() || 'L'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                        Compartí tu lectura sin adelantar giros clave
                      </p>
                    </div>
                  </div>

                  <textarea
                    ref={commentAreaRef}
                    id="comment-area"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="¿Qué te dejó este libro?"
                    className="w-full bg-transparent text-[15px] leading-relaxed text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 border-0 focus:ring-0 focus:outline-none resize-none py-1.5"
                  />

                  <div className="mt-3 pt-3 border-t border-[#18332f]/[0.07] dark:border-white/[0.07] flex items-center justify-between gap-3">
                    <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                      {newComment.length} / 500
                    </span>

                    <Motion.button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      whileTap={!newComment.trim() || submittingComment ? undefined : pressTap}
                      transition={pressTransition}
                      className="inline-flex items-center gap-2 ps-4 pe-4.5 py-2 rounded-xl bg-[#0e5146] hover:bg-[#146c5c] dark:bg-[#166e5e] dark:hover:bg-[#1b8270] text-white text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
                    >
                      <Send size={14} strokeWidth={1.9} absoluteStrokeWidth />
                      <span>{submittingComment ? 'Publicando...' : 'Publicar reseña'}</span>
                    </Motion.button>
                  </div>
                </form>
              )}

              {/* Empty Reviews State */}
              {comments.length === 0 ? (
                <div className="bg-white/70 dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-2xl py-12 px-6 text-center space-y-2">
                  <div
                    style={{ borderRadius: '9999px' }}
                    className="w-11 h-11 mx-auto bg-[#18332f]/[0.05] dark:bg-white/[0.06] flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]"
                  >
                    <MessageSquare size={20} strokeWidth={1.6} absoluteStrokeWidth />
                  </div>
                  <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                    Todavía no hay reseñas para este libro
                  </p>
                  <p className="text-xs sm:text-sm text-[#4a615b] dark:text-[#a6b7b1] max-w-sm mx-auto">
                    {isAuthenticated
                      ? 'Sé el primero en compartir qué te pareció para orientar a otros lectores.'
                      : 'Iniciá sesión para inaugurar las reseñas de esta lectura.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const isLiked = likedComments.has(comment.id)
                    const isOwner = isAuthenticated && user?.name === comment.name
                    const repliesOpen = Boolean(openReplies[comment.id])
                    const replies = repliesMap[comment.id] || []
                    const isConfirmingDelete = confirmDeleteId === comment.id

                    return (
                      <article
                        key={comment.id}
                        className="bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-[0_1px_2px_rgba(24,51,47,0.03)] dark:shadow-none"
                      >
                        <div className="flex gap-3.5 sm:gap-4">
                          {/* Reviewer Avatar */}
                          <Link
                            to={`/user/${comment.user_id}`}
                            style={{ borderRadius: '9999px' }}
                            className="w-10 h-10 shrink-0 overflow-hidden bg-[#0e5146] dark:bg-[#166e5e] text-white text-sm font-semibold flex items-center justify-center outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
                          >
                            {comment.profile_img ? (
                              <img
                                src={comment.profile_img}
                                alt={comment.name}
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              comment.name?.charAt(0)?.toUpperCase() || 'L'
                            )}
                          </Link>

                          {/* Reviewer Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                              <Link
                                to={`/user/${comment.user_id}`}
                                className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] hover:text-[#0e5146] dark:hover:text-[#edbd79] transition-colors duration-150"
                              >
                                {comment.name}
                              </Link>
                              <time className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                                {formatShortDate(comment.create_at)}
                              </time>
                            </div>

                            <p className="text-[14.5px] sm:text-[15px] leading-[1.68] text-[#354c46] dark:text-[#c7d3ce] max-w-[64ch] break-words">
                              {comment.content}
                            </p>

                            {/* Review Actions Row */}
                            <div className="mt-4 flex flex-wrap items-center gap-4">
                              {/* Like Button */}
                              <Motion.button
                                type="button"
                                onClick={() => handleLike(comment.id)}
                                aria-pressed={isLiked}
                                aria-label={isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
                                whileTap={pressTap}
                                transition={pressTransition}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] rounded ${
                                  isLiked
                                    ? 'text-[#0e5146] dark:text-[#edbd79]'
                                    : 'text-[#5d726c] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6]'
                                }`}
                              >
                                <span className="relative inline-flex items-center justify-center w-4 h-4">
                                  <AnimatePresence mode="popLayout" initial={false}>
                                    <Motion.span
                                      key={isLiked ? 'liked' : 'unliked'}
                                      className="inline-flex items-center justify-center"
                                      initial={{
                                        opacity: 0,
                                        scale: reduce ? 1 : scale.icon,
                                        filter: blur.icon,
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1,
                                        filter: 'blur(0px)',
                                        transition: isLiked ? checkPopTransition : swapTransition,
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: reduce ? 1 : scale.icon,
                                        filter: blur.icon,
                                        transition: swapTransition,
                                      }}
                                    >
                                      <Heart
                                        size={15}
                                        strokeWidth={1.9}
                                        absoluteStrokeWidth
                                        className={isLiked ? 'fill-current' : ''}
                                      />
                                    </Motion.span>
                                  </AnimatePresence>
                                </span>
                                <span className="tabular-nums">{comment.likes || 0}</span>
                              </Motion.button>

                              {/* Replies Disclosure Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleReplies(comment.id)}
                                aria-expanded={repliesOpen}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d726c] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146] rounded"
                              >
                                <MessageSquare size={14} strokeWidth={1.85} absoluteStrokeWidth />
                                <span>{repliesOpen ? 'Ocultar respuestas' : 'Respuestas'}</span>
                                <ChevronDown
                                  size={14}
                                  strokeWidth={2}
                                  absoluteStrokeWidth
                                  className={`transition-transform duration-350 ease-[cubic-bezier(0.215,0.61,0.355,1)] ${
                                    repliesOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {/* Delete with inline confirmation */}
                              {isOwner && (
                                <div className="ms-auto flex items-center gap-2">
                                  {isConfirmingDelete ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="px-2.5 py-1 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold transition-colors duration-150 cursor-pointer"
                                      >
                                        Eliminar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-1 rounded-lg text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6] cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(comment.id)}
                                      aria-label="Eliminar reseña"
                                      className="p-1.5 rounded-lg text-[#5d726c] dark:text-[#a6b7b1] hover:text-[#ba1a1a] dark:hover:text-[#ff8a80] hover:bg-[#ba1a1a]/[0.07] dark:hover:bg-[#ff8a80]/10 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ba1a1a]"
                                    >
                                      <Trash2 size={15} strokeWidth={1.8} absoluteStrokeWidth />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Animated Replies Disclosure (Animate UI disclosure recipe) */}
                            <AnimatePresence initial={false}>
                              {repliesOpen && (
                                <Motion.div
                                  initial={{
                                    height: 0,
                                    opacity: 0,
                                    filter: blur.disclosure,
                                  }}
                                  animate={{
                                    height: 'auto',
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transitionEnd: { filter: 'none' },
                                  }}
                                  exit={{
                                    height: 0,
                                    opacity: 0,
                                    filter: blur.disclosure,
                                  }}
                                  transition={disclosureTransition}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className="mt-4 pt-4 pl-4 border-l-2 border-[#18332f]/[0.1] dark:border-white/[0.1] space-y-3.5">
                                    {loadingReplies[comment.id] ? (
                                      <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                                        Cargando respuestas...
                                      </p>
                                    ) : replies.length > 0 ? (
                                      replies.map((reply) => {
                                        const replyLiked = likedComments.has(reply.id)
                                        return (
                                          <div key={reply.id} className="flex gap-3">
                                            <Link
                                              to={`/user/${reply.user_id}`}
                                              style={{ borderRadius: '9999px' }}
                                              className="w-7 h-7 shrink-0 overflow-hidden bg-[#f7e4cd] dark:bg-[#293e38] text-[#7a4d16] dark:text-[#edbd79] text-xs font-semibold flex items-center justify-center outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                                            >
                                              {reply.profile_img ? (
                                                <img
                                                  src={reply.profile_img}
                                                  alt={reply.name}
                                                  decoding="async"
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                reply.name?.charAt(0)?.toUpperCase() || 'L'
                                              )}
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-baseline gap-2">
                                                <Link
                                                  to={`/user/${reply.user_id}`}
                                                  className="text-xs font-semibold text-[#18332f] dark:text-[#f0ede6] hover:text-[#0e5146] dark:hover:text-[#edbd79]"
                                                >
                                                  {reply.name}
                                                </Link>
                                                <time className="text-[11px] text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                                                  {formatShortDate(reply.create_at)}
                                                </time>
                                              </div>
                                              <p className="mt-0.5 text-sm text-[#354c46] dark:text-[#c7d3ce] leading-relaxed break-words">
                                                {reply.content}
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => handleLike(reply.id)}
                                                aria-pressed={replyLiked}
                                                className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors duration-150 cursor-pointer ${
                                                  replyLiked
                                                    ? 'text-[#0e5146] dark:text-[#edbd79]'
                                                    : 'text-[#5d726c] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6]'
                                                }`}
                                              >
                                                <Heart
                                                  size={13}
                                                  strokeWidth={1.9}
                                                  absoluteStrokeWidth
                                                  className={replyLiked ? 'fill-current' : ''}
                                                />
                                                <span className="tabular-nums">
                                                  {reply.likes || 0}
                                                </span>
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                                        Todavía no hay respuestas en este hilo.
                                      </p>
                                    )}

                                    {/* Inline Reply Form */}
                                    {isAuthenticated && (
                                      <form
                                        onSubmit={(e) => handleReplySubmit(e, comment.id)}
                                        className="flex items-center gap-2 pt-1"
                                      >
                                        <CornerDownRight
                                          size={14}
                                          strokeWidth={1.75}
                                          absoluteStrokeWidth
                                          className="text-[#5d726c] dark:text-[#a6b7b1] shrink-0"
                                          aria-hidden="true"
                                        />
                                        <input
                                          type="text"
                                          maxLength={500}
                                          value={replyDrafts[comment.id] || ''}
                                          onChange={(e) =>
                                            setReplyDrafts((prev) => ({
                                              ...prev,
                                              [comment.id]: e.target.value,
                                            }))
                                          }
                                          placeholder={`Responder a ${comment.name}...`}
                                          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[#f8f7f2] dark:bg-[#192824] border border-[#18332f]/[0.1] dark:border-white/[0.1] text-xs sm:text-sm text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79]"
                                        />
                                        <Motion.button
                                          type="submit"
                                          disabled={
                                            !(replyDrafts[comment.id] || '').trim() ||
                                            submittingReply[comment.id]
                                          }
                                          whileTap={
                                            !(replyDrafts[comment.id] || '').trim() ||
                                            submittingReply[comment.id]
                                              ? undefined
                                              : pressTap
                                          }
                                          transition={pressTransition}
                                          className="px-3 py-2 rounded-xl bg-[#0e5146] hover:bg-[#146c5c] dark:bg-[#166e5e] text-white text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          Responder
                                        </Motion.button>
                                      </form>
                                    )}
                                  </div>
                                </Motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Animated Status Modal (Animate UI modal recipe) */}
      <AnimatePresence>
        {statusModalOpen && (
          <StatusModal
            currentStatus={currentStatus}
            onClose={() => {
              setStatusModalOpen(false)
              statusTriggerRef.current?.focus()
            }}
            onSelect={handleStatusSelect}
            onRemove={handleRemoveStatus}
          />
        )}
      </AnimatePresence>

      {/* Live Region Toast (Animate UI toast recipe + A17 accessible status) */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4"
      >
        <AnimatePresence mode="popLayout">
          {toast && (
            <Motion.div
              key={toast.id}
              initial={{
                opacity: 0,
                y: reduce ? 0 : 12,
                scale: reduce ? 1 : scale.toast,
                filter: blur.surface,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                transition: toastTransition,
              }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : 8,
                scale: reduce ? 1 : scale.toast,
                filter: blur.surface,
                transition: dismissTransition,
              }}
              style={{ borderRadius: '9999px' }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-[0_14px_36px_-10px_rgba(12,20,18,0.35)] border ${
                toast.tone === 'error'
                  ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                  : 'bg-[#18332f] dark:bg-[#f0ede6] text-[#f8f7f2] dark:text-[#0c1412] border-white/10 dark:border-black/10'
              }`}
            >
              {toast.message}
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

function StatusModal({ currentStatus, onClose, onSelect, onRemove }) {
  const reduce = useShouldReduceMotion()
  const dialogSpring = useTempoTransition(spring.dialog)
  const dialogFade = useTempoTransition(motionTransition.dialogFade)
  const dismissTransition = useTempoTransition(motionTransition.dismiss)
  const overlayTransition = useTempoTransition(motionTransition.overlay)
  const pressTransition = useTempoTransition(spring.press)
  const closeBtnRef = useRef(null)

  useEffect(() => {
    closeBtnRef.current?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const tipped = `perspective(500px) rotateX(-20deg) scale(${scale.dialog})`
  const upright = 'perspective(500px) rotateX(0deg) scale(1)'
  const hidden = {
    opacity: 0,
    filter: blur.surface,
    transform: reduce ? upright : tipped,
  }

  return (
    <Motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      onClick={onClose}
      initial={{ backgroundColor: 'rgba(12, 20, 18, 0)', backdropFilter: 'blur(0px)' }}
      animate={{
        backgroundColor: 'rgba(12, 20, 18, 0.5)',
        backdropFilter: 'blur(4px)',
        transition: overlayTransition,
      }}
      exit={{
        backgroundColor: 'rgba(12, 20, 18, 0)',
        backdropFilter: 'blur(0px)',
        transition: overlayTransition,
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <Motion.div
        onClick={(e) => e.stopPropagation()}
        initial={hidden}
        animate={{
          opacity: 1,
          filter: 'blur(0px)',
          transform: upright,
          transition: { ...dialogSpring, opacity: dialogFade },
          transitionEnd: { filter: 'none' },
        }}
        exit={{
          ...hidden,
          transition: dismissTransition,
        }}
        className="w-full max-w-sm bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.1] dark:border-white/[0.1] rounded-[20px] shadow-[0_24px_64px_-16px_rgba(12,20,18,0.38)] dark:shadow-[0_28px_72px_-16px_rgba(0,0,0,0.8)] overflow-hidden overscroll-contain"
      >
        <div className="px-5 py-4 border-b border-[#18332f]/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div>
            <h3
              id="status-modal-title"
              className="font-hero-display text-xl font-semibold text-[#18332f] dark:text-[#f0ede6]"
            >
              Estado de lectura
            </h3>
            <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] mt-0.5">
              Elegí en qué estante guardar este libro
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector de estado"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1] hover:bg-[#18332f]/[0.06] dark:hover:bg-white/[0.07] hover:text-[#18332f] dark:hover:text-[#f0ede6] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e5146]"
          >
            <X size={18} strokeWidth={1.85} absoluteStrokeWidth />
          </button>
        </div>

        {/* Concentric padding (p-2) + inner rounded-xl inside outer rounded-[20px] */}
        <div className="p-2 space-y-1">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = currentStatus === option.id
            return (
              <Motion.button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                whileTap={reduce ? undefined : { transform: `scale(${scale.choice})` }}
                transition={pressTransition}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left transition-[background-color,border-color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0e5146] ${
                  isSelected
                    ? 'bg-[#f2f5f0] dark:bg-[#192824] border-[#0e5146]/30 dark:border-[#edbd79]/35'
                    : 'border-transparent hover:bg-[#f8f7f2] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${option.accentClass}`}
                >
                  <Icon size={18} strokeWidth={1.85} absoluteStrokeWidth />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                    {option.label}
                  </span>
                  <span className="block text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                    {option.description}
                  </span>
                </div>

                {isSelected && (
                  <span className="text-[#0e5146] dark:text-[#edbd79] shrink-0">
                    <Check size={18} strokeWidth={2.2} absoluteStrokeWidth />
                  </span>
                )}
              </Motion.button>
            )
          })}

          {currentStatus && (
            <div className="pt-1 mt-1 border-t border-[#18332f]/[0.07] dark:border-white/[0.07]">
              <button
                type="button"
                onClick={onRemove}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-[#ba1a1a] dark:text-[#ff8a80] hover:bg-[#ba1a1a]/[0.07] dark:hover:bg-[#ff8a80]/10 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ba1a1a]"
              >
                <Trash2 size={14} strokeWidth={1.85} absoluteStrokeWidth />
                <span>Quitar de mi biblioteca</span>
              </button>
            </div>
          )}
        </div>
      </Motion.div>
    </Motion.div>
  )
}
