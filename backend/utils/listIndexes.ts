import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';

async function listIndexes(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const database = mongoose.connection.db;
    if (!database) {
      throw new Error('No se pudo obtener la conexión a la base de datos');
    }
    const indexes = await database.collection('users').indexes();

    console.log('Índices en la colección `users`:');
    console.log(JSON.stringify(indexes, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listando índices:', err);
    process.exit(1);
  }
}

listIndexes();
