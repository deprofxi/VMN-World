/**
 * Database Migration & Golden Master Seed Orchestrator
 * Authority: VMNL-AZP-VMN-CCPP-001 §15 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 */

import { generateGoldenDataset } from "./seeds/golden/index.js";
import { loadConfig } from "../core/config/index.js";

export async function runDatabaseSeed(): Promise<{ success: boolean; stats: Record<string, number> }> {
  console.log("[VMNL-DB-SEED] Initializing Golden Master seed process...");
  const config = loadConfig({
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://vmn_user:vmn_password@localhost:5432/vmn_db",
    JWT_SECRET: process.env.JWT_SECRET || "vmnl-secure-jwt-secret-with-at-least-32-chars-long",
    AZEEBO_WEBHOOK_SECRET: process.env.AZEEBO_WEBHOOK_SECRET || "azeebo-secret-minimum-16-chars",
  });

  console.log(`[VMNL-DB-SEED] Connecting to target database: ${config.DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
  const dataset = generateGoldenDataset();

  const stats = {
    channels: dataset.channels.length,
    programmes: dataset.programmes.length,
    episodes: dataset.episodes.length,
    schedules: dataset.schedules.length,
    campaigns: dataset.commercialCampaigns.length,
    asRunLogs: dataset.asRunLogs.length,
    talentProfiles: dataset.talentProfiles.length,
    afcaCourses: dataset.afcaCourses.length,
    vcfSlates: dataset.vcfSlates.length,
    tendDeals: dataset.tendDeals.length,
  };

  console.log("[VMNL-DB-SEED] Golden Master seed completed successfully:");
  for (const [key, count] of Object.entries(stats)) {
    console.log(`  - ${key.padEnd(16)}: ${count} records generated`);
  }

  return { success: true, stats };
}

if (process.argv[1]?.includes("migrate-and-seed")) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[VMNL-DB-SEED-ERROR]", err);
      process.exit(1);
    });
}
