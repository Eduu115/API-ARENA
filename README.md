# 🎮 APIArena

Plataforma competitiva de desarrollo de APIs donde estudiantes compiten creando APIs que son evaluadas automáticamente.

## 🚀 Quick Start

### Prerrequisitos
- Docker & Docker Compose
- Java 21
- Node.js 20+
- Maven

### Levantar infraestructura
```bash
# Clonar repositorio
git clone <tu-repo>
cd apiarena

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Levantar bases de datos
docker-compose up -d postgres redis mongodb kafka

# Verificar que estén corriendo
docker ps
```

### Desarrollo

**Backend (auth-service, challenge-service):**  
Primero asegúrate de tener Postgres (y Redis para auth-service) en marcha:
```bash
docker compose up -d postgres redis
```

Si ves *"Connection to localhost:5432 refused"*, es que Postgres no está corriendo; levanta los contenedores antes de iniciar el backend.

```bash
cd backend/auth-service
./mvnw spring-boot:run -DskipTests
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estructura del Proyecto
```
apiarena/
├── frontend/           # React 19 + Vite
├── backend/
│   ├── auth-service/
│   ├── challenge-service/
│   ├── submission-service/
│   └── ...
├── docker/
│   ├── nginx/
│   └── postgres/
└── docs/
```

## 🛠️ Stack Tecnológico

- **Backend**: Java 21, Spring Boot 3.3
- **Frontend**: React 19, Vite
- **Bases de datos**: PostgreSQL, Redis, MongoDB, InfluxDB
- **Message Broker**: Kafka
- **Infraestructura**: Docker, NGINX

## 📚 Documentación

Ver carpeta `docs/` para documentación detallada.

## 👥 Equipo

- Desarrollador 1: Backend + DevOps
- Desarrollador 2: Frontend + Integration

## 📝 Licencia

MIT
EOF