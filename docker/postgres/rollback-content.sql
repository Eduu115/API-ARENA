-- Drops the content-service tables, including any roadmap seed rows.
-- Idempotent. Does not touch other API Arena tables.

BEGIN;

DROP TABLE IF EXISTS roadmap_item_translations;
DROP TABLE IF EXISTS roadmap_items;
DROP TABLE IF EXISTS roadmap_phase_translations;
DROP TABLE IF EXISTS roadmap_phases;
DROP TABLE IF EXISTS content_post_tags;
DROP TABLE IF EXISTS content_post_translations;
DROP TABLE IF EXISTS content_tags;
DROP TABLE IF EXISTS content_posts;

COMMIT;
