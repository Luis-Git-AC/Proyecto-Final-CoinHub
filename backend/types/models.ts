import type { Document, Types } from 'mongoose';


export type UserRole = 'user' | 'admin' | 'owner';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  avatar: string | null;
  wallet_address: string | null;
  role: UserRole;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}


export type PostCategory = 'análisis' | 'tutorial' | 'experiencia' | 'pregunta';

export interface IPost extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  category: PostCategory;
  image: string | null;
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}


export interface IComment extends Document {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}


export type ResourceType = 'pdf' | 'image' | 'guide';

export type ResourceCategory =
  | 'análisis-técnico'
  | 'fundamentos'
  | 'trading'
  | 'seguridad'
  | 'defi'
  | 'otro';

export interface IResource extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  type: ResourceType;
  fileUrl: string;
  originalName?: string;
  category: ResourceCategory;
  createdAt: Date;
  updatedAt: Date;
}


/**
 * Interfaces de negocio puras (sin `extends Document`): describen la forma
 * de los datos, no cómo Mongoose los envuelve. `Portfolio.ts` (el modelo) usa
 * `HydratedDocument<Portfolio>` únicamente donde de verdad se instancia un
 * documento (repositorio/servicio) — así `.lean()` y estas interfaces
 * coinciden exactamente, sin los métodos de `Document` de por medio.
 * Caso de estudio acotado a Portfolio; el resto de modelos sigue con el
 * patrón `extends Document` anterior (ver mejoras2.md).
 */
export interface PortfolioItem {
  symbol: string;
  amount: number;
  avgPrice: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  userId: Types.ObjectId;
  // `items` sigue tipado como `DocumentArray`: es un array de subdocumentos
  // Mongoose reales (necesitan `.id()`/`.push()` con semántica de Mongoose,
  // no de Array plano) — eso es una propiedad genuina del runtime, no
  // acoplamiento innecesario a `Document` como el que sí se eliminó arriba.
  items: Types.DocumentArray<PortfolioItem>;
  updatedAt: Date;
}
