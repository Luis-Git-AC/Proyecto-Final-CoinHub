import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import User from '../API/models/User.js'
import app from './testApp.js'
import { ACCESS_COOKIE } from '../utils/tokens.js'

const JWT_SECRET = 'test-jwt-secret-very-long-for-testing'

async function createAuthenticatedUser(suffix = '') {
  const user = new User({
    username: `portfoliouser${suffix}`,
    email: `portfoliouser${suffix}@example.com`,
    password: 'hashedpassword',
    role: 'user',
    tokenVersion: 0,
  })
  await user.save()

  const token = jwt.sign(
    { type: 'access', userId: user._id, role: 'user', tokenVersion: 0 },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
  return { user, token }
}

function authCookie(token: string): string {
  return `${ACCESS_COOKIE}=${token}`
}

describe('GET /api/portfolio', () => {
  it('devuelve items vacíos si el usuario no tiene portfolio (200)', async () => {
    const { token } = await createAuthenticatedUser('1')

    const res = await request(app).get('/api/portfolio').set('Cookie', authCookie(token))

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body.items).toEqual([])
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/portfolio')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/portfolio', () => {
  it('guarda y devuelve los items del portfolio (200)', async () => {
    const { token } = await createAuthenticatedUser('2')

    const items = [
      { symbol: 'BTC', amount: 0.5, avgPrice: 30000 },
      { symbol: 'ETH', amount: 2, avgPrice: 2000 },
    ]

    const res = await request(app).put('/api/portfolio').set('Cookie', authCookie(token)).send({ items })

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.items[0]).toMatchObject({ symbol: 'BTC', amount: 0.5 })
  })

  it('normaliza los símbolos a mayúsculas', async () => {
    const { token } = await createAuthenticatedUser('3')

    const res = await request(app)
      .put('/api/portfolio')
      .set('Cookie', authCookie(token))
      .send({ items: [{ symbol: 'btc', amount: 1, avgPrice: 50000 }] })

    expect(res.status).toBe(200)
    expect(res.body.items[0]).toMatchObject({ symbol: 'BTC' })
  })

  it('deduplica items con el mismo símbolo', async () => {
    const { token } = await createAuthenticatedUser('4')

    const res = await request(app)
      .put('/api/portfolio')
      .set('Cookie', authCookie(token))
      .send({
        items: [
          { symbol: 'BTC', amount: 0.5, avgPrice: 30000 },
          { symbol: 'BTC', amount: 1, avgPrice: 40000 },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({ symbol: 'BTC', amount: 0.5 })
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app)
      .put('/api/portfolio')
      .send({ items: [] })
    expect(res.status).toBe(401)
  })

  it('sobrescribe el portfolio en una segunda llamada', async () => {
    const { token } = await createAuthenticatedUser('5')

    await request(app)
      .put('/api/portfolio')
      .set('Cookie', authCookie(token))
      .send({ items: [{ symbol: 'BTC', amount: 1, avgPrice: 30000 }] })

    const res = await request(app)
      .put('/api/portfolio')
      .set('Cookie', authCookie(token))
      .send({ items: [{ symbol: 'ETH', amount: 5, avgPrice: 2000 }] })

    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0]).toMatchObject({ symbol: 'ETH' })
  })
})
