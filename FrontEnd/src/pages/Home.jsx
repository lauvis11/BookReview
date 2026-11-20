import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Compass, BookMarked, Clock, ChevronRight, ArrowRight } from 'lucide-react'
import { getBooks } from '../api/books'
import BookGrid from '../components/books/BookGrid'
import Hero from '../components/layout/Hero'
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
        const [recentRes, fantasyRes, selfHelpRes] = await Promise.all([
          getBooks(),
          getBooks({ genre: 'FANTASY' }),
          getBooks({ genre: 'SELF-HELP' })
        ])
        setRecentBooks(recentRes.data.slice(-4).reverse())
        setFantasyBooks(fantasyRes.data.slice(0, 4))
        setSelfHelpBooks(selfHelpRes.data.slice(0, 4))
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

      {/* Novedades Section */}
      {recentBooks.length > 0 && (
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-8 border-b border-surface-container-high pb-4">
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-secondary mb-2 block">Novedades</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary font-headline">
                Agregados Recientemente
              </h2>
            </div>
            <Link
              to="/catalog"
              className="text-primary font-label text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-primary/20 hover:border-primary transition-all cursor-pointer pb-1 group flex items-center gap-2"
            >
              Ver catálogo <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <BookGrid books={recentBooks} loading={false} horizontalOnMobile={true} />
        </section>
      )}

      {/* Fantasía Section */}
      {fantasyBooks.length > 0 && (
        <section className="mb-20 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-8 border-b border-surface-container-high pb-4">
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-secondary mb-2 block">Género</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary font-headline">
                Fantasía
              </h2>
            </div>
            <Link
              to="/catalog?genre=FANTASY"
              className="text-primary font-label text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-primary/20 hover:border-primary transition-all cursor-pointer pb-1 group flex items-center gap-2"
            >
              Explorar género <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <BookGrid books={fantasyBooks} loading={false} horizontalOnMobile={true} />
        </section>
      )}

      {/* Auto Ayuda Section */}
      {selfHelpBooks.length > 0 && (
        <section className="mb-20 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-8 border-b border-surface-container-high pb-4">
            <div>
              <span className="font-label text-xs uppercase tracking-widest text-secondary mb-2 block">Género</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary font-headline">
                Auto Ayuda
              </h2>
            </div>
            <Link
              to="/catalog?genre=SELF-HELP"
              className="text-primary font-label text-xs uppercase tracking-[0.2em] font-bold border-b-2 border-primary/20 hover:border-primary transition-all cursor-pointer pb-1 group flex items-center gap-2"
            >
              Explorar género <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
          <BookGrid books={selfHelpBooks} loading={false} horizontalOnMobile={true} />
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
