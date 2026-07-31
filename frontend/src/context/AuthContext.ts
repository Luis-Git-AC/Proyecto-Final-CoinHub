import { createContext } from 'react';
import type { User } from '../types/user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  wallet_address?: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  loginUser: (credentials: LoginPayload) => Promise<User>;
  registerUser: (payload: RegisterPayload) => Promise<User>;
  logoutUser: () => void;
  loadCurrentUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
