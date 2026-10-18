package com.apiarena.authservice.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Idempotent schema patches for existing PostgreSQL volumes (init-db.sql only runs once).
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        applyPreferredLocaleColumn();
        applyAdminTotpColumns();
        applyTwoFactorMethods();
        applyAdminAuditTable();
        applyModerationColumns();
        applyModerationRecordTable();
    }

    /** Structured ban/unban history (category, reason, description) for consultation + analytics. */
    private void applyModerationRecordTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS moderation_record (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        type VARCHAR(10) NOT NULL,
                        category VARCHAR(40),
                        reason VARCHAR(120) NOT NULL,
                        description VARCHAR(500),
                        banned_until TIMESTAMP,
                        actor_email VARCHAR(120) NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT now()
                    )""");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_moderation_user ON moderation_record (user_id, created_at DESC)");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_moderation_category ON moderation_record (category)");
            log.debug("Schema patch applied: moderation_record");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch moderation_record", ex);
            throw ex;
        }
    }

    /** Ban metadata (reason / expiry) + warnings counter. Idempotent, safe on the live prod volume. */
    private void applyModerationColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS warnings INTEGER NOT NULL DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(500)");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP");
            log.debug("Schema patch applied: users.warnings / ban_reason / banned_at / banned_until");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch users moderation columns", ex);
            throw ex;
        }
    }

    /** Admin action audit trail. Idempotent, safe on the live prod volume. */
    private void applyAdminAuditTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS admin_audit_log (
                        id BIGSERIAL PRIMARY KEY,
                        actor_email VARCHAR(120) NOT NULL,
                        action VARCHAR(60) NOT NULL,
                        target_user_id BIGINT,
                        target_username VARCHAR(60),
                        detail VARCHAR(500),
                        created_at TIMESTAMP NOT NULL DEFAULT now()
                    )""");
            jdbcTemplate.execute(
                    "CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_log (created_at DESC)");
            log.debug("Schema patch applied: admin_audit_log");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch admin_audit_log", ex);
            throw ex;
        }
    }

    private void applyPreferredLocaleColumn() {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) NOT NULL DEFAULT 'en'");
            log.debug("Schema patch applied: users.preferred_locale");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch users.preferred_locale", ex);
            throw ex;
        }
    }

    /**
     * Same DDL as docker/postgres/alter-user-two-factor-methods.sql. Idempotent.
     * Runs on startup so TOTP cannot be skipped if the maintainer SQL has not landed yet.
     */
    private void applyTwoFactorMethods() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS user_two_factor_methods (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        method VARCHAR(16) NOT NULL,
                        enabled BOOLEAN NOT NULL DEFAULT FALSE,
                        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )""");
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS two_factor_email_codes (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        code_hash VARCHAR(255) NOT NULL,
                        purpose VARCHAR(16) NOT NULL,
                        expires_at TIMESTAMP NOT NULL,
                        attempts INTEGER NOT NULL DEFAULT 0,
                        consumed_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )""");
            jdbcTemplate.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_user_two_factor_methods_user_method
                        ON user_two_factor_methods (user_id, method)""");
            jdbcTemplate.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_user_two_factor_methods_one_primary
                        ON user_two_factor_methods (user_id) WHERE is_primary""");
            jdbcTemplate.execute("""
                    CREATE INDEX IF NOT EXISTS idx_two_factor_email_codes_user_purpose
                        ON two_factor_email_codes (user_id, purpose, created_at DESC)""");
            addConstraintIgnoreDuplicate("""
                    ALTER TABLE user_two_factor_methods
                        ADD CONSTRAINT ck_user_two_factor_methods_method
                        CHECK (method IN ('TOTP', 'EMAIL'))""");
            addConstraintIgnoreDuplicate("""
                    ALTER TABLE two_factor_email_codes
                        ADD CONSTRAINT ck_two_factor_email_codes_purpose
                        CHECK (purpose IN ('LOGIN', 'ENABLE', 'DISABLE'))""");
            jdbcTemplate.update("""
                    INSERT INTO user_two_factor_methods (user_id, method, enabled, is_primary, created_at)
                    SELECT u.id, 'TOTP', TRUE, TRUE, NOW()
                    FROM users u
                    WHERE u.totp_enabled = TRUE
                    ON CONFLICT (user_id, method) DO NOTHING""");
            log.debug("Schema patch applied: user_two_factor_methods / two_factor_email_codes");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch two-factor methods", ex);
            throw ex;
        }
    }

    private void addConstraintIgnoreDuplicate(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (DataAccessException ex) {
            String message = ex.getMostSpecificCause() != null
                    ? ex.getMostSpecificCause().getMessage()
                    : ex.getMessage();
            if (message != null && message.toLowerCase().contains("already exists")) {
                return;
            }
            throw ex;
        }
    }

    /** ADMIN 2FA (TOTP) enrolment state. Idempotent, safe on the live prod volume. */
    private void applyAdminTotpColumns() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)");
            jdbcTemplate.execute(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false");
            log.debug("Schema patch applied: users.totp_secret / users.totp_enabled");
        } catch (Exception ex) {
            log.error("Failed to apply schema patch users.totp_*", ex);
            throw ex;
        }
    }
}
