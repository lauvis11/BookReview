import z from 'zod'

const readingLogSchema = z.object({
  book_id: z.string().uuid(),
  mode: z.enum(['add', 'set']).optional().default('add'),
  pages_input: z.coerce.number().int().min(0).max(50000),
  minutes_spent: z.coerce.number().int().min(1).max(1440).optional(),
  read_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'read_date must be YYYY-MM-DD')
    .optional(),
  pages_per_hour: z.coerce.number().int().min(10).max(150).optional(),
})

export function ValidateReadingLog(input) {
  return readingLogSchema.safeParse(input)
}
