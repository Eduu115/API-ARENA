# Estado actual del proyecto API-ARENA

Documento de seguimiento para trackear el progreso. Última actualización: febrero 2026.

---

## 1. Visión general

**API-ARENA** es una plataforma competitiva donde los usuarios desarrollan APIs que son evaluadas automáticamente. Arquitectura de microservicios (backend) + monolito frontend (React).

- **Stack backend:** Java 21, Spring Boot 3.5.x, JPA/Hibernate, PostgreSQL, JWT, Redis (auth-service).
- **Stack frontend:** React 19, Vite 7.
- **Infraestructura:** Docker Compose (Postgres, Redis, MongoDB, Kafka, InfluxDB, Zookeeper).

---

## 2. Backend – Servicios implementados

### 2.1 Auth Service (puerto 8081)

**Estado:** Implementado y funcional (requiere Postgres y Redis en marcha).

| Componente | Descripción |
|------------|-------------|
| **Entidades** | `User` (id, username, email, passwordHash, role, avatar, bio, github, rating, level, XP, lastLogin, etc.), `RefreshToken` |
| **Repositorios** | `UserRepository`, `RefreshTokenRepository` (JPA) |
| **Servicios** | `AuthService`, `UserService`, `JwtService`, `RefreshTokenService` |
| **Seguridad** | Spring Security, JWT (access + refresh), BCrypt, `JwtAuthenticationFilter`, CORS configurado |
| **Excepciones** | `GlobalExceptionHandler`, `BadRequestException`, `ResourceNotFoundException`, `UnauthorizedException`, `ErrorResponse` |

**Endpoints (base: `/api/auth`):**

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Registrar usuario. **No devuelve tokens**; el usuario debe hacer login después. | Público |
| POST | `/login` | Login; devuelve user + accessToken + refreshToken | Público |
| POST | `/refresh` | Renovar access token con refresh token | Público |
| POST | `/logout` | Revocar refresh token | Público |
| GET | `/me` | Perfil del usuario autenticado | JWT |
| PUT | `/me` | Actualizar perfil (avatar, bio, github) | JWT |

**Configuración relevante:** `application.properties` (Postgres, Redis, JWT secret/expiration, Swagger). Swagger UI: `http://localhost:8081/swagger-ui/index.html`.

**Notas:** Registro no genera JWT; tokens solo en login. Dependencias null en servicios/repositorios corregidas (uso de `orElseThrow` en lugar de `orElse(null)`).

---

### 2.2 Challenge Service (puerto 8082)

**Estado:** Implementado y funcional (requiere Postgres en marcha).

| Componente | Descripción |
|------------|-------------|
| **Entidad** | `Challenge` (id, title, slug, description, difficulty, category, maxScore, timeLimitMinutes, JSONB: requiredEndpoints, requiredStatusCodes, requiredHeaders, testSuite, performanceRequirements, designCriteria, hints, solutionExplanation, learningObjectives, createdBy, createdAt, updatedAt, isActive, featured, timesAttempted, timesCompleted, averageScore). Enum `Difficulty`: EASY, MEDIUM, HARD, EXPERT. |
| **Repositorio** | `ChallengeRepository` (JPA): findBySlug, existsBySlug, findByFeaturedTrue, findByIsActiveTrue, findByDifficultyAndIsActiveTrue, findByCategoryAndIsActiveTrue, findByDifficultyAndCategoryAndIsActiveTrue, searchChallenges, findAllCategories. Todo con `List<>` (sin paginación). |
| **Servicio** | `ChallengeService`: create, getById, getBySlug, getAllChallenges, getChallengesByFilters (difficulty, category, search), getFeaturedChallenges, getAllCategories, update, delete (soft delete) |
| **Seguridad** | Spring Security, JWT validado (mismo secret que auth-service), `JwtAuthenticationFilter`, `JwtService` local. Endpoints públicos para listar/ver; POST/PUT/DELETE con `@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")` |
| **Excepciones** | Misma estructura que auth-service (GlobalExceptionHandler, BadRequest, ResourceNotFound, Unauthorized) |

**Endpoints (base: `/api/challenges`):**

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Listar challenges (query: difficulty, category, search) | Público |
| GET | `/{id}` | Challenge por ID | Público |
| GET | `/slug/{slug}` | Challenge por slug | Público |
| GET | `/featured` | Challenges destacados | Público |
| GET | `/categories` | Lista de categorías | Público |
| POST | `/` | Crear challenge | TEACHER/ADMIN + JWT |
| PUT | `/{id}` | Actualizar challenge | TEACHER/ADMIN + JWT |
| DELETE | `/{id}` | Soft delete (isActive=false) | TEACHER/ADMIN + JWT |

**Configuración:** `application.properties` (Postgres, JWT secret, Swagger, Actuator). Swagger: `http://localhost:8082/swagger-ui/index.html`. OpenAPI con esquema de seguridad `bearerAuth` (JWT). Validación: `@NotNull` en enum `difficulty` (no `@NotBlank`).

---

## 3. Base de datos (PostgreSQL)

**Script de inicialización:** `docker/postgres/init-db.sql`

