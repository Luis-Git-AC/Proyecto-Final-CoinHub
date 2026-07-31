import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './testApp.js'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../utils/tokens.js'

const VALID_USER = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123',
}

function setCookies(res: request.Response): string[] {
  return (res.headers['set-cookie'] ?? []) as unknown as string[]
}

describe('POST /api/auth/register', () => {
  it('registra un nuevo usuario y fija cookies de sesión (201)', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_USER)

    expect(res.status).toBe(201)
    const cookies = setCookies(res)
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`))).toBe(true)
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true)
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true)
    expect(res.body).not.toHaveProperty('token')
    expect(res.body.user).toMatchObject({
      username: VALID_USER.username,
      email: VALID_USER.username.toLowerCase() + '@example.com',
    })
  })

  it('devuelve 400 si el email ya está registrado', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER)
    const res = await request(app).post('/api/auth/register').send(VALID_USER)

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('devuelve 400 si falta el campo password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', email: 'newuser@example.com' })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 si el username es demasiado corto', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'ab@example.com', password: 'pass123' })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 si el email no es válido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'validuser', email: 'not-an-email', password: 'pass123' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('fija cookies de sesión al iniciar sesión con credenciales válidas (200)', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password })

    expect(res.status).toBe(200)
    const cookies = setCookies(res)
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`))).toBe(true)
    expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true)
    expect(res.body.user).toHaveProperty('email', VALID_USER.email)
  })

  it('devuelve 401 con contraseña incorrecta', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  it('devuelve 401 con email no registrado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexists@example.com', password: 'pass123' })

    expect(res.status).toBe(401)
  })
})

describe('Flujo de sesión: login -> me -> refresh -> logout', () => {
  it('permite acceder a /me con la cookie de acceso emitida por login', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password })

    const cookies = setCookies(loginRes)
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookies)

    expect(meRes.status).toBe(200)
    expect(meRes.body.user).toHaveProperty('email', VALID_USER.email)
  })

  it('/refresh emite un nuevo par de cookies a partir del refresh token', async () => {
    await request(app).post('/api/auth/register').send(VALID_USER)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password })

    const loginCookies = setCookies(loginRes)
    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', loginCookies)

    expect(refreshRes.status).toBe(200)
    const refreshedCookies = setCookies(refreshRes)
    expect(refreshedCookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`))).toBe(true)
    expect(refreshedCookies.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true)
  })

  it('/refresh devuelve 401 sin cookie de refresh', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('/logout limpia las cookies de sesión', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
    const cookies = setCookies(res)
    expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE}=`) && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c))).toBe(
      true
    )
  })
})
