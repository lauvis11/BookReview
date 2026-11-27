import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

export default function BookCard({ book, showRating = false }) {
  const authorLabel = Array.isArray(book.author)
    ? book.author.join(', ')
    : book.author || 'Autor desconocido'

  const numericRate = Number(book.rate) || 0

  return (
    <Link to={`/books/${book.id}`} className="group block cursor-pointer focus-visible:outline-none">
      {/* Portada limpia 2:3 con elevación editorial suave */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[6px] bg-[#eae6da]/70 dark:bg-surface-container-low ring-1 ring-black/[0.06] dark:ring-white/10 shadow-[0_6px_18px_-4px_rgba(24,51,47,0.14),0_2px_6px_rgba(24,51,47,0.06)] dark:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.62),0_2px_8px_rgba(0,0,0,0.35)] transition-[translate,transform,box-shadow] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_16px_30px_-6px_rgba(14,81,70,0.24),0_4px_12px_rgba(24,51,47,0.08)] dark:group-hover:shadow-[0_18px_34px_-6px_rgba(0,0,0,0.75),0_4px_14px_rgba(0,0,0,0.45)] group-focus-visible:ring-2 group-focus-visible:ring-primary dark:group-focus-visible:ring-secondary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface">
        {book.img ? (
          <img
            className="h-full w-full object-cover"
            src={book.img}
            alt={`Portada de ${book.title}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#eae6da] dark:bg-surface-container font-hero-display text-3xl text-primary/35 dark:text-on-surface-variant/45">
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
          className="font-hero-sans text-[13px] sm:text-[14px] lg:text-[15px] font-semibold text-primary dark:text-[#e8e3d6] leading-snug line-clamp-3 transition-colors duration-150 group-hover:text-secondary-dark"
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

        {/* Rating compacto: 1 estrella + número destacado */}
        {showRating && (
          <div
            className="mt-1.5 inline-flex items-center gap-1"
            aria-label={
              numericRate > 0
                ? `Calificación ${numericRate.toFixed(1)} de 5 estrellas`
                : 'Sin calificaciones todavía'
            }
          >
            <Star
              strokeWidth={1.75}
              aria-hidden="true"
              className={`size-[13px] lg:size-[14px] shrink-0 ${
                numericRate > 0
                  ? 'fill-[#d9973b] text-[#d9973b]'
                  : 'fill-[#e0dbd0] text-[#e0dbd0] dark:fill-outline-variant dark:text-outline-variant'
              }`}
            />
            <span
              className={`font-hero-sans text-[12.5px] lg:text-[13.5px] tabular-nums leading-none ${
                numericRate > 0
                  ? 'font-bold text-primary dark:text-[#e8e3d6]'
                  : 'font-semibold text-on-surface-variant/65'
              }`}
            >
              {numericRate.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
