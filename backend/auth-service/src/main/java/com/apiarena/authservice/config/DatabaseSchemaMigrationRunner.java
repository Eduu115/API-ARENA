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
}
