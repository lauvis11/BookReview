import { useState, useCallback, useRef } from 'react'

export function useAiChat() {
  const apiUrl = import.meta.env.VITE_API_URL
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const historyRef = useRef(history)

  const clearMessages = useCallback(() => {
    setMessages([])
    setHistory([])
    historyRef.current = []
    setError(null)
  }, [])

  const sendMessage = useCallback(
    async (userMessage) => {
      const trimmed = String(userMessage || '').trim()
      if (!trimmed) return

      setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
      setLoading(true)
      setError(null)

      // Mensaje vacío del modelo que se irá completando con los chunks de streaming
      setMessages((prev) => [...prev, { role: 'model', text: '' }])

      try {
        const response = await fetch(`${apiUrl}/ai`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: trimmed, history: historyRef.current }),
        })

        if (!response.ok) throw new Error('Fallo al obtener respuesta')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk

          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'model', text: fullText }
            return updated
          })
        }

        const nextHistory = [
          ...historyRef.current,
          { role: 'user', parts: [{ text: trimmed }] },
          { role: 'model', parts: [{ text: fullText }] },
        ]
        historyRef.current = nextHistory
        setHistory(nextHistory)
      } catch {
        setError('No pude conectarme con el asistente. Intentá nuevamente.')
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setLoading(false)
      }
    },
    [apiUrl]
  )

  return { messages, loading, error, sendMessage, clearMessages }
}
