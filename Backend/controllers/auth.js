import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import {
  ValidateForgotPassword,
  ValidateLogin,
  ValidateNewPassword,
  ValidateRegister,
  ValidateResetPassword,
  ValidateUpdateEmail,
  ValidateVerifyResetCode,
} from '../schemas/auth.js'
import { AuthModel } from '../models/auth.js'
import { sendPasswordResetCodeEmail } from '../services/brevo.js'

function hashRecoveryCode(userId, code) {
  return crypto
    .createHmac('sha256', process.env.SECRET_KEY)
    .update(`${userId}:${code}`)
    .digest('hex')
}

function getPasswordSignature(hashedPassword) {
  return crypto
    .createHash('sha256')
    .update(String(hashedPassword || ''))
    .digest('hex')
    .slice(0, 16)
}

export class AuthController {
  static async create(req, res, next) {
    try {
      const userData = ValidateRegister(req.body)
      if (!userData.success) {
        return res.status(400).json({ message: 'Invalid user data' })
      }
      const user = await AuthModel.create({ input: userData.data })
      if (!user) {
        return res.status(409).json({ message: 'User Exists' })
      }
      if (user.conflict === 'email') {
        return res.status(409).json({ message: 'Email Exists', field: 'email' })
      }
      if (user.conflict === 'name') {
        return res.status(409).json({ message: 'User Exists', field: 'name' })
      }
      return res.status(201).json({ user, message: 'Registered successfully' })
    } catch (e) {
      next(e)
    }
  }

