import API from './config'

export const login = (credentials) => API.post('/auth/login', credentials)
export const register = (credentials) => API.post('/auth/register', credentials)
export const logout = () => API.post('/auth/logout')
export const updatePassword = (data) => API.patch('/auth/password', data)
export const updateEmail = (data) => API.patch('/auth/email', data)
export const forgotPassword = (data) => API.post('/auth/forgot-password', data)
export const verifyResetCode = (data) => API.post('/auth/verify-reset-code', data)
export const resetPassword = (data) => API.post('/auth/reset-password', data)
