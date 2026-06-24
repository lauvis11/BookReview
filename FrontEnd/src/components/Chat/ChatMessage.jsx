// Convierte el markdown básico de Gemini a JSX
function renderMarkdown(text) {
  const lines = text.split('\n')
  const result = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(<ul key={`list-${result.length}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>)
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    // Listas con - o *
    const listMatch = line.match(/^[\-\*]\s+(.+)/)
    if (listMatch) {
      const content = parseBold(listMatch[1])
      listItems.push(<li key={i}>{content}</li>)
      return
    }
    flushList()

    if (line.trim() === '') {
      result.push(<br key={i} />)
    } else {
      result.push(<p key={i} className="my-0.5">{parseBold(line)}</p>)
    }
  })

  flushList()
  return result
}

// Convierte **texto** en <strong>
function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function ChatMessage({ message, isStreaming }) {
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
        {isUser ? message.text : renderMarkdown(message.text)}
        {/* Cursor parpadeante mientras hace streaming */}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  )
}
