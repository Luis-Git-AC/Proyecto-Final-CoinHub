# --- Build stage: compila TypeScript ---
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage: solo dependencias de producción + el dist compilado ---
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
