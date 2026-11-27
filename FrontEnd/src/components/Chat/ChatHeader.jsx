import { Maximize2, RotateCcw, X } from 'lucide-react'
import AiSparkleIcon from '../ui/AiSparkleIcon'

export default function ChatHeader({ loading, hasMessages, onClear, onExpand, onClose }) {
  return (
    <header className="chat-header">
      <div className="chat-header-brand">
        <span className="chat-header-sparkle" aria-hidden="true">
          <AiSparkleIcon size={18} />
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

        <button
          id="chat-close-btn"
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
