import mongoose from 'mongoose'
import Chat from '../models/Chat.js'

// API Controller for creating a new chat
export const createChat = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API Controller for getting all chats
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id
        const chats = await Chat.find({ userId }).sort({ updatedAt: -1 })

        res.json({ success: true, chats })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// API Controller for deleting a chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id
        const { chatId } = req.body

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: "A valid chatId is required" })
        }

        const result = await Chat.deleteOne({ _id: chatId, userId })

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Chat not found" })
        }

        res.json({ success: true, message: "Chat Deleted" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
