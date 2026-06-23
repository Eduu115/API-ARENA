# API Gateway — Phase 2 Implementation Plan (API Arena)

**Audience:** Claude Code (or any implementer) delegating from the maintainer.  
**Coordination:** Cursor agent has context on gateway Phase 1, newsletter, i18n. Ping Cursor when touching overlapping infra.  
**Prerequisite:** Phase 1 **done** — see commit `db343ec` (`feat(infra): add nginx edge proxy and unified /api base URL`) on branch `feature/api-gateway-edge-proxy`.  
**Goal:** Harden the **in-Docker** nginx edge (rate limit global, security headers, aggregated health, JSON errors). **No host NPM/Cloudflare edits** required if Phase 1 deploy is already correct.

**Parent doc:** `docs/API-GATEWAY-IMPLEMENTATION-PLAN.md` (Phases 1–3 overview). This file is **Phase 2 only**.

---

## 1. Current state (post–Phase 1)

### Edge proxy (implemented)

| Layer | Behavior |
|-------|----------|
| **Frontend container nginx** | SPA + edge proxy `/api/*` and `/ws/notifications` to internal Docker DNS names (`apiarena-auth:8081`, etc.). |
| **Browser / SPA** | Single origin via `frontend/src/lib/apiBase.js` — `VITE_API_BASE_URL` empty ⇒ relative `/api/...`. |
| **Dev** | `frontend/vite.config.js` mirrors the same path prefixes to `localhost:808x`. |
| **Docker Compose** | Java services on loopback by default (`MICROSERVICE_BIND_IP=127.0.0.1`); prod override `docker-compose.prod.yml` removes public `ports:`. |
| **Host (NPM + Cloudflare)** | Single proxy host → `apiarena-frontend:80`. Doc: `docs/DEPLOY-CLOUDFLARE-NPM.md`. |
| **Liveness** | `GET /health` on frontend nginx returns plain `healthy` (gateway container only, not backends). |

### Key files (Phase 1 — do not break)

| File | Role |
|------|------|
| `frontend/nginx.conf` | Route table, `client_max_body_size 50m`, submission timeouts, WS upgrade |
| `frontend/api_proxy.conf` | `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` (required for Redis rate limiters) |
| `frontend/Dockerfile` | Copies `nginx.conf` + `api_proxy.conf`; build arg `VITE_API_BASE_URL` |
| `frontend/src/lib/apiBase.js` | `getApiBaseUrl()` |
| `scripts/e2e-smoke.sh` | `API_BASE=http://localhost:3000` default |
| `.env.example` | `VITE_API_BASE_URL=`, `MICROSERVICE_BIND_IP` |

### Nginx techniques already in use

- **Dynamic upstream:** `resolver 127.0.0.11` + `set $u http://apiarena-*` + `proxy_pass $u$request_uri` so nginx boots even if an upstream is briefly down.
- **No URI rewrite:** full `$request_uri` forwarded; backends keep `/api/...` paths.

### Protection already implemented (do NOT remove or weaken)

| Layer | Mechanism |
|-------|-----------|
| **auth-service** | Redis rate limits (public per IP, authenticated per user). Keys on `X-Forwarded-For` / client IP — **must keep working through proxy**. |
| **submission-service** | Redis burst on `POST /api/submissions` (IP + user). |
| **metrics-service** | In-process limit on docs feedback. |
| **Fail-open (Redis)** | If Redis down, auth/submission limiters allow traffic (logged). |

Phase 2 nginx rate limit is **additive** (edge burst / abuse), not a replacement.

### Actuator health (internal, per service)

Each Java service exposes (security permits unauthenticated health where configured):

| Service | Container | Health URL (internal) |
|---------|-----------|------------------------|
| auth | `apiarena-auth` | `http://apiarena-auth:8081/actuator/health` |
| challenge | `apiarena-challenge` | `http://apiarena-challenge:8082/actuator/health` |
| submission | `apiarena-submission` | `http://apiarena-submission:8083/actuator/health` |
| leaderboard | `apiarena-leaderboard` | `http://apiarena-leaderboard:8087/actuator/health` |
| notification | `apiarena-notification` | `http://apiarena-notification:8090/actuator/health` |
| metrics | `apiarena-metrics` | `http://apiarena-metrics:8089/actuator/health` |
| sandbox | `apiarena-sandbox` | `http://apiarena-sandbox:8084/actuator/health` |
| testing | `apiarena-testing` | `http://apiarena-testing:8085/actuator/health` |
| ai-review | `apiarena-ai-review` | `http://apiarena-ai-review:8086/actuator/health` |

**Do not** expose `/actuator/prometheus` or other actuator endpoints through the public `/api` proxy.

