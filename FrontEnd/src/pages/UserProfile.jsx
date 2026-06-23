import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=1',
  'https://api.dicebear.com/7.x/notionists/svg?seed=2',
  'https://api.dicebear.com/7.x/notionists/svg?seed=3',
  'https://api.dicebear.com/7.x/notionists/svg?seed=4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=5',
  'https://api.dicebear.com/7.x/notionists/svg?seed=6',
  'https://api.dicebear.com/7.x/notionists/svg?seed=7',
  'https://api.dicebear.com/7.x/notionists/svg?seed=8',
  'https://api.dicebear.com/7.x/notionists/svg?seed=9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=10'
]

export default function UserProfile() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [profileImg, setProfileImg] = useState('')
  const [activeTab, setActiveTab] = useState('reading')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Stats and data
  const [reading, setReading] = useState([])
  const [completed, setCompleted] = useState([])
  const [wantToRead, setWantToRead] = useState([])
  const [favorites, setFavorites] = useState([])
  const [stats, setStats] = useState({ reading: 0, completed: 0, wantToRead: 0, favorites: 0 })

  const isOwn = isAuthenticated && String(user?.id) === String(id)

  // Guard: id inválido (ej: link con user_id undefined porque el backend no fue reiniciado)
  if (!id || id === 'undefined') return (
    <div className="text-center py-32 px-6">
      <span className="material-symbols-outlined text-6xl text-[#d3c3bb] block mb-4">link_off</span>
      <p className="font-headline text-2xl text-[#50453e] mb-2">Enlace inválido</p>
      <p className="font-body text-[#82746d] mb-6">El perfil de este usuario no está disponible.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#412817] text-[#ffdcc6] font-label text-xs uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Volver al inicio
      </Link>
    </div>
  )

  useEffect(() => {
    fetchProfile()
  }, [id])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data } = await getProfile(id)
      setProfile(data)
      setBio(data.bio || '')
      setProfileImg(data.profile_img || '')

      const readingBooks   = data.reading      || []
      const completedBooks = data.completed     || []
      const wantBooks      = data.want_to_read  || []
      const favBooks       = data.favorites     || []

      setReading(readingBooks)
      setCompleted(completedBooks)
      setWantToRead(wantBooks)
      setFavorites(favBooks)

      setStats({
        reading:    readingBooks.length,
        completed:  completedBooks.length,
        wantToRead: wantBooks.length,
        favorites:  favBooks.length
      })
    } catch (_) {}
    setLoading(false)
  }

  const handleSave = async () => {
    try {
      const updates = {}
      if (bio !== profile.bio) updates.bio = bio
      if (profileImg !== profile.profile_img) updates.profile_img = profileImg
      if (Object.keys(updates).length > 0) { 
        await updateProfile(updates); 
        fetchProfile();
        if (updates.profile_img && updateUser) updateUser({ profile_img: updates.profile_img });
      }
      setEditing(false)
    } catch (_) {}
  }

  // Calculate Top Genres from all books
  const topGenres = useMemo(() => {
    const readingArr = Array.isArray(reading) ? reading : []
    const completedArr = Array.isArray(completed) ? completed : []
    const favoritesArr = Array.isArray(favorites) ? favorites : []
    const allBooks = [...readingArr, ...completedArr, ...favoritesArr]
    const genreCount = {}
    
    allBooks.forEach(book => {
      const genres = Array.isArray(book.genre) ? book.genre : (book.genre || '').split(',')
      genres.forEach(g => {
        const genre = g.trim()
        if (genre && genre !== 'null' && genre !== 'undefined') {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        }
      })
    })
    
    const sorted = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    const max = sorted[0]?.[1] || 1
    return sorted.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / max) * 100)
    }))
  }, [reading, completed, favorites])

  // Generate Activity Feed
  const activityFeed = useMemo(() => {
    const activities = []
    const readingArr = Array.isArray(reading) ? reading : []
    const favoritesArr = Array.isArray(favorites) ? favorites : []
    const completedArr = Array.isArray(completed) ? completed : []
    const wantToReadArr = Array.isArray(wantToRead) ? wantToRead : []
    
    // Currently reading
    readingArr.slice(0, 3).forEach(book => {
      activities.push({
        type: 'reading',
        icon: 'auto_stories',
        color: 'text-[#412817]',
        bgColor: 'bg-[#f7f3ea]',
        message: 'Está leyendo',
        book: book.title,
        bookId: book.id
      })
    })
    
    // Recent favorites
    favoritesArr.slice(0, 2).forEach(book => {
      activities.push({
        type: 'favorite',
        icon: 'favorite',
        color: 'text-[#ba1a1a]',
        bgColor: 'bg-[#ffdad6]/50',
        message: 'Agregó a favoritos',
        book: book.title,
        bookId: book.id
      })
    })
    
    // Recently completed
    completedArr.slice(0, 2).forEach(book => {
      activities.push({
        type: 'completed',
        icon: 'check_circle',
        color: 'text-[#745a34]',
        bgColor: 'bg-[#fedaaa]/30',
        message: 'Completó',
        book: book.title,
        bookId: book.id
      })
    })
    
    // Want to read
    wantToReadArr.slice(0, 1).forEach(book => {
      activities.push({
        type: 'want',
        icon: 'bookmark',
        color: 'text-[#c2a878]',
        bgColor: 'bg-[#fdf9f0]',
        message: 'Agregó a "Por leer"',
        book: book.title,
        bookId: book.id
      })
    })
    
    return activities.slice(0, 6)
  }, [reading, completed, wantToRead, favorites])

  const tabs = [
    { id: 'reading', label: 'Leyendo', icon: 'auto_stories', count: stats.reading },
    { id: 'completed', label: 'Completados', icon: 'check_circle', count: stats.completed },
    { id: 'want_to_read', label: 'Por leer', icon: 'bookmark', count: stats.wantToRead },
    { id: 'favorites', label: 'Favoritos', icon: 'favorite', count: stats.favorites }
  ]

  const getActiveBooks = () => {
    switch (activeTab) {
      case 'reading': return reading
      case 'completed': return completed
      case 'want_to_read': return wantToRead
      case 'favorites': return favorites
      default: return []
    }
  }

  const activeBooks = Array.isArray(getActiveBooks()) ? getActiveBooks() : []
  const itemsPerPage = 10
  const totalPages = Math.ceil(activeBooks.length / itemsPerPage)
  const paginatedBooks = activeBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (loading) return (
    <main className="pt-20 md:pt-28 pb-16 md:pb-24 px-6 md:px-12 max-w-6xl mx-auto min-h-screen">
      <div className="animate-pulse space-y-8 md:space-y-12">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="w-28 md:w-36 h-28 md:h-36 rounded-full bg-[#ece8df]" />
          <div className="flex-1 space-y-4 w-full">
            <div className="h-10 md:h-12 bg-[#ece8df] rounded w-48 md:w-64 mx-auto md:mx-0" />
            <div className="h-4 bg-[#ece8df] rounded w-32 mx-auto md:mx-0" />
            <div className="h-16 md:h-20 bg-[#ece8df] rounded w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 md:h-24 bg-[#ece8df] rounded" />)}
        </div>
      </div>
    </main>
  )

  if (!profile) return (
    <div className="text-center py-32 px-6">
      <span className="material-symbols-outlined text-6xl text-[#d3c3bb] block mb-4">person_off</span>
      <p className="font-headline text-2xl text-[#50453e] mb-2">Usuario no encontrado</p>
      <p className="font-body text-[#82746d] mb-6">Este perfil no existe o no está disponible.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#412817] text-[#ffdcc6] font-label text-xs uppercase tracking-widest rounded shadow-lg hover:brightness-110 transition-all">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Volver al inicio
      </Link>
    </div>
  )

  return (
    <main className="pt-20 md:pt-28 pb-16 md:pb-24 px-6 md:px-12 max-w-6xl mx-auto min-h-screen overflow-x-hidden">
      
      {/* Profile Header - Editorial Style */}
      <header className="relative mb-12">
        {/* Decorative background — match parent px-6 md:px-12 */}
        <div className="absolute inset-0 -mx-6 md:-mx-12 -mt-8 bg-surface-container-low -z-10 rounded-b-3xl" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 pt-6 md:pt-8 pb-4">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 md:w-36 h-24 md:h-36 rounded-full overflow-hidden shadow-[0_8px_30px_rgba(65,40,23,0.2)] ring-4 ring-white">
              {profile.profile_img ? (
                <img alt={profile.name} className="w-full h-full object-cover bg-[#d3c3bb]" src={profile.profile_img} />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-[#ffdcc6] font-headline text-4xl md:text-6xl font-black">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            {isOwn && (
              <button onClick={() => setEditing(true)}
                className="absolute bottom-2 right-2 w-10 h-10 bg-[#412817] text-[#ffdcc6] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 md:mb-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-black text-[#412817] tracking-tight leading-none">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#82746d] font-medium">
                  Miembro desde {new Date(profile.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>

            {/* Bio */}
            {!editing && profile.bio && (
              <p className="max-w-2xl font-body text-[#50453e] leading-relaxed text-lg border-l-3 border-[#c2a878] pl-4 py-1">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </header>



      {/* Edit Form */}
      {editing && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-[0_10px_40px_rgba(65,40,23,0.1)] border border-[#d3c3bb]/20 mb-10 md:mb-12 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-[#412817]">settings</span>
            <h3 className="font-headline text-xl font-bold text-[#412817]">Editar Perfil</h3>
          </div>
          
          <div className="space-y-6">
            <div className="relative group">
              <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-2 transition-colors group-focus-within:text-[#412817]">
                Biografía
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={300}
                className="w-full bg-[#f7f3ea] hover:bg-[#f1eee5] focus:bg-[#f1eee5] border-0 border-b-2 border-[#d3c3bb]/50 focus:border-[#c2a878] focus:ring-0 font-body py-3 px-1 resize-none leading-relaxed transition-all duration-300"
                placeholder="Cuéntanos sobre ti y tu amor por los libros..."
              />
              <p className="text-[10px] text-[#82746d] mt-1 text-right">{bio.length}/300</p>
            </div>

            <div className="relative group">
              <label className="block font-label text-[10px] uppercase tracking-widest text-[#82746d] mb-4 transition-colors group-focus-within:text-[#412817]">
                Seleccionar Avatar
              </label>
              <div className="grid grid-cols-5 gap-3">
                {PREDEFINED_AVATARS.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => setProfileImg(avatar)}
                    className={`relative w-full aspect-square rounded-full overflow-hidden transition-all duration-300 ${
                      profileImg === avatar 
                        ? 'ring-4 ring-[#412817] scale-110 shadow-lg z-10' 
                        : 'ring-2 ring-transparent hover:ring-[#d3c3bb] hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover bg-[#d3c3bb]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={handleSave}
                className="px-8 py-3 bg-primary text-[#ffdcc6] font-label font-bold uppercase tracking-widest text-xs rounded shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer">
                Guardar Cambios
              </button>
              <button onClick={() => setEditing(false)}
                className="px-6 py-3 border border-[#d3c3bb] text-[#50453e] font-label text-xs uppercase tracking-widest hover:bg-[#f7f3ea] transition-colors rounded cursor-pointer">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Top Genres + Activity Feed */}
      {!editing && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Top Genres */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d3c3bb]/10">
            <h3 className="font-headline text-lg font-bold text-[#412817] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#745a34]">category</span>
              Géneros Favoritos
            </h3>
            
            {topGenres.length > 0 ? (
              <div className="space-y-4">
                {topGenres.map((genre, i) => (
                  <div key={genre.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-[#412817] font-medium">{genre.name}</span>
                      <span className="font-label text-[10px] text-[#82746d]">{genre.count} libros</span>
                    </div>
                    <div className="h-2 w-full bg-[#f7f3ea] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#82746d] font-body text-sm italic text-center py-8">
                Agrega libros para ver tus géneros favoritos
              </p>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d3c3bb]/10">
            <h3 className="font-headline text-lg font-bold text-[#412817] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#745a34]">timeline</span>
              Actividad Reciente
            </h3>
            
            {activityFeed.length > 0 ? (
              <div className="space-y-3">
                {activityFeed.map((activity, i) => (
                  <Link 
                    key={i}
                    to={`/books/${activity.bookId}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f7f3ea] transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined text-sm ${activity.color}`}>{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-[#50453e]">
                        <span className="text-[#82746d]">{activity.message}</span>{' '}
                        <span className="font-medium text-[#412817] group-hover:text-[#745a34] transition-colors truncate block">
                          "{activity.book}"
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[#82746d] font-body text-sm italic text-center py-8">
                Tu actividad aparecerá aquí
              </p>
            )}
          </div>
        </section>
      )}

      {/* Books Section - Tabs */}
      {!editing && (
        <section>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-label text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#412817] text-[#ffdcc6] shadow-lg'
                    : 'bg-white text-[#50453e] hover:bg-[#f7f3ea]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-[#ffdcc6] text-[#412817]' : 'bg-[#f7f3ea]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Books Grid */}
          {activeBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {paginatedBooks.map((book) => (
                  <Link 
                    key={book.id} 
                    to={`/books/${book.id || book.book_id}`}
                    className="group block"
                  >
                    <div className="aspect-[2/3] mb-3 overflow-hidden rounded-sm shadow-md">
                      {book.img ? (
                        <img src={book.img} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-[#d3c3bb]">menu_book</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-headline font-bold text-sm text-[#412817] line-clamp-2 transition-colors">
                      {book.title}
                    </h4>
                    <p className="font-body text-xs text-[#82746d] mt-1 truncate">
                      {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                    </p>
                  </Link>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-full border border-[#d3c3bb] flex items-center justify-center text-[#412817] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f3ea] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-full font-label text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === i + 1 
                            ? 'bg-[#412817] text-[#ffdcc6]' 
                            : 'text-[#82746d] hover:bg-[#f7f3ea]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full border border-[#d3c3bb] flex items-center justify-center text-[#412817] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f3ea] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-xl border border-[#d3c3bb]/20">
              <span className="material-symbols-outlined text-5xl text-[#d3c3bb]/50 mb-4 block">
                {tabs.find(t => t.id === activeTab)?.icon}
              </span>
              <p className="font-body text-[#82746d]">
                {isOwn ? (
                  <>
                    {activeTab === 'reading' && 'No estás leyendo ningún libro actualmente'}
                    {activeTab === 'completed' && 'Aún no has completado ningún libro'}
                    {activeTab === 'want_to_read' && 'Tu lista está vacía'}
                    {activeTab === 'favorites' && 'No tienes favoritos aún'}
                  </>
                ) : (
                  <>
                    {activeTab === 'reading' && 'Este usuario no está leyendo ningún libro'}
                    {activeTab === 'completed' && 'Este usuario aún no ha completado ningún libro'}
                    {activeTab === 'want_to_read' && 'La lista de este usuario está vacía'}
                    {activeTab === 'favorites' && 'Este usuario no tiene favoritos aún'}
                  </>
                )}
              </p>
              {isOwn && (
                <Link 
                  to="/catalog" 
                  className="inline-flex items-center gap-2 mt-4 text-[#412817] font-label text-xs uppercase tracking-wider font-bold hover:text-[#745a34] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">explore</span>
                  Explorar catálogo
                </Link>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

