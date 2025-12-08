import { request, toQuery } from './api'

function isFormDataObject(input) {
  return typeof FormData !== 'undefined' && input instanceof FormData
}

export function getProfile(token) {
  return request('users/profile', { token })
}

export function updateProfile(token, payload) {
  return request('users/profile', { method: 'PUT', token, data: payload, isFormData: isFormDataObject(payload) })
}

export function changePassword(token, payload) {
  return request('users/profile/password', { method: 'PUT', token, data: payload })
}

export function listUsers(token, params) {
  return request(`users${toQuery(params)}` , { token })
}

export function getUser(id) {
  return request(`users/${id}`)
}

export function deleteUser(token, id) {
  return request(`users/${id}`, { method: 'DELETE', token })
}

export function deleteAccount(token, payload) {
  return request('users/profile', { method: 'DELETE', token, data: payload })
}

export function promoteUser(token, id, role = 'admin') {
  return request(`users/${id}/role`, { method: 'PUT', token, data: { role } })
}

export function demoteUser(token, id) {
  return request(`users/${id}/role`, { method: 'PUT', token, data: { role: 'user' } })
}
