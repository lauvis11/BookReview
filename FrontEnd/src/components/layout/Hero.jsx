import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function HeroIllustration() {
  return (
    <svg
      width="100%"
      viewBox="80 55 480 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ilustración editorial de libros apilados y lectura"
      className="w-full h-auto drop-shadow-[0_18px_35px_rgba(8,32,27,0.45)]"
    >
      <defs>
        {/* Resplandor cálido de fondo */}
        <radialGradient id="heroGlow" cx="50%" cy="48%" r="48%">
          <stop offset="0%" stopColor="#edbd79" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#c2a878" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#0e5146" stopOpacity="0" />
        </radialGradient>

        {/* Gradientes de páginas para dar volumen 3D */}
        <linearGradient id="pageBlockCream" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e5dacb" />
          <stop offset="12%" stopColor="#fdf9f0" />
          <stop offset="88%" stopColor="#f7f3ea" />
          <stop offset="100%" stopColor="#dfd3c3" />
        </linearGradient>

        <linearGradient id="pageBlockWarm" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e7ccb2" />
          <stop offset="15%" stopColor="#ffdcc6" />
          <stop offset="88%" stopColor="#fae5d3" />
          <stop offset="100%" stopColor="#debda0" />
        </linearGradient>

        {/* Gradientes para lomos y cubiertas */}
        <linearGradient id="coverEspresso" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a3e2b" />
          <stop offset="50%" stopColor="#412817" />
          <stop offset="100%" stopColor="#2c1607" />
        </linearGradient>

        <linearGradient id="coverBronze" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8c6e42" />
          <stop offset="55%" stopColor="#745a34" />
          <stop offset="100%" stopColor="#54411b" />
        </linearGradient>

        <linearGradient id="coverGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2c98a" />
          <stop offset="55%" stopColor="#c2a878" />
          <stop offset="100%" stopColor="#9c8052" />
        </linearGradient>

        <linearGradient id="coverForest" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d7a6b" />
          <stop offset="55%" stopColor="#0e5b4f" />
          <stop offset="100%" stopColor="#093830" />
        </linearGradient>

        <linearGradient id="openPageLeft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f2ece1" />
          <stop offset="75%" stopColor="#fdf9f0" />
          <stop offset="100%" stopColor="#ded4c6" />
        </linearGradient>

        <linearGradient id="openPageRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ded4c6" />
          <stop offset="25%" stopColor="#fdf9f0" />
          <stop offset="100%" stopColor="#f2ece1" />
        </linearGradient>
      </defs>

      {/* Halo luminoso y arco editorial de fondo */}
      <circle cx="320" cy="230" r="165" fill="url(#heroGlow)" />
      <path
        d="M175 365 V215 A145 145 0 0 1 465 215 V365"
        stroke="#edbd79"
        strokeOpacity="0.18"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />
      <circle cx="320" cy="220" r="128" stroke="#d6e8b5" strokeOpacity="0.12" strokeWidth="1" />

      {/* Sombra de base sobre la superficie */}
      <ellipse cx="320" cy="382" rx="195" ry="14" fill="#072923" opacity="0.55" />
      <ellipse cx="310" cy="380" rx="150" ry="8" fill="#041b17" opacity="0.45" />

      {/* ============================================================
          LIBRO 1 (Base inferior - Gran volumen Espresso & Crema)
      ============================================================ */}
      <g>
        {/* Cubierta trasera/inferior */}
        <rect x="148" y="330" width="312" height="46" rx="8" fill="url(#coverEspresso)" />
        {/* Bloque de páginas */}
        <rect x="176" y="335" width="278" height="36" rx="4" fill="url(#pageBlockWarm)" />
        {/* Líneas de hojas */}
        <line x1="184" y1="343" x2="446" y2="343" stroke="#c2a878" strokeWidth="0.9" strokeOpacity="0.65" />
        <line x1="184" y1="350" x2="438" y2="350" stroke="#c2a878" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="184" y1="357" x2="448" y2="357" stroke="#c2a878" strokeWidth="0.9" strokeOpacity="0.65" />
        <line x1="184" y1="364" x2="430" y2="364" stroke="#c2a878" strokeWidth="0.8" strokeOpacity="0.5" />
        {/* Lomo izquierdo con nervios dorados */}
        <path d="M148 338 A8 8 0 0 1 156 330 H180 V376 H156 A8 8 0 0 1 148 368 Z" fill="url(#coverEspresso)" />
        <rect x="155" y="330" width="3" height="46" fill="#edbd79" opacity="0.7" />
        <rect x="172" y="330" width="2" height="46" fill="#c2a878" opacity="0.45" />
        {/* Bordes de tapa superior e inferior */}
        <rect x="152" y="330" width="308" height="4.5" rx="2" fill="#5a3e2b" />
        <rect x="152" y="371.5" width="308" height="4.5" rx="2" fill="#2c1607" />
        {/* Cinta marcapáginas colgando */}
        <path d="M295 352 Q302 374 288 390 L298 387 L305 393 Q312 374 305 352 Z" fill="#e27654" />
      </g>

      {/* ============================================================
          LIBRO 2 (Segundo nivel - Bronce Editorial con detalles dorados)
      ============================================================ */}
      <g>
        <rect x="166" y="284" width="276" height="44" rx="7" fill="url(#coverBronze)" />
        {/* Bloque de páginas */}
        <rect x="194" y="289" width="242" height="34" rx="3.5" fill="url(#pageBlockCream)" />
        <line x1="202" y1="297" x2="428" y2="297" stroke="#d3c3bb" strokeWidth="0.9" />
        <line x1="202" y1="304" x2="416" y2="304" stroke="#d3c3bb" strokeWidth="0.8" />
        <line x1="202" y1="311" x2="430" y2="311" stroke="#d3c3bb" strokeWidth="0.9" />
        <line x1="202" y1="317" x2="408" y2="317" stroke="#d3c3bb" strokeWidth="0.8" />
        {/* Lomo con sello dorado */}
        <path d="M166 291 A7 7 0 0 1 173 284 H196 V328 H173 A7 7 0 0 1 166 321 Z" fill="url(#coverBronze)" />
        <rect x="173" y="284" width="2.5" height="44" fill="#edbd79" opacity="0.65" />
        <circle cx="183" cy="306" r="5" fill="#edbd79" opacity="0.35" />
        <rect x="170" y="284" width="272" height="4" rx="2" fill="#8c6e42" />
        <rect x="170" y="324" width="272" height="4" rx="2" fill="#54411b" />
      </g>

      {/* ============================================================
          LIBRO 3 (Tercer nivel - Verde Bosque Profundo & Dorado)
      ============================================================ */}
      <g>
        <rect x="158" y="242" width="256" height="40" rx="7" fill="url(#coverForest)" stroke="#edbd79" strokeWidth="0.6" strokeOpacity="0.4" />
        {/* Bloque de páginas (invertido: lomo a la derecha para dinamismo visual) */}
        <rect x="164" y="246.5" width="222" height="31" rx="3" fill="url(#pageBlockCream)" />
        <line x1="172" y1="254" x2="378" y2="254" stroke="#c2a878" strokeWidth="0.8" strokeOpacity="0.6" />
        <line x1="172" y1="261" x2="366" y2="261" stroke="#c2a878" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="172" y1="268" x2="380" y2="268" stroke="#c2a878" strokeWidth="0.8" strokeOpacity="0.6" />
        {/* Lomo derecho */}
        <path d="M384 242 H407 A7 7 0 0 1 414 249 V275 A7 7 0 0 1 407 282 H384 Z" fill="url(#coverForest)" />
        <rect x="390" y="242" width="2" height="40" fill="#edbd79" opacity="0.55" />
        <rect x="403" y="242" width="3" height="40" fill="#edbd79" opacity="0.75" />
        <rect x="160" y="242" width="252" height="4" rx="2" fill="#1d7a6b" />
        <rect x="160" y="278" width="252" height="4" rx="2" fill="#093830" />
      </g>

      {/* ============================================================
          LIBRO 4 (Cuarto nivel - Dorado Ocre / Miel)
      ============================================================ */}
      <g>
        <rect x="184" y="204" width="224" height="36" rx="6" fill="url(#coverGold)" />
        <rect x="208" y="208" width="194" height="28" rx="3" fill="url(#pageBlockCream)" />
        <line x1="215" y1="215" x2="394" y2="215" stroke="#d3c3bb" strokeWidth="0.8" />
        <line x1="215" y1="222" x2="382" y2="222" stroke="#d3c3bb" strokeWidth="0.8" />
        <line x1="215" y1="229" x2="390" y2="229" stroke="#d3c3bb" strokeWidth="0.8" />
        {/* Lomo izquierdo */}
        <path d="M184 210 A6 6 0 0 1 190 204 H210 V240 H190 A6 6 0 0 1 184 234 Z" fill="url(#coverEspresso)" />
        <rect x="192" y="204" width="2.5" height="36" fill="#edbd79" opacity="0.8" />
        <rect x="186" y="204" width="220" height="3.5" rx="1.5" fill="#f2c98a" />
        <rect x="186" y="236.5" width="220" height="3.5" rx="1.5" fill="#9c8052" />
      </g>

      {/* ============================================================
          LIBRO ABIERTO EN LA CIMA (Perspectiva editorial 3D)
      ============================================================ */}
      <g>
        {/* Resplandor mágico saliendo de las páginas abiertas */}
        <ellipse cx="296" cy="148" rx="88" ry="42" fill="#edbd79" opacity="0.16" />

        {/* Cubierta rígida del libro abierto */}
        <path
          d="M192 198 L200 130 Q248 118 296 132 Q344 118 392 130 L400 198 Q346 186 296 202 Q246 186 192 198 Z"
          fill="#412817"
          stroke="#edbd79"
          strokeWidth="1"
          strokeOpacity="0.6"
        />

        {/* Hojas inferiores apiladas (volumen de páginas abiertas) */}
        <path
          d="M198 193 L204 126 Q250 113 296 128 L296 198 Q248 182 198 193 Z"
          fill="#e6dec8"
          stroke="#d3c3bb"
          strokeWidth="0.7"
        />
        <path
          d="M296 128 Q342 113 388 126 L394 193 Q344 182 296 198 Z"
          fill="#e6dec8"
          stroke="#d3c3bb"
          strokeWidth="0.7"
        />

        {/* Página principal izquierda */}
        <path
          d="M203 188 L208 120 Q252 106 296 123 L296 195 Q250 177 203 188 Z"
          fill="url(#openPageLeft)"
          stroke="#d3c3bb"
          strokeWidth="0.8"
        />

        {/* Página principal derecha */}
        <path
          d="M296 123 Q340 106 384 120 L389 188 Q342 177 296 195 Z"
          fill="url(#openPageRight)"
          stroke="#d3c3bb"
          strokeWidth="0.8"
        />

        {/* Pliegue central del libro */}
        <line x1="296" y1="122" x2="296" y2="196" stroke="#82746d" strokeWidth="1.4" />

        {/* Capitular iluminada y texto en página izquierda */}
        <rect x="218" y="129" width="18" height="18" rx="3" fill="#0e5b4f" opacity="0.9" />
        <path d="M223 142 L227 133 L231 142 M224.5 139.5 H229.5" stroke="#edbd79" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="241" y1="133" x2="283" y2="136" stroke="#745a34" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
        <line x1="241" y1="142" x2="283" y2="145" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="218" y1="154" x2="283" y2="156" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="218" y1="163" x2="283" y2="165" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="218" y1="172" x2="268" y2="174" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

        {/* Líneas y viñeta dorada en página derecha */}
        <line x1="309" y1="135" x2="373" y2="131" stroke="#745a34" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
        <line x1="309" y1="144" x2="373" y2="140" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="309" y1="153" x2="373" y2="149" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="309" y1="162" x2="373" y2="158" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="309" y1="171" x2="352" y2="168" stroke="#82746d" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

        {/* Marcapáginas dorado sobresaliendo */}
        <path d="M352 114 H361 V152 L356.5 145 L352 152 Z" fill="#e9a45e" />
      </g>

      {/* ============================================================
          TAZA DE CAFÉ / TÉ LITERARIO A LA DERECHA
      ============================================================ */}
      <g>
        {/* Plato base */}
        <ellipse cx="476" cy="372" rx="34" ry="6" fill="#e6dec8" />
        <ellipse cx="476" cy="370" rx="26" ry="3.5" fill="#d3c3bb" />
        {/* Asa de la taza */}
        <path
          d="M496 338 H504 A10 10 0 0 1 514 348 V352 A10 10 0 0 1 504 362 H495"
          stroke="#fdf9f0"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Cuerpo de la taza */}
        <path
          d="M452 330 H500 V354 A18 18 0 0 1 482 370 H470 A18 18 0 0 1 452 354 Z"
          fill="#fdf9f0"
          stroke="#d3c3bb"
          strokeWidth="0.8"
        />
        {/* Franja decorativa dorada/espresso en la taza */}
        <rect x="453" y="337" width="46" height="5" fill="#c2a878" opacity="0.75" />
        <ellipse cx="476" cy="330" rx="24" ry="4.5" fill="#412817" />
        {/* Vapor suave subiendo */}
        <path
          d="M468 318 Q463 306 471 296 T469 276"
          stroke="#fdf9f0"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M483 315 Q488 304 480 293 T484 274"
          stroke="#edbd79"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </g>

      {/* ============================================================
          DESTELLOS Y ESTRELLAS LITERARIAS FLOTANTES
      ============================================================ */}
      {/* Estrella principal sobre el libro abierto */}
      <path
        d="M296 72 L300 84 L312 88 L300 92 L296 104 L292 92 L280 88 L292 84 Z"
        fill="#edbd79"
      />
      {/* Destello izquierdo */}
      <path
        d="M162 128 L164.5 135.5 L172 138 L164.5 140.5 L162 148 L159.5 140.5 L152 138 L159.5 135.5 Z"
        fill="#d6e8b5"
        opacity="0.85"
      />
      {/* Destello derecho */}
      <path
        d="M432 118 L434.5 125.5 L442 128 L434.5 130.5 L432 138 L429.5 130.5 L422 128 L429.5 125.5 Z"
        fill="#ffdcc6"
        opacity="0.85"
      />
      {/* Destello pequeño superior */}
      <path
        d="M232 88 L233.5 93 L238.5 94.5 L233.5 96 L232 101 L230.5 96 L225.5 94.5 L230.5 93 Z"
        fill="#edbd79"
        opacity="0.7"
      />

      {/* Partículas luminosas */}
      <circle cx="364" cy="92" r="4" fill="#d6e8b5" opacity="0.65" />
      <circle cx="136" cy="204" r="4.5" fill="#edbd79" opacity="0.55" />
      <circle cx="122" cy="264" r="3" fill="#ffdcc6" opacity="0.5" />
      <circle cx="468" cy="195" r="5" fill="#edbd79" opacity="0.5" />
      <circle cx="495" cy="242" r="3.5" fill="#d6e8b5" opacity="0.5" />
    </svg>
  )
}

