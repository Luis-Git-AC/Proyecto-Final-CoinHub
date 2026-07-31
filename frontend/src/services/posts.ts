import { request, toQuery } from './api';
import type { Post } from '../types/post';
import type { PostCategory } from '../types/post';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface PostsListResponse {
  posts: Post[];
  pagination: Pagination;
}

interface CreatePostPayload {
  title: string;
  content: string;
  category: PostCategory;
  [key: string]: unknown;
}

interface UpdatePostPayload {
  title?: string;
  content?: string;
  category?: PostCategory;
  [key: string]: unknown;
}

function isFormDataObject(input: unknown): input is FormData {
  return typeof FormData !== 'undefined' && input instanceof FormData;
}

export function getPosts(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<PostsListResponse> {
  return request<PostsListResponse>(`posts${toQuery(params)}`);
}

export function getPost(id: string): Promise<{ post: Post }> {
  return request<{ post: Post }>(`posts/${id}`);
}

export function createPost(payload: CreatePostPayload | FormData): Promise<{ message: string; post: Post }> {
  return request<{ message: string; post: Post }>('posts', {
    method: 'POST',
    data: payload,
    isFormData: isFormDataObject(payload),
  });
}

export function updatePost(id: string, payload: UpdatePostPayload | FormData): Promise<{ message: string; post: Post }> {
  return request<{ message: string; post: Post }>(`posts/${id}`, {
    method: 'PUT',
    data: payload,
    isFormData: isFormDataObject(payload),
  });
}

export function deletePost(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`posts/${id}`, { method: 'DELETE' });
}

export function toggleLike(id: string): Promise<{ message: string; likes: number; hasLiked: boolean }> {
  return request<{ message: string; likes: number; hasLiked: boolean }>(`posts/${id}/like`, { method: 'POST' });
}
