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

if [ -z "${VMNL_SEED_USERS_JSON:-}" ]; then
  SEED_FILE="/app/data/bootstrap-admin.json"
  if [ ! -f "$SEED_FILE" ]; then
    echo "[VMNL-BOOT] Generating initial SuperAdmin credentials in $SEED_FILE..."
    VMNL_SEED_USERS_JSON="$(node -e '
      const fs = require("node:fs");
      const crypto = require("node:crypto");
      const bcrypt = require("bcryptjs");
      const email = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@vmnl.ng";
      const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || crypto.randomBytes(15).toString("base64url");
      const passwordHash = bcrypt.hashSync(password, 12);
      const records = [{ email, roles: ["SuperAdmin"], passwordHash }];
      fs.mkdirSync("/app/data", { recursive: true });
      fs.writeFileSync(process.argv[1], JSON.stringify(records), { mode: 0o600 });
      console.error("[VMNL-BOOT] ============================================================");
      console.error("[VMNL-BOOT] Initial SuperAdmin provisioned (save these credentials):");
      console.error("[VMNL-BOOT]   Email:    " + email);
      console.error("[VMNL-BOOT]   Password: " + password);
      console.error("[VMNL-BOOT] ============================================================");
      process.stdout.write(JSON.stringify(records));
    ' "$SEED_FILE")"
  else
    VMNL_SEED_USERS_JSON="$(cat "$SEED_FILE")"
  fi
  export VMNL_SEED_USERS_JSON
fi

if [ "$AUTO_SEED" = "true" ]; then
  SEED_MARKER="/app/data/.seeded"
  if [ ! -f "$SEED_MARKER" ] || [ "${FORCE_SEED:-false}" = "true" ]; then
    echo "[VMNL-BOOT] AUTO_SEED=true: Populating Golden Master demo records..."
    node dist/src/db/migrate-and-seed.js && touch "$SEED_MARKER"
  else
    echo "[VMNL-BOOT] Demo data already seeded ($SEED_MARKER present); skipping."
  fi
fi

if command -v dumb-init >/dev/null 2>&1; then
  exec dumb-init -- "$@"
else
  exec "$@"
fi
