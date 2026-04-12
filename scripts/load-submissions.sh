#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="${ZIP_PATH:-$ROOT_DIR/examples/e2e-valid-api.zip}"
EMAIL="${LOAD_USER_EMAIL:-arclight@apiarena.dev}"
PASSWORD="${LOAD_USER_PASSWORD:-Arena2025!}"
CHALLENGE_ID="${LOAD_CHALLENGE_ID:-1}"
COUNT="${LOAD_COUNT:-5}"
PARALLEL="${LOAD_PARALLEL:-2}"

if ! command -v curl >/dev/null || ! command -v jq >/dev/null; then
  echo "Required tools missing: curl and jq" >&2
  exit 1
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "ZIP not found at $ZIP_PATH" >&2
  exit 1
fi

token="$(curl -fsS -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.accessToken')"
if [ -z "$token" ] || [ "$token" = "null" ]; then
  echo "Login failed for load test user" >&2
  exit 1
fi

submit_one() {
  local idx="$1"
  local resp
  resp="$(curl -sS -X POST "http://localhost:8083/api/submissions?challengeId=$CHALLENGE_ID&developmentTimeSeconds=60" \
    -H "Authorization: Bearer $token" \
    -F "file=@$ZIP_PATH")"
  local sid
  sid="$(echo "$resp" | jq -r '.submissionId // empty')"
  if [ -z "$sid" ]; then
    echo "[LOAD] #$idx failed: $resp"
    return 0
  fi
  echo "[LOAD] #$idx created submission $sid"
}

export -f submit_one
export token ZIP_PATH CHALLENGE_ID

seq 1 "$COUNT" | xargs -I{} -P "$PARALLEL" bash -c 'submit_one "$@"' _ {} || true

echo "[LOAD] Done. Attempted $COUNT submissions (parallel=$PARALLEL)."
