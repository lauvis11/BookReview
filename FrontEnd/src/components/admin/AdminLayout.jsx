import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import BrandLogo from '../ui/BrandLogo'

const NAV_ITEMS = [
  { path: '/admin', label: 'Panel general', icon: LayoutDashboard },
  { path: '/admin/books', label: 'Libros', icon: BookOpen },
  { path: '/admin/users', label: 'Usuarios', icon: Users },
]

export default function AdminLayout() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const activeNav = NAV_ITEMS.find((item) => isActive(item.path)) || NAV_ITEMS[0]
  const adminName = user?.name || 'Administrador'
  const adminSubtitle = user?.email || 'Administrador'
  const adminInitial = adminName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#18332f] dark:bg-[#0c1412] dark:text-[#f0ede6] font-hero-sans flex">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Navegación de administración"
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-[#f3f4ef] dark:bg-[#101a17] border-r border-[#18332f]/[0.08] dark:border-white/[0.08] px-3 py-6"
      >
        {/* Brand Header */}
        <div className="px-3 mb-7">
          <Link
            to="/admin"
            className="inline-flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40 rounded-lg"
          >
            <BrandLogo variant="light" className="h-7 w-auto dark:hidden" />
            <BrandLogo variant="dark" className="hidden h-7 w-auto dark:block" />
          </Link>
          <p className="mt-1.5 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
            Administración
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-[color,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40 ${
                  active
                    ? 'bg-white text-[#0e5146] font-semibold border border-[#18332f]/[0.07] shadow-[0_1px_2px_rgba(24,51,47,0.05)] dark:bg-[#192824] dark:text-[#f0ede6] dark:border-white/[0.08] dark:shadow-none'
                    : 'text-[#4a615b] font-medium border border-transparent hover:bg-[#18332f]/[0.04] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:bg-white/[0.04] dark:hover:text-[#f0ede6]'
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.5}
                  absoluteStrokeWidth
                  className={
                    active
                      ? 'text-[#0e5146] dark:text-[#edbd79]'
                      : 'text-[#5d726c] group-hover:text-[#18332f] dark:text-[#a6b7b1] dark:group-hover:text-[#f0ede6]'
                  }
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Utility & Admin Profile */}
        <div className="mt-auto pt-4 border-t border-[#18332f]/[0.08] dark:border-white/[0.08] space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-full flex items-center gap-2.5 ps-3 pe-3.5 py-2 rounded-xl text-sm font-medium text-[#4a615b] hover:bg-[#18332f]/[0.04] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:bg-white/[0.04] dark:hover:text-[#f0ede6] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            {isDark ? (
              <Sun size={16} strokeWidth={1.75} absoluteStrokeWidth />
            ) : (
              <Moon size={16} strokeWidth={1.75} absoluteStrokeWidth />
            )}
            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 ps-3 pe-3.5 py-2 rounded-xl text-sm font-medium text-[#4a615b] hover:bg-[#18332f]/[0.04] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:bg-white/[0.04] dark:hover:text-[#f0ede6] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            <ArrowLeft size={16} strokeWidth={1.75} absoluteStrokeWidth />
            <span>Volver a BookReview</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 ps-3 pe-3.5 py-2 rounded-xl text-sm font-medium text-[#5d726c] hover:bg-[#ba1a1a]/[0.07] hover:text-[#ba1a1a] dark:text-[#a6b7b1] dark:hover:bg-[#f87171]/10 dark:hover:text-[#f87171] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]/40"
          >
            <LogOut size={16} strokeWidth={1.75} absoluteStrokeWidth />
            <span>Cerrar sesión</span>
          </button>

          {/* Admin Identity Card */}
          <div className="pt-3 mt-2 border-t border-[#18332f]/[0.06] dark:border-white/[0.06] px-2 flex items-center gap-2.5">
            {user?.profile_img ? (
              <img
                src={user.profile_img}
                alt={adminName}
                style={{ borderRadius: '9999px' }}
                className="w-8 h-8 object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
              />
            ) : (
              <div
                style={{ borderRadius: '9999px' }}
                className="w-8 h-8 bg-[#0e5146] dark:bg-[#166e5e] text-white text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {adminInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                {adminName}
              </p>
              <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                {adminSubtitle}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-[#f8f7f2]/95 dark:bg-[#0c1412]/95 border-b border-[#18332f]/[0.08] dark:border-white/[0.08] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/admin"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 rounded-md"
          >
            <BrandLogo variant="light" showText={false} className="h-7 w-7 dark:hidden" />
            <BrandLogo variant="dark" showText={false} className="hidden h-7 w-7 dark:block" />
          </Link>
          <span className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
            {activeNav.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#18332f] dark:text-[#f0ede6] hover:bg-[#18332f]/[0.06] dark:hover:bg-white/[0.06] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            {isDark ? (
              <Sun size={18} strokeWidth={1.75} absoluteStrokeWidth />
            ) : (
              <Moon size={18} strokeWidth={1.75} absoluteStrokeWidth />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#18332f] dark:text-[#f0ede6] hover:bg-[#18332f]/[0.06] dark:hover:bg-white/[0.06] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            {mobileMenuOpen ? (
              <X size={20} strokeWidth={1.75} absoluteStrokeWidth />
            ) : (
              <Menu size={20} strokeWidth={1.75} absoluteStrokeWidth />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de administración"
        >
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#0c1412]/40 dark:bg-black/60 cursor-default"
          />

          <div className="relative z-10 w-72 max-w-[82vw] h-full bg-[#f3f4ef] dark:bg-[#101a17] border-r border-[#18332f]/[0.08] dark:border-white/[0.08] flex flex-col p-4 overflow-y-auto overscroll-contain shadow-[0_20px_50px_rgba(12,20,18,0.22)]">
            <div className="flex items-center justify-between px-2 pb-5 mb-3 border-b border-[#18332f]/[0.08] dark:border-white/[0.08]">
              <div>
                <BrandLogo variant="light" className="h-6 w-auto dark:hidden" />
                <BrandLogo variant="dark" className="hidden h-6 w-auto dark:block" />
                <p className="mt-1 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                  Administración
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4a615b] dark:text-[#a6b7b1] hover:bg-[#18332f]/[0.06] dark:hover:bg-white/[0.06] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                <X size={18} strokeWidth={1.75} absoluteStrokeWidth />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors duration-150 ease-out ${
                      active
                        ? 'bg-white text-[#0e5146] font-semibold border border-[#18332f]/[0.07] dark:bg-[#192824] dark:text-[#f0ede6] dark:border-white/[0.08]'
                        : 'text-[#4a615b] font-medium border border-transparent hover:bg-[#18332f]/[0.04] dark:text-[#a6b7b1] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2 : 1.5}
                      absoluteStrokeWidth
                      className={active ? 'text-[#0e5146] dark:text-[#edbd79]' : ''}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-4 mt-4 border-t border-[#18332f]/[0.08] dark:border-white/[0.08] space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#4a615b] hover:bg-[#18332f]/[0.04] dark:text-[#a6b7b1] dark:hover:bg-white/[0.04] transition-colors duration-150"
              >
                <ArrowLeft size={16} strokeWidth={1.75} absoluteStrokeWidth />
                <span>Volver a BookReview</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#ba1a1a] dark:text-[#f87171] hover:bg-[#ba1a1a]/[0.07] dark:hover:bg-[#f87171]/10 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                <LogOut size={16} strokeWidth={1.75} absoluteStrokeWidth />
                <span>Cerrar sesión</span>
              </button>

              <div className="pt-3 mt-2 border-t border-[#18332f]/[0.06] dark:border-white/[0.06] px-2 flex items-center gap-2.5">
                {user?.profile_img ? (
                  <img
                    src={user.profile_img}
                    alt={adminName}
                    style={{ borderRadius: '9999px' }}
                    className="w-8 h-8 object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  />
                ) : (
                  <div
                    style={{ borderRadius: '9999px' }}
                    className="w-8 h-8 bg-[#0e5146] dark:bg-[#166e5e] text-white text-xs font-semibold flex items-center justify-center shrink-0"
                  >
                    {adminInitial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                    {adminName}
                  </p>
                  <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                    {adminSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 min-w-0 md:ml-64 min-h-screen pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
