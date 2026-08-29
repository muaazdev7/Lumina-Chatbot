import { z } from 'zod'
import { objectId } from './common.js'

export const deleteChatSchema = z.object({
    chatId: objectId('A valid chatId is required'),
})
