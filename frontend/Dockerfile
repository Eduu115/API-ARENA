# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Vite envs must be available at build time (ARG -> ENV).
ARG VITE_AUTH_API_URL
ARG VITE_CHALLENGES_API_URL
ARG VITE_SUBMISSIONS_API_URL
ARG VITE_LEADERBOARD_API_URL
ARG VITE_NOTIFICATIONS_API_URL
ARG VITE_METRICS_API_URL
ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}
ENV VITE_CHALLENGES_API_URL=${VITE_CHALLENGES_API_URL}
ENV VITE_SUBMISSIONS_API_URL=${VITE_SUBMISSIONS_API_URL}
ENV VITE_LEADERBOARD_API_URL=${VITE_LEADERBOARD_API_URL}
ENV VITE_NOTIFICATIONS_API_URL=${VITE_NOTIFICATIONS_API_URL}
ENV VITE_METRICS_API_URL=${VITE_METRICS_API_URL}

# Copiar package files y descargar dependencias (capa cacheable)
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Stage 2: Production con nginx
FROM nginx:alpine

# Copiar los archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
