// Convierte el markdown básico de Gemini a JSX
function renderMarkdown(text) {
  const lines = text.split('\n')
  const result = []
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(
        <ul key={`list-${result.length}`} className="list-disc pl-4 space-y-1.5 my-2">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const listMatch = line.match(/^[-*]\s+(.+)/)
    if (listMatch) {
      const content = parseBold(listMatch[1])
      listItems.push(<li key={i}>{content}</li>)
      return
    }
    flushList()

    if (line.trim() === '') {
      result.push(<div key={i} className="h-2" aria-hidden="true" />)
    } else {
      result.push(
        <p key={i} className="my-0.5">
          {parseBold(line)}
        </p>
      )
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
      return (
        <strong key={i} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-msg-row ${message.role}`}>
      <div className="chat-bubble-text">
        {isUser ? message.text : renderMarkdown(message.text)}
        {isStreaming && (
          <span
            className="inline-block w-[2px] h-4 bg-primary/80 ml-1 align-middle animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}
