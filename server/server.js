import 'dotenv/config'
import app from './app.js'
import connectDB from './configs/db.js'
import { allowedOrigins } from './configs/allowedOrigins.js'

/**
 * Entry point: connect the database, then listen.
 * The app itself is built in app.js so tests can import it without a port.
 */
try {
    await connectDB()
} catch (error) {
    console.error('Database connection failed:', error.message)
    process.exit(1)
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})
