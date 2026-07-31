import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../API/models/User';
import { env } from '../config/env';

async function createAdmin(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const existingAdmin = await User.findOne({ email: 'admintest@cryptohub.com' });
    if (existingAdmin) {
      console.log('⚠️ El usuario admintest@cryptohub.com ya existe');
      console.log('Email:', existingAdmin.email);
      console.log('Password: admin123');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      username: 'admintest',
      email: 'admintest@cryptohub.com',
      password: hashedPassword,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=dc2626',
      wallet_address: '',
      role: 'admin',
    });

    await admin.save();

    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admintest@cryptohub.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdmin();
