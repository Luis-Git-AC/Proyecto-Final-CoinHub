export class ApiError extends Error {
  status: number;
  data: unknown;
  code?: string;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data ?? null;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  isFormData?: boolean;
  retries?: number;
  signal?: AbortSignal;
  timeout?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
