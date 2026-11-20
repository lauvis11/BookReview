import { useState, useEffect } from 'react'

/**
 * Portadas SVG editoriales de prueba para el carrusel del Hero.
 * Cada libro acepta `imageUrl` opcional: cuando se agregue una URL o ruta en `/public`,
 * se renderiza la imagen real automáticamente en lugar del SVG de prueba.
 */
const SLIDES = [
  [
    {
      id: 'slide-1-left',
      title: 'Hábitos Atómicos',
      author: 'James Clear',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#fbf9f3" />
          <rect x="0" y="0" width="160" height="240" fill="none" stroke="#e8e2d5" strokeWidth="2" />
          <text x="80" y="26" textAnchor="middle" fill="#6b685f" fontSize="6" letterSpacing="1.3" fontFamily="Work Sans, sans-serif" fontWeight="600">
            BESTSELLER MUNDIAL
          </text>
          <text x="80" y="45" textAnchor="middle" fill="#1e2421" fontSize="8.5" fontFamily="Noto Serif, serif" fontWeight="700">
            Cambios pequeños,
          </text>
          <text x="80" y="57" textAnchor="middle" fill="#1e2421" fontSize="8.5" fontFamily="Noto Serif, serif" fontWeight="700">
            resultados extraordinarios
          </text>
          <text x="80" y="106" textAnchor="middle" fill="#c49449" fontSize="29" fontFamily="Noto Serif, serif" fontWeight="800" letterSpacing="-0.5">
            Hábitos
          </text>
          <text x="80" y="138" textAnchor="middle" fill="#c49449" fontSize="26" fontFamily="Noto Serif, serif" fontWeight="800" letterSpacing="-0.5">
            Atómicos
          </text>
          <line x1="46" y1="156" x2="114" y2="156" stroke="#d8cdb8" strokeWidth="1" />
          <circle cx="122" cy="176" r="14" fill="#d97736" />
          <text x="122" y="174" textAnchor="middle" fill="#fff" fontSize="5.2" fontFamily="Work Sans, sans-serif" fontWeight="700">
            +15M
          </text>
          <text x="122" y="182" textAnchor="middle" fill="#fff" fontSize="4.8" fontFamily="Work Sans, sans-serif">
            copias
          </text>
          <text x="80" y="216" textAnchor="middle" fill="#1d2320" fontSize="12" fontFamily="Noto Serif, serif" fontWeight="700">
            James Clear
          </text>
        </svg>
      ),
    },
    {
      id: 'slide-1-center',
      title: 'Ikigai',
      author: 'Héctor García & Francesc Miralles',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="ikigaiSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9cd1e3" />
              <stop offset="100%" stopColor="#7dbbd3" />
            </linearGradient>
          </defs>
          <rect width="160" height="240" fill="url(#ikigaiSky)" />
          {/* Rama floral superior */}
          <path d="M-4 32 Q36 28 66 52 T132 76" fill="none" stroke="#182b33" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M44 40 Q58 20 82 22" fill="none" stroke="#182b33" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M74 56 Q96 42 114 48" fill="none" stroke="#182b33" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="34" cy="28" r="6" fill="#f9f7f2" opacity="0.92" />
          <circle cx="56" cy="24" r="7" fill="#fffdf8" opacity="0.95" />
          <circle cx="76" cy="20" r="5" fill="#f9f7f2" opacity="0.88" />
          <circle cx="68" cy="48" r="6.5" fill="#fffdf8" opacity="0.95" />
          <circle cx="96" cy="44" r="6" fill="#f9f7f2" opacity="0.92" />
          <circle cx="112" cy="54" r="7" fill="#fffdf8" opacity="0.95" />
          <circle cx="128" cy="70" r="5.5" fill="#f9f7f2" opacity="0.9" />
          <circle cx="56" cy="24" r="1.6" fill="#d97736" />
          <circle cx="112" cy="54" r="1.6" fill="#d97736" />
          <circle cx="68" cy="48" r="1.4" fill="#d97736" />
          {/* Tipografía central */}
          <text x="80" y="138" textAnchor="middle" fill="#13252c" fontSize="22" letterSpacing="4.5" fontFamily="Noto Serif, serif" fontWeight="700">
            IKIGAI
          </text>
          <line x1="50" y1="150" x2="110" y2="150" stroke="#13252c" strokeOpacity="0.35" strokeWidth="1" />
          <text x="80" y="167" textAnchor="middle" fill="#163039" fontSize="7.5" fontStyle="italic" fontFamily="Noto Serif, serif">
            Los secretos de Japón
          </text>
          <text x="80" y="179" textAnchor="middle" fill="#163039" fontSize="7.5" fontStyle="italic" fontFamily="Noto Serif, serif">
            para una vida larga y feliz
          </text>
          <text x="80" y="218" textAnchor="middle" fill="#13252c" fontSize="6" letterSpacing="1" fontFamily="Work Sans, sans-serif" fontWeight="600">
            H. GARCÍA &amp; F. MIRALLES
          </text>
        </svg>
      ),
    },
    {
      id: 'slide-1-right',
      title: 'El Almanaque de Naval',
      author: 'Eric Jorgenson',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#ffffff" />
          <rect x="0" y="0" width="160" height="240" fill="none" stroke="#e5e3dc" strokeWidth="2" />
          <text x="136" y="26" textAnchor="end" fill="#7c7a74" fontSize="5.2" letterSpacing="1.2" fontFamily="Work Sans, sans-serif" fontWeight="600">
            PRÓLOGO DE TIM FERRISS
          </text>
          <text x="26" y="72" fill="#2b2d2a" fontSize="11" letterSpacing="2" fontFamily="Work Sans, sans-serif" fontWeight="400">
            EL
          </text>
          <text x="26" y="92" fill="#2b2d2a" fontSize="13.5" letterSpacing="2" fontFamily="Work Sans, sans-serif" fontWeight="500">
            ALMANAQUE
          </text>
          <text x="26" y="110" fill="#5e615c" fontSize="10" letterSpacing="2.2" fontFamily="Work Sans, sans-serif" fontWeight="400">
            DE
          </text>
          <rect x="26" y="122" width="2.4" height="38" fill="#1c1f1d" />
          <text x="36" y="138" fill="#161917" fontSize="15.5" letterSpacing="1.8" fontFamily="Work Sans, sans-serif" fontWeight="700">
            NAVAL
          </text>
          <text x="36" y="157" fill="#161917" fontSize="14.5" letterSpacing="1.5" fontFamily="Work Sans, sans-serif" fontWeight="700">
            RAVIKANT
          </text>
          <line x1="26" y1="196" x2="134" y2="196" stroke="#e5e2da" strokeWidth="1" />
          <text x="134" y="213" textAnchor="end" fill="#555853" fontSize="6.5" letterSpacing="1.4" fontFamily="Work Sans, sans-serif" fontWeight="600">
            ERIC JORGENSON
          </text>
        </svg>
      ),
    },
  ],
  [
    {
      id: 'slide-2-left',
      title: 'Cien Años de Soledad',
      author: 'Gabriel García Márquez',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#f4ede0" />
          <rect x="12" y="12" width="136" height="216" fill="none" stroke="#c79e55" strokeWidth="1" />
          <text x="80" y="42" textAnchor="middle" fill="#6b5c43" fontSize="6" letterSpacing="1.6" fontFamily="Work Sans, sans-serif" fontWeight="600">
            EDICIÓN CONMEMORATIVA
          </text>
          <text x="80" y="76" textAnchor="middle" fill="#18332f" fontSize="19" fontFamily="Noto Serif, serif" fontWeight="800">
            Cien Años
          </text>
          <text x="80" y="99" textAnchor="middle" fill="#18332f" fontSize="16" fontStyle="italic" fontFamily="Noto Serif, serif" fontWeight="600">
            de Soledad
          </text>
          {/* Emblema botánico dorado */}
          <circle cx="80" cy="148" r="24" fill="#0e5146" />
          <path d="M80 132 C87 140 87 156 80 164 C73 156 73 140 80 132 Z" fill="#edbd79" />
          <path d="M64 148 C72 141 88 141 96 148 C88 155 72 155 64 148 Z" fill="#edbd79" opacity="0.65" />
          <text x="80" y="206" textAnchor="middle" fill="#18332f" fontSize="8" letterSpacing="0.8" fontFamily="Work Sans, sans-serif" fontWeight="600">
            G. GARCÍA MÁRQUEZ
          </text>
        </svg>
      ),
    },
    {
      id: 'slide-2-center',
      title: 'El Nombre del Viento',
      author: 'Patrick Rothfuss',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="windNight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#122d2b" />
              <stop offset="100%" stopColor="#091a19" />
            </linearGradient>
          </defs>
          <rect width="160" height="240" fill="url(#windNight)" />
          <circle cx="80" cy="126" r="38" fill="#edbd79" opacity="0.14" />
          <path d="M32 146 Q80 112 128 134" fill="none" stroke="#edbd79" strokeWidth="1.4" opacity="0.7" />
          <path d="M22 158 Q80 126 138 148" fill="none" stroke="#d6e8b5" strokeWidth="1" opacity="0.45" />
          <text x="80" y="42" textAnchor="middle" fill="#edbd79" fontSize="6" letterSpacing="2" fontFamily="Work Sans, sans-serif" fontWeight="600">
            CRÓNICA DEL ASESINO DE REYES
          </text>
          <text x="80" y="76" textAnchor="middle" fill="#f8f7f2" fontSize="17" fontFamily="Noto Serif, serif" fontWeight="700">
            El Nombre
          </text>
          <text x="80" y="99" textAnchor="middle" fill="#edbd79" fontSize="19" fontStyle="italic" fontFamily="Noto Serif, serif" fontWeight="700">
            del Viento
          </text>
          <text x="80" y="212" textAnchor="middle" fill="#cee1dc" fontSize="8.5" letterSpacing="1.6" fontFamily="Work Sans, sans-serif" fontWeight="600">
            PATRICK ROTHFUSS
          </text>
        </svg>
      ),
    },
    {
      id: 'slide-2-right',
      title: 'Ficciones',
      author: 'Jorge Luis Borges',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#faf7f0" />
          <rect x="0" y="0" width="160" height="58" fill="#b85a3a" />
          <text x="20" y="38" fill="#faf7f0" fontSize="22" fontFamily="Noto Serif, serif" fontWeight="800" letterSpacing="0.5">
            Ficciones
          </text>
          {/* Laberinto geométrico minimalista */}
          <g stroke="#18332f" strokeWidth="1.6" fill="none" opacity="0.82">
            <rect x="34" y="84" width="92" height="92" />
            <rect x="48" y="98" width="64" height="64" />
            <rect x="62" y="112" width="36" height="36" />
            <line x1="80" y1="84" x2="80" y2="98" />
            <line x1="112" y1="130" x2="126" y2="130" />
            <line x1="62" y1="130" x2="48" y2="130" />
          </g>
          <text x="80" y="212" textAnchor="middle" fill="#18332f" fontSize="8.5" letterSpacing="1.4" fontFamily="Work Sans, sans-serif" fontWeight="700">
            JORGE LUIS BORGES
          </text>
        </svg>
      ),
    },
  ],
  [
    {
      id: 'slide-3-left',
      title: 'La Psicología del Dinero',
      author: 'Morgan Housel',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#ffffff" />
          <rect x="0" y="0" width="160" height="240" fill="none" stroke="#e4e2dc" strokeWidth="2" />
          <text x="80" y="42" textAnchor="middle" fill="#4f5653" fontSize="8.5" letterSpacing="1.2" fontFamily="Work Sans, sans-serif" fontWeight="500">
            LA PSICOLOGÍA DEL
          </text>
          <text x="80" y="72" textAnchor="middle" fill="#162925" fontSize="25" fontFamily="Noto Serif, serif" fontWeight="800">
            Dinero
          </text>
          {/* Ilustración geométrica minimalista */}
          <circle cx="80" cy="134" r="32" fill="none" stroke="#162925" strokeWidth="1.5" />
          <circle cx="80" cy="134" r="22" fill="#edbd79" opacity="0.32" />
          <path d="M56 146 L72 130 L84 139 L104 118" fill="none" stroke="#0e5146" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="80" y="196" textAnchor="middle" fill="#636b67" fontSize="6.2" letterSpacing="0.8" fontFamily="Work Sans, sans-serif">
            18 CLAVES IMPERECEDERAS
          </text>
          <text x="80" y="216" textAnchor="middle" fill="#162925" fontSize="9.5" letterSpacing="1.2" fontFamily="Work Sans, sans-serif" fontWeight="700">
            MORGAN HOUSEL
          </text>
        </svg>
      ),
    },
    {
      id: 'slide-3-center',
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <rect width="160" height="240" fill="#f7f4ec" />
          <rect x="0" y="138" width="160" height="102" fill="#c74b34" />
          <text x="80" y="42" textAnchor="middle" fill="#5e574e" fontSize="6.5" letterSpacing="1.6" fontFamily="Work Sans, sans-serif" fontWeight="600">
            YUVAL NOAH HARARI
          </text>
          <text x="80" y="88" textAnchor="middle" fill="#1e1b18" fontSize="29" fontFamily="Noto Serif, serif" fontWeight="800">
            Sapiens
          </text>
          <text x="80" y="112" textAnchor="middle" fill="#5e574e" fontSize="7.2" fontFamily="Work Sans, sans-serif">
            De animales a dioses
          </text>
          {/* Huella abstracta minimalista */}
          <ellipse cx="80" cy="186" rx="18" ry="26" fill="none" stroke="#faf7f0" strokeWidth="1.5" strokeDasharray="4 3" />
          <ellipse cx="80" cy="186" rx="10" ry="16" fill="none" stroke="#faf7f0" strokeWidth="1.3" strokeDasharray="3 2.5" />
          <ellipse cx="80" cy="186" rx="3.5" ry="7" fill="#faf7f0" opacity="0.85" />
        </svg>
      ),
    },
    {
      id: 'slide-3-right',
      title: 'Dune',
      author: 'Frank Herbert',
      imageUrl: null,
      renderCover: () => (
        <svg viewBox="0 0 160 240" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="duneSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#261c16" />
              <stop offset="55%" stopColor="#8f4c24" />
              <stop offset="100%" stopColor="#d9944a" />
            </linearGradient>
          </defs>
          <rect width="160" height="240" fill="url(#duneSky)" />
          <circle cx="80" cy="116" r="28" fill="#f7dca4" opacity="0.92" />
          <path d="M0 168 Q45 142 96 164 T160 156 L160 240 L0 240 Z" fill="#3a2113" />
          <path d="M0 192 Q64 170 160 198 L160 240 L0 240 Z" fill="#1e120b" />
          <text x="80" y="62" textAnchor="middle" fill="#f8ecd1" fontSize="30" letterSpacing="7" fontFamily="Noto Serif, serif" fontWeight="700">
            DUNE
          </text>
          <text x="80" y="218" textAnchor="middle" fill="#edbd79" fontSize="8" letterSpacing="2" fontFamily="Work Sans, sans-serif" fontWeight="600">
            FRANK HERBERT
          </text>
        </svg>
      ),
    },
  ],
]

