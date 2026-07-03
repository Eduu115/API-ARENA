-- Deferred account deletion (self-service "borrado"): on delete we free the live
-- account immediately but keep a snapshot archive here and RESERVE the email for a
-- retention window; a scheduled job purges rows past purge_after (email freed then).
-- Full/immediate erasure is handled manually via privacy@apiarena.net.
-- Run once on the live container; idempotent.
CREATE TABLE IF NOT EXISTS account_deletions (
    id           BIGSERIAL PRIMARY KEY,
    email        VARCHAR(100) NOT NULL,
    username     VARCHAR(50),
    snapshot     TEXT        NOT NULL,          -- opaque GDPR archive (JSON export); never queried by field
    requested_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    purge_after  TIMESTAMP   NOT NULL,
    CONSTRAINT uq_account_deletions_email UNIQUE (email)
);
CREATE INDEX IF NOT EXISTS idx_account_deletions_purge_after ON account_deletions(purge_after);
