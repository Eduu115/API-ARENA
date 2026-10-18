-- Reverse docker/postgres/alter-admin-capability-content.sql.
-- Removes every CONTENT grant so an auth-service build without that enum can
-- read admin_permissions. MODERATION and BI rows stay. Idempotent.
-- Maintainer only, after a verified backup.
--   docker exec -i apiarena-postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres/rollback-admin-capability-content.sql
BEGIN;

DELETE FROM admin_permissions
WHERE capability = 'CONTENT';

COMMIT;
