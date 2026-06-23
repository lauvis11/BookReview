import mysql from 'mysql2/promise'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}
const connection = mysql.createPool(config)

export class CommentModel{
    static async getAll({id, user_id}){
        const [comments] = await connection.query(
            `SELECT book.title, comments.id, BIN_TO_UUID(users.id) AS user_id, users.name, user_profile.profile_img, content, comments.create_at, COUNT(comments_likes.comment_id) AS likes,
            CASE WHEN user_like.user_id IS NOT NULL THEN 1 ELSE 0 END AS user_liked FROM comments 
            JOIN users ON users.id = comments.user_id
            JOIN user_profile ON user_profile.user_id = users.id
            JOIN book ON book.id = comments.book_id
            LEFT JOIN comments_likes ON comments_likes.comment_id = comments.id
            LEFT JOIN comments_likes AS user_like ON user_like.comment_id = comments.id AND user_like.user_id = UUID_TO_BIN(?)
            WHERE book.id = UUID_TO_BIN(?) AND comments.parent_id IS NULL
            GROUP BY comments.id;
            `, [user_id, id]
        )
        return comments
    }

    static async getReplies({id, user_id}){
        const [replies] = await connection.query(
            `SELECT comments.id, BIN_TO_UUID(users.id) AS user_id, users.name, user_profile.profile_img, content, comments.create_at, COUNT(comments_likes.comment_id) AS likes, CASE WHEN user_like.user_id IS NOT NULL THEN 1 ELSE 0 END AS user_liked FROM comments
            JOIN users ON users.id = comments.user_id
            JOIN user_profile ON user_profile.user_id = users.id
            LEFT JOIN comments_likes ON comments_likes.comment_id = comments.id
            LEFT JOIN comments_likes AS user_like ON user_like.comment_id = comments.id AND user_like.user_id = UUID_TO_BIN(?)
            WHERE comments.parent_id = ? 
            GROUP BY comments.id;
            `, [user_id, id]
        )
        return replies
    }

    static async create({book_id, user_id, input}){
        const {content, parent_id} = input
        await connection.query(
            `INSERT INTO comments(book_id, user_id, content, parent_id)
            VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?);
            `, [book_id, user_id, content, parent_id]
        )
        return true
    }

    static async delete({user_id, comment_id}){
        const [verify] = await connection.query(
            `SELECT id FROM comments WHERE id = ? AND user_id = UUID_TO_BIN(?);
            `, [comment_id, user_id]
        )

        if(verify.length === 0) return false
        
        await connection.query(
            `DELETE FROM comments_likes WHERE comment_id = ?
            `, [comment_id]
        )

        await connection.query(
            `DELETE FROM comments_likes WHERE comment_id IN (SELECT id FROM comments WHERE parent_id = ?)
            `, [comment_id]
        )

        await connection.query(
            `DELETE FROM comments WHERE parent_id = ?;
            `, [comment_id]
        )

        await connection.query(
            `DELETE FROM comments WHERE id = ? AND user_id = UUID_TO_BIN(?);
            `, [comment_id,  user_id]
        )
    }

    static async like({user_id, comment_id}){
        await connection.query(
            `INSERT INTO comments_likes(comment_id, user_id)
            VALUES(?, UUID_TO_BIN(?));
            `, [comment_id, user_id]
        )
    }

    static async deleteLike({user_id, comment_id}){
        await connection.query(
            `DELETE FROM comments_likes WHERE comment_id = ? AND user_id = UUID_TO_BIN(?);
            `, [comment_id, user_id]
        )
    }
}