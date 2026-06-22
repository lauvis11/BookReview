import API from './config'

export const getByStatus = (status) => API.get('/status', { params: { status } })
export const saveStatus = (data) => API.post('/status', data)
export const deleteStatus = (bookId) => API.delete(`/status/${bookId}`)
