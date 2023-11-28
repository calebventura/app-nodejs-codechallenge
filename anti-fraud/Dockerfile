# 1. Fase de build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias e instalarlas
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar
COPY . .
RUN npm run build

# 2. Imagen de producción
FROM node:20-alpine
WORKDIR /app

# Copiar artefactos desde la fase de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Establecer NODE_ENV por defecto
ENV NODE_ENV=production

# Punto de entrada
CMD ["node", "dist/main.js"]
