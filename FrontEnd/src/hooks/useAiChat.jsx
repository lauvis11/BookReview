import { useState, useCallback, useRef, useEffect } from 'react'

const MAX_MESSAGE_LENGTH = 500
const MAX_HISTORY_MESSAGES = 16
// Margen seguro por debajo de app.use(json({ limit: '16kb' })) en el backend
const MAX_HISTORY_BYTES = 10000
const REQUEST_TIMEOUT_MS = 28000

let activeRefreshPromise = null

function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:1234'
  return raw.replace(/\/+$/, '')
}

async function refreshAccessToken(apiUrl) {
  if (!activeRefreshPromise) {
    activeRefreshPromise = fetch(`${apiUrl}/auth/refresh`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        activeRefreshPromise = null
      })
  }
  return activeRefreshPromise
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return []

  const cleaned = []

  for (const item of rawHistory) {
    if (!item || (item.role !== 'user' && item.role !== 'model')) continue
    const text = item.parts?.[0]?.text?.trim()
    if (!text) continue

    if (cleaned.length === 0) {
      if (item.role !== 'user') continue
      cleaned.push({ role: 'user', parts: [{ text }] })
      continue
    }

    const prev = cleaned[cleaned.length - 1]
    if (prev.role === item.role) {
      cleaned[cleaned.length - 1] = { role: item.role, parts: [{ text }] }
    } else {
      cleaned.push({ role: item.role, parts: [{ text }] })
    }
  }

  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
    cleaned.pop()
  }

  let bounded = cleaned.slice(-MAX_HISTORY_MESSAGES)
  if (bounded[0]?.role === 'model') {
    bounded = bounded.slice(1)
  }

  const encoder = new TextEncoder()
  while (bounded.length >= 2 && encoder.encode(JSON.stringify(bounded)).length > MAX_HISTORY_BYTES) {
    bounded = bounded.slice(2)
  }

  return bounded
}

async function extractErrorMessage(response) {
  try {
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      const msg = data?.error || data?.message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
  } catch {
    // Ignoramos errores al parsear el cuerpo de error
  }

  switch (response.status) {
    case 400:
      return 'No pudimos procesar tu mensaje. Revisá que no supere los 500 caracteres.'
    case 401:
      return 'Tu sesión expiró. Iniciá sesión nuevamente para hablar con Lib.'
    case 413:
      return 'La conversación es muy larga. Limpiá el chat para seguir conversando.'
    case 429:
      return 'Enviaste demasiados mensajes seguidos. Esperá unos segundos e intentá nuevamente.'
    case 503:
      return 'Lib está recibiendo muchas consultas en este momento. Intentá nuevamente en unos segundos.'
    case 504:
      return 'La respuesta tardó demasiado. Intentá nuevamente.'
    default:
      return 'No pude conectarme con el asistente. Intentá nuevamente.'
  }
}

export function useAiChat() {
  const apiUrl = getApiBaseUrl()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [history, setHistory] = useState([])
  const historyRef = useRef(history)
  const inFlightRef = useRef(false)
  const abortControllerRef = useRef(null)
  const clearedByUserRef = useRef(false)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const clearMessages = useCallback(() => {
    clearedByUserRef.current = true
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    inFlightRef.current = false
    setMessages([])
    setHistory([])
    historyRef.current = []
    setError(null)
    setLoading(false)
  }, [])

  const sendMessage = useCallback(
    async (userMessage) => {
      const trimmed = String(userMessage || '').trim()
      if (!trimmed || inFlightRef.current) return

      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        setError(`Tu mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`)
        return
      }

      inFlightRef.current = true
      clearedByUserRef.current = false

      const controller = new AbortController()
      abortControllerRef.current = controller
      let timedOut = false
      const timeoutId = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, REQUEST_TIMEOUT_MS)

      setMessages((prev) => [...prev, { role: 'user', text: trimmed }, { role: 'model', text: '' }])
      setLoading(true)
      setError(null)

      let fullText = ''

      try {
        const safeHistory = sanitizeHistory(historyRef.current)
        const payload = JSON.stringify({ message: trimmed, history: safeHistory })

        const performRequest = () =>
          fetch(`${apiUrl}/ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: payload,
            signal: controller.signal,
          })

        let response = await performRequest()

        // Si el access-token de 1h expiró, refrescamos la sesión automáticamente y reintentamos una vez
        if (response.status === 401) {
          const refreshed = await refreshAccessToken(apiUrl)
          if (refreshed && !controller.signal.aborted) {
            response = await performRequest()
          }
        }

        if (!response.ok) {
          const errorMessage = await extractErrorMessage(response)
          throw new Error(errorMessage)
        }

        if (response.body && typeof response.body.getReader === 'function') {
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            if (chunk) {
              fullText += chunk
              const currentText = fullText
              setMessages((prev) => {
                if (prev.length === 0) return prev
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'model', text: currentText }
                return updated
              })
            }
          }

          const trailing = decoder.decode()
          if (trailing) {
            fullText += trailing
            const currentText = fullText
            setMessages((prev) => {
              if (prev.length === 0) return prev
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'model', text: currentText }
              return updated
            })
          }
        } else {
          fullText = await response.text()
          if (fullText) {
            const currentText = fullText
            setMessages((prev) => {
              if (prev.length === 0) return prev
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'model', text: currentText }
              return updated
            })
          }
        }

        if (!fullText.trim()) {
          throw new Error('Lib no pudo completar la respuesta. Intentá nuevamente.')
        }

        const nextHistory = sanitizeHistory([
          ...safeHistory,
          { role: 'user', parts: [{ text: trimmed }] },
          { role: 'model', parts: [{ text: fullText.trim() }] },
        ])
        historyRef.current = nextHistory
        setHistory(nextHistory)
      } catch (err) {
        if (clearedByUserRef.current) return

        const isAbort = err?.name === 'AbortError'
        const friendlyError = timedOut
          ? 'La respuesta tardó demasiado. Intentá nuevamente.'
          : isAbort
            ? null
            : err?.message && !err.message.toLowerCase().includes('failed to fetch')
              ? err.message
              : 'No pude conectarme con el asistente. Verificá tu conexión e intentá nuevamente.'

        if (friendlyError) {
          setError(friendlyError)
        }

        // Solo removemos el placeholder vacío si no llegó texto; nunca guardamos turnos incompletos en history
        if (!fullText.trim()) {
          setMessages((prev) => prev.slice(0, -1))
        }
      } finally {
        clearTimeout(timeoutId)
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null
        }
        inFlightRef.current = false
        setLoading(false)
      }
    },
    [apiUrl]
  )

  return { messages, loading, error, sendMessage, clearMessages }
}

