/**
 * Virtual Media Network Limited (VMNL) Enterprise Platform
 * Master Application Entrypoint & Barrel Export
 *
 * Authority:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 * - VMNL-AZP-VMN-CCPP-001 — R1.1
 * - VMNL-AZP-VMN-EXEC-001
 */

// Core Services
export * from "./core/config/index.js";
export * from "./core/domain/types.js";
export * from "./core/auth/index.js";
export * from "./core/rbac/index.js";
export * from "./core/storage/index.js";
export * from "./core/audit/index.js";
export * from "./core/observability/index.js";

// Domain Modules
export * from "./modules/broadcast/index.js";
export * from "./modules/hub/index.js";
export * from "./modules/intelligence/index.js";
export * from "./modules/federation/index.js";
export * from "./modules/finance/index.js";
export * from "./modules/quality/gates.js";

// Web Components & Public Surfaces
export * from "./web/components/index.js";
export * from "./web/public/index.js";

// API Server & Router
export * from "./api/index.js";

// Automated Seed Generator
export * from "./db/seeds/golden/index.js";

// Self-executing server when run directly
import { createApiServer } from "./api/server.js";
import { getConfig } from "./core/config/index.js";
import { installLifecycleGuards } from "./core/runtime/lifecycle.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApiServer();

  // PR-16: the guards are installed BEFORE the port is bound, so an
  // `unhandledRejection` or `uncaughtException` during bootstrap takes the same
  // bounded stop as one under load, and a SIGTERM arriving mid-boot cannot race
  // a handler that is not registered yet. `app.stop()` is now also the boot
  // failure path, which is why it is safe to call on a server that never
  // listened.
  const lifecycle = installLifecycleGuards({
    target: process,
    stop: () => app.stop(),
    exit: (code) => process.exit(code),
    deadlineMs: getConfig().VMNL_SHUTDOWN_DEADLINE_MS,
  });

  app
    .start()
    .then(() => {
      // A signal that arrived while the port was still binding has already
      // begun shutting down; announcing a successful start would be false.
      if (lifecycle.started()) return;
      console.log(`[VMNL-BOOT] VMNL Enterprise Platform successfully started on port ${app.port}`);
    })
    .catch((err) => {
      console.error("[VMNL-BOOT-FATAL] Failed to start VMNL Enterprise Platform:", err);
      void lifecycle.shutdown("boot-failure", 1);
    });
}
