export default function AiSparkleIcon({
  size = 20,
  color = 'currentColor',
  className = '',
  style,
  'aria-hidden': ariaHidden = true,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden={ariaHidden}
      className={className}
      style={style}
    >
      <path d="M10 2.5 Q11.4 8.6 17.5 10 Q11.4 11.4 10 17.5 Q8.6 11.4 2.5 10 Q8.6 8.6 10 2.5 Z" />
      <path d="M18.2 13.4 Q18.9 16.5 22 17.2 Q18.9 17.9 18.2 21 Q17.5 17.9 14.4 17.2 Q17.5 16.5 18.2 13.4 Z" />
      <path d="M18.5 2.8 Q19 5 21.2 5.5 Q19 6 18.5 8.2 Q18 6 15.8 5.5 Q18 5 18.5 2.8 Z" />
    </svg>
  )
}
