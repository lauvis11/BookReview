import connection from '../config/db.js'

const DEFAULT_TOTAL_PAGES_FALLBACK = 250
const DEFAULT_PAGES_PER_HOUR = 45

function getServerDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveTotalPages(rawPages) {
  const num = Number(rawPages)
  return Number.isFinite(num) && num > 0 ? Math.round(num) : DEFAULT_TOTAL_PAGES_FALLBACK
}

export class ReadingModel {
  static async getTrackerState({ user_id }) {
    const [progressRows] = await connection.query(
      `SELECT
        BIN_TO_UUID(rs.book_id) AS book_id,
        rs.status,
        rs.pages_read,
        DATE_FORMAT(rs.completed_at, '%Y-%m-%d') AS completed_at,
        DATE_FORMAT(rs.updated_at, '%Y-%m-%d') AS updated_date,
        b.title,
        b.img,
        b.pages AS total_pages,
        (
          SELECT GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ')
          FROM book_author ba
          JOIN author a ON a.id = ba.author_id
          WHERE ba.book_id = rs.book_id
        ) AS author,
        (
          SELECT DATE_FORMAT(MAX(rl.read_date), '%Y-%m-%d')
          FROM reading_logs rl
          WHERE rl.user_id = rs.user_id AND rl.book_id = rs.book_id
        ) AS last_log_date
      FROM reading_status rs
      JOIN book b ON b.id = rs.book_id
      WHERE rs.user_id = UUID_TO_BIN(?)
        AND (rs.pages_read > 0 OR rs.status IN ('reading', 'completed'))
      ORDER BY rs.updated_at DESC`,
      [user_id]
    )

    const [logRows] = await connection.query(
      `SELECT
        rl.id,
        BIN_TO_UUID(rl.book_id) AS book_id,
        DATE_FORMAT(rl.read_date, '%Y-%m-%d') AS read_date,
        rl.pages_delta,
        rl.pages_read_after,
        rl.minutes_spent,
        rl.created_at,
        b.title AS book_title,
        b.img AS book_img,
        b.pages AS total_pages
      FROM reading_logs rl
      JOIN book b ON b.id = rl.book_id
      WHERE rl.user_id = UUID_TO_BIN(?)
      ORDER BY rl.read_date DESC, rl.id DESC`,
      [user_id]
    )

    const booksProgress = {}
    for (const row of progressRows) {
      const totalPages = resolveTotalPages(row.total_pages)
      const rawPagesRead =
        row.status === 'completed' && Number(row.pages_read) <= 0
          ? totalPages
          : Number(row.pages_read) || 0
      const pagesRead = Math.min(totalPages, Math.max(0, Math.round(rawPagesRead)))

      booksProgress[row.book_id] = {
        bookId: row.book_id,
        status: row.status,
        title: row.title || 'Libro sin título',
        author: row.author || 'Autor desconocido',
        img: row.img || null,
        totalPages,
        pagesRead,
        lastReadDate: row.last_log_date || (pagesRead > 0 ? row.updated_date : null),
        completedAt: row.completed_at || null,
      }
    }

    const logs = logRows.map((row) => {
      const totalPages = resolveTotalPages(row.total_pages)
      const delta = Math.max(0, Number(row.pages_delta) || 0)
      const readAfter = Math.max(0, Number(row.pages_read_after) || 0)
      const completedBook = totalPages > 0 && readAfter >= totalPages && readAfter - delta < totalPages

      return {
        id: String(row.id),
        date: row.read_date,
        timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        bookId: row.book_id,
        bookTitle: row.book_title || 'Libro',
        bookImg: row.book_img || null,
        totalPages,
        pagesDelta: delta,
        pagesReadAfter: readAfter,
        minutesSpent: Math.max(0, Number(row.minutes_spent) || 0),
        completedBook,
      }
    })

    return { booksProgress, logs }
  }

