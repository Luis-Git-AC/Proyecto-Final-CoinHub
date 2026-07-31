import { request } from './api';
import type { User } from '../types/user';

interface AuthResponse {
  message: string;
  user: User;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  wallet_address?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export function register(data: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('auth/register', { method: 'POST', data });
}

export function login(data: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('auth/login', { method: 'POST', data });
}

export function me(): Promise<{ user: User }> {
  return request<{ user: User }>('auth/me');
}

export function refresh(): Promise<{ message: string }> {
  return request<{ message: string }>('auth/refresh', { method: 'POST' });
}

export function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('auth/logout', { method: 'POST' });
}
