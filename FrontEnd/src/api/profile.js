import API from './config'

export const getProfile = (userId) => API.get(`/user/${userId}/profile`)
export const updateProfile = (data) => API.patch('/user/profile', data)
