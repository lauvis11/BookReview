import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBooks } from '../api/books'
import BookGrid from '../components/books/BookGrid'
import Hero from '../components/layout/Hero'
import { frases } from '../utils/frases'

export default function Home() {
  const [recentBooks, setRecentBooks] = useState([])
  const [fantasyBooks, setFantasyBooks] = useState([])
  const [selfHelpBooks, setSelfHelpBooks] = useState([])
  const [quote] = useState(() => frases[Math.floor(Math.random() * frases.length)])

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
    <main className="pb-16 md:pb-24 max-w-[1440px] mx-auto min-h-screen flex flex-col">
      <Hero />
      <div className="px-6 md:px-12">
      {/* Bot Chat Suggestions */}
      <section className="mb-16">
        <div className="mb-6">
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2 block">Asistente de Lectura</span>
          <h2 className="text-3xl font-black tracking-tight text-primary font-headline">
            ¿No sabes cual es tu proxima lectura? Prueba el Asistente de IA
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:flex md:flex-wrap md:gap-4">
          {['Recomendame un género nuevo para explorar', '¿Cuáles son los clásicos imprescindibles?', 'Busco un libro corto para leer hoy'].map((prompt, i) => (
            <button 
              key={i}
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: { message: prompt } }))}
              className="w-full md:w-auto flex items-center justify-start gap-3 px-5 py-4 rounded-2xl border border-primary/10 bg-surface-container-lowest hover:bg-primary hover:border-primary text-primary hover:text-white font-body text-sm transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg group"
            >
              <span className="material-symbols-outlined text-lg text-secondary group-hover:text-[#e7bea5] transition-colors shrink-0">auto_awesome</span>
              <span className="flex-1 text-left leading-tight">{prompt}</span>
            </button>
          ))}
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
      </div>
    </main>
  )
}
