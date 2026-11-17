import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/books', label: 'Libros', icon: 'menu_book' },
    { path: '/admin/users', label: 'Usuarios', icon: 'group' },
  ]

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-container-low h-screen fixed left-0 top-0 py-8 px-4 z-30 border-r border-outline-variant/30">
        {/* Logo */}
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-serif italic text-primary">BookReview</h1>
          <p className="font-serif text-sm opacity-70 text-primary mt-1 uppercase tracking-widest">
            Panel de Administracion
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 font-serif text-lg tracking-tight font-bold transition-all duration-200 ${
                isActive(item.path)
                  ? 'text-primary border-r-4 border-primary bg-primary-fixed/60'
                  : 'text-on-surface-variant hover:bg-surface hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-8 border-t border-outline-variant/30 space-y-1">
          <Link
            to="/admin/books"
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-white py-3 rounded font-body font-medium mb-6 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Añadir Libro
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant font-serif text-md hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">home</span>
            <span>Back to Site</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant font-serif text-md hover:text-[#ba1a1a] transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Exit</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface/85 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-serif italic text-primary">BookReview</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-primary"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-surface-container-low border-t border-outline-variant/30 py-4 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-serif text-lg font-bold rounded ${
                  isActive(item.path)
                    ? 'text-primary bg-primary-fixed'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
