import { BookModel } from '../models/book.js'
import { validateBook, validatePartialBook } from '../schemas/book.js'
import { GoogleBooksService } from '../services/googleBooks.service.js'
import { ValidateBook as ValidateGoogleBook } from '../schemas/books.validator.js'


export class BookController{
    static async getAll(req, res, next){
        try {
            const {genre, editorial, title, author} = req.query;
            const page = req.query.page ?? 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            const book = await BookModel.getAll({genre, editorial, title, author, limit, offset})
            if(!book) return res.status(404).json({message: 'Books Not Found'});
            const bookWhitGenre = book.map(b => ({ ...b, genre: b.genre.split(','), author: b.author ? b.author.split(',') : []}))
            res.status(200).json(bookWhitGenre)
        } catch (e) {
            next(e)
        }
    }

    static async getById(req, res, next){
        try {
            const {id} = req.params
            const book = await BookModel.getById({id})
            if(book === null) return res.status(404).json({message: 'Book Not Found'});
            const bookWhitGenre = { ...book, genre: book.genre.split(','), author: book.author ? book.author.split(',') : [] }
            res.json(bookWhitGenre)
        } catch (e) {
            next(e)
        }
    }

    static async create(req, res, next){
        try {
            const result = validateBook(req.body)
            if(!result.success) return res.status(400).json({message: 'Invalid book data', errors: result.error.errors});
            const newBook = await BookModel.create({input: result.data})
            const newBookWhitGenre = { ...newBook, genre: newBook.genre.split(','), author: newBook.author.split(',') }
            res.status(201).json(newBookWhitGenre)
        } catch (e) {
            next(e)
        }
    }

    static async searchBooks(req, res, next) {
        try {
            const { q } = req.query;
            if (!q || q.trim().length === 0) {
                return res.status(400).json({ message: 'El parámetro de búsqueda "q" es requerido' });
            }
            const results = await GoogleBooksService.searchBooks(q.trim());
            return res.status(200).json(results);
        } catch (e) {
            next(e);
        }
    }

    static async createBook(req, res, next) {
        try {
            const result = ValidateGoogleBook(req.body);
            if (!result.success) {
                return res.status(400).json({ message: 'Invalid book data', errors: result.error.errors });
            }
            
            // Check for existing googleBooksId
            const existingBook = await BookModel.getByGoogleId({ googleId: result.data.googleBooksId });
            if (existingBook) {
                return res.status(409).json({ message: 'Este libro ya está registrado en la plataforma' });
            }

            // Map data to local structure to save it
            // result.data contains { googleBooksId, title, author, genres, publisher, pages, publishedYear, synopsis, coverUrl }
            const mappedInput = {
                title: result.data.title,
                pages: result.data.pages || 1,
                year: result.data.publishedYear || new Date().getFullYear(),
                editorial: result.data.publisher || 'Unknown',
                genre: result.data.genres.length > 0 ? result.data.genres : ['Unknown'],
                img: result.data.coverUrl || '',
                author: [result.data.author || 'Unknown'],
                sinopsis: result.data.synopsis || 'Sin descripción',
                googleBooksId: result.data.googleBooksId
            };

            const newBook = await BookModel.create({ input: mappedInput });
            const newBookWhitGenre = { ...newBook, genre: newBook.genre.split(','), author: newBook.author.split(',') };
            res.status(201).json(newBookWhitGenre);
        } catch (e) {
            next(e);
        }
    }

    static async update(req, res, next){
        try {
            const result = validatePartialBook(req.body)
            const {id} = req.params 
            if(!result.success) return res.status(400).json({message: 'Invalid book data', errors: result.error.errors});
            const updatedBook = await BookModel.update({id, input: result.data})
            if(updatedBook === false) return res.status(404).json({message: 'Book Not Found'});
            const updatedBookWhitGenre = { ...updatedBook, genre: updatedBook.genre.split(','), author: updatedBook.author ? updatedBook.author.split(',') : [] }
            res.json(updatedBookWhitGenre)
        } catch (e) {
            next(e)
        }
    }

    static async delete(req, res, next){
        try {
            const {id} = req.params
            const bookDeleted = await BookModel.delete({id})
            if(bookDeleted === false) return res.status(404).json({message: 'Book Not Found'})
            res.json({message: 'Book deleted successfully'})
        } catch (e) {
            next(e)
        }
    }
}
