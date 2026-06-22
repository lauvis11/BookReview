import { FavoritesModel } from "../models/favorite.js"
import { ValidateUserFavorite } from "../schemas/favorites.js"

export class FavoritesController{
    static async getAll(req, res, next){
        try {
            const userData = req.session.user
            const favoritesBooks = await FavoritesModel.getAll({user_id: userData.id})
            const favoritesBooksData = favoritesBooks.map(b => ({ ...b, genre: b.genre.split(','), author: b.author ? b.author.split(',') : []}))
            res.status(200).send(favoritesBooksData)
        } catch (e) {
            next(e)
        }
    }

    static async save(req, res, next){
        try {
            const bookId = ValidateUserFavorite(req.body)
            if(!bookId.success) return res.status(401).json({message: 'Invalid Data'})
            const userData = req.session.user
            const favoriteBook = await FavoritesModel.save({book_id: bookId.data.book_id, user_id: userData.id})
            if(favoriteBook === false) return res.status(404).json({message: 'Book exists'})
            res.status(200).json({message: 'Book save successuly'})
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const { id } = req.params
            const userData = req.session.user
            const favoriteBook = await FavoritesModel.delete({book_id: id, user_id: userData.id})
            if(favoriteBook === false) return res.status(404).json({message: 'Book not found'})
            res.status(200).json({message: 'Book delete succesfully'})
        } catch (e) {
            next(e)
        }
    }
}
