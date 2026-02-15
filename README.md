# APIArena

Plataforma competitiva de desarrollo de APIs donde estudiantes compiten creando APIs que son evaluadas automáticamente.

## Quick Start

### Prerrequisitos
- Docker & Docker Compose
- Java 21
- Node.js 20+
- Maven

### Levantar infraestructura
```bash
# Clonar repositorio
git clone https://github.com/Eduu115/API-ARENA.git
cd API-ARENA

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores (OPCIONAL)

# ABRIR DOCKER DESKTOP (y dejalo corriendo, minimizado o como quieras) - IMPORTANTE

# Levantar infraestructura de datos + backend
docker-compose up -d postgres redis auth-service challenge-service

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
# App en http://localhost:5173 — auth API en http://localhost:8081

# Comprobar contenedores
docker ps
```

### Desarrollo local [ - SOLO PARA DESARROLLO - ]

**Opción A – Todo en Docker**  
Desde la raíz: `docker compose up -d` (levanta postgres, redis, auth-service, challenge-service y el resto de servicios definidos en `docker-compose.yml`).

**Opción B – Backend en local, bases de datos en Docker**  
1. Levantar solo Postgres y Redis:
```bash
docker compose up -d postgres redis
```
2. Ejecutar los servicios Java con Maven (en terminales separadas si quieres ambos):
```bash
cd backend/auth-service
mvn spring-boot:run -DskipTests
# auth-service en http://localhost:8081
```
```bash
cd backend/challenge-service
mvn spring-boot:run -DskipTests
# challenge-service en http://localhost:8082
```
Si aparece *"Connection to localhost:5432 refused"*, Postgres no está arriba: ejecuta antes `docker compose up -d postgres redis`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Configura `VITE_AUTH_API_URL=http://localhost:8081` en `.env` (o usa el `.env.example` como referencia).

## Estructura del proyecto
```
API-ARENA/
├── frontend/              # React 19 + Vite
├── backend/
│   ├── auth-service/      # Auth, JWT, usuarios (puerto 8081)
│   ├── challenge-service/ # Retos (puerto 8082)
│   └── ...
├── docker/
│   └── postgres/          # init scripts
├── docker-compose.yml     # Un solo compose en la raíz
└── docs/
```

## Stack

- **Backend**: Java 21, Spring Boot 3.5
- **Frontend**: React 19, Vite
- **Bases de datos**: PostgreSQL, Redis, MongoDB, InfluxDB
- **Message Broker**: Kafka
- **Infraestructura**: Docker (compose en raíz)

## Documentación

Ver carpeta `docs/` para documentación detallada.

## Equipo

- Eduardo Serrano Trenado: Backend Lead + DevOps
- Juan Angel Guevara Manzanilla: Frontend + Integration

## Licencia
Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
