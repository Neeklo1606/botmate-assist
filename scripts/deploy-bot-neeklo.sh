#!/usr/bin/env bash
# Deploy botmate-assist to bot.neeklo.ru on Beget VPS (212.67.9.173).
# Safe: does not modify neeklo.ru nginx cert, pm2 neeklo-api, or /var/www/neeklo.ru.
set -euo pipefail

DOMAIN="bot.neeklo.ru"
APP_DIR="/var/www/bot.neeklo.ru"
REPO="${BOTMATE_REPO:-https://github.com/Neeklo1606/botmate-assist.git}"
BRANCH="${BOTMATE_BRANCH:-main}"
API_PORT=3002
NGINX_SITE="bot.neeklo.ru"
DEPLOY_USER="${SUDO_USER:-root}"

need_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "Run as root on the server: sudo bash scripts/deploy-bot-neeklo.sh"
    exit 1
  fi
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && [[ "$(node -p "process.versions.node.split('.')[0]")" -ge 22 ]]; then
    return 0
  fi
  echo "==> Installing Node.js 22 (nodesource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  corepack enable
  corepack prepare pnpm@10.12.1 --activate
}

ensure_pgvector() {
  if dpkg -s postgresql-16-pgvector >/dev/null 2>&1; then
    return 0
  fi
  echo "==> Installing postgresql-16-pgvector"
  apt-get update -qq
  apt-get install -y postgresql-16-pgvector
}

ensure_db() {
  local pw_file="$APP_DIR/deploy/bot.neeklo.ru/.db_password"
  if [[ ! -f "$pw_file" ]]; then
    openssl rand -hex 24 >"$pw_file"
    chmod 600 "$pw_file"
  fi
  local db_pw
  db_pw="$(cat "$pw_file")"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'botmate') THEN
    CREATE ROLE botmate LOGIN PASSWORD '${db_pw}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE botmate_assist OWNER botmate'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'botmate_assist')\gexec
SQL
  sudo -u postgres psql -d botmate_assist -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector;" >/dev/null
}

write_env_if_missing() {
  local db_pw="$1"
  local api_env="$APP_DIR/apps/api/.env"
  local web_env="$APP_DIR/apps/web/.env"
  if [[ -f "$api_env" ]]; then
    echo "==> Keeping existing $api_env"
    return 0
  fi
  local jwt enc
  jwt="$(openssl rand -hex 32)"
  enc="$(openssl rand -hex 32)"
  mkdir -p "$(dirname "$api_env")"
  cat >"$api_env" <<EOF
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=postgresql://botmate:${db_pw}@127.0.0.1:5432/botmate_assist?schema=public
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=${jwt}
ENCRYPTION_MASTER_KEY=${enc}
ALLOWED_ORIGINS=https://${DOMAIN}
BOTMATE_WEB_ORIGIN=https://${DOMAIN}
BOTMATE_PRODUCTION_STRICT=true
BOTMATE_WORKER_REJECT_STUB=true
BOTMATE_RUNTIME_TENANT_API=true
BOTMATE_REALTIME_EVENT_FRAME=true
BOTMATE_REALTIME_BLOCK_TENANT_MISMATCH=true
ENABLE_DEV_SEED=false
ENABLE_DEMO_SEED=false
EOF
  chmod 600 "$api_env"
  cat >"$web_env" <<EOF
VITE_API_URL=https://${DOMAIN}
VITE_SITE_URL=https://${DOMAIN}
VITE_USE_REAL_AUTH=true
VITE_PRODUCTION_STRICT=true
VITE_PROJECTS_DATA_SOURCE=api
VITE_ASSISTANTS_DATA_SOURCE=api
VITE_CHAT_DATA_SOURCE=api
VITE_LEADS_DATA_SOURCE=api
VITE_REALTIME_ENABLED=true
VITE_RUNTIME_TENANT_UI=true
VITE_RUNTIME_WORKSPACE_UI=true
EOF
  echo "==> Created production .env files"
}

clone_or_pull() {
  if [[ -d "$APP_DIR/.git" ]]; then
    echo "==> git pull in $APP_DIR"
    git -C "$APP_DIR" fetch origin
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
  else
    echo "==> git clone into $APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  fi
}

build_app() {
  cd "$APP_DIR"
  export NODE_ENV=production
  pnpm install --frozen-lockfile
  pnpm db:generate
  DATABASE_URL="$(grep '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)" pnpm db:migrate:deploy
  pnpm --filter @botmate/shared build
  pnpm --filter @botmate/api-client build
  # Web: TanStack Start (Cloudflare worker build) — served via Vite on :8082 in PM2
  pnpm --filter @botmate/web build || echo "WARN: web build optional for vite dev mode"
}

redis_up() {
  cd "$APP_DIR/deploy/bot.neeklo.ru"
  docker compose up -d
}

pm2_reload() {
  cd "$APP_DIR"
  # PM2 ecosystem uses absolute paths under /var/www/bot.neeklo.ru
  if pm2 describe botmate-api >/dev/null 2>&1; then
    pm2 delete botmate-api botmate-web botmate-worker 2>/dev/null || true
  fi
  pm2 start deploy/bot.neeklo.ru/ecosystem.config.cjs
  pm2 save
}

nginx_setup() {
  local src="$APP_DIR/deploy/bot.neeklo.ru/nginx.conf"
  local dest="/etc/nginx/sites-available/${NGINX_SITE}"
  cp "$src" "$dest"
  ln -sf "$dest" "/etc/nginx/sites-enabled/${NGINX_SITE}"
  mkdir -p /var/www/certbot

  if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    echo "==> Obtaining certificate for ${DOMAIN} only"
    # Temporary HTTP-only for certbot if SSL paths missing
    sed -n '1,/^server {/p' "$dest" | head -n -1 >"/tmp/${NGINX_SITE}.bootstrap"
    cat >>"/tmp/${NGINX_SITE}.bootstrap" <<'BOOT'
server {
    listen 80;
    listen [::]:80;
    server_name bot.neeklo.ru;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'ok'; add_header Content-Type text/plain; }
}
BOOT
    cp "/tmp/${NGINX_SITE}.bootstrap" "$dest"
    nginx -t && systemctl reload nginx
    certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
      --non-interactive --agree-tos -m "admin@${DOMAIN}" || \
      certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}"
    cp "$src" "$dest"
  fi

  nginx -t
  systemctl reload nginx
}

smoke() {
  curl -sf "http://127.0.0.1:${API_PORT}/health" | head -c 120
  echo ""
  curl -sf -o /dev/null -w "https://${DOMAIN}/ %{http_code}\n" "https://${DOMAIN}/" || true
}

main() {
  need_root
  ensure_node
  ensure_pgvector
  clone_or_pull
  local db_pw
  db_pw="$(ensure_db)"
  write_env_if_missing "$db_pw"
  redis_up
  build_app
  pm2_reload
  nginx_setup
  smoke
  echo ""
  echo "Deploy complete: https://${DOMAIN}"
  echo "PM2: botmate-api (:${API_PORT}), botmate-worker"
  echo "Unchanged: neeklo.ru, neeklo-api:3001"
}

main "$@"