const ARCH_STYLES = [
  // Arco izquierdo: semicírculo perfecto arriba, base recta abajo
  { borderRadius: '9999px 9999px 0 0' },
  // Arco central: base recta arriba, semicírculo invertido perfecto abajo
  { borderRadius: '0 0 9999px 9999px' },
  // Arco derecho: semicírculo perfecto arriba, base recta abajo
  { borderRadius: '9999px 9999px 0 0' },
]

const AUTOPLAY_INTERVAL_MS = 3000

export default function HeroBookShowcase({ slides = SLIDES }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [hasFinishedAutoplay, setHasFinishedAutoplay] = useState(false)

  useEffect(() => {
    if (hasFinishedAutoplay || isPaused || slides.length <= 1) return

    const timer = setTimeout(() => {
      if (activeSlide < slides.length - 1) {
        setActiveSlide((prev) => prev + 1)
      } else {
        // Llegó a la última diapositiva: vuelve a la primera y finaliza el recorrido automático
        setActiveSlide(0)
        setHasFinishedAutoplay(true)
      }
    }, AUTOPLAY_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [activeSlide, hasFinishedAutoplay, isPaused, slides.length])

  const handleSelectSlide = (index) => {
    setHasFinishedAutoplay(true)
    if (index === activeSlide) return
    setActiveSlide(index)
  }

  return (
    <div
      className="relative w-full max-w-[780px] mx-auto lg:ml-auto lg:mr-0 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Portadas destacadas"
    >
      {/* Viewport con margen de respiro para sombras sin alterar el alto ni la alineación */}
      <div className="overflow-hidden -mx-3 -my-5 py-5">
        <div
          className="flex will-change-transform"
          style={{
            transform: `translate3d(-${activeSlide * 100}%, 0, 0)`,
            transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {slides.map((slideBooks, slideIdx) => (
            <div
              key={slideIdx}
              aria-hidden={slideIdx !== activeSlide}
              className="w-full shrink-0 px-3"
            >
              {/* 3 arcos decorativos alternados (∩ ∪ ∩) con presencia editorial ampliada */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 items-stretch">
                {slideBooks.map((book, idx) => (
                  <div
                    key={book.id}
                    style={ARCH_STYLES[idx]}
                    className="relative aspect-[172/244] bg-[#eae6da] shadow-[0_12px_28px_-12px_rgba(60,52,36,0.14)] flex items-center justify-center"
                  >
                    {/* Portada del libro centrada dentro del arco (54% ancho, 2:3) */}
                    <div
                      className="relative w-[54%] aspect-[2/3] rounded-[2px] overflow-hidden shadow-[0_14px_24px_-4px_rgba(32,28,20,0.24),0_4px_10px_-2px_rgba(32,28,20,0.12)] ring-1 ring-black/[0.06]"
                      title={`${book.title} — ${book.author}`}
                    >
                      {book.imageUrl ? (
                        <img
                          src={book.imageUrl}
                          alt={`Portada de ${book.title} por ${book.author}`}
                          className="h-full w-full object-cover"
                          loading="eager"
                        />
                      ) : (
                        book.renderCover()
                      )}

                      {/* Pliegue sutil del lomo izquierdo para realismo editorial */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-[6px] bg-gradient-to-r from-black/14 via-white/20 to-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 puntos indicadores del carrusel: en desktop flotan debajo sin desplazar la base de los arcos */}
      <div
        className="mt-4 lg:mt-0 lg:absolute lg:inset-x-0 lg:top-full lg:pt-4 flex items-center justify-center gap-1"
        role="tablist"
        aria-label="Seleccionar grupo de portadas"
      >
        {slides.map((_, index) => {
          const isActive = index === activeSlide
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Ver grupo de libros ${index + 1}`}
              onClick={() => handleSelectSlide(index)}
              className="group p-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-dark rounded-full [-webkit-tap-highlight-color:transparent]"
            >
              <span
                className={`block size-[7px] rounded-full transition-[background-color,transform] duration-200 ease-out ${
                  isActive
                    ? 'bg-[#b37e3c] scale-110'
                    : 'bg-[#d6d2c7] group-hover:bg-[#b8b3a6]'
                }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
