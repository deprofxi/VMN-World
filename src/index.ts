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

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApiServer();
  app.start()
    .then(() => {
      console.log(`[VMNL-BOOT] VMNL Enterprise Platform successfully started on port ${app.port}`);
    })
    .catch((err) => {
      console.error("[VMNL-BOOT-FATAL] Failed to start VMNL Enterprise Platform:", err);
      process.exit(1);
    });

  const shutdown = async (signal: string) => {
    console.log(`[VMNL-SHUTDOWN] Received ${signal}. Gracefully stopping server...`);
    await app.stop();
    console.log("[VMNL-SHUTDOWN] Server stopped. Exiting process.");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
