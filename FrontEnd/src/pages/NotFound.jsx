import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

export default function NotFound() {
  useSEO({
    title: '404 — Página no encontrada',
    description: 'La página que buscás no existe en BookReview.',
    noindex: true,
  })
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-surface-container-low">
      <span className="material-symbols-outlined text-9xl text-primary/20 dark:text-secondary/25 mb-6 block">
        library_books
      </span>
      <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter text-primary dark:text-[#e8e3d6] mb-4">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-headline font-bold text-secondary-dark mb-6">
        Parece que este libro no está en nuestra biblioteca
      </h2>
      <p className="text-lg text-on-surface-variant font-body max-w-md mx-auto mb-10">
        La página que estás buscando no existe, ha sido movida o está temporalmente inaccesible.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/"
          className="px-8 py-3 bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-on-primary font-label uppercase tracking-widest text-xs font-bold rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Volver al Inicio
        </Link>
        <Link
          to="/catalog"
          className="px-8 py-3 border border-outline dark:border-outline-variant text-secondary-dark font-label uppercase tracking-widest text-xs font-bold rounded hover:bg-surface-container hover:text-primary dark:hover:text-[#e8e3d6] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          Explorar Catálogo
        </Link>
      </div>
    </div>
  )
}
