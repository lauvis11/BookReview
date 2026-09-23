import crypto from 'node:crypto'
import connection from '../config/db.js'

export class BookModel {
    static async getAll({ genre, editorial, title, author, limit, offset }) {
        if (author) {
            const [books] = await connection.query(
                `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
                JOIN book ON book.id = book_genre.book_id
                JOIN genre ON genre.id = genre_id
                JOIN editorial ON editorial.id = book.editorial_id
                LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
                JOIN book_author ON book_author.book_id = book_genre.book_id
                JOIN author ON author.id = book_author.author_id
                WHERE LOWER(author.name) LIKE LOWER(?)
                GROUP BY book_genre.book_id
                LIMIT ?
                OFFSET ?;
                `, [`%${author}%`, limit, offset]
            )
            return books
        }

        if (genre) {
            const [books] = await connection.query(
                `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
                JOIN book ON book.id = book_genre.book_id
                JOIN genre ON genre.id = genre_id
                JOIN editorial ON editorial.id = book.editorial_id
                LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
                LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
                LEFT JOIN author ON author.id = book_author.author_id
                WHERE LOWER(genre.name) LIKE LOWER(?)
                GROUP BY book_genre.book_id
                LIMIT ?
                OFFSET ?;
                `, [`%${genre}%`, limit, offset]
            )

            return books
        }

        if (editorial) {
            const [books] = await connection.query(
                `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
                JOIN book ON book.id = book_genre.book_id
                JOIN genre ON genre.id = genre_id
                JOIN editorial ON editorial.id = book.editorial_id
                LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
                LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
                LEFT JOIN author ON author.id = book_author.author_id
                WHERE LOWER(editorial.name) LIKE LOWER(?)
                GROUP BY book_genre.book_id
                LIMIT ?
                OFFSET ?;
                `, [`%${editorial}%`, limit, offset]
            )

            return books
        }

        if (title) {
            const [books] = await connection.query(
                `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
                JOIN book ON book.id = book_genre.book_id
                JOIN genre ON genre.id = genre_id
                JOIN editorial ON editorial.id = book.editorial_id
                LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
                LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
                LEFT JOIN author ON author.id = book_author.author_id
                WHERE LOWER(book.title) LIKE LOWER(?)
                GROUP BY book_genre.book_id
                LIMIT ?
                OFFSET ?;
                `, [`%${title}%`, limit, offset]
            )
            return books
        }

        const [books] = await connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
            JOIN book ON book.id = book_genre.book_id
            JOIN genre ON genre.id = genre_id
            JOIN editorial ON editorial.id = book.editorial_id
            LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
            LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
            LEFT JOIN author ON author.id = book_author.author_id
            GROUP BY book_genre.book_id
            LIMIT ?
            OFFSET ?;
            `, [limit, offset]
        )
        return books
    }

    static async getById({ id }) {
        const [book] = await connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
            JOIN book ON book.id = book_genre.book_id
            JOIN genre ON genre.id = genre_id
            JOIN editorial ON editorial.id = book.editorial_id
            LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
            LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
            LEFT JOIN author ON author.id = book_author.author_id
            WHERE book_genre.book_id = UUID_TO_BIN(?)
            GROUP BY book_genre.book_id;
            `, [id]
        )
        return book[0]
    }

    static async getByGoogleId({ googleId }) {
        const [book] = await connection.query(
            `SELECT id FROM book WHERE googleBooksId = ? LIMIT 1;`, [googleId]
        )
        return book[0] || null
    }

    static async create({ input }) {
        const {
            title,
            pages,
            year,
            editorial,
            genre,
            img,
            author,
            sinopsis,
            googleBooksId    
        } = input

        const uuid = crypto.randomUUID()
        const conn = connection.getConnection ? await connection.getConnection() : connection
        const hasTx = typeof conn.beginTransaction === 'function'

        try {
            if (hasTx) await conn.beginTransaction()

            // Create editorial if not exists
            let editorialId
            const [existingEditorial] = await conn.query(
                `SELECT id FROM editorial WHERE name = ?`, [editorial]
            )
            if (existingEditorial.length > 0) {
                editorialId = existingEditorial[0].id
            } else {
                const [newEditorial] = await conn.query(
                    `INSERT INTO editorial(name) VALUES (?)`, [editorial]
                )
                editorialId = newEditorial.insertId
            }

            await conn.query(
                `INSERT INTO book(id, title, pages, year, editorial_id, img, sinopsis, googleBooksId) VALUES
                (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?);
                `, [uuid, title, pages, year, editorialId, img, sinopsis, googleBooksId || null]
            )

            for (const g of genre) {
                // Create genre if not exists
                let genreId
                const [genres] = await conn.query(
                    `SELECT id FROM genre WHERE name = ?`, [g]
                )
                if (genres.length > 0) {
                    genreId = genres[0].id
                } else {
                    const [newGenre] = await conn.query(
                        `INSERT INTO genre(name) VALUES (?)`, [g]
                    )
                    genreId = newGenre.insertId
                }

                await conn.query(
                    `INSERT INTO book_genre(book_id, genre_id) VALUES
                    (UUID_TO_BIN(?), ?);
                    `, [uuid, genreId]
                )
            }

            for (const a of author) {
                const [authors] = await conn.query(
                    `SELECT id FROM author WHERE name = ?`, [a]
                )

                let authorId
                if (authors.length === 0) {
                    const [newAuthor] = await conn.query(
                        `INSERT INTO author(name) VALUES (?)`, [a]
                    )
                    authorId = newAuthor.insertId
                } else {
                    authorId = authors[0].id
                }

                await conn.query(
                    `INSERT INTO book_author(book_id, author_id) VALUES
                    (UUID_TO_BIN(?), ?);`, [uuid, authorId]
                )
            }

            if (hasTx) await conn.commit()
        } catch (error) {
            if (hasTx) await conn.rollback()
            console.log(error)
            throw new Error('Error creating book')
        } finally {
            if (conn.release) conn.release()
        }

        const [book] = await connection.query(
            `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis FROM book_genre
            JOIN book ON book.id = book_genre.book_id
            JOIN genre ON genre.id = book_genre.genre_id
            JOIN editorial ON editorial.id = book.editorial_id
            LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
            LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
            LEFT JOIN author ON author.id = book_author.author_id
            WHERE book_genre.book_id = UUID_TO_BIN(?)
            GROUP BY book_genre.book_id;
            `, [uuid]
        )

        return book[0]
    }

    static async update({ id, input }) {
        // Whitelist de columnas permitidas para prevenir SQL injection
        const ALLOWED_BOOK_COLUMNS = ['title', 'pages', 'year', 'img', 'sinopsis', 'googleBooksId']

        // Si no hay datos, terminamos de inmediato
        if (Object.keys(input).length === 0) return false

        // Separamos las propiedades que requieren actualización condicional 
        // en otras tablas de las que son propias de "book"
        const { genre, author, editorial, ...bookData } = input

        try {
            // Validamos que el libro exista
            const [existingBook] = await connection.query(`SELECT id FROM book WHERE id = UUID_TO_BIN(?)`, [id])
            if (existingBook.length === 0) return false

            const updateFields = []
            const updateValues = []

            // 1. Manejo de 'editorial'
            if (editorial !== undefined) {
                updateFields.push('editorial_id = (SELECT id FROM editorial WHERE name = ?)')
                updateValues.push(editorial)
            }

            // 2. Manejo de columnas directas de la tabla book (solo columnas permitidas)
            for (const [key, value] of Object.entries(bookData)) {
                if (!ALLOWED_BOOK_COLUMNS.includes(key)) continue
                updateFields.push(`\`${key}\` = ?`)
                updateValues.push(value)
            }

            // 3. Ejecutar UPDATE sobre book solo si hay cambios en esa tabla
            if (updateFields.length > 0) {
                updateValues.push(id)
                await connection.query(
                    `UPDATE book 
                    SET ${updateFields.join(', ')} 
                    WHERE id = UUID_TO_BIN(?);`,
                    updateValues
                )
            }

            // 4. Actualizar géneros 
            if (genre !== undefined) {
                await connection.query(`DELETE FROM book_genre WHERE book_id = UUID_TO_BIN(?);`, [id])

                await Promise.all(genre.map(async (g) => {
                    const [genres] = await connection.query(`SELECT id FROM genre WHERE name = ?;`, [g])
                    if (genres.length > 0) {
                        await connection.query(
                            `INSERT INTO book_genre(book_id, genre_id) VALUES (UUID_TO_BIN(?), ?);`,
                            [id, genres[0].id]
                        )
                    }
                }))
            }

            // 5. Actualizar autores
            if (author !== undefined) {
                await connection.query(`DELETE FROM book_author WHERE book_id = UUID_TO_BIN(?);`, [id])

                await Promise.all(author.map(async (a) => {
                    let authorId
                    const [authors] = await connection.query(`SELECT id FROM author WHERE name = ?;`, [a])

                    if (authors.length === 0) {
                        const [newAuthor] = await connection.query(`INSERT INTO author(name) VALUES (?);`, [a])
                        authorId = newAuthor.insertId
                    } else {
                        authorId = authors[0].id
                    }

                    await connection.query(
                        `INSERT INTO book_author(book_id, author_id) VALUES (UUID_TO_BIN(?), ?);`,
                        [id, authorId]
                    )
                }))
            }

            // 6. Consultamos nuestro libro actualizado con sus relaciones
            const [book] = await connection.query(
                `SELECT BIN_TO_UUID(book_genre.book_id) id, book.title, book.pages, book.year, book.img, editorial.name editorial, GROUP_CONCAT(DISTINCT genre.name) genre, GROUP_CONCAT(DISTINCT author.name) author, ROUND(COALESCE(AVG(ratings.rate), 0), 1) rate, book.sinopsis  FROM book_genre
                JOIN book ON book.id = book_genre.book_id
                JOIN genre ON genre.id = book_genre.genre_id
                JOIN editorial ON editorial.id = book.editorial_id
                LEFT JOIN ratings ON ratings.book_id = book_genre.book_id
                LEFT JOIN book_author ON book_author.book_id = book_genre.book_id
                LEFT JOIN author ON author.id = book_author.author_id
                WHERE book_genre.book_id = UUID_TO_BIN(?)
                GROUP BY book_genre.book_id;
                `, [id]
            )

            return book[0]

        } catch (error) {
            console.error(error)
            throw new Error('Error updating book')
        }
    }

    static async delete({ id }) {
        const conn = connection.getConnection ? await connection.getConnection() : connection
        const hasTx = typeof conn.beginTransaction === 'function'

        try {
            if (hasTx) await conn.beginTransaction()

            const [result] = await conn.query(
                `SELECT id from book WHERE id = UUID_TO_BIN(?);`, [id]
            )

            if (result.length === 0) {
                if (hasTx) await conn.rollback()
                return false
            }

            // Delete ratings
            await conn.query(
                `DELETE FROM ratings WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete reading status
            await conn.query(
                `DELETE FROM reading_status WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete comment_likes linked to comments of this book
            await conn.query(
                `DELETE FROM comments_likes WHERE comment_id IN (SELECT id FROM comments WHERE book_id = UUID_TO_BIN(?));`, [id]
            )

            // Delete comments
            await conn.query(
                `DELETE FROM comments WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete favorites
            await conn.query(
                `DELETE FROM users_favorites WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete book_genre
            await conn.query(
                `DELETE FROM book_genre WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete book_author
            await conn.query(
                `DELETE FROM book_author WHERE book_id = UUID_TO_BIN(?);`, [id]
            )

            // Delete book
            await conn.query(
                `DELETE FROM book WHERE id = UUID_TO_BIN(?);`, [id]
            )

            if (hasTx) await conn.commit()
            return true
        } catch (error) {
            if (hasTx) await conn.rollback()
            console.error("SQL DELETE ERROR: ", error)
            throw new Error('Error deleting book')
        } finally {
            if (conn.release) conn.release()
        }
    }
}