#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="${ZIP_PATH:-$ROOT_DIR/examples/e2e-valid-api.zip}"
PASSWORD="${E2E_PASSWORD:-Arena2025!}"

if ! command -v curl >/dev/null || ! command -v jq >/dev/null; then
  echo "Required tools missing: curl and jq" >&2
  exit 1
fi

if [ ! -f "$ZIP_PATH" ]; then
  echo "ZIP not found at $ZIP_PATH" >&2
  exit 1
fi

timestamp="$(date +%s)"
email="e2e.${timestamp}@apiarena.dev"
username="e2e_${timestamp}"

echo "[E2E] register $email"
curl -fsS -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"STUDENT\"}" >/tmp/e2e_register.json

verify_token="$(docker exec apiarena-postgres psql -U "${POSTGRES_USER:-apiarena_user}" -d "${POSTGRES_DB:-apiarena}" -t -A \
  -c "SELECT email_verification_token FROM users WHERE email='$email' ORDER BY id DESC LIMIT 1;")"
if [ -z "$verify_token" ]; then
  echo "Could not retrieve verification token from DB" >&2
  exit 1
fi

echo "[E2E] verify email"
curl -fsS "http://localhost:8081/api/auth/verify-email?token=$verify_token" >/tmp/e2e_verify.json

echo "[E2E] login"
access_token="$(curl -fsS -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}" | jq -r '.accessToken')"
if [ -z "$access_token" ] || [ "$access_token" = "null" ]; then
  echo "Login failed" >&2
  exit 1
fi

user_id="$(curl -fsS -H "Authorization: Bearer $access_token" http://localhost:8081/api/auth/me | jq -r '.id')"
challenge_id="$(curl -fsS http://localhost:8082/api/challenges | jq -r '.[0].id')"
if [ -z "$challenge_id" ] || [ "$challenge_id" = "null" ]; then
  echo "No challenge available" >&2
  exit 1
fi

echo "[E2E] submit challenge=$challenge_id"
submit_resp="$(curl -sS -X POST "http://localhost:8083/api/submissions?challengeId=$challenge_id&developmentTimeSeconds=180" \
  -H "Authorization: Bearer $access_token" \
  -F "file=@$ZIP_PATH")"
submission_id="$(echo "$submit_resp" | jq -r '.submissionId // empty')"
if [ -z "$submission_id" ]; then
  echo "Submission creation failed: $submit_resp" >&2
  exit 1
fi

status=""
for i in $(seq 1 180); do
  status="$(curl -fsS -H "Authorization: Bearer $access_token" "http://localhost:8083/api/submissions/$submission_id" | jq -r '.status')"
  if [ "$status" = "COMPLETED" ] || [ "$status" = "FAILED" ]; then
    break
  fi
  sleep 2
done

echo "[E2E] status=$status submission=$submission_id"
if [ "$status" != "COMPLETED" ]; then
  echo "Submission did not complete successfully" >&2
  exit 1
fi

replay_events="$(curl -fsS -H "Authorization: Bearer $access_token" \
  "http://localhost:8083/api/submissions/$submission_id/replay" | jq -r '.events | length')"
if [ "$replay_events" -lt 1 ]; then
  echo "Replay has no events" >&2
  exit 1
fi

leaderboard_user="$(curl -fsS "http://localhost:8087/api/leaderboard/challenge/$challenge_id/user/$user_id" | jq -r '.userId // empty')"
if [ "$leaderboard_user" != "$user_id" ]; then
  echo "Leaderboard entry not found for user $user_id" >&2
  exit 1
fi

notifications_total="$(curl -fsS -H "Authorization: Bearer $access_token" \
  "http://localhost:8090/api/notifications/me?page=0&size=20" | jq -r '.totalElements')"

echo "[E2E] OK user=$user_id challenge=$challenge_id submission=$submission_id replayEvents=$replay_events notifications=$notifications_total"
