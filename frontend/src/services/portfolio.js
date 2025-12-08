import { request } from './api'

export async function getPortfolio(token) {
  return await request('portfolio', { method: 'GET', token })
}

export async function putPortfolio(token, items) {
  return await request('portfolio', { method: 'PUT', token, data: { items } })
}

export async function postPortfolioItem(token, item) {
  return await request('portfolio/items', { method: 'POST', token, data: item })
}

export async function putPortfolioItem(token, itemId, data) {
  return await request(`portfolio/items/${itemId}`, { method: 'PUT', token, data })
}

export async function deletePortfolioItem(token, itemId) {
  return await request(`portfolio/items/${itemId}`, { method: 'DELETE', token })
}

export async function importPortfolio(token, items) {
  return await request('portfolio/import', { method: 'POST', token, data: { items } })
}
