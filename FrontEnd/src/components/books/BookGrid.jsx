import BookCard from './BookCard'
import BookSkeletonCard from './BookSkeletonCard'

export default function BookGrid({
  books,
  loading,
  emptyTitle = 'No se encontraron libros',
  emptySubtitle = 'Intenta con otros filtros de búsqueda',
  horizontalOnMobile = false,
  variant = 'catalog', // 'home' (muestra estrellas) | 'catalog' (sin estrellas)
}) {
  const showRating = variant === 'home'

  const gridClasses = horizontalOnMobile
    ? 'flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-5 pb-4 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-x-6 md:gap-y-9 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-9 sm:gap-x-6 sm:gap-y-10'

  if (loading) {
    return (
      <div className={gridClasses} aria-busy="true" aria-label="Cargando libros">
        {Array.from({ length: variant === 'home' ? 5 : 10 }).map((_, i) => (
          <div
            key={i}
            className={
              horizontalOnMobile
                ? 'min-w-[152px] w-[152px] shrink-0 snap-start md:min-w-0 md:w-auto md:shrink'
                : ''
            }
          >
            <BookSkeletonCard />
          </div>
        ))}
      </div>
    )
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-hero-display text-3xl font-semibold text-primary">{emptyTitle}</p>
        <p className="mt-2 font-hero-sans text-sm text-on-surface-variant">{emptySubtitle}</p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {books.map((book) => (
        <div
          key={book.id}
          className={
            horizontalOnMobile
              ? 'min-w-[152px] w-[152px] shrink-0 snap-start md:min-w-0 md:w-auto md:shrink'
              : ''
          }
        >
          <BookCard book={book} showRating={showRating} />
        </div>
      ))}
    </div>
  )
}
