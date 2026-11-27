import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Users,
  ChevronRight,
  MessageSquare,
  Star,
  UserPlus,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { getBooks } from '../api/books'

// Placeholder - replace with real API call when backend is ready
const getMockNewUsersLastMonth = () => 12

// Hardcoded recent activity - replace with API when ready
const MOCK_ACTIVITY = [
  { id: 1, type: 'comentario', user: 'María García', value: 'Me encantó este libro, la narrativa es increíble.', date: '2026-06-18T11:45:00' },
  { id: 2, type: 'rate', user: 'Carlos López', value: '4.5', date: '2026-06-18T11:30:00' },
  { id: 3, type: 'registro', user: 'Lucía Fernández', value: 'usr_lf8823', date: '2026-06-18T10:55:00' },
  { id: 4, type: 'comentario', user: 'Pedro Sánchez', value: 'Muy recomendable, aunque el final fue apresurado.', date: '2026-06-18T10:20:00' },
  { id: 5, type: 'rate', user: 'Ana Martínez', value: '5', date: '2026-06-18T09:50:00' },
  { id: 6, type: 'registro', user: 'Tomás Herrera', value: 'usr_th4491', date: '2026-06-18T09:10:00' },
  { id: 7, type: 'comentario', user: 'Valentina Ruiz', value: 'No me convenció del todo, esperaba más desarrollo.', date: '2026-06-17T22:30:00' },
  { id: 8, type: 'rate', user: 'Marcos Silva', value: '3', date: '2026-06-17T21:15:00' },
  { id: 9, type: 'registro', user: 'Sofía Romero', value: 'usr_sr0076', date: '2026-06-17T20:05:00' },
  { id: 10, type: 'comentario', user: 'Julián Castro', value: 'Un clásico que todo el mundo debería leer al menos una vez.', date: '2026-06-17T18:40:00' },
]

const TYPE_CONFIG = {
  comentario: {
    label: 'Comentario',
    icon: MessageSquare,
    pill: 'bg-[#e3eee9] text-[#0e5146] dark:bg-[#166e5e]/25 dark:text-[#98ded0]',
  },
  rate: {
    label: 'Calificación',
    icon: Star,
    pill: 'bg-[#f7e4cd] text-[#7a4d16] dark:bg-[#edbd79]/15 dark:text-[#edbd79]',
  },
  registro: {
    label: 'Registro',
    icon: UserPlus,
    pill: 'bg-[#ebf0e9] text-[#4a615b] dark:bg-white/[0.08] dark:text-[#a6b7b1]',
  },
}

const AVATAR_TONES = [
  'bg-[#e3eee9] text-[#0e5146] dark:bg-[#166e5e]/30 dark:text-[#a8e2d4]',
  'bg-[#f7e4cd] text-[#7a4d16] dark:bg-[#edbd79]/20 dark:text-[#edbd79]',
  'bg-[#e6ece4] text-[#18332f] dark:bg-[#243934] dark:text-[#d6e4df]',
]

function getAvatarTone(name) {
  const code = name ? name.charCodeAt(0) : 0
  return AVATAR_TONES[code % AVATAR_TONES.length]
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span
      style={{ borderRadius: '9999px' }}
      className={`inline-flex items-center gap-1.5 ps-2.5 pe-3 py-1 text-xs font-medium whitespace-nowrap ${cfg.pill}`}
    >
      <Icon
        size={12}
        strokeWidth={1.75}
        absoluteStrokeWidth
        className={type === 'rate' ? 'fill-current' : ''}
      />
      <span>{cfg.label}</span>
    </span>
  )
}

function RateStars({ value }) {
  const num = parseFloat(value)
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7a4d16] dark:text-[#edbd79] tabular-nums">
      <Star
        size={14}
        strokeWidth={1.75}
        absoluteStrokeWidth
        className="fill-[#c9833b] text-[#c9833b] dark:fill-[#edbd79] dark:text-[#edbd79]"
      />
      <span>{num}</span>
      <span className="text-xs font-normal text-[#5d726c] dark:text-[#a6b7b1]">/ 5</span>
    </span>
  )
}

