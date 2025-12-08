require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const path = require('path')

const User = require(path.join(__dirname, '..', 'models', 'User'))

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true
      out[key] = val
      if (val !== true) i++
    }
  }
  return out
}

function genPassword(len = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let generatedPassword = ''
  for (let i = 0; i < len; i++) generatedPassword += chars[Math.floor(Math.random() * chars.length)]
  return generatedPassword
}

async function main() {
  const args = parseArgs()
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    console.error('MONGODB_URI no encontrado en .env o variables de entorno. Coloca la URI y vuelve a intentar.')
    process.exit(1)
  }

  const email = args.email || process.env.OWNER_EMAIL
  if (!email) {
    console.error('Debes proveer --email owner@example.com')
    process.exit(1)
  }

  const username = args.username || email.split('@')[0]
  let password = args.password || null

  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message || err)
    process.exit(1)
  }

  try {
    const role = 'owner'

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      existing.role = role
      existing.tokenVersion = (existing.tokenVersion || 0) + 1
      await existing.save()
      console.log(`Usuario existente promocionado a owner: ${existing._id} (${existing.email})`)
      console.log('Nota: la contraseña no ha sido modificada. Si quieres cambiarla, usa la funcionalidad de perfil o ejecuta otro script.')
      await mongoose.disconnect()
      return
    }

    if (!password) password = genPassword(20)

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hash,
      role,
      tokenVersion: 0
    })

    await newUser.save()
    console.log(`Usuario owner creado: ${newUser._id} (${newUser.email})`)
    console.log('Contraseña temporal (cópiala y guárdala en lugar seguro):')
    console.log(password)

    await mongoose.disconnect()
    } catch (err) {
    console.error('Error creando/promoviendo owner:', err)
    try { await mongoose.disconnect() } catch (error) { console.error('Error during disconnect:', error) }
    process.exit(1)
  }
}

main()
