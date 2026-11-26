#!/bin/sh
set -e

# ==============================================================================
# VMN World Container Bootstrapper
# Strict Fail-Fast Validation: No explicit fallback secrets or dummy data.
# In case of missing required configuration, throws a clear error and halts.
# ==============================================================================

if [ -z "$DATABASE_URL" ]; then
  echo "[FATAL] DATABASE_URL is required but was not provided in the environment." >&2
  echo "[FATAL] In Coolify, configure DATABASE_URL under Environment Variables." >&2
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "[FATAL] JWT_SECRET is required (min 32 characters) but was not provided." >&2
  echo "[FATAL] In Coolify, configure JWT_SECRET under Environment Variables." >&2
  exit 1
fi

if [ "$AUTO_MIGRATE" != "false" ]; then
  echo "[VMNL-BOOT] Checking and applying database migrations..."
  if [ -f "/opt/prisma/node_modules/prisma/build/index.js" ]; then
    NODE_PATH=/opt/prisma/node_modules node /opt/prisma/node_modules/prisma/build/index.js migrate deploy
  elif [ -f "./node_modules/prisma/build/index.js" ]; then
    node ./node_modules/prisma/build/index.js migrate deploy
  elif command -v pnpm >/dev/null 2>&1; then
    pnpm exec prisma migrate deploy
  else
    echo "[FATAL] Prisma CLI not found to run migrations." >&2
    exit 1
  fi
fi

if [ "$AUTO_SEED" = "true" ]; then
  echo "[VMNL-BOOT] AUTO_SEED=true: Populating database records..."
  node dist/src/db/migrate-and-seed.js
fi

if command -v dumb-init >/dev/null 2>&1; then
  exec dumb-init -- "$@"
else
  exec "$@"
fi
