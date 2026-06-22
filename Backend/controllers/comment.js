import { CommentModel } from "../models/comment.js"
import { ValidateComment } from "../schemas/comment.js"

export class CommentController{
    static async getAll(req, res, next){
        try {
            const { id } = req.params
            const userId = req.session?.user?.id ?? null
            const comments = await CommentModel.getAll({id, user_id: userId})
            return res.json(comments) 
        } catch (e) {
            next(e)
        }
    }

    static async getReplies(req, res, next){
        try {
            const { id } = req.params
            const userId = req.session?.user?.id ?? null
            const replies = await CommentModel.getReplies({id, user_id: userId})
            return res.json(replies)
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next){
        try {
            const {id} = req.params
            const userData = req.session.user
            const commentVerify = ValidateComment(req.body)
            if(!commentVerify.success) return res.status(400).json({message: 'Invalid comment data'})
            await CommentModel.create({book_id: id, user_id: userData.id, input: commentVerify.data})
            res.status(201).json({message: 'Proccess complete'})
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const { id } = req.params
            const userData = req.session.user
            const result = await CommentModel.delete({user_id: userData.id, comment_id: id})
            if(result === false) return res.status(404).json({message: 'Comment not found'}) 
            res.status(200).json({message: 'Comment Deleted'})
        } catch (e) {
            next(e)
        }
    }

    static async like(req, res, next){
        try {
            const {id} = req.params
            const userData = req.session.user
            await CommentModel.like({user_id: userData.id, comment_id: id})
            return res.status(201).json({message: 'Comment liked'})
        } catch (e) {
            next(e)
        } 
    }

    static async deleteLike(req, res, next){
        try {
            const {id} = req.params
            const userData = req.session.user
            await CommentModel.deleteLike({user_id: userData.id, comment_id: id})
            return res.status(200).json({message: 'Like deleted'})
        } catch (e) {
            next(e)
        }
    }
}
