import API from './config'

// Public endpoints
export const getBooks = (params = {}) => API.get('/books', { params })
export const getBookById = (id) => API.get(`/books/${id}`)

// Admin endpoints (require verifyToken + verifyAdmin)
export const createBook = (data) => API.post('/books', data)
export const updateBook = (id, data) => API.patch(`/books/${id}`, data)
export const deleteBook = (id) => API.delete(`/books/${id}`)
export const searchGoogleBooks = (q) => API.get('/books/search', { params: { q } })
