import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'

export default function ChatMessages({ messages, loading }) {
  const bottomRef = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Mostrar el typing indicator solo si loading=true Y el último mensaje del modelo está vacío
  const lastMsg = messages[messages.length - 1]
  const showTyping = loading && (!lastMsg || lastMsg.role !== 'model' || lastMsg.text === '')

  return (
    <div className="chat-messages-area" role="log" aria-label="Conversación con Lib" aria-live="polite">
      {/* Mensaje de bienvenida cuando no hay mensajes */}
      {messages.length === 0 && !loading && (
        <div className="chat-welcome">
          <div className="chat-welcome-icon" aria-hidden="true">
            <img src="/foto-de-asistente-lib.webp" alt="Lib" className="w-full h-full object-cover rounded-full" />
          </div>
          <h3>¡Hola! Soy Lib</h3>
          <p>
            El asistente de BookReview. Puedo ayudarte a descubrir libros,
            hablar de reseñas o recomendarte tu próxima lectura.
          </p>
        </div>
      )}

      {/* Lista de mensajes — se omiten los del modelo aún sin texto (esperando primer chunk) */}
      {messages.map((msg, index) => {
        if (msg.role === 'model' && msg.text === '') return null
        return (
          <ChatMessage key={index} message={msg} isStreaming={loading && index === messages.length - 1 && msg.role === 'model'} />
        )
      })}

      {/* Indicador de escritura — solo mientras espera el primer chunk */}
      {showTyping && (
        <div className="typing-indicator" aria-label="Lib está escribiendo">
          <div className="chat-msg-avatar" aria-hidden="true">
            <img src="/foto-de-asistente-lib.webp" alt="Lib" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {/* Ancla para el auto-scroll */}
      <div ref={bottomRef} />
    </div>
  )
}
