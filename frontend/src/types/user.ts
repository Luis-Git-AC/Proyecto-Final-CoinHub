export type UserRole = 'user' | 'admin' | 'owner';

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  wallet_address: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

/** Subconjunto devuelto en campos populados de Post, Comment, Resource */
export interface PopulatedUser {
  _id: string;
  username: string;
  avatar: string | null;
  role: UserRole;
}
