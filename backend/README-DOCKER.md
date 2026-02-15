# Backend y Docker

El backend (auth-service, challenge-service) está integrado en el **docker-compose de la raíz del proyecto**. No uses un docker-compose dentro de `backend/`.

## Iniciar todo (desde la raíz del proyecto)

```bash
# En la raíz: API-ARENA/
docker compose up -d
```

Se levantan, entre otros, **postgres**, **redis**, **auth-service** (puerto 8081) y **challenge-service** (puerto 8082). Las variables de entorno (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`) se leen del `.env` de la raíz.

## Solo construir/levantar los servicios Java

```bash
docker compose up -d auth-service challenge-service
```

(Postgres y Redis deben estar ya corriendo o se levantarán por dependencia.)

## URLs

- Auth API: http://localhost:8081/swagger-ui.html  
- Challenge API: http://localhost:8082/swagger-ui.html  
