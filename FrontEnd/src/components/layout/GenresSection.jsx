import { useEffect, useRef, useState } from 'react'
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
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const EASE_SPRING_SETTLE = 'cubic-bezier(0.22, 1.12, 0.36, 1)'
const HEADER_DURATION_MS = 440
const TILE_DURATION_MS = 480
const CONTROLS_DURATION_MS = 280
const CONTROLS_DELAY_MS = 240

export default function GenresSection() {
  const [colOffset, setColOffset] = useState(0)
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  )
  const sectionRef = useRef(null)

  useEffect(() => {
    if (isVisible) return
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  const maxOffset = Math.max(0, GENRE_COLUMNS.length - VISIBLE_COLUMNS)
  const canPrev = colOffset > 0
  const canNext = colOffset < maxOffset

  return (
    <section
      ref={sectionRef}
      className="mb-16 md:mb-20"
      aria-labelledby="genres-section-title"
    >
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 sm:mb-7 pb-4 border-b border-outline-variant/45"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
          transition: `opacity ${HEADER_DURATION_MS}ms ${EASE_OUT}, transform ${HEADER_DURATION_MS}ms ${EASE_OUT}`,
        }}
      >
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

      {/* Carrusel de 12 géneros: 3 columnas visibles en todos los anchos, controlado únicamente por los botones */}
      <div className="relative -mx-4 sm:-mx-3 md:-mx-6 lg:mx-auto lg:max-w-[1100px] px-9 sm:px-12 lg:px-16">
        <div className="overflow-hidden -mx-1 sm:-mx-1.5 lg:-mx-2 -my-3 py-3">
          <div
            className="flex"
            style={{
              transform: `translate3d(-${(colOffset * 100) / VISIBLE_COLUMNS}%, 0, 0)`,
              transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {GENRE_COLUMNS.map((pair, colIdx) => {
              const isHidden = colIdx < colOffset || colIdx >= colOffset + VISIBLE_COLUMNS
              const isInitialColumn = colIdx < VISIBLE_COLUMNS
              return (
                <div
                  key={colIdx}
                  aria-hidden={isHidden}
                  className="w-1/3 shrink-0 px-1 sm:px-1.5 lg:px-2 flex flex-col gap-2.5 sm:gap-3 lg:gap-4"
                >
                  {pair.map((genre, rowIdx) => {
                    const Icon = genre.icon
                    const delayMs = 60 + colIdx * 60 + rowIdx * 45
                    return (
                      <div
                        key={genre.query}
                        className="w-full"
                        style={
                          isInitialColumn
                            ? {
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible
                                  ? 'translate3d(0, 0, 0) scale(1)'
                                  : 'translate3d(0, 14px, 0) scale(0.94)',
                                transition: `opacity ${TILE_DURATION_MS}ms ${EASE_OUT} ${delayMs}ms, transform ${TILE_DURATION_MS}ms ${EASE_SPRING_SETTLE} ${delayMs}ms`,
                              }
                            : undefined
                        }
                      >
                        <Link
                          to={`/catalog?genre=${encodeURIComponent(genre.query)}`}
                          tabIndex={isHidden ? -1 : 0}
                          className="group relative overflow-hidden flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:justify-start lg:text-left lg:gap-3.5 rounded-lg lg:rounded-xl border border-[#d3ccb8] hover:border-primary/40 bg-[#eae6da] hover:bg-[#e3decb] px-2 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5 lg:px-5 lg:py-4 h-[92px] sm:h-[96px] lg:h-[104px] text-primary shadow-[0_2px_0_#d5cebc,0_6px_14px_-6px_rgba(24,51,47,0.14)] hover:shadow-[0_4px_0_#ccc4b0,0_10px_20px_-6px_rgba(14,81,70,0.18)] active:shadow-[0_1px_0_#ccc4b0] cursor-pointer transition-[background-color,border-color,box-shadow,translate,scale] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [-webkit-tap-highlight-color:transparent]"
                        >
                          {/* Ícono decorativo de fondo (marca de agua sutil) */}
                          <Icon
                            strokeWidth={1.15}
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-2 -bottom-2 lg:-right-3 lg:-bottom-3 size-12 sm:size-16 lg:size-[86px] text-primary/[0.08] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:-rotate-3"
                          />

                          {/* Ícono principal verde bosque */}
                          <Icon
                            strokeWidth={1.85}
                            absoluteStrokeWidth
                            aria-hidden="true"
                            className="relative z-10 shrink-0 size-[18px] sm:size-5 lg:size-[22px] text-primary"
                          />

                          {/* Nombre de la categoría verde bosque */}
                          <span className="relative z-10 w-full lg:flex-1 lg:pr-5 font-hero-display text-[14.5px] sm:text-[18px] md:text-[21px] lg:text-[27px] font-semibold tracking-[-0.015em] leading-[1.08] text-primary break-words">
                            {genre.name}
                          </span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Controles del carrusel: revelación inicial tras la ola diagonal sin retrasar cambios posteriores */}
        <div
          className={isVisible ? undefined : 'pointer-events-none'}
          style={{
            opacity: isVisible ? 1 : 0,
            transition: `opacity ${CONTROLS_DURATION_MS}ms ${EASE_OUT} ${CONTROLS_DELAY_MS}ms`,
          }}
        >
          {/* Botón de slide izquierdo */}
          <button
            type="button"
            onClick={() => setColOffset((prev) => Math.max(0, prev - 1))}
            disabled={!canPrev}
            aria-label="Ver 2 géneros anteriores"
            style={{ borderRadius: '9999px' }}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 lg:size-[52px] flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_6px_18px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              canPrev ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft
              strokeWidth={2}
              absoluteStrokeWidth
              aria-hidden="true"
              className="size-4 sm:size-5 lg:size-6"
            />
          </button>

          {/* Botón de slide derecho */}
          <button
            type="button"
            onClick={() => setColOffset((prev) => Math.min(maxOffset, prev + 1))}
            disabled={!canNext}
            aria-label="Ver 2 géneros siguientes"
            style={{ borderRadius: '9999px' }}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-10 lg:size-[52px] flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_6px_18px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              canNext ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight
              strokeWidth={2}
              absoluteStrokeWidth
              aria-hidden="true"
              className="size-4 sm:size-5 lg:size-6"
            />
          </button>
        </div>
      </div>
    </section>
  )
}
