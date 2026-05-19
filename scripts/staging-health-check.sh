#!/usr/bin/env bash
# Phase 12A — staging / pre-launch health validation (read-only).
# Usage: API_BASE=https://staging-api.example ./scripts/staging-health-check.sh

set -euo pipefail

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
  if command -v jq >/dev/null 2>&1; then
    jq -c '.' "$tmp" 2>/dev/null | head -c 4000
    echo ""
  fi
  rm -f "$tmp"
}

echo "=== Botmate staging health check ==="
echo "API_BASE=$API_BASE"
echo ""

check "liveness" "/health"
check "runtime full" "/health/runtime"
check "runtime executions" "/health/runtime/executions"
check "runtime queues" "/health/runtime/queues"
check "runtime realtime" "/health/runtime/realtime"

echo ""
if [[ "$FAIL" -ne 0 ]]; then
  echo "One or more checks failed."
  exit 1
fi
echo "All checks returned HTTP 200."
