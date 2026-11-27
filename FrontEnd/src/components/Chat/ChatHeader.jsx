import { Maximize2, Minimize2, RotateCcw, X } from 'lucide-react'
import AiSparkleIcon from '../ui/AiSparkleIcon'

export default function ChatHeader({
  variant = 'side',
  loading,
  hasMessages,
  onClear,
  onExpand,
  onCollapseToSide,
  onClose,
}) {
  const isModal = variant === 'modal'

  return (
    <header className={`chat-header ${isModal ? 'chat-header--modal' : ''}`}>
      <div className="chat-header-brand">
        <span className="chat-header-sparkle" aria-hidden="true">
          <AiSparkleIcon size={isModal ? 19 : 18} />
        </span>

        <div className="chat-header-title-row">
          <span className="chat-header-name">Lib IA</span>
          <span className="chat-header-badge">Beta</span>
        </div>
      </div>

      <div className="chat-header-actions">
        {hasMessages && (
          <button
            type="button"
            className="chat-icon-btn"
            onClick={onClear}
            disabled={loading}
            aria-label="Nueva conversación"
            title="Nueva conversación"
          >
            <RotateCcw size={16} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
          </button>
        )}

        {isModal ? (
          <button
            id="chat-collapse-btn"
            type="button"
            className="chat-icon-btn hidden lg:inline-flex"
            onClick={onCollapseToSide}
            aria-label="Cambiar a panel lateral"
            title="Panel lateral"
          >
            <Minimize2 size={16} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
          </button>
        ) : (
          <button
            id="chat-expand-btn"
            type="button"
            className="chat-icon-btn"
            onClick={onExpand}
            aria-label="Abrir vista expandida"
            title="Vista expandida"
          >
            <Maximize2 size={16} strokeWidth={1.9} absoluteStrokeWidth aria-hidden="true" />
          </button>
        )}

        <button
          id={isModal ? 'chat-modal-close-btn' : 'chat-close-btn'}
          type="button"
          className="chat-icon-btn"
          onClick={onClose}
          aria-label="Cerrar chat"
          title="Cerrar (Esc)"
        >
          <X size={18} strokeWidth={1.95} absoluteStrokeWidth aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
