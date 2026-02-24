# Implementación de Tabla de Categorías

## Resumen de Cambios

Se ha implementado una **tabla de categorías normalizada** en el sistema, reemplazando el campo `category` (VARCHAR) por una relación `ManyToOne` con la nueva entidad `Category`.

---

## Archivos Creados

### Backend (Java)

1. **Entidad:**
   - `Category.java` - Entidad JPA con campos: id, name, slug, description, icon, color, displayOrder, isActive, createdAt

2. **DTOs:**
   - `CategoryDTO.java` - DTO completo con challengeCount
   - `CreateCategoryRequest.java` - Request para crear categoría
   - `UpdateCategoryRequest.java` - Request para actualizar categoría

3. **Repository:**
   - `CategoryRepository.java` - Queries JPA para categorías

4. **Service:**
   - `ICategoryService.java` - Interfaz del servicio
   - `CategoryService.java` - Implementación con CRUD completo

5. **Controller:**
   - `CategoryController.java` - Endpoints REST

### Base de Datos

6. **Migration SQL:**
   - `docker/postgres/migrations/001_add_categories_table.sql` - Script completo de migración

---

## Archivos Modificados

### Backend

1. **`Challenge.java`:**
   - Eliminado: `private String category`
   - Añadido: `@ManyToOne private Category category`

2. **`ChallengeDTO.java` y `ChallengeSummaryDTO.java`:**
   - Añadidos campos: `categoryId`, `categoryIcon`, `categoryColor`
   - Actualizado `fromEntity()` para mapear desde `Challenge.category` (entity)

3. **`CreateChallengeRequest.java` y `UpdateChallengeRequest.java`:**
   - Eliminado: `private String category`
   - Añadido: `private Long categoryId`

4. **`ChallengeService.java`:**
   - Inyección de `CategoryRepository`
   - Busca `Category` por ID en create/update
   - Filtros usan `Category` entity en lugar de String
   - `getAllCategories()` ahora consulta tabla `categories`

5. **`ChallengeRepository.java`:**
   - Métodos actualizados para usar `Category` en lugar de `String`
   - Eliminado: `findAllCategories()` (ya no necesario)

---

## Cómo Aplicar los Cambios

### Opción 1: Migration Automática (Recomendada para dev)

Si usas `spring.jpa.hibernate.ddl-auto=update` (ya configurado), Hibernate detectará los cambios y:
1. Creará la tabla `categories` automáticamente
2. Añadirá la columna `category_id` a `challenges`

**Pero necesitas:**
1. Ejecutar el seed de categorías manualmente
2. Migrar datos existentes

**Pasos:**

```bash
# 1. Detener servicios
docker-compose down

# 2. Levantar solo PostgreSQL
docker-compose up -d postgres

# 3. Ejecutar migration SQL manualmente
docker exec -i apiarena-postgres psql -U apiarena_user -d apiarena < docker/postgres/migrations/001_add_categories_table.sql

# 4. Levantar challenge-service (compilará con nuevos cambios)
docker-compose up -d --build challenge-service

# 5. Verificar logs
docker-compose logs -f challenge-service
```

### Opción 2: Migration Limpia (Base de datos nueva)

Si quieres empezar de cero con la nueva estructura:

```bash
# 1. Detener todo y borrar volúmenes
docker-compose down -v

# 2. Añadir el script de migration al init de PostgreSQL
# Copiar 001_add_categories_table.sql a docker/postgres/init-db.sql
# O modificar docker-compose.yml para montar la carpeta migrations

# 3. Levantar todo de nuevo
docker-compose up -d --build
```

---

## Estructura de la Tabla Categories

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Seed inicial (10 categorías):**
1. REST API Design
2. CRUD Operations
3. Authentication
4. Security
5. Performance
6. Caching
7. WebSockets
8. Database
9. Microservices
10. Testing

---

## Nuevos Endpoints

### GET `/api/categories`
**Descripción:** Obtener categorías activas  
**Auth:** No  
**Response:**
```json
[
  {
    "id": 1,
    "name": "REST API Design",
    "slug": "rest-api",
    "description": "Design and implement RESTful APIs...",
    "icon": "◎",
    "color": "#00D9FF",
    "displayOrder": 1,
    "challengeCount": null
  }
]
```

### GET `/api/categories/all`
**Descripción:** Obtener todas (incluidas inactivas)  
**Auth:** TEACHER/ADMIN  

### GET `/api/categories/{id}`
**Descripción:** Detalle de categoría con challengeCount  
**Auth:** No  

### GET `/api/categories/slug/{slug}`
**Descripción:** Buscar por slug  
**Auth:** No  

### POST `/api/categories`
**Descripción:** Crear categoría  
**Auth:** TEACHER/ADMIN  
**Body:**
```json
{
  "name": "GraphQL",
  "slug": "graphql",
  "description": "Build GraphQL APIs...",
  "icon": "",
  "color": "#E10098",
  "displayOrder": 11
}
```

