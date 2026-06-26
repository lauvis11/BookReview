import mysql from 'mysql2/promise'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
}
const connection = mysql.createPool(config)

export class RatingModel{
    static async save({book_id, user_id, rate}){
        try{
            await connection.query(
                `INSERT INTO ratings(book_id, user_id, rate)
                VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?)
                ON DUPLICATE KEY UPDATE rate = ?;
                `, [book_id, user_id, rate, rate]
            )

            return true
        }catch(e){
            console.log(e)
            throw new Error('500 Server Error')
        }
    }

    static async getByUser({book_id, user_id}){
        const [rating] = await connection.query(
            `SELECT rate FROM ratings
            WHERE book_id = UUID_TO_BIN(?) AND user_id = UUID_TO_BIN(?);
            `, [book_id, user_id]
        )
        if(rating.length === 0) return null
        return rating[0]
    }

}