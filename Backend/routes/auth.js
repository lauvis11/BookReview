import { Router } from 'express'
import { AuthController } from '../controllers/auth.js'
import { verifyToken } from '../middleware/verifyToken.js'

export const authRouter = Router()

authRouter.post('/register', AuthController.create)
authRouter.post('/login', AuthController.login)
authRouter.post('/logout', AuthController.logout)
authRouter.get('/refresh', AuthController.refresh)
authRouter.patch('/password', verifyToken, AuthController.updatePassword)
authRouter.patch('/email', verifyToken, AuthController.updateEmail)
authRouter.post('/forgot-password', AuthController.forgotPassword)
authRouter.post('/verify-reset-code', AuthController.verifyResetCode)
authRouter.post('/reset-password', AuthController.resetPassword)
