import mongoose from 'mongoose'

const connectDB = async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    const dbName = process.env.MONGO_DB_NAME || 'lumina'

    if (!uri) {
        throw new Error('MONGO_URI is not defined in the environment')
    }

    mongoose.connection.on('connected', () => {
        console.log('Database Connected')
    })

    mongoose.connection.on('error', (err) => {
        console.error('Database error:', err.message)
    })

    // Let the caller decide what to do on failure instead of swallowing it,
    // so the server never starts up without a database.
    await mongoose.connect(uri, { dbName })
}

export default connectDB;
