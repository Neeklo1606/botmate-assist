#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> botmate-assist bootstrap (Phase 0)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install: npm install -g pnpm"
  exit 1
fi

if command -v docker >/dev/null 2>&1; then
  echo "==> Starting postgres + redis (docker compose)"
  docker compose up -d postgres redis
elif [[ -x "$ROOT/scripts/infra-up.sh" ]]; then
  echo "==> Docker not found — starting user-local postgres/redis (scripts/infra-up.sh)"
  bash "$ROOT/scripts/infra-up.sh"
else
  echo "Warning: docker not found — skip postgres/redis (install Docker or run scripts/infra-bootstrap.sh)"
fi

copy_env() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$target" ]]; then
    cp "$example" "$target"
    echo "Created $target from example"
  fi
}

copy_env "$ROOT/apps/api/.env.example" "$ROOT/apps/api/.env"
copy_env "$ROOT/apps/web/.env.example" "$ROOT/apps/web/.env"

# Ensure secrets meet 32-char minimum for local dev
ensure_secret() {
  local file="$1"
  local key="$2"
  if grep -q "^${key}=replace-with" "$file" 2>/dev/null || ! grep -q "^${key}=" "$file"; then
    local val
    val="$(openssl rand -hex 24 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)"
    if grep -q "^${key}=" "$file"; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$file"
    else
      echo "${key}=${val}" >>"$file"
    fi
    echo "Generated ${key} in $(basename "$file")"
  fi
}

ensure_secret "$ROOT/apps/api/.env" "JWT_SECRET"
ensure_secret "$ROOT/apps/api/.env" "ENCRYPTION_MASTER_KEY"

echo "==> pnpm install"
pnpm install

echo "==> Prisma generate"
pnpm db:generate

if command -v docker >/dev/null 2>&1; then
  echo "==> Waiting for postgres..."
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U postgres -d botmate_assist >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
elif [[ -f "$ROOT/apps/api/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(DATABASE_URL|REDIS_URL)=' "$ROOT/apps/api/.env" | sed 's/^/export /')
  set +a
  PG_BIN="${BOTMATE_INFRA_DIR:-$HOME/.local/botmate-infra}/root/usr/lib/postgresql/18/bin"
  export LD_LIBRARY_PATH="${BOTMATE_INFRA_DIR:-$HOME/.local/botmate-infra}/root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
  for i in $(seq 1 30); do
    if [[ -x "$PG_BIN/pg_isready" ]] && "$PG_BIN/pg_isready" -h 127.0.0.1 -p 5432 -U postgres >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

if command -v docker >/dev/null 2>&1 || [[ -f "$ROOT/apps/api/.env" ]]; then
  echo "==> Prisma migrate deploy"
  DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/botmate_assist?schema=public}" \
    pnpm db:migrate:deploy || pnpm db:migrate
fi

echo "==> Build shared packages (typecheck)"
pnpm --filter @botmate/shared build
pnpm --filter @botmate/api-client build

echo ""
echo "Bootstrap complete."
echo "  pnpm start     — dev web + api"
echo "  pnpm dev:web   — frontend only"
echo "  pnpm dev:api   — API only"
