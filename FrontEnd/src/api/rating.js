import API from './config'

export const getUserRating = (bookId) => API.get(`/books/${bookId}/rating`)
export const saveRating = (bookId, rate) => API.put(`/books/${bookId}/rating`, { rate })
