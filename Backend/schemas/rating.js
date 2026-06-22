import z from 'zod'

const rateSchema = z.object({
    rate: z.coerce.number().min(1).max(5)
})

export function validateRate(input){
    return rateSchema.safeParse(input)
}