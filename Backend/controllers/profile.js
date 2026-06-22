import { ProfileModel } from "../models/profile.js"
import { ValidatePartialProfile } from "../schemas/profile.js"

export class ProfileController{
    static async getProfile(req, res, next){
        try {
            const { id } = req.params
            const userProfile = await ProfileModel.getProfile({id}) 
            if(userProfile === false) return res.status(404).json({message: 'User not found'})
            res.json(userProfile) 
        } catch (e) {
            next(e)
        }
    }

    static async update(req, res, next){
        try {
            const input = ValidatePartialProfile(req.body)
            if(!input.success) return res.status(400).json('Invalid Profile data')
            const userData = req.session.user
            const profileUpdate = await ProfileModel.update({id: userData.id, input: input.data})
            res.status(200).json(profileUpdate)
        } catch (e) {
            next(e)
        }
    }
}
