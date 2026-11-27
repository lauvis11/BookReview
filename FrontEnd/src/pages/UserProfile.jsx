import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/profile'
import { updateEmail } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { PREDEFINED_AVATARS } from '../utils/avatars'

export default function UserProfile() {
  const { id } = useParams()
  const { user, isAuthenticated, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(Boolean(location.state?.openEdit || location.state?.requireProfileName))
  const [requireProfileName, setRequireProfileName] = useState(Boolean(location.state?.requireProfileName))
  const [profileName, setProfileName] = useState('')
  const [bio, setBio] = useState('')
  const [profileImg, setProfileImg] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState(user?.email || '')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
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
      <span className="material-symbols-outlined text-6xl text-outline-variant block mb-4">link_off</span>
      <p className="font-headline text-2xl text-on-surface-variant mb-2">Enlace inválido</p>
      <p className="font-body text-outline mb-6">El perfil de este usuario no está disponible.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-label text-xs uppercase tracking-widest rounded shadow-lg hover:bg-primary-container transition-all">
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
      const isTempName = /^lector_[a-f0-9]{8}$/i.test(data.name || '')
      setProfileName(requireProfileName || isTempName ? '' : (data.name || ''))
      setBio(data.bio || '')
      setProfileImg(data.profile_img || '')
      if (isOwn && isTempName && !requireProfileName) {
        setRequireProfileName(true)
        setEditing(true)
      }

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
    setNameError('')
    setEmailError('')

    const trimmedName = profileName.trim()
    const needsNameUpdate = requireProfileName || trimmedName !== (profile?.name || '')
    if (needsNameUpdate) {
      if (trimmedName.length < 3 || trimmedName.length > 50) {
        setNameError('Ingresá un nombre de perfil de entre 3 y 50 caracteres.')
        return
      }
    }

    setSavingProfile(true)
    try {
      if (!requireProfileName) {
        const trimmedEmail = recoveryEmail.trim().toLowerCase()
        const currentEmail = (user?.email || '').trim().toLowerCase()
        if (trimmedEmail && trimmedEmail !== currentEmail) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setEmailError('Ingresá un correo electrónico válido.')
            setSavingProfile(false)
            return
          }
          const { data: emailRes } = await updateEmail({ email: trimmedEmail })
          if (updateUser) updateUser({ email: emailRes.email })
        }
      }

      const updates = {}
      if (needsNameUpdate) updates.name = trimmedName
      if (bio !== profile.bio) updates.bio = bio
      if (profileImg !== profile.profile_img) updates.profile_img = profileImg

      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile } = await updateProfile(updates)
        if (updateUser) {
          const authPatch = {}
          if (updatedProfile?.name) authPatch.name = updatedProfile.name
          if (updatedProfile?.profile_img) authPatch.profile_img = updatedProfile.profile_img
          if (Object.keys(authPatch).length > 0) updateUser(authPatch)
        }
        await fetchProfile()
      }

      if (requireProfileName) {
        setRequireProfileName(false)
        navigate(location.pathname, { replace: true, state: {} })
      }
      setEditing(false)
    } catch (err) {
      if (err.response?.data?.field === 'name') {
        setNameError(err.response.data.message)
      } else if (err.response?.data?.message) {
        setEmailError(err.response.data.message)
      }
    } finally {
      setSavingProfile(false)
    }
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
        color: 'text-primary',
        bgColor: 'bg-primary-fixed',
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
        color: 'text-primary-container',
        bgColor: 'bg-primary-fixed/80',
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
        color: 'text-secondary-dark',
        bgColor: 'bg-secondary-container/60',
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
          <div className="w-28 md:w-36 h-28 md:h-36 rounded-full bg-surface-container-high" />
          <div className="flex-1 space-y-4 w-full">
            <div className="h-10 md:h-12 bg-surface-container-high rounded w-48 md:w-64 mx-auto md:mx-0" />
            <div className="h-4 bg-surface-container-high rounded w-32 mx-auto md:mx-0" />
            <div className="h-16 md:h-20 bg-surface-container-high rounded w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 md:h-24 bg-surface-container-high rounded" />)}
        </div>
      </div>
    </main>
  )

  if (!profile) return (
    <div className="text-center py-32 px-6">
      <span className="material-symbols-outlined text-6xl text-outline-variant block mb-4">person_off</span>
      <p className="font-headline text-2xl text-on-surface-variant mb-2">Usuario no encontrado</p>
      <p className="font-body text-outline mb-6">Este perfil no existe o no está disponible.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-label text-xs uppercase tracking-widest rounded shadow-lg hover:bg-primary-container transition-all">
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
            <div className="w-24 md:w-36 h-24 md:h-36 rounded-full overflow-hidden shadow-[0_8px_30px_rgba(14,81,70,0.2)] ring-4 ring-white">
              {profile.profile_img ? (
                <img alt={profile.name} className="w-full h-full object-cover bg-surface-container-high" src={profile.profile_img} />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-secondary-light font-headline text-4xl md:text-6xl font-black">
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-3 md:mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-black text-primary tracking-tight leading-none">
                  {profile.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <span className="font-label text-[10px] uppercase tracking-[0.2em] text-outline font-medium">
                    Miembro desde {new Date(profile.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>
              
              {isOwn && (
                <button
                  onClick={() => {
                    setProfileName(profile?.name || '')
                    setRecoveryEmail(user?.email || '')
                    setNameError('')
                    setEmailError('')
                    setEditing(true)
                  }}
                  className="inline-flex self-center md:self-start items-center justify-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:bg-primary-container active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Editar Perfil
                </button>
              )}
            </div>

            {/* Bio */}
            {!editing && profile.bio && (
              <p className="max-w-2xl font-body text-on-surface-variant leading-relaxed text-lg border-l-3 border-secondary pl-4 py-1">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </header>



      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!requireProfileName && !savingProfile) setEditing(false)
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary-light">manage_accounts</span>
                <div>
                  <h3 className="font-headline text-xl font-bold text-white">
                    {requireProfileName ? 'Completá tu perfil' : 'Editar Perfil'}
                  </h3>
                  {requireProfileName && (
                    <p className="font-body text-xs text-forest-muted">
                      Elegí tu nombre de perfil para empezar a usar BookReview.
                    </p>
                  )}
                </div>
              </div>
              {!requireProfileName && (
                <button 
                  onClick={() => setEditing(false)}
                  className="text-forest-muted hover:text-white transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            
            {/* Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto overscroll-contain">
              {/* Profile Name (Obligatorio al crear cuenta) */}
              <div className="relative group">
                <label
                  htmlFor="profile-display-name"
                  className="block font-label text-xs uppercase tracking-widest text-outline mb-2 transition-colors group-focus-within:text-primary"
                >
                  Nombre de perfil {requireProfileName && <span className="text-error">*</span>}
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value)
                    setNameError('')
                  }}
                  maxLength={50}
                  autoFocus={requireProfileName}
                  placeholder="Tu nombre visible en BookReview (3 a 50 caracteres)"
                  className={`w-full h-11 bg-surface-container-low hover:bg-surface-container focus:bg-white border rounded-lg focus:ring-2 font-body px-4 text-sm text-on-surface transition-[background-color,border-color,box-shadow] duration-150 ${
                    nameError
                      ? 'border-error focus:border-error focus:ring-error/20'
                      : 'border-outline-variant/60 focus:border-secondary focus:ring-secondary/30'
                  }`}
                />
                {nameError && (
                  <p className="mt-1.5 text-xs font-body text-error">{nameError}</p>
                )}
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-outline mb-4">
                  Elige tu Avatar
                </label>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  {PREDEFINED_AVATARS.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setProfileImg(avatar)}
                      className={`relative w-16 h-16 rounded-full transition-all duration-300 ${
                        profileImg === avatar 
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110 shadow-md z-10' 
                          : 'ring-1 ring-transparent hover:ring-outline-variant hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full object-cover bg-surface-container-high" />
                      {profileImg === avatar && (
                        <div className="absolute -bottom-1 -right-1 bg-primary w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-secondary-light text-[12px] font-bold">check</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio Textarea */}
              <div className="relative group">
                <label className="block font-label text-xs uppercase tracking-widest text-outline mb-2 transition-colors group-focus-within:text-primary">
                  Biografía
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="w-full bg-surface-container-low hover:bg-surface-container focus:bg-white border border-outline-variant/60 focus:border-secondary rounded-lg focus:ring-2 focus:ring-secondary/30 font-body p-4 resize-none leading-relaxed transition-all duration-300 shadow-inner"
                  placeholder="Cuéntanos sobre ti y tu amor por los libros..."
                />
                <p className="absolute bottom-3 right-4 text-[10px] text-outline font-medium">{bio.length}/300</p>
              </div>

              {/* Recovery Email (visible al editar un perfil ya existente) */}
              {!requireProfileName && (
                <div className="relative group">
                  <label
                    htmlFor="profile-recovery-email"
                    className="block font-label text-xs uppercase tracking-widest text-outline mb-2 transition-colors group-focus-within:text-primary"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="profile-recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => {
                      setRecoveryEmail(e.target.value)
                      setEmailError('')
                    }}
                    placeholder="tu@correo.com (para iniciar sesión y recuperar contraseña)"
                    className="w-full h-11 bg-surface-container-low hover:bg-surface-container focus:bg-white border border-outline-variant/60 focus:border-secondary rounded-lg focus:ring-2 focus:ring-secondary/30 font-body px-4 text-sm text-on-surface transition-all duration-300"
                  />
                  {emailError && (
                    <p className="mt-1.5 text-xs font-body text-error">{emailError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-surface-container-low px-6 py-4 flex justify-end gap-3 border-t border-outline-variant/40">
              {!requireProfileName && (
                <button 
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={savingProfile}
                  className="px-5 py-2.5 text-on-surface-variant font-label text-xs uppercase tracking-widest hover:bg-surface-container-high transition-colors rounded-md cursor-pointer font-bold"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="button"
                onClick={handleSave}
                disabled={savingProfile}
                className="px-6 py-2.5 bg-primary text-on-primary font-label font-bold uppercase tracking-widest text-xs rounded-md shadow-md hover:shadow-lg hover:bg-primary-container active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {savingProfile ? 'Guardando...' : requireProfileName ? 'Guardar y continuar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Top Genres + Activity Feed */}
      {!editing && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Top Genres */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="font-headline text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-dark">category</span>
              Géneros Favoritos
            </h3>
            
            {topGenres.length > 0 ? (
              <div className="space-y-4">
                {topGenres.map((genre, i) => (
                  <div key={genre.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-primary font-medium">{genre.name}</span>
                      <span className="font-label text-[10px] text-outline">{genre.count} libros</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${genre.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-outline font-body text-sm italic text-center py-8">
                Agrega libros para ver tus géneros favoritos
              </p>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
            <h3 className="font-headline text-lg font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-dark">timeline</span>
              Actividad Reciente
            </h3>
            
            {activityFeed.length > 0 ? (
              <div className="space-y-3">
                {activityFeed.map((activity, i) => (
                  <Link 
                    key={i}
                    to={`/books/${activity.bookId}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined text-sm ${activity.color}`}>{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-on-surface-variant">
                        <span className="text-outline">{activity.message}</span>{' '}
                        <span className="font-medium text-primary group-hover:text-secondary-dark transition-colors truncate block">
                          "{activity.book}"
                        </span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-outline font-body text-sm italic text-center py-8">
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
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-on-surface-variant hover:bg-primary-fixed/60 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low'
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
                          <span className="material-symbols-outlined text-4xl text-outline-variant">menu_book</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-headline font-bold text-sm text-primary line-clamp-2 transition-colors">
                      {book.title}
                    </h4>
                    <p className="font-body text-xs text-outline mt-1 truncate">
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
                    className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors cursor-pointer"
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
                            ? 'bg-primary text-white' 
                            : 'text-outline hover:bg-surface-container-low'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-outline-variant/60 mb-4 block">
                {tabs.find(t => t.id === activeTab)?.icon}
              </span>
              <p className="font-body text-outline">
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
                  className="inline-flex items-center gap-2 mt-4 text-primary font-label text-xs uppercase tracking-wider font-bold hover:text-secondary-dark transition-colors"
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

