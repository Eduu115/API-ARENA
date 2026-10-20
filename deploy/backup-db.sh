#!/usr/bin/env bash
# Pre-deploy backup for the production workflow (./deploy/backup-db.sh), also run
# daily by cron at 03:30. Dumps Postgres, MongoDB and the submission uploads volume
# to deploy/backups/ (NVMe) and mirrors each file to /mnt/nas/backups/apiarena/ when
# the HDD is mounted. Retention: 14 days on both sides.
#
# Postgres and MongoDB failures abort (no deploy without a database backup). Uploads
# are taken from the running submission container; if it is down, that part is
# skipped with a warning so the deploy that fixes it is not blocked.
#
# If /mnt/nas is not mounted, emits a GitHub Actions ::warning:: and continues:
# the local dump already exists and must not block the deploy.
#
# Maintainer notes (server):
#   - This file is versioned in the repo. After pull, ensure it is executable:
#       chmod +x deploy/backup-db.sh
#   - Create the NAS target once (HDD mounted): mkdir -p /mnt/nas/backups/apiarena
#   - If a custom untracked deploy/backup-db.sh already exists on the host, replace
#     it with this version (or merge the NAS block below) so the workflow picks it up.
#   - For InfluxDB dumps and row counts use scripts/db-backup.sh separately.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="${PROJECT_ROOT}/.env"
PG_CONTAINER="apiarena-postgres"
MONGO_CONTAINER="apiarena-mongo"
UPLOADS_CONTAINER="apiarena-submission"
UPLOADS_PATH="/app/uploads"
LOCAL_DIR="${PROJECT_ROOT}/deploy/backups"
NAS_MOUNT="/mnt/nas"
NAS_DIR="${NAS_MOUNT}/backups/apiarena"
RETENTION_DAYS=14

read_env() {
  local key="$1"
  local line value
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "error: .env not found at ${ENV_FILE}" >&2
    exit 1
  fi
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

file_bytes() {
  wc -c < "$1" | tr -d '[:space:]'
}

# Includes the pre-2026-10-20 naming (apiarena_pg_*, apiarena_mongo_*) so those
# files age out instead of piling up forever.
PRUNE_PATTERNS=('apiarena-*.dump' 'apiarena-mongo-*.archive.gz' 'apiarena-uploads-*.tar.gz'
                'apiarena_pg_*.sql.gz' 'apiarena_mongo_*.archive.gz')

prune_old() {
  local dir="$1" pattern
  [[ -d "$dir" ]] || return 0
  for pattern in "${PRUNE_PATTERNS[@]}"; do
    find "$dir" -maxdepth 1 -type f -name "$pattern" -mtime +"${RETENTION_DAYS}" -print -delete 2>/dev/null || true
  done
}

# Fails the run (and the deploy) unless the file is non-empty and valid gzip.
verify_gzip() {
  local file="$1" what="$2"
  if [[ "$(file_bytes "$file")" -le 0 ]] || ! gzip -t "$file" 2>/dev/null; then
    rm -f "$file"
    echo "error: ${what} backup is empty or not valid gzip" >&2
    exit 1
  fi
}

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"
require_ident POSTGRES_USER "$POSTGRES_USER"
require_ident POSTGRES_DB "$POSTGRES_DB"

for container in "$PG_CONTAINER" "$MONGO_CONTAINER"; do
  if ! docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx true; then
    echo "error: container ${container} is not running" >&2
    exit 1
  fi
done

UTC="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$LOCAL_DIR"
DUMP="${LOCAL_DIR}/apiarena-${UTC}.dump"
MONGO_DUMP="${LOCAL_DIR}/apiarena-mongo-${UTC}.archive.gz"
UPLOADS_TGZ="${LOCAL_DIR}/apiarena-uploads-${UTC}.tar.gz"
CREATED=()

echo "Dumping Postgres ${POSTGRES_DB} from ${PG_CONTAINER} → ${DUMP}"
if ! docker exec "$PG_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP"; then
  rm -f "$DUMP"
  echo "error: pg_dump failed" >&2
  exit 1
fi
if [[ "$(file_bytes "$DUMP")" -le 0 ]]; then
  rm -f "$DUMP"
  echo "error: dump is empty" >&2
  exit 1
fi
CREATED+=("$DUMP")
echo "Postgres dump verified: ${DUMP} ($(file_bytes "$DUMP") bytes)"

# Credentials stay inside the container: they come from its own environment.
echo "Dumping MongoDB from ${MONGO_CONTAINER} → ${MONGO_DUMP}"
if ! docker exec "$MONGO_CONTAINER" sh -c \
    'mongodump --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" \
               --authenticationDatabase admin --archive --gzip' > "$MONGO_DUMP"; then
  rm -f "$MONGO_DUMP"
  echo "error: mongodump failed" >&2
  exit 1
fi
verify_gzip "$MONGO_DUMP" MongoDB
CREATED+=("$MONGO_DUMP")
echo "MongoDB dump verified: ${MONGO_DUMP} ($(file_bytes "$MONGO_DUMP") bytes)"

if docker inspect -f '{{.State.Running}}' "$UPLOADS_CONTAINER" 2>/dev/null | grep -qx true; then
  echo "Archiving ${UPLOADS_PATH} from ${UPLOADS_CONTAINER} → ${UPLOADS_TGZ}"
  if ! docker exec "$UPLOADS_CONTAINER" tar -czf - -C "$UPLOADS_PATH" . > "$UPLOADS_TGZ"; then
    rm -f "$UPLOADS_TGZ"
    echo "error: uploads archive failed" >&2
    exit 1
  fi
  verify_gzip "$UPLOADS_TGZ" uploads
  CREATED+=("$UPLOADS_TGZ")
  echo "Uploads archive verified: ${UPLOADS_TGZ} ($(file_bytes "$UPLOADS_TGZ") bytes)"
else
  echo "::warning::${UPLOADS_CONTAINER} is not running; skipped the uploads archive"
fi

prune_old "$LOCAL_DIR"

# Mirror to HDD. Missing mount must not fail the deploy (local copy is enough).
if ! mountpoint -q "$NAS_MOUNT"; then
  echo "::warning::${NAS_MOUNT} is not mounted; skipped NAS mirror"
else
  mkdir -p "$NAS_DIR"
  for file in "${CREATED[@]}"; do
    nas_file="${NAS_DIR}/$(basename "$file")"
    if ! cp -p "$file" "$nas_file"; then
      echo "::warning::failed to copy ${file} to ${nas_file}; local backup kept"
    elif [[ "$(file_bytes "$nas_file")" != "$(file_bytes "$file")" ]]; then
      echo "::warning::NAS size mismatch for $(basename "$file"); local backup kept"
    else
      echo "NAS mirrored: ${nas_file} ($(file_bytes "$nas_file") bytes)"
    fi
  done
  prune_old "$NAS_DIR"
fi

echo "Backup done: ${#CREATED[@]} files (retention ${RETENTION_DAYS}d; NAS mirror when ${NAS_MOUNT} is mounted)"
