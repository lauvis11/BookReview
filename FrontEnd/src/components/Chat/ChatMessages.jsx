import { useEffect, useRef } from 'react'
import { ArrowUpRight, BookOpen, Compass } from 'lucide-react'
import AiSparkleIcon from '../ui/AiSparkleIcon'
import ChatMessage from './ChatMessage'

const QUICK_PROMPTS = [
  {
    icon: Compass,
    label: 'Novela atrapante para empezar hoy',
    prompt: 'Recomiéndame una novela atrapante y fácil de enganchar para empezar a leer hoy.',
  },
  {
    icon: BookOpen,
    label: 'Algo parecido a 1984 o distopías',
    prompt: '¿Qué libros parecidos a 1984 o distopías modernas me recomendás leer?',
  },
  {
    icon: AiSparkleIcon,
    label: 'Un libro corto para el fin de semana',
    prompt: 'Busco un libro corto, de menos de 250 páginas, ideal para leer en un fin de semana.',
  },
]

export default function ChatMessages({
  variant = 'side',
  messages,
  loading,
  userName,
  onSelectPrompt,
  welcomeInputSlot = null,
}) {
  const bottomRef = useRef(null)
  const isModal = variant === 'modal'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const lastMsg = messages[messages.length - 1]
  const showTyping = loading && (!lastMsg || lastMsg.role !== 'model' || lastMsg.text === '')
  const trimmedName = userName?.trim()

  return (
    <div
      className={`chat-messages-area ${isModal ? 'chat-messages-area--modal' : ''}`}
      role="log"
      aria-label="Conversación con Lib"
      aria-live="polite"
    >
      <div className={isModal ? 'chat-modal-column' : 'chat-side-column'}>
        {messages.length === 0 && !loading && (
          <div className={`chat-welcome ${isModal ? 'chat-welcome--modal' : ''}`}>
            <h3 className={`chat-welcome-title ${isModal ? 'chat-welcome-title--modal' : ''}`}>
              <span className="block">
                {trimmedName ? `¡Hola ${trimmedName}!` : '¡Hola!'}
              </span>
              <span className="block mt-1">
                ¿Qué te gustaría{' '}
                <span className="italic font-medium text-secondary-dark">leer hoy?</span>
              </span>
            </h3>

            {welcomeInputSlot && (
              <div className="chat-welcome-composer">{welcomeInputSlot}</div>
            )}

            <div className={`chat-quick-prompts ${isModal ? 'chat-quick-prompts--modal' : ''}`}>
              {QUICK_PROMPTS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onSelectPrompt?.(item.prompt)}
                    className="chat-quick-prompt-btn"
                  >
                    <span className="chat-quick-prompt-left">
                      <Icon
                        size={15}
                        strokeWidth={1.85}
                        absoluteStrokeWidth
                        aria-hidden="true"
                        className="text-primary/80 shrink-0"
                      />
                      <span>{item.label}</span>
                    </span>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.9}
                      absoluteStrokeWidth
                      aria-hidden="true"
                      className="chat-quick-prompt-arrow shrink-0"
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.role === 'model' && msg.text === '') return null
          return (
            <ChatMessage
              key={index}
              message={msg}
              isStreaming={loading && index === messages.length - 1 && msg.role === 'model'}
            />
          )
        })}

        {showTyping && (
          <div className="typing-indicator" aria-label="Lib está escribiendo">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
