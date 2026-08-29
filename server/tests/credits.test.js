import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import User from '../models/User.js'

const account = { name: 'Credit User', email: 'credits@example.com', password: 'secret123' }

let token
let chatId
let userId

const setCredits = (n) => User.updateOne({ _id: userId }, { $set: { credits: n } })
const creditsNow = async () => (await User.findById(userId)).credits

beforeEach(async () => {
    const reg = await request(app).post('/api/user/register').send(account)
    token = reg.body.token
    userId = reg.body.user._id
    const chat = await request(app).post('/api/chat/create').set('Authorization', `Bearer ${token}`)
    chatId = chat.body.chat._id
})

const sendText = (prompt = 'hello') =>
    request(app).post('/api/message/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ chatId, prompt })

describe('credits', () => {
    it('deducts exactly 1 credit for a text message', async () => {
        const res = await sendText()
        expect(res.status).toBe(200)
        expect(await creditsNow()).toBe(19)
        expect(res.body.credits).toBe(19)      // authoritative balance, not a stale read
    })

    it('deducts exactly 2 credits for an image message', async () => {
        const res = await request(app).post('/api/message/image')
            .set('Authorization', `Bearer ${token}`)
            .send({ chatId, prompt: 'a red apple' })
        expect(res.status).toBe(200)
        expect(await creditsNow()).toBe(18)
        expect(res.body.credits).toBe(18)
    })

    it('returns 402 when the balance is zero and deducts nothing', async () => {
        await setCredits(0)
        const res = await sendText()
        expect(res.status).toBe(402)
        expect(await creditsNow()).toBe(0)
    })

    it('does not charge for an oversized prompt', async () => {
        const before = await creditsNow()
        const res = await sendText('x'.repeat(4001))
        expect(res.status).toBe(400)
        expect(await creditsNow()).toBe(before)
    })

    // THE INVARIANT: a successful request can never overspend the balance.
    it('cannot be overspent by concurrent requests', async () => {
        await setCredits(1)

        const results = await Promise.all([sendText(), sendText(), sendText(), sendText(), sendText()])
        const codes = results.map(r => r.status)

        expect(codes.filter(c => c === 200)).toHaveLength(1)
        expect(codes.filter(c => c === 402)).toHaveLength(4)

        const final = await creditsNow()
        expect(final).toBe(0)
        expect(final).toBeGreaterThanOrEqual(0)   // never negative
    })

    it('cannot be overspent by concurrent image requests either', async () => {
        await setCredits(3)   // enough for exactly one image (cost 2)
        const image = () => request(app).post('/api/message/image')
            .set('Authorization', `Bearer ${token}`)
            .send({ chatId, prompt: 'apple' })

        const results = await Promise.all([image(), image(), image()])
        const ok = results.filter(r => r.status === 200)
        expect(ok).toHaveLength(1)
        expect(await creditsNow()).toBe(1)
    })
})