  static async login(req, res, next) {
    try {
      const userData = ValidateLogin(req.body)
      if (!userData.success) {
        return res.status(400).json({ message: 'Invalid user data' })
      }
      const userExist = await AuthModel.login({ input: userData.data })
      if (!userExist) {
        return res.status(404).json({ message: 'Invalid Credentials' })
      }
      const token = jwt.sign(
        { id: userExist.id, name: userExist.name, role: userExist.role },
        process.env.SECRET_KEY,
        { expiresIn: '1h' }
      )
      const refreshToken = jwt.sign(
        { id: userExist.id, name: userExist.name, role: userExist.role },
        process.env.REFRESH_SECRET_KEY,
        { expiresIn: '7d' }
      )

      await AuthModel.refresh({ userId: userExist.id, refreshToken })

      const isProduction = process.env.NODE_ENV === 'production'
      return res
        .cookie('access-token', token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 60 * 60 * 1000,
        })
        .cookie('refresh-token', refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({ user: userExist, message: 'Login successfully' })
    } catch (e) {
      next(e)
    }
  }

  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies?.['refresh-token']
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' })
      }

      const validToken = await AuthModel.verifyToken({ refreshToken })
      if (!validToken) return res.status(401).json({ message: 'Invalid Token' })

      let data
      try {
        data = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY)
      } catch {
        await AuthModel.deleteRefreshToken({ refreshToken })
        return res.status(401).json({ message: 'Refresh token expired or invalid' })
      }

      await AuthModel.deleteRefreshToken({ refreshToken })

      const newToken = jwt.sign(
        { id: data.id, name: data.name, role: data.role },
        process.env.SECRET_KEY,
        { expiresIn: '1h' }
      )

      const newRefreshToken = jwt.sign(
        { id: data.id, name: data.name, role: data.role },
        process.env.REFRESH_SECRET_KEY,
        { expiresIn: '7d' }
      )
      await AuthModel.refresh({ userId: data.id, refreshToken: newRefreshToken })

      const isProduction = process.env.NODE_ENV === 'production'
      return res
        .cookie('access-token', newToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 60 * 60 * 1000,
        })
        .cookie('refresh-token', newRefreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({ message: 'Refresh complete' })
    } catch (e) {
      next(e)
    }
  }

  static async logout(req, res, next) {
    try {
      const isProduction = process.env.NODE_ENV === 'production'
      const clearOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      }
      res.clearCookie('access-token', clearOptions)
      const refreshToken = req.cookies['refresh-token']
      if (refreshToken) {
        await AuthModel.deleteRefreshToken({ refreshToken })
      }
      res.clearCookie('refresh-token', clearOptions)
      return res.json({ message: 'Logout successfully' })
    } catch (e) {
      next(e)
    }
  }

  static async updatePassword(req, res, next) {
    try {
      const result = ValidateNewPassword(req.body)
      if (!result.success) return res.status(400).json({ message: 'Invalid password data' })
      const userData = req.session.user
      const verifyPassword = await AuthModel.updatePassword({
        user_id: userData.id,
        input: result.data,
      })
      if (verifyPassword === false) {
        return res.status(400).json({ message: 'Invalid password' })
      }
      return res.status(200).json({ message: 'Password updated' })
    } catch (e) {
      next(e)
    }
  }

  static async updateEmail(req, res, next) {
    try {
      const parsed = ValidateUpdateEmail(req.body)
      if (!parsed.success) {
        return res.status(400).json({ message: 'Correo electrónico inválido' })
      }

      const userData = req.session.user
      const result = await AuthModel.updateEmail({
        user_id: userData.id,
        email: parsed.data.email,
      })

      if (result.conflict) {
        return res.status(409).json({ message: 'Ese correo ya está asociado a otra cuenta.' })
      }

      return res.status(200).json({ email: result.email, message: 'Correo actualizado' })
    } catch (e) {
      next(e)
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const parsed = ValidateForgotPassword(req.body)
      if (!parsed.success) {
        return res.status(400).json({ message: 'Ingresá un correo electrónico válido.' })
      }

      const user = await AuthModel.findByEmailForRecovery({ email: parsed.data.email })

      if (!user) {
        // Misma estructura de respuesta para evitar enumeración de correos
        const dummyToken = jwt.sign(
          { purpose: 'pwd_reset_dummy' },
          process.env.SECRET_KEY,
          { expiresIn: '10m' }
        )
        return res.status(200).json({
          message: 'Si el correo está registrado, enviamos un código de verificación.',
          recoveryToken: dummyToken,
        })
      }

      const code = String(crypto.randomInt(100000, 1000000))
      const codeHash = hashRecoveryCode(user.id, code)
      const pwSig = getPasswordSignature(user.password)

      const recoveryToken = jwt.sign(
        { purpose: 'pwd_reset_code', uid: user.id, codeHash, pwSig },
        process.env.SECRET_KEY,
        { expiresIn: '10m' }
      )

      try {
        await sendPasswordResetCodeEmail({
          toEmail: user.email,
          toName: user.name,
          code,
        })
      } catch (mailErr) {
        console.error('Error enviando código de recuperación vía Brevo:', mailErr.message)
        return res.status(503).json({
          message:
            mailErr.code === 'BREVO_NOT_CONFIGURED'
              ? 'El envío de correos todavía no está configurado en el servidor.'
              : 'No pudimos enviar el correo en este momento. Intentá nuevamente.',
        })
      }

      return res.status(200).json({
        message: 'Si el correo está registrado, enviamos un código de verificación.',
        recoveryToken,
      })
    } catch (e) {
      next(e)
    }
  }

  static async verifyResetCode(req, res, next) {
    try {
      const parsed = ValidateVerifyResetCode(req.body)
      if (!parsed.success) {
        return res.status(400).json({ message: 'Ingresá el código completo de 6 dígitos.' })
      }

      const { code, recoveryToken } = parsed.data
      let payload
      try {
        payload = jwt.verify(recoveryToken, process.env.SECRET_KEY)
      } catch {
        return res.status(400).json({
          message: 'El código venció o es inválido. Solicitá uno nuevo.',
        })
      }

      if (payload.purpose !== 'pwd_reset_code' || !payload.uid || !payload.codeHash) {
        return res.status(400).json({ message: 'El código ingresado es incorrecto.' })
      }

      const expectedHash = hashRecoveryCode(payload.uid, code)
      const hashBufA = Buffer.from(expectedHash, 'hex')
      const hashBufB = Buffer.from(String(payload.codeHash), 'hex')

      if (hashBufA.length !== hashBufB.length || !crypto.timingSafeEqual(hashBufA, hashBufB)) {
        return res.status(400).json({ message: 'El código ingresado es incorrecto.' })
      }

      const user = await AuthModel.findByIdForRecovery({ user_id: payload.uid })
      if (!user || getPasswordSignature(user.password) !== payload.pwSig) {
        return res.status(400).json({
          message: 'Esta solicitud ya expiró. Solicitá un nuevo código.',
        })
      }

      const resetToken = jwt.sign(
        { purpose: 'pwd_reset_confirmed', uid: user.id, pwSig: payload.pwSig },
        process.env.SECRET_KEY,
        { expiresIn: '10m' }
      )

      return res.status(200).json({ valid: true, resetToken })
    } catch (e) {
      next(e)
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const parsed = ValidateResetPassword(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres y un número.',
        })
      }

      const { resetToken, new_password } = parsed.data
      let payload
      try {
        payload = jwt.verify(resetToken, process.env.SECRET_KEY)
      } catch {
        return res.status(400).json({
          message: 'Tu sesión de recuperación expiró. Volvé a solicitar un código.',
        })
      }

      if (payload.purpose !== 'pwd_reset_confirmed' || !payload.uid) {
        return res.status(400).json({ message: 'Token de recuperación inválido.' })
      }

      const user = await AuthModel.findByIdForRecovery({ user_id: payload.uid })
      if (!user || getPasswordSignature(user.password) !== payload.pwSig) {
        return res.status(400).json({
          message: 'Este enlace o código ya fue utilizado. Solicitá uno nuevo.',
        })
      }

      await AuthModel.resetPasswordByRecovery({
        user_id: user.id,
        new_password,
      })

      return res.status(200).json({ message: 'Contraseña actualizada correctamente.' })
    } catch (e) {
      next(e)
    }
  }
}
