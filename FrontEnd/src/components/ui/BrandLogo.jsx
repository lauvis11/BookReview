export default function BrandLogo({
  variant = 'light',
  showText = true,
  className = 'h-10 w-auto',
}) {
  const mainColor = variant === 'dark' ? '#edbd79' : '#0e5146'
  const starColor = '#edbd79'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? '0 0 350 72' : '0 0 72 72'}
      fill="none"
      role="img"
      aria-label="BookReview"
      className={className}
    >
      <g transform={showText ? undefined : 'translate(-1, 2)'}>
        {/* Ícono: Libro abierto geométrico */}
        <polygon fill={mainColor} points="10,20 34,25 34,57 10,52" />
        <polygon fill={mainColor} points="64,20 40,25 40,57 64,52" />
        <polygon fill={mainColor} points="15,15 35,21 35,23 15,17" />
        <polygon fill={mainColor} points="59,15 39,21 39,23 59,17" />
        <polygon fill={mainColor} points="34,59 37,62 40,59 37,56" />

        {/* Estrella saliendo de las páginas */}
        <polygon
          fill={starColor}
          points="37,6 39.9,11.9 46.5,12.9 41.7,17.5 42.9,24.1 37,21 31.1,24.1 32.3,17.5 27.5,12.9 34.1,11.9"
        />
      </g>

      {showText && (
        <text
          x="82"
          y="51"
          fill={mainColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          fontSize="42"
          fontWeight="700"
          letterSpacing="-0.5"
        >
          BookReview
        </text>
      )}
    </svg>
  )
}
