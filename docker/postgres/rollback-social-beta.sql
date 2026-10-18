-- Rollback for create-social-beta.sql. Drops social beta tables only.
--   docker exec -i apiarena-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres/rollback-social-beta.sql

DROP TABLE IF EXISTS social_reports;
DROP TABLE IF EXISTS social_reactions;
DROP TABLE IF EXISTS social_post_test_results;
DROP TABLE IF EXISTS social_post_scores;
DROP TABLE IF EXISTS social_posts;
DROP TABLE IF EXISTS social_activity_entries;
DROP TABLE IF EXISTS social_privacy_settings;
