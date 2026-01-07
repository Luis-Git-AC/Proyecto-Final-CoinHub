# CoinHub Backend (API)

API REST construida con Node.js + Express + MongoDB (Mongoose). Gestiona autenticación JWT, usuarios/roles, posts, comentarios, recursos (subida a Cloudinary y proxy open/download) y portfolio.

## Despliegue

- URL (producción): https://coin-hub-backend.vercel.app/
- Health check: `GET /api/health`

## Requisitos

- Node.js (recomendado: LTS)
- Una base de datos MongoDB (Atlas o local)
- Credenciales de Cloudinary (para subida de imágenes/archivos)

## Instalación y ejecución (local)

```bash
cd backend
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:5000`.

### Variables de entorno

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`
- `FRONTEND_URLS`

## Autenticación

Las rutas protegidas requieren header:

- `Authorization: Bearer <token>`

El token se obtiene en `POST /api/auth/login` o `POST /api/auth/register`.

## Endpoints

Base path: todos los endpoints cuelgan de `/api`.

### Auth (`/api/auth`)

| Método | Ruta                 | Auth | Rol              | Body | Resumen                                      |
| ------ | -------------------- | ---- | ---------------- | ---- | -------------------------------------------- |
| POST   | `/api/auth/register` | No   | —                | JSON | Registra usuario y devuelve `token` + `user` |
| POST   | `/api/auth/login`    | No   | —                | JSON | Login y devuelve `token` + `user`            |
| GET    | `/api/auth/me`       | Sí   | user/admin/owner | —    | Devuelve el usuario asociado al token        |

**Body register (JSON):** `username`, `email`, `password`, `wallet_address` (opcional)

**Body login (JSON):** `email`, `password`

---

### Users (`/api/users`)

| Método | Ruta                          | Auth | Rol              | Body                         | Resumen                                                          |
| ------ | ----------------------------- | ---- | ---------------- | ---------------------------- | ---------------------------------------------------------------- |
| GET    | `/api/users/profile`          | Sí   | user/admin/owner | —                            | Obtiene el perfil del usuario autenticado                        |
| PUT    | `/api/users/profile`          | Sí   | user/admin/owner | JSON o `multipart/form-data` | Actualiza perfil (username/email/wallet y avatar)                |
| PUT    | `/api/users/profile/password` | Sí   | user/admin/owner | JSON                         | Cambia contraseña (revoca sesiones incrementando `tokenVersion`) |
| DELETE | `/api/users/profile`          | Sí   | user/admin       | JSON                         | Auto-elimina cuenta y contenido (owner **no** puede)             |
| GET    | `/api/users`                  | Sí   | admin/owner      | —                            | Lista usuarios (paginado). Query: `page`, `limit`, `role`        |
| GET    | `/api/users/:userId`          | No   | —                | —                            | Obtiene un usuario público (sin email)                           |
| PUT    | `/api/users/:userId/role`     | Sí   | admin/owner      | JSON                         | Cambia rol del usuario (solo `user`/`admin`)                     |
| DELETE | `/api/users/:userId`          | Sí   | admin/owner      | —                            | Elimina un usuario y su contenido (con restricciones por rol)    |

**Notas de permisos importantes (según implementación):**

- No puedes eliminar tu propio usuario desde el endpoint admin (`DELETE /api/users/:userId`).
- Un `admin` (y un `user`) **sí puede** auto-eliminar su cuenta desde `DELETE /api/users/profile` aportando `currentPassword`.
- No se puede eliminar a un `owner`.
- Solo `owner` puede eliminar a un `admin`.
- Solo `owner` puede despromocionar a un `admin` a `user`.
- `owner` no puede auto-eliminar su cuenta desde perfil.

**Body change password (JSON):** `currentPassword`, `newPassword` (mín. 16), `confirmPassword`

**Body delete account (JSON):** `currentPassword`

**Body change role (JSON):** `role` (`user` o `admin`)

---

### Posts (`/api/posts`)

| Método | Ruta                      | Auth | Rol                          | Body                                                  | Resumen                                                              |
| ------ | ------------------------- | ---- | ---------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| GET    | `/api/posts`              | No   | —                            | —                                                     | Lista posts (paginado). Query: `page`, `limit`, `category`, `userId` |
| GET    | `/api/posts/:postId`      | No   | —                            | —                                                     | Obtiene un post                                                      |
| POST   | `/api/posts`              | Sí   | user/admin/owner             | `multipart/form-data` (campo `image` opcional) o JSON | Crea post                                                            |
| PUT    | `/api/posts/:postId`      | Sí   | owner del post o admin/owner | `multipart/form-data` (campo `image` opcional) o JSON | Edita post                                                           |
| DELETE | `/api/posts/:postId`      | Sí   | owner del post o admin/owner | —                                                     | Elimina post                                                         |
| POST   | `/api/posts/:postId/like` | Sí   | user/admin/owner             | —                                                     | Alterna like/unlike                                                  |

**Body post (JSON):** `title`, `content`, `category` (valores: `análisis`, `tutorial`, `experiencia`, `pregunta`)

---

### Comments (`/api/comments`)

| Método | Ruta                       | Auth | Rol                          | Body | Resumen                                                       |
| ------ | -------------------------- | ---- | ---------------------------- | ---- | ------------------------------------------------------------- |
| GET    | `/api/comments`            | No   | —                            | —    | Lista comentarios. Query: `postId`, `userId`, `page`, `limit` |
| GET    | `/api/comments/:commentId` | No   | —                            | —    | Obtiene un comentario                                         |
| POST   | `/api/comments`            | Sí   | user/admin/owner             | JSON | Crea comentario                                               |
| PUT    | `/api/comments/:commentId` | Sí   | owner del comentario         | JSON | Edita comentario                                              |
| DELETE | `/api/comments/:commentId` | Sí   | owner del comentario o admin | —    | Elimina comentario                                            |

**Body create/update (JSON):** `content`

**Body create (JSON adicional):** `postId`

---

### Resources (`/api/resources`)

| Método | Ruta                                  | Auth | Rol                             | Body                                             | Resumen                                                              |
| ------ | ------------------------------------- | ---- | ------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| GET    | `/api/resources`                      | No   | —                               | —                                                | Lista recursos. Query: `page`, `limit`, `type`, `category`, `userId` |
| GET    | `/api/resources/:resourceId`          | No   | —                               | —                                                | Obtiene un recurso                                                   |
| GET    | `/api/resources/:resourceId/open`     | No   | —                               | —                                                | Devuelve el archivo en streaming (proxy)                             |
| GET    | `/api/resources/:resourceId/download` | No   | —                               | —                                                | Fuerza descarga del archivo (proxy)                                  |
| POST   | `/api/resources`                      | Sí   | user/admin/owner                | `multipart/form-data` (campo `file` obligatorio) | Crea recurso                                                         |
| PUT    | `/api/resources/:resourceId`          | Sí   | owner del recurso o admin/owner | `multipart/form-data` (campo `file` opcional)    | Edita recurso                                                        |
| DELETE | `/api/resources/:resourceId`          | Sí   | owner del recurso o admin/owner | —                                                | Elimina recurso                                                      |

**Body resource (form-data):**

- `title`
- `description`
- `type` (valores: `pdf`, `image`, `guide`)
- `category` (valores: `análisis-técnico`, `fundamentos`, `trading`, `seguridad`, `defi`, `otro`)
- `file` (obligatorio al crear)

---

### Portfolio (`/api/portfolio`)

| Método | Ruta                           | Auth | Rol              | Body | Resumen                                      |
| ------ | ------------------------------ | ---- | ---------------- | ---- | -------------------------------------------- |
| GET    | `/api/portfolio`               | Sí   | user/admin/owner | —    | Obtiene items del portfolio                  |
| PUT    | `/api/portfolio`               | Sí   | user/admin/owner | JSON | Reemplaza portfolio (dedup por símbolo)      |
| POST   | `/api/portfolio/items`         | Sí   | user/admin/owner | JSON | Añade item (si no existe)                    |
| PUT    | `/api/portfolio/items/:itemId` | Sí   | user/admin/owner | JSON | Actualiza item por id                        |
| DELETE | `/api/portfolio/items/:itemId` | Sí   | user/admin/owner | —    | Elimina item por id                          |
| POST   | `/api/portfolio/import`        | Sí   | user/admin/owner | JSON | Importa items (merge y recalcula `avgPrice`) |

**Body PUT /api/portfolio (JSON):** `{ items: Array<{ symbol, amount, avgPrice, notes?, metadata? }> }`

## Seed

Para poblar la BD con datos de ejemplo (CSV):

```bash
cd backend
npm run seed
```

## Notas

- Subidas de archivos usan `multer` en memoria (límite 10MB) y Cloudinary.
- En desarrollo, CORS acepta `localhost/127.0.0.1` con cualquier puerto; en producción se restringe por `FRONTEND_URL(S)`.
