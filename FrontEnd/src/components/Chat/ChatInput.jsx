import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, loading }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize del textarea según contenido
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    onSend(trimmed)
    setText('')
    // Resetear altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e) {
    // Enter sin Shift → enviar
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Shift+Enter → salto de línea (comportamiento por defecto del textarea)
  }

  const canSend = text.trim().length > 0 && !loading

  return (
    <div className="chat-input-area">
      <div className="chat-input-row">
        <textarea
          id="chat-textarea"
          ref={textareaRef}
          className="chat-textarea"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Preguntale algo a Lib..."
          disabled={loading}
          aria-label="Escribe tu mensaje"
        />
        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          title="Enviar"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  )
}
