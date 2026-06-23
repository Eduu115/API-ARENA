# API Gateway — Implementation Plan (API Arena)

**Audience:** Claude Code (or any implementer) delegating from the maintainer.  
**Coordination:** Cursor agent has context on recent work (`feature/challenge-newsletter`, landing, i18n). Ping Cursor when touching overlapping frontend/infra.  
**Goal:** Single public API entry point, internal-only microservice ports, minimal manual server/nginx edits.

---

## 1. Current state (as of 2026-06)

### No API Gateway today

| Layer | Behavior |
|-------|----------|
| **Frontend container nginx** | Serves SPA only (`frontend/nginx.conf`). No `/api` proxy. |
| **Browser** | Calls each service via separate env URLs (`VITE_AUTH_API_URL` → `:8081`, challenges → `:8082`, submissions → `:8083`, leaderboard → `:8087`, notifications → `:8090`, metrics → `:8089`). |
| **Docker Compose** | Publishes Java service ports to the host (`AUTH_HOST_PORT`, etc.). |
| **Seed challenge** | “API Gateway Pattern” is product content only — not infra. |

### Protection already implemented (do NOT remove)

Keep **per-service** rate limiting; gateway adds an **edge** layer, not a replacement.

| Service | Mechanism |
|---------|-----------|
| **auth-service** | Redis: public endpoints per IP (login, register, refresh, forgot/reset, verify, public profiles, etc.); authenticated per user (friend requests, usage heartbeat). |
| **submission-service** | Redis: `POST /api/submissions` per IP + per user (staff bypass). |
| **metrics-service** | In-memory: docs feedback ~10/min per IP. |
| **Fail-open** | If Redis is down, auth/submission rate limiters **allow** traffic (logged). Document if gateway fail mode differs. |

Other: internal `X-Internal-Token` for S2S, Prometheus/Alertmanager on 5xx/heap, DinD sandbox isolation.

---

## 2. Target architecture

```
Browser ──► https://domain (host nginx/Caddy, optional TLS)
              │
              ▼
         frontend:80  (nginx: SPA + /api/* proxy)
              │
              ├── /api/auth/*         ──► auth-service:8081
              ├── /api/challenges/*   ──► challenge-service:8082
              ├── /api/categories/*   ──► challenge-service:8082
              ├── /api/submissions/*  ──► submission-service:8083
              ├── /api/leaderboard/*  ──► leaderboard-service:8087
              ├── /api/notifications/*──► notification-service:8090
              ├── /api/metrics/*      ──► metrics-service:8089
              └── /ws/notifications   ──► notification-service:8090 (WebSocket upgrade)
```

**Principles**

1. **One origin** for the browser (`/api` relative paths in production).
2. **Microservices not exposed** on host ports in prod (Docker internal network only).
3. **Host nginx** (if any) keeps proxying only to **frontend :3000** — no manual per-service rules.
4. **Existing service rate limits** remain.

---

## 3. Phased delivery

### Phase 1 — Edge proxy in Docker (P0, ~2–4 days)

**Implementer tasks**

1. **Extend `frontend/nginx.conf`** (preferred over new container — fewer moving parts):
   - `location /api/auth/` → `http://apiarena-auth:8081/api/auth/`
   - Same pattern for challenges, categories, submissions, leaderboard, notifications, metrics.
   - WebSocket: `location /ws/notifications` → notification-service with `Upgrade` / `Connection` headers.
   - Increase `client_max_body_size` for ZIP uploads (e.g. 50m) on submission routes.
   - Timeouts: `proxy_read_timeout` ≥ 120s for submissions.

2. **`docker-compose.yml`**
   - Add `depends_on` frontend → auth, challenge, submission, leaderboard, notification, metrics (started).
   - **Remove or comment** host `ports:` for Java services behind the proxy (keep for local dev behind a flag if needed, e.g. `EXPOSE_MICROSERVICE_PORTS=true`).
   - Frontend build args: replace multiple `VITE_*_API_URL` with single `VITE_API_BASE_URL=` (empty string = same origin).

3. **Frontend `src/lib/*Api.js`**
   - Introduce shared `getApiBaseUrl()` (e.g. `frontend/src/lib/apiBase.js`):
     - Prod: `''` or `import.meta.env.VITE_API_BASE_URL ?? ''`
     - Dev (Vite): optional proxy in `vite.config.js` to localhost services OR keep env override.
   - Refactor: `authApi`, `challengesApi`, `submissionsApi`, `leaderboardApi`, `notificationsApi`, `notificationsWs`, `groupsApi`, `friendsApi`, `docsMetricsApi`.
   - WebSocket URL: derive from `window.location` when base is relative.

4. **CORS**
   - With same-origin `/api`, browser CORS to microservices becomes unnecessary for the SPA.
   - Keep `CORS_ALLOWED_ORIGINS` on services for direct dev access if ports still exposed locally.

5. **`.env.example` + `frontend/.env.example`**
   - Document `VITE_API_BASE_URL=` for Docker/prod.
   - Document optional dev overrides.

