-- Widen score columns: DECIMAL(5,2) max is 999.99; API Arena total score is 0–1000.
-- Run once against an existing DB. From repo root (POSTGRES_* are set inside the container):
--   docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < docker/postgres/alter-submissions-score-columns.sql
-- Or with values from .env: psql -U apiarena_user -d apiarena ...
ALTER TABLE submissions
  ALTER COLUMN total_score TYPE DECIMAL(6,2),
  ALTER COLUMN correctness_score TYPE DECIMAL(6,2),
  ALTER COLUMN performance_score TYPE DECIMAL(6,2),
  ALTER COLUMN design_score TYPE DECIMAL(6,2),
  ALTER COLUMN ai_review_score TYPE DECIMAL(6,2),
  ALTER COLUMN rest_compliance_score TYPE DECIMAL(6,2),
  ALTER COLUMN previous_best_score TYPE DECIMAL(6,2);
