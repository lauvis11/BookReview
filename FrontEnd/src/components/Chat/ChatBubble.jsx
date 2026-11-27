import { useState } from 'react'
import AiSparkleIcon from '../ui/AiSparkleIcon'

export default function ChatBubble({ isOpen, onToggle }) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false)

  const handleClick = () => {
    if (!hasBeenClicked) setHasBeenClicked(true)
    onToggle()
  }

  const showAttention = !hasBeenClicked && !isOpen

  return (
    <div className={`chat-bubble-container ${isOpen ? 'is-hidden' : ''}`}>
      <button
        id="chat-bubble-btn"
        type="button"
        className={`chat-bubble ${showAttention ? 'notify-attention' : ''}`}
        onClick={handleClick}
        tabIndex={isOpen ? -1 : 0}
        aria-label="Abrir chat lateral con Lib"
        aria-expanded={isOpen}
        aria-controls="chat-widget"
        title="Hablar con Lib"
      >
        <AiSparkleIcon size={28} className="bubble-icon" />
      </button>
    </div>
  )
}
