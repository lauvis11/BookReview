import z from 'zod'

const commentsSchema = z.object({
    content: z.string().min(2).max(500),
    parent_id: z.number().int().positive().nullable().optional()
})

export function ValidateComment(input){
    return commentsSchema.safeParse(input)
}