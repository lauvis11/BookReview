import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import connection from '../config/db.js'

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
  'https://api.dicebear.com/7.x/notionists/svg?seed=10',
]

export class AuthModel {
  static async create({ input }) {
    const { email, password } = input
    const normalizedEmail = email.trim().toLowerCase()

    const passwordHashed = await bcrypt.hash(password, 10)
    const uuid = crypto.randomUUID()
    // Nombre temporal único hasta que el usuario complete su perfil al registrarse
    const tempName = `lector_${crypto.randomBytes(4).toString('hex')}`

    try {
      const [existingUsers] = await connection.query(
        `SELECT id FROM users WHERE email = ? LIMIT 1;`,
        [normalizedEmail]
      )

      if (existingUsers.length > 0) {
        return { conflict: 'email' }
      }

      await connection.query(
        `INSERT INTO users(id, name, email, password)
         VALUES (UUID_TO_BIN(?), ?, ?, ?);`,
        [uuid, tempName, normalizedEmail, passwordHashed]
      )

      const randomAvatar =
        PREDEFINED_AVATARS[Math.floor(Math.random() * PREDEFINED_AVATARS.length)]

      await connection.query(
        `INSERT INTO user_profile(user_id, profile_img)
         VALUES(UUID_TO_BIN(?), ?);`,
        [uuid, randomAvatar]
      )

      const [userCreated] = await connection.query(
        `SELECT BIN_TO_UUID(id) id, name, email FROM users
         WHERE id = UUID_TO_BIN(?);`,
        [uuid]
      )
      return userCreated
    } catch (e) {
      console.log(e)
      throw new Error('500 Server Error')
    }
  }

  static async login({ input }) {
    const { email, password } = input
    const normalizedEmail = String(email || '').trim().toLowerCase()

    const [user] = await connection.query(
      `SELECT BIN_TO_UUID(u.id) id, u.name, u.email, u.password, u.role, p.profile_img
       FROM users u
       LEFT JOIN user_profile p ON u.id = p.user_id
       WHERE u.email = ?
       LIMIT 1;`,
      [normalizedEmail]
    )

    if (user.length === 0) return false

    const isValid = await bcrypt.compare(password, user[0].password)
    if (!isValid) return false

    const { password: hashedPassword, ...userData } = user[0]
    void hashedPassword

    return userData
  }

  static async refresh({ userId, refreshToken }) {
    await connection.query(
      `DELETE FROM refresh_tokens WHERE user_id = UUID_TO_BIN(?);`,
      [userId]
    )
    await connection.query(
      `INSERT INTO refresh_tokens(user_id, token)
       VALUES (UUID_TO_BIN(?), ?);`,
      [userId, refreshToken]
    )
  }

  static async verifyToken({ refreshToken }) {
    const [tokens] = await connection.query(
      `SELECT id FROM refresh_tokens WHERE token = ?;`,
      [refreshToken]
    )
    return tokens.length > 0
  }

  static async deleteRefreshToken({ refreshToken }) {
    await connection.query(
      `DELETE FROM refresh_tokens WHERE token = ?;`,
      [refreshToken]
    )
  }

  static async updatePassword({ user_id, input }) {
    const { current_password, new_password } = input

    const [userPassword] = await connection.query(
      `SELECT password FROM users WHERE id = UUID_TO_BIN(?);`,
      [user_id]
    )

    if (userPassword.length === 0) return false

    const isValid = await bcrypt.compare(current_password, userPassword[0].password)
    if (!isValid) return false

    const hashedNewPassword = await bcrypt.hash(new_password, 10)

    await connection.query(
      `UPDATE users SET password = ? WHERE id = UUID_TO_BIN(?);`,
      [hashedNewPassword, user_id]
    )

    return true
  }

  static async findByEmailForRecovery({ email }) {
    const normalizedEmail = email.trim().toLowerCase()
    const [rows] = await connection.query(
      `SELECT BIN_TO_UUID(id) id, name, email, password
       FROM users
       WHERE email = ?
       LIMIT 1;`,
      [normalizedEmail]
    )
    return rows[0] || null
  }

  static async findByIdForRecovery({ user_id }) {
    const [rows] = await connection.query(
      `SELECT BIN_TO_UUID(id) id, name, email, password
       FROM users
       WHERE id = UUID_TO_BIN(?)
       LIMIT 1;`,
      [user_id]
    )
    return rows[0] || null
  }

  static async resetPasswordByRecovery({ user_id, new_password }) {
    const hashedNewPassword = await bcrypt.hash(new_password, 10)

    const [updateRes] = await connection.query(
      `UPDATE users SET password = ? WHERE id = UUID_TO_BIN(?);`,
      [hashedNewPassword, user_id]
    )

    if (updateRes.affectedRows === 0) return false

    // Revoca sesiones activas previas tras recuperar contraseña
    await connection.query(
      `DELETE FROM refresh_tokens WHERE user_id = UUID_TO_BIN(?);`,
      [user_id]
    )

    return true
  }

  static async updateEmail({ user_id, email }) {
    const normalizedEmail = email.trim().toLowerCase()
    const [existing] = await connection.query(
      `SELECT BIN_TO_UUID(id) id FROM users
       WHERE email = ? AND id != UUID_TO_BIN(?)
       LIMIT 1;`,
      [normalizedEmail, user_id]
    )

    if (existing.length > 0) {
      return { conflict: true }
    }

    await connection.query(
      `UPDATE users SET email = ? WHERE id = UUID_TO_BIN(?);`,
      [normalizedEmail, user_id]
    )

    return { email: normalizedEmail }
  }
}
