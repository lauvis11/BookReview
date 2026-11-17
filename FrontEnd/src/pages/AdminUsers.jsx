// Página de Usuarios - por ahora solo estructura visual
// Los datos de la API se agregarán en una segunda etapa

const MOCK_USERS = [
  { id: '1', name: 'María García', email: 'maria@example.com', role: 'user', joined: '2026-05-20' },
  { id: '2', name: 'Carlos López', email: 'carlos@example.com', role: 'user', joined: '2026-06-01' },
  { id: '3', name: 'Ana Martínez', email: 'ana@example.com', role: 'admin', joined: '2026-01-10' },
  { id: '4', name: 'Pedro Sánchez', email: 'pedro@example.com', role: 'user', joined: '2026-06-15' },
]

export default function AdminUsers() {
  const users = MOCK_USERS

  return (
    <div className="p-8 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <span className="font-label text-xs uppercase tracking-[0.2em] text-[#4a615b] mb-2 block">
            Comunidad
          </span>
          <h2 className="text-4xl font-serif font-black text-[#0e5146] leading-tight">
            Gestión de Usuarios
          </h2>
        </div>
      </header>

      {/* Notice banner */}
      <div className="flex items-center gap-3 bg-[#f7e4cd]/30 border border-[#e9a45e]/30 px-5 py-3 rounded mb-8">
        <span className="material-symbols-outlined text-[#c9833b]">info</span>
        <p className="font-body text-sm text-[#4a615b]">
          Esta sección mostrará los datos reales de usuarios cuando se conecte la API.
        </p>
      </div>

      {/* Table */}
      <section>
        <div className="overflow-x-auto bg-[#f2f5f0]/50 rounded">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-[#f2f5f0]">
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#4a615b] uppercase border-b border-[#d2dcd6]/30">
                  Usuario
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#4a615b] uppercase border-b border-[#d2dcd6]/30">
                  Email
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#4a615b] uppercase border-b border-[#d2dcd6]/30">
                  Rol
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#4a615b] uppercase border-b border-[#d2dcd6]/30">
                  Registrado
                </th>
                <th className="px-6 py-4 font-label text-[10px] tracking-[0.2em] text-[#4a615b] uppercase border-b border-[#d2dcd6]/30 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-white transition-colors">
                  <td className="px-6 py-5 border-b border-[#d2dcd6]/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-serif font-bold text-[#0e5146] group-hover:text-[#c9833b] transition-colors">
                        {user.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 border-b border-[#d2dcd6]/10">
                    <p className="font-body text-sm text-[#4a615b]">{user.email}</p>
                  </td>
                  <td className="px-6 py-5 border-b border-[#d2dcd6]/10">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0e5146] text-[#edbd79] text-[10px] font-label uppercase tracking-wider rounded-full">
                        <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#f2f5f0] text-[#4a615b] text-[10px] font-label uppercase tracking-wider rounded-full border border-[#d2dcd6]/40">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 border-b border-[#d2dcd6]/10">
                    <p className="font-body text-sm text-[#4a615b]">
                      {new Date(user.joined).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-5 border-b border-[#d2dcd6]/10 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-[#0e5146]/40 hover:text-[#0e5146] hover:bg-[#f2f5f0] p-2 rounded-full transition-all duration-200 cursor-not-allowed"
                        title="Editar (próximamente)"
                        disabled
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="text-[#ba1a1a]/40 hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 p-2 rounded-full transition-all duration-200 cursor-not-allowed"
                        title="Eliminar (próximamente)"
                        disabled
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-body text-[#6c7f7a] italic mt-4 px-2">
          Mostrando {users.length} usuarios (datos de ejemplo)
        </p>
      </section>
    </div>
  )
}
