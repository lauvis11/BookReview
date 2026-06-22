import mysql from 'mysql2/promise'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}
const connection = mysql.createPool(config)


export class ProfileModel{
    static async getProfile({id}){
        const [userProfile] = await connection.query(
            `SELECT BIN_TO_UUID(user_id) id, users.name, profile_img, bio, users.created_at FROM user_profile
            JOIN users ON users.id = user_profile.user_id
            WHERE users.id = UUID_TO_BIN(?);
            `, [id]
        )
        if(userProfile.length === 0) return false 

        return userProfile[0]
    }

    static async update({id, input}){
        // Whitelist de columnas permitidas para prevenir SQL injection
        const ALLOWED_COLUMNS = ['profile_img', 'bio']
        const safeEntries = Object.entries(input).filter(([key]) => ALLOWED_COLUMNS.includes(key))

        if (safeEntries.length === 0) return false

        const setClauses = safeEntries.map(([key]) => `\`${key}\` = ?`)
        const values = safeEntries.map(([, value]) => value)
        values.push(id)

        await connection.query(
            `UPDATE user_profile SET ${setClauses.join(', ')}
            WHERE user_id = UUID_TO_BIN(?);
            `, values
        )

        const [dataUpdate] = await connection.query(
            `SELECT BIN_TO_UUID(user_id) id, profile_img, bio FROM user_profile
            WHERE user_id = UUID_TO_BIN(?);
            `, [id]
        )

        return dataUpdate[0]
    }
}