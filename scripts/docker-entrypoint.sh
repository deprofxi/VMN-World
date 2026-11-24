#!/bin/sh
set -e

# ==============================================================================
# VMN World Container Bootstrapper
# Automatically checks & applies database migrations and seed data on startup
# without requiring manual terminal access.
# ==============================================================================

if [ -n "$DATABASE_URL" ] && [ "$AUTO_MIGRATE" != "false" ]; then
  echo "[VMNL-BOOT] DATABASE_URL detected. Checking database migrations..."
  if [ -f "./node_modules/prisma/build/index.js" ]; then
    node ./node_modules/prisma/build/index.js migrate deploy || echo "[VMNL-BOOT] Migration notice: continuing boot..."
  elif command -v pnpm >/dev/null 2>&1; then
    pnpm exec prisma migrate deploy || echo "[VMNL-BOOT] Migration notice: continuing boot..."
  fi

  if [ "$AUTO_SEED" = "true" ]; then
    echo "[VMNL-BOOT] AUTO_SEED=true. Populating initial database records..."
    node dist/src/db/migrate-and-seed.js || echo "[VMNL-BOOT] Seed notice: continuing boot..."
  fi
fi

if command -v dumb-init >/dev/null 2>&1; then
  exec dumb-init -- "$@"
else
  exec "$@"
fi