---

## 2. Target architecture (Phase 2 additions)

```
Browser ──► NPM / Cloudflare ──► frontend:80
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              GET /health    GET /api/gateway/health  /api/* (rate limited)
              (liveness)     (aggregated JSON)       + security headers
                    │               │               + 502/504 JSON
                    │               │               │
                    └───────────────┴───────────────┘
                                    │
                         internal microservices
```

**Principles**

1. All Phase 2 changes live in **`frontend/` Docker image** (nginx + optional small shell health poller).
2. **Maintainer does not edit host NPM** for Phase 2.
3. Edge rate limit uses **real client IP** (`$binary_remote_addr` or `$http_x_forwarded_for` first hop — see §4.1; prefer `$binary_remote_addr` when NPM is trusted and not double-proxying without `real_ip` module).
4. Aggregated health is **read-only**, no auth required, **no sensitive data** in JSON.

---

## 3. Phase 2 scope (implement now)

Estimated **2–3 days**. **Out of scope:** Phase 3 circuit breaker / progressive degradation.

### 3.1 Global rate limit at nginx edge

**Purpose:** Absorb abusive traffic before it hits JVM services; complements Redis per-route limits.

**Implementer tasks**

1. Add `limit_req_zone` in **`http` context** (not inside `server` only):
   - Option A: Custom `frontend/nginx.main.conf` copied to `/etc/nginx/nginx.conf` in Dockerfile (include `conf.d/default.conf`).
   - Option B: Snippet `frontend/nginx-limits.conf` included from a patched main config.

2. Suggested starting limits (tune via env if desired):

   ```nginx
   # Example — adjust after smoke/load test
   limit_req_zone $binary_remote_addr zone=api_edge:10m rate=40r/s;
   ```

3. Apply `limit_req` to **all `/api/` locations**:
   - Easiest: add `limit_req zone=api_edge burst=80 nodelay;` inside `api_proxy.conf` (included by every API `location`).
   - **Exclude** `/api/gateway/health` and static assets from limit (separate `location =` without include, or `limit_req off` on health).

4. On 429, return JSON consistent with §3.4:

   ```nginx
   limit_req_status 429;
   ```

5. **WebSocket** `/ws/notifications`: do **not** apply `limit_req` (or use a very high burst); document decision.

6. **Cloudflare / NPM behind proxy:** If the maintainer uses Cloudflare “orange cloud”, client IP may be NPM’s IP unless `real_ip` is configured. For Phase 2 default: rate limit on `$binary_remote_addr` (good enough for direct abuse on origin). Optional follow-up: `set_real_ip_from` for NPM subnet — document in deploy note, do not block Phase 2 on it.

7. Document new optional env vars in `.env.example`:

   ```env
   # Edge rate limit (nginx); 0 or unset = use defaults baked in nginx config
   # GATEWAY_RATE_LIMIT_RPS=40
   ```

   If env-driven limits are too heavy for nginx templating, hardcode sensible defaults and document in this file.

**Acceptance**

- [ ] Burst of `curl` loops to `/api/challenges/categories` returns **429** with JSON body after threshold.
- [ ] Normal SPA usage (login, catalog, submit) unaffected.
- [ ] auth/submission Redis limits still trigger independently on login/submit endpoints.

---

### 3.2 Security headers on API responses

**Purpose:** Consistent headers on proxied `/api/*` responses (and optionally WS handshake).

**Implementer tasks**

1. Extend `frontend/api_proxy.conf` with `add_header ... always` for API routes:

   | Header | Suggested value |
   |--------|-----------------|
   | `X-Content-Type-Options` | `nosniff` |
   | `Referrer-Policy` | `strict-origin-when-cross-origin` |
   | `X-Frame-Options` | `DENY` (API JSON) or `SAMEORIGIN` |
   | `Permissions-Policy` | minimal (e.g. disable geolocation/mic for API) |

2. **Do not** add broad `Content-Security-Policy` on `/api/*` (breaks nothing critical but unnecessary for JSON APIs).

3. SPA static routes (`location /`, assets) already have some headers in `nginx.conf` — keep consistent, avoid duplicate conflicting values.

4. Do **not** add `Access-Control-Allow-Origin: *` on API — same-origin SPA does not need CORS on prod.

**Acceptance**

- [ ] `curl -I http://localhost:3000/api/challenges/categories` shows new headers.
- [ ] Login + submit still work in browser.

---

### 3.3 Aggregated gateway health — `GET /api/gateway/health`

**Purpose:** One JSON endpoint for ops/monitoring: gateway + critical backends status.

**Implementer tasks**

1. Add public route:

   ```
   GET /api/gateway/health
   Content-Type: application/json
   ```

