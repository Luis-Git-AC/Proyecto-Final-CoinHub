import { ApiError } from '../types/api';
import type { RequestOptions } from '../types/api';

export { ApiError } from '../types/api';
export type { RequestOptions } from '../types/api';

export const API_URL = (import.meta.env['VITE_API_URL'] as string | undefined ?? '').replace(/\/+$/, '');

function joinUrl(base: string, endpoint: string): string {
  const basePart = (base || '').replace(/\/+$/, '');
  const endpointPart = (endpoint || '').replace(/^\/+/, '');
  return `${basePart}/${endpointPart}`;
}

export function toQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const pairs = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  ) as [string, string | number | boolean][];
  if (!pairs.length) return '';
  const queryString = pairs
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `?${queryString}`;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', data, isFormData, retries = 0, signal, timeout } = options;

  const url = joinUrl(API_URL, endpoint);
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt <= retries) {
    // La sesión viaja en cookies httpOnly (credentials: 'include'), no en un
    // header Authorization. X-Requested-With es la mitigación CSRF que espera
    // el backend en peticiones que mutan estado (ver middleware/csrf.ts).
    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const fetchOpts: RequestInit = { method, headers, credentials: 'include' };

    if (signal) fetchOpts.signal = signal;

    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!signal && timeout) {
      controller = new AbortController();
      fetchOpts.signal = controller.signal;
      timer = setTimeout(() => controller!.abort(), timeout);
    }

    if (data !== undefined) {
      fetchOpts.body = isFormData ? (data as FormData) : JSON.stringify(data);
    }

    try {
      const res = await fetch(url, fetchOpts);
      if (timer) clearTimeout(timer);

      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (res.status >= 500 && attempt < retries) {
          attempt++;
          continue;
        }
        const body = json as Record<string, unknown> | null;
        const msg = (body && (typeof body['error'] === 'string' ? body['error'] : typeof body['message'] === 'string' ? body['message'] : null)) ?? `HTTP ${res.status}`;
        throw new ApiError(msg, res.status, json);
      }

      return json as T;
    } catch (error) {
      if (timer) clearTimeout(timer);

      // No reintentar AbortError
      if ((error as Error).name === 'AbortError') throw error;

      const msg = (error instanceof Error && error.message) ? error.message : String(error);
      const isNetworkError =
        error instanceof TypeError &&
        /failed to fetch|networkerror|load failed|fetch failed/i.test(msg);

      if (isNetworkError) {
        const friendly = new ApiError(
          'No se pudo conectar con el servidor. Revisa que el backend esté encendido y que el origen esté permitido por CORS.',
          0
        );
        friendly.code = 'NETWORK_ERROR';
        lastError = friendly;
      } else {
        lastError = error instanceof Error ? error : new Error(msg);
      }

      if (attempt < retries) {
        attempt++;
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new ApiError('Request failed', 0);
}

export function createAbort(timeout?: number): AbortController {
  const controller = new AbortController();
  if (timeout) setTimeout(() => controller.abort(), timeout);
  return controller;
}
