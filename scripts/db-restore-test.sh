#!/usr/bin/env bash
# Restore the latest Postgres dump into apiarena_migration_test only.
# Never drops or writes the application database named in POSTGRES_DB.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
PG_CONTAINER="apiarena-postgres"
# The only database this script may drop and recreate.
TEST_DB="apiarena_migration_test"

if [[ "$#" -ne 0 ]]; then
  echo "usage: scripts/db-restore-test.sh" >&2
  exit 1
fi

if [[ "$TEST_DB" != "apiarena_migration_test" ]]; then
  echo "error: refusing to restore into ${TEST_DB}" >&2
  exit 1
fi

read_env() {
  local key="$1"
  local line value
  line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    echo "error: ${key} is not set in .env" >&2
    exit 1
  fi
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ ${#value} -ge 2 && ( "$value" == \"*\" || "$value" == \'*\' ) ]]; then
    value="${value:1:${#value}-2}"
  fi
  if [[ -z "$value" ]]; then
    echo "error: ${key} is empty in .env" >&2
    exit 1
  fi
  printf '%s' "$value"
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at ${ENV_FILE}" >&2
  exit 1
fi

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"
if [[ ! "$POSTGRES_USER" =~ ^[A-Za-z_][A-Za-z0-9_]*$ || ! "$POSTGRES_DB" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "error: POSTGRES_USER and POSTGRES_DB must be plain identifiers" >&2
  exit 1
fi
if [[ "$POSTGRES_DB" == "$TEST_DB" ]]; then
  echo "error: POSTGRES_DB is ${TEST_DB}; refusing to touch it" >&2
  exit 1
fi

state="$(docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null || true)"
if [[ "$state" != "true" ]]; then
  echo "error: container ${PG_CONTAINER} is not running" >&2
  exit 1
fi

DUMP="$(find "${ROOT_DIR}/backups/postgres" -maxdepth 1 -type f -name 'apiarena-*.dump' -print 2>/dev/null | sort | tail -n 1 || true)"
if [[ -z "$DUMP" ]]; then
  echo "error: no dump in backups/postgres; run scripts/db-backup.sh first" >&2
  exit 1
fi

SIZE="$(wc -c < "$DUMP" | tr -d '[:space:]')"
if [[ "$SIZE" -le 0 ]]; then
  echo "error: dump is empty: ${DUMP}" >&2
  exit 1
fi

TOC="$(mktemp)"
trap 'rm -f "$TOC"' EXIT
if ! docker exec -i "$PG_CONTAINER" pg_restore --list < "$DUMP" > "$TOC"; then
  echo "error: pg_restore --list failed for ${DUMP}" >&2
  exit 1
fi
if [[ ! -s "$TOC" ]]; then
  echo "error: pg_restore --list produced no output for ${DUMP}" >&2
  exit 1
fi

echo "Rehearsing restore of $(basename "$DUMP") into ${TEST_DB}"

# Connect to the maintenance database. The DROP/CREATE literals below are fixed
# to apiarena_migration_test and do not reference POSTGRES_DB.
docker exec -i "$PG_CONTAINER" \
  psql -v ON_ERROR_STOP=1 --no-psqlrc -U "$POSTGRES_USER" -d postgres <<'SQL'
DO $$
BEGIN
  IF current_database() = 'apiarena_migration_test' THEN
    RAISE EXCEPTION 'refusing to drop the database this session is connected to';
  END IF;
END $$;
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'apiarena_migration_test'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS apiarena_migration_test;
CREATE DATABASE apiarena_migration_test;
SQL

if ! docker exec -i "$PG_CONTAINER" \
  pg_restore -U "$POSTGRES_USER" -d "$TEST_DB" --no-owner --no-acl --exit-on-error --single-transaction \
  < "$DUMP"; then
  echo "error: pg_restore into ${TEST_DB} failed" >&2
  exit 1
fi

if [[ "$TEST_DB" != "apiarena_migration_test" ]]; then
  echo "error: restore target changed unexpectedly" >&2
  exit 1
fi

APP_STILL="$(docker exec "$PG_CONTAINER" \
  psql -v ON_ERROR_STOP=1 --no-psqlrc -U "$POSTGRES_USER" -d postgres -tAc \
  "SELECT count(*) FROM pg_database WHERE datname = '${POSTGRES_DB}'")"
TEST_THERE="$(docker exec "$PG_CONTAINER" \
  psql -v ON_ERROR_STOP=1 --no-psqlrc -U "$POSTGRES_USER" -d postgres -tAc \
  "SELECT count(*) FROM pg_database WHERE datname = 'apiarena_migration_test'")"
if [[ "$APP_STILL" != "1" || "$TEST_THERE" != "1" ]]; then
  echo "error: database check failed (application=${APP_STILL}, test=${TEST_THERE})" >&2
  exit 1
fi

echo "Row counts in ${TEST_DB}:"
docker exec -i "$PG_CONTAINER" \
  psql -v ON_ERROR_STOP=1 --no-psqlrc -U "$POSTGRES_USER" -d "$TEST_DB" <<'SQL'
SELECT table_name, row_count FROM (
  SELECT 'users'::text AS table_name, count(*)::bigint AS row_count FROM users
  UNION ALL SELECT 'refresh_tokens', count(*) FROM refresh_tokens
  UNION ALL SELECT 'categories', count(*) FROM categories
  UNION ALL SELECT 'challenges', count(*) FROM challenges
  UNION ALL SELECT 'teacher_groups', count(*) FROM teacher_groups
  UNION ALL SELECT 'teacher_group_members', count(*) FROM teacher_group_members
  UNION ALL SELECT 'friendships', count(*) FROM friendships
  UNION ALL SELECT 'sandbox_executions', count(*) FROM sandbox_executions
  UNION ALL SELECT 'leaderboard_entries', count(*) FROM leaderboard_entries
  UNION ALL SELECT 'submissions', count(*) FROM submissions
  UNION ALL SELECT 'replay_events', count(*) FROM replay_events
  UNION ALL SELECT 'test_results', count(*) FROM test_results
  UNION ALL SELECT 'notifications', count(*) FROM notifications
  UNION ALL SELECT 'docs_feedback', count(*) FROM docs_feedback
  UNION ALL SELECT 'product_events', count(*) FROM product_events
  UNION ALL SELECT 'achievement_definitions', count(*) FROM achievement_definitions
  UNION ALL SELECT 'user_achievements', count(*) FROM user_achievements
  UNION ALL SELECT 'profile_badge_definitions', count(*) FROM profile_badge_definitions
  UNION ALL SELECT 'user_profile_badges', count(*) FROM user_profile_badges
  UNION ALL SELECT 'user_streak_state', count(*) FROM user_streak_state
  UNION ALL SELECT 'user_weekly_progress', count(*) FROM user_weekly_progress
  UNION ALL SELECT 'user_weekly_streak_challenges', count(*) FROM user_weekly_streak_challenges
) counts
ORDER BY table_name;
SQL

echo "Restore rehearsal finished in ${TEST_DB}. Application database ${POSTGRES_DB} was not modified."
