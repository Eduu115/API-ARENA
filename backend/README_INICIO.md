# Guía de Inicio - Backend API-ARENA

## Pre-requisitos

- Docker Desktop instalado
- Docker Compose (incluido en Docker Desktop)

---

## Inicio con Docker Compose

### Opción 1: Levantar todo (Backend + Frontend)

Este comando levanta PostgreSQL, Redis, ambos servicios Spring Boot y el frontend React:

```bash
# Desde la raíz del proyecto (donde está docker-compose.yml)
docker-compose up -d postgres redis auth-service challenge-service frontend
```

El frontend estará disponible en: http://localhost:3000

### Opción 2: Solo backend completo

Este comando levanta PostgreSQL, Redis y ambos servicios Spring Boot:

```bash
docker-compose up -d postgres redis auth-service challenge-service
```

### Opción 3: Solo bases de datos

Si prefieres ejecutar los servicios Spring Boot desde tu IDE:

```bash
docker-compose up -d postgres redis
```

Luego ejecuta desde tu IDE:
- `AuthServiceApplication.java` (puerto 8081)
- `ChallengeServiceApplication.java` (puerto 8082)

Y para el frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Comandos útiles de Docker Compose

### Ver logs de los servicios

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service
docker-compose logs -f challenge-service
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Verificar estado de los contenedores

```bash
docker-compose ps
```

### Detener servicios

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (borra datos)
docker-compose down -v
```

### Reconstruir imágenes

Si haces cambios en el código, necesitas reconstruir:

```bash
# Reconstruir y levantar backend
docker-compose up -d --build auth-service challenge-service

# Reconstruir y levantar frontend
docker-compose up -d --build frontend

# Reconstruir todo
docker-compose up -d --build

# O reconstruir sin caché
docker-compose build --no-cache auth-service challenge-service frontend
docker-compose up -d
```

### Reiniciar un servicio específico

```bash
docker-compose restart auth-service
docker-compose restart challenge-service
docker-compose restart frontend
```

---

## Verificar que todo funciona

### 1. Health Checks

```bash
# Auth Service
curl http://localhost:8081/actuator/health

# Challenge Service
curl http://localhost:8082/actuator/health

# Frontend
curl http://localhost:3000/health

# Ambos servicios backend deberían responder: {"status":"UP"}
# Frontend debería responder: "healthy"
```

### 2. Acceder a las aplicaciones

- Frontend: http://localhost:3000
- Auth Service API: http://localhost:8081
- Challenge Service API: http://localhost:8082

### 3. Swagger UI (Backend)

- Auth Service: http://localhost:8081/swagger-ui.html
- Challenge Service: http://localhost:8082/swagger-ui.html

### 3. Verificar PostgreSQL

```bash
# Conectarse a la base de datos desde el contenedor
docker exec -it apiarena-postgres psql -U apiarena_user -d apiarena

# Listar tablas
\dt

# Deberías ver:
# - users
# - refresh_tokens
# - challenges

# Salir
\q
```

---

## Probar en Postman

Importa la colección: `backend/API-ARENA_Postman_Collection.json`

### 1. Registrar un usuario

```http
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!",
  "role": "STUDENT"
}
```

### 2. Hacer login

```http
POST http://localhost:8081/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123!"
}
```

Respuesta:
```json
{
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "uuid-here"
}
```

### 3. Obtener perfil (requiere token)

```http
GET http://localhost:8081/api/auth/me
Authorization: Bearer eyJhbGc...
```

### 4. Crear un challenge (requiere rol TEACHER/ADMIN)

Primero, registra un usuario con rol TEACHER:

```http
POST http://localhost:8081/api/auth/register
Content-Type: application/json

{
  "username": "teacher1",
  "email": "teacher@example.com",
  "password": "Password123!",
  "role": "TEACHER"
}
```

Luego haz login y usa el token:

```http
POST http://localhost:8082/api/challenges
Authorization: Bearer <token-del-teacher>
Content-Type: application/json

{
  "title": "REST API Básica",
  "description": "Crea una API REST simple con endpoints CRUD",
  "difficulty": "EASY",
  "category": "REST",
  "requiredEndpoints": {
    "GET": ["/api/items"],
    "POST": ["/api/items"]
  },
  "testSuite": {
    "tests": [
      {
        "name": "GET /api/items debe retornar 200",
        "endpoint": "/api/items",
        "method": "GET",
        "expectedStatus": 200
      }
    ]
  }
}
```

### 5. Listar challenges (público)

```http
GET http://localhost:8082/api/challenges
```

---

## Troubleshooting

### Error: "Connection refused" en PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps | grep postgres

# Ver logs
docker-compose logs postgres

# Reiniciar contenedor
docker-compose restart postgres
```