6. **Scripts / CI**
   - Update `scripts/e2e-smoke.sh` to use `GATEWAY_URL` or single `API_BASE=http://localhost:3000` for all paths.
   - Update `.github/workflows/e2e-smoke.yml` if env vars change.

7. **Deploy note** (`docs/` or README snippet)
   - Maintainer runs: `git pull && docker compose up -d --build`
   - Firewall: close 8081–8090 externally; only 80/443 (+ SSH).
   - Host nginx: **no change** if already proxying only to `:3000`.

**Acceptance criteria**

- [ ] `http://localhost:3000` loads SPA.
- [ ] Login, challenges list, submit ZIP, leaderboard, notifications WS work through `:3000/api/...` only.
- [ ] `curl http://localhost:8081/...` fails from outside when ports unpublished.
- [ ] `e2e-smoke.sh` passes.

---

### Phase 2 — Gateway hardening (P1, ~2–3 days)

1. **Global rate limit at nginx** (optional `limit_req_zone` per IP on `/api/`) — complements Redis limits.
2. **Security headers** on API responses (if not already from services).
3. **`/api/health` or `/api/gateway/health`** aggregating upstream actuator health (nginx `health_check` or small script).
4. **Structured 502/504** JSON body for frontend error UX.

---

### Phase 3 — Progressive degradation (P2, ~1 week, optional)

Not required for Phase 1 merge.

1. Circuit breaker when submission/sandbox unhealthy → `503` + `Retry-After` on `POST /api/submissions` only; catalog/leaderboard stay up.
2. Priority tiers: P0 auth+challenges, P1 submissions, P2 notifications WS, P3 metrics/replay.
3. Consider Traefik/Kong **only if** nginx-only proves insufficient (Java stack alternative: Spring Cloud Gateway).

---

## 4. Files to touch (checklist)

| Area | Paths |
|------|--------|
| Proxy | `frontend/nginx.conf` |
| Compose | `docker-compose.yml`, `frontend/Dockerfile` |
| Frontend API clients | `frontend/src/lib/authApi.js`, `challengesApi.js`, `submissionsApi.js`, `leaderboardApi.js`, `notificationsApi.js`, `notificationsWs.js`, `groupsApi.js`, `friendsApi.js`, `docsMetricsApi.js` |
| Vite dev | `frontend/vite.config.js` (proxy table) |
| Env | `.env.example`, `frontend/.env.example` |
| CI | `scripts/e2e-smoke.sh`, `.github/workflows/e2e-smoke.yml` |
| Docs | `.cursor/rules/api-arena-project-progress.mdc` (infra + frontend routes if needed) |
| i18n | Update `serviceHint` in challenges.json if URLs change |

**Do not**

- Remove Redis rate limit filters in auth/submission.
- Expose internal tokens or actuator publicly through the gateway.
- Commit duplicate `* 2.*` files (macOS duplicates — delete if present).

---

## 5. Server / maintainer manual steps (minimal)

| Step | Who | Action |
|------|-----|--------|
| Deploy | Maintainer | `git pull && docker compose up -d --build` |
| Firewall | Maintainer | Block inbound 8081–8090 (ufw/security group) |
| Host nginx | Maintainer **only if** current config proxies to 8081, 8082, … | Replace with single proxy to `:3000`; snippet in Phase 1 deploy note |
| TLS/DNS | Maintainer | No change if already working |

**Ideal:** maintainer never edits nginx — only Docker + firewall.

---

## 6. Local development modes

**Option A (recommended):** Vite dev server proxies `/api` → docker services (ports still on host in dev compose).

**Option B:** `VITE_API_BASE_URL=http://localhost:8081` etc. — keep backward compat during migration.

---

## 7. Related recent work (context)

- Branch `feature/challenge-newsletter`: catalog footer opt-in for `new_challenge_email_alerts`; emails + `NEW_CHALLENGE_PUBLISHED` in-app notifications on challenge publish (`challenge-service` → auth → notification-service).
- Duplicate `* 2.java` / `* 2.jsx` files were removed from backend builds — do not reintroduce.
- Brand: nav/chrome English; i18n for page content; tokens in `challenges.css` / `landing.css`.
- Commits: English, conventional, **no AI/Cursor trailers**.

---

## 8. Suggested branch & PR

```bash
git checkout main && git pull
git checkout -b feature/api-gateway-edge-proxy
```

PR title: `feat(infra): add nginx edge proxy and unified /api base URL`

Test plan:

1. Full docker stack up.
2. `scripts/e2e-smoke.sh` with `API_BASE=http://localhost:3000`.
3. Manual: login, `/challenges`, submit, `/notifications` WS bell, teacher publish → newsletter email (if Resend configured).

---

## 9. Open questions for maintainer (defaults if unanswered)

1. **Prod host:** Only Docker on `:3000`? → Default: yes, zero host nginx edits.
2. **Dev:** Keep exposing microservice ports locally? → Default: yes, behind `EXPOSE_MICROSERVICE_PORTS` or dev compose profile.
3. **Phase 3:** In scope for first PR? → Default: no, Phase 1 only.

---

*Generated for delegation. Update this doc when Phase 1 ships.*
