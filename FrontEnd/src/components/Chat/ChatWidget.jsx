import { useState, useRef, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAiChat } from '../../hooks/useAiChat'
import ChatBubble from './ChatBubble'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import '../../styles/chat.css'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const { messages, loading, error, sendMessage } = useAiChat()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (location.pathname === '/auth') return null

  function handleOpen() {
    if (isOpen) {
      // Cerrar con animación de salida
      setIsClosing(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 180)
    } else {
      setIsOpen(true)
    }
  }

  useEffect(() => {
    const handleCustomOpen = (e) => {
      setIsOpen(true)
      if (e.detail?.message && isAuthenticated) {
        sendMessage(e.detail.message)
      }
    }
    window.addEventListener('open-ai-chat', handleCustomOpen)
    return () => window.removeEventListener('open-ai-chat', handleCustomOpen)
  }, [sendMessage, isAuthenticated])

  return (
    <>
      {/* Ventana del chat */}
      {isOpen && (
        <div
          id="chat-widget"
          className={`chat-window ${isClosing ? 'closing' : ''}`}
          role="dialog"
          aria-label="Chat con Lib, asistente de LibFlow"
          aria-modal="false"
        >
          <ChatHeader loading={loading} onClose={handleOpen} />

          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-surface-container-lowest">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </div>
              <p className="font-body text-sm text-[#50453e] mb-6">
                Si quieres utilizar el asistente debes iniciar sesión.
              </p>
              <Link 
                to="/auth" 
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-primary text-[#ffdcc6] rounded-full font-label text-xs uppercase tracking-widest font-bold hover:brightness-110 shadow-md transition-all"
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            <>
              <ChatMessages messages={messages} loading={loading} />

              {/* Banner de error */}
              {error && (
                <div className="chat-error-banner" role="alert">
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    error
                  </span>
                  {error}
                </div>
              )}

              <ChatInput onSend={sendMessage} loading={loading} />
            </>
          )}
        </div>
      )}

      {/* Botón flotante — siempre visible */}
      <ChatBubble isOpen={isOpen} onToggle={handleOpen} />
    </>
  )
}
