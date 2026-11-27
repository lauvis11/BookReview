import API from './config'

export const getReadingTracker = () => API.get('/reading/tracker')
export const createReadingLog = (data) => API.post('/reading/logs', data)
