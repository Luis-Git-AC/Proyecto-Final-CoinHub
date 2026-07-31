/**
 * App Express para tests de integración.
 * No llama a connectDB() ni app.listen() — Mongoose ya está
 * conectado al servidor en memoria desde test/setup.ts.
 */
import express, { type Request, type Response, type NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from '../API/routes/authRoutes.js'
import portfolioRoutes from '../API/routes/portfolioRoutes.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/portfolio', portfolioRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message })
})

export default app
