export default function ChatHeader({ loading, onClose }) {
  return (
    <div className="chat-header">

      {/* Info */}
      <div className="chat-header-info">
        <div className="chat-header-name">Lib</div>
        <div className="chat-header-subtitle">Asistente de BookReview</div>

        {/* Indicador de estado */}
        <div className="chat-status" role="status" aria-live="polite">
          <span className={`chat-status-dot ${loading ? 'typing' : ''}`} />
          <span className="chat-status-text">
            {loading ? 'Escribiendo...' : 'En línea'}
          </span>
        </div>
      </div>

      {/* Botón cerrar */}
      <button
        id="chat-close-btn"
        className="chat-close-btn"
        onClick={onClose}
        aria-label="Cerrar chat"
        title="Cerrar"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          close
        </span>
      </button>
    </div>
  )
}
