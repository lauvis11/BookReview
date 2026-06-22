import { Router } from "express";
import { AiController } from "../controllers/ai.js";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/verifyToken.js";

export const aiRouter = Router();

const aiLimiter = rateLimit({
            windowMs: 60 * 1000,
            max: 5, 
            message: 'You have sent too many messages, please try again later',
            legacyHeaders: false,
            standardHeaders: true,
        })
aiRouter.use(aiLimiter)
aiRouter.post('/', verifyToken, AiController.aiChat)