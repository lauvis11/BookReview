import { Link } from 'react-router-dom'

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="group cursor-pointer block">
      <div className="aspect-[2/3] bg-surface-container-low overflow-hidden rounded-sm relative shadow-md transition-shadow duration-300 group-hover:shadow-xl">
        {book.img ? (
          <img
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={book.img}
            alt={book.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container text-4xl text-primary/20 font-headline transition-transform duration-700 group-hover:scale-105">📖</div>
        )}
        {/* Book spine effect */}
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10"></div>
        {/* Glossy overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-10 mix-blend-overlay"></div>
      </div>
      <div className="mt-3 md:mt-4 px-1">
        <h3 className="text-sm md:text-lg font-bold text-primary font-headline leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-secondary" title={book.title}>
          {book.title}
        </h3>
        <p className="font-label text-[9px] md:text-xs uppercase tracking-widest text-on-surface-variant mt-1.5 md:mt-2 line-clamp-1">
          {Array.isArray(book.author) ? book.author[0] : book.author}
          {book.genre && (Array.isArray(book.genre) ? book.genre[0] : book.genre) ? ` • ${Array.isArray(book.genre) ? book.genre[0] : book.genre}` : ''}
        </p>
      </div>
    </Link>
  )
}
