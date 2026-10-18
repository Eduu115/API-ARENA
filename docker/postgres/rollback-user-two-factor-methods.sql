-- Rollback for alter-user-two-factor-methods.sql.
-- Drops the normalized method and email-code tables only.
-- Does NOT drop users.totp_enabled or users.totp_secret.
--
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     < docker/postgres/rollback-user-two-factor-methods.sql

DROP TABLE IF EXISTS two_factor_email_codes;
DROP TABLE IF EXISTS user_two_factor_methods;
