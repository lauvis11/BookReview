import API from './config'

export const getFavorites = () => API.get('/users/favorites')
export const saveFavorite = (bookId) => API.post('/users/favorites', { book_id: bookId })
export const deleteFavorite = (bookId) => API.delete(`/users/favorites/${bookId}`)
