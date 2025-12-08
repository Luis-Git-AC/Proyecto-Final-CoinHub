import { request, toQuery } from './api'

function isFormDataObject(input) {
  return typeof FormData !== 'undefined' && input instanceof FormData
}

export function getPosts(params) {
  return request(`posts${toQuery(params)}`)
}

export function getPost(id) {
  return request(`posts/${id}`)
}

export function createPost(token, payload) {
  return request('posts', { method: 'POST', token, data: payload, isFormData: isFormDataObject(payload) })
}

export function updatePost(token, id, payload) {
  return request(`posts/${id}`, { method: 'PUT', token, data: payload, isFormData: isFormDataObject(payload) })
}

export function deletePost(token, id) {
  return request(`posts/${id}`, { method: 'DELETE', token })
}

export function toggleLike(token, id) {
  return request(`posts/${id}/like`, { method: 'POST', token })
}
