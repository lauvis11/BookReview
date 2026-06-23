import mysql from 'mysql2/promise'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

const connection = mysql.createPool(config)

export class AuthModel{
    static async create({input}){
        const {
            name,
            password
        } = input

        const passwordHashed = await bcrypt.hash(password, 10)
        const uuid = crypto.randomUUID()

        try{
            const [verifyUser] = await connection.query(
                `SELECT id FROM users
                WHERE name = ?;
                `, [name]
            )

            if(verifyUser.length >= 1) return false

            await connection.query(
                `INSERT INTO users(id, name, password)
                VALUES (UUID_TO_BIN(?), ?, ?);
                `, [uuid, name, passwordHashed]
                
            )

            const PREDEFINED_AVATARS = [
                'https://api.dicebear.com/7.x/notionists/svg?seed=1',
                'https://api.dicebear.com/7.x/notionists/svg?seed=2',
                'https://api.dicebear.com/7.x/notionists/svg?seed=3',
                'https://api.dicebear.com/7.x/notionists/svg?seed=4',
                'https://api.dicebear.com/7.x/notionists/svg?seed=5',
                'https://api.dicebear.com/7.x/notionists/svg?seed=6',
                'https://api.dicebear.com/7.x/notionists/svg?seed=7',
                'https://api.dicebear.com/7.x/notionists/svg?seed=8',
                'https://api.dicebear.com/7.x/notionists/svg?seed=9',
                'https://api.dicebear.com/7.x/notionists/svg?seed=10'
            ]
            const randomAvatar = PREDEFINED_AVATARS[Math.floor(Math.random() * PREDEFINED_AVATARS.length)]

            await connection.query(
                `INSERT INTO user_profile(user_id, profile_img)
                VALUES(UUID_TO_BIN(?), ?);
                `, [uuid, randomAvatar]
            )

            const [userCreated] = await connection.query(
                `SELECT BIN_TO_UUID(id) id, name FROM users
                WHERE id = UUID_TO_BIN(?);
                `, [uuid]
            )
            return userCreated
        }catch(e){
            console.log(e)
            throw new Error(`500 Server Error`)
        }
    }

    static async login({input}){
        const {
            name, 
            password
        } = input


        const [user] = await connection.query(
            `SELECT BIN_TO_UUID(u.id) id, u.name, u.password, u.role, p.profile_img 
             FROM users u
             LEFT JOIN user_profile p ON u.id = p.user_id
             WHERE u.name = ?;
            `, [name]
        )
    
        
        if(user.length === 0) return false

        const isValid = await bcrypt.compare(password, user[0].password)

        if(!isValid) return false

        const {password: hashedPassword, ...userData} = user[0] 

        return userData
    }

    static async refresh({userId, refreshToken}){
        // Eliminar tokens anteriores del usuario para prevenir acumulación
        await connection.query(
            `DELETE FROM refresh_tokens WHERE user_id = UUID_TO_BIN(?);`, [userId]
        )
        await connection.query(
            `INSERT INTO refresh_tokens(user_id, token) 
            VALUES (UUID_TO_BIN(?), ?);
            `, [userId, refreshToken]
        )
    }

    static async verifyToken({refreshToken}){
        const [tokens] = await connection.query(
            `SELECT id FROM refresh_tokens 
            WHERE token = ? ;`, [refreshToken]
        )
        if(tokens.length === 0) return false
        return true 
    }

    static async deleteRefreshToken({refreshToken}){
        await connection.query(
            `DELETE FROM refresh_tokens
            WHERE token = ?;
            `, [refreshToken]
        )
    }

    static async updatePassword({user_id, input}){
        const { current_password, new_password } = input
        
        const [userPassword] = await connection.query(
            `SELECT password FROM users 
            WHERE id = UUID_TO_BIN(?);
            `, [user_id]
        )

        const isValid = await bcrypt.compare(current_password, userPassword[0].password)
        if(isValid === false) return false

        const hashedNewPassword = await bcrypt.hash(new_password, 10) 

        await connection.query(
            `UPDATE users SET password = ?
            WHERE id = UUID_TO_BIN(?);
            `, [hashedNewPassword, user_id]
        )

        return true
    }
}