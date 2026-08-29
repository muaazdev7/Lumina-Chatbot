import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import bcrypt from 'bcrypt';
import { asyncHandler } from '../middlewares/asyncHandler.js'

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    })
}

// Strip the password hash before sending a user back to the client.
const toPublicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    credits: user.credits,
})

// API to register user
export const registerUser = asyncHandler(async (req, res) => {
    // Presence, email format and password length are enforced by
    // validate(registerSchema) on the route (2.1 / 1.2).
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email })

    // 1.7 - do not confirm which emails are registered.
    if (userExists) {
        return res.status(409).json({ success: false, message: "Unable to register with these details" })
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)
    res.status(201).json({ success: true, token, user: toPublicUser(user) })
})

// API to login user
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
    if (user) {
        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = generateToken(user._id);
            return res.json({ success: true, token, user: toPublicUser(user) })
        }
    }
    return res.status(401).json({ success: false, message: "Invalid email or password" })
})

// API to get user data
export const getUser = asyncHandler(async (req, res) => {
    // req.user is already loaded without the password by `protect`.
    return res.json({ success: true, user: toPublicUser(req.user) })
})

// API to get published images
export const getPublishedImages = asyncHandler(async (req, res) => {
    const publishedImageMessages = await Chat.aggregate([
        { $unwind: "$messages" },
        {
            $match: {
                "messages.isImage": true,
                "messages.isPublished": true
            }
        },
        { $sort: { "messages.timestamp": -1 } },
        {
            $project: {
                _id: 0,
                imageUrl: "$messages.content",
                userName: "$userName"
            }
        }
    ])

    res.json({ success: true, images: publishedImageMessages })
})
