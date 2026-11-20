import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const STATS = [
  { value: '1K+', label: 'Libros' },
  { value: '10K+', label: 'Lectores' },
  { value: '35K+', label: 'Reseñas' },
]

export default function SeccionAbout() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')

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
      { threshold: 0.32 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const revealUp = (delayMs) => ({
    style: {
      transitionDelay: `${delayMs}ms`,
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    className: `transition-[opacity,transform] duration-1000 ${
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
          className={`flex items-center justify-center transition-[opacity,transform] duration-1000 ${
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

        {/* Columna Derecha: Titular, descripción, acciones y métricas */}
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
                className="inline-flex items-center justify-center h-11 px-6 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-sm font-semibold shadow-[0_6px_18px_-4px_rgba(14,81,70,0.28)] hover:shadow-[0_10px_24px_-4px_rgba(14,81,70,0.34)] transition-[background-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Explorar libros
              </Link>

              <Link
                to="/library"
                className="inline-flex items-center justify-center h-11 px-6 rounded-[10px] bg-transparent border border-primary/40 hover:border-primary hover:bg-primary/[0.05] text-primary font-hero-sans text-sm font-semibold transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Mis guardados
              </Link>
            </div>
          </div>

          {/* Métricas de la plataforma */}
          <div {...revealUp(520)}>
            <dl className="mt-10 grid grid-cols-3 gap-6 sm:gap-10 max-w-[440px] mx-auto lg:mx-0">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-hero-sans text-2xl sm:text-[32px] font-bold tracking-tight text-primary tabular-nums leading-none">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 font-hero-sans text-xs sm:text-sm font-medium text-on-surface-variant">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
