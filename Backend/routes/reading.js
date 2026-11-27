import { Router } from 'express'
import { ReadingController } from '../controllers/reading.js'

export const readingRouter = Router()

readingRouter.get('/tracker', ReadingController.getTracker)
readingRouter.post('/logs', ReadingController.logPages)
