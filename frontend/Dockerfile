# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Vite envs must be available at build time (ARG -> ENV).
# Single origin: empty => same-origin; nginx proxies /api/* and /ws/* to each service.
ARG VITE_API_BASE_URL
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}

# Copiar package files y descargar dependencias (capa cacheable)
COPY package*.json ./
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Stage 2: Production con nginx
FROM nginx:alpine

# curl: used by the gateway-health poller (busybox wget can't report status codes).
RUN apk add --no-cache curl

# Copiar los archivos construidos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY api_proxy.conf /etc/nginx/api_proxy.conf

# Aggregated gateway health: poller on PATH + entrypoint hook that backgrounds it.
COPY gateway-health/poll-health.sh /usr/local/bin/poll-health.sh
COPY gateway-health/40-gateway-health.sh /docker-entrypoint.d/40-gateway-health.sh
RUN chmod +x /usr/local/bin/poll-health.sh /docker-entrypoint.d/40-gateway-health.sh \
    && mkdir -p /var/cache && chown nginx:nginx /var/cache

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
