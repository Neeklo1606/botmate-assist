#!/usr/bin/env bash
# One-time: build user-local Redis + extract Postgres debs (no sudo, no Docker).
set -euo pipefail

INFRA="${BOTMATE_INFRA_DIR:-$HOME/.local/botmate-infra}"
mkdir -p "$INFRA/src" "$INFRA/redis" "$INFRA/pgdeb" "$INFRA/root"

if command -v docker >/dev/null 2>&1; then
  echo "Docker found — use: docker compose up -d postgres redis"
  exit 0
fi

# Redis 7.2 from source
if [[ ! -x "$INFRA/redis/bin/redis-server" ]]; then
  cd "$INFRA/src"
  curl -fsSL -L -o redis-7.2.7.tar.gz https://github.com/redis/redis/archive/refs/tags/7.2.7.tar.gz
  rm -rf redis-7.2.7
  tar xzf redis-7.2.7.tar.gz
  make -C redis-7.2.7 -j"$(nproc)"
  mkdir -p "$INFRA/redis/bin"
  cp redis-7.2.7/src/redis-server redis-7.2.7/src/redis-cli "$INFRA/redis/bin/"
fi

cat >"$INFRA/redis/redis.conf" <<EOF
port ${BOTMATE_REDIS_PORT:-6379}
bind 127.0.0.1
daemonize yes
dir $INFRA/data/redis
dbfilename dump.rdb
pidfile $INFRA/run/redis.pid
logfile $INFRA/run/redis.log
EOF
mkdir -p "$INFRA/data/redis" "$INFRA/run"

# Postgres 18 client+server via apt download (no install)
if [[ ! -x "$INFRA/root/usr/lib/postgresql/18/bin/postgres" ]]; then
  cd "$INFRA/pgdeb"
  apt download postgresql-18 postgresql-client-18 2>/dev/null || true
  DEPS=$(apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances postgresql-18 2>/dev/null | grep "^\w" | sort -u || true)
  for p in $DEPS; do apt download "$p" 2>/dev/null || true; done
  for deb in *.deb; do dpkg-deb -x "$deb" "$INFRA/root" 2>/dev/null || true; done
  apt download postgresql-server-dev-18 2>/dev/null || true
  dpkg-deb -x postgresql-server-dev-18_*.deb "$INFRA/root" 2>/dev/null || true
fi

# pgvector (optional; required for knowledge migrations)
if [[ ! -f "$INFRA/root/usr/share/postgresql/18/extension/vector.control" ]] && [[ -x "$INFRA/root/usr/lib/postgresql/18/bin/pg_config" ]]; then
  cd "$INFRA/src"
  if [[ ! -d pgvector ]]; then
    git clone --depth 1 https://github.com/pgvector/pgvector.git
  fi
  make -C pgvector PG_CONFIG="$INFRA/root/usr/lib/postgresql/18/bin/pg_config" vector.so 2>/dev/null || \
    make -C pgvector PG_CONFIG="$INFRA/root/usr/lib/postgresql/18/bin/pg_config" 2>/dev/null || true
  EXT="$INFRA/root/usr/share/postgresql/18/extension"
  LIB="$INFRA/root/usr/lib/postgresql/18/lib"
  mkdir -p "$EXT" "$LIB"
  cp -f pgvector/vector.so "$LIB/" 2>/dev/null || true
  cp -f pgvector/vector.control pgvector/sql/*.sql "$EXT/" 2>/dev/null || true
fi

echo "Infra bootstrap done. Run: bash scripts/infra-up.sh"
