export default function Avatar({ src, name, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border-2 border-outline-variant/30`}
      />
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-primary flex items-center justify-center text-on-primary font-serif font-semibold border-2 border-outline-variant/30`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}
