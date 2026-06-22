import { Router } from 'express'
export const favoritesRouter = Router()
import { FavoritesController } from '../controllers/favorite.js'


favoritesRouter.get('/favorites', FavoritesController.getAll)
favoritesRouter.post('/favorites', FavoritesController.save)
favoritesRouter.delete('/favorites/:id', FavoritesController.delete)