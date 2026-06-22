import {Router} from 'express'
import { CommentController } from '../controllers/comment.js'
export const commentsRouter = Router()
import { verifyToken } from '../middleware/verifyToken.js'
import { verifyTokenOptional } from '../middleware/verifyTokenOptional.js'

commentsRouter.get('/:id/comments', verifyTokenOptional, CommentController.getAll)
commentsRouter.get('/comments/:id/replies', verifyTokenOptional, CommentController.getReplies)
commentsRouter.post('/:id/comments', verifyToken, CommentController.create)
commentsRouter.delete('/comments/:id', verifyToken, CommentController.delete)
commentsRouter.post('/comments/:id/likes', verifyToken, CommentController.like)
commentsRouter.delete('/comments/:id/likes', verifyToken, CommentController.deleteLike)
