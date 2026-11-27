import { useState, useEffect, useRef, useCallback } from 'react'
import { Compass, BookMarked, Clock, ChevronRight, ArrowRight } from 'lucide-react'
import AiSparkleIcon from '../components/ui/AiSparkleIcon'
import { getBooks, getFeaturedBooks, getRecentBooks } from '../api/books'
import BookShelfReveal from '../components/books/BookShelfReveal'
import Hero from '../components/layout/Hero'
import GenresSection from '../components/layout/GenresSection'
import BestSellersSection from '../components/layout/BestSellersSection'
import SeccionAbout from '../components/layout/SeccionAbout'
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
  const [featuredState, setFeaturedState] = useState({ books: [], loading: true, error: false })
  const [recentState, setRecentState] = useState({ books: [], loading: true, error: false })
  const [fantasyState, setFantasyState] = useState({ books: [], loading: true, error: false })
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

  const loadFeatured = useCallback(async () => {
    setFeaturedState((prev) => ({ ...prev, loading: true, error: false }))
    try {
      const { data } = await getFeaturedBooks({ limit: 10 })
      setFeaturedState({
        books: Array.isArray(data) ? data.slice(0, 10) : [],
        loading: false,
        error: false,
      })
    } catch (err) {
      console.error(err)
      setFeaturedState({ books: [], loading: false, error: true })
    }
  }, [])

  const loadRecent = useCallback(async () => {
    setRecentState((prev) => ({ ...prev, loading: true, error: false }))
    try {
      const { data } = await getRecentBooks({ limit: 10 })
      setRecentState({
        books: Array.isArray(data) ? data.slice(0, 10) : [],
        loading: false,
        error: false,
      })
    } catch (err) {
      console.error(err)
      setRecentState({ books: [], loading: false, error: true })
    }
  }, [])

  const loadFantasy = useCallback(async () => {
    setFantasyState((prev) => ({ ...prev, loading: true, error: false }))
    try {
      const { data } = await getBooks({ genre: 'FANTASY', limit: 10 })
      setFantasyState({
        books: Array.isArray(data) ? data.slice(0, 10) : [],
        loading: false,
        error: false,
      })
    } catch (err) {
      console.error(err)
      setFantasyState({ books: [], loading: false, error: true })
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      loadFeatured()
      loadRecent()
      loadFantasy()
    }, 0)
    return () => clearTimeout(id)
  }, [loadFeatured, loadRecent, loadFantasy])

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
            transitionDelay: '60ms',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 transition-[opacity,translate] duration-550 ${
            aiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center gap-3">
            <AiSparkleIcon
              size={19}
              className="text-secondary-dark shrink-0"
            />
            <h2 className="font-hero-display text-2xl sm:text-[28px] font-semibold tracking-[-0.015em] text-primary dark:text-[#e8e3d6] leading-tight">
              ¿No sabés qué leer?{' '}
              <span className="italic font-medium text-secondary-dark">Preguntale a Lib</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message: '' } }))}
            className="group self-start sm:self-auto inline-flex items-center gap-1.5 font-hero-sans text-xs font-semibold text-primary/80 dark:text-[#d6e8b5]/85 hover:text-primary dark:hover:text-[#d6e8b5] transition-colors cursor-pointer"
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
                  transitionDelay: `${120 + index * 70}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`transition-[opacity,translate] duration-550 ${
                  aiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('open-ai-chat', { detail: { message: prompt.text } })
                    )
                  }
                  className="group w-full h-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-white/80 dark:bg-surface-container-low hover:bg-white dark:hover:bg-surface-container border border-outline-variant/65 dark:border-outline-variant hover:border-primary/30 dark:hover:border-secondary/50 text-left shadow-[0_2px_10px_-4px_rgba(14,81,70,0.06)] dark:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)] hover:shadow-[0_10px_24px_-8px_rgba(14,81,70,0.12)] dark:hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.6)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] [-webkit-tap-highlight-color:transparent] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <PromptIcon
                    size={18}
                    strokeWidth={1.8}
                    absoluteStrokeWidth
                    aria-hidden="true"
                    className="shrink-0 text-primary/80 dark:text-[#edbd79] group-hover:text-secondary-dark transition-colors duration-200"
                  />
                  <span className="flex-1 font-hero-sans text-[13.5px] font-medium text-on-surface group-hover:text-primary dark:group-hover:text-[#e8e3d6] leading-snug transition-colors">
                    {prompt.text}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.9}
                    absoluteStrokeWidth
                    aria-hidden="true"
                    className="shrink-0 text-outline group-hover:text-primary dark:group-hover:text-[#edbd79] transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Destacados Section (10 libros: 5 visibles por pantalla + 5 al deslizar) */}
      {(featuredState.loading || featuredState.error || featuredState.books.length > 0) && (
        <BookShelfReveal
          title="Libros"
          accent="destacados"
          subtitle="Las obras mejor valoradas y más elegidas por los lectores de la comunidad."
          ctaTo="/catalog"
          ctaLabel="Ver catálogo"
          books={featuredState.books}
          loading={featuredState.loading}
          error={featuredState.error}
          onRetry={loadFeatured}
        />
      )}

      {/* Géneros Section */}
      <GenresSection />

      {/* Novedades Section */}
      {(recentState.loading || recentState.error || recentState.books.length > 0) && (
        <BookShelfReveal
          title="Agregados"
          accent="recientemente"
          subtitle="Las últimas incorporaciones que llegaron a nuestra colección."
          ctaTo="/catalog"
          ctaLabel="Ver catálogo"
          books={recentState.books}
          loading={recentState.loading}
          error={recentState.error}
          onRetry={loadRecent}
        />
      )}

      {/* Best Sellers Section */}
      <BestSellersSection />

      {/* Fantasía Section (10 libros con slider y animación editorial compartida) */}
      {(fantasyState.loading || fantasyState.error || fantasyState.books.length > 0) && (
        <BookShelfReveal
          title="Género:"
          accent="Fantasía"
          subtitle="Mundos extraordinarios, magia y aventuras inolvidables."
          ctaTo="/catalog?genre=FANTASY"
          ctaLabel="Explorar género"
          books={fantasyState.books}
          loading={fantasyState.loading}
          error={fantasyState.error}
          onRetry={loadFantasy}
        />
      )}

      {/* Sección final About (incluye frase literaria debajo) */}
      <SeccionAbout />
      </div>
    </main>
  )
}
