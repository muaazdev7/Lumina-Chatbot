import { z } from 'zod'
import { objectId } from './common.js'

// 2.2 - cap the prompt so an oversized request cannot drive Gemini cost or
// latency. The image cap is lower because the prompt is URL-encoded into an
// ImageKit path, where encoding can multiply the length considerably.
export const MAX_TEXT_PROMPT = 4000
export const MAX_IMAGE_PROMPT = 1000

const basePrompt = (max) => z.string()
    .trim()
    .min(1, 'A prompt is required')
    .max(max, `Prompt must be ${max} characters or fewer`)

export const textMessageSchema = z.object({
    chatId: objectId('A valid chatId is required'),
    prompt: basePrompt(MAX_TEXT_PROMPT),
})

export const imageMessageSchema = z.object({
    chatId: objectId('A valid chatId is required'),
    prompt: basePrompt(MAX_IMAGE_PROMPT),
    isPublished: z.coerce.boolean().optional().default(false),
})
