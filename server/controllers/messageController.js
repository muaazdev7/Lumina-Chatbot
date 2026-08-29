import axios from 'axios'
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import openai from '../configs/openAi.js'
import imagekit from '../configs/imageKit.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'

const TEXT_MESSAGE_COST = 1
const IMAGE_MESSAGE_COST = 2

// 3.5 - how many prior messages to send as context. Every request resends the
// history, so cost per message grows with conversation length until this cap.
const MAX_HISTORY_MESSAGES = 16

// ImageKit generates images asynchronously. While it works, the URL still
// answers 200 with Content-Type image/png but the body is the plain text
// "The asset is currently being prepared". Uploading that produces a
// permanently broken image, so the bytes must be validated before use.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff])

const isRenderedImage = (buffer) => (
    buffer.length > PNG_SIGNATURE.length &&
    (buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.subarray(0, 3).equals(JPEG_SIGNATURE))
)

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetches a generated image, waiting for ImageKit to finish preparing it.
 * Throws if it is still not ready once the attempts run out.
 */
const fetchGeneratedImage = async (url, {
    attempts = Number(process.env.IMAGE_GEN_MAX_ATTEMPTS) || 60,
    intervalMs = Number(process.env.IMAGE_GEN_POLL_MS) || 3000,
} = {}) => {
    let lastBody = ''

    for (let attempt = 1; attempt <= attempts; attempt++) {
        const response = await axios.get(url, { responseType: "arraybuffer" })
        const buffer = Buffer.from(response.data)

        if (isRenderedImage(buffer)) {
            return buffer
        }

        lastBody = buffer.toString('utf8').slice(0, 200)

        if (attempt < attempts) {
            await delay(intervalMs)
        }
    }

    throw new Error(`Image generation timed out. ImageKit said: "${lastBody}"`)
}

/**
 * 3.1 - atomically checks the balance and deducts in ONE operation.
 * The `credits: { $gte: cost }` condition lives inside the filter, so MongoDB
 * evaluates and applies it together; there is no separate read to race
 * against. Returns null when the balance is too low.
 *
 * Mirrors the atomic claim already used in webhooks.js.
 */
const chargeCredits = (userId, cost) =>
    User.findOneAndUpdate(
        { _id: userId, credits: { $gte: cost } },
        { $inc: { credits: -cost } },
        { new: true }
    )

/** Returns credits after a failure between charging and responding. */
const refundCredits = (userId, cost) =>
    User.updateOne({ _id: userId }, { $inc: { credits: cost } })
        .catch(error => console.error('[message] refund failed for', String(userId), '-', error.message))

// Shared validation: resolves the chat owned by this user, or sends an error.
// The credit check is NOT here - it must happen atomically at charge time.
const resolveChat = async (req, res) => {
    // prompt presence/length and chatId format are validated on the route by
    // validate(textMessageSchema | imageMessageSchema). What remains here is
    // AUTHORIZATION: does this chat belong to this user.
    const { chatId } = req.body

    const chat = await Chat.findOne({ userId: req.user._id, _id: chatId })

    if (!chat) {
        res.status(404).json({ success: false, message: "Chat not found" })
        return null
    }

    return chat
}

// Text-based AI Chat Message Controller
export const textMessageController = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const chat = await resolveChat(req, res)
    if (!chat) return

    const { prompt } = req.body

    // 3.5 - build the context BEFORE pushing the new prompt, so it is not
    // included twice. Image messages are excluded: their content is a URL.
    const history = chat.messages
        .filter(m => !m.isImage)
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content }))

    // 3.1 - charge first. A crash after this leaves the user charged rather
    // than overspent, and the refund below covers the common failure.
    const charged = await chargeCredits(userId, TEXT_MESSAGE_COST)
    if (!charged) {
        return res.status(402).json({ success: false, message: "You don't have enough credits to use this feature" })
    }

    try {
        chat.messages.push({ role: "user", content: prompt, timestamp: Date.now(), isImage: false })

        const { choices } = await openai.chat.completions.create({
            model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
            messages: [...history, { role: "user", content: prompt }],
        });

        const reply = {
            role: choices[0].message.role,
            content: choices[0].message.content,
            timestamp: Date.now(),
            isImage: false
        }

        chat.messages.push(reply)
        await chat.save()

        // Report the authoritative balance, not one computed from a stale read.
        res.json({ success: true, reply, credits: charged.credits })
    } catch (error) {
        await refundCredits(userId, TEXT_MESSAGE_COST)
        throw error
    }
})

// Image generation Message Controller
export const imageMessageController = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const chat = await resolveChat(req, res)
    if (!chat) return

    const { prompt, isPublished } = req.body

    // 3.1 - charge atomically before any billable work starts.
    const charged = await chargeCredits(userId, IMAGE_MESSAGE_COST)
    if (!charged) {
        return res.status(402).json({ success: false, message: "You don't have enough credits to use this feature" })
    }

    try {
    // Push user message
    chat.messages.push({
        role: "user",
        content: prompt,
        timestamp: Date.now(),
        isImage: false
    });

    // Encode the prompt
    const encodedPrompt = encodeURIComponent(prompt)

    // Construct the ImageKit AI generation URL (must be a single line -
    // any whitespace ends up inside the URL).
    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/Lumina/${Date.now()}.png?tr=w-800,h-800`;

    // Trigger generation and wait until ImageKit has actually rendered it
    const imageBuffer = await fetchGeneratedImage(generatedImageUrl)

    // Convert to Base64
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Upload to ImageKit Media Library
    const uploadResponse = await imagekit.upload({
        file: base64Image,
        fileName: `${Date.now()}.png`,
        folder: "Lumina"
    })

    const reply = {
        role: 'assistant',
        content: uploadResponse.url,
        timestamp: Date.now(),
        isImage: true,
        isPublished: Boolean(isPublished)
    }

    chat.messages.push(reply)
    await chat.save()

    // Authoritative balance from the atomic charge.
    res.json({ success: true, reply, credits: charged.credits })
    } catch (error) {
        await refundCredits(userId, IMAGE_MESSAGE_COST)
        throw error
    }
})
