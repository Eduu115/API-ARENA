#!/usr/bin/env bash
# Fail if any Lighthouse category on the public routes drops under 90.
#
# Targets: /en/ /es/ /en/challenges /en/docs /en/login, mobile and desktop,
# categories performance, accessibility, best-practices, seo.
#
# Not in CI. Ten headless Chrome runs take about two minutes and need Chrome
# on the machine. The Docker nginx container is not required: this serves
# frontend/dist with gzip level 6 and the immutable /assets/ cache header
# from frontend/nginx.conf. /api/* is an empty JSON stub.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIN="${LIGHTHOUSE_MIN:-90}"
PORT="${LIGHTHOUSE_PORT:-4183}"
CHROME_PATH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if [[ ! -x "$CHROME_PATH" ]]; then
  echo "Chrome not found at $CHROME_PATH" >&2
  exit 1
fi

cd "$ROOT/frontend"
npm run build

node "$ROOT/scripts/lighthouse-static.mjs" "$ROOT/frontend/dist" "$PORT" 6 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/en/"; then
    break
  fi
  sleep 0.2
done

export CHROME_PATH
export NO_UPDATE_NOTIFIER=1
OUT="$(mktemp -d)"
FAIL=0

run() {
  local name="$1" url="$2" preset="${3:-}"
  local args=(
    --only-categories=performance,accessibility,best-practices,seo
    --output=json
    --output-path="$OUT/$name.json"
    --chrome-flags="--headless=new --no-sandbox --disable-gpu"
    --quiet
  )
  if [[ -n "$preset" ]]; then
    args+=(--preset="$preset")
  fi
  npx --yes lighthouse "$url" "${args[@]}"
  if ! node --input-type=module -e "
    import { readFileSync } from 'node:fs';
    const r = JSON.parse(readFileSync(process.argv[1], 'utf8'));
    const min = Number(process.argv[2]);
    const keys = ['performance','accessibility','best-practices','seo'];
    const parts = keys.map((k) => k + '=' + Math.round(r.categories[k].score * 100));
    console.log(process.argv[3] + ' ' + parts.join(' '));
    if (keys.some((k) => Math.round(r.categories[k].score * 100) < min)) process.exit(2);
  " "$OUT/$name.json" "$MIN" "$name"; then
    FAIL=1
  fi
}

BASE="http://127.0.0.1:${PORT}"
run en-mobile "$BASE/en/"
run es-mobile "$BASE/es/"
run en-challenges-mobile "$BASE/en/challenges"
run en-docs-mobile "$BASE/en/docs"
run en-login-mobile "$BASE/en/login"
run en-desktop "$BASE/en/" desktop
run es-desktop "$BASE/es/" desktop
run en-challenges-desktop "$BASE/en/challenges" desktop
run en-docs-desktop "$BASE/en/docs" desktop
run en-login-desktop "$BASE/en/login" desktop

if [[ "$FAIL" -ne 0 ]]; then
  echo "Lighthouse category dropped under ${MIN}" >&2
  exit 1
fi
echo "Lighthouse categories are at least ${MIN}"
