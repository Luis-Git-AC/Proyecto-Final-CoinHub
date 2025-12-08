import { request } from './api'

export function register(data) {
  return request('auth/register', { method: 'POST', data })
}

export function login(data) {
  return request('auth/login', { method: 'POST', data })
}

export function me(token) {
  return request('auth/me', { token })
}
