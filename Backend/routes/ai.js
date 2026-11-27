import { Router } from "express";
import { AiController } from "../controllers/ai.js";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/verifyToken.js";

export const aiRouter = Router();

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        error: "Enviaste demasiados mensajes en poco tiempo. Esperá unos segundos e intentá nuevamente.",
    },
    legacyHeaders: false,
    standardHeaders: true,
});

// verifyToken antes de aiLimiter evita que un 401 previo al refresh consuma cuota
aiRouter.post("/", verifyToken, aiLimiter, AiController.aiChat);
