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

function genPassword(len = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let generatedPassword = '';
  for (let i = 0; i < len; i++) generatedPassword += chars[Math.floor(Math.random() * chars.length)];
  return generatedPassword;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    console.error('MONGODB_URI no encontrado en .env o variables de entorno. Coloca la URI y vuelve a intentar.');
    process.exit(1);
  }

  const emailArg = args['email'];
  const email = typeof emailArg === 'string' ? emailArg : process.env['OWNER_EMAIL'];
  if (!email) {
    console.error('Debes proveer --email owner@example.com');
    process.exit(1);
  }

  const usernameArg = args['username'];
  const username = typeof usernameArg === 'string' ? usernameArg : email.split('@')[0];
  const passwordArg = args['password'];
  let password = typeof passwordArg === 'string' ? passwordArg : '';

  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.error('Error conectando a MongoDB:', (err as Error).message ?? err);
    process.exit(1);
  }

  try {
    const role = 'owner' as const;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.role = role;
      existing.tokenVersion = (existing.tokenVersion || 0) + 1;
      await existing.save();
      console.log(`Usuario existente promocionado a owner: ${existing._id} (${existing.email})`);
      console.log('Nota: la contraseña no ha sido modificada. Si quieres cambiarla, usa la funcionalidad de perfil o ejecuta otro script.');
      await mongoose.disconnect();
      return;
    }

    if (!password) password = genPassword(20);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hash,
      role,
      tokenVersion: 0,
    });

    await newUser.save();
    console.log(`Usuario owner creado: ${newUser._id} (${newUser.email})`);
    console.log('Contraseña temporal (cópiala y guárdala en lugar seguro):');
    console.log(password);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error creando/promoviendo owner:', err);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error during disconnect:', disconnectError);
    }
    process.exit(1);
  }
}

main();
