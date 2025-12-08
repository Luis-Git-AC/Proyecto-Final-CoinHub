require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const User = require(path.join(__dirname, '..', 'models', 'User'));

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      out[key] = val;
      if (val !== true) i++;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const password = args.password || process.env.SEED_PLAIN_PASSWORD;

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI no está definido en backend/.env');
    process.exit(1);
  }
  if (!password) {
    console.error('Uso: node utils/resetAllPasswords.js --password NUEVA_CLAVE (o define SEED_PLAIN_PASSWORD en .env)');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    if (!users.length) {
      console.log('No hay usuarios para actualizar.');
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let updated = 0;
    for (const u of users) {
      u.password = hash;
      u.tokenVersion = (u.tokenVersion || 0) + 1;
      await u.save();
      updated++;
    }
    console.log(`✅ Contraseña actualizada para ${updated} usuarios.`);
  } catch (err) {
    console.error('❌ Error actualizando contraseñas:', err.message || err);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch {/* */}
  }
}

main();