2. **Recommended implementation (nginx:alpine, no new microservice):**

   - Add `frontend/gateway-health/poll-health.sh`:
     - Curls internal actuator URLs (table in §1) with short timeout (2s).
     - Writes `/var/cache/gateway-health.json` atomically (`tmp` + `mv`).
     - JSON shape example:

       ```json
       {
         "gateway": "up",
         "checkedAt": "2026-06-12T12:00:00Z",
         "services": {
           "auth": { "status": "up", "http": 200 },
           "challenge": { "status": "up", "http": 200 },
           "submission": { "status": "degraded", "http": 503 }
         },
         "overall": "degraded"
       }
       ```

     - `overall`: `up` if all **critical** P0 services up (`auth`, `challenge`, `submission`, `leaderboard`, `notification`); `degraded` if any P0 down; optional include sandbox/testing/ai-review/metrics as non-critical flags.

   - Add `frontend/gateway-health/docker-entrypoint.d/99-health-poller.sh` or extend Dockerfile `CMD` wrapper to:
     - Run poller once at start.
     - Loop every **15s** in background (`while sleep 15; do poll-health.sh; done &`).

   - Nginx:

     ```nginx
     location = /api/gateway/health {
         access_log off;
         default_type application/json;
         alias /var/cache/gateway-health.json;
         add_header Cache-Control "no-store";
     }
     ```

   - Create/cache dir in Dockerfile: `RUN mkdir -p /var/cache && chown nginx:nginx /var/cache`

3. Keep existing `GET /health` as **container liveness** (plain text, fast, no backend deps).

4. **Do not** proxy `/actuator/*` publicly.

5. Optional: add check in `scripts/e2e-smoke.sh`:

   ```bash
   curl -fsS "$API_BASE/api/gateway/health" | jq -e '.overall == "up"'
   ```

6. Update `docs/DEPLOY-CLOUDFLARE-NPM.md` one line: external monitor can hit `https://apiarena.net/api/gateway/health`.

**Acceptance**

- [ ] `curl http://localhost:3000/api/gateway/health` returns JSON with `overall`.
- [ ] Stopping `apiarena-challenge` container → within ~15s health shows `challenge` down and `overall` degraded.
- [ ] `/health` still returns 200 when nginx is up even if all backends down.

---

### 3.4 Structured 502 / 504 / 429 JSON for API routes

**Purpose:** Frontend and API clients get parseable errors when upstream is down or edge limit hits.

**Implementer tasks**

1. In `frontend/nginx.conf` `server` block:

   ```nginx
   proxy_intercept_errors on;
   error_page 502 503 504 = @api_upstream_error;
   ```

   Apply `proxy_intercept_errors on` only on `/api/` locations (not on SPA static files).

2. Named location `@api_upstream_error`:

   ```nginx
   location @api_upstream_error {
       internal;
       default_type application/json;
       return 502 '{"error":"upstream_unavailable","status":502,"message":"Service temporarily unavailable. Retry shortly."}';
   }
   ```

   Map 504 to same or distinct `error` code; 429 from `limit_req` needs `error_page 429 = @api_rate_limit`.

3. Keep messages **generic** (no stack traces, no internal hostnames).

4. Optional frontend follow-up (separate small PR or same): in `authApi.js` / fetch wrapper, if `response.status === 502` and JSON `error === 'upstream_unavailable'`, show user-friendly toast — **optional**, not blocking Phase 2.

**Acceptance**

- [ ] With challenge container stopped, `curl -i http://localhost:3000/api/challenges/categories` returns **502** + `application/json` body.
- [ ] Rate limit trigger returns **429** + JSON.

---

## 4. Files to touch (checklist)

| Area | Paths |
|------|--------|
| Nginx main (zones) | New `frontend/nginx.main.conf` or patch Dockerfile to install `limit_req_zone` in `http` |
| Nginx server | `frontend/nginx.conf` |
| Proxy headers + limit + intercept | `frontend/api_proxy.conf` |
| Health poller | `frontend/gateway-health/poll-health.sh`, entrypoint script |
| Docker image | `frontend/Dockerfile` (main nginx conf, cache dir, entrypoint) |
| Env docs | `.env.example`, `frontend/.env.example` (optional rate limit notes) |
| Deploy | `docs/DEPLOY-CLOUDFLARE-NPM.md` (health URL for monitors) |
| CI / smoke | `scripts/e2e-smoke.sh` (optional gateway health assert) |
| Progress | `.cursor/rules/api-arena-project-progress.mdc` (Infra: Phase 2 gateway hardening) |
| Parent plan | `docs/API-GATEWAY-IMPLEMENTATION-PLAN.md` — mark Phase 2 done when merged |

