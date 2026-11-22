import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

export default function BookCard({ book, showRating = false }) {
  const authorLabel = Array.isArray(book.author)
    ? book.author.join(', ')
    : book.author || 'Autor desconocido'

  const numericRate = Number(book.rate) || 0
  const roundedStars = Math.round(numericRate)

  return (
    <Link to={`/books/${book.id}`} className="group block cursor-pointer focus-visible:outline-none">
      {/* Portada limpia 2:3 con elevación editorial suave */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#eae6da]/70 ring-1 ring-black/[0.06] shadow-[0_6px_18px_-4px_rgba(24,51,47,0.14),0_2px_6px_rgba(24,51,47,0.06)] transition-[translate,transform,box-shadow] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_30px_-6px_rgba(14,81,70,0.24),0_4px_12px_rgba(24,51,47,0.08)] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
        {book.img ? (
          <img
            className="h-full w-full object-cover"
            src={book.img}
            alt={`Portada de ${book.title}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#eae6da] font-hero-display text-3xl text-primary/35">
            📖
          </div>
        )}

        {/* Pliegue sutil del lomo izquierdo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[7px] bg-gradient-to-r from-black/18 via-white/15 to-transparent"
        />
      </div>

      {/* Información limpia debajo de la portada */}
      <div className="mt-2.5 sm:mt-3 px-0.5">
        <h3
          className="font-hero-sans text-[13px] sm:text-[14px] lg:text-[15px] font-semibold text-primary leading-snug line-clamp-3 transition-colors duration-150 group-hover:text-secondary-dark"
          title={book.title}
        >
          {book.title}
        </h3>

        <p
          className="mt-0.5 font-hero-sans text-[11.5px] sm:text-[12.5px] lg:text-[13px] font-normal text-on-surface-variant/85 line-clamp-1"
          title={authorLabel}
        >
          {authorLabel}
        </p>

        {/* Rating de estrellas — exclusivo del diseño de recomendaciones en Home */}
        {showRating && (
          <div
            className="mt-1.5"
            aria-label={
              numericRate > 0
                ? `Calificación ${numericRate.toFixed(1)} de 5 estrellas`
                : 'Sin calificaciones todavía'
            }
          >
            {/* Responsive (< lg): 1 estrella + número del rate para evitar choques */}
            <div className="flex lg:hidden items-center gap-1">
              <Star
                size={12.5}
                strokeWidth={1.75}
                aria-hidden="true"
                className={
                  numericRate > 0
                    ? 'fill-[#d9973b] text-[#d9973b]'
                    : 'fill-[#e0dbd0] text-[#e0dbd0]'
                }
              />
              <span className="font-hero-sans text-[12px] font-semibold text-on-surface-variant tabular-nums">
                {numericRate.toFixed(1)}
              </span>
            </div>

            {/* Desktop (lg+): 5 estrellas completas + número */}
            <div className="hidden lg:flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= roundedStars
                  return (
                    <Star
                      key={star}
                      size={12.5}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className={
                        isFilled
                          ? 'fill-[#d9973b] text-[#d9973b]'
                          : 'fill-[#e0dbd0] text-[#e0dbd0]'
                      }
                    />
                  )
                })}
              </div>
              {numericRate > 0 && (
                <span className="ml-1 font-hero-sans text-[11.5px] font-medium text-on-surface-variant/75 tabular-nums">
                  {numericRate.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
