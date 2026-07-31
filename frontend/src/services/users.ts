import { request, toQuery } from './api';
import type { User } from '../types/user';
import type { UserRole } from '../types/user';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface UsersListResponse {
  users: User[];
  pagination: Pagination;
}

interface ProfileUpdatePayload {
  username?: string;
  email?: string;
  wallet_address?: string;
  [key: string]: unknown;
}

interface PasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface DeleteAccountPayload {
  currentPassword: string;
}

function isFormDataObject(input: unknown): input is FormData {
  return typeof FormData !== 'undefined' && input instanceof FormData;
}

export function getProfile(): Promise<{ user: User }> {
  return request<{ user: User }>('users/profile');
}

export function updateProfile(payload: ProfileUpdatePayload | FormData): Promise<{ message: string; user: User }> {
  return request<{ message: string; user: User }>('users/profile', {
    method: 'PUT',
    data: payload,
    isFormData: isFormDataObject(payload),
  });
}

export function changePassword(payload: PasswordPayload): Promise<{ message: string }> {
  return request<{ message: string }>('users/profile/password', { method: 'PUT', data: payload });
}

export function listUsers(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<UsersListResponse> {
  return request<UsersListResponse>(`users${toQuery(params)}`);
}

export function getUser(id: string): Promise<{ user: User }> {
  return request<{ user: User }>(`users/${id}`);
}

export function deleteUser(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`users/${id}`, { method: 'DELETE' });
}

export function deleteAccount(payload: DeleteAccountPayload): Promise<{ message: string }> {
  return request<{ message: string }>('users/profile', { method: 'DELETE', data: payload });
}

export function promoteUser(id: string, role: UserRole = 'admin'): Promise<{ message: string; user: User }> {
  return request<{ message: string; user: User }>(`users/${id}/role`, { method: 'PUT', data: { role } });
}

export function demoteUser(id: string): Promise<{ message: string; user: User }> {
  return request<{ message: string; user: User }>(`users/${id}/role`, { method: 'PUT', data: { role: 'user' } });
}
