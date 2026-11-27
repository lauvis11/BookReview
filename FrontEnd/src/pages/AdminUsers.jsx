import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ShieldCheck,
  UserCog,
  Trash2,
  Info,
  X,
  AlertTriangle,
  Users,
} from 'lucide-react'

// Datos de muestra mientras se conecta el endpoint de gestión de usuarios
const INITIAL_USERS = [
  { id: '1', name: 'María García', email: 'maria@example.com', role: 'user', joined: '2026-05-20' },
  { id: '2', name: 'Carlos López', email: 'carlos@example.com', role: 'user', joined: '2026-06-01' },
  { id: '3', name: 'Ana Martínez', email: 'ana@example.com', role: 'admin', joined: '2026-01-10' },
  { id: '4', name: 'Pedro Sánchez', email: 'pedro@example.com', role: 'user', joined: '2026-06-15' },
]

const ROLE_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'admin', label: 'Admin' },
  { key: 'user', label: 'Lector' },
]

const AVATAR_TONES = [
  'bg-[#e3eee9] text-[#0e5146] dark:bg-[#166e5e]/30 dark:text-[#a8e2d4]',
  'bg-[#f7e4cd] text-[#7a4d16] dark:bg-[#edbd79]/20 dark:text-[#edbd79]',
  'bg-[#e6ece4] text-[#18332f] dark:bg-[#243934] dark:text-[#d6e4df]',
]

function getAvatarTone(name) {
  const code = name ? name.charCodeAt(0) : 0
  return AVATAR_TONES[code % AVATAR_TONES.length]
}

