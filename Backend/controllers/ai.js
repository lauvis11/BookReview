import { ValidateChat } from "../schemas/ai.js";
import { getGeminiModel, systemContext } from "../config/ai.js";

export class AiController{
    static async aiChat(req, res){
        const result = ValidateChat(req.body)
        if(!result.success) return res.status(400).json({error: 'Invalid Data'})

        const { message, history = [] } = result.data;

        try{
            res.setHeader('Content-Type', 'text/plain', 'utf-8')
            res.setHeader('Transfer-Encoding', 'chunked')
            
            const model = getGeminiModel()
            const chat = model.startChat({
                systemInstruction: {
                    parts: [{text: systemContext}]
                },
                history: history, 
                generationConfig: {
                    maxOutputTokens: 512,
                    temperature: 0.7,
                    topP: 0.9,
                } 
            })

            const stream = await chat.sendMessageStream(message)
            for await (const chunk of stream){
                const text = chunk.text()
                if(text){
                    res.write(text)
                }
            }
            
            res.end()
        }catch(error){
            if(!res.headersSent){
                res.setHeader('Content-Type', 'application/json')
                res.status(500).json({error: 'Error generating response'})
            }
            res.end()
        }
    }
}