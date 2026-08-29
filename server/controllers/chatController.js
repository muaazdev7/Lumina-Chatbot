import Chat from '../models/Chat.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'

// API Controller for creating a new chat
export const createChat = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const chatData = {
        userId,
        messages: [],
        name: "New Chat",
        userName: req.user.name
    }

    // Return the created chat so the client can select it immediately.
    const chat = await Chat.create(chatData)
    res.status(201).json({ success: true, message: "Chat created", chat })
})

// API Controller for getting all chats
export const getChats = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 })

    res.json({ success: true, chats })
})

// API Controller for deleting a chat
export const deleteChat = asyncHandler(async (req, res) => {
    const userId = req.user._id
    // chatId format is validated by validate(deleteChatSchema) on the route.
    const { chatId } = req.body

    const result = await Chat.deleteOne({ _id: chatId, userId })

    if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: "Chat not found" })
    }

    res.json({ success: true, message: "Chat Deleted" })
})
