import z from 'zod'

const profileSchema = z.object({
    profile_img: z.string().url().max(500),
    bio: z.string().max(300).nullable().optional()
})

export function ValidatePartialProfile(input){
    return profileSchema.partial().safeParse(input)
}