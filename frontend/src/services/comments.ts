import { request, toQuery } from './api';
import type { Comment } from '../types/comment';

interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface CommentsListResponse {
  comments: Comment[];
  pagination: Pagination;
}

interface CommentPayload {
  postId?: string;
  content: string;
}

export function getComments(
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<CommentsListResponse> {
  return request<CommentsListResponse>(`comments${toQuery(params)}`);
}

export function createComment(data: CommentPayload): Promise<{ message: string; comment: Comment }> {
  return request<{ message: string; comment: Comment }>('comments', { method: 'POST', data });
}

export function updateComment(id: string, data: Pick<CommentPayload, 'content'>): Promise<{ message: string; comment: Comment }> {
  return request<{ message: string; comment: Comment }>(`comments/${id}`, { method: 'PUT', data });
}

export function deleteComment(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`comments/${id}`, { method: 'DELETE' });
}
