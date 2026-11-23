import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BookCard from './BookCard'

const ITEMS_PER_SLIDE = 5
const MOBILE_REVEAL_COUNT = 4
const CARD_REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const CARD_REVEAL_DURATION = '640ms'
const DESKTOP_STAGGER_BASE_MS = 110
const MOBILE_STAGGER_BASE_MS = 100
const STAGGER_STEP_MS = 65
const ARROW_REVEAL_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

function getCardRevealStyle(revealed, delayMs) {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed
      ? 'translate3d(0, 0, 0) scale(1)'
      : 'translate3d(0, 18px, 0) scale(0.97)',
    filter: revealed ? 'blur(0px)' : 'blur(3px)',
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: CARD_REVEAL_DURATION,
    transitionTimingFunction: CARD_REVEAL_EASE,
    transitionDelay: revealed ? `${delayMs}ms` : '0ms',
  }
}

export default function BookRowSlider({ books = [], loading = false, revealed = true }) {
  const [slideIndex, setSlideIndex] = useState(0)
  const scrollRef = useRef(null)
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, dragged: false })

  const handleMouseDown = (e) => {
    const el = scrollRef.current
    if (!el) return
    dragStateRef.current = {
      active: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      dragged: false,
    }
  }

  const handleMouseMove = (e) => {
    const state = dragStateRef.current
    const el = scrollRef.current
    if (!state.active || !el) return
    const delta = e.pageX - state.startX
    if (Math.abs(delta) > 5) state.dragged = true
    el.scrollLeft = state.startScrollLeft - delta
  }

  const handleMouseUpOrLeave = () => {
    dragStateRef.current.active = false
  }

  const handleClickCapture = (e) => {
    if (dragStateRef.current.dragged) {
      e.preventDefault()
      e.stopPropagation()
      dragStateRef.current.dragged = false
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-6 gap-y-8">
        {Array.from({ length: ITEMS_PER_SLIDE }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded-[6px] bg-[#eae6da]/75" />
            <div className="mt-3 h-4 w-4/5 rounded bg-[#eae6da]/75" />
            <div className="mt-1.5 h-3 w-3/5 rounded bg-[#eae6da]/55" />
            <div className="mt-2 h-3 w-20 rounded bg-[#eae6da]/55" />
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) return null

  // Desktop (lg+): dividir en páginas de 5 (ej. 10 libros -> 2 páginas de 5)
  const pages = []
  for (let i = 0; i < books.length; i += ITEMS_PER_SLIDE) {
    pages.push(books.slice(i, i + ITEMS_PER_SLIDE))
  }

  const totalPages = pages.length
  const safeSlide = Math.min(slideIndex, Math.max(0, totalPages - 1))
  const canPrev = safeSlide > 0
  const canNext = safeSlide < totalPages - 1

  return (
    <div className="relative">
      {/* Responsive (< lg): Slide libre con 3 libros completos + el 4.º recortado a la mitad */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className="flex overflow-x-auto hide-scrollbar gap-4 sm:gap-5 -mx-3 px-3 md:-mx-6 md:px-6 pt-2 pb-5 -mb-2 cursor-grab active:cursor-grabbing select-none"
        >
          {books.map((book, idx) => (
            <div
              key={book.id}
              className="shrink-0 w-[calc((100%-48px)/3.45)] sm:w-[calc((100%-60px)/3.45)]"
            >
              <div
                style={
                  idx < MOBILE_REVEAL_COUNT
                    ? getCardRevealStyle(revealed, MOBILE_STAGGER_BASE_MS + idx * STAGGER_STEP_MS)
                    : undefined
                }
              >
                <BookCard book={book} showRating={true} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop (lg+): Slide horizontal de a 5 libros con flechas laterales flotantes */}
      <div className="hidden lg:block relative">
        <div className="overflow-hidden -mx-3 px-3 -my-5 py-5">
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(-${safeSlide * 100}%, 0, 0)`,
              transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {pages.map((pageBooks, pageIdx) => (
              <div
                key={pageIdx}
                aria-hidden={pageIdx !== safeSlide}
                className="w-full shrink-0 px-3"
              >
                <div className="grid grid-cols-5 gap-x-5 lg:gap-x-6">
                  {pageBooks.map((book, bookIdx) => (
                    <div
                      key={book.id}
                      style={
                        pageIdx === 0
                          ? getCardRevealStyle(
                              revealed,
                              DESKTOP_STAGGER_BASE_MS + bookIdx * STAGGER_STEP_MS
                            )
                          : undefined
                      }
                    >
                      <BookCard book={book} showRating={true} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flechas flotantes laterales (fade-in independiente al revelar la sección para no afectar los toggles normales) */}
        {totalPages > 1 && (
          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              opacity: revealed ? 1 : 0,
              transitionProperty: 'opacity',
              transitionDuration: '420ms',
              transitionTimingFunction: ARROW_REVEAL_EASE,
              transitionDelay: revealed ? '320ms' : '0ms',
            }}
          >
            {/* Flecha flotante izquierda (dentro del margen de 48px para no desbordar el DOM) */}
            <button
              type="button"
              onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={!canPrev || !revealed}
              aria-label="Ver 5 libros anteriores"
              style={{ borderRadius: '9999px' }}
              className={`absolute -left-10 lg:-left-11 top-[38%] -translate-y-1/2 size-10 lg:size-11 flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                canPrev
                  ? revealed
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-100 pointer-events-none'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronLeft size={20} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            </button>

            {/* Flecha flotante derecha (dentro del margen de 48px para no desbordar el DOM) */}
            <button
              type="button"
              onClick={() => setSlideIndex((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={!canNext || !revealed}
              aria-label="Ver siguientes 5 libros"
              style={{ borderRadius: '9999px' }}
              className={`absolute -right-10 lg:-right-11 top-[38%] -translate-y-1/2 size-10 lg:size-11 flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                canNext
                  ? revealed
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-100 pointer-events-none'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <ChevronRight size={20} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
