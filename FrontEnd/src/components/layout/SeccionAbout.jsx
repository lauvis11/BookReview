import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { frases } from '../../utils/frases'

export default function SeccionAbout() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const [quote] = useState(() => frases[Math.floor(Math.random() * frases.length)])

  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const revealUp = (delayMs) => ({
    style: {
      transitionDelay: `${delayMs}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    className: `transition-[opacity,translate,transform] duration-1000 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
    }`,
  })

  return (
    <section
      ref={sectionRef}
      id="seccion-about"
      aria-labelledby="seccion-about-title"
      className="mt-14 md:mt-20 border-t border-outline-variant/50 pt-16 md:pt-24 pb-8 md:pb-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
        {/* Columna Izquierda: Ilustración de libros flotantes */}
        <div
          style={{
            transitionDelay: '160ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`flex items-center justify-center transition-[opacity,translate,scale,transform] duration-1000 ${
            visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-6 scale-[0.97]'
          }`}
        >
          <img
            src="/Libros-flotantes.png"
            alt="Libros destacados flotando con insignias de Best Seller y 4.8 de calificación"
            className="w-full max-w-[440px] lg:max-w-[500px] h-auto object-contain select-none drop-shadow-[0_22px_36px_rgba(14,81,70,0.14)]"
            loading="lazy"
          />
        </div>

        {/* Columna Derecha: Titular, descripción y acciones */}
        <div className="text-center lg:text-left">
          <div {...revealUp(220)}>
            <h2
              id="seccion-about-title"
              className="font-hero-display text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.03] tracking-[-0.02em] text-primary"
            >
              Descubre Tu Próximo
              <span className="block italic font-medium text-secondary-dark">
                Libro Favorito
              </span>
            </h2>
          </div>

          <div {...revealUp(320)}>
            <p className="mt-5 font-hero-sans text-[15px] sm:text-base leading-[1.7] text-on-surface-variant max-w-[480px] mx-auto lg:mx-0">
              Organiza tus lecturas, explora bestsellers y clásicos inolvidables, y descubre recomendaciones reales de nuestra comunidad de lectores.
            </p>
          </div>

          {/* Botones de acción (Primario sólido + Secundario delineado) */}
          <div {...revealUp(420)}>
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center h-11 px-6 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-sm font-semibold shadow-[0_6px_18px_-4px_rgba(14,81,70,0.28)] hover:shadow-[0_10px_24px_-4px_rgba(14,81,70,0.34)] transition-[background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Explorar libros
              </Link>

              <Link
                to="/library"
                className="inline-flex items-center justify-center h-11 px-6 rounded-[10px] bg-transparent border border-primary/40 hover:border-primary hover:bg-primary/[0.05] text-primary font-hero-sans text-sm font-semibold transition-[background-color,border-color,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Mis guardados
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Frase literaria centrada como epígrafe de cierre de About */}
      <div {...revealUp(520)}>
        <blockquote className="mt-14 md:mt-16 max-w-3xl mx-auto text-center px-2">
          <span
            aria-hidden="true"
            className="block mx-auto mb-4 h-[2px] w-12 bg-secondary-dark/65"
            style={{ borderRadius: '9999px' }}
          />
          <p className="font-hero-display italic font-semibold text-2xl sm:text-[28px] md:text-[34px] leading-[1.24] tracking-[-0.01em] text-primary text-balance">
            “{quote.frase}”
          </p>
          <cite className="mt-3.5 block font-hero-sans not-italic text-xs sm:text-[13px] uppercase tracking-[0.24em] text-secondary-dark font-bold">
            — {quote.autor} —
          </cite>
        </blockquote>
      </div>
    </section>
  )
}
