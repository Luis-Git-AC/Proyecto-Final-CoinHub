export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

function joinUrl(base, endpoint) {
  const basePart = (base ? String(base) : '').replace(/\/+$/, '')
  const endpointPart = (endpoint ? String(endpoint) : '').replace(/^\/+/, '')
  return basePart + '/' + endpointPart
}

export function toQuery(params) {
  if (!params) return ''
  const pairs = Object.entries(params).filter((entry) => {
    const value = entry[1]
    return value !== undefined && value !== null && value !== ''
  })
  if (!pairs.length) return ''
  const queryString = pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return `?${queryString}`
}

export async function request(endpoint, options = {}) {
  const { method = 'GET', token: optToken, data, isFormData, retries = 0, signal, timeout } = options
  const token = optToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
  const url = joinUrl(API_URL, endpoint)
  let attempt = 0
  let lastError
  while (attempt <= retries) {
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (!isFormData) headers['Content-Type'] = 'application/json'
    const fetchOpts = { method, headers }
    if (signal) fetchOpts.signal = signal
    let controller
    let timer
    if (!signal && timeout) {
      controller = new AbortController()
      fetchOpts.signal = controller.signal
      timer = setTimeout(() => controller.abort(), timeout)
    }
    if (data !== undefined) fetchOpts.body = isFormData ? data : JSON.stringify(data)
    try {
      const res = await fetch(url, fetchOpts)
      if (timer) clearTimeout(timer)
      let json = null
      try { json = await res.json() } catch { json = null }
      if (!res.ok) {
        if (res.status >= 500 && attempt < retries) {
          attempt++
          continue
        }
        const msg = (json && (json.error || json.message)) || `HTTP ${res.status}`
        const err = new Error(msg)
        err.status = res.status
        err.data = json
        throw err
      }
      return json
    } catch (error) {
      if (timer) clearTimeout(timer)
      if (error.name === 'AbortError') throw error
      lastError = error
      if (attempt < retries) {
        attempt++
        continue
      }
      throw error
    }
  }
  throw lastError || new Error('Request failed')
}

export function createAbort(timeout) {
  const controller = new AbortController()
  if (timeout) setTimeout(() => controller.abort(), timeout)
  return controller
}
