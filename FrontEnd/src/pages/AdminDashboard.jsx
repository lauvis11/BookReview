import { useState, useEffect } from 'react'
import { getBooks } from '../api/books'

// Placeholder - replace with real API call when backend is ready
const getMockNewUsersLastMonth = () => 12

// Hardcoded recent activity - replace with API when ready
const MOCK_ACTIVITY = [
  { id: 1, type: 'comentario', user: 'María García',    value: 'Me encantó este libro, la narrativa es increíble.',  date: '2026-06-18T11:45:00' },
  { id: 2, type: 'rate',       user: 'Carlos López',    value: '4.5',                                                date: '2026-06-18T11:30:00' },
  { id: 3, type: 'registro',   user: 'Lucía Fernández', value: 'usr_lf8823',                                        date: '2026-06-18T10:55:00' },
  { id: 4, type: 'comentario', user: 'Pedro Sánchez',   value: 'Muy recomendable, aunque el final fue apresurado.',  date: '2026-06-18T10:20:00' },
  { id: 5, type: 'rate',       user: 'Ana Martínez',    value: '5',                                                  date: '2026-06-18T09:50:00' },
  { id: 6, type: 'registro',   user: 'Tomás Herrera',   value: 'usr_th4491',                                        date: '2026-06-18T09:10:00' },
  { id: 7, type: 'comentario', user: 'Valentina Ruiz',  value: 'No me convenció del todo, esperaba más desarrollo.', date: '2026-06-17T22:30:00' },
  { id: 8, type: 'rate',       user: 'Marcos Silva',    value: '3',                                                  date: '2026-06-17T21:15:00' },
  { id: 9, type: 'registro',   user: 'Sofía Romero',    value: 'usr_sr0076',                                        date: '2026-06-17T20:05:00' },
  { id: 10, type: 'comentario', user: 'Julián Castro',  value: 'Un clásico que todo el mundo debería leer al menos una vez.',  date: '2026-06-17T18:40:00' },
]

const TYPE_CONFIG = {
  comentario: { label: 'Comentario', icon: 'chat_bubble',     bg: 'bg-blue-50',       text: 'text-blue-700',   border: 'border-blue-200' },
  rate:       { label: 'Calificación', icon: 'star',          bg: 'bg-[#fedaaa]/40',  text: 'text-[#795e38]',  border: 'border-[#c2a878]/30' },
  registro:   { label: 'Registro',   icon: 'person_add',     bg: 'bg-emerald-50',    text: 'text-emerald-700', border: 'border-emerald-200' },
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || {}
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: type === 'rate' ? "'FILL' 1" : "'FILL' 0" }}>
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  )
}

function RateStars({ value }) {
  const num = parseFloat(value)
  return (
    <span className="flex items-center gap-1 font-label text-sm font-bold text-[#795e38]">
      <span className="material-symbols-outlined text-base text-[#E5B02E]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      {num}/5
    </span>
  )
}

function StatCard({ icon, label, value, dark = false }) {
  return (
    <div className={`p-6 relative overflow-hidden ${dark ? 'bg-[#412817] text-white' : 'bg-[#f7f3ea]'}`}>
      <p className={`font-label text-[10px] tracking-[0.2em] uppercase mb-2 ${dark ? 'text-white/70' : 'text-[#50453e]'}`}>
        {label}
      </p>
      <h3 className={`text-4xl font-serif font-bold ${dark ? 'text-white' : 'text-[#412817]'}`}>
        {value}
      </h3>
      <span className={`material-symbols-outlined absolute -right-4 -bottom-4 text-[80px] ${dark ? 'opacity-10' : 'opacity-5'}`}>
        {icon}
      </span>
    </div>
  )
}

