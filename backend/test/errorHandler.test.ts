import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express, { type Request, type Response, type NextFunction } from 'express'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../utils/AppError.js'

const app = express()
app.get('/operational', (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Recurso no encontrado', 404))
})
app.get('/unexpected', () => {
  throw new Error('Boom inesperado')
})
app.use(errorHandler)

describe('errorHandler', () => {
  it('responde con el status y el mensaje de un AppError operacional', async () => {
    const res = await request(app).get('/operational')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Recurso no encontrado' })
  })

  it('responde 500 para un error no operacional y expone el mensaje fuera de producción', async () => {
    const res = await request(app).get('/unexpected')
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Boom inesperado')
  })
})
