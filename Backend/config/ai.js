import { GoogleGenerativeAI } from "@google/generative-ai";
process.loadEnvFile()

const api_key = process.env.GEMINI_API_KEY

if (!api_key) {
  throw new Error("GEMINI_API_KEY no está definida en las variables de entorno");
}

const genAi = new GoogleGenerativeAI(api_key)

export const getGeminiModel = () => {
  return genAi.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
  })
}