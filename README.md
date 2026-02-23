# API-ARENA - Plataforma de Desafíos de APIs

Plataforma educativa para aprender desarrollo de APIs a través de desafíos prácticos.

## Stack Tecnológico

### Backend
- **Auth Service:** Java 21 + Spring Boot 3.5 (Puerto 8081)
- **Challenge Service:** Java 21 + Spring Boot 3.5 (Puerto 8082)
- **Base de datos:** PostgreSQL 16
- **Cache:** Redis 7
- **Documentación:** Swagger/OpenAPI

### Frontend
- **Framework:** React 19 + Vite
- **Estilos:** TailwindCSS
- **Routing:** React Router v7
- **Puerto:** 3000

---

## Inicio Rápido

### Pre-requisitos
- Docker Desktop instalado
- Tener los puertos 3000, 8081, 8082, 5432 y 6379 disponibles

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd API-ARENA
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con valores por defecto. Verifica que esté presente en la raíz del proyecto.

### 3. Levantar toda la aplicación

```bash
# Levantar todo (Frontend + Backend + Bases de datos)
docker-compose up -d
```

Esto levantará:
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- Auth Service (puerto 8081)
- Challenge Service (puerto 8082)
- Frontend React (puerto 3000)

### 4. Verificar que todo está funcionando

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs
docker-compose logs -f
```

Accede a:
- **Aplicación:** http://localhost:3000
- **Swagger Auth:** http://localhost:8081/swagger-ui.html
- **Swagger Challenge:** http://localhost:8082/swagger-ui.html

---

## Comandos útiles

### Ver logs de un servicio específico

```bash
docker-compose logs -f frontend
docker-compose logs -f auth-service
docker-compose logs -f challenge-service
```

### Reiniciar un servicio

```bash
docker-compose restart frontend
docker-compose restart auth-service
```

### Reconstruir después de cambios en el código

```bash
# Reconstruir todo
docker-compose up -d --build

# Reconstruir solo frontend
docker-compose up -d --build frontend

# Reconstruir solo backend
docker-compose up -d --build auth-service challenge-service
```

### Detener todo

```bash
docker-compose down
```

### Limpiar todo (incluyendo datos)

```bash
docker-compose down -v
```

---

## Desarrollo Local (sin Docker)

Si prefieres desarrollar sin Docker:

### 1. Levantar solo las bases de datos

```bash
docker-compose up -d postgres redis
```

### 2. Backend

```bash
# Auth Service
cd backend/auth-service
mvn spring-boot:run

# Challenge Service (en otra terminal)
cd backend/challenge-service
mvn spring-boot:run
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend en modo desarrollo estará en http://localhost:5173

---

## Testing con Postman

Importa la colección de Postman ubicada en:
```
backend/API-ARENA_Postman_Collection.json
```

Esta colección incluye:
- Endpoints de autenticación (registro, login, logout)
- Endpoints de desafíos (crear, listar, actualizar, eliminar)
- Tests automáticos
- Variables de entorno automáticas

---

## Estructura del Proyecto

```
API-ARENA/
├── backend/
│   ├── auth-service/           # Servicio de autenticación
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── challenge-service/      # Servicio de desafíos
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   ├── API-ARENA_Postman_Collection.json
│   └── README_INICIO.md        # Documentación detallada del backend
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker/
│   └── postgres/
│       └── init-db.sql         # Script de inicialización de BD
├── docker-compose.yml          # Configuración de Docker Compose
├── .env                        # Variables de entorno
└── README.md                   # Este archivo
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

## Arquitectura

### Microservicios

1. **Auth Service**
   - Registro y autenticación de usuarios
   - Gestión de perfiles
   - JWT tokens + Refresh tokens
   - Roles: STUDENT, TEACHER, ADMIN

2. **Challenge Service**
   - CRUD de desafíos
   - Categorización y filtrado
   - Test suites y validación
   - Sistema de puntuación

### Frontend

- SPA React con enrutamiento
- Interfaz moderna con TailwindCSS
- Comunicación con APIs backend
- Gestión de estado y autenticación

### Base de Datos

- PostgreSQL con 3 tablas principales:
  - `users` - Usuarios y autenticación
  - `refresh_tokens` - Tokens de actualización
  - `challenges` - Desafíos de la plataforma

---

## Troubleshooting

### Error: Puerto ya en uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: No se puede conectar a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

### Frontend no carga

```bash
# Verificar logs
docker-compose logs frontend

# Reconstruir
docker-compose up -d --build frontend
```

### Limpiar y empezar de cero

```bash
# Parar todo
docker-compose down -v

# Limpiar imágenes
docker system prune -a

# Levantar de nuevo
docker-compose up -d --build
```

---

## Documentación adicional

- **Backend completo:** Ver `backend/README_INICIO.md`
- **API Reference:** Swagger disponible en los puertos 8081 y 8082
- **Postman Collection:** `backend/API-ARENA_Postman_Collection.json`

---

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## Licencia

Este proyecto es parte de un Trabajo Final de Grado (TFG).
