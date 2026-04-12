# Guía de depuración E2E (register -> verify -> submit -> replay -> leaderboard -> notifications)

Este documento explica por qué puede fallar la validación E2E y cómo depurarlo de forma determinística.

## 1) Qué problema vimos

Durante la validación, la infraestructura quedó operativa, pero el smoke E2E autenticado no pasó con cuentas seed porque el login devolvía `401`.

Síntoma observado:

- `POST /api/auth/login` devuelve `401` para usuarios seed esperados.
- Consecuencia: no se puede obtener JWT para probar `/api/submissions/{id}/replay`.

## 2) Causas típicas (confirmadas en entorno local)

- **Datos persistidos desalineados** respecto al schema actual:
  - columnas de `users` ausentes o con `NULL` (`total_development_seconds`, `total_browsing_seconds`).
- **ZIP de submission no válido para Maven en raíz**:
  - error `there is no POM in this directory (/src)`.
- **Red DinD mal configurada**:
  - `docker run` del candidato falla con `network ... not found` si `sandbox.dind.network` no coincide con la red real de Compose.

## 3) Cómo me puedes ayudar (rápido)

Necesito una de estas 3 opciones:

- **Opción A (preferida):** me pasas credenciales válidas actuales de un usuario `STUDENT`.
- **Opción B:** autorizas reset controlado de entorno local de pruebas (`docker compose down -v` + `up -d --build`) para regenerar datos seed.
- **Opción C:** me confirmas que quieres que hagamos el E2E con un usuario nuevo (register + verify), incluyendo cómo manejar verificación de email en local.

## 4) Checklist de depuración

### 4.1 Verifica servicios y salud

```bash
docker compose ps
curl -fsS http://localhost:8081/actuator/health
curl -fsS http://localhost:8083/actuator/health
curl -fsS http://localhost:8084/actuator/health
curl -fsS http://localhost:8085/actuator/health
curl -fsS http://localhost:8090/actuator/health
```

### 4.2 Verifica login real de seed

```bash
curl -i -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arclight@apiarena.dev","password":"Arena2025!"}'
```

Si devuelve `401`, el siguiente paso es inspección de datos.

### 4.3 Inspección de usuarios en Postgres

```bash
docker exec -it apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
"SELECT id, email, username, email_verified, created_at FROM users ORDER BY id LIMIT 20;"
```

Qué mirar:

- que el usuario exista
- que esté verificado (`email_verified=true`) si el login lo exige
- que el entorno use la misma DB esperada

### 4.4 Obtener token y validar replay

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email>","password":"<password>"}' | jq -r '.accessToken')

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8083/api/submissions/my

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8083/api/submissions/<submissionId>/replay
```

### 4.5 Verifica DinD en ejecución

Lanza una submission y revisa:

```bash
docker ps --format '{{.Names}}' | awk '/apiarena-candidate-/{print}'
```

Debe aparecer un contenedor candidato durante la ejecución del pipeline.

### 4.6 Verifica métricas y dashboard

```bash
curl -fsS http://localhost:8089/api/metrics/overview
curl -fsS http://localhost:9090/-/healthy
open http://localhost:3001
```

### 4.7 Verifica red DinD efectiva

```bash
docker network ls | awk '{print $2}' | grep apiarena-network
docker exec apiarena-sandbox printenv | grep SANDBOX_DIND_NETWORK
```

Si no coincide, ajustar `SANDBOX_DIND_NETWORK` en `docker-compose.yml` y recrear `sandbox-service` + `submission-service`.

## 5) Flujo E2E mínimo reproducible

1. Login válido y obtener JWT.
2. Crear submission en challenge existente.
3. Esperar estado `COMPLETED`.
4. Consultar replay estructurado.
5. Verificar leaderboard actualizado.
6. Verificar notificación in-app asociada.

## 6) Si quieres que lo ejecute ya

Respóndeme con uno de estos formatos:

- `usar credenciales: <email> / <password>`
- `autorizo reset local de DB para reseed`
- `haz e2e con usuario nuevo y verificación local`

Con eso te cierro la validación E2E punta a punta en el siguiente paso.
