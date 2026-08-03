import mysql from 'mysql2/promise'

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: Number(process.env.DB_PORT),   // Aiven requiere número, no string
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Aiven siempre requiere SSL — no condicionar a NODE_ENV
    ssl: {
        rejectUnauthorized: false
    },
    // Límites conservadores para el free tier de Aiven (máx 5 conexiones)
    connectionLimit: 3,
    waitForConnections: true,
    queueLimit: 0,
}

const connection = mysql.createPool(config)

export default connection
