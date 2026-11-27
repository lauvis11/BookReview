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

function ChatAuthGate({ onNavigateAuth }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center bg-[#f8f7f2] dark:bg-surface overflow-y-auto overscroll-contain">
      <div className="w-full max-w-sm bg-[#eae6da]/55 dark:bg-surface-container-low border border-[#d6d0c0]/85 dark:border-outline-variant rounded-2xl p-7 flex flex-col items-center">
        <div
          style={{ borderRadius: '9999px' }}
          className="size-13 bg-primary/10 dark:bg-primary/25 text-primary dark:text-[#edbd79] flex items-center justify-center mb-4"
        >
          <Lock size={22} strokeWidth={1.85} absoluteStrokeWidth aria-hidden="true" />
        </div>

        <span className="font-hero-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-dark">
          Asistente literario
        </span>
        <h3 className="mt-1 font-hero-display text-2xl font-semibold text-primary dark:text-[#e8e3d6] leading-tight">
          Iniciá sesión para{' '}
          <span className="italic font-medium text-secondary-dark">hablar con Lib</span>
        </h3>
        <p className="mt-2.5 font-hero-sans text-[13.5px] text-on-surface-variant leading-relaxed">
          Consultá recomendaciones a medida, compará títulos y descubrí tu próxima lectura sin salir de la página.
        </p>

        <Link
          to="/auth"
          onClick={onNavigateAuth}
          className="mt-6 w-full h-11 px-5 rounded-[10px] bg-primary hover:bg-[#166e5e] dark:hover:bg-[#19826f] text-white font-hero-sans text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 shadow-[0_4px_14px_-4px_rgba(14,81,70,0.3)] dark:shadow-[0_6px_18px_-4px_rgba(0,0,0,0.45)] transition-[background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.96] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span>Iniciar sesión</span>
          <ArrowRight size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const {
    isSideOpen,
    isModalOpen,
    isAnyOpen,
    mobileMenuOpen,
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    openSideChat,
    openModalChat,
    closeChat,
    toggleSideChat,
  } = useAIChatContext()
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const sideInputRef = useRef(null)
  const modalInputRef = useRef(null)

  // Enfoca el composer al abrir el panel lateral en escritorio
  useEffect(() => {
    if (!isSideOpen || !isAuthenticated) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) return

    const timer = setTimeout(() => {
      sideInputRef.current?.focus()
    }, 220)
    return () => clearTimeout(timer)
  }, [isSideOpen, isAuthenticated])

  // Enfoca el composer al abrir la vista expandida a pantalla completa
  useEffect(() => {
    if (!isModalOpen || !isAuthenticated) return
    const timer = setTimeout(() => {
      modalInputRef.current?.focus()
    }, 180)
    return () => clearTimeout(timer)
  }, [isModalOpen, isAuthenticated])

  if (location.pathname === '/auth' || mobileMenuOpen) return null

  return (
    <>
      {/* Backdrop solo en pantallas < 1024px para el Side Chat */}
      <div
        className={`ai-side-backdrop ${isSideOpen ? 'is-open' : ''}`}
        onClick={closeChat}
        aria-hidden="true"
      />

      {/* 1) Side Chat acoplado a la derecha (35vw debajo del Navbar en desktop, drawer en mobile/tablet) */}
      <aside
        id="chat-widget"
        className={`ai-side-panel ${isSideOpen ? 'is-open' : ''}`}
        role="complementary"
        aria-label="Chat lateral con Lib, asistente de BookReview"
        aria-hidden={!isSideOpen}
        inert={!isSideOpen}
      >
        <ChatHeader
          variant="side"
          loading={loading}
          hasMessages={messages.length > 0}
          onClear={clearMessages}
          onExpand={() => openModalChat()}
          onClose={closeChat}
        />

        {!isAuthenticated ? (
          <ChatAuthGate onNavigateAuth={closeChat} />
        ) : (
          <>
            <ChatMessages
              variant="side"
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

            <ChatInput ref={sideInputRef} onSend={sendMessage} loading={loading} />
          </>
        )}
      </aside>

      {/* 2) Chat expandido a pantalla completa (desde botones de recomendaciones, Abrir asistente y botón Expandir) */}
      <div
        id="chat-fullscreen-modal"
        className={`ai-modal-shell ${isModalOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Lib IA — Vista expandida"
        aria-hidden={!isModalOpen}
        inert={!isModalOpen}
      >
        <ChatHeader
          variant="modal"
          loading={loading}
          hasMessages={messages.length > 0}
          onClear={clearMessages}
          onCollapseToSide={() => openSideChat()}
          onClose={closeChat}
        />

        {!isAuthenticated ? (
          <ChatAuthGate onNavigateAuth={closeChat} />
        ) : (
          <>
            <ChatMessages
              variant="modal"
              messages={messages}
              loading={loading}
              userName={user?.name}
              onSelectPrompt={sendMessage}
              welcomeInputSlot={
                <>
                  {error && (
                    <div className="chat-error-banner chat-error-banner--inline" role="alert">
                      <AlertCircle size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <ChatInput ref={modalInputRef} onSend={sendMessage} loading={loading} />
                </>
              }
            />

            {(messages.length > 0 || loading) && (
              <div className="chat-modal-footer">
                {error && (
                  <div className="chat-error-banner chat-error-banner--modal" role="alert">
                    <AlertCircle size={15} strokeWidth={2} absoluteStrokeWidth aria-hidden="true" className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <ChatInput ref={modalInputRef} onSend={sendMessage} loading={loading} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Botón burbuja flotante: abre el side chat y se oculta mientras cualquier vista del chat está abierta */}
      <ChatBubble isOpen={isAnyOpen} onToggle={toggleSideChat} />
    </>
  )
}
