import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

// Deterministic test config. Set BEFORE any app module is imported, because
// configs/env.js validates at import time and the SDK configs read these.
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-not-a-real-key'
process.env.JWT_EXPIRE = '7d'
process.env.CLIENT_URL = 'http://localhost:5173'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.IMAGEKIT_PUBLIC_KEY = 'public_test'
process.env.IMAGEKIT_PRIVATE_KEY = 'private_test'
process.env.IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/test'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_tests_0000000000'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_tests_000000'

// External services are never called for real: they cost money and are
// non-deterministic. Mocked at the module boundary.
vi.mock('../configs/openAi.js', () => ({
    default: {
        chat: {
            completions: {
                create: vi.fn(async () => ({
                    choices: [{ message: { role: 'assistant', content: 'mocked reply' } }],
                })),
            },
        },
    },
}))

// messageController fetches the generated image with axios and validates its
// magic bytes, so the mock must return a real PNG signature.
vi.mock('axios', () => {
    const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const fakePng = Buffer.concat([PNG_HEADER, Buffer.alloc(256, 1)])
    return {
        default: { get: vi.fn(async () => ({ data: fakePng })) },
        get: vi.fn(async () => ({ data: fakePng })),
    }
})

vi.mock('../configs/imageKit.js', () => ({
    default: {
        upload: vi.fn(async () => ({ url: 'https://ik.imagekit.io/test/mock.png' })),
    },
}))

let replset

beforeAll(async () => {
    // IMPORTANT: replica set, not a standalone. webhooks.js uses a MongoDB
    // transaction; on a standalone it would silently fall back to the
    // non-transactional path and the tests would exercise the wrong code.
    replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
    process.env.MONGO_URI = replset.getUri()
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'lumina_test' })
})

afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({})
    }
})

afterAll(async () => {
    await mongoose.disconnect()
    if (replset) await replset.stop()
})
