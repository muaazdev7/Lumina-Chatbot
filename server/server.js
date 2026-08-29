import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'
import { allowedOrigins } from './configs/allowedOrigins.js'

const app = express()

try {
    await connectDB()
} catch (error) {
    console.error('Database connection failed:', error.message)
    process.exit(1)
}

// Stripe Webhooks - must be registered before express.json() so the raw
// body stays intact for signature verification.
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)

// 1.3 - security headers. Mounted after the Stripe raw-body route above so
// that route is untouched. This does NOT replace CORS.
app.use(helmet())

// CORS - allowed origins come from CLIENT_URL (comma separated),
// shared with the Stripe redirect URLs via configs/allowedOrigins.js
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (curl, Postman, server-to-server) which send no Origin.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Middleware
// 1.4 - explicit body limit. The largest legitimate body is a text prompt.
// The Stripe route above uses express.raw and is unaffected.
app.use(express.json({ limit: '100kb' }))

// Routes
app.get('/', (req, res) => res.send('Server is live'))
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
})

// Central error handler (also converts CORS rejections into a JSON response)
app.use((err, req, res, next) => {
    console.error(err.message)
    const status = err.message?.startsWith('Not allowed by CORS') ? 403 : (err.status || 500)
    res.status(status).json({ success: false, message: err.message || 'Internal Server Error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})
