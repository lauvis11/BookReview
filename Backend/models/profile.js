import connection from '../config/db.js'



export class ProfileModel{
    static async getProfile({id}){
        const [userProfile] = await connection.query(
            `SELECT BIN_TO_UUID(user_id) id, users.name, profile_img, bio, users.created_at FROM user_profile
            JOIN users ON users.id = user_profile.user_id
            WHERE users.id = UUID_TO_BIN(?);
            `, [id]
        )
        if(userProfile.length === 0) return false

        const booksByStatusQuery = (status) => connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img,
                    editorial.name editorial,
                    GROUP_CONCAT(DISTINCT genre.name) genre,
                    GROUP_CONCAT(DISTINCT author.name) author,
                    ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate
             FROM book_genre
             JOIN book ON book.id = book_genre.book_id
             JOIN genre ON genre.id = genre_id
             JOIN editorial ON editorial.id = book.editorial_id
             JOIN reading_status ON reading_status.book_id = book_genre.book_id
             LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
             LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
             LEFT JOIN author ON author.id = book_author.author_id
             WHERE reading_status.status = ? AND reading_status.user_id = UUID_TO_BIN(?)
             GROUP BY book_genre.book_id`, [status, id]
        )

        const favoritesQuery = () => connection.query(
            `SELECT BIN_TO_UUID(users_favorites.book_id) id, book.title, book.pages, book.year, book.img,
                    editorial.name editorial,
                    GROUP_CONCAT(DISTINCT genre.name) genre,
                    GROUP_CONCAT(DISTINCT author.name) author
             FROM users_favorites
             JOIN book ON book.id = users_favorites.book_id
             JOIN book_genre ON book_genre.book_id = users_favorites.book_id
             JOIN genre ON genre.id = book_genre.genre_id
             JOIN editorial ON editorial.id = book.editorial_id
             LEFT JOIN book_author ON book_author.book_id = users_favorites.book_id
             LEFT JOIN author ON author.id = book_author.author_id
             WHERE users_favorites.user_id = UUID_TO_BIN(?)
             GROUP BY book_genre.book_id`, [id]
        )

        const [
            [reading],
            [completed],
            [wantToRead],
            [favorites]
        ] = await Promise.all([
            booksByStatusQuery('reading'),
            booksByStatusQuery('completed'),
            booksByStatusQuery('want_to_read'),
            favoritesQuery()
        ])

        return {
            ...userProfile[0],
            reading,
            completed,
            want_to_read: wantToRead,
            favorites
        }
    }

    static async update({id, input}){
        const { name, ...profileFields } = input

        if (typeof name === 'string') {
            const trimmedName = name.trim()
            const [existing] = await connection.query(
                `SELECT BIN_TO_UUID(id) id FROM users
                 WHERE name = ? AND id != UUID_TO_BIN(?)
                 LIMIT 1;`,
                [trimmedName, id]
            )
            if (existing.length > 0) {
                return { conflict: 'name' }
            }

            await connection.query(
                `UPDATE users SET name = ?
                 WHERE id = UUID_TO_BIN(?);`,
                [trimmedName, id]
            )
        }

        // Whitelist de columnas permitidas para prevenir SQL injection
        const ALLOWED_COLUMNS = ['profile_img', 'bio']
        const safeEntries = Object.entries(profileFields).filter(([key]) => ALLOWED_COLUMNS.includes(key))

        if (safeEntries.length > 0) {
            const setClauses = safeEntries.map(([key]) => `\`${key}\` = ?`)
            const values = safeEntries.map(([, value]) => value)
            values.push(id)

            await connection.query(
                `UPDATE user_profile SET ${setClauses.join(', ')}
                WHERE user_id = UUID_TO_BIN(?);
                `, values
            )
        }

        if (typeof name !== 'string' && safeEntries.length === 0) return false

        const [dataUpdate] = await connection.query(
            `SELECT BIN_TO_UUID(up.user_id) id, u.name, up.profile_img, up.bio
             FROM user_profile up
             JOIN users u ON u.id = up.user_id
             WHERE up.user_id = UUID_TO_BIN(?);
            `, [id]
        )

        return dataUpdate[0]
    }
}