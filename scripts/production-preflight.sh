#!/usr/bin/env bash
# Phase 12B — production preflight (read-only HTTP checks + optional strict env audit).
#
# Usage:
#   API_BASE=https://api.example.com ./scripts/production-preflight.sh
#   STRICT_ENV_FILE=apps/api/.env ./scripts/production-preflight.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE="${API_BASE:-http://localhost:3001}"
FAIL=0

check() {
  local name="$1"
  local path="$2"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(curl -sS -o "$tmp" -w "%{http_code}" "${API_BASE}${path}" || echo "000")"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $name HTTP $code"
    cat "$tmp" 2>/dev/null || true
    FAIL=1
    rm -f "$tmp"
    return
  fi
  echo "OK   $name"
  rm -f "$tmp"
}

echo "=== Botmate production preflight ==="
echo "API_BASE=$API_BASE"
echo ""

check "liveness" "/health"
check "runtime aggregate" "/health/runtime"
check "runtime executions" "/health/runtime/executions"
check "runtime queues" "/health/runtime/queues"
check "runtime realtime" "/health/runtime/realtime"

if [[ -n "${STRICT_ENV_FILE:-}" && -f "$STRICT_ENV_FILE" ]]; then
  echo ""
  echo "=== Strict env audit ($STRICT_ENV_FILE) ==="
  for key in BOTMATE_PRODUCTION_STRICT BOTMATE_RUNTIME_TENANT_API BOTMATE_WORKER_REJECT_STUB; do
    if grep -qE "^${key}=true" "$STRICT_ENV_FILE" 2>/dev/null; then
      echo "OK   $key=true"
    else
      echo "WARN $key is not true (recommended for first production tenants)"
    fi
  done
  if grep -qE "^ENABLE_DEV_SEED=true" "$STRICT_ENV_FILE" 2>/dev/null; then
    echo "FAIL ENABLE_DEV_SEED must not be true in production"
    FAIL=1
  fi
  if grep -qE "^ENABLE_DEMO_SEED=true" "$STRICT_ENV_FILE" 2>/dev/null; then
    echo "WARN ENABLE_DEMO_SEED=true — demo data only, not for customer tenants"
  fi
fi

echo ""
if [[ "$FAIL" -ne 0 ]]; then
  echo "Preflight failed."
  exit 1
fi
echo "Preflight passed (HTTP). Complete worker, TLS, backup, and sign-off per PRELAUNCH_SIGNOFF.md."
