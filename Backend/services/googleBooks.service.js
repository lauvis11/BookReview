import { googleBooksConfig } from '../config/googleBooks.config.js';

const normalizeBook = (item) => {
    const { id, volumeInfo } = item;
    
    // Process authors
    let author = null;
    if (volumeInfo?.authors && Array.isArray(volumeInfo.authors)) {
        author = volumeInfo.authors.join(", ");
    }

    // Process categories/genres
    let genres = [];
    if (volumeInfo?.categories && Array.isArray(volumeInfo.categories)) {
        genres = volumeInfo.categories;
    }

    // Process publishedYear
    let publishedYear = null;
    if (volumeInfo?.publishedDate) {
        // Can be 'YYYY', 'YYYY-MM', or 'YYYY-MM-DD'
        const yearString = volumeInfo.publishedDate.slice(0, 4);
        const parsedYear = parseInt(yearString, 10);
        if (!isNaN(parsedYear)) {
            publishedYear = parsedYear;
        }
    }

    // Process coverUrl (force https)
    let coverUrl = null;
    if (volumeInfo?.imageLinks?.thumbnail) {
        coverUrl = volumeInfo.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://');
    }

    return {
        googleBooksId: id,
        title: volumeInfo?.title || "Título Desconocido",
        author: author,
        genres: genres,
        publisher: volumeInfo?.publisher || null,
        pages: volumeInfo?.pageCount || null,
        publishedYear: publishedYear,
        synopsis: volumeInfo?.description || null,
        coverUrl: coverUrl
    };
};

export class GoogleBooksService {
    static async searchBooks(query) {
        if (!query) return [];

        const { baseURL, apiKey } = googleBooksConfig;
        
        // fields parameter to optimize response size
        const fields = 'items(id,volumeInfo/title,volumeInfo/authors,volumeInfo/categories,volumeInfo/publisher,volumeInfo/pageCount,volumeInfo/publishedDate,volumeInfo/description,volumeInfo/imageLinks)';
        const maxResults = 10;

        const url = new URL(`${baseURL}/volumes`);
        url.searchParams.append('q', query);
        url.searchParams.append('maxResults', maxResults.toString());
        url.searchParams.append('fields', fields);
        url.searchParams.append('key', apiKey);

        try {
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error fetching from Google Books API:", errorData);
                throw new Error("Error en la respuesta de Google Books API");
            }

            const data = await response.json();

            if (!data.items || !Array.isArray(data.items)) {
                return [];
            }

            const normalizedBooks = data.items.map(item => normalizeBook(item));
            return normalizedBooks;
        } catch (error) {
            console.error("Google Books Search Error:", error);
            throw new Error("No se pudo conectar con la API de Google Books");
        }
    }
}
