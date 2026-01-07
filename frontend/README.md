# CoinHub Frontend

Aplicación React (Vite) que consume la API de CoinHub para autenticación, portfolio, posts, comentarios y recursos.

## Despliegue

- URL (producción): https://coin-hub-frontend-tau.vercel.app/

## Requisitos

- Node.js (recomendado: LTS)

## Instalación y ejecución (local)

```bash
cd frontend
npm install
npm run dev
```

Servidor local por defecto: `http://localhost:5173`.

## Configuración (API)

El frontend usa la variable de entorno:

- `VITE_API_URL` — base URL del backend incluyendo `/api`

Ejemplo (local):

- `VITE_API_URL=http://localhost:5000/api`

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run preview` — previsualización del build
- `npm run lint` — lint JS/React
- `npm run lint:css` — lint CSS

## Notas de despliegue

- El proyecto incluye configuración SPA en Vercel para que las rutas de React Router funcionen tras refrescar.
