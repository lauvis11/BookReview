import { useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAIChatContext } from '../../context/AIChatContext'
import ChatBubble from './ChatBubble'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import '../../styles/chat.css'

export default function ChatWidget() {
  const {
    isSideOpen,
    mobileMenuOpen,
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    closeChat,
    toggleSideChat,
  } = useAIChatContext()
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const inputRef = useRef(null)

  // Enfoca el composer al abrir el panel lateral en escritorio (sensación IDE)
  useEffect(() => {
    if (!isSideOpen || !isAuthenticated) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) return

    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 220)
    return () => clearTimeout(timer)
  }, [isSideOpen, isAuthenticated])

  if (location.pathname === '/auth' || mobileMenuOpen) return null

  return (
    <>
      {/* Backdrop solo en pantallas < 1024px (en desktop empuja el contenido sin oscurecerlo) */}
      <div
        className={`ai-side-backdrop ${isSideOpen ? 'is-open' : ''}`}
        onClick={closeChat}
        aria-hidden="true"
      />

      {/* Side Chat acoplado a la derecha (100dvh · 40vw en desktop, drawer en mobile/tablet) */}
      <aside
        id="chat-widget"
        className={`ai-side-panel ${isSideOpen ? 'is-open' : ''}`}
        role="complementary"
        aria-label="Chat lateral con Lib, asistente de BookReview"
        aria-hidden={!isSideOpen}
        inert={!isSideOpen}
      >
        <ChatHeader
          loading={loading}
          hasMessages={messages.length > 0}
          onClear={clearMessages}
          onClose={closeChat}
        />

        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center bg-[#f8f7f2] overflow-y-auto overscroll-contain">
            <div className="w-full max-w-sm bg-[#eae6da]/55 border border-[#d6d0c0]/85 rounded-2xl p-7 flex flex-col items-center">
              <div
                style={{ borderRadius: '9999px' }}
                className="size-13 bg-primary/10 text-primary flex items-center justify-center mb-4"
              >
                <Lock size={22} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
              </div>

              <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-dark">
                Asistente literario
              </span>
              <h3 className="mt-1 font-hero-display text-2xl font-semibold text-primary leading-tight">
                Iniciá sesión para{' '}
                <span className="italic font-medium text-secondary-dark">hablar con Lib</span>
              </h3>
              <p className="mt-2.5 font-hero-sans text-[13.5px] text-on-surface-variant leading-relaxed">
                Consultá recomendaciones a medida, compará títulos y descubrí tu próxima lectura sin salir de la página.
              </p>

              <Link
                to="/auth"
                onClick={closeChat}
                className="mt-6 w-full h-11 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] text-white font-hero-sans text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_4px_14px_-4px_rgba(14,81,70,0.3)] transition-[background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>Iniciar sesión</span>
                <ArrowRight size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={messages}
              loading={loading}
              userName={user?.name}
              onSelectPrompt={sendMessage}
            />

            {error && (
              <div className="chat-error-banner" role="alert">
                <AlertCircle size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <ChatInput ref={inputRef} onSend={sendMessage} loading={loading} />
          </>
        )}
      </aside>

      {/* Botón burbuja flotante: abre el side chat y se oculta suavemente mientras está acoplado */}
      <ChatBubble isOpen={isSideOpen} onToggle={toggleSideChat} />
    </>
  )
}
