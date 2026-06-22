import { Router } from "express";
export const authRouter = Router()
import { AuthController } from "../controllers/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

authRouter.post('/register', AuthController.create)
authRouter.post('/login', AuthController.login)
authRouter.post('/logout', AuthController.logout)
authRouter.get('/refresh', AuthController.refresh)
authRouter.patch('/password', verifyToken, AuthController.updatePassword)