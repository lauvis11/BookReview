import z from 'zod'

const favoritesSchema = z.object({
    book_id: z.string().uuid()
})

export function ValidateUserFavorite(input){
    return favoritesSchema.safeParse(input)
}   