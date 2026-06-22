import API from './config'

export const getComments = (bookId) => API.get(`/book/${bookId}/comments`)
export const getReplies = (commentId) => API.get(`/book/comments/${commentId}/replies`)
export const createComment = (bookId, data) => API.post(`/book/${bookId}/comments`, data)
export const deleteComment = (commentId) => API.delete(`/book/comments/${commentId}`)
export const likeComment = (commentId) => API.post(`/book/comments/${commentId}/likes`)
export const deleteLike = (commentId) => API.delete(`/book/comments/${commentId}/likes`)
