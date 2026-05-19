#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f apps/api/.env ]]; then
  echo "Run ./scripts/bootstrap.sh first"
  exit 1
fi

export PATH="/home/dsc-2/.local/node22/bin:${PATH:-}"

if ! (echo >/dev/tcp/127.0.0.1/5432) 2>/dev/null; then
  echo "Postgres not on :5432 — run: docker compose up -d postgres redis  OR  bash scripts/infra-up.sh"
fi
if ! (echo >/dev/tcp/127.0.0.1/6379) 2>/dev/null; then
  echo "Redis not on :6379 — run: docker compose up -d postgres redis  OR  bash scripts/infra-up.sh"
fi

echo "==> Starting dev (web + api + worker via turbo)"
exec pnpm dev
