import z from 'zod'

const passwordRule = z
  .string()
  .min(6)
  .max(100)
  .regex(/[0-9]/, 'Debe tener al menos un número')

const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').max(255),
  password: z.string().min(1).max(100),
})

const registerSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').max(255),
  password: passwordRule,
})

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: passwordRule,
})

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').max(255),
})

const verifyResetCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
  recoveryToken: z.string().min(10),
})

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  new_password: passwordRule,
})

const updateEmailSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido').max(255),
})

export function ValidateLogin(input) {
  return loginSchema.safeParse(input)
}

export function ValidateUser(input) {
  return loginSchema.safeParse(input)
}

export function ValidateRegister(input) {
  return registerSchema.safeParse(input)
}

export function ValidateNewPassword(input) {
  return passwordSchema.safeParse(input)
}

export function ValidateForgotPassword(input) {
  return forgotPasswordSchema.safeParse(input)
}

export function ValidateVerifyResetCode(input) {
  return verifyResetCodeSchema.safeParse(input)
}

export function ValidateResetPassword(input) {
  return resetPasswordSchema.safeParse(input)
}

export function ValidateUpdateEmail(input) {
  return updateEmailSchema.safeParse(input)
}
