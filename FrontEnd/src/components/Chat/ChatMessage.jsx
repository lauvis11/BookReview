export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-msg-row ${message.role}`}>
      {/* Avatar solo para mensajes de Lib */}
      {!isUser && (
        <div className="chat-msg-avatar" aria-hidden="true">
          <img src="/foto-de-asistente-lib.webp" alt="Lib" className="w-full h-full object-cover rounded-full" />
        </div>
      )}

      <div className="chat-bubble-text">
        {message.text}
      </div>
    </div>
  )
}