export default function Hero() {
  const { user, isAuthenticated } = useAuth()
  const [query, setQuery] = useState('')

  const handleSubmit = (event) => {
    // Primera versión: input visual sin funcionalidad de búsqueda
    event.preventDefault()
  }

  return (
    <section className="mx-auto w-full max-w-360 px-5 sm:px-6 md:px-12 pt-24 md:pt-28 pb-10 md:pb-14">
      <div className="grid overflow-hidden rounded-[28px] bg-tertiary shadow-[0_20px_50px_rgba(14,81,70,0.16)] lg:grid-cols-[1.2fr_0.8fr] items-center relative">
        {/* Textura de iluminación sutil de fondo */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#edbd79]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#d6e8b5]/10 blur-3xl" />

        {/* Columna Izquierda: Contenido y Buscador */}
        <div className="order-2 lg:order-1 relative z-10 px-6 pb-9 pt-4 sm:px-10 sm:pb-12 lg:px-14 lg:py-14 text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-1.5 font-label text-xs font-semibold uppercase tracking-[0.14em] text-[#d6e8b5]">
            <span className="material-symbols-outlined text-[15px] text-[#edbd79]">auto_awesome</span>
            Tu biblioteca, más cerca
          </div>

          {isAuthenticated && user?.name ? (
            <h1 className="font-headline max-w-170 mx-auto lg:mx-0 text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.08] tracking-tight text-white">
              ¡Hola, {user.name}! ¿Qué vamos a{' '}
              <span className="text-[#edbd79]">descubrir hoy?</span>
            </h1>
          ) : (
            <h1 className="font-headline font-black text-white leading-[1.05] tracking-tighter">
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] block">Explora,</span>
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] block">Descubre,</span>
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] block text-[#edbd79]">Opina.</span>
            </h1>
          )}

          <p className="mt-5 max-w-142.5 mx-auto lg:mx-0 font-body text-[15px] leading-7 text-[#cee1dc] sm:text-base">
            Encuentra tu próxima lectura, lleva el registro de lo que lees y recibe recomendaciones personalizadas con la ayuda de un asistente de IA.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex max-w-162.5 mx-auto lg:mx-0 rounded-2xl bg-[#fdf9f0] p-1.5 shadow-lg border border-white/20"
          >
            <label htmlFor="hero-book-search" className="sr-only">
              Buscar en el catálogo
            </label>
            <span className="grid w-11 shrink-0 place-items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[21px]">search</span>
            </span>
            <input
              id="hero-book-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-1 font-body text-sm text-primary outline-none placeholder:text-outline"
              placeholder="Busca por título, autor o género..."
            />
            <button
              type="submit"
              className="rounded-xl bg-[#e9a45e] px-5 py-3 font-label text-xs uppercase tracking-widest font-bold text-primary transition hover:bg-[#f2b777] sm:px-7 cursor-pointer"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Columna Derecha: Ilustración SVG mejorada */}
        <div className="order-1 lg:order-2 relative flex items-center justify-center px-6 pt-8 pb-2 sm:px-10 lg:p-8 lg:min-h-102.5">
          <div className="w-full max-w-[320px] sm:max-w-95 lg:max-w-115">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  )
}
