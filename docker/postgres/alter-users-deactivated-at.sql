-- Account deactivation (baja): is_active=false WITHOUT a ban. deactivated_at
-- distinguishes a voluntary/admin baja from a ban (which sets ban_reason/banned_at).
-- Run once on the live container; idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;
