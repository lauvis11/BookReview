import { StatusModel } from "../models/status.js"
import { ValidateStatus } from "../schemas/status.js"


export class StatusController{
    static async getByStatus(req, res, next){
        try {
            const { status } = req.query
            const userData = req.session.user
            const booksForStatus = await StatusModel.getByStatus({status, user_id: userData.id})
            if(booksForStatus.length === 0) return res.status(200).json({message: 'Books not found'})
            res.status(200).json(booksForStatus)
        } catch (e) {
            next(e)
        }
    }

    static async save(req, res, next){
        try {
            const result = ValidateStatus(req.body)
            if(!result.success) return res.status(400).json({message: 'Invalid status data'})
            const userData = req.session.user
            const saveStatus = await StatusModel.save({user_id: userData.id, input: result.data})
            res.status(201).json(saveStatus)
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const { id } = req.params
            const userData = req.session.user
            await StatusModel.delete({user_id: userData.id, book_id: id})
            return res.status(200).json({message: 'Delete succesfuly'})
        } catch (e) {
            next(e)
        }
    }
}
