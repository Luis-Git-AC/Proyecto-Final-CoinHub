import { Schema, model } from 'mongoose';
import type { IUser } from '../../types/models';

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'El username es obligatorio'],
      unique: true,
      trim: true,
      minlength: [3, 'El username debe tener al menos 3 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
    },
    avatar: {
      type: String,
      default: null,
    },
    wallet_address: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