  static async logPages({ user_id, input }) {
    const {
      book_id,
      mode = 'add',
      pages_input,
      minutes_spent,
      read_date,
      pages_per_hour,
    } = input

    const readDate = read_date || getServerDateStr()
    const conn = await connection.getConnection()

    try {
      await conn.beginTransaction()

      const [bookRows] = await conn.query(
        `SELECT
          BIN_TO_UUID(b.id) AS id,
          b.title,
          b.img,
          b.pages,
          (
            SELECT GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ')
            FROM book_author ba
            JOIN author a ON a.id = ba.author_id
            WHERE ba.book_id = b.id
          ) AS author
        FROM book b
        WHERE b.id = UUID_TO_BIN(?)`,
        [book_id]
      )

      if (bookRows.length === 0) {
        await conn.rollback()
        return { notFound: true }
      }

      const book = bookRows[0]
      const totalPages = resolveTotalPages(book.pages)

      const [existingRows] = await conn.query(
        `SELECT
          status,
          pages_read,
          DATE_FORMAT(completed_at, '%Y-%m-%d') AS completed_at
        FROM reading_status
        WHERE user_id = UUID_TO_BIN(?) AND book_id = UUID_TO_BIN(?)
        FOR UPDATE`,
        [user_id, book_id]
      )

      const existing = existingRows[0] || null
      const prevStatus = existing?.status || null
      const prevPagesRead = Math.min(totalPages, Math.max(0, Math.round(Number(existing?.pages_read) || 0)))
      const sanitizedInput = Math.max(0, Math.round(Number(pages_input) || 0))

      const nextPagesRead =
        mode === 'set'
          ? Math.min(totalPages, sanitizedInput)
          : Math.min(totalPages, prevPagesRead + sanitizedInput)

      const pagesDelta = Math.max(0, nextPagesRead - prevPagesRead)

      if (pagesDelta <= 0) {
        await conn.rollback()
        const remainingPages = Math.max(0, totalPages - prevPagesRead)
        const percentage = totalPages > 0 ? Math.min(100, Math.round((prevPagesRead / totalPages) * 100)) : 0
        return {
          pagesDelta: 0,
          justCompleted: false,
          statusChanged: false,
          bookProgress: {
            bookId: book.id,
            status: prevStatus,
            title: book.title || 'Libro sin título',
            author: book.author || 'Autor desconocido',
            img: book.img || null,
            totalPages,
            pagesRead: prevPagesRead,
            remainingPages,
            percentage,
            isCompleted: prevPagesRead >= totalPages,
            lastReadDate: null,
            completedAt: existing?.completed_at || null,
          },
          log: null,
        }
      }

      const wasCompleted = prevPagesRead >= totalPages || prevStatus === 'completed'
      const isNowCompleted = nextPagesRead >= totalPages
      const justCompleted = !wasCompleted && isNowCompleted
      const nextStatus = isNowCompleted
        ? 'completed'
        : prevStatus === 'completed'
          ? 'completed'
          : 'reading'
      const statusChanged = nextStatus !== prevStatus

      const completedAtTimestamp = isNowCompleted ? `${readDate} 12:00:00` : null

      await conn.query(
        `INSERT INTO reading_status (user_id, book_id, status, pages_read, completed_at)
         VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           pages_read = VALUES(pages_read),
           completed_at = CASE
             WHEN VALUES(status) = 'completed' THEN COALESCE(reading_status.completed_at, VALUES(completed_at))
             ELSE reading_status.completed_at
           END`,
        [user_id, book_id, nextStatus, nextPagesRead, completedAtTimestamp]
      )

      const effectivePace = Number(pages_per_hour) || DEFAULT_PAGES_PER_HOUR
      const resolvedMinutes =
        Number(minutes_spent) > 0
          ? Math.round(Number(minutes_spent))
          : Math.max(1, Math.round((pagesDelta * 60) / effectivePace))

      const [insertRes] = await conn.query(
        `INSERT INTO reading_logs (user_id, book_id, read_date, pages_delta, pages_read_after, minutes_spent)
         VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?)`,
        [user_id, book_id, readDate, pagesDelta, nextPagesRead, resolvedMinutes]
      )

      await conn.commit()

      const finalCompletedAt = isNowCompleted ? existing?.completed_at || readDate : existing?.completed_at || null
      const remainingPages = Math.max(0, totalPages - nextPagesRead)
      const percentage = totalPages > 0 ? Math.min(100, Math.round((nextPagesRead / totalPages) * 100)) : 0

      return {
        pagesDelta,
        justCompleted,
        statusChanged,
        status: nextStatus,
        bookProgress: {
          bookId: book.id,
          status: nextStatus,
          title: book.title || 'Libro sin título',
          author: book.author || 'Autor desconocido',
          img: book.img || null,
          totalPages,
          pagesRead: nextPagesRead,
          remainingPages,
          percentage,
          isCompleted: isNowCompleted,
          lastReadDate: readDate,
          completedAt: finalCompletedAt,
        },
        log: {
          id: String(insertRes.insertId),
          date: readDate,
          timestamp: new Date().toISOString(),
          bookId: book.id,
          bookTitle: book.title || 'Libro sin título',
          bookImg: book.img || null,
          totalPages,
          pagesDelta,
          pagesReadAfter: nextPagesRead,
          minutesSpent: resolvedMinutes,
          completedBook: justCompleted,
        },
      }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  }
}
