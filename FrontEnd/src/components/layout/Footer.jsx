import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUp, ArrowUpRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../ui/BrandLogo'
import { frases } from '../../utils/frases'

const GENRE_LINKS = [
  { label: 'Fantasía', to: '/catalog?genre=FANTASY' },
  { label: 'Autoayuda', to: '/catalog?genre=SELF-HELP' },
  { label: 'Ficción', to: '/catalog?genre=FICTION' },
  { label: 'Ver todo el catálogo', to: '/catalog' },
]

export default function Footer() {
  const { isAuthenticated, user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [quote] = useState(() => frases[Math.floor(Math.random() * frases.length)])

  const navLinks = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/catalog' },
    ...(isAuthenticated
      ? [
          { label: 'Mi Biblioteca', to: '/library' },
          { label: 'Mi Perfil', to: `/user/${user?.id}` },
          ...(isAdmin ? [{ label: 'Administración', to: '/admin' }] : []),
        ]
      : [{ label: 'Iniciar Sesión', to: '/auth' }]),
  ]

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'))
  }

  const handleScrollTop = () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  return (
    <footer className="w-full bg-footer-bg text-white border-t-[3px] border-secondary mt-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-14 pb-8">
        {/* Main Editorial Grid */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-8 gap-y-10 lg:gap-12 pb-12">
          {/* Brand & Literary Quote */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4 flex flex-col justify-between gap-6">
            <div>
              <Link
                to="/"
                className="inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary rounded-sm"
              >
                <BrandLogo variant="dark" className="h-10 w-auto" />
              </Link>
              <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-forest-muted/90">
                Tu espacio editorial para descubrir nuevas lecturas, guardar tus libros favoritos y compartir reseñas con otros lectores.
              </p>
            </div>

            {quote && (
              <figure className="max-w-sm border-t border-white/10 pt-5">
                <blockquote className="font-headline italic text-sm leading-relaxed text-forest-muted/85">
                  “{quote.frase}”
                </blockquote>
                <figcaption className="mt-2 font-label text-xs font-medium tracking-wide text-secondary/90">
                  — {quote.autor}
                </figcaption>
              </figure>
            )}
          </div>

          {/* Navigation Column */}
          <nav aria-label="Navegación del pie de página" className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary mb-4">
              Explorar
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center py-0.5 font-body text-sm font-normal text-forest-muted hover:text-secondary-hover transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Genres Column */}
          <nav aria-label="Géneros destacados" className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary mb-4">
              Géneros
            </h3>
            <ul className="space-y-2.5">
              {GENRE_LINKS.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center py-0.5 font-body text-sm font-normal text-forest-muted hover:text-secondary-hover transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Reading Assistant Card — Concentric Radius (21px = 12px + 8px padding + 1px border) */}
          <div className="col-span-2 md:col-span-12 lg:col-span-4 flex items-start lg:justify-end">
            <div className="w-full lg:max-w-md rounded-[21px] p-2 bg-white/[0.04] border border-transparent shadow-[0_0_0_1px_oklch(1_0_0/0.08)] hover:shadow-[0_0_0_1px_oklch(1_0_0/0.13)] transition-[box-shadow] duration-150 ease-out">
              <div className="rounded-[12px] bg-[#0b2c26]/85 p-5 sm:p-6">
                <div className="inline-flex items-center gap-1.5 text-secondary font-label text-[11px] font-semibold uppercase tracking-[0.15em]">
                  <Sparkles size={14} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
                  <span>Asistente Lib IA</span>
                </div>

                <h3 className="mt-2.5 font-headline text-xl font-bold tracking-tight text-white leading-snug">
                  ¿No sabés qué leer ahora?
                </h3>

                <p className="mt-1.5 font-body text-sm leading-relaxed text-forest-muted/85">
                  Contale a Lib qué género o historia buscás y recibí recomendaciones al instante.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleOpenAssistant}
                    className="group inline-flex items-center gap-2 ps-4 pe-3.5 py-2.5 rounded-full bg-secondary text-on-secondary font-label text-xs font-semibold uppercase tracking-wider hover:bg-secondary-hover transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                  >
                    <span>Hablar con Lib</span>
                    <ArrowRight
                      size={15}
                      strokeWidth={2}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="rtl:-scale-x-100 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:pe-16">
          <p className="font-body text-xs text-forest-muted/80 text-center sm:text-left">
            © {new Date().getFullYear()} BookReview. Desarrollado por{' '}
            <a
              href="https://github.com/lauvis11"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-0.5 font-medium text-forest-muted hover:text-secondary-hover underline underline-offset-4 decoration-white/25 hover:decoration-secondary-hover transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary rounded-sm"
            >
              <span>Lautaro Viscarra</span>
              <ArrowUpRight
                size={13}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="rtl:-scale-x-100 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-px motion-safe:group-hover:-translate-y-px"
              />
            </a>
          </p>

          <button
            type="button"
            onClick={handleScrollTop}
            aria-label="Volver arriba"
            className="group inline-flex items-center gap-1.5 ps-3.5 pe-3 py-2 rounded-full bg-white/[0.04] border border-transparent shadow-[0_0_0_1px_oklch(1_0_0/0.08)] hover:bg-white/[0.08] hover:shadow-[0_0_0_1px_oklch(1_0_0/0.13)] text-xs font-medium text-forest-muted hover:text-white transition-[color,background-color,box-shadow,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            <span>Volver arriba</span>
            <ArrowUp
              size={14}
              strokeWidth={2}
              absoluteStrokeWidth
              aria-hidden="true"
              className="transition-transform duration-150 ease-out motion-safe:group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </footer>
  )
}
