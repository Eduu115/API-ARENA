# P1 Hardening Sprint — Implementación ejecutada

Este documento resume lo implementado en el sprint P1 de hardening: **DinD por submission**, **replay timeline estructurado** y **stack de métricas operable**.

## 1) Scope completado

Se completaron las 5 fases del plan:

- **Fase 0:** contratos base, flags y migraciones.
- **Fase 1:** runner DinD por submission + hardening de endpoints internos.
- **Fase 2:** replay real persistido y endpoint consolidado.
- **Fase 3:** `metrics-service` + Prometheus + Grafana.
- **Fase 4:** rebuild, validación técnica y actualización documental.

## 2) Cambios por fase

### Fase 0 — Contratos y baseline

- Nuevos flags:
  - `sandbox.runner.mode=process|dind`
  - `replay.source=logs|structured`
- Nueva tabla de persistencia:
  - `replay_events` en Postgres.
- Nuevos artefactos en `submission-service`:
  - `ReplayEvent` (entidad)
  - `ReplayEventRepository`
  - `ReplayEventDTO`
  - `ReplayTimelineResponse`

### Fase 1 — DinD por submission

- `sandbox-service` soporta dos runners:
  - `process` (fallback)
  - `dind` (contenedor aislado por submission)
- Flujo DinD implementado:
  - build de imagen desde ZIP extraído
  - run dedicado (`apiarena-candidate-{submissionId}`)
  - readiness probe HTTP
  - stop/cleanup de contenedor e imagen
- Seguridad inter-servicios:
  - header `X-Internal-Token` en endpoints internos de sandbox/testing
  - envío del token desde `submission-service`

### Fase 2 — Replay completo

- Persistencia estructurada de eventos del pipeline en `replay_events`.
- Endpoint nuevo:
  - `GET /api/submissions/{id}/replay`
- Emisión de eventos reales en el pipeline (ejemplos):
  - `SUBMISSION_CREATED`
  - `BUILD_STARTED`, `BUILD_FAILED`
  - `CONTAINER_READY`
  - `TESTING_STARTED`, `TEST_CASE_RESULT`
  - `SCORE_FINALIZED`
  - `SANDBOX_STOP_REQUESTED`, `SANDBOX_STOP_FAILED`
- Frontend `/replay` migrado a timeline estructurado:
  - player de eventos
  - filtros por stage
  - progreso/reproducción sobre eventos reales

### Fase 3 — Métricas y dashboards

- Nuevo microservicio: **`metrics-service`** (`8089`):
  - `GET /api/metrics/overview`
  - `GET /api/metrics/submissions/daily`
  - `/actuator/prometheus`
- Docker Compose ampliado con:
  - `prometheus` (`9090`)
  - `grafana` (`3001`)
- Provisioning inicial:
  - datasource Prometheus en Grafana
  - dashboard base operativo
- Servicios Java preparados para scrape:
  - dependencia `micrometer-registry-prometheus`
  - exposición de endpoint prometheus
  - ajuste de `SecurityConfig` para permitir `/actuator/prometheus`

### Fase 4 — Rollout técnico y validación

- Rebuild completo ejecutado:
  - `docker compose up -d --build`
- Estado final validado:
  - stack levantado
  - servicios en estado healthy
- Documentación de progreso y overview actualizadas.

## 3) Archivos clave tocados

- `docker-compose.yml`
- `docker/postgres/init-db.sql`
- `backend/sandbox-service/src/main/java/.../SandboxService.java`
- `backend/submission-service/src/main/java/.../SubmissionService.java`
- `backend/submission-service/src/main/java/.../SubmissionController.java`
- `frontend/src/pages/Replay.jsx`
- `backend/metrics-service/**`
- `docker/prometheus/prometheus.yml`
- `docker/grafana/**`

## 4) Runbook rápido

### Levantar stack

```bash
docker compose up -d --build
docker compose ps
```

### Comprobar métricas

```bash
curl -fsS http://localhost:8089/api/metrics/overview
curl -fsS http://localhost:9090/-/healthy
curl -fsS http://localhost:8083/actuator/prometheus | head -n 1
```

### Comprobar replay estructurado (requiere JWT válido)

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8083/api/submissions/<ID>/replay
```

### Rollback sandbox a runner clásico

Configurar variable de entorno y recrear `sandbox-service`:

```bash
SANDBOX_RUNNER_MODE=process docker compose up -d --build sandbox-service submission-service
```

## 5) Riesgos abiertos (post-P1)

- Endurecer DinD para producción estricta:
  - policies adicionales de aislamiento, límites finos y estrategia de colas.
- Replay:
  - retención TTL y compresión de payloads grandes.
- Observabilidad:
  - dashboards de negocio más detallados (beyond baseline).
