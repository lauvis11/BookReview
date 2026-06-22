import { Router } from "express";
export const bookRouter = Router()
import { BookController } from '../controllers/book.js'
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from '../middleware/verifyAdmin.js';

bookRouter.get('/', BookController.getAll)
bookRouter.get('/search', verifyToken, verifyAdmin, BookController.searchBooks)
bookRouter.get('/:id', BookController.getById)
bookRouter.post('/', verifyToken, verifyAdmin, BookController.createBook)
bookRouter.patch('/:id', verifyToken, verifyAdmin, BookController.update)
bookRouter.delete('/:id', verifyToken, verifyAdmin, BookController.delete)