import API from './config'

// Admin endpoint to get all users (if needed)
export const getUsers = () => API.get('/admin/users')
