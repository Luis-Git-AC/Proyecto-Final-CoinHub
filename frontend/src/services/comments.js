import { request, toQuery } from './api'

export function getComments(params) {
  return request(`comments${toQuery(params)}`)
}

export function createComment(token, data) {
  return request('comments', { method: 'POST', token, data })
}

export function updateComment(token, id, data) {
  return request(`comments/${id}`, { method: 'PUT', token, data })
}

export function deleteComment(token, id) {
  return request(`comments/${id}`, { method: 'DELETE', token })
}
