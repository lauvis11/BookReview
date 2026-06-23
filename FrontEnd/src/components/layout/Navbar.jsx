import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { getProfile } from '../../api/profile'

export default function Navbar() {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const menuRef = useRef(null)
  const searchRef = useRef(null)

  // Track scroll for navbar appearance
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch profile to get avatar for existing sessions
  useEffect(() => {
    if (user?.id && !user.profile_img && updateUser) {
      getProfile(user.id).then(res => {
         updateUser({ profile_img: res.data.profile_img })
      }).catch(() => {})
    }
  }, [user?.id])

  const handleLogout = async () => {
    setMenuOpen(false)
    setMobileMenuOpen(false)
    await logout()
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/catalog?title=${encodeURIComponent(search.trim())}`)
      setSearchFocused(false)
      setMobileMenuOpen(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Decorative top border */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[60]" />
      
      <nav className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-500 border-b border-[#d3c3bb]/30 ${
        scrolled 
          ? 'bg-[#ece8df]/98 backdrop-blur-xl shadow-[0_4px_30px_rgba(65,40,23,0.15)]' 
          : 'bg-[#f1eee5]/95 backdrop-blur-lg shadow-[0_2px_20px_rgba(65,40,23,0.08)]'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo Section - Editorial Style */}
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
              <img 
                src="/Book-rewiev-logo-removebg-preview.png" 
                alt="BookReview Logo" 
                className="h-12 md:h-16 object-contain drop-shadow-sm"
              />
            </Link>

            {/* Navigation Links - Editorial Tabs (Desktop) */}
            <div className="hidden md:flex items-center gap-3 ml-8 px-5 py-2 bg-[#f7f3ea]/60 rounded-full">
              <NavLink 
                to="/" 
                active={isActive('/')}
                icon="home"
              >
                Inicio
              </NavLink>
              <NavLink 
                to="/catalog" 
                active={isActive('/catalog')}
                icon="library_books"
              >
                Catálogo
              </NavLink>
              {isAuthenticated && (
                <NavLink 
                  to="/library" 
                  active={isActive('/library')}
                  icon="bookmark"
                >
                  Biblioteca
                </NavLink>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              
              {/* Search - Expandable (Desktop only) */}
              <form 
                onSubmit={handleSearch} 
                className={`hidden md:block relative transition-all duration-300 ${
                  searchFocused ? 'w-64 md:w-80' : 'w-48'
                }`}
                ref={searchRef}
              >
                <div className="relative flex items-center w-full group">
                  <span className={`material-symbols-outlined text-lg absolute left-3 z-10 transition-colors ${searchFocused ? 'text-[#c2a878]' : 'text-[#82746d] group-hover:text-[#412817]'}`}>
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => !search && setSearchFocused(false)}
                    className="w-full bg-white/80 hover:bg-white border border-[#d3c3bb]/50 focus:border-[#c2a878] focus:bg-white focus:ring-0 rounded-full text-sm py-2 pl-10 pr-10 placeholder:text-[#82746d]/70 font-body text-[#412817] transition-all duration-300 shadow-sm focus:shadow-md outline-none"
                  />
                  {search && (
                    <button 
                      type="submit" 
                      className="absolute right-3 text-[#412817] hover:text-[#745a34] transition-colors z-10 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg mt-1">arrow_forward</span>
                    </button>
                  )}
                </div>
              </form>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                      menuOpen 
                        ? 'bg-[#412817] text-[#ffdcc6] shadow-md' 
                        : 'bg-white/90 text-[#412817] hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center text-[#ffdcc6] text-xs font-bold overflow-hidden">
                      {user?.profile_img ? (
                        <img src={user.profile_img} alt={user.name} className="w-full h-full object-cover bg-[#d3c3bb]" />
                      ) : (
                        user?.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <span className="hidden md:block font-label text-xs font-medium max-w-[80px] truncate">
                      {user?.name}
                    </span>
                    <span className={`hidden md:block material-symbols-outlined text-lg transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown Menu - Refined */}
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(65,40,23,0.15)] border border-[#d3c3bb]/20 overflow-hidden z-50 animate-[dropdownIn_0.2s_ease]">
                      {/* User Header */}
                      <div className="px-5 py-4 bg-surface-container-low border-b border-[#d3c3bb]/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-[#ffdcc6] font-headline font-bold text-lg overflow-hidden">
                            {user?.profile_img ? (
                              <img src={user.profile_img} alt={user.name} className="w-full h-full object-cover bg-[#d3c3bb]" />
                            ) : (
                              user?.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-headline font-bold text-[#412817]">{user?.name}</p>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#412817] text-[#ffdcc6] text-[9px] font-label uppercase tracking-wider rounded-full mt-1">
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                                Administrador
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <DropdownItem
                          to={`/user/${user?.id}`}
                          icon="person"
                          onClick={() => setMenuOpen(false)}
                        >
                          Mi Perfil
                        </DropdownItem>

                        <DropdownItem
                          to="/library"
                          icon="bookmark"
                          onClick={() => setMenuOpen(false)}
                        >
                          Mi Biblioteca
                        </DropdownItem>

                        {isAdmin && (
                          <>
                            <div className="my-2 mx-4 border-b border-[#d3c3bb]/20" />
                            <DropdownItem
                              to="/admin"
                              icon="dashboard"
                              highlight
                              onClick={() => setMenuOpen(false)}
                            >
                              Panel de Administración
                            </DropdownItem>
                          </>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-[#d3c3bb]/20 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/30 transition-colors cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                            logout
                          </span>
                          <span className="font-body text-sm font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  className="flex items-center gap-2 px-3 py-2 md:px-4 bg-primary text-[#ffdcc6] rounded-full font-label text-xs uppercase tracking-wider hover:shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span className="hidden md:inline">Acceder</span>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#412817] hover:bg-[#f7f3ea] rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - full-featured drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[67px] left-0 right-0 bottom-0 bg-[#fdf9f0] flex flex-col z-40 animate-[dropdownIn_0.2s_ease] overflow-y-auto">
          {/* Mobile Search */}
          <div className="px-6 py-4 border-b border-[#d3c3bb]/20">
            <form onSubmit={handleSearch} className="relative">
              <span className="material-symbols-outlined text-lg absolute left-3 top-1/2 -translate-y-1/2 text-[#82746d]">search</span>
              <input
                type="text"
                placeholder="Buscar un libro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#d3c3bb]/50 rounded-full text-sm py-3 pl-10 pr-4 font-body text-[#412817] outline-none focus:border-[#c2a878]"
              />
            </form>
          </div>

          {/* Main Nav Links */}
          <div className="flex-1 px-4 py-2">
            <MobileNavLink to="/" active={isActive('/')} icon="home" onClick={() => setMobileMenuOpen(false)}>Inicio</MobileNavLink>
            <MobileNavLink to="/catalog" active={isActive('/catalog')} icon="library_books" onClick={() => setMobileMenuOpen(false)}>Catálogo</MobileNavLink>
            {isAuthenticated && (
              <>
                <MobileNavLink to="/library" active={isActive('/library')} icon="bookmark" onClick={() => setMobileMenuOpen(false)}>Biblioteca</MobileNavLink>
                <MobileNavLink to={`/user/${user?.id}`} active={isActive(`/user/${user?.id}`)} icon="person" onClick={() => setMobileMenuOpen(false)}>Mi Perfil</MobileNavLink>
                {isAdmin && (
                  <MobileNavLink to="/admin" active={isActive('/admin')} icon="dashboard" onClick={() => setMobileMenuOpen(false)}>Panel Admin</MobileNavLink>
                )}
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="px-6 py-6 border-t border-[#d3c3bb]/20">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-full font-label text-xs uppercase tracking-widest font-bold hover:bg-[#ffdad6]/30 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Cerrar Sesión
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-primary text-[#ffdcc6] rounded-full font-label text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Acceder
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// NavLink Component - Editorial Tab Style (Desktop)
function NavLink({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-6 py-3 font-headline text-lg font-bold tracking-tight transition-all duration-300 rounded-full ${
        active 
          ? 'text-[#412817] bg-white shadow-lg' 
          : 'text-[#50453e] hover:text-[#412817] hover:bg-white/80'
      }`}
    >
      <span className={`material-symbols-outlined text-2xl ${active ? 'text-[#745a34]' : ''}`}>{icon}</span>
      <span>{children}</span>
    </Link>
  )
}

// MobileNavLink Component
function MobileNavLink({ to, active, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-4 border-b border-[#d3c3bb]/10 font-headline text-lg font-bold transition-colors ${
        active ? 'text-[#745a34] bg-[#f7f3ea] rounded-lg border-transparent' : 'text-[#50453e] hover:bg-[#f7f3ea]/50'
      }`}
    >
      <span className={`material-symbols-outlined text-2xl ${active ? 'text-[#745a34]' : ''}`}>{icon}</span>
      {children}
    </Link>
  )
}

// DropdownItem Component
function DropdownItem({ to, icon, children, onClick, highlight }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-2.5 transition-all duration-200 group ${
        highlight 
          ? 'text-[#412817] hover:bg-[#fedaaa]/30' 
          : 'text-[#412817] hover:bg-[#f7f3ea]'
      }`}
    >
      <span className={`material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110 ${
        highlight ? 'text-[#745a34]' : 'text-[#82746d]'
      }`}>
        {icon}
      </span>
      <span className={`font-body text-sm ${highlight ? 'font-semibold' : ''}`}>
        {children}
      </span>
      {highlight && (
        <span className="ml-auto material-symbols-outlined text-sm text-[#c2a878]">arrow_forward</span>
      )}
    </Link>
  )
}
