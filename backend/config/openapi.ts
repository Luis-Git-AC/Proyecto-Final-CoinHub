import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { RegisterSchema, LoginSchema } from '../API/schemas/authSchemas';
import { CreatePostSchema, UpdatePostSchema } from '../API/schemas/postsSchemas';
import {
  ReplacePortfolioSchema,
  AddItemSchema,
  UpdateItemSchema,
  ImportItemsSchema,
} from '../API/schemas/portfolioSchemas';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const SESSION_NOTE =
  'Requiere sesión: cookies httpOnly `access_token`/`refresh_token` fijadas por /api/auth/login o /api/auth/register (no hay header Authorization).';

const ErrorResponseSchema = z.object({ error: z.string() }).openapi('ErrorResponse');

const UserPublicSchema = z
  .object({
    _id: z.string(),
    username: z.string(),
    email: z.string(),
    avatar: z.string().nullable(),
    wallet_address: z.string().nullable(),
    role: z.enum(['user', 'admin', 'owner']),
  })
  .openapi('UserPublic');

const PortfolioItemSchema = z
  .object({
    _id: z.string(),
    symbol: z.string(),
    amount: z.number(),
    avgPrice: z.number(),
    notes: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi('PortfolioItem');

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Registra un usuario y fija las cookies de sesión',
  request: { body: { content: { 'application/json': { schema: RegisterSchema } } } },
  responses: {
    201: {
      description: 'Usuario registrado',
      content: { 'application/json': { schema: z.object({ message: z.string(), user: UserPublicSchema }) } },
    },
    400: { description: 'Datos inválidos', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Inicia sesión y fija las cookies de sesión',
  request: { body: { content: { 'application/json': { schema: LoginSchema } } } },
  responses: {
    200: {
      description: 'Login correcto',
      content: { 'application/json': { schema: z.object({ message: z.string(), user: UserPublicSchema }) } },
    },
    401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Auth'],
  summary: 'Renueva el access token a partir del refresh token',
  responses: {
    200: {
      description: 'Token renovado',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: {
      description: 'Refresh token inválido, expirado o ausente',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Limpia las cookies de sesión',
  responses: {
    200: { description: 'Sesión cerrada', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: `Devuelve el usuario autenticado. ${SESSION_NOTE}`,
  responses: {
    200: {
      description: 'Usuario autenticado',
      content: { 'application/json': { schema: z.object({ user: UserPublicSchema }) } },
    },
    401: { description: 'No autenticado', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/posts',
  tags: ['Posts'],
  summary: `Crea un post. ${SESSION_NOTE}`,
  request: { body: { content: { 'application/json': { schema: CreatePostSchema } } } },
  responses: {
    201: { description: 'Post creado' },
    400: { description: 'Datos inválidos', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'No autenticado', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/posts/{postId}',
  tags: ['Posts'],
  summary: `Edita un post propio (o de admin/owner). ${SESSION_NOTE}`,
  request: {
    params: z.object({ postId: z.string() }),
    body: { content: { 'application/json': { schema: UpdatePostSchema } } },
  },
  responses: {
    200: { description: 'Post actualizado' },
    403: { description: 'Sin permisos', content: { 'application/json': { schema: ErrorResponseSchema } } },
    404: { description: 'Post no encontrado', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

// Caso de estudio de Clean Architecture (ver README) — el módulo mejor
// documentado porque su contrato está definido de punta a punta con Zod.

registry.registerPath({
  method: 'get',
  path: '/api/portfolio',
  tags: ['Portfolio'],
  summary: `Obtiene el portfolio del usuario autenticado. ${SESSION_NOTE}`,
  responses: {
    200: {
      description: 'Items del portfolio',
      content: { 'application/json': { schema: z.object({ items: z.array(PortfolioItemSchema) }) } },
    },
    401: { description: 'No autenticado', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/portfolio',
  tags: ['Portfolio'],
  summary: `Reemplaza el portfolio completo (dedup por símbolo). ${SESSION_NOTE}`,
  request: { body: { content: { 'application/json': { schema: ReplacePortfolioSchema } } } },
  responses: {
    200: {
      description: 'Portfolio actualizado',
      content: {
        'application/json': { schema: z.object({ message: z.string(), items: z.array(PortfolioItemSchema) }) },
      },
    },
    400: {
      description: 'Datos inválidos o límite excedido',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/portfolio/items',
  tags: ['Portfolio'],
  summary: `Añade un item (falla si el símbolo ya existe). ${SESSION_NOTE}`,
  request: { body: { content: { 'application/json': { schema: AddItemSchema } } } },
  responses: {
    200: {
      description: 'Item añadido',
      content: { 'application/json': { schema: z.object({ item: PortfolioItemSchema }) } },
    },
    400: {
      description: 'Símbolo ya existe o límite excedido',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/portfolio/items/{itemId}',
  tags: ['Portfolio'],
  summary: `Actualiza un item por id. ${SESSION_NOTE}`,
  request: {
    params: z.object({ itemId: z.string() }),
    body: { content: { 'application/json': { schema: UpdateItemSchema } } },
  },
  responses: {
    200: {
      description: 'Item actualizado',
      content: { 'application/json': { schema: z.object({ item: PortfolioItemSchema }) } },
    },
    404: {
      description: 'Portfolio o item no encontrado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/portfolio/items/{itemId}',
  tags: ['Portfolio'],
  summary: `Elimina un item por id. ${SESSION_NOTE}`,
  request: { params: z.object({ itemId: z.string() }) },
  responses: {
    200: {
      description: 'Item eliminado',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: 'Portfolio o item no encontrado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/portfolio/import',
  tags: ['Portfolio'],
  summary: `Importa items (merge por símbolo, recalcula avgPrice). ${SESSION_NOTE}`,
  request: { body: { content: { 'application/json': { schema: ImportItemsSchema } } } },
  responses: {
    200: {
      description: 'Importación realizada',
      content: {
        'application/json': { schema: z.object({ message: z.string(), items: z.array(PortfolioItemSchema) }) },
      },
    },
    400: { description: 'Límite excedido', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'CoinHub API',
      version: '1.0.0',
      description:
        'Documentación generada automáticamente desde los esquemas Zod (misma fuente que valida en runtime, sin duplicar la definición a mano). Cubre auth, posts y portfolio — los módulos ya migrados a Zod. Comments, resources, users y news todavía validan con express-validator y no están documentados aquí; ver el README para su contrato completo de endpoints.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
  });
}
