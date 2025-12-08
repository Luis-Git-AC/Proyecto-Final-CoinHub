import { request, toQuery } from './api'

function isFormDataObject(input) {
  return typeof FormData !== 'undefined' && input instanceof FormData
}

export function getResources(params) {
  return request(`resources${toQuery(params)}`)
}

export function getResource(id) {
  return request(`resources/${id}`)
}

export function createResource(token, payload) {
  return request('resources', { method: 'POST', token, data: payload, isFormData: isFormDataObject(payload) })
}

export function updateResource(token, id, payload) {
  return request(`resources/${id}`, { method: 'PUT', token, data: payload, isFormData: isFormDataObject(payload) })
}

export function deleteResource(token, id) {
  return request(`resources/${id}`, { method: 'DELETE', token })
}
