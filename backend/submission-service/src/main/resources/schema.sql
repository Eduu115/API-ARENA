-- Ejecutar manualmente si la tabla submissions no existe
-- O usar con spring.jpa.defer-datasource-initialization=true y spring.sql.init.mode=always
-- (alternativa: usar Flyway/Liquibase)

CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    repository_url VARCHAR(500),
    zip_file_path VARCHAR(500),
    dockerfile TEXT,
    docker_image_hash VARCHAR(256),
    environment_vars JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    total_score DECIMAL(5,2) DEFAULT 0,
    correctness_score DECIMAL(5,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    design_score DECIMAL(5,2) DEFAULT 0,
    ai_review_score DECIMAL(5,2) DEFAULT 0,
    avg_response_ms INT,
    p95_response_ms INT,
    p99_response_ms INT,
    rps INT,
    total_requests INT,
    failed_requests INT,
    design_issues JSONB,
    endpoints_discovered JSONB,
    rest_compliance_score DECIMAL(5,2),
    ai_suggestions JSONB,
    build_logs TEXT,
    test_logs TEXT,
    replay_data JSONB,
    container_id VARCHAR(100),
    api_base_url VARCHAR(500),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
