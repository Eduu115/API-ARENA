# Deploy `apiarena.net` con Cloudflare + Nginx Proxy Manager

Este repo levanta todo por Docker Compose. Para producción con tu dominio en Cloudflare, la forma más limpia es:

- **Nginx Proxy Manager (NPM)**: termina TLS y enruta por subdominios a los contenedores.
- **Docker Compose**: levanta microservicios en una red interna (sin puertos publicados al host).
- **Cloudflare**: DNS apuntando al servidor (A/AAAA) y proxy activado si quieres.

## 1) DNS en Cloudflare

Crea estos registros (tipo **A** a la IP de tu servidor):

- `apiarena.net` → tu IP (frontend)
- `auth.apiarena.net` → tu IP
- `challenges.apiarena.net` → tu IP
- `submissions.apiarena.net` → tu IP
- `leaderboard.apiarena.net` → tu IP
- `notifications.apiarena.net` → tu IP (**incluye WebSocket**)
- `metrics.apiarena.net` → tu IP

Opcional (solo si vas a exponer observabilidad):

- `grafana.apiarena.net` → tu IP

## 2) Variables `.env` para producción (mínimo)

En tu `.env` (raíz del repo) pon como mínimo:

```env
DOMAIN=apiarena.net
FRONTEND_URL=https://apiarena.net
APP_EMAIL_FRONTEND_BASE_URL=https://apiarena.net

# No expongas los servicios al público: solo NPM debe estar abierto (80/443).
BIND_IP=127.0.0.1

# CORS para todos los servicios (origen del SPA)
CORS_ALLOWED_ORIGINS=https://apiarena.net

# MUY IMPORTANTE: secreto real (compartido por todos los servicios que validan JWT)
JWT_SECRET=RELLENA_UN_SECRETO_LARGO_Y_ALEATORIO
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Token interno entre servicios (auth/challenge/submission/etc.)
INTERNAL_SERVICE_TOKEN=RELLENA_UN_TOKEN_INTERNO_LARGO_Y_ALEATORIO

# URLs públicas que compila el frontend (Vite)
VITE_AUTH_API_URL=https://auth.apiarena.net
VITE_CHALLENGES_API_URL=https://challenges.apiarena.net
VITE_SUBMISSIONS_API_URL=https://submissions.apiarena.net
VITE_LEADERBOARD_API_URL=https://leaderboard.apiarena.net
VITE_NOTIFICATIONS_API_URL=https://notifications.apiarena.net
VITE_METRICS_API_URL=https://metrics.apiarena.net
```

## 3) Levantar stack en modo “prod detrás de NPM”

Desde la raíz:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Este override (`docker-compose.prod.yml`) quita los `ports:` del host para evitar exponer Postgres/Redis/Kafka y microservicios.

Si tu servidor ya tiene servicios usando puertos típicos (p. ej. `8081`, `5432`, etc.), puedes mover los binds del host con variables tipo `AUTH_HOST_PORT`, `POSTGRES_HOST_PORT`, etc. (ver `docker-compose.yml`).

## 4) Configurar Nginx Proxy Manager

En NPM crea un **Proxy Host** por cada dominio/subdominio:

| Hostname | Forward Hostname | Forward Port |
|---|---|---:|
| `apiarena.net` | `apiarena-frontend` | 80 |
| `auth.apiarena.net` | `apiarena-auth` | 8081 |
| `challenges.apiarena.net` | `apiarena-challenge` | 8082 |
| `submissions.apiarena.net` | `apiarena-submission` | 8083 |
| `leaderboard.apiarena.net` | `apiarena-leaderboard` | 8087 |
| `notifications.apiarena.net` | `apiarena-notification` | 8090 |
| `metrics.apiarena.net` | `apiarena-metrics` | 8089 |

En cada Proxy Host:

- Activa **Websockets Support** (imprescindible en `notifications.apiarena.net`; recomendable en todos).
- Pide certificado **Let’s Encrypt** desde NPM y activa **Force SSL**.

## 5) Notas importantes

- **WebSocket de notificaciones**: el frontend convierte `https://notifications...` a `wss://notifications...` automáticamente.
- **CORS**: con `CORS_ALLOWED_ORIGINS=https://apiarena.net` los servicios aceptan el SPA. Si además quieres dev local, usa:
  - `CORS_ALLOWED_ORIGINS=https://apiarena.net,http://localhost:3000,http://localhost:5173`
- **No publiques puertos internos** en el host en producción; deja que NPM sea el único punto de entrada.