### PUT `/api/categories/{id}`
**Descripción:** Actualizar categoría  
**Auth:** TEACHER/ADMIN  

### DELETE `/api/categories/{id}`
**Descripción:** Eliminar categoría (solo si no tiene challenges)  
**Auth:** ADMIN  

---

## IMPORTANTE: Cambios en Challenges API

### Crear Challenge (POST `/api/challenges`)

**ANTES:**
```json
{
  "title": "My Challenge",
  "category": "REST",
  ...
}
```

**AHORA:**
```json
{
  "title": "My Challenge",
  "categoryId": 1,
  ...
}
```

### Actualizar Challenge (PUT `/api/challenges/{id}`)

**ANTES:**
```json
{
  "category": "CRUD"
}
```

**AHORA:**
```json
{
  "categoryId": 2  // ✅ ID de la categoría
}
```

### Response de Challenges

**AHORA incluye información completa de categoría:**
```json
{
  "id": 1,
  "title": "...",
  "category": "REST API Design",
  "categoryId": 1,
  "categoryIcon": "",
  "categoryColor": "#00D9FF",
  ...
}
```

---

## 🧪 Testing con Postman

### 1. Obtener categorías disponibles
```
GET http://localhost:8082/api/categories
```

### 2. Crear un challenge con categoría
```
POST http://localhost:8082/api/challenges
Authorization: Bearer {JWT_TOKEN}

{
  "title": "Build a REST API",
  "description": "Create a RESTful API...",
  "difficulty": "EASY",
  "categoryId": 1,  // REST API Design
  "maxScore": 1000,
  "timeLimitMinutes": 60
}
```

### 3. Filtrar challenges por categoría (sigue igual)
```
GET http://localhost:8082/api/challenges?category=REST API Design
```

**Nota:** El filtro por categoría sigue aceptando el **nombre** (no ID), para mantener compatibilidad con el frontend.

---

## Beneficios de Esta Implementación

### 1. **Gestión Dinámica**
- TEACHER puede crear/editar categorías sin tocar código
- Añadir nuevas categorías no requiere deployment

### 2. **Metadata Rica**
- Cada categoría tiene descripción, icono, color
- Frontend puede usar estos datos para UI dinámica
- Orden personalizable (`displayOrder`)

### 3. **Consistencia de Datos**
- FK garantiza que no existen categorías inválidas
- No más typos ("REST" vs "rest" vs "Rest API")
- Renombrar categoría actualiza todos los challenges automáticamente

### 4. **Internacionalización Futura**
- Fácil añadir campos `name_es`, `name_en`, etc.
- O tabla `category_translations` relacionada

### 5. **Soft Delete**
- Marcar categoría como inactiva sin borrarla
- Mantener integridad histórica

---

## Troubleshooting

### Error: "Category not found with id: X"

**Causa:** Frontend o Postman está enviando un `categoryId` que no existe.

**Solución:** 
1. Verificar que las categorías están seeded: `GET /api/categories`
2. Usar un ID válido de la lista

### Error: "Cannot delete category with existing challenges"

**Causa:** Intentas borrar una categoría que tiene challenges asignados.

**Solución:**
1. Reasignar los challenges a otra categoría
2. O eliminar los challenges primero
3. O marcar la categoría como inactiva (`isActive: false`)

### Migration no se aplicó automáticamente

**Solución:**
```bash
# Aplicar manualmente
docker exec -i apiarena-postgres psql -U apiarena_user -d apiarena < docker/postgres/migrations/001_add_categories_table.sql
```

---

## Próximos Pasos Recomendados

1. **Frontend:** Actualizar `challengesApi.js` para:
   - Fetch de `/api/categories` en lugar de hardcodear
   - Usar `categoryId` en create/update de challenges
   - Mostrar `categoryIcon` y `categoryColor` en UI

2. **Panel Admin:** Crear vista de gestión de categorías (TEACHER/ADMIN)

3. **i18n:** Añadir traducciones de categorías si la app se internacionaliza

4. **Analytics:** Queries de stats por categoría (ej. challenges más populares por categoría)

---

## Checklist de Verificación

- [x] Migration SQL creada
- [x] Entidad Category creada
- [x] DTOs creados
- [x] Repository creado
- [x] Service e Interface creados
- [x] Controller creado
- [x] Challenge entity actualizada (FK)
- [x] Challenge DTOs actualizados
- [x] ChallengeService actualizado
- [x] ChallengeRepository actualizado
- [x] No hay errores de lint

**Estado:** IMPLEMENTACIÓN COMPLETA

---

**Fecha:** 2026-02-23  
**Autor:** Eduardo (API Arena Team)
