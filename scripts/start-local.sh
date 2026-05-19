#!/usr/bin/env bash
# Full local stack: infra → migrate → seed → dev (api + web + worker).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.local/node22/bin:${PATH:-}"

if command -v docker >/dev/null 2>&1; then
  docker compose up -d postgres redis
else
  bash "$ROOT/scripts/infra-bootstrap.sh" 2>/dev/null || true
  bash "$ROOT/scripts/infra-up.sh"
fi

set -a
# shellcheck disable=SC1091
source <(grep -E '^(DATABASE_URL|REDIS_URL|ENABLE_DEV_SEED|DEV_SEED_)=' "$ROOT/apps/api/.env" 2>/dev/null || true)
set +a

pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed

echo ""
echo "Starting pnpm dev (api, web, worker)..."
exec pnpm dev
