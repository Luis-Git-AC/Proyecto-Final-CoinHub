import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { beforeAll, afterAll, afterEach } from 'vitest'

// Establecer variables de entorno ANTES de que se carguen los módulos
// (env.ts evalúa process.env al importarse, con `requireEnv` síncrono)
process.env['JWT_SECRET'] = 'test-jwt-secret-very-long-for-testing'
process.env['NODE_ENV'] = 'test'
process.env['FRONTEND_URLS'] = 'http://localhost:5173'
process.env['PORT'] = '5001'
process.env['CLOUDINARY_CLOUD_NAME'] = 'test-cloud'
process.env['CLOUDINARY_API_KEY'] = 'test-key'
process.env['CLOUDINARY_API_SECRET'] = 'test-secret'
// Placeholder para que `requireEnv('MONGODB_URI')` no falle al importar
// `config/env.ts` antes de tiempo; beforeAll la sobreescribe con el URI real
// del servidor en memoria antes de que se abra ninguna conexión.
process.env['MONGODB_URI'] = 'mongodb://placeholder-until-beforeall/test'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  process.env['MONGODB_URI'] = uri
  await mongoose.connect(uri)
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key]?.deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
