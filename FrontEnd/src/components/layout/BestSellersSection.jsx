import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { useAIChatContext } from '../../context/AIChatContext'
import {
  CoverHabitosAtomicos,
  CoverIkigai,
  CoverNombreDelViento,
  CoverPsicologiaDinero,
  CoverSapiens,
} from '../../utils/editorialCovers'

/**
 * Selección curada manualmente de los 5 Best Sellers.
 * Usa las portadas SVG editoriales del Hero; más adelante cada ítem acepta `imageUrl` y `bookId` real.
 */
const BEST_SELLERS = [
  {
    rank: '01',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    genre: 'Autoayuda',
    rate: 4.9,
    synopsis:
      'Un método práctico y comprobado para construir buenos hábitos y transformar resultados extraordinarios a partir de cambios mínimos cada día.',
    query: 'Hábitos Atómicos',
    imageUrl: null,
    CoverSvg: CoverHabitosAtomicos,
  },
  {
    rank: '02',
    title: 'Ikigai',
    author: 'Héctor García y Francesc Miralles',
    genre: 'Bienestar',
    rate: 4.8,
    synopsis:
      'Los secretos de la isla japonesa de Okinawa para encontrar tu propósito vital, mantener la mente activa y vivir con serenidad.',
    query: 'Ikigai',
    imageUrl: null,
    CoverSvg: CoverIkigai,
  },
  {
    rank: '03',
    title: 'El Nombre del Viento',
    author: 'Patrick Rothfuss',
    genre: 'Fantasía',
    rate: 4.9,
    synopsis:
      'La historia de Kvothe narrada por él mismo: música, magia, pérdida y leyenda en una de las fantasías modernas más aclamadas.',
    query: 'El Nombre del Viento',
    imageUrl: null,
    CoverSvg: CoverNombreDelViento,
  },
  {
    rank: '04',
    title: 'La Psicología del Dinero',
    author: 'Morgan Housel',
    genre: 'Finanzas',
    rate: 4.8,
    synopsis:
      'Dieciocho lecciones atemporales sobre cómo nuestras emociones y hábitos definen el éxito financiero mucho más que las fórmulas.',
    query: 'Psicología del Dinero',
    imageUrl: null,
    CoverSvg: CoverPsicologiaDinero,
  },
  {
    rank: '05',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'Historia',
    rate: 4.7,
    synopsis:
      'Un recorrido fascinante por la historia de la humanidad, desde los primeros cazadores-recolectores hasta las revoluciones científicas modernas.',
    query: 'Sapiens',
    imageUrl: null,
    CoverSvg: CoverSapiens,
  },
]

const AUTO_CYCLE_MS = 2400

function BookCoverFrame({ book, className = '' }) {
  const CoverSvg = book.CoverSvg
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden rounded-[5px] ring-1 ring-black/[0.08] shadow-[0_14px_28px_-6px_rgba(24,51,47,0.24),0_4px_10px_-2px_rgba(24,51,47,0.12)] ${className}`}
    >
      {book.imageUrl ? (
        <img
          src={book.imageUrl}
          alt={`Portada de ${book.title}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <CoverSvg />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[7px] bg-gradient-to-r from-black/18 via-white/18 to-transparent"
      />
    </div>
  )
}

function StarRow({ rate }) {
  const filled = Math.round(rate)
  return (
    <div
      className="inline-flex items-center gap-1 sm:gap-1.5"
      aria-label={`Calificación ${rate.toFixed(1)} de 5`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`size-[10.5px] sm:size-[12.5px] lg:size-[13px] ${
              n <= filled
                ? 'fill-[#d9973b] text-[#d9973b]'
                : 'fill-outline-variant/40 text-outline-variant/40'
            }`}
          />
        ))}
      </div>
      <span className="font-hero-sans text-[10.5px] sm:text-xs font-semibold tabular-nums text-on-surface-variant leading-none">
        {rate.toFixed(1)}
      </span>
    </div>
  )
}

