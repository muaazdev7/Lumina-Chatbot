import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

/**
 * Rate limiters applied per route, not globally - a global limiter would
 * throttle chat listing and the public gallery, which is not the intent.
 *
 * The default 429 body is plain text, so both limiters use `handler` to
 * return the { success, message } shape the client's getErrorMessage expects.
 */

const tooMany = (message) => (req, res) => {
    res.status(429).json({ success: false, message })
}

// Limits are per-process and in-memory, so an automated suite would exhaust
// them across unrelated tests. Rate limiting is verified separately.
const skipInTests = () => process.env.NODE_ENV === 'test'

// Auth endpoints: keyed by IP, since there is no user yet.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTests,
    handler: tooMany('Too many attempts, please try again in 15 minutes.'),
})

// Message endpoints: keyed by user id, so one user cannot exhaust another's
// allowance from the same network. Must be mounted AFTER `protect` so
// req.user exists.
export const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    // ipKeyGenerator normalises IPv6 addresses so they cannot bypass the limit
    // by varying the host portion of the address.
    keyGenerator: (req) => (req.user?._id ? String(req.user._id) : ipKeyGenerator(req.ip)),
    skip: skipInTests,
    handler: tooMany('Too many requests, please slow down and try again later.'),
})
