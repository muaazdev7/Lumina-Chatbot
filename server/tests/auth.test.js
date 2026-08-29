import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import User from '../models/User.js'

const valid = { name: 'Test User', email: 'auth@example.com', password: 'secret123' }

describe('auth', () => {
    it('registers a user and returns a token', async () => {
        const res = await request(app).post('/api/user/register').send(valid)
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.token).toBeTruthy()
        expect(res.body.user.credits).toBe(20)
    })

    it('never returns the password hash', async () => {
        const res = await request(app).post('/api/user/register').send(valid)
        expect(JSON.stringify(res.body)).not.toContain('$2b$')
        expect(res.body.user.password).toBeUndefined()
    })

    it('rejects a duplicate email with 409 and does not confirm existence', async () => {
        await request(app).post('/api/user/register').send(valid)
        const res = await request(app).post('/api/user/register').send(valid)
        expect(res.status).toBe(409)
        expect(res.body.message).not.toMatch(/already exists/i)
    })

    it('rejects a password shorter than 8 characters', async () => {
        const res = await request(app).post('/api/user/register').send({ ...valid, password: 'short' })
        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/at least 8/i)
        expect(await User.countDocuments()).toBe(0)
    })

    it('rejects a malformed email', async () => {
        const res = await request(app).post('/api/user/register').send({ ...valid, email: 'notanemail' })
        expect(res.status).toBe(400)
    })

    it('logs in with correct credentials', async () => {
        await request(app).post('/api/user/register').send(valid)
        const res = await request(app).post('/api/user/login').send({ email: valid.email, password: valid.password })
        expect(res.status).toBe(200)
        expect(res.body.token).toBeTruthy()
    })

    it('rejects a wrong password with a generic message', async () => {
        await request(app).post('/api/user/register').send(valid)
        const res = await request(app).post('/api/user/login').send({ email: valid.email, password: 'wrongpassword' })
        expect(res.status).toBe(401)
        expect(res.body.message).toBe('Invalid email or password')
    })

    it('rejects a protected route without a token', async () => {
        const res = await request(app).get('/api/user/data')
        expect(res.status).toBe(401)
    })

    it('rejects a token signed with a different secret', async () => {
        const reg = await request(app).post('/api/user/register').send(valid)
        const { id } = jwt.decode(reg.body.token)
        const forged = jwt.sign({ id }, 'a-completely-different-secret', { expiresIn: '7d' })
        const res = await request(app).get('/api/user/data').set('Authorization', `Bearer ${forged}`)
        expect(res.status).toBe(401)
    })

    it('honours JWT_EXPIRE', async () => {
        const res = await request(app).post('/api/user/register').send(valid)
        const d = jwt.decode(res.body.token)
        expect(Math.round((d.exp - d.iat) / 86400)).toBe(7)
    })
})
