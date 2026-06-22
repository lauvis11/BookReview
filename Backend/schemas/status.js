import z from 'zod'

const statusSchema = z.object({
    book_id: z.string().uuid(),
    status: z.enum(['reading', 'completed', 'want_to_read'])
})

export function ValidateStatus(input){
    return statusSchema.safeParse(input)
}
