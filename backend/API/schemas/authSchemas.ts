import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El username debe tener entre 3 y 30 caracteres')
    .max(30, 'El username debe tener entre 3 y 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede contener letras, números y guiones bajos'),
  email: z.string().trim().toLowerCase().email('Debe proporcionar un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  avatar: z.string().trim().optional(),
  wallet_address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'La dirección de wallet debe tener formato válido (0x + 40 caracteres hex)')
    .optional(),
});

export type RegisterPayload = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Debe proporcionar un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginPayload = z.infer<typeof LoginSchema>;
