import { Link } from 'react-router-dom'

// Paleta: #412817 primario | #745a34 secundario | #c2a878 dorado | #ffdcc6 crema | #f7f3ea beige | #d3c3bb borde

function HeroIllustration() {
  return (
    <svg width="100%" viewBox="120 110 420 305" role="img" aria-label="Ilustración de libros apilados">

      {/* Sombra base */}
      <ellipse cx="340" cy="395" rx="190" ry="10" fill="#41281720"/>

      {/* Libro 1 - base, crema peach */}
      <rect x="190" y="330" width="300" height="40" rx="5" fill="#ffdcc6" stroke="#d3c3bb" strokeWidth="0.8"/>
      <rect x="190" y="330" width="20" height="40" rx="5" fill="#412817"/>
      <line x1="222" y1="339" x2="470" y2="339" stroke="#c2a878" strokeWidth="0.7"/>
      <line x1="222" y1="349" x2="440" y2="349" stroke="#c2a878" strokeWidth="0.7"/>
      <line x1="222" y1="359" x2="455" y2="359" stroke="#c2a878" strokeWidth="0.7"/>

      {/* Libro 2 - dorado claro */}
      <rect x="200" y="286" width="268" height="40" rx="5" fill="#e8d5b0" stroke="#c2a878" strokeWidth="0.8"/>
      <rect x="200" y="286" width="20" height="40" rx="5" fill="#745a34"/>
      <line x1="232" y1="295" x2="450" y2="295" stroke="#c2a878" strokeWidth="0.7"/>
      <line x1="232" y1="305" x2="415" y2="305" stroke="#c2a878" strokeWidth="0.7"/>
      <line x1="232" y1="315" x2="435" y2="315" stroke="#c2a878" strokeWidth="0.7"/>

      {/* Libro 3 - beige cálido */}
      <rect x="205" y="244" width="252" height="38" rx="5" fill="#f7f3ea" stroke="#d3c3bb" strokeWidth="0.8"/>
      <rect x="205" y="244" width="20" height="38" rx="5" fill="#412817"/>
      <line x1="237" y1="253" x2="440" y2="253" stroke="#d3c3bb" strokeWidth="0.7"/>
      <line x1="237" y1="263" x2="402" y2="263" stroke="#d3c3bb" strokeWidth="0.7"/>
      <line x1="237" y1="273" x2="425" y2="273" stroke="#d3c3bb" strokeWidth="0.7"/>

      {/* Libro 4 - marrón dorado */}
      <rect x="212" y="204" width="232" height="36" rx="5" fill="#c2a878" stroke="#745a34" strokeWidth="0.8"/>
      <rect x="212" y="204" width="20" height="36" rx="5" fill="#745a34"/>
      <line x1="244" y1="213" x2="428" y2="213" stroke="#f7f3ea" strokeWidth="0.7"/>
      <line x1="244" y1="222" x2="390" y2="222" stroke="#f7f3ea" strokeWidth="0.7"/>
      <line x1="244" y1="231" x2="410" y2="231" stroke="#f7f3ea" strokeWidth="0.7"/>

      {/* Libro abierto */}
      <path d="M252 144 Q278 135 312 141 L312 204 Q278 198 252 208 Z" fill="#f7f3ea" stroke="#d3c3bb" strokeWidth="0.8"/>
      <path d="M312 141 Q344 135 368 144 L368 208 Q344 198 312 204 Z" fill="#fdf9f0" stroke="#d3c3bb" strokeWidth="0.8"/>
      <line x1="312" y1="141" x2="312" y2="204" stroke="#82746d" strokeWidth="1.2"/>
      <line x1="264" y1="155" x2="304" y2="153" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="264" y1="163" x2="304" y2="161" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="264" y1="171" x2="304" y2="169" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="264" y1="179" x2="304" y2="177" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="264" y1="187" x2="296" y2="185" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="320" y1="153" x2="358" y2="155" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="320" y1="161" x2="358" y2="163" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="320" y1="169" x2="358" y2="171" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="320" y1="177" x2="358" y2="179" stroke="#d3c3bb" strokeWidth="1"/>
      <line x1="320" y1="185" x2="352" y2="187" stroke="#d3c3bb" strokeWidth="1"/>

      {/* Marcapáginas dorado */}
      <rect x="350" y="134" width="7" height="32" rx="1.5" fill="#c2a878"/>
      <polygon points="350,166 357,166 353.5,175" fill="#c2a878"/>

      {/* Detalles decorativos flotantes */}
      <circle cx="168" cy="188" r="5" fill="#c2a878" opacity="0.5"/>
      <circle cx="148" cy="242" r="3" fill="#ffdcc6" opacity="0.7"/>
      <circle cx="178" cy="292" r="4" fill="#d3c3bb" opacity="0.6"/>
      <circle cx="500" cy="198" r="4" fill="#745a34" opacity="0.35"/>
      <circle cx="518" cy="258" r="3" fill="#c2a878" opacity="0.5"/>
      <circle cx="495" cy="312" r="5" fill="#ffdcc6" opacity="0.55"/>

    </svg>
  )
}

export default function Hero() {
  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('open-ai-chat'))
  }

  return (
    <section className="relative pt-20 md:pt-28 pb-10 md:pb-16 px-5 sm:px-8 md:px-12 max-w-[1440px] mx-auto">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-12 items-center">

        {/* Illustration — arriba en mobile, derecha en desktop */}
        <div className="order-1 md:order-2 flex items-center justify-center md:justify-end w-full">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-full">
            <HeroIllustration />
          </div>
        </div>

        {/* Text Content — abajo en mobile, izquierda en desktop */}
        <div className="order-2 md:order-1 text-center md:text-left">

          <h1 className="font-headline font-black text-[#412817] leading-[1.05] tracking-tighter mb-4 md:mb-5">
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl block">Explora,</span>
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl block">Descubre,</span>
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl block text-[#c2a878]">Opina.</span>
          </h1>

          <p className="font-body text-[#50453e] text-base md:text-lg leading-relaxed max-w-sm sm:max-w-md mx-auto md:mx-0 mb-8 md:mb-10">
            Encuentra tu próxima lectura, lleva el registro de lo que lees y recibe recomendaciones personalizadas con la ayuda de un asistente de IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-7 md:py-3.5 bg-[#412817] text-[#ffdcc6] font-label text-xs uppercase tracking-widest font-bold rounded-full shadow-lg hover:brightness-110 hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-base">library_books</span>
              Explorar catálogo
            </Link>

            <button
              onClick={handleOpenChat}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-7 md:py-3.5 border-2 border-[#c2a878] text-[#412817] font-label text-xs uppercase tracking-widest font-bold rounded-full hover:bg-[#f7f3ea] active:scale-95 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Probar asistente IA
            </button>
          </div>
        </div>

      </div>

      {/* Divider decorativo */}
      <div className="mt-10 md:mt-14 flex items-center gap-4">
        <div className="flex-1 h-px bg-[#d3c3bb]/40" />
        <span className="material-symbols-outlined text-[#d3c3bb] text-xl">menu_book</span>
        <div className="flex-1 h-px bg-[#d3c3bb]/40" />
      </div>

    </section>
  )
}
