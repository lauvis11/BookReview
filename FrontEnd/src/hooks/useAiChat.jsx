import { useState } from "react";

export function useAiChat() {
    const apiUrl = import.meta.env.VITE_API_URL
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [messages, setMessages] = useState([])
    const [history, setHistory] = useState([])

    async function sendMessage(userMessage) {
        if(!userMessage.trim()) return;

        const userEntry = {role: "user", text: userMessage}
        setMessages(prevMessages => [...prevMessages, userEntry])

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${apiUrl}/ai`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: userMessage, history: history })
            })
            if(!response.ok) throw new Error("Fallo al obtener respuesta")

            const result = await response.json()
            const aiText = result.chatResponse
            setHistory(prevHistory => [
                ...prevHistory, 
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                },
                {
                    role: "model",
                    parts: [{ text: aiText }]
                } 
            ])
            setMessages((prev) => [...prev, { role: "model", text: aiText }]);
            return aiText
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }

    }


    return { messages, loading, error, sendMessage}
}