export default function AdminDashboard() {
  const [totalBooks, setTotalBooks] = useState('—')
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [activity, setActivity] = useState(MOCK_ACTIVITY)

  const newUsersLastMonth = getMockNewUsersLastMonth()

  useEffect(() => {
    const fetchTotalBooks = async () => {
      try {
        const { data } = await getBooks({ page: 1 })
        setTotalBooks(data.length)
      } catch (err) {
        console.error(err)
        setTotalBooks('—')
      } finally {
        setLoadingBooks(false)
      }
    }
    fetchTotalBooks()
  }, [])

  const handleDeleteActivity = (id) => {
    setActivity((prev) => prev.filter((a) => a.id !== id))
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-8 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <span className="font-label text-xs uppercase tracking-[0.2em] text-[#50453e] mb-2 block">
          Overview
        </span>
        <h2 className="text-4xl font-serif font-black text-[#412817] leading-tight">
          Dashboard
        </h2>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon="auto_stories" label="Total de Libros" value={loadingBooks ? '...' : totalBooks} />
        <StatCard icon="group" label="Usuarios Nuevos (último mes)" value={newUsersLastMonth} dark />
        <div className="bg-white p-6 border border-[#d3c3bb]/30 relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase mb-2">Próximamente</p>
            <h3 className="text-3xl font-serif font-bold text-[#412817]">—</h3>
          </div>
          <p className="font-body text-xs text-[#82746d] mt-4 italic">Más métricas disponibles pronto.</p>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[80px] opacity-5 text-[#412817]">bar_chart</span>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-12">
        <h3 className="font-serif font-bold text-xl text-[#412817] mb-4 border-b border-[#d3c3bb]/20 pb-2">
          Accesos Rápidos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="/admin/books" className="group flex items-center gap-4 p-5 bg-[#f7f3ea] hover:bg-[#ece8df] transition-colors">
            <span className="material-symbols-outlined text-3xl text-[#745a34] group-hover:scale-110 transition-transform">menu_book</span>
            <div>
              <p className="font-serif font-bold text-[#412817]">Gestión de Libros</p>
              <p className="font-body text-sm text-[#50453e]">Agregar, editar o eliminar libros</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-[#d3c3bb] group-hover:text-[#745a34] transition-colors">arrow_forward</span>
          </a>
          <a href="/admin/users" className="group flex items-center gap-4 p-5 bg-[#f7f3ea] hover:bg-[#ece8df] transition-colors">
            <span className="material-symbols-outlined text-3xl text-[#745a34] group-hover:scale-110 transition-transform">group</span>
            <div>
              <p className="font-serif font-bold text-[#412817]">Gestión de Usuarios</p>
              <p className="font-body text-sm text-[#50453e]">Ver y administrar usuarios</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-[#d3c3bb] group-hover:text-[#745a34] transition-colors">arrow_forward</span>
          </a>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-end justify-between mb-4 border-b border-[#d3c3bb]/20 pb-2">
          <h3 className="font-serif font-bold text-xl text-[#412817]">Actividad Reciente</h3>
          <span className="font-label text-[10px] uppercase tracking-widest text-[#82746d]">Últimas {activity.length} actividades</span>
        </div>

        <div className="overflow-x-auto rounded">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#f7f3ea]">
                <th className="px-5 py-3 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30 whitespace-nowrap">Acción</th>
                <th className="px-5 py-3 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30 whitespace-nowrap">Usuario</th>
                <th className="px-5 py-3 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30">Valor</th>
                <th className="px-5 py-3 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30 whitespace-nowrap">Fecha</th>
                <th className="px-5 py-3 font-label text-[10px] tracking-[0.2em] text-[#50453e] uppercase border-b border-[#d3c3bb]/30 text-right whitespace-nowrap">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((item, i) => (
                <tr key={item.id} className={`group transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fdf9f0]'} hover:bg-[#f7f3ea]`}>
                  {/* Tipo */}
                  <td className="px-5 py-4 border-b border-[#d3c3bb]/10 whitespace-nowrap">
                    <TypeBadge type={item.type} />
                  </td>

                  {/* Usuario */}
                  <td className="px-5 py-4 border-b border-[#d3c3bb]/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {item.user.charAt(0)}
                      </div>
                      <span className="font-body text-sm text-[#412817] whitespace-nowrap">{item.user}</span>
                    </div>
                  </td>

                  {/* Valor */}
                  <td className="px-5 py-4 border-b border-[#d3c3bb]/10 max-w-xs">
                    {item.type === 'comentario' && (
                      <p className="font-body text-sm text-[#50453e] truncate max-w-[260px]" title={item.value}>
                        "{item.value}"
                      </p>
                    )}
                    {item.type === 'rate' && <RateStars value={item.value} />}
                    {item.type === 'registro' && (
                      <span className="font-mono text-xs text-[#82746d] bg-[#f7f3ea] px-2 py-1 rounded">
                        {item.value}
                      </span>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="px-5 py-4 border-b border-[#d3c3bb]/10 whitespace-nowrap">
                    <span className="font-body text-xs text-[#82746d]">{formatDate(item.date)}</span>
                  </td>

                  {/* Eliminar */}
                  <td className="px-5 py-4 border-b border-[#d3c3bb]/10 text-right">
                    {item.type === 'comentario' && (
                      <button
                        onClick={() => handleDeleteActivity(item.id)}
                        title="Eliminar comentario"
                        className="text-[#ba1a1a]/60 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 p-1.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    )}
                    {item.type === 'rate' && (
                      <span className="text-xs font-label text-[#d3c3bb] uppercase tracking-wider">—</span>
                    )}
                    {item.type === 'registro' && (
                      <button
                        disabled
                        title="No es posible eliminar registros"
                        className="text-[#d3c3bb] p-1.5 rounded-full cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-body text-[#82746d] italic mt-3 px-1">
          * Datos de ejemplo. Se conectará a la API en una siguiente etapa.
        </p>
      </section>
    </div>
  )
}
