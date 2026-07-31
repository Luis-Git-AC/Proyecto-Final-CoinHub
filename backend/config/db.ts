import mongoose from 'mongoose';
import { env } from './env.js';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
