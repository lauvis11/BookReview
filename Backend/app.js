import express, { json } from 'express';
const app = express();
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middleware/errorHandler.js';
import { bookRouter } from './routes/book.js';
import { authRouter } from './routes/auth.js';
import { favoritesRouter } from './routes/favorites.js';
import { verifyToken } from './middleware/verifyToken.js';
import cors from 'cors'
import { ratingRouter } from './routes/rating.js';
import { commentsRouter } from './routes/comment.js';
import { profileRouter } from './routes/profile.js';
import { statusRouter } from './routes/status.js';
import { aiRouter } from './routes/ai.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';




const PORT = process.env.PORT ?? 1234;
app.disable('x-powered-by');
app.use(json({ limit: '16kb' }));
app.use(helmet());

// Solo confiar en proxy en producción (previene IP spoofing en desarrollo)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}

const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || (process.env.NODE_ENV === 'production' && origin.endsWith('.vercel.app'))) {
            return callback(null, true);
        }
        return callback(new Error('Blocked by CORS'));
    },
    credentials: true
}));
app.use(cookieParser())

// Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(globalLimiter)

// Rate limiting específico para auth (previene brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 intentos por ventana
    message: { message: 'Too many authentication attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})




app.get('/', (req, res) => {
    res.json({ message: 'API de biblioteca' })
})


app.use('/books', bookRouter)
app.use('/auth', authLimiter, authRouter)
app.use('/user', profileRouter)
app.use('/users', verifyToken, favoritesRouter)
app.use('/books', verifyToken, ratingRouter)
app.use('/book', commentsRouter)
app.use('/status', verifyToken, statusRouter)
app.use('/ai', aiRouter)

app.use(errorHandler)

if(process.env.NODE_ENV !== 'production'){
    const server = app.listen(PORT, ()=>{
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`)
    })

    process.on('SIGTERM', () => {
        server.close(() => {
            connection.end()
        })
    })
    process.on('SIGINT', () => {
        server.close(() => {
            connection.end()
        })
    })
}

export default app;
