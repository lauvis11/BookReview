import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  BookOpen,
  Feather,
  Compass,
  Briefcase,
  Brain,
  Rocket,
  Search,
  Heart,
  Landmark,
  Flame,
  ScrollText,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// 6 columnas verticales de 2 géneros cada una ([arriba, abajo]) = 12 géneros en total.
// Al avanzar de a 1 columna, entran 2 géneros nuevos y los existentes conservan su fila (arriba/abajo) desplazándose hacia la izquierda.
const GENRE_COLUMNS = [
  [
    { name: 'Fantasía', query: 'FANTASY', icon: Sparkles },
    { name: 'Aventura', query: 'ADVENTURE', icon: Compass },
  ],
  [
    { name: 'Ficción', query: 'FICTION', icon: BookOpen },
    { name: 'Negocios y Economía', query: 'Business & Economics', icon: Briefcase },
  ],
  [
    { name: 'Ficción Juvenil', query: 'Juvenile Fiction', icon: Feather },
    { name: 'Autoayuda y Psicología', query: 'SELF-HELP', icon: Brain },
  ],
  [
    { name: 'Ciencia Ficción', query: 'Science Fiction', icon: Rocket },
    { name: 'Historia', query: 'History', icon: Landmark },
  ],
  [
    { name: 'Misterio y Suspenso', query: 'Mystery', icon: Search },
    { name: 'Terror', query: 'Horror', icon: Flame },
  ],
  [
    { name: 'Romance', query: 'Romance', icon: Heart },
    { name: 'Biografías', query: 'Biography', icon: ScrollText },
  ],
]

const VISIBLE_COLUMNS = 3

export default function GenresSection() {
  const [colOffset, setColOffset] = useState(0)

  const maxOffset = Math.max(0, GENRE_COLUMNS.length - VISIBLE_COLUMNS)
  const canPrev = colOffset > 0
  const canNext = colOffset < maxOffset

  return (
    <section className="mb-16 md:mb-20" aria-labelledby="genres-section-title">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
        <h2
          id="genres-section-title"
          className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight"
        >
          Explora por{' '}
          <span className="italic font-medium text-secondary-dark">géneros</span>
        </h2>

        <Link
          to="/catalog"
          className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
        >
          <span>Ver todo el catálogo</span>
          <ArrowRight
            size={14}
            strokeWidth={2}
            absoluteStrokeWidth
            aria-hidden="true"
            className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {/* Carrusel de 12 géneros: 3 columnas visibles (6 botones), avanza de 2 en 2 (1 columna por clic) */}
      <div className="relative max-w-[1100px] mx-auto px-14 lg:px-16">
        <div className="overflow-hidden -mx-2 -my-3 py-3">
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(-${(colOffset * 100) / VISIBLE_COLUMNS}%, 0, 0)`,
              transition: 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {GENRE_COLUMNS.map((pair, colIdx) => {
              const isHidden = colIdx < colOffset || colIdx >= colOffset + VISIBLE_COLUMNS
              return (
                <div
                  key={colIdx}
                  aria-hidden={isHidden}
                  className="w-1/3 shrink-0 px-2 flex flex-col gap-4"
                >
                  {pair.map((genre) => {
                    const Icon = genre.icon
                    return (
                      <Link
                        key={genre.query}
                        to={`/catalog?genre=${encodeURIComponent(genre.query)}`}
                        tabIndex={isHidden ? -1 : 0}
                        className="group relative overflow-hidden flex items-center gap-3.5 rounded-xl border border-[#d3ccb8] hover:border-primary/40 bg-[#eae6da] hover:bg-[#e3decb] px-5 py-5 min-h-[96px] text-primary shadow-[0_2px_0_#d5cebc,0_6px_14px_-6px_rgba(24,51,47,0.14)] hover:shadow-[0_4px_0_#ccc4b0,0_10px_20px_-6px_rgba(14,81,70,0.18)] active:shadow-[0_1px_0_#ccc4b0] cursor-pointer transition-[background-color,border-color,box-shadow,translate,scale] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [-webkit-tap-highlight-color:transparent]"
                      >
                        {/* Ícono decorativo de fondo (marca de agua sutil) */}
                        <Icon
                          size={86}
                          strokeWidth={1.15}
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-3 -bottom-3 text-primary/[0.08] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:-rotate-3"
                        />

                        {/* Ícono principal verde bosque */}
                        <Icon
                          size={22}
                          strokeWidth={1.85}
                          absoluteStrokeWidth
                          aria-hidden="true"
                          className="relative z-10 shrink-0 text-primary"
                        />

                        {/* Nombre de la categoría verde bosque */}
                        <span className="relative z-10 flex-1 pr-5 text-left font-hero-display text-[25px] lg:text-[27px] font-semibold tracking-[-0.015em] leading-[1.1] text-primary">
                          {genre.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Botón de slide izquierdo */}
        <button
          type="button"
          onClick={() => setColOffset((prev) => Math.max(0, prev - 1))}
          disabled={!canPrev}
          aria-label="Ver 2 géneros anteriores"
          style={{ borderRadius: '9999px' }}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 size-12 lg:size-[52px] flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            canPrev ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft size={24} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        </button>

        {/* Botón de slide derecho */}
        <button
          type="button"
          onClick={() => setColOffset((prev) => Math.min(maxOffset, prev + 1))}
          disabled={!canNext}
          aria-label="Ver 2 géneros siguientes"
          style={{ borderRadius: '9999px' }}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 size-12 lg:size-[52px] flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            canNext ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight size={24} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