export default function BestSellersSection({ books = BEST_SELLERS }) {
  const { isSideOpen } = useAIChatContext()
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [autoActive, setAutoActive] = useState(true)

  // Animación sencilla de aparición cuando la sección entra en pantalla
  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.26 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Recorrido automático del focus: 1° -> 2° -> ... -> último -> vuelve al 1° y se detiene
  useEffect(() => {
    if (!isVisible || !autoActive || books.length <= 1) return

    let step = 0
    const totalSteps = books.length

    const intervalId = window.setInterval(() => {
      step += 1
      if (step < totalSteps) {
        setSelectedIdx(step)
      } else {
        setSelectedIdx(0)
        setAutoActive(false)
        window.clearInterval(intervalId)
      }
    }, AUTO_CYCLE_MS)

    return () => window.clearInterval(intervalId)
  }, [isVisible, autoActive, books.length])

  const handleSelect = (idx) => {
    setAutoActive(false)
    setSelectedIdx(idx)
  }

  const active = books[selectedIdx] || books[0]
  const activeHref = active.bookId
    ? `/books/${active.bookId}`
    : `/catalog?q=${encodeURIComponent(active.query)}`

  return (
    <section
      ref={sectionRef}
      aria-labelledby="bestsellers-section-title"
      style={{
        transitionDelay: '60ms',
        transitionDuration: '560ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`mb-16 md:mb-20 transition-[opacity,translate] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="mb-6 sm:mb-7 pb-4 border-b border-outline-variant/45">
        <h2
          id="bestsellers-section-title"
          className="font-bestseller-display text-[28px] sm:text-[38px] md:text-[42px] font-semibold tracking-[-0.02em] text-primary leading-none"
        >
          Los{' '}
          <span className="italic font-medium text-secondary-dark">“Best Sellers”</span>
        </h2>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 sm:gap-5 items-stretch ${
          isSideOpen ? '' : 'lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10'
        }`}
      >
        {/* Lista numerada 01–05: fila horizontal arriba en responsive o con side chat abierto; lista vertical a la izquierda en lg+ */}
        <div
          role="tablist"
          aria-label="Lista de Best Sellers"
          className={`relative grid grid-cols-5 h-[50px] sm:h-[54px] border-y border-outline-variant/45 overflow-hidden ${
            isSideOpen ? '' : 'lg:flex lg:flex-col lg:h-[400px]'
          }`}
        >
          {/* Indicador de focus deslizante horizontal */}
          <div
            aria-hidden="true"
            style={{
              width: `${100 / books.length}%`,
              transform: `translate3d(${selectedIdx * 100}%, 0, 0)`,
              transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`${isSideOpen ? '' : 'lg:hidden'} pointer-events-none absolute inset-y-0 left-0 z-0 bg-[#eae6da]/90`}
          >
            <span
              className="absolute bottom-0 inset-x-2.5 h-[2.5px] bg-primary"
              style={{ borderRadius: '9999px 9999px 0 0' }}
            />
          </div>

          {/* Indicador de focus deslizante vertical (solo desktop sin side chat) */}
          {!isSideOpen && (
            <div
              aria-hidden="true"
              style={{
                height: `${100 / books.length}%`,
                transform: `translate3d(0, ${selectedIdx * 100}%, 0)`,
                transition: 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="hidden lg:block pointer-events-none absolute inset-x-0 top-0 z-0 bg-[#eae6da]/90"
            >
              <span
                className="absolute left-0 inset-y-2.5 w-[3px] bg-primary"
                style={{ borderRadius: '0 9999px 9999px 0' }}
              />
            </div>
          )}

          {books.map((book, idx) => {
            const isSelected = idx === selectedIdx
            return (
              <button
                key={book.rank}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Puesto ${book.rank}: ${book.title}`}
                onClick={() => handleSelect(idx)}
                className={`group relative z-10 w-full h-full flex items-center justify-center px-1 text-center border-r border-outline-variant/45 last:border-r-0 transition-colors duration-200 cursor-pointer [-webkit-tap-highlight-color:transparent] ${
                  isSideOpen
                    ? ''
                    : 'lg:h-auto lg:flex-1 lg:justify-start lg:gap-4 lg:px-4 lg:text-left lg:border-r-0 lg:border-b lg:last:border-b-0'
                } ${isSelected ? 'bg-transparent' : 'hover:bg-[#eae6da]/40'}`}
              >
                <span
                  className={`font-bestseller-display italic text-[20px] sm:text-[22px] font-medium shrink-0 leading-none transition-colors duration-300 ${
                    isSideOpen ? '' : 'lg:text-[24px] lg:w-9'
                  } ${
                    isSelected
                      ? 'text-secondary-dark'
                      : 'text-primary/40 group-hover:text-primary/75'
                  }`}
                >
                  {book.rank}
                </span>
                {!isSideOpen && (
                  <>
                    <div className="hidden lg:block min-w-0 flex-1">
                      <p
                        className={`font-hero-sans text-[15px] font-semibold truncate transition-colors duration-300 ${
                          isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                        }`}
                      >
                        {book.title}
                      </p>
                      <p className="font-hero-sans text-xs text-on-surface-variant truncate">
                        {book.author}
                      </p>
                    </div>
                    <span className="hidden lg:inline-flex items-center gap-1 shrink-0 font-hero-sans text-xs font-semibold text-on-surface-variant tabular-nums">
                      <Star size={12} className="fill-[#d9973b] text-[#d9973b]" aria-hidden="true" />
                      {book.rate.toFixed(1)}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Vista previa editorial con dimensiones fijas y transición suave entre posiciones */}
        <div
          role="tabpanel"
          className={`h-[495px] sm:h-[535px] overflow-hidden ${
            isSideOpen
              ? 'rounded-2xl bg-[#eae6da]/60 border border-[#d6d0c0]/70'
              : 'lg:h-[400px] lg:rounded-2xl lg:bg-[#eae6da]/75 lg:border lg:border-[#d6d0c0]/80 lg:p-8'
          }`}
        >
          {/* Vista compacta / responsive: Slide horizontal direccional sincronizado con los números 01–05 */}
          <div className={`${isSideOpen ? '' : 'lg:hidden'} h-full overflow-hidden`}>
            <div
              className="flex h-full"
              style={{
                transform: `translate3d(-${selectedIdx * 100}%, 0, 0)`,
                transition: 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {books.map((book, idx) => {
                const isCurrent = idx === selectedIdx
                const bookHref = book.bookId
                  ? `/books/${book.bookId}`
                  : `/catalog?q=${encodeURIComponent(book.query)}`

                return (
                  <div
                    key={book.rank}
                    aria-hidden={!isCurrent}
                    className="w-full h-full shrink-0 px-2 py-4 sm:px-4 sm:py-5 flex flex-col items-center justify-between text-center"
                  >
                    <div className="w-full flex flex-col items-center">
                      <div className="w-[136px] sm:w-[152px] shrink-0">
                        <BookCoverFrame book={book} />
                      </div>

                      <div className="mt-4 w-full flex flex-col items-center">
                        <h3 className="font-bestseller-display text-[24px] sm:text-[28px] font-semibold leading-[1.12] tracking-[-0.015em] text-primary line-clamp-2 max-w-[20ch]">
                          {book.title}
                        </h3>

                        <p className="mt-1.5 font-hero-sans text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-secondary-dark">
                          Best Seller #{book.rank} · {book.genre}
                        </p>

                        <div className="mt-2 flex items-center justify-center gap-2 max-w-full px-2">
                          <span className="truncate font-hero-sans text-[13px] sm:text-sm font-medium text-on-surface-variant">
                            {book.author}
                          </span>
                          <span aria-hidden="true" className="text-outline-variant shrink-0">
                            ·
                          </span>
                          <span
                            className="inline-flex items-center gap-1 shrink-0"
                            aria-label={`Calificación ${book.rate.toFixed(1)} de 5`}
                          >
                            <Star
                              strokeWidth={1.75}
                              aria-hidden="true"
                              className="size-[13px] fill-[#d9973b] text-[#d9973b]"
                            />
                            <span className="font-hero-sans text-[13px] font-bold text-primary tabular-nums leading-none">
                              {book.rate.toFixed(1)}
                            </span>
                          </span>
                        </div>

                        <p className="mt-3 font-hero-sans text-[13px] sm:text-[13.5px] leading-relaxed text-on-surface-variant line-clamp-3 max-w-[44ch]">
                          {book.synopsis}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link
                        to={bookHref}
                        tabIndex={isCurrent ? 0 : -1}
                        className="group/btn inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-xs font-semibold shadow-[0_6px_16px_-4px_rgba(14,81,70,0.28)] transition-[background-color,scale] duration-150 active:scale-[0.97]"
                      >
                        <span>Descubrir este libro</span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2}
                          absoluteStrokeWidth
                          aria-hidden="true"
                          className="transition-transform duration-150 group-hover/btn:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop (lg+ sin side chat): Portada a la izquierda + ficha editorial a la derecha */}
          {!isSideOpen && (
            <div className="hidden lg:flex h-full flex-row items-center gap-8">
              <div
                key={`cover-${active.rank}`}
                className="w-[186px] shrink-0 bestseller-cover-in"
              >
                <BookCoverFrame book={active} />
              </div>

              <div
                key={`info-${active.rank}`}
                className="min-w-0 min-h-0 flex-1 h-full flex flex-col justify-between text-left py-1 bestseller-text-in"
              >
                <div className="min-w-0">
                  <span className="block truncate font-hero-sans text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-dark">
                    Best Seller #{active.rank} · {active.genre}
                  </span>
                  <h3 className="mt-2 font-bestseller-display text-[33px] font-semibold leading-[1.12] tracking-[-0.015em] text-primary line-clamp-2">
                    {active.title}
                  </h3>
                  <p className="mt-1.5 font-hero-sans text-sm font-medium text-on-surface-variant truncate">
                    {active.author}
                  </p>
                  <div className="mt-2.5 flex justify-start">
                    <StarRow rate={active.rate} />
                  </div>
                  <p className="mt-3.5 font-hero-sans text-[14px] leading-relaxed text-on-surface-variant line-clamp-4">
                    {active.synopsis}
                  </p>
                </div>

                <div className="pt-4">
                  <Link
                    to={activeHref}
                    className="group/btn inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-xs font-semibold shadow-[0_6px_16px_-4px_rgba(14,81,70,0.28)] transition-[background-color,scale] duration-150 active:scale-[0.97]"
                  >
                    <span>Descubrir este libro</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="transition-transform duration-150 group-hover/btn:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
