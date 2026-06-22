import { useState } from 'react'

export default function ChatBubble({ isOpen, onToggle }) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false)

  const handleClick = () => {
    if (!hasBeenClicked) setHasBeenClicked(true)
    onToggle()
  }

  return (
    <div className="chat-bubble-container">
      <button
        id="chat-bubble-btn"
        className={`chat-bubble ${isOpen ? 'is-open' : ''} ${!hasBeenClicked && !isOpen ? 'notify-bounce' : ''}`}
        onClick={handleClick}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat con Lib'}
        title={isOpen ? 'Cerrar chat' : 'Hablar con Lib'}
      >
        <span className="material-symbols-outlined bubble-icon">
          {isOpen ? 'close' : 'auto_awesome'}
        </span>
      </button>
    </div>
  )
}
