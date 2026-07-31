import type { PopulatedUser } from './user';

export type ResourceType = 'pdf' | 'image' | 'guide';

export type ResourceCategory =
  | 'análisis-técnico'
  | 'fundamentos'
  | 'trading'
  | 'seguridad'
  | 'defi'
  | 'otro';

export interface Resource {
  _id: string;
  userId: PopulatedUser;
  title: string;
  description: string;
  type: ResourceType;
  fileUrl: string;
  originalName?: string;
  category: ResourceCategory;
  createdAt: string;
  updatedAt: string;
}
