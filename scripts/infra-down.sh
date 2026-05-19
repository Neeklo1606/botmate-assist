#!/usr/bin/env bash
set -euo pipefail
INFRA="${BOTMATE_INFRA_DIR:-$HOME/.local/botmate-infra}"
PGDATA="${BOTMATE_PGDATA:-$INFRA/data/pg18}"
PG_BIN="$INFRA/root/usr/lib/postgresql/18/bin"
REDIS_CLI="${INFRA}/redis/bin/redis-cli"
export LD_LIBRARY_PATH="${INFRA}/root/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

if [[ -x "$PG_BIN/pg_ctl" ]] && [[ -d "$PGDATA" ]]; then
  "$PG_BIN/pg_ctl" -D "$PGDATA" stop -m fast 2>/dev/null || true
fi
if [[ -x "$REDIS_CLI" ]]; then
  "$REDIS_CLI" -p "${BOTMATE_REDIS_PORT:-6379}" shutdown nosave 2>/dev/null || true
fi
echo "Infra stopped."
