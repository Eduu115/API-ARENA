#!/usr/bin/env bash
# End-to-end smoke: register → verify email (DB token) → login → submit ZIP →
# wait for COMPLETED → replay + leaderboard + notifications.
# Requires the Docker stack published on localhost (see .env.example ports).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="${ZIP_PATH:-$ROOT_DIR/examples/todo-crud-api.zip}"
CHALLENGE_SLUG="${E2E_CHALLENGE_SLUG:-todo-crud}"
PASSWORD="${E2E_PASSWORD:-Arena2025!}"
# Cloudflare Turnstile dummy token (works with test secret 1x000...AA in CI).
TURNSTILE_TOKEN="${E2E_TURNSTILE_TOKEN:-XXXX.DUMMY.TOKEN.XXXX}"

AUTH_URL="${AUTH_URL:-http://localhost:8081}"
CHALLENGE_URL="${CHALLENGE_URL:-http://localhost:8082}"
SUBMISSION_URL="${SUBMISSION_URL:-http://localhost:8083}"
LEADERBOARD_URL="${LEADERBOARD_URL:-http://localhost:8087}"
NOTIFICATION_URL="${NOTIFICATION_URL:-http://localhost:8090}"

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
curl -fsS -X POST "$AUTH_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$PASSWORD\",\"role\":\"STUDENT\",\"dateOfBirth\":\"2000-01-01\",\"acceptTerms\":true,\"turnstileToken\":\"$TURNSTILE_TOKEN\"}" >/tmp/e2e_register.json

verify_token="$(docker exec apiarena-postgres psql -U "${POSTGRES_USER:-apiarena_user}" -d "${POSTGRES_DB:-apiarena}" -t -A \
  -c "SELECT email_verification_token FROM users WHERE email='$email' ORDER BY id DESC LIMIT 1;")"
if [ -z "$verify_token" ]; then
  echo "Could not retrieve verification token from DB" >&2
  exit 1
fi

echo "[E2E] verify email"
curl -fsS "$AUTH_URL/api/auth/verify-email?token=$verify_token" >/tmp/e2e_verify.json

echo "[E2E] login"
access_token="$(curl -fsS -X POST "$AUTH_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"turnstileToken\":\"$TURNSTILE_TOKEN\"}" | jq -r '.accessToken')"
if [ -z "$access_token" ] || [ "$access_token" = "null" ]; then
  echo "Login failed" >&2
  exit 1
fi

user_id="$(curl -fsS -H "Authorization: Bearer $access_token" "$AUTH_URL/api/auth/me" | jq -r '.id')"
challenge_id="$(curl -fsS "$CHALLENGE_URL/api/challenges" | jq -r --arg slug "$CHALLENGE_SLUG" '.[] | select(.slug == $slug) | .id' | head -n1)"
if [ -z "$challenge_id" ] || [ "$challenge_id" = "null" ]; then
  echo "Challenge not found for slug=$CHALLENGE_SLUG" >&2
  exit 1
fi

echo "[E2E] submit challenge=$challenge_id slug=$CHALLENGE_SLUG zip=$(basename "$ZIP_PATH")"
submit_resp="$(curl -sS -X POST "$SUBMISSION_URL/api/submissions?challengeId=$challenge_id&developmentTimeSeconds=180" \
  -H "Authorization: Bearer $access_token" \
  -F "file=@$ZIP_PATH")"
submission_id="$(echo "$submit_resp" | jq -r '.submissionId // empty')"
if [ -z "$submission_id" ]; then
  echo "Submission creation failed: $submit_resp" >&2
  exit 1
fi

status=""
for i in $(seq 1 180); do
  status="$(curl -fsS -H "Authorization: Bearer $access_token" "$SUBMISSION_URL/api/submissions/$submission_id" | jq -r '.status')"
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
  "$SUBMISSION_URL/api/submissions/$submission_id/replay" | jq -r '.events | length')"
if [ "$replay_events" -lt 1 ]; then
  echo "Replay has no events" >&2
  exit 1
fi

leaderboard_user=""
for i in $(seq 1 30); do
  leaderboard_user="$(curl -fsS "$LEADERBOARD_URL/api/leaderboard/challenge/$challenge_id/user/$user_id" 2>/dev/null | jq -r '.userId // empty' || true)"
  if [ "$leaderboard_user" = "$user_id" ]; then
    break
  fi
  sleep 2
done
if [ "$leaderboard_user" != "$user_id" ]; then
  echo "Leaderboard entry not found for user $user_id (Kafka consumer may be slow)" >&2
  exit 1
fi

notifications_total="$(curl -fsS -H "Authorization: Bearer $access_token" \
  "$NOTIFICATION_URL/api/notifications/me?page=0&size=20" | jq -r '.totalElements')"

echo "[E2E] OK user=$user_id challenge=$challenge_id submission=$submission_id replayEvents=$replay_events notifications=$notifications_total"
