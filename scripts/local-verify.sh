#!/usr/bin/env bash
# Local operational verification — requires Postgres + Redis (docker compose up -d postgres redis).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.local/node22/bin:${PATH:-}"

API="${VITE_API_URL:-http://127.0.0.1:3001}"
WEB="${VITE_SITE_URL:-http://127.0.0.1:8080}"

echo "==> Ports"
for p in 5432 6379 3001 8080; do
  if (echo >/dev/tcp/127.0.0.1/$p) 2>/dev/null; then echo "  $p open"; else echo "  $p CLOSED"; fi
done

echo "==> Health"
curl -sf "$API/health" | head -c 200; echo
curl -sf "$API/health/live" | head -c 200; echo
curl -sf "$API/health/ready" | head -c 400; echo || echo "  ready: FAIL (need Postgres)"
curl -sf "$API/health/runtime" | head -c 200; echo || echo "  runtime health: skip"

echo "==> Auth (dev seed)"
LOGIN=$(curl -sf -X POST "$API/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev@botmate.local","password":"devpassword12"}' 2>/dev/null || true)
if [[ -n "$LOGIN" ]]; then
  echo "  login OK"
else
  echo "  login FAIL — run: ENABLE_DEV_SEED=true pnpm db:seed after migrate"
fi

echo "==> Web"
curl -sf -o /dev/null -w "  web HTTP %{http_code}\n" "$WEB/" 2>/dev/null || echo "  web not running on $WEB"

echo "Done."
