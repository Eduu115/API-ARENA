-- Grant CONTENT to every admin who currently holds both MODERATION and BI.
-- Supreme means holding every AdminCapability. Adding CONTENT without this
-- backfill demotes those admins. Partial admins are not granted CONTENT.
-- Idempotent. Apply only after the auth-service build that knows CONTENT is
-- deployed, and only after a verified backup. Do not run this against the
-- production database from an agent.
--
-- Rehearse on the copy:
--   docker exec -i apiarena-postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d apiarena_migration_test < docker/postgres/alter-admin-capability-content.sql
-- Apply on the live database (maintainer, after code is deployed):
--   docker exec -i apiarena-postgres psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres/alter-admin-capability-content.sql
BEGIN;

-- content-backfill: admins holding both MODERATION and BI
INSERT INTO admin_permissions (admin_user_id, capability, granted_by)
SELECT moderation.admin_user_id, 'CONTENT', 'migration'
FROM admin_permissions moderation
JOIN admin_permissions bi
  ON bi.admin_user_id = moderation.admin_user_id
 AND bi.capability = 'BI'
WHERE moderation.capability = 'MODERATION'
ON CONFLICT (admin_user_id, capability) DO NOTHING;

COMMIT;
