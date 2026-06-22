import BookCard from './BookCard'

export default function BookGrid({ 
  books, 
  loading, 
  emptyTitle = "No se encontraron libros", 
  emptySubtitle = "Intenta con otros filtros de búsqueda",
  horizontalOnMobile = false
}) {
  const gridClasses = horizontalOnMobile
    ? "flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 pb-6 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-8 lg:gap-12 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0"
    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:gap-x-12 lg:gap-y-16";

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`animate-pulse ${horizontalOnMobile ? 'min-w-[160px] w-[160px] shrink-0 snap-start md:min-w-0 md:w-auto md:shrink' : ''}`}>
            <div className="aspect-[2/3] bg-surface-container-low rounded-sm" />
            <div className="mt-6 h-5 bg-surface-container-low rounded w-3/4" />
            <div className="mt-2 h-3 bg-surface-container-low rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-headline text-2xl text-on-surface-variant">{emptyTitle}</p>
        <p className="text-sm text-on-surface-variant mt-2 font-body italic">{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {books.map((book) => (
        <div key={book.id} className={horizontalOnMobile ? 'min-w-[160px] w-[160px] shrink-0 snap-start md:min-w-0 md:w-auto md:shrink' : ''}>
          <BookCard book={book} />
        </div>
      ))}
    </div>
  )
}
