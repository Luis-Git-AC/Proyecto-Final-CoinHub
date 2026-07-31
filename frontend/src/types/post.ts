import type { PopulatedUser } from './user';

export type PostCategory = 'análisis' | 'tutorial' | 'experiencia' | 'pregunta';

export interface Post {
  _id: string;
  userId: PopulatedUser;
  title: string;
  content: string;
  category: PostCategory;
  image: string | null;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}
