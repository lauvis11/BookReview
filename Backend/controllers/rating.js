import { validateRate } from "../schemas/rating.js"
import { RatingModel } from "../models/rating.js"

export class RatingController{
    static async save(req, res, next){
        try {
            const {id} = req.params
            const userData = req.session.user
            const verifyRate = validateRate(req.body)
            if(!verifyRate.success) return res.status(401).json({message: 'Invalid rate data'})
            const rate = await RatingModel.save({book_id: id, user_id: userData.id, rate: verifyRate.data.rate})
            res.status(200).json({rate: verifyRate.data.rate, message: 'Rate complete'})
        } catch (e) {
            next(e)
        }
    }

    static async getByUser(req, res, next){
        try {
            const {id} = req.params
            const userData = req.session.user
            const rating = await RatingModel.getByUser({book_id: id, user_id: userData.id})
            if(rating === null) return res.status(200).json({rate: null})
            res.status(200).json(rating)
        } catch (e) {
            next(e)
        }
    }
}
