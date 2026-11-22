import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BookCard from './BookCard'

const ITEMS_PER_SLIDE = 5

export default function BookRowSlider({ books = [], loading = false }) {
  const [slideIndex, setSlideIndex] = useState(0)

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-5 gap-y-9 sm:gap-x-6">
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

  // Dividir los libros en páginas de 5 (ej. 10 libros -> 2 páginas de 5)
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
      {/* Móvil: carrusel táctil horizontal básico */}
      <div className="flex md:hidden overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 pb-3 -mx-6 px-6">
        {books.map((book) => (
          <div key={book.id} className="min-w-[152px] w-[152px] shrink-0 snap-start">
            <BookCard book={book} showRating={true} />
          </div>
        ))}
      </div>

      {/* Desktop (md+): Slide horizontal de a 5 libros con flechas laterales flotantes */}
      <div className="hidden md:block relative">
        <div className="overflow-hidden -mx-3 px-3 -my-3 py-3">
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
                  {pageBooks.map((book) => (
                    <div key={book.id}>
                      <BookCard book={book} showRating={true} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha flotante izquierda (dentro del margen de 48px para no desbordar el DOM) */}
        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => Math.max(0, prev - 1))}
            disabled={!canPrev}
            aria-label="Ver 5 libros anteriores"
            style={{ borderRadius: '9999px' }}
            className={`absolute -left-10 lg:-left-11 top-[38%] -translate-y-1/2 z-20 size-10 lg:size-11 flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              canPrev
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronLeft size={20} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        )}

        {/* Flecha flotante derecha (dentro del margen de 48px para no desbordar el DOM) */}
        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={!canNext}
            aria-label="Ver siguientes 5 libros"
            style={{ borderRadius: '9999px' }}
            className={`absolute -right-10 lg:-right-11 top-[38%] -translate-y-1/2 z-20 size-10 lg:size-11 flex items-center justify-center bg-white border border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary shadow-[0_8px_22px_-4px_rgba(14,81,70,0.18),0_2px_6px_rgba(14,81,70,0.08)] hover:shadow-[0_12px_28px_-4px_rgba(14,81,70,0.28)] transition-[opacity,color,background-color,border-color,box-shadow,scale] duration-200 ease-out active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              canNext
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight size={20} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
