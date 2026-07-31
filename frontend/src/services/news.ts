import { request } from './api';

export interface NewsItem {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  fuente: string;
  url: string | undefined;
  imagen: string | null;
  moneda: string;
}

interface FetchNewsOptions {
  signal?: AbortSignal;
}

interface NewsResponse {
  items: NewsItem[];
}

export async function fetchNews({ signal }: FetchNewsOptions = {}): Promise<NewsItem[]> {
  const data = await request<NewsResponse>('news', { signal });
  return data.items;
}
