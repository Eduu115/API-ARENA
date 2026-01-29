# Auth Service - APIArena

## Descripción

El **Auth Service** es el microservicio encargado de la autenticación y autorización en la plataforma APIArena. Gestiona el registro de usuarios, login, tokens JWT, refresh tokens y la gestión de sesiones.

## Características Principales

- Registro de usuarios con validación
- Autenticación mediante JWT (Access + Refresh Tokens)
- Gestión de sesiones en Redis
- Verificación de email
- Control de acceso basado en roles (RBAC)
- Actualización de perfil de usuario
- Logout y revocación de tokens
- Encriptación de contraseñas con BCrypt
- Rate limiting para prevenir ataques

## Stack Tecnológico

- **Java 21**
- **Spring Boot 3.2**
- **Spring Security 6**
- **Spring Data JPA**
- **PostgreSQL** (base de datos principal)
- **Redis** (sesiones y refresh tokens)
- **JWT** (JSON Web Tokens)
- **BCrypt** (hash de contraseñas)
- **Docker** (containerización)
- **Swagger/OpenAPI** (documentación)

## Estructura del Proyecto

```
auth-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── apiarena/
│   │   │           └── auth/
│   │   │               ├── model/
│   │   │               │   ├── entities/
│   │   │               │   │   ├── User.java
│   │   │               │   │   └── RefreshToken.java
│   │   │               │   ├── dto/
│   │   │               │   │   ├── LoginRequest.java
│   │   │               │   │   ├── RegisterRequest.java
│   │   │               │   │   ├── AuthResponse.java
│   │   │               │   │   ├── RefreshTokenRequest.java
│   │   │               │   │   ├── UserDTO.java
│   │   │               │   │   └── UpdateProfileRequest.java
│   │   │               │   └── enums/
│   │   │               │       └── UserRole.java
│   │   │               ├── repository/
│   │   │               │   ├── UserRepository.java
│   │   │               │   └── RefreshTokenRepository.java
│   │   │               ├── service/
│   │   │               │   ├── AuthService.java
│   │   │               │   ├── UserService.java
│   │   │               │   ├── JwtService.java
│   │   │               │   ├── RefreshTokenService.java
│   │   │               │   └── EmailService.java
│   │   │               ├── restcontroller/
│   │   │               │   └── AuthController.java
│   │   │               ├── security/
│   │   │               │   ├── SecurityConfig.java
│   │   │               │   ├── JwtAuthenticationFilter.java
│   │   │               │   └── CustomUserDetailsService.java
│   │   │               ├── exception/
│   │   │               │   ├── GlobalExceptionHandler.java
│   │   │               │   ├── UserAlreadyExistsException.java
│   │   │               │   ├── InvalidCredentialsException.java
│   │   │               │   └── TokenException.java
│   │   │               └── AuthServiceApplication.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── migration/
│   │               ├── V1__create_users_table.sql
│   │               └── V2__create_refresh_tokens_table.sql
│   └── test/
│       └── java/
│           └── com/
│               └── apiarena/
│                   └── auth/
│                       ├── service/
│                       │   ├── AuthServiceTest.java
│                       │   └── JwtServiceTest.java
│                       └── restcontroller/
│                           └── AuthControllerTest.java
├── Dockerfile
├── pom.xml
└── README.md
```

## Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del servicio:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=apiarena
DB_USERNAME=apiarena_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key_min_256_bits
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# Email (opcional para verificación)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@apiarena.com

# Service
SERVER_PORT=8081
```

### application.yml

```yaml
spring:
  application:
    name: auth-service
  
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:apiarena}
    username: ${DB_USERNAME:apiarena_user}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 60000
  
  mail:
    host: ${SMTP_HOST:smtp.gmail.com}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME:}
    password: ${SMTP_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

server:
  port: ${SERVER_PORT:8081}

jwt:
  secret: ${JWT_SECRET:defaultSecretKeyForDevelopmentOnly}
  expiration: ${JWT_EXPIRATION:86400000}
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}

logging:
  level:
    com.apiarena.auth: DEBUG
    org.springframework.security: INFO
```

## Endpoints

### Base URL: `http://localhost:8081/api/auth`

### 1. Registro de Usuario

**POST** `/register`

Registra un nuevo usuario en la plataforma.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "STUDENT"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": 1,
  "email": "john@example.com"
}
```

**Validaciones:**
- Username: 3-50 caracteres, solo alfanuméricos y guiones
- Email: formato válido
- Password: mínimo 8 caracteres, debe contener mayúsculas, minúsculas y números
- Role: STUDENT, TEACHER, ADMIN (default: STUDENT)

---

### 2. Login

**POST** `/login`

Autentica un usuario y devuelve tokens de acceso.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "STUDENT",
    "avatarUrl": null,
    "rating": 1000,
    "level": 1
  }
}
```

---

### 3. Refresh Token

**POST** `/refresh`

Obtiene un nuevo access token usando el refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400
}
```

---

### 4. Logout

**POST** `/logout`

Cierra sesión del usuario y revoca los tokens.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Obtener Perfil

**GET** `/me`

Obtiene la información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "STUDENT",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "Passionate developer learning API design",
  "githubUsername": "johndoe",
  "rating": 1200,
  "level": 5,
  "experiencePoints": 2500,
  "totalChallengesCompleted": 15,
  "totalTestsPassed": 142,
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-03-20T14:22:00Z",
  "emailVerified": true
}
```

---

### 6. Actualizar Perfil

**PUT** `/me`

