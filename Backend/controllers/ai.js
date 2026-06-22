import rateLimit from "express-rate-limit";
import { ValidateChat } from "../schemas/ai.js";
import { sendMessage } from "../services/gemini-service.js";

export class AiController{
    static async aiChat(req, res){
        const result = ValidateChat(req.body)
        if(!result.success) return res.status(400).json({error: 'Invalid Data'})

        try{
            const chatResponse = await sendMessage(result.data.message, result.data.history)

            if(!chatResponse) return res.status(502).json({error: 'Error generating response'})
            

            return res.status(200).json({ chatResponse })
        }catch(error){
            console.log(error)
            res.status(500).json({error: 'Error generating response'})
        }
    }
}