#!/usr/bin/env bash
# Start local Postgres + Redis without Docker (WSL fallback).
# Prefer: docker compose up -d postgres redis
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA="${BOTMATE_INFRA_DIR:-$HOME/.local/botmate-infra}"
PGDATA="${BOTMATE_PGDATA:-$INFRA/data/pg18}"
PGPORT="${BOTMATE_PGPORT:-5432}"
REDIS_PORT="${BOTMATE_REDIS_PORT:-6379}"
RUN_DIR="$INFRA/run"
PG_BIN="$INFRA/root/usr/lib/postgresql/18/bin"
REDIS_BIN="${INFRA}/redis/bin/redis-server"
export LD_LIBRARY_PATH="${INFRA}/root/usr/lib/x86_64-linux-gnu:${INFRA}/root/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

mkdir -p "$RUN_DIR" "$(dirname "$PGDATA")"

port_open() {
  (echo >/dev/tcp/127.0.0.1/"$1") 2>/dev/null
}

start_redis() {
  if port_open "$REDIS_PORT"; then
    echo "Redis already listening on :$REDIS_PORT"
    return 0
  fi
  if [[ ! -x "$REDIS_BIN" ]]; then
    echo "Missing $REDIS_BIN — run scripts/infra-bootstrap.sh once"
    exit 1
  fi
  "$REDIS_BIN" "$INFRA/redis/redis.conf"
  for _ in $(seq 1 20); do
    port_open "$REDIS_PORT" && { echo "Redis up on :$REDIS_PORT"; return 0; }
    sleep 0.25
  done
  echo "Redis failed to start"
  exit 1
}

start_postgres() {
  if port_open "$PGPORT"; then
    echo "Postgres already listening on :$PGPORT"
    return 0
  fi
  if [[ ! -x "$PG_BIN/initdb" ]]; then
    echo "Missing Postgres binaries — run scripts/infra-bootstrap.sh once"
    exit 1
  fi
  if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
    echo "Initializing Postgres data at $PGDATA"
    "$PG_BIN/initdb" -D "$PGDATA" -U postgres --locale=C.UTF-8 --encoding=UTF8
    {
      echo "listen_addresses = '127.0.0.1'"
      echo "port = $PGPORT"
      echo "max_connections = 100"
    } >>"$PGDATA/postgresql.conf"
    sed -i "s|^#unix_socket_directories.*|unix_socket_directories = '$RUN_DIR'|" "$PGDATA/postgresql.conf" 2>/dev/null || \
      echo "unix_socket_directories = '$RUN_DIR'" >>"$PGDATA/postgresql.conf"
    echo "local all all trust" >"$PGDATA/pg_hba.conf"
    echo "host all all 127.0.0.1/32 trust" >>"$PGDATA/pg_hba.conf"
    echo "host all all ::1/128 trust" >>"$PGDATA/pg_hba.conf"
  fi
  if ! "$PG_BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    "$PG_BIN/pg_ctl" -D "$PGDATA" \
      -o "-c unix_socket_directories=$RUN_DIR -c listen_addresses=127.0.0.1 -c port=$PGPORT" \
      -l "$RUN_DIR/postgres.log" -w start
  fi
  for _ in $(seq 1 40); do
    if "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PGPORT" -U postgres >/dev/null 2>&1; then
      echo "Postgres up on :$PGPORT"
      break
    fi
    sleep 0.25
  done
  if ! "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PGPORT" -U postgres >/dev/null 2>&1; then
    echo "Postgres failed — see $RUN_DIR/postgres.log"
    tail -30 "$RUN_DIR/postgres.log" 2>/dev/null || true
    exit 1
  fi
  if ! "$PG_BIN/psql" -h 127.0.0.1 -p "$PGPORT" -U postgres -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='botmate_assist'" | grep -q 1; then
    "$PG_BIN/createdb" -h 127.0.0.1 -p "$PGPORT" -U postgres botmate_assist
    echo "Created database botmate_assist"
  fi
}

start_redis
start_postgres

echo ""
echo "Infra ready. DATABASE_URL=postgresql://postgres@localhost:${PGPORT}/botmate_assist?schema=public"
echo "              REDIS_URL=redis://localhost:${REDIS_PORT}"
