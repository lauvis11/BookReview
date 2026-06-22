import mysql from 'mysql2/promise'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}
const connection = mysql.createPool(config)

export class StatusModel{
    static async getByStatus({status, user_id}){
        const [books] = await connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate FROM book_genre
            JOIN book ON book.id = book_genre.book_id
            JOIN genre ON genre.id = genre_id
            JOIN editorial ON editorial.id = book.editorial_id
            JOIN reading_status ON reading_status.book_id = book_genre.book_id
            LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
            LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
            LEFT JOIN author ON author.id = book_author.author_id
            WHERE reading_status.status = ? AND reading_status.user_id = UUID_TO_BIN(?)
            GROUP BY book_genre.book_id
            `, [status, user_id]
        )
        return books
    }

    static async save({user_id, input}){
        const {book_id, status} = input 
        await connection.query(
            `INSERT INTO reading_status(user_id, book_id, status) 
            VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?) 
            ON DUPLICATE KEY UPDATE status = ?; 
            `, [user_id, book_id, status, status]
        )

        const [statusSaved] = await connection.query(
            `SELECT BIN_TO_UUID(book_id) id, status FROM reading_status
            WHERE user_id = UUID_TO_BIN(?) AND book_id = UUID_TO_BIN(?);
            `, [user_id, book_id]
        )

        return statusSaved[0]
    }

    static async delete({user_id, book_id}){
        await connection.query(
            `DELETE FROM reading_status
            WHERE user_id = UUID_TO_BIN(?) AND book_id = UUID_TO_BIN(?);
            `, [user_id, book_id]
        )
    }
}   