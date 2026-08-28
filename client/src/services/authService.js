import api from './api'

// POST /api/user/register -> { success, token, user }
export const registerUser = async ({ name, email, password }) => {
    const { data } = await api.post('/user/register', { name, email, password })
    return data
}

// POST /api/user/login -> { success, token, user }
export const loginUser = async ({ email, password }) => {
    const { data } = await api.post('/user/login', { email, password })
    return data
}

// GET /api/user/data -> { success, user }  (protected)
export const getCurrentUser = async () => {
    const { data } = await api.get('/user/data')
    return data
}

// GET /api/user/published-images -> { success, images } (public)
export const getPublishedImages = async () => {
    const { data } = await api.get('/user/published-images')
    return data
}
