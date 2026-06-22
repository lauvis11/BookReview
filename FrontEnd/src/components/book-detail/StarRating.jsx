export default function StarRating({ rating = 0, interactive = false, onRate }) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          className={`text-xl transition-all duration-200 ${
            interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'
          } ${star <= Math.round(rating) ? 'text-[#E5B02E]' : 'text-outline-variant/40'}`}
        >
          ★
        </button>
      ))}
      {!interactive && <span className="ml-2 text-sm font-medium text-on-surface-variant">{rating}</span>}
    </div>
  )
}
