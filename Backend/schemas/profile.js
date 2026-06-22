import z from 'zod'

const profileSchema = z.object({
    profile_img: z.string().url().max(500),
    bio: z.string().min(2).max(200)
})

export function ValidatePartialProfile(input){
    return profileSchema.partial().safeParse(input)
}