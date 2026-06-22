import { z } from "zod";

const chatSchema = z.object({
  message: z
    .string({ required_error: "El mensaje es requerido" })
    .min(1, { message: "El mensaje no puede estar vacío" })
    .max(500, { message: "El mensaje no puede superar los 500 caracteres" })
    .trim(),

  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"], {
          message: "El rol debe ser 'user' o 'model'",
        }),
        parts: z.array(
          z.object({
            text: z
              .string()
              .min(1, { message: "El texto de cada parte no puede estar vacío" }),
          })
        ),
      })
    )
    .max(50, { message: "El historial no puede superar los 50 mensajes" })
    .default([]),
});

export function ValidateChat(input){
    return chatSchema.safeParse(input)
}