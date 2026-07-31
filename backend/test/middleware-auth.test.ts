import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import express, { type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import auth from '../middleware/auth.js'
import User from '../API/models/User.js'
import { ACCESS_COOKIE } from '../utils/tokens.js'

const testApp = express()
testApp.use(express.json())
testApp.use(cookieParser())
testApp.get('/protected', auth, (_req: Request, res: Response) => {
  res.json({ ok: true })
})

const JWT_SECRET = 'test-jwt-secret-very-long-for-testing'

async function createTestUser() {
  const user = new User({
    username: 'authtest',
    email: 'authtest@example.com',
    password: 'hashedpassword',
    role: 'user',
    tokenVersion: 0,
  })
  return user.save()
}

function makeAccessToken(
  payload: object,
  secret = JWT_SECRET,
  options: jwt.SignOptions = { expiresIn: '1h' }
): string {
  return jwt.sign({ type: 'access', ...payload }, secret, options)
}

function withCookie(token: string): string {
  return `${ACCESS_COOKIE}=${token}`
}

describe('Middleware auth', () => {
  it('devuelve 401 sin cookie de acceso', async () => {
    const res = await request(testApp).get('/protected')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('devuelve 401 con JWT mal formado', async () => {
    const res = await request(testApp).get('/protected').set('Cookie', withCookie('not-a-valid-jwt'))
    expect(res.status).toBe(401)
  })

  it('devuelve 401 con JWT firmado con secreto incorrecto', async () => {
    const user = await createTestUser()
    const token = makeAccessToken({ userId: user._id, role: 'user', tokenVersion: 0 }, 'wrong-secret')
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(401)
  })

  it('devuelve 401 con JWT expirado', async () => {
    const user = await createTestUser()
    const token = makeAccessToken({ userId: user._id, role: 'user', tokenVersion: 0 }, JWT_SECRET, {
      expiresIn: -1,
    })
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/expirado/i)
  })

  it('devuelve 401 con tokenVersion incorrecto (token revocado)', async () => {
    const user = await createTestUser()
    const token = makeAccessToken({ userId: user._id, role: 'user', tokenVersion: 99 })
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(401)
  })

  it('devuelve 401 si el userId no existe en la base de datos', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const token = makeAccessToken({ userId: fakeId, role: 'user', tokenVersion: 0 })
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(401)
  })

  it('devuelve 401 si la cookie contiene un refresh token en vez de un access token', async () => {
    const user = await createTestUser()
    const token = jwt.sign({ type: 'refresh', userId: user._id, tokenVersion: 0 }, JWT_SECRET, {
      expiresIn: '7d',
    })
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(401)
  })

  it('pasa al siguiente handler con token válido', async () => {
    const user = await createTestUser()
    const token = makeAccessToken({ userId: user._id, role: 'user', tokenVersion: 0 })
    const res = await request(testApp).get('/protected').set('Cookie', withCookie(token))
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
  })
})
