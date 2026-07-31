import type { PopulatedUser } from './user';

export interface Comment {
  _id: string;
  postId: string;
  userId: PopulatedUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}
