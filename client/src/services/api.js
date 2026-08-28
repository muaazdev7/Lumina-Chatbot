import axios from 'axios'

// Base URL comes from the environment, never hardcoded.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const TOKEN_KEY = 'lumina_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({
    baseURL: `${API_URL}/api`,
    // The API authenticates with a Bearer token, but this keeps cookie based
    // auth working too if it is ever added (the server sends
    // Access-Control-Allow-Credentials: true).
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every outgoing request.
api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Callback invoked when the server reports the session is no longer valid.
let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearToken()
            if (onUnauthorized) onUnauthorized()
        }
        return Promise.reject(error)
    }
)

/**
 * Normalises any axios/API failure into a readable message.
 * The API returns { success:false, message } on errors.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong') => {
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is it running?'
    return error?.message || fallback
}

export default api
