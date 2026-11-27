import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from 'react'
import { ArrowUp } from 'lucide-react'

const ChatInput = forwardRef(function ChatInput({ onSend, loading }, ref) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  // Auto-resize exacto: 22px en una sola línea cuando está vacío; crece solo al escribir
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    if (!text) {
      el.style.height = '22px'
      el.style.overflowY = 'hidden'
      return
    }
    el.style.height = '22px'
    const nextHeight = Math.min(el.scrollHeight, 120)
    el.style.height = `${nextHeight}px`
    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden'
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '22px'
      textareaRef.current.style.overflowY = 'hidden'
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
          aria-label="Escribí tu mensaje para Lib"
        />
        <button
          id="chat-send-btn"
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          title="Enviar"
        >
          <ArrowUp size={17} strokeWidth={2.2} absoluteStrokeWidth aria-hidden="true" />
        </button>
      </div>
    </div>
  )
})

export default ChatInput
