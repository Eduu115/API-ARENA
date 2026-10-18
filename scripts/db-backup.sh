#!/usr/bin/env bash
# Backup API Arena databases into backups/ (gitignored, outside Docker volumes).
# Maintainers run this. It only reads data. It never deletes volumes or applies SQL.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
PG_CONTAINER="apiarena-postgres"
MONGO_CONTAINER="apiarena-mongo"
INFLUX_CONTAINER="apiarena-influxdb"

usage() {
  echo "usage: scripts/db-backup.sh [--mongo] [--influx]" >&2
}

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

require_ident() {
  local key="$1"
  local value="$2"
  if [[ ! "$value" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "error: ${key} must be a plain identifier" >&2
    exit 1
  fi
}

require_running() {
  local name="$1"
  local state
  if ! state="$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)"; then
    echo "error: container ${name} is not available" >&2
    exit 1
  fi
  if [[ "$state" != "true" ]]; then
    echo "error: container ${name} is not running" >&2
    exit 1
  fi
}

file_bytes() {
  wc -c < "$1" | tr -d '[:space:]'
}

DO_MONGO=0
DO_INFLUX=0
for arg in "$@"; do
  case "$arg" in
    --mongo) DO_MONGO=1 ;;
    --influx) DO_INFLUX=1 ;;
    *)
      echo "error: unknown argument: ${arg}" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at ${ENV_FILE}" >&2
  exit 1
fi

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"
require_ident POSTGRES_USER "$POSTGRES_USER"
require_ident POSTGRES_DB "$POSTGRES_DB"

UTC="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ ! "$UTC" =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
  echo "error: unexpected UTC timestamp: ${UTC}" >&2
  exit 1
fi

umask 077
mkdir -p "${ROOT_DIR}/backups/postgres"
DUMP="${ROOT_DIR}/backups/postgres/apiarena-${UTC}.dump"
COUNTS="${ROOT_DIR}/backups/postgres/apiarena-${UTC}.txt"

require_running "$PG_CONTAINER"
echo "Dumping Postgres database ${POSTGRES_DB} from ${PG_CONTAINER}"
if ! docker exec "$PG_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP"; then
  rm -f "$DUMP"
  echo "error: pg_dump failed" >&2
  exit 1
fi

SIZE="$(file_bytes "$DUMP")"
if [[ "$SIZE" -le 0 ]]; then
  rm -f "$DUMP"
  echo "error: dump is empty" >&2
  exit 1
fi

TOC="$(mktemp)"
trap 'rm -f "$TOC"' EXIT
if ! docker exec -i "$PG_CONTAINER" pg_restore --list < "$DUMP" > "$TOC"; then
  rm -f "$DUMP"
  echo "error: pg_restore --list failed" >&2
  exit 1
fi
if [[ ! -s "$TOC" ]]; then
  rm -f "$DUMP"
  echo "error: pg_restore --list produced no output" >&2
  exit 1
fi

COUNTS_TMP="$(mktemp)"
trap 'rm -f "$TOC" "$COUNTS_TMP"' EXIT
if ! docker exec -i "$PG_CONTAINER" \
  psql -v ON_ERROR_STOP=1 --no-psqlrc -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL' > "$COUNTS_TMP"
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
then
  echo "error: row-count query failed" >&2
  exit 1
fi

{
  echo "database: ${POSTGRES_DB}"
  echo "captured_at_utc: ${UTC}"
  echo "dump: $(basename "$DUMP")"
  echo "dump_bytes: ${SIZE}"
  echo
  cat "$COUNTS_TMP"
} > "$COUNTS"

echo "Postgres dump verified: ${DUMP} (${SIZE} bytes)"
echo "Row counts: ${COUNTS}"

if [[ "$DO_MONGO" -eq 1 ]]; then
  require_running "$MONGO_CONTAINER"
  mkdir -p "${ROOT_DIR}/backups/mongo"
  MONGO_ARCHIVE="${ROOT_DIR}/backups/mongo/${UTC}.archive.gz"
  echo "Dumping MongoDB from ${MONGO_CONTAINER}"
  # Credentials stay in the container environment. This script does not print them.
  if ! docker exec "$MONGO_CONTAINER" \
    sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --archive --gzip' \
    > "$MONGO_ARCHIVE"; then
    rm -f "$MONGO_ARCHIVE"
    echo "error: mongodump failed" >&2
    exit 1
  fi
  MONGO_SIZE="$(file_bytes "$MONGO_ARCHIVE")"
  if [[ "$MONGO_SIZE" -le 0 ]]; then
    rm -f "$MONGO_ARCHIVE"
    echo "error: mongo archive is empty" >&2
    exit 1
  fi
  if ! gzip -t "$MONGO_ARCHIVE"; then
    rm -f "$MONGO_ARCHIVE"
    echo "error: mongo archive failed gzip integrity check" >&2
    exit 1
  fi
  echo "Mongo archive verified: ${MONGO_ARCHIVE} (${MONGO_SIZE} bytes)"
fi

if [[ "$DO_INFLUX" -eq 1 ]]; then
  require_running "$INFLUX_CONTAINER"
  mkdir -p "${ROOT_DIR}/backups/influx"
  REMOTE="/tmp/apiarena-influx-${UTC}"
  DEST="${ROOT_DIR}/backups/influx/${UTC}"
  echo "Backing up InfluxDB from ${INFLUX_CONTAINER}"
  cleanup_influx() {
    docker exec "$INFLUX_CONTAINER" rm -rf "$REMOTE" || true
  }
  # Token stays in the container environment (INFLUX_TOKEN is mapped from it inside sh -c).
  if ! docker exec "$INFLUX_CONTAINER" \
    sh -c "INFLUX_TOKEN=\"\$DOCKER_INFLUXDB_INIT_ADMIN_TOKEN\" INFLUX_HOST=http://127.0.0.1:8086 influx backup ${REMOTE}"; then
    cleanup_influx
    echo "error: influx backup failed" >&2
    exit 1
  fi
  if ! docker cp "${INFLUX_CONTAINER}:${REMOTE}" "$DEST"; then
    cleanup_influx
    echo "error: failed to copy influx backup out of the container" >&2
    exit 1
  fi
  cleanup_influx
  influx_files=0
  if [[ -d "$DEST" ]]; then
    while IFS= read -r _; do
      influx_files=1
      break
    done < <(find "$DEST" -type f)
  fi
  if [[ "$influx_files" -ne 1 ]]; then
    echo "error: influx backup is empty" >&2
    exit 1
  fi
  echo "Influx backup verified: ${DEST}"
fi
