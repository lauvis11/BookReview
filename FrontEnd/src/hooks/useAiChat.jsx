import { useState, useCallback } from "react";

export function useAiChat() {
    const apiUrl = import.meta.env.VITE_API_URL
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [messages, setMessages] = useState([])
    const [history, setHistory] = useState([])

    const sendMessage = useCallback(async (userMessage) => {
        if (!userMessage.trim()) return;

        setMessages(prev => [...prev, { role: "user", text: userMessage }])
        setLoading(true)
        setError(null)

        // Añadir el mensaje vacío del modelo que irá llenándose con los chunks
        setMessages(prev => [...prev, { role: "model", text: "" }])

        try {
            const response = await fetch(`${apiUrl}/ai`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ message: userMessage, history })
            })

            if (!response.ok) throw new Error("Fallo al obtener respuesta")

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                fullText += chunk

                // Actualizar el último mensaje (el del modelo) con el texto acumulado
                setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: "model", text: fullText }
                    return updated
                })
            }

            // Guardar en el historial solo cuando ya llegó el texto completo
            setHistory(prev => [
                ...prev,
                { role: "user", parts: [{ text: userMessage }] },
                { role: "model", parts: [{ text: fullText }] }
            ])

        } catch (err) {
            setError("No pude conectarme con el asistente. Intenta de nuevo.")
            // Eliminar el mensaje vacío del modelo si hubo error
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }, [history, apiUrl])

    return { messages, loading, error, sendMessage }
}