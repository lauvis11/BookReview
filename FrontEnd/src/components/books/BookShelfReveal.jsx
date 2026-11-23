import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import BookRowSlider from './BookRowSlider'

// Animate UI ease.out token: cubic-bezier(0.23, 1, 0.32, 1)
const HEADER_REVEAL_EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'
const HEADER_REVEAL_DURATION = '540ms'

export default function BookShelfReveal({
  title,
  accent,
  subtitle,
  ctaTo = '/catalog',
  ctaLabel = 'Ver catálogo',
  books = [],
  loading = false,
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
          transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
          filter: isVisible ? 'blur(0px)' : 'blur(2px)',
          transitionProperty: 'opacity, transform, filter',
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
          className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
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
      <BookRowSlider books={books} loading={loading} revealed={isVisible} />
    </section>
  )
}
