CoinHub es una plataforma orientada a usuarios interesados en criptomonedas que combina una interfaz React para consultar precios, gestionar un portfolio y compartir contenido, con un backend en Node/Express que ofrece persistencia, autenticación, subida de recursos y APIs para la interacción social (posts, comentarios, likes...). Es la continuación del Proyecto 4 (Frontend React) ampliado y que incluye la lógica del backend.

---

**Frontend**

Objetivo: ofrecer una experiencia de usuario sólida — navegación clara, vistas de mercado y noticias, manejo de portfolio, creación/consumo de contenido, y perfil personal.

Páginas (componentes en `frontend/src/pages`) y responsabilidades

- `Home` (`Home.jsx`, `NoticiaCard.jsx`)

  - Panel de noticias (consume `useNoticias`), filtros con `SearchForm`, metadatos de actualización y dos componentes `WorldClocks` a ambos lados.

- `Criptos` (`Criptos.jsx`)

  - Listado Top (usa `useCriptos`), búsqueda, polling periódico para refrescar precios, animaciones de cambio y acciones para añadir/retirar monedas del portfolio.

- `Portfolio` (`Portfolio.jsx`)

  - Visualiza las monedas guardadas, permite actualizar cantidades, eliminar monedas y vaciar portfolio. Sincroniza con el backend mediante `PortfolioProvider`.

- `Profile` (`Profile.jsx`)

  - Edición de datos personales (username, wallet), subida de avatar (form-data), cambio de contraseña, eliminación de cuenta con confirmación y restricciones según rol.

- `Auth` (`Login.jsx`, `Register.jsx`)

  - Formularios de login/registro; se integran con `AuthProvider` para gestionar token y estado de sesión.

- `Posts` (foro)

  - `PostsList.jsx` — listado paginado de posts con botón para crear nuevo.
  - `PostDetail.jsx` — muestra post, imagen, autor, fecha, like/unlike y sección de comentarios (`CommentsList`, `CommentForm`, `CommentItem`).
  - `PostForm.jsx` — crear/editar posts, subida opcional de imagen (enviada como buffer al backend que la sube a Cloudinary).

- `Resources` (repositorio de recursos)

  - `ResourcesList.jsx` — listado de recursos con links para abrir/descargar (proxy del backend) y un widget `TradingViewWidget` cargado de forma lazy.
  - `ResourceDetail.jsx` — detalle del recurso con permisos de edición/eliminación para owner/admin.
  - `ResourceForm.jsx` — subir/editar recurso; al crear el archivo es obligatorio y se envía como `multipart/form-data` al backend.

- `Admin` (`AdminUsers.jsx`)
  - Panel para gestionar usuarios: listar, paginar, promover/demote y eliminar usuarios. Solo accesible a roles `admin`/`owner`.

Componentes y hooks transversales más importantes

- Providers: `AuthProvider`, `PortfolioProvider`, `ToastProvider`, `ConfirmProvider` (gestión de sesión, portfolio local+sync, toasts y confirmaciones).
- Hooks: `useCriptos` (fetch + polling, caching), `useNoticias` (fetch noticias), `usePortfolio` (operaciones de cartera).
- Componentes reutilizables: `CoinCard`, `SearchForm`, `WorldClocks`, `LikeButton`, `Toast`, `Confirm`, `BaseButton` y `TradingViewWidget` (lazy-loaded).
- Estilos: variables globales en `src/styles/variables.css` (colores, spacings, radii) y CSS Modules por componente.

---

**Backend**

Propósito: centralizar la lógica de persistencia, autenticación, autorización, subida de archivos y operaciones relacionales entre colecciones, para que el frontend pueda ser principalmente declarativo y enfocado a UX.

Estructura y responsabilidades (ficheros clave)

- `server.js` — orquesta la API: carga `.env`, conecta con MongoDB (`config/db.js`), configura CORS según `FRONTEND_URL(S)` y monta routers.
- `config/cloudinary.js` — utilidades para subir/eliminar con Cloudinary (upload_stream sobre buffers y opciones por tipo de recurso).
- `middleware/auth.js` — valida JWT, reconstruye `req.user` y `req.userId`, y comprueba `tokenVersion` para revocar tokens si es necesario.
- `middleware/upload.js` — configura `multer` (memoryStorage), valida MIME types (imágenes y pdf) y limita tamaño a 10MB.

Modelos principales (`backend/models`)

- `User` — `username`, `email`, `password` (hash), `avatar`, `wallet_address`, `role` (user|moderator|admin|owner), `tokenVersion`, timestamps. Roles usados para control de permisos en rutas sensibles.
- `Post` — `userId` (ref User), `title`, `content`, `category`, `image` (Cloudinary URL), `likes` (array de User.\_id), timestamps, índices para búsquedas/paginación.
- `Comment` — `postId` (ref Post), `userId` (ref User), `content`, timestamps.
- `Resource` — `userId` (ref User), `title`, `description`, `type` (pdf|image|guide), `fileUrl` (Cloudinary), `originalName`, `category`.
- `Portfolio` — documento único por `userId` con `items` (symbol, amount, avgPrice, metadata). Diseñado para sincronizarse con el cliente sin duplicar datos.

Rutas y lógica

- `auth` — registro (bcrypt), login (JWT con payload {userId, role, tokenVersion}), `me` para recuperar usuario desde token.
- `posts` — CRUD con subida de imagen; control de ownership y roles para editar/eliminar; like/unlike toggle.
- `comments` — CRUD con validación de existencia de post y permisos de edición/eliminación.
- `resources` — CRUD con subida a Cloudinary; endpoints adicionales `open` (stream para visualizar) y `download` (forzar descarga) que actúan como proxy.
- `users` — endpoints de administración (listar, promover, demover, eliminar) y endpoints para actualizar perfil (incluye subida de imagen desde frontend).
- `portfolio` — obtener, actualizar, añadir/quitar items, importar lista entera desde cliente con deduplicado y recálculo de `avgPrice`.

Flujos típicos

- Registro/Login: el backend devuelve JWT; el frontend lo guarda y lo usa en `Authorization: Bearer`.
- Subida de imagen/recurso: frontend envía multipart/form-data → backend recibe buffer vía `multer` → `cloudinary.uploader.upload_stream` → guarda `secure_url` en documento.
- Operaciones protegidas: rutas usan `auth` middleware; además se comprueba `req.userId` vs `resource.userId` para modificaciones.

Seed y generación de datos

- `backend/seed/seed.js` lee CSVs en `backend/seed/data` (`users.csv`, `posts.csv`, `comments.csv`, `resources.csv`) y crea registros enlazando IDs para preservar relaciones (users ↔ posts ↔ comments).

Consideraciones de seguridad y buenas prácticas

- Validaciones en rutas con `express-validator` (emails, formatos, límites).
- Límite de subida: 10MB y control estricto de MIME types.
- Revocación de tokens mediante `tokenVersion` y verificación de token válido en `middleware/auth.js`.
- Eliminación de archivos en Cloudinary al actualizar/eliminar recursos.

---

**Insomnia**

Se incluye `insomnia/insomnia_collection.json` con requests preconfigurados (auth, posts, resources, comments, users, portfolio). Útil para validar flujos completos y compartir escenarios de prueba con el corrector.

---
