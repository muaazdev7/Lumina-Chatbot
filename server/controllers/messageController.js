import axios from 'axios'
import mongoose from 'mongoose'
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import openai from '../configs/openAi.js'
import imagekit from '../configs/imageKit.js'

const TEXT_MESSAGE_COST = 1
const IMAGE_MESSAGE_COST = 2

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

// Shared validation: resolves the chat owned by this user, or sends an error.
const resolveChat = async (req, res, cost) => {
    if (req.user.credits < cost) {
        res.status(402).json({ success: false, message: "You don't have enough credits to use this feature" })
        return null
    }

    const { chatId, prompt } = req.body

    if (!prompt || !prompt.trim()) {
        res.status(400).json({ success: false, message: "A prompt is required" })
        return null
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
        res.status(400).json({ success: false, message: "A valid chatId is required" })
        return null
    }

    const chat = await Chat.findOne({ userId: req.user._id, _id: chatId })

    if (!chat) {
        res.status(404).json({ success: false, message: "Chat not found" })
        return null
    }

    return chat
}

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        const chat = await resolveChat(req, res, TEXT_MESSAGE_COST)
        if (!chat) return

        const { prompt } = req.body

        chat.messages.push({ role: "user", content: prompt, timestamp: Date.now(), isImage: false })

        const { choices } = await openai.chat.completions.create({
            model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = {
            role: choices[0].message.role,
            content: choices[0].message.content,
            timestamp: Date.now(),
            isImage: false
        }

        // Persist and charge BEFORE responding, so a failure here is reported
        // to the client instead of silently losing the message.
        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({ _id: userId }, { $inc: { credits: -TEXT_MESSAGE_COST } })

        res.json({ success: true, reply, credits: req.user.credits - TEXT_MESSAGE_COST })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Image generation Message Controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        const chat = await resolveChat(req, res, IMAGE_MESSAGE_COST)
        if (!chat) return

        const { prompt, isPublished } = req.body

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
        await User.updateOne({ _id: userId }, { $inc: { credits: -IMAGE_MESSAGE_COST } })

        res.json({ success: true, reply, credits: req.user.credits - IMAGE_MESSAGE_COST })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
