import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Menu, X, Home, BookOpen, Bookmark, Users, User, LayoutDashboard } from 'lucide-react'
import { getProfile } from '../../api/profile'
import BrandLogo from '../ui/BrandLogo'

export default function Navbar() {
  const { user, isAuthenticated, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [darkModePreview, setDarkModePreview] = useState(false)
  const menuRef = useRef(null)

  // Track scroll for subtle navbar elevation
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close user dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
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
      getProfile(user.id)
        .then((res) => {
          updateUser({ profile_img: res.data.profile_img })
        })
        .catch(() => {})
    }
  }, [user?.id, user?.profile_img, updateUser])

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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? 'bg-surface/95 backdrop-blur-xl border-b border-outline-variant/50 shadow-[0_6px_28px_-10px_rgba(14,81,70,0.10)]'
            : 'bg-surface/85 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] gap-4 h-16 md:h-20">
            {/* Left Section: Mobile Menu Toggle + Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                style={{ borderRadius: '9999px' }}
                className="md:hidden size-9 -ml-1.5 text-primary hover:bg-primary/[0.06] transition-colors cursor-pointer flex items-center justify-center active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
              >
                {mobileMenuOpen ? (
                  <X size={20} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
                ) : (
                  <Menu size={20} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
                )}
              </button>

              <Link
                to="/"
                className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BrandLogo variant="light" className="h-8 sm:h-9 md:h-10 w-auto" />
              </Link>
            </div>

            {/* Center Section: Minimal Editorial Links (Desktop) */}
            <div className="hidden md:flex items-center justify-center gap-8 lg:gap-10">
              <NavItem to="/" active={isActive('/')} icon={Home}>
                Inicio
              </NavItem>
              <NavItem to="/catalog" active={isActive('/catalog')} icon={BookOpen}>
                Catálogo
              </NavItem>
              <NavItem to="/library" active={isActive('/library')} icon={Bookmark}>
                Biblioteca
              </NavItem>
              <NavItem to="/comunidad" active={isActive('/comunidad')} icon={Users}>
                Comunidad
              </NavItem>
            </div>

            {/* Right Section: Theme Toggle + Avatar Bubble / Login Button */}
            <div className="flex items-center justify-end gap-3 md:gap-4">
              {/* Theme Mode Toggle (Visual placeholder — sin funcionalidad real por ahora) */}
              <button
                type="button"
                onClick={() => setDarkModePreview((prev) => !prev)}
                aria-label={darkModePreview ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title={darkModePreview ? 'Modo claro (próximamente)' : 'Modo oscuro (próximamente)'}
                style={{ borderRadius: '9999px' }}
                className="size-9 md:size-10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/[0.06] transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [-webkit-tap-highlight-color:transparent]"
              >
                {darkModePreview ? (
                  <Sun size={18} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
                ) : (
                  <Moon size={18} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
                )}
              </button>

              {/* Auth Area: Avatar Bubble + Dropdown OR Login Button */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label="Abrir menú de usuario"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    style={{ borderRadius: '9999px' }}
                    className={`relative size-9 md:size-10 flex items-center justify-center overflow-hidden bg-primary text-secondary-light font-hero-display text-base font-semibold transition-[box-shadow,transform] duration-150 ease-out active:scale-[0.96] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [-webkit-tap-highlight-color:transparent] ${
                      menuOpen
                        ? 'ring-2 ring-secondary-dark ring-offset-2 ring-offset-surface shadow-[0_6px_18px_rgba(14,81,70,0.18)]'
                        : 'ring-1 ring-primary/15 hover:ring-2 hover:ring-secondary/80 hover:ring-offset-2 hover:ring-offset-surface shadow-[0_2px_10px_rgba(14,81,70,0.12)]'
                    }`}
                  >
                    {user?.profile_img ? (
                      <img
                        src={user.profile_img}
                        alt={user.name}
                        className="w-full h-full object-cover bg-surface-container-high"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-[0_16px_42px_-8px_rgba(14,81,70,0.16),0_4px_14px_rgba(0,0,0,0.04)] border border-outline-variant/60 overflow-hidden z-50 animate-[dropdownIn_0.18s_ease]"
                    >
                      {/* User Header */}
                      <div className="px-5 py-4 bg-surface-container-low/80 border-b border-outline-variant/40">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ borderRadius: '9999px' }}
                            className="size-11 shrink-0 bg-primary flex items-center justify-center text-secondary-light font-hero-display font-semibold text-lg overflow-hidden"
                          >
                            {user?.profile_img ? (
                              <img
                                src={user.profile_img}
                                alt={user.name}
                                className="w-full h-full object-cover bg-surface-container-high"
                              />
                            ) : (
                              user?.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-headline font-bold text-primary text-sm">
                              {user?.name}
                            </p>
                            {isAdmin && (
                              <span
                                style={{ borderRadius: '9999px' }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-secondary-light text-[9px] font-hero-sans uppercase tracking-wider mt-1"
                              >
                                <span
                                  className="material-symbols-outlined text-[10px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  shield
                                </span>
                                Administrador
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1.5">
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
                            <div className="my-1.5 mx-4 border-b border-outline-variant/40" />
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
                      <div className="border-t border-outline-variant/40 py-1.5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/35 transition-colors cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                            logout
                          </span>
                          <span className="font-hero-sans text-sm font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center px-4 sm:px-5 h-9 md:h-10 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-xs sm:text-[13px] font-semibold tracking-wide whitespace-nowrap shadow-[0_2px_8px_rgba(14,81,70,0.18)] hover:shadow-[0_6px_16px_rgba(14,81,70,0.24)] transition-[background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Left side drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-50 flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-[#18332f]/35 backdrop-blur-[2px] animate-[drawerBackdropIn_200ms_ease_both]"
            aria-hidden="true"
          />

          <aside className="relative z-10 w-[72%] max-w-[300px] h-full bg-surface/98 backdrop-blur-xl border-r border-outline-variant/60 shadow-[8px_0_32px_rgba(14,81,70,0.14)] flex flex-col overflow-y-auto overscroll-contain animate-[drawerSlideLeft_280ms_var(--ease-drawer)_both]">
            <div className="flex-1 flex flex-col items-stretch justify-start gap-1 px-4 py-6">
              <MobileNavItem to="/" active={isActive('/')} icon={Home} onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </MobileNavItem>
              <MobileNavItem to="/catalog" active={isActive('/catalog')} icon={BookOpen} onClick={() => setMobileMenuOpen(false)}>
                Catálogo
              </MobileNavItem>
              <MobileNavItem to="/library" active={isActive('/library')} icon={Bookmark} onClick={() => setMobileMenuOpen(false)}>
                Biblioteca
              </MobileNavItem>
              <MobileNavItem to="/comunidad" active={isActive('/comunidad')} icon={Users} onClick={() => setMobileMenuOpen(false)}>
                Comunidad
              </MobileNavItem>
              {isAuthenticated && (
                <>
                  <div className="my-2 border-b border-outline-variant/50" />
                  <MobileNavItem
                    to={`/user/${user?.id}`}
                    active={isActive(`/user/${user?.id}`)}
                    icon={User}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mi Perfil
                  </MobileNavItem>
                  {isAdmin && (
                    <MobileNavItem to="/admin" active={isActive('/admin')} icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>
                      Panel de Administración
                    </MobileNavItem>
                  )}
                </>
              )}
            </div>

            <div className="px-4 py-5 border-t border-outline-variant/50">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-[10px] font-hero-sans text-xs font-semibold hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-primary hover:bg-[#166e5e] text-white rounded-[10px] font-hero-sans text-xs font-semibold transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

function NavItem({ to, active, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className={`relative inline-flex items-center gap-2 font-hero-sans text-[15.5px] transition-colors duration-200 py-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-xs ${
        active
          ? 'text-primary font-semibold'
          : 'text-on-surface-variant/75 font-medium hover:text-primary'
      }`}
    >
      {Icon && (
        <Icon
          size={17}
          strokeWidth={active ? 2.1 : 1.75}
          absoluteStrokeWidth
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </Link>
  )
}

function MobileNavItem({ to, active, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-left px-4 py-3 font-hero-sans text-[15px] transition-colors rounded-xl ${
        active
          ? 'bg-primary/[0.08] text-primary font-semibold'
          : 'text-on-surface-variant/80 font-medium hover:text-primary hover:bg-primary/[0.05]'
      }`}
    >
      {Icon && (
        <Icon
          size={18}
          strokeWidth={active ? 2.1 : 1.75}
          absoluteStrokeWidth
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </Link>
  )
}

function DropdownItem({ to, icon, children, onClick, highlight }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-2.5 transition-colors duration-150 group ${
        highlight
          ? 'text-primary hover:bg-secondary-container/40'
          : 'text-primary hover:bg-surface-container-low'
      }`}
    >
      <span
        className={`material-symbols-outlined text-lg transition-transform duration-150 group-hover:scale-110 ${
          highlight ? 'text-secondary-dark' : 'text-outline'
        }`}
      >
        {icon}
      </span>
      <span className={`font-hero-sans text-sm ${highlight ? 'font-semibold' : 'font-medium'}`}>
        {children}
      </span>
      {highlight && (
        <span className="ml-auto material-symbols-outlined text-sm text-secondary-dark">
          arrow_forward
        </span>
      )}
    </Link>
  )
}
