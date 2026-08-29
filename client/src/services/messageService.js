import api from './api'

/**
 * `signal` lets the Stop button abort a request. The server refunds the
 * credits when the client disconnects, so cancelling really costs nothing.
 */

// POST /api/message/text { chatId, prompt } -> { success, reply, credits }
export const sendTextMessage = async ({ chatId, prompt }, { signal } = {}) => {
    const { data } = await api.post('/message/text', { chatId, prompt }, { signal })
    return data
}

// POST /api/message/image { chatId, prompt, isPublished } -> { success, reply, credits }
export const sendImageMessage = async ({ chatId, prompt, isPublished }, { signal } = {}) => {
    const { data } = await api.post('/message/image', { chatId, prompt, isPublished }, { signal })
    return data
}
