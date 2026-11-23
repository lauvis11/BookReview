import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
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
      className="inline-flex items-center gap-1.5"
      aria-label={`Calificación ${rate.toFixed(1)} de 5`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={13}
            strokeWidth={1.75}
            aria-hidden="true"
            className={
              n <= filled
                ? 'fill-[#d9973b] text-[#d9973b]'
                : 'fill-outline-variant/40 text-outline-variant/40'
            }
          />
        ))}
      </div>
      <span className="font-hero-sans text-xs font-semibold tabular-nums text-on-surface-variant">
        {rate.toFixed(1)}
      </span>
    </div>
  )
}

export default function BestSellersSection({ books = BEST_SELLERS }) {
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
        transitionDelay: '90ms',
        transitionDuration: '850ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`mb-16 md:mb-20 transition-[opacity,translate] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
        <h2
          id="bestsellers-section-title"
          className="font-bestseller-display text-[32px] sm:text-[38px] md:text-[42px] font-semibold tracking-[-0.02em] text-primary leading-none"
        >
          Los{' '}
          <span className="italic font-medium text-secondary-dark">“Best Sellers”</span>
        </h2>

        <Link
          to="/catalog"
          className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
        >
          <span>Explorar catálogo</span>
          <ArrowRight
            size={14}
            strokeWidth={2}
            absoluteStrokeWidth
            aria-hidden="true"
            className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6 lg:gap-10 items-stretch">
        {/* Lista numerada 01–05 con focus deslizante */}
        <div
          role="tablist"
          aria-label="Lista de Best Sellers"
          className="relative flex flex-col lg:h-[400px] border-y border-outline-variant/45 overflow-hidden"
        >
          {/* Indicador de focus deslizante que acompaña la posición activa */}
          <div
            aria-hidden="true"
            style={{
              height: `${100 / books.length}%`,
              transform: `translate3d(0, ${selectedIdx * 100}%, 0)`,
              transition: 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-[#eae6da]/90"
          >
            <span
              className="absolute left-0 inset-y-2.5 w-[3px] bg-primary"
              style={{ borderRadius: '0 9999px 9999px 0' }}
            />
          </div>

          {books.map((book, idx) => {
            const isSelected = idx === selectedIdx
            return (
              <button
                key={book.rank}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelect(idx)}
                className={`group relative z-10 w-full h-[72px] lg:h-auto lg:flex-1 flex items-center gap-4 px-4 text-left border-b border-outline-variant/45 last:border-b-0 transition-colors duration-200 cursor-pointer ${
                  isSelected ? 'bg-transparent' : 'hover:bg-[#eae6da]/40'
                }`}
              >
                <span
                  className={`font-bestseller-display italic text-[24px] font-medium w-9 shrink-0 leading-none transition-colors duration-300 ${
                    isSelected
                      ? 'text-secondary-dark'
                      : 'text-primary/40 group-hover:text-primary/75'
                  }`}
                >
                  {book.rank}
                </span>
                <div className="min-w-0 flex-1">
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
                <span className="inline-flex items-center gap-1 shrink-0 font-hero-sans text-xs font-semibold text-on-surface-variant tabular-nums">
                  <Star size={12} className="fill-[#d9973b] text-[#d9973b]" aria-hidden="true" />
                  {book.rate.toFixed(1)}
                </span>
              </button>
            )
          })}
        </div>

        {/* Vista previa editorial con dimensiones fijas y transición suave entre posiciones */}
        <div
          role="tabpanel"
          className="h-[590px] sm:h-[400px] rounded-2xl bg-[#eae6da]/75 border border-[#d6d0c0]/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 overflow-hidden"
        >
          <div key={`cover-${active.rank}`} className="w-[155px] sm:w-[186px] shrink-0 bestseller-cover-in">
            <BookCoverFrame book={active} />
          </div>

          <div
            key={`info-${active.rank}`}
            className="min-w-0 min-h-0 flex-1 w-full sm:h-full flex flex-col justify-between text-center sm:text-left py-1 bestseller-text-in"
          >
            <div>
              <span className="font-hero-sans text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-dark">
                Best Seller #{active.rank} · {active.genre}
              </span>
              <h3 className="mt-2 font-bestseller-display text-[26px] sm:text-[31px] lg:text-[33px] font-semibold leading-[1.12] tracking-[-0.015em] text-primary line-clamp-2">
                {active.title}
              </h3>
              <p className="mt-1.5 font-hero-sans text-sm font-medium text-on-surface-variant truncate">
                {active.author}
              </p>
              <div className="mt-2.5 flex justify-center sm:justify-start">
                <StarRow rate={active.rate} />
              </div>
              <p className="mt-3.5 font-hero-sans text-[13.5px] sm:text-[14px] leading-relaxed text-on-surface-variant line-clamp-4">
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
      </div>
    </section>
  )
}