export default function AdminDashboard() {
  const [recentBooks, setRecentBooks] = useState([])
  const [totalBooks, setTotalBooks] = useState(null)
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [booksError, setBooksError] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [activity, setActivity] = useState(MOCK_ACTIVITY)

  const newUsersLastMonth = getMockNewUsersLastMonth()

  useEffect(() => {
    let cancelled = false
    getBooks({ page: 1 })
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setTotalBooks(list.length)
        setRecentBooks(list.slice(0, 5))
        setBooksError(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setTotalBooks(null)
        setRecentBooks([])
        setBooksError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingBooks(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshTick])

  const handleRefresh = () => {
    setLoadingBooks(true)
    setBooksError(false)
    setRefreshTick((t) => t + 1)
  }

  const handleDeleteActivity = (id) => {
    setActivity((prev) => prev.filter((a) => a.id !== id))
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    const day = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
    const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    return `${day}, ${time}`
  }

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-hero-display text-3xl sm:text-[34px] font-semibold tracking-tight text-[#0e5146] dark:text-[#f0ede6] leading-tight">
            Panel general
          </h1>
          <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-1">
            Resumen del catálogo editorial y actividad de la comunidad.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingBooks}
            aria-label="Actualizar datos del catálogo"
            className="h-9 ps-3 pe-3.5 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/12 dark:border-[#293e38] text-sm font-medium text-[#4a615b] dark:text-[#a6b7b1] hover:text-[#18332f] dark:hover:text-[#f0ede6] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] inline-flex items-center gap-2 transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
          >
            <RefreshCw
              size={14}
              strokeWidth={1.75}
              absoluteStrokeWidth
              className={loadingBooks ? 'animate-spin' : ''}
            />
            <span>Actualizar</span>
          </button>

          <Link
            to="/admin/books"
            className="h-9 px-4 rounded-xl bg-[#0e5146] hover:bg-[#0c453c] dark:bg-[#166e5e] dark:hover:bg-[#1b806e] text-white text-sm font-semibold inline-flex items-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40 dark:focus-visible:ring-[#edbd79]/40"
          >
            <span>Gestionar libros</span>
          </Link>
        </div>
      </header>

      {/* Minimalist Divided KPI Strip */}
      <section aria-label="Indicadores principales">
        <div className="bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.08] dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#18332f]/[0.08] dark:divide-white/[0.08]">
          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
              Libros en primera página
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {loadingBooks ? (
                <div className="h-8 w-16 rounded-lg bg-[#ebf0e9] dark:bg-[#192824] animate-pulse" />
              ) : (
                <p className="text-[28px] font-semibold tracking-tight text-[#18332f] dark:text-[#f0ede6] tabular-nums leading-none">
                  {totalBooks !== null ? totalBooks : '—'}
                </p>
              )}
              <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                {booksError ? 'sin conexión' : 'títulos cargados'}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
              Nuevos lectores (último mes)
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-[28px] font-semibold tracking-tight text-[#18332f] dark:text-[#f0ede6] tabular-nums leading-none">
                {newUsersLastMonth}
              </p>
              <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                datos de muestra
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
              Eventos recientes
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-[28px] font-semibold tracking-tight text-[#18332f] dark:text-[#f0ede6] tabular-nums leading-none">
                {activity.length}
              </p>
              <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1]">
                en cola de revisión
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section aria-labelledby="quick-access-heading" className="space-y-3">
        <h2
          id="quick-access-heading"
          className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]"
        >
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/books"
            className="group flex items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] hover:border-[#0e5146]/25 dark:hover:border-[#edbd79]/30 hover:bg-[#fdfcf9] dark:hover:bg-[#192824] transition-[background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4ef] dark:bg-[#192824] border border-[#18332f]/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#0e5146] dark:text-[#edbd79] shrink-0">
                <BookOpen size={18} strokeWidth={1.75} absoluteStrokeWidth />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                  Gestión de libros
                </p>
                <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] mt-0.5 truncate">
                  Importar de Google Books, editar fichas o eliminar títulos
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.75}
              absoluteStrokeWidth
              className="text-[#5d726c] group-hover:text-[#0e5146] dark:text-[#a6b7b1] dark:group-hover:text-[#edbd79] shrink-0 transition-colors duration-150"
            />
          </Link>

          <Link
            to="/admin/users"
            className="group flex items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#131f1c] border border-[#18332f]/[0.08] dark:border-white/[0.08] hover:border-[#0e5146]/25 dark:hover:border-[#edbd79]/30 hover:bg-[#fdfcf9] dark:hover:bg-[#192824] transition-[background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e5146]/40"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f3f4ef] dark:bg-[#192824] border border-[#18332f]/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[#0e5146] dark:text-[#edbd79] shrink-0">
                <Users size={18} strokeWidth={1.75} absoluteStrokeWidth />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                  Gestión de usuarios
                </p>
                <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] mt-0.5 truncate">
                  Consultar miembros registrados y administrar roles
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              strokeWidth={1.75}
              absoluteStrokeWidth
              className="text-[#5d726c] group-hover:text-[#0e5146] dark:text-[#a6b7b1] dark:group-hover:text-[#edbd79] shrink-0 transition-colors duration-150"
            />
          </Link>
        </div>
      </section>

      {/* Catalog Preview (Live Data) */}
      <section aria-labelledby="recent-books-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="recent-books-heading"
            className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]"
          >
            Libros en el catálogo
          </h2>
          <Link
            to="/admin/books"
            className="text-xs font-medium text-[#0e5146] dark:text-[#edbd79] hover:underline underline-offset-4"
          >
            Ver todos
          </Link>
        </div>

        <div className="bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.08] dark:border-white/[0.08] overflow-hidden">
          {loadingBooks ? (
            <div className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 px-5 py-3.5 animate-pulse">
                  <div className="w-8 aspect-[2/3] rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-44 rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                    <div className="h-3 w-28 rounded bg-[#ebf0e9] dark:bg-[#192824]" />
                  </div>
                </div>
              ))}
            </div>
          ) : booksError ? (
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-[#4a615b] dark:text-[#a6b7b1]">
                <AlertCircle
                  size={16}
                  strokeWidth={1.75}
                  absoluteStrokeWidth
                  className="text-[#ba1a1a] dark:text-[#f87171] shrink-0"
                />
                <span>No pudimos cargar el listado de libros en este momento.</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="text-xs font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline self-start sm:self-auto cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : recentBooks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1]">
                Todavía no hay libros cargados en el catálogo.
              </p>
              <Link
                to="/admin/books"
                className="inline-block mt-2 text-xs font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline"
              >
                Agregar el primer libro
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
              {recentBooks.map((book) => (
                <li
                  key={book.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#f8f7f2]/70 dark:hover:bg-[#192824]/60 transition-colors duration-100"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-8 aspect-[2/3] rounded bg-[#e7ece5] dark:bg-[#192824] shrink-0 overflow-hidden">
                      {book.img ? (
                        <img
                          src={book.img}
                          alt={book.title}
                          className="w-full h-full object-cover rounded outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]">
                          <BookOpen size={13} strokeWidth={1.5} absoluteStrokeWidth />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#18332f] dark:text-[#f0ede6] truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] truncate">
                        {Array.isArray(book.author) ? book.author.join(', ') : book.author || 'Autor sin especificar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {book.editorial && (
                      <span className="hidden sm:inline text-xs text-[#5d726c] dark:text-[#a6b7b1] max-w-[160px] truncate">
                        {book.editorial}
                      </span>
                    )}
                    <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                      {book.year || '—'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section aria-labelledby="recent-activity-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="recent-activity-heading"
            className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]"
          >
            Actividad reciente
          </h2>
          <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
            {activity.length} {activity.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.08] dark:border-white/[0.08] overflow-hidden">
          {activity.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5d726c] dark:text-[#a6b7b1]">
              No hay eventos pendientes en la lista de actividad.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#18332f]/[0.08] dark:border-white/[0.08]">
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Tipo
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Usuario
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Detalle
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] text-right">
                        Fecha
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                    {activity.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#f8f7f2]/70 dark:hover:bg-[#192824]/60 transition-colors duration-100"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <TypeBadge type={item.type} />
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              style={{ borderRadius: '9999px' }}
                              className={`w-7 h-7 text-xs font-semibold flex items-center justify-center shrink-0 ${getAvatarTone(item.user)}`}
                            >
                              {item.user.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#18332f] dark:text-[#f0ede6]">
                              {item.user}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          {item.type === 'comentario' && (
                            <p
                              className="text-sm text-[#4a615b] dark:text-[#a6b7b1] truncate max-w-[280px]"
                              title={item.value}
                            >
                              “{item.value}”
                            </p>
                          )}
                          {item.type === 'rate' && <RateStars value={item.value} />}
                          {item.type === 'registro' && (
                            <code className="text-xs font-mono text-[#5d726c] dark:text-[#a6b7b1] bg-[#f3f4ef] dark:bg-[#192824] px-2 py-0.5 rounded-md">
                              {item.value}
                            </code>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                            {formatDate(item.date)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {item.type === 'comentario' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(item.id)}
                              aria-label={`Eliminar comentario de ${item.user}`}
                              title="Eliminar comentario"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#5d726c] hover:text-[#ba1a1a] hover:bg-[#ffedea] dark:text-[#a6b7b1] dark:hover:text-[#f87171] dark:hover:bg-[#3a181c] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                            >
                              <Trash2 size={15} strokeWidth={1.75} absoluteStrokeWidth />
                            </button>
                          ) : (
                            <span className="text-xs text-[#5d726c]/60 dark:text-[#a6b7b1]/50 px-2">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked List */}
              <ul className="md:hidden divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                {activity.map((item) => (
                  <li key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          style={{ borderRadius: '9999px' }}
                          className={`w-7 h-7 text-xs font-semibold flex items-center justify-center shrink-0 ${getAvatarTone(item.user)}`}
                        >
                          {item.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#18332f] dark:text-[#f0ede6] truncate">
                          {item.user}
                        </span>
                      </div>
                      <TypeBadge type={item.type} />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {item.type === 'comentario' && (
                          <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] line-clamp-2">
                            “{item.value}”
                          </p>
                        )}
                        {item.type === 'rate' && <RateStars value={item.value} />}
                        {item.type === 'registro' && (
                          <code className="text-xs font-mono text-[#5d726c] dark:text-[#a6b7b1] bg-[#f3f4ef] dark:bg-[#192824] px-2 py-0.5 rounded-md">
                            {item.value}
                          </code>
                        )}
                        <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums mt-1">
                          {formatDate(item.date)}
                        </p>
                      </div>

                      {item.type === 'comentario' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(item.id)}
                          aria-label={`Eliminar comentario de ${item.user}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#ba1a1a] dark:text-[#f87171] hover:bg-[#ffedea] dark:hover:bg-[#3a181c] shrink-0 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] px-1">
          La actividad reciente muestra datos de muestra hasta conectar el servicio de eventos.
        </p>
      </section>
    </div>
  )
}
