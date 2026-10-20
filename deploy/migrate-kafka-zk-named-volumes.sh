#!/usr/bin/env bash
# Migrate Kafka + ZooKeeper from anonymous Docker volumes to named Compose volumes.
#
# Usage (from repo root, on the production host):
#   ./deploy/migrate-kafka-zk-named-volumes.sh --dry-run
#   ./deploy/migrate-kafka-zk-named-volumes.sh
#
# Prerequisites:
#   - kafka and zookeeper containers STOPPED (compose stop kafka zookeeper)
#   - named volumes declared in docker-compose.yml (kafka_data, zookeeper_data, zookeeper_log)
#   - never run docker compose down -v
#
# This script never deletes the old anonymous volumes (48h soak, then runbook cleanup).

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DRY_RUN=0
NAS_DIR="/mnt/nas/backups/apiarena"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-api-arena}"

KAFKA_CTR="${KAFKA_CONTAINER:-apiarena-kafka}"
ZK_CTR="${ZOOKEEPER_CONTAINER:-apiarena-zookeeper}"

NAMED_KAFKA="${NAMED_KAFKA_VOLUME:-${COMPOSE_PROJECT}_kafka_data}"
NAMED_ZK_DATA="${NAMED_ZK_DATA_VOLUME:-${COMPOSE_PROJECT}_zookeeper_data}"
NAMED_ZK_LOG="${NAMED_ZK_LOG_VOLUME:-${COMPOSE_PROJECT}_zookeeper_log}"

KAFKA_MOUNT="/var/lib/kafka/data"
ZK_DATA_MOUNT="/var/lib/zookeeper/data"
ZK_LOG_MOUNT="/var/lib/zookeeper/log"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

log() { printf '[migrate-kafka-zk] %s\n' "$*"; }
die() { printf '[migrate-kafka-zk] ERROR: %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

volume_for_mount() {
  local ctr="$1" dest="$2"
  docker inspect -f '{{range .Mounts}}{{println .Destination " " .Name " " .Source}}{{end}}' "$ctr" \
    | awk -v dest="$dest" '$1==dest {print $2; exit}'
}

container_running() {
  local st
  st="$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null || echo false)"
  [[ "$st" == "true" ]]
}

require_cmd docker
require_cmd tar

docker inspect "$KAFKA_CTR" >/dev/null 2>&1 || die "container not found: $KAFKA_CTR"
docker inspect "$ZK_CTR" >/dev/null 2>&1 || die "container not found: $ZK_CTR"

if container_running "$KAFKA_CTR" || container_running "$ZK_CTR"; then
  die "Stop both first: docker compose stop kafka zookeeper (found a running kafka/zk container)"
fi

KAFKA_ANON="$(volume_for_mount "$KAFKA_CTR" "$KAFKA_MOUNT")"
ZK_DATA_ANON="$(volume_for_mount "$ZK_CTR" "$ZK_DATA_MOUNT")"
ZK_LOG_ANON="$(volume_for_mount "$ZK_CTR" "$ZK_LOG_MOUNT")"

[[ -n "$KAFKA_ANON" ]] || die "Could not resolve anonymous volume for $KAFKA_CTR:$KAFKA_MOUNT"
[[ -n "$ZK_DATA_ANON" ]] || die "Could not resolve anonymous volume for $ZK_CTR:$ZK_DATA_MOUNT"
[[ -n "$ZK_LOG_ANON" ]] || die "Could not resolve anonymous volume for $ZK_CTR:$ZK_LOG_MOUNT"

log "Plan:"
log "  kafka anon=$KAFKA_ANON -> named=$NAMED_KAFKA ($KAFKA_MOUNT)"
log "  zk data anon=$ZK_DATA_ANON -> named=$NAMED_ZK_DATA ($ZK_DATA_MOUNT)"
log "  zk log  anon=$ZK_LOG_ANON -> named=$NAMED_ZK_LOG ($ZK_LOG_MOUNT)"
log "  backup stamp=$STAMP nas=$NAS_DIR"

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry-run only; no changes made."
  exit 0
fi

BACKUP_ROOT=""
if mountpoint -q /mnt/nas 2>/dev/null; then
  mkdir -p "$NAS_DIR"
  BACKUP_ROOT="$NAS_DIR"
else
  log "::warning:: /mnt/nas not mounted; writing tar backups under deploy/backups/kafka-zk/"
  BACKUP_ROOT="$PROJECT_ROOT/deploy/backups/kafka-zk"
  mkdir -p "$BACKUP_ROOT"
fi

backup_volume() {
  local vol="$1" label="$2"
  local out="$BACKUP_ROOT/${label}-${STAMP}.tgz"
  log "Backing up $vol -> $out"
  docker run --rm \
    -v "${vol}:/from:ro" \
    -v "${BACKUP_ROOT}:/to" \
    alpine:3.20 \
    tar czf "/to/$(basename "$out")" -C /from .
  local sz
  sz="$(wc -c <"$out" | tr -d ' ')"
  [[ "$sz" -gt 0 ]] || die "Backup empty: $out"
  log "Backup OK ($sz bytes): $out"
}

copy_volume() {
  local src="$1" dst="$2"
  log "Copy $src -> $dst"
  docker volume create "$dst" >/dev/null
  docker run --rm \
    -v "${src}:/from:ro" \
    -v "${dst}:/to" \
    alpine:3.20 \
    sh -c 'cd /from && tar cf - . | tar xf - -C /to'
  local count
  count="$(docker run --rm -v "${dst}:/to" alpine:3.20 sh -c 'find /to -type f | wc -l' | tr -d ' ')"
  log "Named volume $dst has $count files"
  [[ "$count" -gt 0 ]] || die "Copy produced empty volume: $dst"
}

backup_volume "$KAFKA_ANON" "kafka-data"
backup_volume "$ZK_DATA_ANON" "zookeeper-data"
backup_volume "$ZK_LOG_ANON" "zookeeper-log"

copy_volume "$KAFKA_ANON" "$NAMED_KAFKA"
copy_volume "$ZK_DATA_ANON" "$NAMED_ZK_DATA"
copy_volume "$ZK_LOG_ANON" "$NAMED_ZK_LOG"

log "Done. Next: docker compose up -d zookeeper kafka"
log "Do NOT delete anonymous volumes yet (soak ≥48h). See docs/runbooks/d1-d2-cutover.md"
log "Anonymous volumes retained: $KAFKA_ANON $ZK_DATA_ANON $ZK_LOG_ANON"
