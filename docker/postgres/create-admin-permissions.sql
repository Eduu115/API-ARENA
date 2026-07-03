-- Admin capabilities, normalized (one row per admin × capability).
-- Run once on the live container; idempotent. Capability values live in Java
-- (enum AdminCapability); no CHECK here so adding a capability needs no migration.
CREATE TABLE IF NOT EXISTS admin_permissions (
    id            BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    capability    VARCHAR(20) NOT NULL,
    granted_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    granted_by    VARCHAR(100),
    UNIQUE (admin_user_id, capability)
);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON admin_permissions(admin_user_id);

-- Backfill: every existing ADMIN keeps full power (MODERATION + BI) so nothing
-- regresses. New admins start with none and get granted explicitly.
INSERT INTO admin_permissions (admin_user_id, capability, granted_by)
SELECT u.id, c.capability, 'migration'
FROM users u
CROSS JOIN (VALUES ('MODERATION'), ('BI')) AS c(capability)
WHERE u.role = 'ADMIN'
ON CONFLICT (admin_user_id, capability) DO NOTHING;
