import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../API/models/User';

type Args = Record<string, string | boolean>;

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Args = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg && arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      const val = next && !next.startsWith('--') ? next : true;
      out[key] = val;
      if (val !== true) i++;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const passwordArg = args['password'];
  const password = typeof passwordArg === 'string' ? passwordArg : process.env['SEED_PLAIN_PASSWORD'];

  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    console.error('MONGODB_URI no está definido en backend/.env');
    process.exit(1);
  }
  if (!password) {
    console.error('Uso: tsx utils/resetAllPasswords.ts --password NUEVA_CLAVE (o define SEED_PLAIN_PASSWORD en .env)');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
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
    console.error('❌ Error actualizando contraseñas:', (err as Error).message ?? err);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      /* noop */
    }
  }
}

main();
