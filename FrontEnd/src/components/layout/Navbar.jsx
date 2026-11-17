import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { getProfile } from '../../api/profile'
import BrandLogo from '../ui/BrandLogo'

export default function Navbar() {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef(null)

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

  // Notify ChatWidget & lock body scroll when mobile menu opens
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mobile-menu-toggle', { detail: { open: mobileMenuOpen } }))
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      window.dispatchEvent(new CustomEvent('mobile-menu-toggle', { detail: { open: false } }))
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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

  const isAdmin = user?.role === 'admin'

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b-[3px] border-secondary ${
        scrolled 
          ? 'bg-footer-bg/98 backdrop-blur-xl shadow-[0_6px_30px_rgba(7,35,30,0.3)]' 
          : 'bg-footer-bg/95 backdrop-blur-lg shadow-[0_2px_20px_rgba(7,35,30,0.18)]'
      }`}>
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-10">
          <div className="flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] gap-2 h-16 md:h-20">
            
            {/* Left Section: Mobile Menu Toggle + Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                className="md:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>

              <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <BrandLogo variant="dark" className="h-7 sm:h-9 md:h-11 w-auto" />
              </Link>
            </div>

            {/* Navigation Links - Editorial Tabs (Desktop) */}
            <div className="hidden md:flex items-center justify-center gap-3">
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
            <div className="flex items-center justify-end gap-2 md:gap-4 md:w-full">
              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center gap-2 px-2 md:px-3 py-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                      menuOpen 
                        ? 'bg-secondary text-on-secondary shadow-md' 
                        : 'bg-white/12 text-white border border-white/15 hover:bg-white/20 hover:shadow-md'
                    }`}
                  >
                    <div className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-[#166e5e] flex items-center justify-center text-secondary text-xs font-bold overflow-hidden">
                      {user?.profile_img ? (
                        <img src={user.profile_img} alt={user.name} className="w-full h-full object-cover bg-surface-container-high" />
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
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(14,81,70,0.16)] border border-outline-variant/30 overflow-hidden z-50 animate-[dropdownIn_0.2s_ease]">
                      {/* User Header */}
                      <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/30">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-secondary-light font-headline font-bold text-lg overflow-hidden">
                            {user?.profile_img ? (
                              <img src={user.profile_img} alt={user.name} className="w-full h-full object-cover bg-surface-container-high" />
                            ) : (
                              user?.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-headline font-bold text-primary">{user?.name}</p>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-secondary-light text-[9px] font-label uppercase tracking-wider rounded-full mt-1">
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
                            <div className="my-2 mx-4 border-b border-outline-variant/30" />
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
                      <div className="border-t border-outline-variant/30 py-2">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 md:px-4 bg-secondary text-on-secondary rounded-full font-label text-[11px] sm:text-xs uppercase tracking-wider font-bold whitespace-nowrap hover:bg-secondary-hover hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">login</span>
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Left side drawer (70% width) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[67px] left-0 right-0 bottom-0 z-50 flex">
          {/* Backdrop oscuro clickable para cerrar */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 animate-[drawerBackdropIn_200ms_ease_both]"
            aria-hidden="true"
          />

          {/* Left Drawer Panel */}
          <aside className="relative z-10 w-[70%] h-full bg-footer-bg/80 backdrop-blur-xl border-r border-white/15 shadow-[8px_0_32px_rgba(0,0,0,0.45)] flex flex-col overflow-y-auto overscroll-contain animate-[drawerSlideLeft_280ms_var(--ease-drawer)_both]">
            {/* Main Nav Links - Left aligned from top */}
            <div className="flex-1 flex flex-col items-stretch justify-start gap-1.5 px-3 py-5">
              <MobileNavLink to="/" active={isActive('/')} icon="home" onClick={() => setMobileMenuOpen(false)}>Inicio</MobileNavLink>
              <MobileNavLink to="/catalog" active={isActive('/catalog')} icon="library_books" onClick={() => setMobileMenuOpen(false)}>Catálogo</MobileNavLink>
              {isAuthenticated && (
                <>
                  <MobileNavLink to="/library" active={isActive('/library')} icon="bookmark" onClick={() => setMobileMenuOpen(false)}>Biblioteca</MobileNavLink>
                  <MobileNavLink to={`/user/${user?.id}`} active={isActive(`/user/${user?.id}`)} icon="person" onClick={() => setMobileMenuOpen(false)}>Mi Perfil</MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink to="/admin" active={isActive('/admin')} icon="dashboard" onClick={() => setMobileMenuOpen(false)}>Admin</MobileNavLink>
                  )}
                </>
              )}
            </div>

            {/* Footer Action */}
            <div className="px-3 sm:px-4 py-5 border-t border-white/10">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 border border-[#ffdad6]/40 text-[#ffdad6] rounded-full font-label text-[11px] uppercase tracking-wider font-bold hover:bg-[#ba1a1a]/30 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Salir</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-secondary text-on-secondary rounded-full font-label text-[11px] uppercase tracking-wider font-bold hover:bg-secondary-hover transition-all"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </aside>
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
      className={`relative flex items-center gap-3 px-5 py-2.5 font-headline text-lg font-bold tracking-tight transition-colors duration-200 rounded-full hover:bg-[#166e5e] ${
        active ? 'text-secondary' : 'text-white'
      }`}
    >
      <span className={`material-symbols-outlined text-2xl ${active ? 'text-secondary' : 'text-white'}`}>{icon}</span>
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
      className={`w-full flex items-center justify-start gap-3 px-4 py-3 font-headline text-base sm:text-lg font-bold transition-colors rounded-xl hover:bg-[#166e5e] ${
        active ? 'text-secondary' : 'text-white'
      }`}
    >
      <span className={`material-symbols-outlined text-xl ${active ? 'text-secondary' : 'text-white'}`}>{icon}</span>
      <span>{children}</span>
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
          ? 'text-primary hover:bg-secondary-container/40' 
          : 'text-primary hover:bg-surface-container-low'
      }`}
    >
      <span className={`material-symbols-outlined text-lg transition-transform duration-200 group-hover:scale-110 ${
        highlight ? 'text-secondary-dark' : 'text-outline'
      }`}>
        {icon}
      </span>
      <span className={`font-body text-sm ${highlight ? 'font-semibold' : ''}`}>
        {children}
      </span>
      {highlight && (
        <span className="ml-auto material-symbols-outlined text-sm text-secondary-dark">arrow_forward</span>
      )}
    </Link>
  )
}
