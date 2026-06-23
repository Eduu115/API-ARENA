# Deploy `apiarena.net` con Cloudflare + Nginx Proxy Manager

Este repo levanta todo por Docker Compose. Desde la incorporación del **edge proxy**
(el contenedor `frontend` enruta `/api/*` y `/ws/*` a cada microservicio), el SPA
usa un **único origen**: el navegador solo habla con `apiarena.net`.

- **Frontend (nginx)**: sirve el SPA y hace de gateway `/api` hacia los microservicios por la red interna de Docker.
- **Nginx Proxy Manager (NPM)**: termina TLS y enruta un único host (`apiarena.net`) al contenedor `apiarena-frontend`.
- **Docker Compose**: microservicios en red interna; sus puertos no se publican al exterior.
- **Cloudflare**: DNS apuntando al servidor (A/AAAA), proxy opcional.

## 1) DNS en Cloudflare

Un único registro **A** a la IP de tu servidor:

- `apiarena.net` → tu IP (frontend + API + WebSocket, todo por el mismo host)

Ya **no** hacen falta los subdominios `auth.`, `challenges.`, `submissions.`, etc.

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
MICROSERVICE_BIND_IP=127.0.0.1

# CORS para todos los servicios (origen del SPA)
CORS_ALLOWED_ORIGINS=https://apiarena.net

# MUY IMPORTANTE: secreto real (compartido por todos los servicios que validan JWT)
JWT_SECRET=RELLENA_UN_SECRETO_LARGO_Y_ALEATORIO
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Token interno entre servicios (auth/challenge/submission/etc.)
INTERNAL_SERVICE_TOKEN=RELLENA_UN_TOKEN_INTERNO_LARGO_Y_ALEATORIO

# Origen único de la API (Vite). Vacío => mismo origen: el nginx del frontend
# enruta /api/* a cada servicio. No pongas las antiguas VITE_*_API_URL.
VITE_API_BASE_URL=
```

## 3) Levantar stack en modo “prod detrás de NPM”

Desde la raíz:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

El override (`docker-compose.prod.yml`) quita los `ports:` del host para no exponer
Postgres/Redis/Kafka ni los microservicios. NPM llega al frontend por la red de Docker.

## 4) Configurar Nginx Proxy Manager

Crea **un único Proxy Host**:

| Hostname | Forward Hostname | Forward Port |
|---|---|---:|
| `apiarena.net` | `apiarena-frontend` | 80 |

En ese Proxy Host:

- Activa **Websockets Support** (el bell de notificaciones usa `/ws/notifications`).
- Pide certificado **Let’s Encrypt** desde NPM y activa **Force SSL**.

> NPM debe estar en la misma red Docker que el stack para resolver `apiarena-frontend`.

## 5) Notas importantes

- **WebSocket de notificaciones**: con origen único, el SPA deriva `wss://apiarena.net/ws/notifications` de la propia URL de la página.
- **CORS**: al ser mismo origen, el SPA no necesita CORS hacia los microservicios. Mantén `CORS_ALLOWED_ORIGINS` por si accedes a algún servicio directamente en dev.
- **No publiques puertos internos** en el host en producción; deja que NPM sea el único punto de entrada (80/443). Cierra 8081–8090 en el firewall.
- **Edge hardening (Phase 2)**: el nginx del frontend aplica rate limit (40 r/s, burst 80 por IP) y cabeceras de seguridad en `/api/*`, y devuelve 502/504/429 en JSON. No requiere cambios en NPM/Cloudflare.
- **Monitorización externa (opcional)**: apunta un uptime check a `https://apiarena.net/api/gateway/health` y espera `overall: up` (JSON agregado del gateway + backends, refrescado cada 15s). La liveness del contenedor sigue en `/health` (texto plano).
