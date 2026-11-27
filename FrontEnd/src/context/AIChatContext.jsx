import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAiChat } from '../hooks/useAiChat'

const AIChatContext = createContext(null)

export function AIChatProvider({ children }) {
  // 'closed' | 'side' (preparado para sumar 'modal' en el paso 2)
  const [chatMode, setChatMode] = useState('closed')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { messages, loading, error, sendMessage, clearMessages } = useAiChat()

  const isSideOpen = chatMode === 'side'

  const openSideChat = useCallback(
    (initialMessage) => {
      setChatMode('side')
      if (initialMessage && isAuthenticated) {
        sendMessage(initialMessage)
      }
    },
    [isAuthenticated, sendMessage]
  )

  const closeChat = useCallback(() => {
    setChatMode('closed')
  }, [])

  const toggleSideChat = useCallback(() => {
    setChatMode((prev) => (prev === 'side' ? 'closed' : 'side'))
  }, [])

  // Sincroniza con el menú móvil del Navbar
  useEffect(() => {
    const handleMobileMenu = (e) => {
      const open = Boolean(e.detail?.open)
      setMobileMenuOpen(open)
      if (open) {
        setChatMode('closed')
      }
    }
    window.addEventListener('mobile-menu-toggle', handleMobileMenu)
    return () => window.removeEventListener('mobile-menu-toggle', handleMobileMenu)
  }, [])

  // Escucha el evento global `open-ai-chat` (botones de recomendaciones / BookDetail / Home)
  useEffect(() => {
    const handleCustomOpen = (e) => {
      openSideChat(e.detail?.message)
    }
    window.addEventListener('open-ai-chat', handleCustomOpen)
    return () => window.removeEventListener('open-ai-chat', handleCustomOpen)
  }, [openSideChat])

  // Escape cierra el side chat
  useEffect(() => {
    if (!isSideOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setChatMode('closed')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSideOpen])

  // Bloquea el scroll del body solo en mobile/tablet (< 1024px) cuando el drawer está abierto
  useEffect(() => {
    if (!isSideOpen) return
    const mq = window.matchMedia('(max-width: 1023px)')
    const syncBodyScroll = () => {
      document.body.style.overflow = mq.matches ? 'hidden' : ''
    }
    syncBodyScroll()
    mq.addEventListener('change', syncBodyScroll)
    return () => {
      mq.removeEventListener('change', syncBodyScroll)
      document.body.style.overflow = ''
    }
  }, [isSideOpen])

  return (
    <AIChatContext.Provider
      value={{
        chatMode,
        isSideOpen,
        mobileMenuOpen,
        messages,
        loading,
        error,
        sendMessage,
        clearMessages,
        openSideChat,
        closeChat,
        toggleSideChat,
      }}
    >
      {children}
    </AIChatContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAIChatContext() {
  const ctx = useContext(AIChatContext)
  if (!ctx) {
    throw new Error('useAIChatContext must be used inside AIChatProvider')
  }
  return ctx
}