Actualiza la información del perfil del usuario.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "username": "johndoe_updated",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "githubUsername": "johndoe"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "johndoe_updated",
  "email": "john@example.com",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "githubUsername": "johndoe",
  "updatedAt": "2024-03-20T15:00:00Z"
}
```

---

### 7. Verificar Email (Enviar)

**POST** `/verify-email/send`

Envía un email de verificación al usuario.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "message": "Verification email sent successfully",
  "email": "john@example.com"
}
```

---

### 8. Verificar Email (Confirmar)

**POST** `/verify-email/confirm/{token}`

Confirma la verificación del email.

**Path Parameters:**
- `token`: Token de verificación recibido por email

**Response (200 OK):**
```json
{
  "message": "Email verified successfully",
  "emailVerified": true
}
```

---

## Modelos de Datos

### User Entity

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'STUDENT',
    avatar_url VARCHAR(500),
    bio TEXT,
    github_username VARCHAR(100),
    rating INT DEFAULT 1000,
    level INT DEFAULT 1,
    experience_points INT DEFAULT 0,
    total_challenges_completed INT DEFAULT 0,
    total_tests_passed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating ON users(rating DESC);
```

### RefreshToken Entity

```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Instalación y Ejecución

### Requisitos Previos

- Java 21 JDK
- Maven 3.8+
- Docker y Docker Compose
- PostgreSQL 15+
- Redis 7+

### Opción 1: Ejecutar con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d postgres redis
docker-compose up --build auth-service
```

### Opción 2: Ejecutar Localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-org/apiarena.git
cd apiarena/auth-service

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Instalar dependencias
mvn clean install

# 4. Ejecutar migraciones (si usas Flyway)
mvn flyway:migrate

# 5. Ejecutar el servicio
mvn spring-boot:run
```

El servicio estará disponible en `http://localhost:8081`

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests
mvn test

# Tests específicos
mvn test -Dtest=AuthServiceTest
mvn test -Dtest=AuthControllerTest

# Tests con cobertura
mvn test jacoco:report
```

### Tests de Integración

```bash
# Ejecutar tests de integración
mvn verify -P integration-tests
```

### Tests con Postman/Insomnia

Importar la colección de ejemplos desde `docs/api/auth-service.postman_collection.json`

---

## Seguridad

### JWT Token Structure

**Access Token:**
```json
{
  "sub": "1",
  "email": "john@example.com",
  "role": "STUDENT",
  "iat": 1710935000,
  "exp": 1711021400
}
```

**Refresh Token:**
```json
{
  "sub": "1",
  "type": "refresh",
  "iat": 1710935000,
  "exp": 1711539800
}
```

### Password Requirements

- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Caracteres especiales recomendados

### Rate Limiting

- Login: 5 intentos por minuto
- Register: 3 intentos por minuto
- Refresh: 10 intentos por minuto

---

## Integración con Otros Servicios

### NGINX Proxy Configuration

```nginx
location /api/auth/ {
    proxy_pass http://auth-service:8081/api/auth/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Uso desde Otros Servicios

```java
// Validar JWT en otro microservicio
@Component
public class JwtValidator {
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
```

---

## Logging

### Niveles de Log

- **DEBUG**: Flujo detallado de ejecución
- **INFO**: Eventos importantes (login, registro)
- **WARN**: Situaciones anormales pero manejables
- **ERROR**: Errores que requieren atención

### Ejemplo de Logs

```
2024-03-20 14:30:15.123 INFO  [auth-service] User registered: john@example.com
2024-03-20 14:31:22.456 INFO  [auth-service] User logged in: john@example.com
2024-03-20 14:35:10.789 WARN  [auth-service] Failed login attempt: invalid@example.com
2024-03-20 14:40:33.012 ERROR [auth-service] Database connection failed
```

---

## Troubleshooting

### Error: "Database connection refused"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Verificar logs
docker-compose logs postgres
```

### Error: "JWT signature does not match"

**Causa:** JWT_SECRET diferente entre servicios o cambió después de generar el token.

**Solución:**
1. Verificar que JWT_SECRET sea igual en todos los servicios
2. Hacer logout y volver a login
3. Limpiar tokens en Redis

### Error: "User already exists"

**Causa:** Email o username ya registrado.

**Solución:**
- Usar diferente email/username
- Si es un error, verificar la base de datos

---

## Documentación API

### Swagger UI

Acceder a la documentación interactiva:

```
http://localhost:8081/swagger-ui.html
```

### OpenAPI Spec

Descargar especificación OpenAPI:

```
http://localhost:8081/v3/api-docs
```

---

## Contribuir

### Workflow

1. Crear branch desde `develop`
2. Hacer cambios
3. Escribir tests
4. Commit con mensaje descriptivo
5. Push y crear Pull Request
6. Code review
7. Merge a `develop`

### Convenciones de Código

- Seguir Google Java Style Guide
- Nombres descriptivos en inglés
- Javadoc en métodos públicos
- Tests para nueva funcionalidad

---

## Licencia

Este proyecto es parte del TFG APIArena.

---

## Autores

- **Equipo APIArena** - Desarrollo inicial

---

## Soporte

Para problemas o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

---

## Versiones

### v1.0.0 (Actual)
- Registro y login
- JWT tokens
- Refresh tokens
- Gestión de perfil
- Verificación de email
- Rate limiting
- RBAC

### Próximas Versiones
- OAuth2 (Google, GitHub)
- Two-factor authentication (2FA)
- Password reset
- Account deletion
- Session management UI

---

**Gracias por usar APIArena Auth Service!**
