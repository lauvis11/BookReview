import { ValidateNewPassword, ValidateUser } from "../schemas/auth.js"
import { AuthModel } from "../models/auth.js"
import jwt from 'jsonwebtoken'

export class AuthController{
    static async create(req, res, next){
        try {
            const userData = ValidateUser(req.body)
            if(!userData.success) return res.status(400).json({message: 'Invalid user data'})
            const user = await AuthModel.create({input: userData.data})
            if(!user) return res.status(409).json({message: 'User Exists'})
            return res.status(201).json({user: user, message: 'Register Succesfuly'})
        } catch (e) {
            next(e)
        }
    }    

    static async login(req, res, next){
        try {
            const userData = ValidateUser(req.body)
            if(!userData.success) return res.status(400).json({message: 'Invalid user data'})
            const userExist = await AuthModel.login({input: userData.data})
            if(!userExist) return res.status(404).json({message: 'Invalid Credentials'})
            const token = jwt.sign({id: userExist.id, name: userExist.name, role: userExist.role}, process.env.SECRET_KEY, {
                expiresIn: "1h"
            })
            const refreshToken = jwt.sign({id: userExist.id, name: userExist.name, role: userExist.role}, process.env.REFRESH_SECRET_KEY, {
                expiresIn: "7d"
            })

            await AuthModel.refresh({userId: userExist.id, refreshToken: refreshToken})

            return res
                .cookie('access-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 1000 // 1 hora
                })
                .cookie('refresh-token', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
                })
                .status(200)
                .json({user: userExist, message: 'Login Succesfuly'})
        } catch (e) {
            next(e)
        }
    }

    static async refresh(req, res, next){
        try {
            const refreshToken = req.cookies['refresh-token']
            const validToken = await AuthModel.verifyToken({refreshToken})
            if(!validToken) return res.status(401).json({message: 'Invalid Token'})
            const data = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY)

            // Invalidar el refresh token usado (rotation)
            await AuthModel.deleteRefreshToken({refreshToken})

            const newToken = jwt.sign({id: data.id, name: data.name, role: data.role}, process.env.SECRET_KEY, {
                expiresIn: '1h'
            })

            // Generar nuevo refresh token (rotation)
            const newRefreshToken = jwt.sign({id: data.id, name: data.name, role: data.role}, process.env.REFRESH_SECRET_KEY, {
                expiresIn: '7d'
            })
            await AuthModel.refresh({userId: data.id, refreshToken: newRefreshToken})

            res
                .cookie('access-token', newToken, {
                    httpOnly: true, 
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 1000 // 1 hora
                })
                .cookie('refresh-token', newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
                })
                .json({message: 'Refresh complete'})
        } catch (e) {
            next(e)
        }
    }

    static async logout(req, res, next){
        try {
            res.clearCookie('access-token')
            const refreshToken = req.cookies['refresh-token']
            if (refreshToken) {
                await AuthModel.deleteRefreshToken({ refreshToken })
            }
            res.clearCookie('refresh-token')
            res.json({message: 'Logout Succesfuly'})
        } catch (e) {
            next(e)
        }
    }

    static async updatePassword(req, res, next){
        try {
            const result = ValidateNewPassword(req.body)
            if(!result.success) return res.status(400).json({message: 'Invalid password data'})
            const userData = req.session.user
            const verifyPassword = await AuthModel.updatePassword({user_id: userData.id, input: result.data})
            if(verifyPassword === false) return res.status(400).json({message: 'Invalid password'})
            res.status(200).json({message: 'Password updated'})
        } catch (e) {
            next(e)
        }
    }
}
