import z from 'zod'
const bookSchema = z.object({
    title: z.string().min(2).max(100),
    pages: z.number().int().positive(),
    year: z.number().int().min(1000).max(new Date().getFullYear()),
    editorial: z.string().min(2).max(50),
    genre: z.array(z.string().min(2).max(50)),
    img: z.string().url().optional(),
    author: z.array(z.string().min(2).max(50)),
    sinopsis: z.string().min(2).max(500)
})

export function validateBook(input){
    return bookSchema.safeParse(input)
}

export function validatePartialBook(input){
    return bookSchema.partial().safeParse(input)
}