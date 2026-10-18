-- Normalized two-factor methods + hashed email codes.
-- Idempotent. Does NOT drop users.totp_enabled or users.totp_secret (dual-write until a later contract).
--
-- Maintainer (live database — do this yourself; do not recreate volumes):
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     < docker/postgres/alter-user-two-factor-methods.sql
-- Apply the new auth-service binary first or at the same time, then this script.
-- Safe to re-run.
--
-- Rehearsal only, never against production data:
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d postgres \
--     -c "SELECT 1 FROM pg_database WHERE datname = 'apiarena_migration_test'" 
--   # create the database if that returns zero rows, then:
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d apiarena_migration_test \
--     < docker/postgres/alter-user-two-factor-methods.sql
--
-- auth-service also applies this same DDL on startup (DatabaseSchemaMigrationRunner)
-- so a deploy is not a 2FA bypass window. Running this file first is still the supported step.

ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS user_two_factor_methods (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method     VARCHAR(16) NOT NULL,
    enabled    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_primary BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_two_factor_methods_user_method UNIQUE (user_id, method),
    CONSTRAINT ck_user_two_factor_methods_method CHECK (method IN ('TOTP', 'EMAIL'))
);

CREATE TABLE IF NOT EXISTS two_factor_email_codes (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,
    purpose     VARCHAR(16)  NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    attempts    INTEGER      NOT NULL DEFAULT 0,
    consumed_at TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_two_factor_email_codes_purpose CHECK (purpose IN ('LOGIN', 'ENABLE', 'DISABLE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_two_factor_methods_user_method
    ON user_two_factor_methods (user_id, method);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_two_factor_methods_one_primary
    ON user_two_factor_methods (user_id) WHERE is_primary;

CREATE INDEX IF NOT EXISTS idx_two_factor_email_codes_user_purpose
    ON two_factor_email_codes (user_id, purpose, created_at DESC);

-- Hibernate may have created the tables without the CHECKs. Add them if missing.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_user_two_factor_methods_method') THEN
        ALTER TABLE user_two_factor_methods
            ADD CONSTRAINT ck_user_two_factor_methods_method CHECK (method IN ('TOTP', 'EMAIL'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_two_factor_email_codes_purpose') THEN
        ALTER TABLE two_factor_email_codes
            ADD CONSTRAINT ck_two_factor_email_codes_purpose CHECK (purpose IN ('LOGIN', 'ENABLE', 'DISABLE'));
    END IF;
END $$;

-- Users who already confirmed TOTP get a TOTP row. Email is never backfilled.
INSERT INTO user_two_factor_methods (user_id, method, enabled, is_primary, created_at)
SELECT u.id, 'TOTP', TRUE, TRUE, NOW()
FROM users u
WHERE u.totp_enabled = TRUE
ON CONFLICT (user_id, method) DO NOTHING;