- **Tablas:** `users`, `refresh_tokens`, `challenges` (alineadas con entidades JPA).
- **Extensiones:** uuid-ossp, pgcrypto.
- **Índices:** email, username, token, user_id, difficulty, category, featured, slug.

Conexión por defecto en servicios: `localhost:5432`, base `apiarena`, usuario/contraseña vía `application.properties` (ej. apiarena_user / supersecretpassword123). Levantar con: `docker compose up -d postgres redis` (redis para auth-service).

---

## 4. Frontend (React + Vite)

**Estado:** Estructura y rutas definidas; integración con APIs parcial (revisar dependencias y servicios).

**Tecnologías:** React 19, Vite 7. En `package.json` solo aparecen `react` y `react-dom`; las rutas usan `react-router-dom` (comprobar que esté instalado).

**Rutas (`App.jsx`):**

- `/` → redirige a `/dashboard`
- `/login`, `/register` (públicas)
- `/dashboard`, `/challenges`, `/challenges/:id`, `/submissions`, `/submissions/:id`, `/leaderboard`, `/profile`, `/multiplayer`
- `*` → `NotFound`

**Estructura de carpetas:**

- **components:** auth (LoginForm, RegisterForm, ProtectedRoute), challenge (ChallengeCard, ChallengeDetail, ChallengeFilters, ChallengeList, RequirementsPanel), common (Button, Card, Modal, NotificationBell, Spinner), layout (Footer, Layout, Navbar, Sidebar), leaderboard, multiplayer, profile, replay, submission, etc.
- **context:** AuthContext, NotificationContext, WebSocketContext
- **hooks:** useAuth, useChallenges, useLeaderboard, useMultiplayer, useNotifications, useSubmissions, useWebSocket
- **pages:** Dashboard, Challenges, ChallengeDetail, Login, Register, Leaderboard, Profile, MySubmissions, SubmissionDetail, MultiplayerHub, NotFound
- **services:** api.js, authService, challengeService, leaderboardService, metricsService, multiplayerService, submissionService, websocketService
- **utils:** constants, formatters, helpers, validators

Los servicios y hooks están preparados para conectar con auth-service y challenge-service; falta verificar que las URLs base y el manejo de tokens (login sin token en register) estén alineados con el backend.

---

## 5. Infraestructura (Docker Compose)

**Servicios definidos en `docker-compose.yml`:**

- **postgres** (5432) – Usado por auth-service y challenge-service.
- **redis** (6379) – Configurado en auth-service (spring.data.redis.*).
- **mongodb** (27017) – Definido; sin uso explícito en los servicios actuales.
- **influxdb** (8086) – Definido; sin uso explícito.
- **zookeeper** + **kafka** (9092) – Definido; sin uso explícito en auth/challenge.

Variables de entorno: `.env` / `.env.example` (POSTGRES_*, REDIS_*, etc.).

---

## 6. Resumen de lo implementado vs pendiente

| Área | Hecho | Pendiente / Notas |
|------|--------|-------------------|
| Auth-service | Registro, login, refresh, logout, /me GET-PUT, JWT, excepciones, Swagger | Redis debe estar arriba; sin confirmar uso real de Redis en lógica |
| Challenge-service | CRUD challenges, filtros, búsqueda, soft delete, JWT, roles, Swagger/OpenAPI | OpenAPIConfig (bearerAuth) añadido para evitar 500 en /v3/api-docs |
| BD | init-db.sql con users, refresh_tokens, challenges | Migraciones futuras si se cambia esquema |
| Frontend | Rutas, componentes, contextos, hooks, servicios de API | Instalar/react-router-dom y deps; conectar login (sin token en register) y challenges |
| Docker | Postgres, Redis, Mongo, Kafka, Influx, Zookeeper | Solo Postgres (y Redis para auth) necesarios para auth + challenge |

---

## 7. Cómo arrancar (desarrollo)

1. Desde la raíz del proyecto:  
   `docker compose up -d postgres redis`
2. Auth-service:  
   `cd backend/auth-service && ./mvnw spring-boot:run -DskipTests`  
   (puerto 8081)
3. Challenge-service:  
   `cd backend/challenge-service && ./mvnw spring-boot:run -DskipTests`  
   (puerto 8082)
4. Frontend:  
   `cd frontend && npm install && npm run dev`  
   (comprobar que react-router-dom y demás dependencias estén en package.json)

Si aparece *"Connection to localhost:5432 refused"*, Postgres no está corriendo; levantar primero los contenedores.

---

## 8. Convenciones y decisiones técnicas

- **Registro:** No devuelve JWT; el cliente debe llamar a `/login` tras registrarse.
- **Challenges:** Listas sin paginación (`List<>`); slug generado desde título; validación con `@NotNull` en enums.
- **Seguridad:** Mismo JWT secret entre auth-service y challenge-service para validar tokens; CORS para localhost:3000 y 5173.
- **Errores:** GlobalExceptionHandler devuelve JSON con status, message, timestamp.

Este documento puede usarse como referencia para una IA o equipo que haga seguimiento del progreso del proyecto.
