import api from './api'

// POST /api/message/text { chatId, prompt } -> { success, reply, credits }
export const sendTextMessage = async ({ chatId, prompt }) => {
    const { data } = await api.post('/message/text', { chatId, prompt })
    return data
}

// POST /api/message/image { chatId, prompt, isPublished } -> { success, reply, credits }
export const sendImageMessage = async ({ chatId, prompt, isPublished }) => {
    const { data } = await api.post('/message/image', { chatId, prompt, isPublished })
    return data
}
