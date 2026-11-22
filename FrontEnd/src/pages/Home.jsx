import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Compass, BookMarked, Clock, ChevronRight, ArrowRight } from 'lucide-react'
import { getBooks, getFeaturedBooks } from '../api/books'
import BookGrid from '../components/books/BookGrid'
import BookRowSlider from '../components/books/BookRowSlider'
import Hero from '../components/layout/Hero'
import GenresSection from '../components/layout/GenresSection'
import SeccionAbout from '../components/layout/SeccionAbout'
import { frases } from '../utils/frases'
import { useSEO } from '../hooks/useSEO'

const AI_PROMPTS = [
  {
    text: 'Recomendame un género nuevo para explorar',
    icon: Compass,
  },
  {
    text: '¿Cuáles son los clásicos imprescindibles?',
    icon: BookMarked,
  },
  {
    text: 'Busco un libro corto para leer hoy',
    icon: Clock,
  },
]


export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [recentBooks, setRecentBooks] = useState([])
  const [fantasyBooks, setFantasyBooks] = useState([])
  const [selfHelpBooks, setSelfHelpBooks] = useState([])
  const [quote] = useState(() => frases[Math.floor(Math.random() * frases.length)])
  const aiSectionRef = useRef(null)
  const [aiVisible, setAiVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = aiSectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAiVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useSEO({
    title: 'Inicio',
    description: 'BookReview: descubrí, calificá y discutí libros con una comunidad de lectores. Reseñas, catálogo, favoritos y un asistente de IA para tu próxima lectura.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'BookReview - Descubrí, Calificá y Discutí Libros',
      url: 'https://book-review-six-rho.vercel.app/',
      description: 'Plataforma de reseñas de libros con catálogo, sistema de favoritos y asistente de IA.',
      isPartOf: { '@type': 'WebSite', name: 'BookReview', url: 'https://book-review-six-rho.vercel.app/' },
    },
  })


  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featuredRes, recentRes, fantasyRes, selfHelpRes] = await Promise.all([
          getFeaturedBooks({ limit: 10 }),
          getBooks(),
          getBooks({ genre: 'FANTASY' }),
          getBooks({ genre: 'SELF-HELP' })
        ])
        setFeaturedBooks(Array.isArray(featuredRes.data) ? featuredRes.data.slice(0, 10) : [])
        setRecentBooks(recentRes.data.slice(-5).reverse())
        setFantasyBooks(fantasyRes.data.slice(0, 5))
        setSelfHelpBooks(selfHelpRes.data.slice(0, 5))
      } catch (err) {
        console.error(err)
      }
    }
    fetchHomeData()
  }, [])

  return (
    <main className="pb-16 md:pb-24 w-full min-h-screen flex flex-col">
      <Hero />
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12">
      {/* Bot Chat Suggestions — Editorial Strip integrada con Hero y Nav */}
      <section
        ref={aiSectionRef}
        className="mb-16 md:mb-20 border-y border-outline-variant/55 py-7 md:py-8"
      >
        <div
          style={{
            transitionDelay: '120ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 transition-[opacity,transform] duration-1000 ${
            aiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles
              size={18}
              strokeWidth={1.85}
              absoluteStrokeWidth
              aria-hidden="true"
              className="text-secondary-dark shrink-0"
            />
            <h2 className="font-hero-display text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] text-primary leading-tight">
              ¿No sabés qué leer?{' '}
              <span className="italic font-medium text-secondary-dark">Preguntale a Lib</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message: '' } }))}
            className="group self-start sm:self-auto inline-flex items-center gap-1.5 font-hero-sans text-xs font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer"
          >
            <span>Abrir asistente</span>
            <ArrowRight
              size={14}
              strokeWidth={2}
              absoluteStrokeWidth
              aria-hidden="true"
              className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {AI_PROMPTS.map((prompt, index) => {
            const PromptIcon = prompt.icon
            return (
              <div
                key={prompt.text}
                style={{
                  transitionDelay: `${220 + index * 100}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`transition-[opacity,transform] duration-1000 ${
                  aiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('open-ai-chat', { detail: { message: prompt.text } })
                    )
                  }
                  className="group w-full h-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-white/80 hover:bg-white border border-outline-variant/65 hover:border-primary/30 text-left shadow-[0_2px_10px_-4px_rgba(14,81,70,0.06)] hover:shadow-[0_10px_24px_-8px_rgba(14,81,70,0.12)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <PromptIcon
                    size={18}
                    strokeWidth={1.8}
                    absoluteStrokeWidth
                    aria-hidden="true"
                    className="shrink-0 text-primary/80 group-hover:text-secondary-dark transition-colors duration-200"
                  />
                  <span className="flex-1 font-hero-sans text-[13.5px] font-medium text-on-surface group-hover:text-primary leading-snug transition-colors">
                    {prompt.text}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.9}
                    absoluteStrokeWidth
                    aria-hidden="true"
                    className="shrink-0 text-outline group-hover:text-primary transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Destacados Section (10 libros: 5 visibles por pantalla + 5 al deslizar) */}
      {featuredBooks.length > 0 && (
        <section className="mb-16 md:mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
            <div>
              <h2 className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight">
                Libros{' '}
                <span className="italic font-medium text-secondary-dark">destacados</span>
              </h2>
              <p className="mt-1 font-hero-sans text-sm text-on-surface-variant/85">
                Las obras mejor valoradas y más elegidas por los lectores de la comunidad.
              </p>
            </div>
            <Link
              to="/catalog"
              className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
            >
              <span>Ver catálogo</span>
              <ArrowRight
                size={14}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <BookRowSlider books={featuredBooks} loading={false} />
        </section>
      )}

      {/* Géneros Section */}
      <GenresSection />

      {/* Novedades Section */}
      {recentBooks.length > 0 && (
        <section className="mb-16 md:mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
            <div>
              <h2 className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight">
                Agregados{' '}
                <span className="italic font-medium text-secondary-dark">recientemente</span>
              </h2>
              <p className="mt-1 font-hero-sans text-sm text-on-surface-variant/85">
                Las últimas incorporaciones que llegaron a nuestra colección.
              </p>
            </div>
            <Link
              to="/catalog"
              className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
            >
              <span>Ver catálogo</span>
              <ArrowRight
                size={14}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <BookGrid books={recentBooks} loading={false} horizontalOnMobile={true} variant="home" />
        </section>
      )}

      {/* Fantasía Section */}
      {fantasyBooks.length > 0 && (
        <section className="mb-16 md:mb-20 flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
            <div>
              <h2 className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight">
                Fantasía
              </h2>
              <p className="mt-1 font-hero-sans text-sm text-on-surface-variant/85">
                Mundos extraordinarios, magia y aventuras inolvidables.
              </p>
            </div>
            <Link
              to="/catalog?genre=FANTASY"
              className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
            >
              <span>Explorar género</span>
              <ArrowRight
                size={14}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <BookGrid books={fantasyBooks} loading={false} horizontalOnMobile={true} variant="home" />
        </section>
      )}

      {/* Auto Ayuda Section */}
      {selfHelpBooks.length > 0 && (
        <section className="mb-16 md:mb-20 flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-7 pb-4 border-b border-outline-variant/45">
            <div>
              <h2 className="font-hero-display text-3xl sm:text-[34px] md:text-[38px] font-semibold tracking-[-0.015em] text-primary leading-tight">
                Autoayuda
              </h2>
              <p className="mt-1 font-hero-sans text-sm text-on-surface-variant/85">
                Hábitos, enfoque y lecturas prácticas para crecer cada día.
              </p>
            </div>
            <Link
              to="/catalog?genre=SELF-HELP"
              className="group inline-flex items-center gap-1.5 font-hero-sans text-[13px] font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer pb-0.5"
            >
              <span>Explorar género</span>
              <ArrowRight
                size={14}
                strokeWidth={2}
                absoluteStrokeWidth
                aria-hidden="true"
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </div>
          <BookGrid books={selfHelpBooks} loading={false} horizontalOnMobile={true} variant="home" />
        </section>
      )}

      {/* Sidebar-style quote */}
      <div className="border-l-4 border-secondary/30 pl-6 md:pl-10 italic font-headline text-on-surface-variant max-w-2xl mx-auto mt-12 md:mt-20">
        <p className="text-xl md:text-3xl leading-relaxed md:leading-snug mb-6">"{quote.frase}"</p>
        <cite className="block font-label not-italic text-xs md:text-sm uppercase tracking-[0.3em] text-primary font-bold">— {quote.autor}</cite>
      </div>

      {/* Sección final About */}
      <SeccionAbout />
      </div>
    </main>
  )
}
