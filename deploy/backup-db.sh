#!/usr/bin/env bash
# Pre-deploy Postgres backup for the production workflow (./deploy/backup-db.sh).
# Writes to deploy/backups/ (NVMe) and mirrors each dump to /mnt/nas/backups/apiarena/
# when the HDD is mounted. Retention: 14 days on both sides.
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
#   - For richer dumps (mongo/influx + row counts) use scripts/db-backup.sh separately.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="${PROJECT_ROOT}/.env"
PG_CONTAINER="apiarena-postgres"
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

prune_old() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  find "$dir" -maxdepth 1 -type f -name 'apiarena-*.dump' -mtime +"${RETENTION_DAYS}" -print -delete 2>/dev/null || true
}

POSTGRES_USER="$(read_env POSTGRES_USER)"
POSTGRES_DB="$(read_env POSTGRES_DB)"
require_ident POSTGRES_USER "$POSTGRES_USER"
require_ident POSTGRES_DB "$POSTGRES_DB"

if ! docker inspect -f '{{.State.Running}}' "$PG_CONTAINER" 2>/dev/null | grep -qx true; then
  echo "error: container ${PG_CONTAINER} is not running" >&2
  exit 1
fi

UTC="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$LOCAL_DIR"
DUMP="${LOCAL_DIR}/apiarena-${UTC}.dump"

echo "Dumping Postgres ${POSTGRES_DB} from ${PG_CONTAINER} → ${DUMP}"
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

echo "Local dump verified: ${DUMP} (${SIZE} bytes)"
prune_old "$LOCAL_DIR"

# Mirror to HDD. Missing mount must not fail the deploy (local copy is enough).
if ! mountpoint -q "$NAS_MOUNT"; then
  echo "::warning::${NAS_MOUNT} is not mounted; skipped NAS mirror of $(basename "$DUMP")"
else
  mkdir -p "$NAS_DIR"
  NAS_DUMP="${NAS_DIR}/$(basename "$DUMP")"
  if ! cp -p "$DUMP" "$NAS_DUMP"; then
    echo "::warning::failed to copy dump to ${NAS_DUMP}; local backup kept"
  else
    NAS_SIZE="$(file_bytes "$NAS_DUMP")"
    if [[ "$NAS_SIZE" != "$SIZE" ]]; then
      echo "::warning::NAS dump size mismatch (local=${SIZE} nas=${NAS_SIZE}); local backup kept"
    else
      echo "NAS dump mirrored: ${NAS_DUMP} (${NAS_SIZE} bytes)"
    fi
  fi
  prune_old "$NAS_DIR"
fi

echo "Backup done (retention ${RETENTION_DAYS}d; NAS mirror when ${NAS_MOUNT} is mounted)"
