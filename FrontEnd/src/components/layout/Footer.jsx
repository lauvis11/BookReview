import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full bg-[#2d1e15] py-10 mt-20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col gap-8">
        {/* Top row: logo + links */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center">
            <img 
              src="/Book-review.webp" 
              alt="BookReview Logo" 
              className="h-16 md:h-20 object-contain rounded-sm shadow-md"
            />
          </Link>
          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              <Link className="font-sans text-xs uppercase tracking-widest text-stone-400 hover:text-[#fedaaa] underline underline-offset-4 decoration-[#c2a878] transition-all duration-200" to="/catalog">Catálogo</Link>
              <Link className="font-sans text-xs uppercase tracking-widest text-stone-400 hover:text-[#fedaaa] underline underline-offset-4 decoration-[#c2a878] transition-all duration-200" to="/">Inicio</Link>
            </div>
          </div>
        </div>

        {/* Bottom row: copyright — always last */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="font-sans text-xs tracking-widest text-[#fedaaa]/70">
            © {new Date().getFullYear()} BookReview. Desarrollado por{' '}
            <a
              href="https://github.com/lauvis11"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-transparent hover:border-[#fedaaa] transition-all duration-200 hover:text-[#fedaaa]"
            >
              Lautaro Viscarra
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
