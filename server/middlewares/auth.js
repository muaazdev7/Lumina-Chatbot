import jwt from 'jsonwebtoken';
import User from "../models/User.js";

/**
 * Reads the JWT from the Authorization header (with or without the "Bearer "
 * prefix) and attaches the matching user to req.user.
 */
export const protect = async (req, res, next) => {

    const header = req.headers.authorization || ''
    // Accept both "Bearer <token>" and a bare token.
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim()

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Never load the password hash into memory / responses.
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};