export default function AdminUsers() {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pendingAction, setPendingAction] = useState(null) // { type: 'role' | 'delete', user }

  useEffect(() => {
    if (!pendingAction) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPendingAction(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingAction])

  const counts = useMemo(() => {
    const adminCount = users.filter((u) => u.role === 'admin').length
    return {
      all: users.length,
      admin: adminCount,
      user: users.length - adminCount,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      const nameMatch = u.name?.toLowerCase().includes(q)
      const emailMatch = u.email?.toLowerCase().includes(q)
      return nameMatch || emailMatch
    })
  }, [users, searchQuery, roleFilter])

  const handleConfirmAction = () => {
    if (!pendingAction) return
    if (pendingAction.type === 'role') {
      const nextRole = pendingAction.user.role === 'admin' ? 'user' : 'admin'
      setUsers((prev) =>
        prev.map((u) => (u.id === pendingAction.user.id ? { ...u, role: nextRole } : u)),
      )
    } else if (pendingAction.type === 'delete') {
      setUsers((prev) => prev.filter((u) => u.id !== pendingAction.user.id))
    }
    setPendingAction(null)
  }

  const formatJoinDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-hero-display text-3xl sm:text-[34px] font-semibold tracking-tight text-[#0e5146] dark:text-[#f0ede6] leading-tight">
            Usuarios
          </h1>
          <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-1">
            Revisá los miembros de BookReview y gestioná sus permisos de acceso.
          </p>
        </div>

        <p className="text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
          {counts.all} {counts.all === 1 ? 'miembro' : 'miembros'} · {counts.admin}{' '}
          {counts.admin === 1 ? 'admin' : 'admins'}
        </p>
      </header>

      {/* Quiet Preview Notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#fffbeb] dark:bg-[#292214] border border-[#fde68a] dark:border-[#edbd79]/25 text-xs text-[#7a4d16] dark:text-[#edbd79]">
        <Info
          size={15}
          strokeWidth={1.75}
          absoluteStrokeWidth
          className="shrink-0 mt-0.5"
        />
        <p className="leading-relaxed">
          Vista previa con datos de muestra. Los cambios de rol o bajas se aplican solo en esta sesión hasta conectar la API de usuarios.
        </p>
      </div>

      {/* Search & Role Filter */}
      <section aria-label="Filtros de usuarios" className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Segmented Control (Concentric radii: outer 12px, padding 4px, inner 8px) */}
        <div
          role="group"
          aria-label="Filtrar por rol"
          className="inline-flex p-1 rounded-xl bg-[#ecefe9] dark:bg-[#131f1c] border border-[#18332f]/[0.07] dark:border-white/[0.08] self-start"
        >
          {ROLE_FILTERS.map((f) => {
            const selected = roleFilter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setRoleFilter(f.key)}
                aria-pressed={selected}
                className={`h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-[color,background-color,box-shadow] duration-150 ease-out cursor-pointer ${
                  selected
                    ? 'bg-white text-[#0e5146] shadow-[0_1px_2px_rgba(24,51,47,0.08)] dark:bg-[#192824] dark:text-[#f0ede6] dark:shadow-none'
                    : 'text-[#4a615b] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6]'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[11px] opacity-70 tabular-nums">{counts[f.key]}</span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            strokeWidth={1.75}
            absoluteStrokeWidth
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5d726c] dark:text-[#a6b7b1] pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            aria-label="Buscar usuarios por nombre o correo"
            className="w-full h-10 rounded-xl bg-white dark:bg-[#131f1c] border border-[#18332f]/15 dark:border-[#293e38] pl-9 pr-9 text-sm text-[#18332f] dark:text-[#f0ede6] placeholder:text-[#5d726c]/70 dark:placeholder:text-[#a6b7b1]/60 focus:outline-none focus:border-[#0e5146] dark:focus:border-[#edbd79] focus:ring-2 focus:ring-[#0e5146]/15 dark:focus:ring-[#edbd79]/20 transition-[border-color,box-shadow] duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-[#5d726c] hover:text-[#18332f] dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] cursor-pointer"
            >
              <X size={14} strokeWidth={1.75} absoluteStrokeWidth />
            </button>
          )}
        </div>
      </section>

      {/* Users Table / List */}
      <section aria-label="Listado de usuarios">
        <div className="bg-white dark:bg-[#131f1c] rounded-2xl border border-[#18332f]/[0.08] dark:border-white/[0.08] overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-2.5">
              <div
                style={{ borderRadius: '9999px' }}
                className="w-11 h-11 mx-auto bg-[#f3f4ef] dark:bg-[#192824] flex items-center justify-center text-[#5d726c] dark:text-[#a6b7b1]"
              >
                <Users size={20} strokeWidth={1.5} absoluteStrokeWidth />
              </div>
              <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                No encontramos usuarios con ese criterio
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setRoleFilter('all')
                }}
                className="text-xs font-semibold text-[#0e5146] dark:text-[#edbd79] hover:underline cursor-pointer"
              >
                Mostrar todos los usuarios
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#18332f]/[0.08] dark:border-white/[0.08]">
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Usuario
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Correo electrónico
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1]">
                        Rol
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] text-right">
                        Registro
                      </th>
                      <th className="px-5 py-3 text-xs font-medium text-[#5d726c] dark:text-[#a6b7b1] text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                    {filteredUsers.map((user) => {
                      const isAdmin = user.role === 'admin'
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-[#f8f7f2]/80 dark:hover:bg-[#192824]/60 transition-colors duration-100"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {user.profile_img ? (
                                <img
                                  src={user.profile_img}
                                  alt={user.name}
                                  style={{ borderRadius: '9999px' }}
                                  className="w-9 h-9 object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                                />
                              ) : (
                                <div
                                  style={{ borderRadius: '9999px' }}
                                  className={`w-9 h-9 text-sm font-semibold flex items-center justify-center shrink-0 ${getAvatarTone(user.name)}`}
                                >
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6]">
                                {user.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="text-sm text-[#4a615b] dark:text-[#a6b7b1]">
                              {user.email || '—'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            {isAdmin ? (
                              <span
                                style={{ borderRadius: '9999px' }}
                                className="inline-flex items-center gap-1.5 ps-2.5 pe-3 py-1 text-xs font-medium bg-[#0e5146] text-[#edbd79] dark:bg-[#166e5e]/35 dark:text-[#edbd79]"
                              >
                                <ShieldCheck size={13} strokeWidth={2} absoluteStrokeWidth />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span
                                style={{ borderRadius: '9999px' }}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[#f3f4ef] text-[#4a615b] dark:bg-white/[0.07] dark:text-[#a6b7b1]"
                              >
                                Lector
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <span className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums">
                              {formatJoinDate(user.joined)}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPendingAction({ type: 'role', user })}
                                aria-label={`Cambiar rol de ${user.name}`}
                                title={isAdmin ? 'Cambiar a Lector' : 'Promover a Admin'}
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#5d726c] hover:text-[#0e5146] hover:bg-[#e3eee9]/70 dark:text-[#a6b7b1] dark:hover:text-[#f0ede6] dark:hover:bg-white/[0.08] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                              >
                                <UserCog size={15} strokeWidth={1.75} absoluteStrokeWidth />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingAction({ type: 'delete', user })}
                                aria-label={`Eliminar a ${user.name}`}
                                title="Eliminar usuario"
                                className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-[#5d726c] hover:text-[#ba1a1a] hover:bg-[#ffedea] dark:text-[#a6b7b1] dark:hover:text-[#f87171] dark:hover:bg-[#3a181c] transition-[color,background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                              >
                                <Trash2 size={15} strokeWidth={1.75} absoluteStrokeWidth />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked List */}
              <ul className="md:hidden divide-y divide-[#18332f]/[0.06] dark:divide-white/[0.06]">
                {filteredUsers.map((user) => {
                  const isAdmin = user.role === 'admin'
                  return (
                    <li key={user.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {user.profile_img ? (
                          <img
                            src={user.profile_img}
                            alt={user.name}
                            style={{ borderRadius: '9999px' }}
                            className="w-10 h-10 object-cover shrink-0 outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                          />
                        ) : (
                          <div
                            style={{ borderRadius: '9999px' }}
                            className={`w-10 h-10 text-sm font-semibold flex items-center justify-center shrink-0 ${getAvatarTone(user.name)}`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#18332f] dark:text-[#f0ede6] truncate">
                              {user.name}
                            </p>
                            {isAdmin ? (
                              <span
                                style={{ borderRadius: '9999px' }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#0e5146] text-[#edbd79] dark:bg-[#166e5e]/35 dark:text-[#edbd79] shrink-0"
                              >
                                <ShieldCheck size={11} strokeWidth={2} absoluteStrokeWidth />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span
                                style={{ borderRadius: '9999px' }}
                                className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-[#f3f4ef] text-[#4a615b] dark:bg-white/[0.07] dark:text-[#a6b7b1] shrink-0"
                              >
                                Lector
                              </span>
                            )}
                          </div>
                          {user.email && (
                            <p className="text-xs text-[#4a615b] dark:text-[#a6b7b1] truncate mt-0.5">
                              {user.email}
                            </p>
                          )}
                          <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums mt-0.5">
                            Registrado el {formatJoinDate(user.joined)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPendingAction({ type: 'role', user })}
                          aria-label={`Cambiar rol de ${user.name}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#4a615b] dark:text-[#a6b7b1] hover:bg-[#f3f4ef] dark:hover:bg-[#192824] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                        >
                          <UserCog size={16} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAction({ type: 'delete', user })}
                          aria-label={`Eliminar a ${user.name}`}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#ba1a1a] dark:text-[#f87171] hover:bg-[#ffedea] dark:hover:bg-[#3a181c] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.75} absoluteStrokeWidth />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        <p className="text-xs text-[#5d726c] dark:text-[#a6b7b1] tabular-nums mt-3 px-1">
          Mostrando {filteredUsers.length} de {users.length}{' '}
          {users.length === 1 ? 'usuario' : 'usuarios'}
        </p>
      </section>

      {/* Safe Confirmation Modal (Role Change or Delete) */}
      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c1412]/45 dark:bg-black/65 font-hero-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-action-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingAction(null)
          }}
        >
          <div className="bg-white dark:bg-[#131f1c] w-full max-w-md rounded-[20px] border border-[#18332f]/[0.09] dark:border-white/[0.1] shadow-[0_24px_60px_rgba(12,20,18,0.2)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-6 space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-start gap-3.5">
              <div
                style={{ borderRadius: '9999px' }}
                className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                  pendingAction.type === 'delete'
                    ? 'bg-[#ffedea] text-[#ba1a1a] dark:bg-[#3a181c] dark:text-[#f87171]'
                    : 'bg-[#e3eee9] text-[#0e5146] dark:bg-[#166e5e]/25 dark:text-[#edbd79]'
                }`}
              >
                {pendingAction.type === 'delete' ? (
                  <AlertTriangle size={18} strokeWidth={1.75} absoluteStrokeWidth />
                ) : (
                  <UserCog size={18} strokeWidth={1.75} absoluteStrokeWidth />
                )}
              </div>

              <div className="min-w-0">
                <h2
                  id="user-action-title"
                  className="text-base font-semibold text-[#18332f] dark:text-[#f0ede6]"
                >
                  {pendingAction.type === 'delete' ? 'Eliminar usuario' : 'Cambiar rol de usuario'}
                </h2>
                <p className="text-sm text-[#4a615b] dark:text-[#a6b7b1] mt-1 leading-relaxed">
                  {pendingAction.type === 'delete' ? (
                    <>
                      ¿Querés eliminar la cuenta de{' '}
                      <strong className="font-semibold text-[#18332f] dark:text-[#f0ede6]">
                        {pendingAction.user.name}
                      </strong>
                      {pendingAction.user.email ? ` (${pendingAction.user.email})` : ''}? Esta acción quita al usuario de la lista.
                    </>
                  ) : pendingAction.user.role === 'admin' ? (
                    <>
                      ¿Querés cambiar el rol de{' '}
                      <strong className="font-semibold text-[#18332f] dark:text-[#f0ede6]">
                        {pendingAction.user.name}
                      </strong>{' '}
                      a <strong className="font-semibold">Lector</strong>? Perderá acceso al panel de administración.
                    </>
                  ) : (
                    <>
                      ¿Querés otorgar permisos de{' '}
                      <strong className="font-semibold">Admin</strong> a{' '}
                      <strong className="font-semibold text-[#18332f] dark:text-[#f0ede6]">
                        {pendingAction.user.name}
                      </strong>
                      ? Podrá gestionar libros y usuarios.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="h-9 px-4 rounded-xl bg-white dark:bg-[#192824] border border-[#18332f]/15 dark:border-[#293e38] text-sm font-medium text-[#4a615b] dark:text-[#a6b7b1] hover:bg-[#f3f4ef] dark:hover:bg-[#223631] transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`h-9 px-4 rounded-xl text-white text-sm font-semibold transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer ${
                  pendingAction.type === 'delete'
                    ? 'bg-[#ba1a1a] hover:bg-[#9e1616]'
                    : 'bg-[#0e5146] hover:bg-[#0c453c] dark:bg-[#166e5e] dark:hover:bg-[#1b806e]'
                }`}
              >
                {pendingAction.type === 'delete' ? 'Eliminar usuario' : 'Confirmar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
