
export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#fffbff]">
      <div className="w-24 h-24 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mb-8 shadow-lg">
        <span className="material-symbols-outlined text-5xl">
          error
        </span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-[#410002] mb-4">
        Algo salió mal
      </h1>
      <h2 className="text-xl md:text-2xl font-body font-medium text-[#ba1a1a] mb-6 max-w-2xl">
        Ocurrió un error inesperado al cargar la página.
      </h2>

      
      <div className="flex flex-col sm:flex-row gap-4">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="px-8 py-3 bg-[#ba1a1a] text-white font-label uppercase tracking-widest text-xs font-bold rounded shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Intentar de nuevo
          </button>
        )}
        <a
          href="/"
          onClick={resetErrorBoundary}
          className="px-8 py-3 border border-[#ba1a1a] text-[#ba1a1a] font-label uppercase tracking-widest text-xs font-bold rounded hover:bg-[#ffdad6]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Volver al Inicio
        </a>
      </div>
    </div>
  )
}
