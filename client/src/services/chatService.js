import api from './api'

// POST /api/chat/create -> { success, message, chat }
export const createChat = async () => {
    const { data } = await api.post('/chat/create')
    return data
}

// GET /api/chat/get -> { success, chats }
export const getChats = async () => {
    const { data } = await api.get('/chat/get')
    return data
}

// POST /api/chat/delete { chatId } -> { success, message }
export const deleteChat = async (chatId) => {
    const { data } = await api.post('/chat/delete', { chatId })
    return data
}