**Do not**

- Remove Redis rate limit filters in auth/submission.
- Expose `/actuator/prometheus` or internal tokens via `/api`.
- Add Kong/Traefik/Spring Cloud Gateway (stay nginx in frontend container).
- Commit macOS duplicate files `**/* 2.*` (gitignored).
- Break `X-Forwarded-For` forwarding (rate limiters depend on it).

---

## 5. Server / maintainer manual steps

| Step | Who | Action |
|------|-----|--------|
| Deploy | Maintainer | `git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend` |
| NPM / Cloudflare | Maintainer | **No change** if already single host → `apiarena-frontend:80` |
| Firewall | Maintainer | **No change** (8081–8090 still closed) |
| External monitoring | Maintainer (optional) | Point uptime check to `https://<domain>/api/gateway/health` expect `overall: up` |
| TLS/DNS | Maintainer | No change |

**Ideal:** maintainer only runs Docker rebuild; zero host nginx edits.

---

## 6. Local development

- **Vite dev server** does not run nginx Phase 2 features (no edge rate limit, no aggregated health) unless you duplicate logic in `vite.config.js` — **not required**. Document that edge hardening applies to **Docker/prod** only.
- Developers can test Phase 2 via `docker compose up -d --build frontend` + curl to `:3000`.

---

## 7. Related context (other recent work)

| Topic | Branch / notes |
|-------|----------------|
| API Gateway Phase 1 | `feature/api-gateway-edge-proxy`, commit `db343ec` |
| Challenge newsletter | `feature/challenge-newsletter` — `new_challenge_email_alerts`, footer opt-in, `NEW_CHALLENGE_PUBLISHED` notifications |
| i18n | `/en/`, `/es/`, `LocaleLink`, nav chrome English |
| Duplicate file cleanup | `**/* 2.*` removed + gitignored |
| Commits | English, conventional (`feat:`, `fix:`, `chore:`), **no AI/Cursor trailers** |
| Docker rebuild rule | After frontend/nginx changes: `docker compose up -d --build frontend` |

---

## 8. Suggested branch & PR

```bash
git checkout feature/api-gateway-edge-proxy
git pull
# or from main after Phase 1 merge:
# git checkout main && git pull && git checkout -b feature/api-gateway-phase-2
```

**PR title:** `feat(infra): harden nginx API edge (rate limit, health, JSON errors)`

**PR body test plan**

1. `docker compose up -d --build` (full stack).
2. `curl -s http://localhost:3000/api/gateway/health | jq .`
3. `curl -I http://localhost:3000/api/challenges/categories` — security headers.
4. `scripts/e2e-smoke.sh` with `API_BASE=http://localhost:3000`.
5. Stop one backend → degraded health + 502 JSON on its routes.
6. Verify login still rate-limited by auth-service after many failed attempts (Redis, not only nginx).

---

## 9. Phase 3 reminder (do NOT implement in this PR)

From parent plan — **future work only**:

1. Circuit breaker: submission pipeline unhealthy → `503` + `Retry-After` on submit only.
2. Priority tiers P0–P3 load shedding.
3. Traefik/Kong only if nginx insufficient.

---

## 10. Open questions (defaults if unanswered)

| Question | Default |
|----------|---------|
| Rate limit RPS at edge? | **40 r/s** burst **80** per IP |
| Include sandbox/testing/ai-review in aggregated health? | **Yes**, as non-critical fields |
| Env-tunable limits in Phase 2? | **Optional** — hardcoded OK if templating is heavy |
| Frontend UX for 502 JSON? | **Optional** — backend/nginx only is enough for Phase 2 |
| Merge Phase 1 branch first? | Implement Phase 2 on top of `feature/api-gateway-edge-proxy` |

---

## 11. Prompt snippet for Claude Code

Copy-paste:

> Read `docs/API-GATEWAY-PHASE-2-PLAN.md` and implement **all of Phase 2** on branch `feature/api-gateway-edge-proxy` (or `feature/api-gateway-phase-2` from main after Phase 1 merge). Harden the **frontend nginx** container only: global `limit_req`, security headers on `/api/*`, `GET /api/gateway/health` JSON aggregator via shell poller, structured 502/504/429 JSON. Do **not** remove Redis rate limits in auth/submission. Do **not** expose actuator/prometheus publicly. Do **not** implement Phase 3 circuit breaker. Update `docs/DEPLOY-CLOUDFLARE-NPM.md` and `.cursor/rules/api-arena-project-progress.mdc`. Run `docker compose up -d --build frontend` and verify curls in the test plan. Commits in English, no AI trailers.

---

*Generated for delegation. Update when Phase 2 ships.*
