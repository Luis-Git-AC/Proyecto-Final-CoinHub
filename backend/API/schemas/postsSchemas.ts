import { z } from 'zod';

const PostCategoryEnum = z.enum(['análisis', 'tutorial', 'experiencia', 'pregunta'], {
  message: 'Categoría inválida',
});

export const CreatePostSchema = z.object({
  title: z.string().trim().min(5, 'El título debe tener entre 5 y 200 caracteres').max(200, 'El título debe tener entre 5 y 200 caracteres'),
  content: z.string().trim().min(10, 'El contenido debe tener al menos 10 caracteres'),
  category: PostCategoryEnum,
});

export type CreatePostPayload = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = z.object({
  title: z.string().trim().min(5, 'El título debe tener entre 5 y 200 caracteres').max(200, 'El título debe tener entre 5 y 200 caracteres').optional(),
  content: z.string().trim().min(10, 'El contenido debe tener al menos 10 caracteres').optional(),
  category: PostCategoryEnum.optional(),
});

export type UpdatePostPayload = z.infer<typeof UpdatePostSchema>;
