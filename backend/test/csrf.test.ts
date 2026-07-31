import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express, { type Request, type Response } from 'express'
import { csrfHeaderGuard } from '../middleware/csrf.js'

const app = express()
app.use(csrfHeaderGuard)
app.get('/ping', (_req: Request, res: Response) => res.json({ ok: true }))
app.post('/ping', (_req: Request, res: Response) => res.json({ ok: true }))

describe('csrfHeaderGuard', () => {
  it('permite peticiones GET sin la cabecera custom', async () => {
    const res = await request(app).get('/ping')
    expect(res.status).toBe(200)
  })

  it('bloquea peticiones POST sin la cabecera X-Requested-With (403)', async () => {
    const res = await request(app).post('/ping')
    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error')
  })

  it('permite peticiones POST con la cabecera X-Requested-With', async () => {
    const res = await request(app).post('/ping').set('X-Requested-With', 'XMLHttpRequest')
    expect(res.status).toBe(200)
  })
})
