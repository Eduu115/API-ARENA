-- Social beta (social-service). Idempotent. Apply on a live database with:
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres/create-social-beta.sql
-- Do not recreate volumes. Rollback: docker/postgres/rollback-social-beta.sql
--
-- Relational columns only (no document columns, no arrays). Reports are their own table (a reporter + a target is a
-- row with identity, not a list stuffed into the post). Reactions point at either
-- an activity row or a post (target_type); a single FK cannot cover both tables,
-- so those links are enforced in the service on write/delete.

CREATE TABLE IF NOT EXISTS social_activity_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(40) NOT NULL,
    source_event_id VARCHAR(180) NOT NULL,
    challenge_id BIGINT,
    challenge_title VARCHAR(200),
    score INTEGER,
    previous_value INTEGER,
    new_value INTEGER,
    delta INTEGER,
    label_before VARCHAR(40),
    label_after VARCHAR(40),
    achievement_code VARCHAR(80),
    achievement_title VARCHAR(200),
    streak_weeks INTEGER,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_activity_source UNIQUE (source_event_id)
);

CREATE INDEX IF NOT EXISTS idx_social_activity_user_created
    ON social_activity_entries (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_id BIGINT NOT NULL,
    challenge_id BIGINT,
    challenge_title VARCHAR(200),
    caption VARCHAR(500),
    total_score INTEGER NOT NULL,
    technical_score INTEGER NOT NULL DEFAULT 0,
    ai_score INTEGER NOT NULL DEFAULT 0,
    tests_passed INTEGER NOT NULL DEFAULT 0,
    tests_failed INTEGER NOT NULL DEFAULT 0,
    avg_response_ms INTEGER,
    p95_response_ms INTEGER,
    p99_response_ms INTEGER,
    rps INTEGER,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_posts_submission UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user_created
    ON social_posts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_post_test_results (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    passed BOOLEAN NOT NULL,
    CONSTRAINT uq_social_post_test UNIQUE (post_id, test_name)
);

CREATE TABLE IF NOT EXISTS social_post_scores (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    score_key VARCHAR(40) NOT NULL,
    score_value INTEGER NOT NULL,
    max_value INTEGER,
    CONSTRAINT uq_social_post_score UNIQUE (post_id, score_key)
);

CREATE TABLE IF NOT EXISTS social_reactions (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_reaction_user UNIQUE (target_type, target_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_reactions_target
    ON social_reactions (target_type, target_id);

CREATE TABLE IF NOT EXISTS social_privacy_settings (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    activity_visibility VARCHAR(20) NOT NULL DEFAULT 'FRIENDS',
    friend_post_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_reports (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    reporter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_report_once UNIQUE (target_type, target_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_reports_created
    ON social_reports (created_at DESC);
