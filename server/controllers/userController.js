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

// 3.3 - pagination bounds for the public gallery.
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

// API to get published images
export const getPublishedImages = asyncHandler(async (req, res) => {
    // Query params are strings and come from an unauthenticated endpoint,
    // so clamp them rather than trusting them.
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    const requested = Number.parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE
    const limit = Math.min(Math.max(1, requested), MAX_PAGE_SIZE)
    const skip = (page - 1) * limit

    // $facet runs the page and the count over one pass of the matched set,
    // so the gallery can show "Showing N of TOTAL" without a second query.
    const [result] = await Chat.aggregate([
        { $unwind: "$messages" },
        {
            $match: {
                "messages.isImage": true,
                "messages.isPublished": true
            }
        },
        {
            $facet: {
                page: [
                    // $sort MUST stay before $skip/$limit, or pages contain arbitrary rows.
                    { $sort: { "messages.timestamp": -1 } },
                    { $skip: skip },
                    { $limit: limit + 1 },   // one extra to detect a further page
                    {
                        $project: {
                            _id: 0,
                            imageUrl: "$messages.content",
                            userName: "$userName"
                        }
                    }
                ],
                total: [{ $count: "count" }]
            }
        }
    ])

    const rows = result?.page ?? []
    const total = result?.total?.[0]?.count ?? 0
    const hasMore = rows.length > limit
    const images = hasMore ? rows.slice(0, limit) : rows

    res.json({ success: true, images, page, limit, total, hasMore })
})
