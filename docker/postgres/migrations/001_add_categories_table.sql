-- ===========================================
-- Migration: Añadir tabla de categorías
-- Fecha: 2026-02-23
-- ===========================================

-- Crear tabla categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Seed inicial de categorías
INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
  ('REST API Design', 'rest-api', 'Design and implement RESTful APIs following best practices, including proper HTTP methods, status codes, and resource naming conventions.', '◎', '#00D9FF', 1),
  ('CRUD Operations', 'crud', 'Master Create, Read, Update, and Delete operations with proper validation, error handling, and data persistence.', '⊞', '#00FFA3', 2),
  ('Authentication', 'auth', 'Implement secure authentication systems using JWT, OAuth, sessions, and other modern authentication patterns.', '🔒', '#FFB800', 3),
  ('Security', 'security', 'Learn about API security best practices, including input validation, SQL injection prevention, XSS protection, and secure data handling.', '🛡️', '#FF6B6B', 4),
  ('Performance', 'performance', 'Optimize API performance through caching strategies, query optimization, pagination, and efficient data processing.', '⚡', '#B24BF3', 5),
  ('Caching', 'caching', 'Implement effective caching mechanisms using Redis, in-memory caches, and HTTP caching headers to improve response times.', '💾', '#00D9FF', 6),
  ('WebSockets', 'websockets', 'Build real-time bidirectional communication systems using WebSocket protocol for live updates and interactive features.', '🔌', '#00FFA3', 7),
  ('Database', 'database', 'Work with SQL and NoSQL databases, design efficient schemas, write optimized queries, and handle transactions.', '🗄️', '#FFB800', 8),
  ('Microservices', 'microservices', 'Design and implement microservices architecture with service discovery, API gateways, and inter-service communication.', '🔷', '#B24BF3', 9),
  ('Testing', 'testing', 'Write comprehensive unit tests, integration tests, and end-to-end tests to ensure API reliability and maintainability.', '🧪', '#FF6B6B', 10)
ON CONFLICT (slug) DO NOTHING;

-- Añadir columna category_id a challenges (con índice)
ALTER TABLE challenges 
  ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES categories(id);

CREATE INDEX IF NOT EXISTS idx_challenges_category_id ON challenges(category_id);

-- Migrar datos existentes: mapear string category a category_id
UPDATE challenges 
SET category_id = (
  SELECT id FROM categories 
  WHERE LOWER(categories.slug) = LOWER(REPLACE(TRIM(challenges.category), ' ', '-'))
     OR LOWER(categories.name) = LOWER(TRIM(challenges.category))
  LIMIT 1
)
WHERE category_id IS NULL AND category IS NOT NULL;

-- Si hay challenges sin categoría mapeada, asignarles una por defecto (REST API Design)
UPDATE challenges 
SET category_id = (SELECT id FROM categories WHERE slug = 'rest-api' LIMIT 1)
WHERE category_id IS NULL;

-- Ahora que todos los challenges tienen category_id, hacerlo NOT NULL
ALTER TABLE challenges 
  ALTER COLUMN category_id SET NOT NULL;

-- Eliminar la columna antigua category (string) y su índice
DROP INDEX IF EXISTS idx_challenges_category;
ALTER TABLE challenges DROP COLUMN IF EXISTS category;

-- Verificación
SELECT 'Migration completed: Categories table created and data migrated!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as challenges_migrated FROM challenges WHERE category_id IS NOT NULL;
