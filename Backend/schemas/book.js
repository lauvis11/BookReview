import z from 'zod'
const bookSchema = z.object({
    title: z.string().min(2).max(100),
    pages: z.number().int().positive(),
    year: z.number().int().min(1000).max(new Date().getFullYear()),
    editorial: z.string().min(2).max(50),
    genre: z.array(z.string().min(2).max(50)).min(1, 'Debe incluir al menos un género'),
    img: z.url().optional(),
    author: z.array(z.string().min(2).max(50)).min(1, 'Debe incluir al menos un autor'),
    sinopsis: z.string().min(2).max(5000)
})

export function validateBook(input){
    return bookSchema.safeParse(input)
}

export function validatePartialBook(input){
    return bookSchema.partial().safeParse(input)
}