#!/usr/bin/env bash
# Pre-deploy sanity check for the server .env after the security hardening.
# Verifies the REQUIRED secrets are present and not a known default, without
# printing their values. Usage: ./scripts/check-server-env.sh [path-to-.env]
set -euo pipefail

ENV_FILE="${1:-.env}"
LEAKED_JWT="myjwtsecretkey123456789abcdefghijklmnopqrstuvwxyz"
DEFAULT_INTERNAL="apiarena-internal-token"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE not found" >&2
  exit 1
fi

# Read a KEY=value from the env file without sourcing it.
val() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- || true; }

fail=0
check_required() {
  local key="$1" bad="$2" min="$3" v
  v="$(val "$key")"
  if [ -z "$v" ]; then
    echo "✗ $key is missing (required)"; fail=1
  elif [ -n "$bad" ] && [ "$v" = "$bad" ]; then
    echo "✗ $key still uses the known default — rotate it"; fail=1
  elif [ -n "$min" ] && [ "${#v}" -lt "$min" ]; then
    echo "✗ $key too short (< $min chars)"; fail=1
  else
    echo "✓ $key set"
  fi
}

check_required JWT_SECRET "$LEAKED_JWT" 32
check_required INTERNAL_SERVICE_TOKEN "$DEFAULT_INTERNAL" 16
check_required POSTGRES_PASSWORD "" 1
check_required REDIS_PASSWORD "" 1

# Swagger should stay off in prod: warn if explicitly enabled.
if [ "$(val SPRINGDOC_ENABLED)" = "true" ]; then
  echo "⚠ SPRINGDOC_ENABLED=true — Swagger will be exposed; unset it for production"
fi

if [ "$fail" -ne 0 ]; then
  echo "Result: FAIL — fix the above before deploying." >&2
  exit 1
fi
echo "Result: OK — required secrets look good."
