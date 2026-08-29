import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import Stripe from 'stripe'
import app from '../app.js'
import User from '../models/User.js'
import Transaction, { TRANSACTION_STATUS } from '../models/Transaction.js'

// Only used to SIGN payloads locally - never calls the Stripe API.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' })
const SECRET = process.env.STRIPE_WEBHOOK_SECRET

let userId
let transactionId

const event = (type, { transactionId: tid, appId = 'Lumina', payment_status = 'paid' }) =>
    JSON.stringify({
        id: 'evt_' + Math.random().toString(36).slice(2),
        object: 'event',
        type,
        data: { object: { id: 'cs_test_x', object: 'checkout.session', payment_status, metadata: { transactionId: tid, appId } } },
    })

// Send the raw string: supertest re-encodes a Buffer, which changes the bytes
// express.raw() receives and breaks signature verification.
const deliver = (payload, { secret = SECRET, body } = {}) =>
    request(app).post('/api/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', stripe.webhooks.generateTestHeaderString({ payload, secret }))
        .send(body ?? payload)

beforeEach(async () => {
    const reg = await request(app).post('/api/user/register')
        .send({ name: 'Hook User', email: 'hook@example.com', password: 'secret123' })
    userId = reg.body.user._id
    const tx = await Transaction.create({
        userId, planId: 'pro', amount: 20, credits: 500,
        isPaid: false, status: TRANSACTION_STATUS.PENDING,
    })
    transactionId = tx._id.toString()
})

const creditsNow = async () => (await User.findById(userId)).credits

describe('stripe webhook', () => {
    it('rejects a request with no signature', async () => {
        const res = await request(app).post('/api/stripe')
            .set('Content-Type', 'application/json')
            .send(event('checkout.session.completed', { transactionId }))
        expect(res.status).toBe(400)
    })

    it('rejects a signature made with the wrong secret', async () => {
        const payload = event('checkout.session.completed', { transactionId })
        const res = await deliver(payload, { secret: 'whsec_wrong_secret_value_here' })
        expect(res.status).toBe(400)
    })

    it('rejects a tampered payload', async () => {
        const payload = event('checkout.session.completed', { transactionId })
        const res = await deliver(payload, { body: payload.replace('"paid"', '"zzzz"') })
        expect(res.status).toBe(400)
    })

    it('grants credits for a valid completed session', async () => {
        const res = await deliver(event('checkout.session.completed', { transactionId }))
        expect(res.status).toBe(200)
        expect(await creditsNow()).toBe(520)

        const tx = await Transaction.findById(transactionId)
        expect(tx.isPaid).toBe(true)
        expect(tx.status).toBe(TRANSACTION_STATUS.PAID)
        expect(tx.paidAt).toBeTruthy()
    })

    // THE INVARIANT: one payment grants credits exactly once.
    it('does not grant credits twice for a duplicate delivery', async () => {
        const payload = event('checkout.session.completed', { transactionId })
        await deliver(payload)
        const after = await creditsNow()

        const second = await deliver(payload)
        expect(second.status).toBe(200)
        expect(second.body.message).toMatch(/already processed/i)
        expect(await creditsNow()).toBe(after)
    })

    it('grants credits exactly once under concurrent deliveries', async () => {
        const payload = event('checkout.session.completed', { transactionId })
        const results = await Promise.all(Array.from({ length: 5 }, () => deliver(payload)))
        expect(results.every(r => r.status === 200)).toBe(true)
        expect(results.filter(r => /Credits granted/i.test(r.body.message || ''))).toHaveLength(1)
        expect(await creditsNow()).toBe(520)
    })

    it('returns 5xx for an unknown transaction so Stripe retries', async () => {
        const res = await deliver(event('checkout.session.completed', { transactionId: '000000000000000000000000' }))
        expect(res.status).toBeGreaterThanOrEqual(500)
    })

    it('does not grant credits when payment_status is not paid', async () => {
        const res = await deliver(event('checkout.session.completed', { transactionId, payment_status: 'unpaid' }))
        expect(res.status).toBe(200)
        expect(await creditsNow()).toBe(20)
        expect((await Transaction.findById(transactionId)).isPaid).toBe(false)
    })

    it('ignores events from another app', async () => {
        const res = await deliver(event('checkout.session.completed', { transactionId, appId: 'OtherApp' }))
        expect(res.status).toBe(200)
        expect(await creditsNow()).toBe(20)
    })

    it('marks an expired checkout without granting credits', async () => {
        const res = await deliver(event('checkout.session.expired', { transactionId }))
        expect(res.status).toBe(200)
        const tx = await Transaction.findById(transactionId)
        expect(tx.status).toBe(TRANSACTION_STATUS.EXPIRED)
        expect(tx.isPaid).toBe(false)
        expect(await creditsNow()).toBe(20)
    })
})
