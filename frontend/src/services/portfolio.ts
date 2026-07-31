import { request } from './api';
import type { PortfolioItem } from '../types/portfolio';

interface PortfolioResponse {
  items: PortfolioItem[];
}

interface PortfolioItemPayload {
  symbol: string;
  amount: number;
  avgPrice?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateItemPayload {
  amount?: number;
  avgPrice?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export async function getPortfolio(): Promise<PortfolioResponse> {
  return request<PortfolioResponse>('portfolio', { method: 'GET' });
}

export async function putPortfolio(items: PortfolioItemPayload[]): Promise<{ message: string; items: PortfolioItem[] }> {
  return request<{ message: string; items: PortfolioItem[] }>('portfolio', { method: 'PUT', data: { items } });
}

export async function postPortfolioItem(item: PortfolioItemPayload): Promise<{ item: PortfolioItem }> {
  return request<{ item: PortfolioItem }>('portfolio/items', { method: 'POST', data: item });
}

export async function putPortfolioItem(itemId: string, data: UpdateItemPayload): Promise<{ item: PortfolioItem }> {
  return request<{ item: PortfolioItem }>(`portfolio/items/${itemId}`, { method: 'PUT', data });
}

export async function deletePortfolioItem(itemId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`portfolio/items/${itemId}`, { method: 'DELETE' });
}

export async function importPortfolio(items: PortfolioItemPayload[]): Promise<{ message: string; items: PortfolioItem[] }> {
  return request<{ message: string; items: PortfolioItem[] }>('portfolio/import', { method: 'POST', data: { items } });
}
