-- Apply on existing API Arena databases (init-db.sql only runs on first volume create).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) NOT NULL DEFAULT 'en';
