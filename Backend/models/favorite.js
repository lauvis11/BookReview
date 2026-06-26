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

export class FavoritesModel{
    static async getAll({user_id}){
        const [favoritesBooks] = await connection.query(
            `SELECT BIN_TO_UUID(users_favorites.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author FROM users_favorites
            JOIN book ON book.id = users_favorites.book_id 
            JOIN book_genre ON book_genre.book_id = users_favorites.book_id
            JOIN genre ON genre.id = book_genre.genre_id  
            JOIN editorial ON editorial.id = book.editorial_id
            LEFT JOIN book_author ON book_author.book_id = users_favorites.book_id
            LEFT JOIN author ON author.id = book_author.author_id
            WHERE users_favorites.user_id = UUID_TO_BIN(?)
            GROUP BY book_genre.book_id;
            `, [user_id]
        )

        return favoritesBooks
    }

    static async save({book_id, user_id}){
        try{
            const [bookExists] = await connection.query(
                `SELECT book_id, user_id FROM users_favorites
                WHERE book_id = UUID_TO_BIN(?)
                AND user_id = UUID_TO_BIN(?);
                `, [book_id, user_id]
            )

            if(bookExists.length > 0) return false

            await connection.query(
                `INSERT INTO users_favorites(book_id, user_id)
                VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));
                `, [book_id, user_id]
            )
            return true
        }catch{
            throw new Error('Book not Found') 
        }
    }

    static async delete({book_id, user_id}){
        try{
            const [bookExists] = await connection.query(
                `SELECT book_id, user_id FROM users_favorites
                WHERE book_id = UUID_TO_BIN(?)
                AND user_id = UUID_TO_BIN(?);
                `, [book_id, user_id]
            )
            if(bookExists.length === 0) return false
            
            await connection.query(
                `DELETE FROM users_favorites
                WHERE book_id = UUID_TO_BIN(?)
                AND user_id = UUID_TO_BIN(?);
                `, [book_id, user_id]
            )
            return true
        }catch{
            throw new Error('Error')
        }
    }
}