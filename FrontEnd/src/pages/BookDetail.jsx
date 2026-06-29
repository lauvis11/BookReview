import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBookById } from '../api/books'
import { getComments, getReplies, createComment, deleteComment, likeComment, deleteLike } from '../api/comments'
import { getUserRating, saveRating } from '../api/rating'
import { saveFavorite, deleteFavorite, getFavorites } from '../api/favorites'
import { saveStatus } from '../api/status'
import { useAuth } from '../context/AuthContext'
import { useSEO } from '../hooks/useSEO'

export default function BookDetail() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState(null)

  // Build JSON-LD Book schema from loaded book data
  const bookJsonLd = book ? {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: book.author ? book.author.split(',').map(a => ({ '@type': 'Person', name: a.trim() })) : undefined,
    genre: book.genre,
    numberOfPages: book.pages,
    datePublished: String(book.year),
    image: book.img || undefined,
    description: book.sinopsis || undefined,
    publisher: book.editorial ? { '@type': 'Organization', name: book.editorial } : undefined,
    aggregateRating: book.rate && Number(book.rate) > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Number(book.rate),
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    url: `https://book-review-six-rho.vercel.app/books/${id}`,
  } : null

  useSEO({
    title: book ? book.title : 'Cargando libro...',
    description: book
      ? `${book.title}${ book.author ? ` de ${book.author}` : ''}. ${book.sinopsis ? book.sinopsis.slice(0, 140) + '...' : 'Leé reseñas, calificá y agregá a tus favoritos en BookReview.'}`
      : 'Detalle de libro en BookReview.',
    image: book?.img || undefined,
    type: 'book',
    jsonLd: bookJsonLd,
  })
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [repliesMap, setRepliesMap] = useState({})
  const [openReplies, setOpenReplies] = useState({})
  const [statusMsg, setStatusMsg] = useState('')
  const [likedComments, setLikedComments] = useState(new Set())
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => { fetchBook(); fetchComments(); if (isAuthenticated) { fetchMyRating(); checkFavorite() } }, [id])

  const fetchBook = async () => {
    setLoading(true)
    try { const { data } = await getBookById(id); setBook(data) } catch (_) {}
    setLoading(false)
  }
  
  const fetchComments = async () => { 
    try { 
      const { data } = await getComments(id)
      setComments(data)
      // Merge backend user_liked with existing local state
      setLikedComments(prev => {
        const next = new Set(prev)
        data.forEach(c => {
          if (c.user_liked) next.add(c.id)
          else next.delete(c.id)
        })
        return next
      })
    } catch (_) {} 
  }
  
  const fetchMyRating = async () => { try { const { data } = await getUserRating(id); setMyRating(data.rate) } catch (_) {} }
  const checkFavorite = async () => { try { const { data } = await getFavorites(); setIsFavorite(Array.isArray(data) && data.some(b => String(b.id) === String(id) || String(b.book_id) === String(id))) } catch (_) {} }

  const handleRate = async (rate) => {
    if (!isAuthenticated) return
    try { await saveRating(id, rate); setMyRating(rate); fetchBook() } catch (_) {}
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) return
    const prev = isFavorite
    setIsFavorite(!prev) // Optimistic update
    try {
      if (prev) {
        await deleteFavorite(id)
        flash('Eliminado de favoritos')
      } else {
        await saveFavorite(id)
        flash('¡Agregado a favoritos!')
      }
    } catch (_) {
      setIsFavorite(prev) // Revert on error
      flash('Error al actualizar favoritos')
    }
  }

  const handleStatus = async (status) => {
    if (!isAuthenticated) return
    const STATUS_LABELS = {
      'want_to_read': 'Por leer',
      'reading': 'Leyendo',
      'completed': 'Completado'
    }
    try { await saveStatus({ book_id: id, status }); flash(`Agregado a: ${STATUS_LABELS[status] || status}`) } catch (_) {}
  }

  const flash = (msg) => { setStatusMsg(msg); setTimeout(() => setStatusMsg(''), 2000) }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try { await createComment(id, { content: newComment, parent_id: null }); setNewComment(''); fetchComments() } catch (_) {}
  }

  const handleDeleteComment = async (cid) => { try { await deleteComment(cid); fetchComments() } catch (_) {} }

  const handleLoadReplies = async (cid) => {
    if (openReplies[cid]) { setOpenReplies(p => ({ ...p, [cid]: false })); return }
    try { 
      const { data } = await getReplies(cid)
      setRepliesMap(p => ({ ...p, [cid]: data }))
      setOpenReplies(p => ({ ...p, [cid]: true }))
      // Merge liked replies into existing state
      setLikedComments(prev => {
        const next = new Set(prev)
        data.forEach(r => {
          if (r.user_liked) next.add(r.id)
        })
        return next
      })
    } catch (_) {}
  }

  const handleLike = async (cid) => { 
    if (!isAuthenticated) return
    const isLiked = likedComments.has(cid)
    
    // Optimistic update
    if (isLiked) {
      setLikedComments(prev => {
        const next = new Set(prev)
        next.delete(cid)
        return next
      })
    } else {
      setLikedComments(prev => new Set([...prev, cid]))
    }
    
    try { 
      if (isLiked) {
        await deleteLike(cid)
      } else {
        await likeComment(cid)
      }
      // Just reload comments count, not the liked state
      const { data } = await getComments(id)
      setComments(data)
      // Reload replies if any are open
      for (const commentId of Object.keys(openReplies)) {
        if (openReplies[commentId]) {
          const { data: replies } = await getReplies(commentId)
          setRepliesMap(p => ({ ...p, [commentId]: replies }))
        }
      }
    } catch (_) {
      // Revert on error
      if (isLiked) {
        setLikedComments(prev => new Set([...prev, cid]))
      } else {
        setLikedComments(prev => {
          const next = new Set(prev)
          next.delete(cid)
          return next
        })
      }
    } 
  }

  const renderStars = (rating, size = 'text-3xl', interactive = false) => {
    const stars = [1, 2, 3, 4, 5]
    return (
      <div className={`flex text-[#E5B02E]`}>
        {stars.map(s => (
          <button key={s} disabled={!interactive} onClick={() => interactive && handleRate(s)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}>
            <span className={`material-symbols-outlined ${size}`}
              style={{ fontVariationSettings: s <= Math.round(rating) ? "'FILL' 1" : "'FILL' 0" }}>
              star
            </span>
          </button>
        ))}
      </div>
    )
  }

  if (loading) return (
    <main className="pt-20 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 max-w-[1440px] mx-auto">
      <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
        <div className="lg:col-span-5 aspect-[2/3] max-h-[50vh] lg:max-h-none w-full bg-surface-container-low rounded-sm" />
        <div className="lg:col-span-7 space-y-6">
          <div className="h-4 bg-surface-container-low rounded w-40" />
          <div className="h-16 bg-surface-container-low rounded w-3/4" />
          <div className="h-6 bg-surface-container-low rounded w-1/3" />
          <div className="h-40 bg-surface-container-low rounded" />
        </div>
      </div>
    </main>
  )

  if (!book) return <div className="text-center py-20 text-on-surface-variant font-headline text-2xl">Libro no encontrado</div>

  return (
    <main className="pt-20 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 max-w-[1440px] mx-auto">
      {/* Hero Section: The "Dust Jacket" Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start mb-12 md:mb-24">
        {/* Left: Large Book Cover */}
        <div className="lg:col-span-5 xl:col-span-4 group relative">
          <div className="aspect-[2/3] w-full max-h-[60vw] sm:max-h-[50vw] lg:max-h-none rounded-sm overflow-hidden shadow-[6px_0_30px_-8px_rgba(0,0,0,0.4)] transition-all duration-500 group-hover:shadow-[8px_0_40px_-8px_rgba(0,0,0,0.5)]">
            {book.img ? (
              <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={book.img} alt={book.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container text-6xl text-primary/20">📖</div>
            )}
            {/* Subtle spine */}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent pointer-events-none z-10"></div>
          </div>
        </div>

        {/* Right: Editorial Meta */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 md:gap-8">
          <div>
            <span className="font-label text-[10px] md:text-xs uppercase tracking-[0.2em] text-secondary font-semibold mb-3 md:mb-4 block">
              {Array.isArray(book.genre) ? book.genre.join(' / ') : book.genre || 'Ficción'}
            </span>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary leading-[0.9] tracking-tighter mb-4 md:mb-6">
              {book.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-8 sm:gap-y-4">
              <span className="font-headline italic text-lg md:text-2xl text-on-surface-variant">
                por {Array.isArray(book.author) ? book.author.join(', ') : book.author}
              </span>
              <div className="flex flex-wrap gap-4 sm:gap-6 items-center sm:border-l sm:border-outline-variant sm:pl-8 pt-2 sm:pt-0 border-t border-outline-variant/20 sm:border-t-0">
                <div className="flex flex-col">
                  <span className="font-label text-[9px] md:text-xs uppercase tracking-widest text-outline">Publicado</span>
                  <span className="font-body font-bold text-base md:text-lg text-primary">{book.year}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label text-[9px] md:text-xs uppercase tracking-widest text-outline">Páginas</span>
                  <span className="font-body font-bold text-base md:text-lg text-primary">{book.pages}</span>
                </div>
                {book.editorial && (
                  <div className="flex flex-col">
                    <span className="font-label text-[9px] md:text-xs uppercase tracking-widest text-outline">Editorial</span>
                    <span className="font-body font-bold text-base md:text-lg text-primary">{book.editorial}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-2 py-4 md:py-6">
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {renderStars(Number(book.rate), 'text-2xl md:text-3xl')}
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-2xl md:text-3xl font-black text-primary">{Number(book.rate).toFixed(1)} / 5</span>
              </div>
            </div>
            <span className="text-xs md:text-sm text-on-surface-variant font-label uppercase tracking-widest font-bold">
              {book.ratings_count || 0} {Number(book.ratings_count) === 1 ? 'valoración' : 'valoraciones'}
            </span>
          </div>

          {/* User rating */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="font-label text-sm uppercase tracking-widest text-on-surface-variant font-bold">Tu calificación</span>
              {renderStars(myRating || 0, 'text-2xl', true)}
            </div>
          )}

          {/* Action buttons */}
          {isAuthenticated && (
            <div className="flex flex-wrap gap-3 md:gap-4 pt-2 md:pt-4">
              <button onClick={() => setStatusModalOpen(true)}
                className="flex-1 sm:flex-none px-6 md:px-10 py-3.5 md:py-4 bg-primary text-on-primary rounded-xl font-label font-bold uppercase tracking-widest text-xs md:text-sm shadow-xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer">
                <span className="material-symbols-outlined text-base md:text-lg">bookmark</span>
                Por leer
              </button>
              <button onClick={handleFavorite}
                className={`py-3.5 md:py-4 border rounded-xl font-label font-bold uppercase tracking-widest text-sm transition-all duration-300 w-12 md:w-14 h-12 md:h-14 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 group ${isFavorite ? 'bg-[#412817] border-[#412817] text-[#e7bea5] shadow-lg' : 'border-outline text-secondary bg-surface-container-high hover:bg-surface-container-low'}`}>
                <span className={`material-symbols-outlined text-lg transition-transform duration-300 group-hover:scale-110 ${isFavorite ? 'scale-110' : ''}`}
                  style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
              </button>
            </div>
          )}

          {statusMsg && <p className="text-sm text-accent font-label uppercase tracking-widest font-bold animate-pulse">{statusMsg}</p>}
        </div>
      </section>

      {/* Content Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 mb-16 md:mb-24">
        <div className="lg:col-span-8 space-y-12">
          {/* Synopsis */}
          {book.sinopsis && (
            <div className="bg-surface-container-low p-6 sm:p-10 md:p-16 rounded-xl relative">
              <span className="absolute top-8 left-8 text-6xl font-serif text-outline-variant opacity-30 select-none">"</span>
              <h2 className="font-label text-xs uppercase tracking-[0.3em] text-secondary font-bold mb-8">Sinopsis</h2>
              <div className="font-body text-lg leading-relaxed text-on-surface-variant space-y-6">
                <p>{book.sinopsis}</p>
              </div>
            </div>
          )}

          {/* Ask AI Banner */}
          <div className="bg-primary rounded-xl p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center gap-4 md:gap-6 shadow-xl relative overflow-hidden group">
            <div className="w-16 h-16 shrink-0 rounded-full bg-white/10 flex items-center justify-center border border-white/20 relative z-10">
              <span className="material-symbols-outlined text-3xl text-[#e7bea5]">auto_awesome</span>
            </div>
            <div className="flex-1 text-center sm:text-left relative z-10">
              <h3 className="font-headline font-bold text-xl text-[#fdf9f0] mb-2">¿Dudas sobre este libro?</h3>
              <p className="font-body text-[#e7bea5] text-sm leading-relaxed">
                Preguntale a Lib, nuestro asistente IA, que te cuente más o busque reseñas sin darte spoilers.
              </p>
            </div>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message: `Contame más sobre el libro "${book.title}" sin spoilers.` } }))}
              className="shrink-0 px-8 py-3 bg-[#e7bea5] text-[#412817] font-label text-xs font-bold uppercase tracking-widest rounded shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-10"
            >
              Preguntarle a Lib
            </button>
          </div>

          {/* Reviews */}
          <div className="space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary font-semibold mb-2 block">
                  Voces de Lectores
                </span>
                <h2 className="font-headline text-4xl font-bold text-primary">Reseñas</h2>
              </div>
              {isAuthenticated && (
                <button onClick={() => document.getElementById('comment-area')?.focus()}
                  className="font-label text-xs uppercase tracking-widest text-secondary font-bold border-b border-secondary pb-1 hover:text-primary hover:border-primary transition-all cursor-pointer">
                  Añadir Reseña
                </button>
              )}
            </div>

            {/* New comment form - Editorial Style */}
            {isAuthenticated && (
              <form onSubmit={handleComment} className="relative">
                <div className="bg-surface-container-low p-5 sm:p-8 md:p-10 relative overflow-hidden">
                  {/* Decorative quote mark */}
                  <span className="absolute top-4 left-6 text-8xl font-serif text-primary/5 select-none leading-none">"</span>
                  
                  {/* User avatar and name */}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-primary text-sm">{user?.name}</p>
                      <p className="text-[10px] font-label uppercase tracking-widest text-outline">Comparte tu opinión</p>
                    </div>
                  </div>
                  
                  <textarea
                    id="comment-area"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe una reseña honesta..."
                    rows={3}
                    className="w-full bg-transparent border-0 border-b-2 border-outline-variant/30 focus:border-secondary focus:ring-0 transition-all duration-300 py-4 px-1 font-body text-lg text-on-surface placeholder:text-outline/50 resize-none leading-relaxed relative z-10"
                  />
                  
                  <div className="flex justify-between items-center mt-6 relative z-10">
                    <p className="text-xs font-label text-outline italic">
                      {newComment.length}/500 caracteres
                    </p>
                    <button type="submit"
                      disabled={!newComment.trim()}
                      className="px-8 py-3 bg-primary text-on-primary font-label text-xs uppercase tracking-[0.15em] rounded shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg">
                      Publicar Reseña
                    </button>
                  </div>
                </div>
                
                {/* Decorative bottom border */}
                <div className="h-1 bg-secondary"></div>
              </form>
            )}

            {/* Comments list */}
            {comments.length === 0 && (
              <div className="text-center py-16 border-y border-outline-variant/20">
                <span className="material-symbols-outlined text-5xl text-outline-variant/40 mb-4 block">forum</span>
                <p className="text-on-surface-variant font-body italic">Sé el primero en compartir tu reseña</p>
              </div>
            )}
            
            <div className="space-y-8">
              {comments.map((comment, index) => (
                <article 
                  key={comment.id} 
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Main comment */}
                  <div className="flex gap-3 md:gap-6 p-4 md:p-8 bg-white/50 hover:bg-white transition-all duration-300 rounded-sm">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <Link to={`/user/${comment.user_id}`} className="block w-9 md:w-12 h-9 md:h-12 rounded-full overflow-hidden ring-2 ring-surface-container-high ring-offset-2 bg-primary flex items-center justify-center text-on-primary font-headline font-bold text-sm hover:ring-secondary transition-all duration-200">
                        {comment.profile_img ? (
                          <img className="w-full h-full object-cover bg-[#d3c3bb]" src={comment.profile_img} alt={comment.name} />
                        ) : (
                          comment.name?.charAt(0)?.toUpperCase()
                        )}
                      </Link>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                        <Link to={`/user/${comment.user_id}`} className="font-headline font-bold text-primary hover:text-secondary transition-colors duration-200">{comment.name}</Link>
                        <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                        <time className="text-secondary font-bold text-[11px] font-label tracking-widest">
                          {new Date(comment.create_at).toLocaleDateString('es-AR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit' 
                          })}
                        </time>
                      </div>
                      
                      {/* Comment text */}
                      <p className="text-on-surface-variant font-body leading-relaxed mb-4">{comment.content}</p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-6">
                        {/* Like */}
                        <button 
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-2 transition-all duration-200 cursor-pointer group/like ${
                            likedComments.has(comment.id) 
                              ? 'text-primary' 
                              : 'text-outline hover:text-primary'
                          }`}>
                          <span className={`material-symbols-outlined text-lg transition-transform duration-200 group-hover/like:scale-110 ${
                            likedComments.has(comment.id) ? 'scale-110' : ''
                          }`}
                          style={{ 
                            fontVariationSettings: likedComments.has(comment.id) ? "'FILL' 1, 'wght' 600" : "'FILL' 0",
                            color: likedComments.has(comment.id) ? '#412817' : undefined
                          }}>
                            favorite
                          </span>
                          <span className="text-xs font-label font-bold">{comment.likes || 0}</span>
                        </button>
                        
                        {/* Replies toggle */}
                        <button 
                          onClick={() => handleLoadReplies(comment.id)}
                          className="flex items-center gap-2 text-outline hover:text-secondary transition-colors duration-200 cursor-pointer group/reply">
                          <span className="material-symbols-outlined text-lg transition-transform duration-200 group-hover/reply:scale-110">
                            chat_bubble
                          </span>
                          <span className="text-xs font-label uppercase tracking-wider font-bold">
                            {openReplies[comment.id] ? (
                              'Ocultar respuestas'
                            ) : (
                              <span className="flex items-center gap-1">
                                <span className="w-4 h-px bg-secondary"></span>
                                Ver respuestas
                              </span>
                            )}
                          </span>
                        </button>
                        
                        {/* Delete */}
                        {isAuthenticated && user?.name === comment.name && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-2 text-outline hover:text-error transition-colors duration-200 cursor-pointer ml-auto">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Replies section - Slides down */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openReplies[comment.id] 
                      ? 'max-h-[500px] opacity-100 mt-4' 
                      : 'max-h-0 opacity-0 mt-0'
                  }`}>
                    <div className="ml-3 md:ml-14 pl-3 md:pl-6 border-l-2 border-secondary/30 space-y-4">
                      {repliesMap[comment.id]?.length > 0 ? (
                        repliesMap[comment.id].map(reply => (
                          <div key={reply.id} className="flex gap-4 py-4 px-4 hover:bg-surface-container-low/50 rounded-sm transition-colors duration-200 group/reply">
                            <Link to={`/user/${reply.user_id}`} className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs hover:ring-2 hover:ring-secondary transition-all duration-200">
                              {reply.profile_img ? (
                                <img className="w-full h-full object-cover bg-[#d3c3bb]" src={reply.profile_img} alt={reply.name} />
                              ) : (
                                reply.name?.charAt(0)?.toUpperCase()
                              )}
                            </Link>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 mb-1">
                                <Link to={`/user/${reply.user_id}`} className="font-bold text-sm text-primary hover:text-secondary transition-colors duration-200">{reply.name}</Link>
                                <span className="text-secondary font-bold text-[10px] font-label tracking-wider">
                                  {new Date(reply.create_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-on-surface-variant text-sm font-body leading-relaxed mb-2">{reply.content}</p>
                              {/* Like button for replies */}
                              <button 
                                onClick={() => handleLike(reply.id)}
                                className={`flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                                  likedComments.has(reply.id) 
                                    ? 'text-primary' 
                                    : 'text-outline hover:text-primary'
                                }`}>
                                <span className="material-symbols-outlined text-sm transition-transform duration-200 hover:scale-110"
                                  style={{ 
                                    fontVariationSettings: likedComments.has(reply.id) ? "'FILL' 1, 'wght' 600" : "'FILL' 0",
                                    color: likedComments.has(reply.id) ? '#412817' : undefined
                                  }}>
                                  favorite
                                </span>
                                <span className="text-[10px] font-label font-bold">{reply.likes || 0}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-outline italic text-sm py-4">No hay respuestas aún</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="mt-8 border-b border-outline-variant/10"></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Status Modal */}
      {statusModalOpen && (
        <StatusModal 
          onClose={() => setStatusModalOpen(false)}
          onSelect={(status) => {
            handleStatus(status)
            setStatusModalOpen(false)
          }}
        />
      )}
    </main>
  )
}

// Status Modal Component
function StatusModal({ onClose, onSelect }) {
  const statuses = [
    { id: 'want_to_read', label: 'Por leer', icon: 'bookmark', color: 'bg-[#c2a878]' },
    { id: 'reading', label: 'Leyendo', icon: 'auto_stories', color: 'bg-[#412817]' },
    { id: 'completed', label: 'Completado', icon: 'check_circle', color: 'bg-[#745a34]' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c16]/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-2xl shadow-[0_20px_60px_rgba(28,28,22,0.2)] overflow-hidden animate-[dropdownIn_0.3s_ease]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#d3c3bb]/20 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-[#412817]">Estado de lectura</h3>
          <button onClick={onClose} className="text-[#82746d] hover:text-[#412817] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Status Options */}
        <div className="p-4 space-y-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => onSelect(status.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[#f7f3ea] transition-all duration-200 group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-lg ${status.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-white">{status.icon}</span>
              </div>
              <span className="font-headline font-bold text-[#412817] flex-1 text-left">{status.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
