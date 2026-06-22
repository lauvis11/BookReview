export const googleBooksConfig = {
    baseURL: 'https://www.googleapis.com/books/v1',
    apiKey: process.env.GOOGLE_BOOKS_API_KEY
};

export const checkGoogleBooksConfig = () => {
    if (!googleBooksConfig.apiKey) {
        throw new Error("GOOGLE_BOOKS_API_KEY no está definida en las variables de entorno");
    }
};
