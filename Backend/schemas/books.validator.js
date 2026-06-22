import z from 'zod';

const bookValidatorSchema = z.object({
    googleBooksId: z.string().min(1, "Google Books ID es requerido"),
    title: z.string().min(1, "El título es requerido").max(255),
    author: z.string().min(1, "El autor es requerido").max(255),
    genres: z.array(z.string()).default([]),
    publisher: z.string().max(255).nullable().optional(),
    pages: z.number().int().positive().nullable().optional(),
    publishedYear: z.number().int().min(1000).max(new Date().getFullYear()).nullable().optional(),
    synopsis: z.string().max(5000).nullable().optional(),
    coverUrl: z.string().url("URL inválida").nullable().optional()
});

export function ValidateBook(input) {
    return bookValidatorSchema.safeParse(input);
}
