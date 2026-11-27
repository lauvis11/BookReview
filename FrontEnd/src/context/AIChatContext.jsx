import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useAiChat } from '../hooks/useAiChat'

const AIChatContext = createContext(null)

export function AIChatProvider({ children }) {
  // 'closed' | 'side' | 'modal'
  const [chatMode, setChatMode] = useState('closed')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { messages, loading, error, sendMessage, clearMessages } = useAiChat()

  const isSideOpen = chatMode === 'side'
  const isModalOpen = chatMode === 'modal'
  const isAnyOpen = chatMode !== 'closed'

  const openSideChat = useCallback(
    (initialMessage) => {
      setChatMode('side')
      if (initialMessage && isAuthenticated) {
        sendMessage(initialMessage)
      }
    },
    [isAuthenticated, sendMessage]
  )

  const openModalChat = useCallback(
    (initialMessage) => {
      setChatMode('modal')
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

  // Escucha `open-ai-chat`: los accesos que no son la burbuja abren la vista expandida a pantalla completa
  useEffect(() => {
    const handleCustomOpen = (e) => {
      if (e.detail?.mode === 'side') {
        openSideChat(e.detail?.message)
      } else {
        openModalChat(e.detail?.message)
      }
    }
    window.addEventListener('open-ai-chat', handleCustomOpen)
    return () => window.removeEventListener('open-ai-chat', handleCustomOpen)
  }, [openModalChat, openSideChat])

  // Escape cierra tanto el side chat como la vista expandida
  useEffect(() => {
    if (!isAnyOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setChatMode('closed')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isAnyOpen])

  // Bloquea scroll del body en vista expandida siempre, y en side chat solo en mobile/tablet (< 1024px)
  useEffect(() => {
    if (!isAnyOpen) return
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }

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
  }, [isAnyOpen, isModalOpen])

  return (
    <AIChatContext.Provider
      value={{
        chatMode,
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
