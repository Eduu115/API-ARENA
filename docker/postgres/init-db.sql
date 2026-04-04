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
    
    origin VARCHAR(20) NOT NULL DEFAULT 'LEGACY',
    xp_reward INTEGER NOT NULL DEFAULT 200,
    
    hints JSONB,
    solution_explanation TEXT,
    learning_objectives JSONB
);

-- ===========================================
-- Tabla: teacher_groups
-- ===========================================
CREATE TABLE IF NOT EXISTS teacher_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Tabla: teacher_group_members
-- ===========================================
CREATE TABLE IF NOT EXISTS teacher_group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES teacher_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- ===========================================
-- Tabla: friendships (social graph; pair stored with user_low_id < user_high_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS friendships (
    id BIGSERIAL PRIMARY KEY,
    user_low_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_high_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    CHECK (user_low_id < user_high_id),
    UNIQUE(user_low_id, user_high_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_low ON friendships(user_low_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_high ON friendships(user_high_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ===========================================
-- Tabla: sandbox_executions
-- ===========================================
CREATE TABLE IF NOT EXISTS sandbox_executions (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    container_id VARCHAR(200),
    image_name VARCHAR(200),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    exposed_port INTEGER,
    build_logs TEXT,
    runtime_logs TEXT,
    error_message TEXT,
    cpu_limit DOUBLE PRECISION,
    memory_limit VARCHAR(20),
    timeout_seconds INTEGER,
    execution_time_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

-- ===========================================
-- Tabla: leaderboard_entries
-- ===========================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    completion_time_seconds INTEGER,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(challenge_id, user_id)
);

-- ===========================================
-- Tabla: submissions
-- ===========================================
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    repository_url VARCHAR(500),
    zip_file_path VARCHAR(500),
    dockerfile TEXT,
    docker_image_hash VARCHAR(256),
    environment_vars JSONB,
    total_score DECIMAL(6,2),
    correctness_score DECIMAL(6,2),
    performance_score DECIMAL(6,2),
    design_score DECIMAL(6,2),
    ai_review_score DECIMAL(6,2),
    avg_response_ms INT,
    p95_response_ms INT,
    p99_response_ms INT,
    rps INT,
    total_requests INT,
    failed_requests INT,
    design_issues JSONB,
    endpoints_discovered JSONB,
    rest_compliance_score DECIMAL(6,2),
    ai_suggestions JSONB,
    build_logs TEXT,
    test_logs TEXT,
    error_message TEXT,
    replay_data JSONB,
    container_id VARCHAR(100),
    api_base_url VARCHAR(500),
    xp_earned INT,
    elo_change INT,
    previous_best_score DECIMAL(6,2),
    is_first_completion BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
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
CREATE INDEX IF NOT EXISTS idx_sandbox_submission_id ON sandbox_executions(submission_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_status ON sandbox_executions(status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge_rank ON leaderboard_entries(challenge_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_groups_teacher_id ON teacher_groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_group_members_group_id ON teacher_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_teacher_group_members_user_id ON teacher_group_members(user_id);

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

-- ===========================================
-- Seed: users (8 users)
-- All passwords = "Arena2025!" hashed with pgcrypto bf
-- ELO: 1000 base. Unranked if total_challenges_completed < 3.
-- ===========================================
INSERT INTO users (username, email, password_hash, role, bio, github_username, rating, level, experience_points, total_challenges_completed, total_tests_passed, last_login, is_active, email_verified) VALUES
  ('arclight',    'arclight@apiarena.dev',    crypt('Arena2025!', gen_salt('bf', 10)), 'STUDENT', 'Backend junkie. Rust by day, Java by night.',            'arclight-dev',   1380, 5, 3200, 8,  42, NOW() - interval '2 hours',   TRUE, TRUE),
  ('byterunner',  'byterunner@apiarena.dev',  crypt('Arena2025!', gen_salt('bf', 10)), 'STUDENT', 'Full-stack dev & competitive programmer.',               'byterunner99',   1120, 3, 1450, 4,  19, NOW() - interval '1 day',     TRUE, TRUE),
  ('profoak',     'profoak@apiarena.dev',     crypt('Arena2025!', gen_salt('bf', 10)), 'TEACHER', 'CS Professor — API design & distributed systems.',       'prof-oak',       1000, 1, 0,    0,  0,  NOW() - interval '5 hours',   TRUE, TRUE),
  ('sysop',       'sysop@apiarena.dev',       crypt('Arena2025!', gen_salt('bf', 10)), 'ADMIN',   'Platform administrator.',                                NULL,             1000, 1, 0,    0,  0,  NOW() - interval '30 minutes', TRUE, TRUE),
  ('nullpointer', 'nullpointer@apiarena.dev', crypt('Arena2025!', gen_salt('bf', 10)), 'STUDENT', 'Java enthusiast. Spring Boot is life.',                  'null-ptr',       1000, 1, 120,  1,  5,  NOW() - interval '3 days',    TRUE, TRUE),
  ('devmaria',    'devmaria@apiarena.dev',    crypt('Arena2025!', gen_salt('bf', 10)), 'STUDENT', 'Frontend turned backend. Learning APIs the hard way.',   'devmaria-code',  1250, 4, 2100, 6,  31, NOW() - interval '8 hours',   TRUE, TRUE),
  ('profsanchez', 'profsanchez@apiarena.dev', crypt('Arena2025!', gen_salt('bf', 10)), 'TEACHER', 'Software Engineering lecturer. Microservices & DevOps.', 'prof-sanchez',   1000, 1, 0,    0,  0,  NOW() - interval '2 days',    TRUE, TRUE),
  ('kodekat',     'kodekat@apiarena.dev',     crypt('Arena2025!', gen_salt('bf', 10)), 'STUDENT', 'Competitive coder. Top 1% or bust.',                     'kodekat42',      1000, 2, 400,  2,  11, NOW() - interval '12 hours',  TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- ===========================================
-- Seed: challenges  (12 challenges across categories)
-- category_id references: 1=rest-api, 2=crud, 3=auth, 4=security,
--   5=performance, 6=caching, 7=websockets, 8=database, 9=microservices, 10=testing
-- created_by = 3 (profoak) for teacher-authored, NULL for system
-- ===========================================
INSERT INTO challenges (title, slug, description, difficulty, category_id, max_score, time_limit_minutes, created_by, origin, featured, times_attempted, times_completed, average_score, xp_reward, required_endpoints, hints, learning_objectives) VALUES
(
  'Build a Bookstore API',
  'bookstore-api',
  'Design a RESTful API for a bookstore. Implement endpoints to list, create, update, and delete books. Each book has a title, author, ISBN, price, and stock count. Responses must use proper HTTP status codes and JSON payloads.',
  'EASY', 1, 1000, 45, 3, 'COMMUNITY', TRUE, 38, 22, 745.30, 150,
  '{"items":[{"method":"GET","path":"/api/books"},{"method":"GET","path":"/api/books/{id}"},{"method":"POST","path":"/api/books"},{"method":"PUT","path":"/api/books/{id}"},{"method":"DELETE","path":"/api/books/{id}"}]}',
  '{"items":["Start with the GET endpoints before moving to mutations","Use 201 Created for successful POST","Return 404 when a book is not found"]}',
  '{"items":["Understand RESTful resource naming","Use correct HTTP methods","Return appropriate status codes"]}'
),
(
  'Todo List CRUD',
  'todo-crud',
  'Implement a complete CRUD API for a todo list application. Support creating, reading, updating, and deleting tasks. Each task has a title, description, completed flag, and priority level (LOW, MEDIUM, HIGH).',
  'EASY', 2, 1000, 40, NULL, 'LEGACY', FALSE, 65, 45, 812.50, 150,
  '{"items":[{"method":"GET","path":"/api/todos"},{"method":"POST","path":"/api/todos"},{"method":"PUT","path":"/api/todos/{id}"},{"method":"DELETE","path":"/api/todos/{id}"},{"method":"PATCH","path":"/api/todos/{id}/complete"}]}',
  '{"items":["PATCH is ideal for partial updates like toggling completion","Validate that priority is one of the allowed values","Return the created resource in POST responses"]}',
  '{"items":["Implement full CRUD lifecycle","Handle validation errors","Use PATCH for partial updates"]}'
),
(
  'JWT Authentication Flow',
  'jwt-auth-flow',
  'Build an authentication API that supports user registration, login with JWT tokens, token refresh, and a protected /me endpoint. Passwords must be hashed. Access tokens expire in 15 minutes; refresh tokens in 7 days.',
  'MEDIUM', 3, 1000, 60, 3, 'COMMUNITY', TRUE, 29, 14, 680.00, 200,
  '{"items":[{"method":"POST","path":"/api/auth/register"},{"method":"POST","path":"/api/auth/login"},{"method":"POST","path":"/api/auth/refresh"},{"method":"GET","path":"/api/auth/me"}]}',
  '{"items":["Never store plain-text passwords","Use short-lived access tokens and long-lived refresh tokens","The /me endpoint must require a valid Bearer token"]}',
  '{"items":["Implement JWT-based authentication","Handle token expiration and refresh","Secure password storage with hashing"]}'
),
(
  'Rate Limiter Middleware',
  'rate-limiter',
  'Create an API with a configurable rate limiter. The API exposes a simple /ping endpoint. Rate limit: 100 requests per minute per IP. Return 429 Too Many Requests with a Retry-After header when exceeded.',
  'MEDIUM', 4, 1000, 50, NULL, 'LEGACY', FALSE, 18, 9, 620.75, 200,
  '{"items":[{"method":"GET","path":"/ping"},{"method":"GET","path":"/api/config"}]}',
  '{"items":["Use a sliding window or token bucket algorithm","Include X-RateLimit-Remaining and X-RateLimit-Reset headers","Store counters in memory or Redis"]}',
  '{"items":["Understand rate limiting algorithms","Implement security middleware","Use proper HTTP 429 responses"]}'
),
(
  'Paginated Product Catalog',
  'paginated-catalog',
  'Build a product catalog API that supports cursor-based pagination, filtering by category and price range, and sorting by price or name. Return pagination metadata (next cursor, total count, has_more).',
  'MEDIUM', 5, 1000, 55, 3, 'COMMUNITY', FALSE, 22, 11, 710.25, 200,
  '{"items":[{"method":"GET","path":"/api/products"},{"method":"GET","path":"/api/products/{id}"},{"method":"GET","path":"/api/categories"}]}',
  '{"items":["Cursor-based pagination scales better than offset-based","Include Link headers for HATEOAS","Allow combining multiple filters in query params"]}',
  '{"items":["Implement cursor-based pagination","Build composable query filters","Optimize response payloads for large datasets"]}'
),
(
  'Redis Cache Layer',
  'redis-cache-layer',
  'Add a Redis caching layer to an existing articles API. Cache GET responses with a 60-second TTL. Implement cache invalidation on POST/PUT/DELETE. Expose a /cache/stats endpoint showing hit/miss ratio.',
  'HARD', 6, 1000, 60, NULL, 'LEGACY', FALSE, 15, 5, 580.00, 250,
  '{"items":[{"method":"GET","path":"/api/articles"},{"method":"GET","path":"/api/articles/{id}"},{"method":"POST","path":"/api/articles"},{"method":"GET","path":"/cache/stats"}]}',
  '{"items":["Use cache-aside pattern: check cache first, fallback to DB","Invalidate related keys on writes","Track hits and misses with atomic counters"]}',
  '{"items":["Implement cache-aside pattern with Redis","Handle cache invalidation correctly","Monitor cache effectiveness"]}'
),
(
  'Real-Time Chat Room',
  'realtime-chat',
  'Build a WebSocket-based chat room API. Support joining/leaving rooms, broadcasting messages, and listing active users. Provide a REST endpoint to fetch message history (last 50 messages per room).',
  'HARD', 7, 1000, 75, 3, 'COMMUNITY', TRUE, 12, 4, 545.50, 250,
  '{"items":[{"method":"GET","path":"/api/rooms"},{"method":"GET","path":"/api/rooms/{id}/messages"},{"method":"WS","path":"/ws/chat"}]}',
  '{"items":["Use a message broker or in-memory pub/sub for broadcasting","Handle disconnect cleanup gracefully","Limit message history to avoid memory issues"]}',
  '{"items":["Implement WebSocket communication","Manage real-time state (rooms, users)","Combine REST and WebSocket in one service"]}'
),
(
  'Multi-Table Join Queries',
  'multi-table-joins',
  'Design a school database API with students, courses, and enrollments. Implement endpoints that return joined data: a student with their courses, a course with enrolled students, and enrollment statistics.',
  'MEDIUM', 8, 1000, 55, NULL, 'LEGACY', FALSE, 27, 16, 755.80, 200,
  '{"items":[{"method":"GET","path":"/api/students"},{"method":"GET","path":"/api/students/{id}/courses"},{"method":"GET","path":"/api/courses/{id}/students"},{"method":"GET","path":"/api/stats"}]}',
  '{"items":["Avoid N+1 queries by using JOINs or batch fetching","The stats endpoint should use aggregate SQL functions","Return nested objects, not flat rows"]}',
  '{"items":["Design normalized relational schemas","Write efficient JOIN queries","Return structured nested JSON responses"]}'
),
(
  'API Gateway Pattern',
  'api-gateway',
  'Implement a simple API gateway that routes requests to two downstream services (users-service and orders-service). Add request logging, timeout handling (3 s), and a /health endpoint that checks both services.',
  'HARD', 9, 1000, 70, 3, 'COMMUNITY', FALSE, 10, 3, 490.00, 250,
  '{"items":[{"method":"GET","path":"/api/users"},{"method":"GET","path":"/api/orders"},{"method":"GET","path":"/health"}]}',
  '{"items":["Use circuit breaker pattern for downstream failures","Log method, path, status, and latency for every request","The health endpoint must return degraded if one service is down"]}',
  '{"items":["Implement the API gateway pattern","Handle downstream timeouts and failures","Aggregate health checks from multiple services"]}'
),
(
  'Contract Testing with Pact',
  'contract-testing',
  'Write consumer-driven contract tests for a payments API. The API has endpoints to create a payment, get payment status, and list payments. Validate request/response schemas and status codes.',
  'HARD', 10, 1000, 60, NULL, 'LEGACY', FALSE, 8, 2, 430.00, 250,
  '{"items":[{"method":"POST","path":"/api/payments"},{"method":"GET","path":"/api/payments/{id}"},{"method":"GET","path":"/api/payments"}]}',
  '{"items":["Define the expected request and response in the consumer test","Use matchers for dynamic fields like IDs and timestamps","Run the provider verification against the generated pact file"]}',
  '{"items":["Understand consumer-driven contract testing","Write Pact consumer tests","Verify provider compliance"]}'
),
(
  'URL Shortener Service',
  'url-shortener',
  'Build a URL shortener API. POST a long URL to receive a short code. GET the short code to be redirected (301). Track click count and provide an analytics endpoint that returns total clicks and referrer breakdown.',
  'EASY', 1, 1000, 40, 3, 'COMMUNITY', TRUE, 52, 38, 830.10, 150,
  '{"items":[{"method":"POST","path":"/api/shorten"},{"method":"GET","path":"/{code}"},{"method":"GET","path":"/api/stats/{code}"}]}',
  '{"items":["Use 301 Moved Permanently for the redirect","Generate short codes with a hash or counter-based approach","Store click metadata for analytics"]}',
  '{"items":["Design a simple but complete microservice","Implement HTTP redirects correctly","Build basic analytics tracking"]}'
),
(
  'Input Validation & Sanitization',
  'input-validation',
  'Create a user registration API with strict input validation: email format, password strength (min 8 chars, uppercase, number, special char), username (alphanumeric, 3-20 chars). Sanitize all text inputs against XSS.',
  'MEDIUM', 4, 1000, 45, NULL, 'LEGACY', FALSE, 33, 20, 700.40, 200,
  '{"items":[{"method":"POST","path":"/api/users"},{"method":"GET","path":"/api/users/{id}"},{"method":"PUT","path":"/api/users/{id}"}]}',
  '{"items":["Use regex for format validation but also check for common XSS patterns","Return detailed error messages with field-level granularity","Strip HTML tags from free-text fields before storage"]}',
  '{"items":["Implement thorough input validation","Prevent XSS through sanitization","Return developer-friendly validation errors"]}'
)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- Seed: submissions
-- user 1 = arclight (8 completed), user 2 = byterunner (4 completed)
-- Some COMPLETED, some FAILED for variety
-- ===========================================
INSERT INTO submissions (challenge_id, user_id, status, total_score, correctness_score, performance_score, design_score, build_logs, test_logs, created_at, completed_at) VALUES
-- arclight submissions
(1,  1, 'COMPLETED', 872.50, 450.00, 220.00, 202.50,
  E'[BUILD] Compiling project...\n[BUILD] Resolving dependencies...\n[BUILD] Build successful in 4.2s',
  E'[TEST] GET /api/books => 200 OK (12ms)\n[TEST] POST /api/books => 201 Created (18ms)\n[TEST] GET /api/books/1 => 200 OK (8ms)\n[TEST] PUT /api/books/1 => 200 OK (15ms)\n[TEST] DELETE /api/books/1 => 204 No Content (10ms)\n[TEST] GET /api/books/999 => 404 Not Found (6ms)\n[TEST] 14/15 tests passed\n[TEST] Score: 872.5/1000',
  NOW() - interval '12 days', NOW() - interval '12 days' + interval '22 minutes'),

(2,  1, 'COMPLETED', 950.00, 500.00, 240.00, 210.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.1s',
  E'[TEST] GET /api/todos => 200 OK (9ms)\n[TEST] POST /api/todos => 201 Created (14ms)\n[TEST] PATCH /api/todos/1/complete => 200 OK (11ms)\n[TEST] DELETE /api/todos/1 => 204 No Content (8ms)\n[TEST] 18/18 tests passed\n[TEST] Score: 950.0/1000',
  NOW() - interval '11 days', NOW() - interval '11 days' + interval '18 minutes'),

(3,  1, 'COMPLETED', 720.00, 380.00, 180.00, 160.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 5.8s',
  E'[TEST] POST /api/auth/register => 201 Created (45ms)\n[TEST] POST /api/auth/login => 200 OK (32ms)\n[TEST] GET /api/auth/me => 200 OK (8ms)\n[TEST] POST /api/auth/refresh => 200 OK (12ms)\n[TEST] GET /api/auth/me (expired) => 401 Unauthorized (5ms)\n[TEST] 11/14 tests passed\n[TEST] Score: 720.0/1000',
  NOW() - interval '10 days', NOW() - interval '10 days' + interval '38 minutes'),

(5,  1, 'COMPLETED', 810.00, 420.00, 210.00, 180.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 4.0s',
  E'[TEST] GET /api/products?cursor=&limit=10 => 200 OK (22ms)\n[TEST] GET /api/products?category=electronics => 200 OK (18ms)\n[TEST] GET /api/products?sort=price_asc => 200 OK (20ms)\n[TEST] 12/14 tests passed\n[TEST] Score: 810.0/1000',
  NOW() - interval '8 days', NOW() - interval '8 days' + interval '30 minutes'),

(7,  1, 'FAILED', NULL, NULL, NULL, NULL,
  E'[BUILD] Compiling project...\n[BUILD] ERROR: WebSocket dependency not found\n[BUILD] Build failed',
  NULL,
  NOW() - interval '7 days', NULL),

(7,  1, 'COMPLETED', 640.00, 320.00, 170.00, 150.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 6.2s',
  E'[TEST] WS /ws/chat connect => OK (120ms)\n[TEST] WS send message => broadcast received (45ms)\n[TEST] GET /api/rooms => 200 OK (14ms)\n[TEST] GET /api/rooms/1/messages => 200 OK (19ms)\n[TEST] 9/14 tests passed\n[TEST] Score: 640.0/1000',
  NOW() - interval '6 days', NOW() - interval '6 days' + interval '52 minutes'),

(8,  1, 'COMPLETED', 790.00, 410.00, 200.00, 180.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.5s',
  E'[TEST] GET /api/students => 200 OK (15ms)\n[TEST] GET /api/students/1/courses => 200 OK (28ms)\n[TEST] GET /api/courses/1/students => 200 OK (25ms)\n[TEST] GET /api/stats => 200 OK (35ms)\n[TEST] 13/15 tests passed\n[TEST] Score: 790.0/1000',
  NOW() - interval '4 days', NOW() - interval '4 days' + interval '26 minutes'),

(11, 1, 'COMPLETED', 910.00, 470.00, 230.00, 210.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 2.8s',
  E'[TEST] POST /api/shorten => 201 Created (12ms)\n[TEST] GET /abc123 => 301 Moved (6ms)\n[TEST] GET /api/stats/abc123 => 200 OK (9ms)\n[TEST] 16/17 tests passed\n[TEST] Score: 910.0/1000',
  NOW() - interval '2 days', NOW() - interval '2 days' + interval '15 minutes'),

(12, 1, 'COMPLETED', 780.00, 400.00, 190.00, 190.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.3s',
  E'[TEST] POST /api/users (valid) => 201 Created (14ms)\n[TEST] POST /api/users (bad email) => 400 Bad Request (8ms)\n[TEST] POST /api/users (weak password) => 400 Bad Request (7ms)\n[TEST] POST /api/users (XSS attempt) => 201 Created, sanitized (16ms)\n[TEST] 13/15 tests passed\n[TEST] Score: 780.0/1000',
  NOW() - interval '1 day', NOW() - interval '1 day' + interval '20 minutes'),

-- byterunner submissions
(1,  2, 'COMPLETED', 690.00, 350.00, 180.00, 160.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 5.1s',
  E'[TEST] GET /api/books => 200 OK (18ms)\n[TEST] POST /api/books => 201 Created (22ms)\n[TEST] DELETE /api/books/1 => 204 No Content (12ms)\n[TEST] 10/15 tests passed\n[TEST] Score: 690.0/1000',
  NOW() - interval '9 days', NOW() - interval '9 days' + interval '35 minutes'),

(2,  2, 'COMPLETED', 880.00, 460.00, 220.00, 200.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.4s',
  E'[TEST] GET /api/todos => 200 OK (10ms)\n[TEST] POST /api/todos => 201 Created (15ms)\n[TEST] PATCH /api/todos/1/complete => 200 OK (12ms)\n[TEST] 17/18 tests passed\n[TEST] Score: 880.0/1000',
  NOW() - interval '7 days', NOW() - interval '7 days' + interval '25 minutes'),

(3,  2, 'FAILED', NULL, NULL, NULL, NULL,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 4.5s',
  E'[TEST] POST /api/auth/register => 201 Created (40ms)\n[TEST] POST /api/auth/login => 200 OK (28ms)\n[TEST] GET /api/auth/me => 500 Internal Server Error (5ms)\n[TEST] FATAL: 4/14 tests passed — threshold not met\n[TEST] Status: FAILED',
  NOW() - interval '6 days', NULL),

(11, 2, 'COMPLETED', 845.00, 440.00, 215.00, 190.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 2.9s',
  E'[TEST] POST /api/shorten => 201 Created (11ms)\n[TEST] GET /xyz789 => 301 Moved (5ms)\n[TEST] GET /api/stats/xyz789 => 200 OK (10ms)\n[TEST] POST /api/shorten (duplicate) => 200 OK (8ms)\n[TEST] 15/17 tests passed\n[TEST] Score: 845.0/1000',
  NOW() - interval '3 days', NOW() - interval '3 days' + interval '19 minutes'),

(12, 2, 'COMPLETED', 720.00, 370.00, 180.00, 170.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.6s',
  E'[TEST] POST /api/users (valid) => 201 Created (16ms)\n[TEST] POST /api/users (bad email) => 400 Bad Request (9ms)\n[TEST] PUT /api/users/1 (XSS) => 200 OK, sanitized (14ms)\n[TEST] 12/15 tests passed\n[TEST] Score: 720.0/1000',
  NOW() - interval '1 day', NOW() - interval '1 day' + interval '28 minutes'),

-- nullpointer submissions (user 5, 1 challenge completed = unranked)
(2, 5, 'COMPLETED', 610.00, 310.00, 160.00, 140.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 5.8s',
  E'[TEST] GET /api/todos => 200 OK (25ms)\n[TEST] POST /api/todos => 201 Created (30ms)\n[TEST] PUT /api/todos/1 => 200 OK (22ms)\n[TEST] 9/18 tests passed\n[TEST] Score: 610.0/1000',
  NOW() - interval '3 days', NOW() - interval '3 days' + interval '32 minutes'),

-- devmaria submissions (user 6, 6 challenges completed = ranked)
(1,  6, 'COMPLETED', 920.00, 475.00, 235.00, 210.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.0s',
  E'[TEST] GET /api/books => 200 OK (10ms)\n[TEST] POST /api/books => 201 Created (14ms)\n[TEST] DELETE /api/books/1 => 204 No Content (8ms)\n[TEST] 15/15 tests passed\n[TEST] Score: 920.0/1000',
  NOW() - interval '10 days', NOW() - interval '10 days' + interval '20 minutes'),

(2,  6, 'COMPLETED', 890.00, 460.00, 225.00, 205.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.2s',
  E'[TEST] GET /api/todos => 200 OK (11ms)\n[TEST] POST /api/todos => 201 Created (16ms)\n[TEST] PATCH /api/todos/1/complete => 200 OK (10ms)\n[TEST] 17/18 tests passed\n[TEST] Score: 890.0/1000',
  NOW() - interval '9 days', NOW() - interval '9 days' + interval '22 minutes'),

(3,  6, 'COMPLETED', 780.00, 400.00, 195.00, 185.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 4.5s',
  E'[TEST] POST /api/auth/register => 201 Created (38ms)\n[TEST] POST /api/auth/login => 200 OK (25ms)\n[TEST] GET /api/auth/me => 200 OK (10ms)\n[TEST] 12/14 tests passed\n[TEST] Score: 780.0/1000',
  NOW() - interval '7 days', NOW() - interval '7 days' + interval '35 minutes'),

(4,  6, 'COMPLETED', 830.00, 430.00, 210.00, 190.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.8s',
  E'[TEST] GET /ping => 200 OK (3ms)\n[TEST] GET /ping (rate limited) => 429 Too Many Requests (2ms)\n[TEST] 13/14 tests passed\n[TEST] Score: 830.0/1000',
  NOW() - interval '5 days', NOW() - interval '5 days' + interval '28 minutes'),

(8,  6, 'COMPLETED', 860.00, 445.00, 220.00, 195.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 3.3s',
  E'[TEST] GET /api/students => 200 OK (14ms)\n[TEST] GET /api/students/1/courses => 200 OK (22ms)\n[TEST] GET /api/stats => 200 OK (30ms)\n[TEST] 14/15 tests passed\n[TEST] Score: 860.0/1000',
  NOW() - interval '3 days', NOW() - interval '3 days' + interval '24 minutes'),

(11, 6, 'COMPLETED', 940.00, 480.00, 245.00, 215.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 2.5s',
  E'[TEST] POST /api/shorten => 201 Created (9ms)\n[TEST] GET /abc456 => 301 Moved (4ms)\n[TEST] GET /api/stats/abc456 => 200 OK (8ms)\n[TEST] 17/17 tests passed\n[TEST] Score: 940.0/1000',
  NOW() - interval '1 day', NOW() - interval '1 day' + interval '14 minutes'),

-- kodekat submissions (user 8, 2 challenges completed = unranked)
(1,  8, 'COMPLETED', 780.00, 400.00, 200.00, 180.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 4.2s',
  E'[TEST] GET /api/books => 200 OK (15ms)\n[TEST] POST /api/books => 201 Created (20ms)\n[TEST] DELETE /api/books/1 => 204 No Content (11ms)\n[TEST] 12/15 tests passed\n[TEST] Score: 780.0/1000',
  NOW() - interval '5 days', NOW() - interval '5 days' + interval '25 minutes'),

(11, 8, 'COMPLETED', 870.00, 450.00, 220.00, 200.00,
  E'[BUILD] Compiling project...\n[BUILD] Build successful in 2.7s',
  E'[TEST] POST /api/shorten => 201 Created (10ms)\n[TEST] GET /qrs321 => 301 Moved (5ms)\n[TEST] GET /api/stats/qrs321 => 200 OK (9ms)\n[TEST] 16/17 tests passed\n[TEST] Score: 870.0/1000',
  NOW() - interval '2 days', NOW() - interval '2 days' + interval '18 minutes')
ON CONFLICT DO NOTHING;

-- ===========================================
-- Seed: leaderboard_entries (best scores per user+challenge)
-- arclight=1, byterunner=2, nullpointer=5, devmaria=6, kodekat=8
-- ===========================================
INSERT INTO leaderboard_entries (challenge_id, user_id, submission_id, username, score, completion_time_seconds, rank) VALUES
  (1,  1, 1,  'arclight',    873, 1320, 1),
  (2,  1, 2,  'arclight',    950, 1080, 1),
  (3,  1, 3,  'arclight',    720, 2280, 2),
  (5,  1, 4,  'arclight',    810, 1800, 1),
  (7,  1, 6,  'arclight',    640, 3120, 1),
  (8,  1, 7,  'arclight',    790, 1560, 2),
  (11, 1, 8,  'arclight',    910,  900, 2),
  (12, 1, 9,  'arclight',    780, 1200, 1),
  (1,  2, 10, 'byterunner',  690, 2100, 3),
  (2,  2, 11, 'byterunner',  880, 1500, 2),
  (11, 2, 13, 'byterunner',  845, 1140, 3),
  (12, 2, 14, 'byterunner',  720, 1680, 2),
  (2,  5, 15, 'nullpointer', 610, 1920, 4),
  (1,  6, 16, 'devmaria',    920, 1200, 1),
  (2,  6, 17, 'devmaria',    890, 1320, 1),
  (3,  6, 18, 'devmaria',    780, 2100, 1),
  (4,  6, 19, 'devmaria',    830, 1680, 1),
  (8,  6, 20, 'devmaria',    860, 1440, 1),
  (11, 6, 21, 'devmaria',    940,  840, 1),
  (1,  8, 22, 'kodekat',     780, 1500, 2),
  (11, 8, 23, 'kodekat',     870, 1080, 2)
ON CONFLICT (challenge_id, user_id) DO NOTHING;

-- ===========================================
-- Seed: teacher_groups  (profoak = id 3, profsanchez = id 7)
-- ===========================================
INSERT INTO teacher_groups (name, description, teacher_id) VALUES
  ('DAW 2ºA',             'Desarrollo de Aplicaciones Web — segundo curso, grupo A',    3),
  ('ASIR 1ºB',            'Administración de Sistemas — primer curso, grupo B',         3),
  ('Bootcamp APIs',       'Taller intensivo de diseño de APIs REST',                    3),
  ('Backend Avanzado',    'Microservicios, Docker y despliegue cloud',                  7),
  ('Intro Programación',  'Fundamentos de programación y lógica computacional',         7)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Seed: teacher_group_members
-- arclight=1, byterunner=2, nullpointer=5, devmaria=6, kodekat=8
-- ===========================================
INSERT INTO teacher_group_members (group_id, user_id) VALUES
  (1, 1),
  (1, 2),
  (1, 6),
  (2, 2),
  (2, 5),
  (4, 1),
  (4, 6),
  (4, 8),
  (5, 5),
  (5, 8)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Table: test_results
-- ===========================================
CREATE TABLE IF NOT EXISTS test_results (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT REFERENCES submissions(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(50),
    status VARCHAR(20),
    expected_result TEXT,
    actual_result TEXT,
    error_message TEXT,
    execution_time_ms DECIMAL(10,2),
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_headers JSONB,
    request_body TEXT,
    response_status INT,
    response_headers JSONB,
    response_body TEXT,
    score_awarded INT DEFAULT 0,
    max_score INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_submission ON test_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

-- ===========================================
-- Seed: test_results (for completed submissions)
-- ===========================================
INSERT INTO test_results (submission_id, test_name, test_type, status, expected_result, actual_result, execution_time_ms, request_method, request_path, response_status, score_awarded, max_score) VALUES
  -- Submission 1 (arclight, challenge 1)
  (1, 'Functional: GET /api/items',     'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 45.20,  'GET',    '/api/items',     200, 100, 100),
  (1, 'Functional: POST /api/items',    'FUNCTIONAL',  'PASSED', 'HTTP 201', 'HTTP 201', 32.80,  'POST',   '/api/items',     201, 100, 100),
  (1, 'Functional: GET /api/items/1',   'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 18.50,  'GET',    '/api/items/1',   200, 100, 100),
  (1, 'Functional: PUT /api/items/1',   'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 28.30,  'PUT',    '/api/items/1',   200, 100, 100),
  (1, 'Functional: DELETE /api/items/1','FUNCTIONAL',  'PASSED', 'HTTP 204', 'HTTP 204', 15.10,  'DELETE', '/api/items/1',   204, 100, 100),
  (1, 'Functional: GET /api/items/999', 'FUNCTIONAL',  'FAILED', 'HTTP 404', 'HTTP 500', 12.90,  'GET',    '/api/items/999', 500,   0, 100),
  (1, 'Performance: Throughput (RPS)',  'PERFORMANCE', 'PASSED', '>= 100 RPS',  '245 RPS',  15000.00, 'GET', '/api/items', NULL, 50, 50),
  (1, 'Performance: Avg Response Time', 'PERFORMANCE', 'PASSED', '<= 100ms',    '42ms',     42.00,    'GET', '/api/items', NULL, 50, 50),
  (1, 'Design: Proper HTTP status codes','DESIGN',     'PASSED', 'Compliant', 'Compliant',  2.10, NULL, NULL, NULL, 40, 40),
  (1, 'Design: RESTful URL naming',     'DESIGN',     'PASSED', 'Compliant', 'Compliant',  1.50, NULL, NULL, NULL, 40, 40),
  (1, 'Design: Content-Type headers',   'DESIGN',     'FAILED', 'Compliant', 'Non-compliant', 1.80, NULL, NULL, NULL, 0, 40),

  -- Submission 2 (arclight, challenge 2)
  (2, 'Functional: GET /api/users',     'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 38.40,  'GET',  '/api/users',     200, 100, 100),
  (2, 'Functional: POST /api/users',    'FUNCTIONAL',  'PASSED', 'HTTP 201', 'HTTP 201', 52.10,  'POST', '/api/users',     201, 100, 100),
  (2, 'Functional: GET /api/users/1',   'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 22.70,  'GET',  '/api/users/1',   200, 100, 100),
  (2, 'Performance: Throughput (RPS)',  'PERFORMANCE', 'PASSED', '>= 100 RPS',  '310 RPS',  15000.00, 'GET', '/api/users', NULL, 50, 50),
  (2, 'Performance: Avg Response Time', 'PERFORMANCE', 'PASSED', '<= 100ms',    '28ms',     28.00,    'GET', '/api/users', NULL, 50, 50),
  (2, 'Design: Proper HTTP status codes','DESIGN',     'PASSED', 'Compliant', 'Compliant',  1.90, NULL, NULL, NULL, 40, 40),
  (2, 'Design: Error response format',  'DESIGN',     'PASSED', 'Compliant', 'Compliant',  2.30, NULL, NULL, NULL, 40, 40),

  -- Submission 10 (byterunner, challenge 1)
  (10, 'Functional: GET /api/items',    'FUNCTIONAL',  'PASSED', 'HTTP 200', 'HTTP 200', 62.30,  'GET',    '/api/items',     200, 100, 100),
  (10, 'Functional: POST /api/items',   'FUNCTIONAL',  'PASSED', 'HTTP 201', 'HTTP 201', 48.90,  'POST',   '/api/items',     201, 100, 100),
  (10, 'Functional: DELETE /api/items/1','FUNCTIONAL', 'FAILED', 'HTTP 204', 'HTTP 405', 21.40,  'DELETE', '/api/items/1',   405,   0, 100),
  (10, 'Performance: Throughput (RPS)', 'PERFORMANCE', 'FAILED', '>= 100 RPS',  '78 RPS',   15000.00, 'GET', '/api/items', NULL, 15, 50),
  (10, 'Performance: Avg Response Time','PERFORMANCE', 'PASSED', '<= 100ms',    '85ms',     85.00,    'GET', '/api/items', NULL, 50, 50),
  (10, 'Design: Proper HTTP status codes','DESIGN',    'FAILED', 'Compliant', 'Non-compliant', 1.70, NULL, NULL, NULL, 0, 40),
  (10, 'Design: RESTful URL naming',    'DESIGN',     'PASSED', 'Compliant', 'Compliant',  1.40, NULL, NULL, NULL, 40, 40)
ON CONFLICT DO NOTHING;

-- Verificacion
SELECT 'Database initialized successfully!' as status;
