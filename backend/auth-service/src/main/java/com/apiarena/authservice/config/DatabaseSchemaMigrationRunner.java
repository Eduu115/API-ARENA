package com.apiarena.authservice.config;

import org.springframework.boot.CommandLineRunner;
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
