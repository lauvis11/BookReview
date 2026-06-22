import { useEffect, useRef } from 'react'
import { Book } from 'lucide-react'
import ChatMessage from './ChatMessage'

export default function ChatMessages({ messages, loading }) {
  const bottomRef = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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

      {/* Lista de mensajes */}
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} />
      ))}

      {/* Indicador de escritura */}
      {loading && (
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
