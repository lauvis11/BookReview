import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../ui/BrandLogo'

const GENRE_LINKS = [
  { label: 'Fantasía', to: '/catalog?genre=FANTASY' },
  { label: 'Ficción', to: '/catalog?genre=FICTION' },
  { label: 'Ciencia Ficción', to: '/catalog?genre=Science%20Fiction' },
  { label: 'Historia', to: '/catalog?genre=History' },
  { label: 'Autoayuda y Psicología', to: '/catalog?genre=SELF-HELP' },
  { label: 'Ver todo el catálogo', to: '/catalog' },
]

export default function Footer() {
  const { isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const navLinks = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/catalog' },
    { label: 'Biblioteca', to: '/library' },
    { label: 'Comunidad', to: '/comunidad' },
    ...(isAuthenticated
      ? [
          { label: 'Mi Perfil', to: `/user/${user?.id}` },
          ...(isAdmin ? [{ label: 'Administración', to: '/admin' }] : []),
        ]
      : [{ label: 'Iniciar sesión', to: '/auth' }]),
  ]

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message: '' } }))
  }

  return (
    <footer className="w-full bg-[#eae6da]/75 text-on-surface border-t border-[#d6d0c0]/90 mt-16 md:mt-24">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 pt-12 sm:pt-14 pb-8">
        {/* Main Editorial Grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10 lg:gap-12 pb-11">
          {/* Columna 1: Marca e Identidad Editorial */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4">
            <Link
              to="/"
              className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
            >
              <BrandLogo variant="light" className="h-9 sm:h-10 w-auto" />
            </Link>

            <p className="mt-4 max-w-sm font-hero-sans text-[14px] leading-[1.68] text-on-surface-variant">
              Tu espacio editorial para descubrir nuevas lecturas, registrar tu avance diario y compartir reseñas reales con nuestra comunidad de lectores.
            </p>
          </div>

          {/* Columna 2: Navegación */}
          <nav
            aria-label="Navegación del pie de página"
            className="col-span-1 md:col-span-3 lg:col-span-2"
          >
            <h3 className="font-hero-display text-lg font-semibold tracking-[-0.01em] text-primary mb-3.5">
              Navegación
            </h3>
            <ul className="space-y-2">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center py-0.5 font-hero-sans text-[13.5px] font-medium text-on-surface-variant hover:text-primary transition-[color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Columna 3: Géneros */}
          <nav
            aria-label="Géneros destacados"
            className="col-span-1 md:col-span-3 lg:col-span-2"
          >
            <h3 className="font-hero-display text-lg font-semibold tracking-[-0.01em] text-primary mb-3.5">
              Géneros
            </h3>
            <ul className="space-y-2">
              {GENRE_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center py-0.5 font-hero-sans text-[13.5px] font-medium text-on-surface-variant hover:text-primary transition-[color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Columna 4: Bloque abierto del Asistente Lib (sin fondo de tarjeta) */}
          <div className="col-span-2 md:col-span-12 lg:col-span-4 flex items-start lg:justify-end">
            <div className="w-full lg:max-w-md">
              <div className="inline-flex items-center gap-1.5 text-secondary-dark font-hero-sans text-xs font-semibold">
                <Sparkles size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                <span>Asistente literario Lib</span>
              </div>

              <h3 className="mt-2 font-hero-display text-2xl font-semibold tracking-[-0.015em] text-primary leading-[1.12]">
                ¿No sabés qué{' '}
                <span className="italic font-medium text-secondary-dark">leer ahora?</span>
              </h3>

              <p className="mt-2 font-hero-sans text-[13.5px] leading-relaxed text-on-surface-variant">
                Contale a Lib qué género, ritmo o historia buscás y recibí recomendaciones personalizadas al instante.
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleOpenAssistant}
                  className="group inline-flex items-center gap-2 h-10 ps-4 pe-3.5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-xs font-semibold shadow-[0_6px_16px_-4px_rgba(14,81,70,0.26)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span>Hablar con Lib</span>
                  <ArrowRight
                    size={15}
                    strokeWidth={2}
                    absoluteStrokeWidth
                    aria-hidden="true"
                    className="rtl:-scale-x-100 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior centrada */}
        <div className="border-t border-[#d6d0c0]/85 pt-6 flex items-center justify-center">
          <p className="font-hero-sans text-xs text-on-surface-variant text-center tabular-nums">
            © {new Date().getFullYear()} BookReview. Desarrollado por{' '}
            <a
              href="https://github.com/lauvis11"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-0.5 font-semibold text-primary hover:text-secondary-dark underline underline-offset-4 decoration-primary/30 hover:decoration-secondary-dark transition-[color,text-decoration-color] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
            >
              <span>Lautaro Viscarra</span>
              <ArrowUpRight
                size={13}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="rtl:-scale-x-100 transition-transform duration-150 ease-out group-hover:translate-x-px group-hover:-translate-y-px"
              />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
