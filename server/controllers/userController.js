import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import bcrypt from 'bcrypt';

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
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" })
        }

        const userExists = await User.findOne({ email })

        if (userExists) {
            return res.status(409).json({ success: false, message: "User already exists" })
        }

        const user = await User.create({ name, email, password })
        const token = generateToken(user._id)
        res.status(201).json({ success: true, token, user: toPublicUser(user) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// API to login user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" })
        }

        const user = await User.findOne({ email })
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)

            if (isMatch) {
                const token = generateToken(user._id);
                return res.json({ success: true, token, user: toPublicUser(user) })
            }
        }
        return res.status(401).json({ success: false, message: "Invalid email or password" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// API to get user data
export const getUser = async (req, res) => {
    try {
        // req.user is already loaded without the password by `protect`.
        return res.json({ success: true, user: toPublicUser(req.user) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

// API to get published images
export const getPublishedImages = async (req, res) => {
    try {
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
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
