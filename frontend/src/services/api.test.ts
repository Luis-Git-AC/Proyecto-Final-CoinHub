import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request, ApiError } from '../services/api'

// Silenciar import.meta.env en jsdom
vi.stubEnv('VITE_API_URL', 'http://localhost:5000')

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

beforeEach(() => {
  mockFetch.mockReset()
  localStorage.clear()
})

describe('request()', () => {
  it('devuelve el body parseado en una respuesta OK', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ id: 1, name: 'Bitcoin' }))

    const result = await request<{ id: number; name: string }>('/api/coins/1')

    expect(result).toEqual({ id: 1, name: 'Bitcoin' })
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('lanza ApiError con el status correcto en error HTTP', async () => {
    mockFetch.mockResolvedValue(makeResponse({ error: 'No encontrado' }, 404))

    const err = await request('/api/coins/999').catch(e => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(404)

    mockFetch.mockReset()
  })

  it('envía las cookies de sesión y la cabecera anti-CSRF en toda petición', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse({ ok: true }))

    await request('/api/me')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.credentials).toBe('include')
    expect((init.headers as Record<string, string>)['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('reintenta en error 500 según el número de retries', async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse({ error: 'server error' }, 500))
      .mockResolvedValueOnce(makeResponse({ error: 'server error' }, 500))
      .mockResolvedValueOnce(makeResponse({ ok: true }))

    const result = await request('/api/fragile', { retries: 2 })

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('lanza ApiError con code NETWORK_ERROR en fallo de red', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const err = await request('/api/coins').catch(e => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBe('NETWORK_ERROR')
  })
})
