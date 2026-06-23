#!/bin/sh
# Aggregated gateway health: curl each service's internal actuator/health and write
# a single JSON snapshot that nginx serves at /api/gateway/health. Read-only, no
# sensitive data. P0 services failing => overall "degraded"; extras are flagged but
# do not drag overall down.
# ponytail: shell + a static file instead of a second container/microservice.
set -u

OUT=/var/cache/gateway-health.json
TMP="$OUT.tmp.$$"

# name:host:port — order is cosmetic only.
P0="auth:apiarena-auth:8081 challenge:apiarena-challenge:8082 submission:apiarena-submission:8083 leaderboard:apiarena-leaderboard:8087 notification:apiarena-notification:8090"
EXTRA="metrics:apiarena-metrics:8089 sandbox:apiarena-sandbox:8084 testing:apiarena-testing:8085 ai-review:apiarena-ai-review:8086"

http_code() {
  # $1 = host:port -> HTTP status as a base-10 int (0 on connect/timeout failure).
  code="$(curl -s -o /dev/null -m 2 -w '%{http_code}' "http://$1/actuator/health" 2>/dev/null)"
  echo $((10#${code:-0}))
}

services=""
overall="up"

for entry in $P0; do
  name="${entry%%:*}"; addr="${entry#*:}"
  code="$(http_code "$addr")"
  if [ "$code" = "200" ]; then status="up"; else status="degraded"; overall="degraded"; fi
  services="$services,\"$name\":{\"status\":\"$status\",\"http\":$code,\"critical\":true}"
done

for entry in $EXTRA; do
  name="${entry%%:*}"; addr="${entry#*:}"
  code="$(http_code "$addr")"
  if [ "$code" = "200" ]; then status="up"; else status="degraded"; fi
  services="$services,\"$name\":{\"status\":\"$status\",\"http\":$code,\"critical\":false}"
done

now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf '{"gateway":"up","checkedAt":"%s","overall":"%s","services":{%s}}\n' \
  "$now" "$overall" "${services#,}" > "$TMP"
mv "$TMP" "$OUT"