### Error: "Unable to connect to Redis"

```bash
# Verificar que Redis está corriendo
docker-compose ps | grep redis

# Ver logs
docker-compose logs redis

# Probar conexión
docker exec -it apiarena-redis redis-cli -a redissecretpass456 ping
# Debería responder: PONG
```

### Error: "Port 8081 already in use"

```bash
# Windows - Encontrar proceso usando el puerto
netstat -ano | findstr :8081

# Matar el proceso (reemplaza <PID> con el número)
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

### Error al construir las imágenes

```bash
# Limpiar caché de Docker
docker system prune -a

# Reconstruir desde cero
docker-compose build --no-cache
docker-compose up -d
```

### Los servicios Spring Boot no inician

```bash
# Ver logs detallados
docker-compose logs -f auth-service
docker-compose logs -f challenge-service

# Verificar que PostgreSQL esté listo
docker exec apiarena-postgres pg_isready -U apiarena_user

# Reiniciar servicios
docker-compose restart auth-service challenge-service
```

### Limpiar y empezar de cero

```bash
# Parar todos los contenedores
docker-compose down -v

# Borrar imágenes construidas
docker rmi apiarena-auth apiarena-challenge

# Volver a levantar todo
docker-compose up -d --build postgres redis auth-service challenge-service

# Esperar 30-60 segundos para que los servicios inicien
docker-compose logs -f
```

---

## Puertos utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Auth Service | 8081 | http://localhost:8081 |
| Challenge Service | 8082 | http://localhost:8082 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## Configuración

### Variables de entorno (`.env`)

El archivo `.env` en la raíz del proyecto contiene todas las credenciales:

```env
POSTGRES_DB=apiarena
POSTGRES_USER=apiarena_user
POSTGRES_PASSWORD=supersecretpassword123

REDIS_PASSWORD=redissecretpass456

JWT_SECRET=myjwtsecretkey123456789abcdefghijklmnopqrstuvwxyz
```

### Perfiles de Docker Compose

Puedes usar perfiles para controlar qué servicios levantar:

```bash
# Solo bases de datos
docker-compose up -d postgres redis

# Backend completo
docker-compose up -d postgres redis auth-service challenge-service

# Backend + Frontend (aplicación completa)
docker-compose up -d postgres redis auth-service challenge-service frontend

# Todo (incluye MongoDB, InfluxDB, Kafka si los necesitas)
docker-compose up -d
```

---

## Notas importantes

1. **Primera ejecución:** La primera vez que ejecutes `docker-compose up`, Docker descargará las imágenes base y compilará los servicios. Esto puede tardar 5-10 minutos para el backend y 2-3 minutos para el frontend.

2. **Tiempo de inicio:** 
   - Los servicios Spring Boot tardan aproximadamente 30-60 segundos en iniciar
   - El frontend está disponible inmediatamente después de construirse

3. **Tablas automáticas:** Las tablas se crean automáticamente gracias a `spring.jpa.hibernate.ddl-auto=update`.

4. **Script SQL:** El archivo `docker/postgres/init-db.sql` se ejecuta automáticamente la primera vez que se crea el contenedor de PostgreSQL.

5. **Hot Reload:** 
   - Backend: Si haces cambios en el código Java, necesitas reconstruir las imágenes con `docker-compose up -d --build`
   - Frontend: Si haces cambios en el código React, necesitas reconstruir con `docker-compose up -d --build frontend`

6. **Desarrollo local:** Si prefieres desarrollo rápido:
   - Backend: usa `docker-compose up -d postgres redis` y ejecuta los servicios Spring Boot desde tu IDE
   - Frontend: usa `npm run dev` en la carpeta frontend (puerto 5173 por defecto)

---

## Flujo de trabajo recomendado

### Durante desarrollo:

```bash
# Opción A: Desarrollo rápido con hot reload
# 1. Levantar solo bases de datos
docker-compose up -d postgres redis

# 2. Backend: Ejecutar desde tu IDE (hot reload automático)
# 3. Frontend: Ejecutar en modo dev
cd frontend
npm run dev  # http://localhost:5173
```

```bash
# Opción B: Testing con Docker
# Levantar todo con Docker
docker-compose up -d postgres redis auth-service challenge-service frontend

# Ver logs en tiempo real
docker-compose logs -f
```

### Para testing/producción:

```bash
# Levantar todo con Docker Compose
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

---

## Ayuda adicional

Si encuentras problemas:

1. Verifica los logs: `docker-compose logs -f`
2. Verifica que PostgreSQL y Redis estén healthy: `docker-compose ps`
3. Confirma que los puertos no estén ocupados: `netstat -ano | findstr :808`
4. Revisa las variables de entorno en `.env`
5. Asegúrate de tener Docker Desktop actualizado
