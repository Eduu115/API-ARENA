-- ===========================================
-- APIArena Database Initialization Script
-- ===========================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- Tabla: users
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    avatar_url VARCHAR(500),
    bio TEXT,
    github_username VARCHAR(100),
    rating INTEGER NOT NULL DEFAULT 1000,
    level INTEGER NOT NULL DEFAULT 1,
    experience_points INTEGER NOT NULL DEFAULT 0,
    total_challenges_completed INTEGER NOT NULL DEFAULT 0,
    total_tests_passed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===========================================
-- Tabla: refresh_tokens
-- ===========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- ===========================================
-- Tabla: categories
-- ===========================================
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

-- ===========================================
-- Tabla: challenges
-- ===========================================
CREATE TABLE IF NOT EXISTS challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    max_score INTEGER NOT NULL DEFAULT 1000,
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    
    required_endpoints JSONB,
    required_status_codes JSONB,
    required_headers JSONB,
    test_suite JSONB,
    performance_requirements JSONB,
    design_criteria JSONB,
    
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    times_attempted INTEGER NOT NULL DEFAULT 0,
    times_completed INTEGER NOT NULL DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    
    hints JSONB,
    solution_explanation TEXT,
    learning_objectives JSONB
);

-- ===========================================
-- Tabla: submissions
-- ===========================================
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    zip_file_path VARCHAR(500),
    total_score DECIMAL(5,2),
    correctness_score DECIMAL(5,2),
    performance_score DECIMAL(5,2),
    design_score DECIMAL(5,2),
    build_logs TEXT,
    test_logs TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ===========================================
-- Indices
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category_id ON challenges(category_id);
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(featured);
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);

-- ===========================================
-- Seed: categorias
-- ===========================================
INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
  ('REST API Design', 'rest-api', 'Design and implement RESTful APIs following best practices, including proper HTTP methods, status codes, and resource naming conventions.', '', '#00D9FF', 1),
  ('CRUD Operations', 'crud', 'Master Create, Read, Update, and Delete operations with proper validation, error handling, and data persistence.', '', '#00FFA3', 2),
  ('Authentication', 'auth', 'Implement secure authentication systems using JWT, OAuth, sessions, and other modern authentication patterns.', '', '#FFB800', 3),
  ('Security', 'security', 'Learn about API security best practices, including input validation, SQL injection prevention, XSS protection, and secure data handling.', '', '#FF6B6B', 4),
  ('Performance', 'performance', 'Optimize API performance through caching strategies, query optimization, pagination, and efficient data processing.', '', '#B24BF3', 5),
  ('Caching', 'caching', 'Implement effective caching mechanisms using Redis, in-memory caches, and HTTP caching headers to improve response times.', '', '#00D9FF', 6),
  ('WebSockets', 'websockets', 'Build real-time bidirectional communication systems using WebSocket protocol for live updates and interactive features.', '', '#00FFA3', 7),
  ('Database', 'database', 'Work with SQL and NoSQL databases, design efficient schemas, write optimized queries, and handle transactions.', '', '#FFB800', 8),
  ('Microservices', 'microservices', 'Design and implement microservices architecture with service discovery, API gateways, and inter-service communication.', '', '#B24BF3', 9),
  ('Testing', 'testing', 'Write comprehensive unit tests, integration tests, and end-to-end tests to ensure API reliability and maintainability.', '', '#FF6B6B', 10)
ON CONFLICT (slug) DO NOTHING;

-- Verificacion
SELECT 'Database initialized successfully!' as status;
