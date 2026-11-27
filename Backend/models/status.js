import connection from '../config/db.js'

export class StatusModel{
    static async getByStatus({status, user_id}){
        const [books] = await connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, MAX(reading_status.pages_read) pages_read, DATE_FORMAT(MAX(reading_status.completed_at), '%Y-%m-%d') completed_at FROM book_genre
            JOIN book ON book.id = book_genre.book_id
            JOIN genre ON genre.id = book_genre.genre_id
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
        const isCompleted = status === 'completed'
        let completedPages = 0

        if (isCompleted) {
            const [bookRows] = await connection.query(
                `SELECT pages FROM book WHERE id = UUID_TO_BIN(?)`,
                [book_id]
            )
            completedPages = Math.max(0, Number(bookRows[0]?.pages) || 0)
        }

        await connection.query(
            `INSERT INTO reading_status(user_id, book_id, status, pages_read, completed_at)
            VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                pages_read = CASE
                    WHEN VALUES(status) = 'completed' THEN GREATEST(reading_status.pages_read, VALUES(pages_read))
                    ELSE reading_status.pages_read
                END,
                completed_at = CASE
                    WHEN VALUES(status) = 'completed' THEN COALESCE(reading_status.completed_at, CURRENT_TIMESTAMP)
                    ELSE NULL
                END;
            `, [user_id, book_id, status, completedPages, isCompleted ? new Date() : null]
        )

        const [statusSaved] = await connection.query(
            `SELECT BIN_TO_UUID(book_id) id, status, pages_read, DATE_FORMAT(completed_at, '%Y-%m-%d') completed_at FROM reading_status
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