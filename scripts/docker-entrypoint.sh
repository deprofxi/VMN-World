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
  VMNL_SEED_USERS_JSON="$(node -e '
    const fs = require("node:fs");
    const crypto = require("node:crypto");
    const bcrypt = require("bcryptjs");
    const seedFile = process.argv[1];
    const accounts = [
      { email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@vmnl.ng", roles: ["SuperAdmin"] },
      { email: "director@vmnl.ng", roles: ["BroadcastDirector"] },
      { email: "finance.controller@vmnl.ng", roles: ["FinanceController"] },
      { email: "finance@vmnl.ng", roles: ["FinanceController"] },
      { email: "traffic@vmnl.ng", roles: ["CommercialTrafficOfficer", "TrafficManager"] },
      { email: "scheduler@vmnl.ng", roles: ["ProgrammeScheduler"] },
      { email: "rights@vmnl.ng", roles: ["RightsManager"] },
      { email: "operator@vmnl.ng", roles: ["Operator"] },
      { email: "auditor@vmnl.ng", roles: ["Auditor"] },
      { email: "mcr@vmnl.ng", roles: ["MCRSupervisor"] },
      { email: "talent@vmnl.ng", roles: ["TalentManager"] },
    ];

    let existing = [];
    if (fs.existsSync(seedFile)) {
      try { existing = JSON.parse(fs.readFileSync(seedFile, "utf8")); } catch {}
    }

    let passwordHash;
    let generatedPassword = null;
    if (process.env.BOOTSTRAP_ADMIN_PASSWORD) {
      passwordHash = bcrypt.hashSync(process.env.BOOTSTRAP_ADMIN_PASSWORD, 12);
    } else if (Array.isArray(existing) && existing.length > 0 && existing[0]?.passwordHash) {
      passwordHash = existing[0].passwordHash;
    } else {
      generatedPassword = crypto.randomBytes(15).toString("base64url");
      passwordHash = bcrypt.hashSync(generatedPassword, 12);
    }

    const existingEmails = new Set((Array.isArray(existing) ? existing : []).map((u) => u.email));
    const records = accounts.map((a) => ({ email: a.email, roles: a.roles, passwordHash }));

    if (!fs.existsSync(seedFile) || records.some((r) => !existingEmails.has(r.email)) || process.env.BOOTSTRAP_ADMIN_PASSWORD) {
      fs.mkdirSync("/app/data", { recursive: true });
      fs.writeFileSync(seedFile, JSON.stringify(records), { mode: 0o600 });
      console.error("[VMNL-BOOT] ============================================================");
      console.error("[VMNL-BOOT] Provisioned " + records.length + " accounts with shared password:");
      for (const r of records) {
        console.error("[VMNL-BOOT]   - " + r.email + " (" + r.roles.join(", ") + ")");
      }
      if (generatedPassword) {
        console.error("[VMNL-BOOT]   Password: " + generatedPassword);
      } else if (process.env.BOOTSTRAP_ADMIN_PASSWORD) {
        console.error("[VMNL-BOOT]   Password: <from BOOTSTRAP_ADMIN_PASSWORD>");
      } else {
        console.error("[VMNL-BOOT]   Password: <same as existing admin@vmnl.ng>");
      }
      console.error("[VMNL-BOOT] ============================================================");
    }

    process.stdout.write(JSON.stringify(records));
  ' "$SEED_FILE")"
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
