import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookX } from 'lucide-react'
import BookRowSlider from './BookRowSlider'

// Animate UI ease.out token: cubic-bezier(0.23, 1, 0.32, 1)
const HEADER_REVEAL_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const HEADER_REVEAL_DURATION = '440ms'

export default function BookShelfReveal({
  title,
  accent,
  subtitle,
  ctaTo = '/catalog',
  ctaLabel = 'Ver catálogo',
  books = [],
  loading = false,
  error = false,
  onRetry,
}) {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined')

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
      { threshold: 0.22 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="mb-16 md:mb-20">
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 12px, 0)',
          transitionProperty: 'opacity, transform',
          transitionDuration: HEADER_REVEAL_DURATION,
          transitionTimingFunction: HEADER_REVEAL_EASE,
        }}
      >
        <div>
          <h2 className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight">
            {title}
            {accent && (
              <>
                {' '}
                <span className="italic font-medium text-secondary-dark">{accent}</span>
              </>
            )}
          </h2>
          {subtitle && (
            <p className="mt-1 font-hero-sans text-sm text-on-surface-variant/85">
              {subtitle}
            </p>
          )}
        </div>
        <Link
          to={ctaTo}
          className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-[color] duration-150 ease-out cursor-pointer pb-0.5"
        >
          <span>{ctaLabel}</span>
          <ArrowRight
            size={14}
            strokeWidth={2}
            absoluteStrokeWidth
            aria-hidden="true"
            className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      {error && !loading ? (
        <div
          role="alert"
          className="rounded-2xl bg-[#eae6da]/55 border border-transparent shadow-[0_0_0_1px_oklch(0_0_0/0.06)] px-6 py-9 sm:py-11 flex flex-col items-center justify-center text-center"
        >
          <div
            className="flex items-center justify-center text-secondary-dark"
            aria-hidden="true"
          >
            <BookX size={26} strokeWidth={1.75} absoluteStrokeWidth />
          </div>

          <h3 className="mt-3 font-hero-display text-2xl sm:text-[26px] font-semibold text-primary leading-tight">
            No pudimos cargar estos libros
          </h3>

          <p className="mt-1.5 max-w-md font-hero-sans text-[13.5px] leading-relaxed text-on-surface-variant">
            Ocurrió un inconveniente al conectar con el catálogo.
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 group inline-flex items-center gap-2 h-9 ps-3.5 pe-4 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-xs font-semibold shadow-[0_6px_16px_-4px_rgba(14,81,70,0.24)] transition-[background-color,box-shadow,scale] duration-150 ease-out enabled:active:scale-[0.96] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-3.5 shrink-0 transition-transform duration-300 ease-out group-hover:rotate-45"
              >
                <path vectorEffect="non-scaling-stroke" d="M20.1 14.5A8.5 8.5 0 1 1 18 6" />
                <path vectorEffect="non-scaling-stroke" d="M18 2.3V6H14.3" />
              </svg>
              <span>Reintentar</span>
            </button>
          )}
        </div>
      ) : (
        <BookRowSlider books={books} loading={loading} revealed={isVisible} />
      )}
    </section>
  )
}
