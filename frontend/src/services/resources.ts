import { request, toQuery } from './api';
import type { Resource } from '../types/resource';
import type { ResourceType, ResourceCategory } from '../types/resource';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface ResourcesListResponse {
  resources: Resource[];
  pagination: Pagination;
}

interface CreateResourcePayload {
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  [key: string]: unknown;
}

interface UpdateResourcePayload {
  title?: string;
  description?: string;
  type?: ResourceType;
  category?: ResourceCategory;
  [key: string]: unknown;
}

function isFormDataObject(input: unknown): input is FormData {
  return typeof FormData !== 'undefined' && input instanceof FormData;
}

export function getResources(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<ResourcesListResponse> {
  return request<ResourcesListResponse>(`resources${toQuery(params)}`);
}

export function getResource(id: string): Promise<{ resource: Resource }> {
  return request<{ resource: Resource }>(`resources/${id}`);
}

export function createResource(payload: CreateResourcePayload | FormData): Promise<{ message: string; resource: Resource }> {
  return request<{ message: string; resource: Resource }>('resources', {
    method: 'POST',
    data: payload,
    isFormData: isFormDataObject(payload),
  });
}

export function updateResource(id: string, payload: UpdateResourcePayload | FormData): Promise<{ message: string; resource: Resource }> {
  return request<{ message: string; resource: Resource }>(`resources/${id}`, {
    method: 'PUT',
    data: payload,
    isFormData: isFormDataObject(payload),
  });
}

export function deleteResource(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`resources/${id}`, { method: 'DELETE' });
}
