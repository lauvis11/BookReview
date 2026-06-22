import API from './config'

export const login = (credentials) => API.post('/auth/login', credentials)
export const register = (credentials) => API.post('/auth/register', credentials)
export const logout = () => API.post('/auth/logout')
export const updatePassword = (data) => API.patch('/auth/password', data)
