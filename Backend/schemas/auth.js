import z from 'zod'

const authSchema = z.object({
    name: z.string().min(3).max(10),
    password: z.string().min(6).max(100).regex(/[0-9]/, 'Debe tener al menos un número'),
})

const passwordSchema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(6).max(100).regex(/[0-9]/, 'Debe tener al menos un número'),
})

export function ValidateUser(input){
    return authSchema.safeParse(input)
}

export function ValidateNewPassword(input){
    return passwordSchema.safeParse(input)
}