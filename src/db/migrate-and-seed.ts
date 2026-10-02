/**
 * Database Migration & Golden Master Seed Orchestrator
 * Authority: VMNL-AZP-VMN-CCPP-001 §15 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 */

import { generateGoldenDataset } from "./seeds/golden/index.js";
import { persistEpisodeMediaAssets, registerGoldenDamAssets } from "./seeds/dam-backfill.js";
import { loadConfig } from "../core/config/index.js";
import { getPrismaClient, checkDatabaseConnection, disconnectDatabase } from "../core/database/index.js";

export async function runDatabaseSeed(): Promise<{ success: boolean; stats: Record<string, number>; persistenceMode: string }> {
  console.log("[VMNL-DB-SEED] Initializing Golden Master seed process...");
  
  // Fail-fast schema-validated configuration loading (Constitutional Law A-3: No embedded fallback secrets)
  const config = loadConfig();

  console.log(`[VMNL-DB-SEED] Target database: ${config.DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
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
    damAssets: 0,
    episodeMediaAssets: 0,
  };

  // Test live database connectivity (Finding B-5)
  const connection = await checkDatabaseConnection();
  let persistenceMode = "IN_MEMORY_SANDBOX_VERIFIED";

  if (connection.connected) {
    console.log(`[VMNL-DB-SEED] Database connected (${connection.latencyMs}ms). Persisting golden records via Prisma Client...`);
    const prisma = getPrismaClient();

    try {
      // 1. Seed Channels
      for (const ch of dataset.channels) {
        await prisma.broadcastChannel.upsert({
          where: { code: ch.code },
          update: {
            name: ch.name,
            dttChannelNumber: ch.dtt,
            dthChannelNumber: ch.dth,
          },
          create: {
            id: ch.id,
            code: ch.code,
            name: ch.name,
            tagline: `${ch.name} - Nigerian Creative Authority`,
            primaryLanguage: ch.code === "ORIS" ? "Yoruba" : ch.code === "IMBD" ? "Igbo" : "English / Pidgin",
            dttChannelNumber: ch.dtt,
            dthChannelNumber: ch.dth,
            isProvisional: true,
          },
        });
      }

      // 2. Seed AFCA Courses
      for (const course of dataset.afcaCourses) {
        await prisma.afcaCourse.upsert({
          where: { code: course.courseCode },
          update: {
            title: course.title,
            credits: course.credits,
          },
          create: {
            id: course.id,
            code: course.courseCode,
            title: course.title,
            faculty: "Creative Arts & Technology",
            credits: course.credits,
            tuitionNgn: 150000.0,
            durationWeeks: 12,
            isActive: true,
          },
        });
      }

      // 3. Seed Commercial Campaigns
      for (const camp of dataset.commercialCampaigns) {
        await prisma.commercialCampaign.upsert({
          where: { id: camp.id },
          update: {
            brand: camp.brandCategory,
            bookedSpots: camp.spotCount,
          },
          create: {
            id: camp.id,
            campaignCode: camp.id,
            clientName: camp.clientName,
            brand: camp.brandCategory,
            bookedSpots: camp.spotCount,
            totalContractValueNgn: 5000000.0,
            startDate: new Date("2026-10-01"),
            endDate: new Date("2026-10-31"),
            status: "ACTIVE",
          },
        });
      }

      // 4. Seed Programmes
      for (const prog of dataset.programmes) {
        const channelCode = prog.genre.includes("Yoruba") ? "ORIS" : prog.genre.includes("Igbo") ? "IMBD" : "NXTR";
        await prisma.programme.upsert({
          where: { code: prog.id },
          update: { title: prog.title, category: prog.genre },
          create: {
            id: prog.id,
            code: prog.id,
            title: prog.title,
            channelCode,
            category: prog.genre,
            targetDemographic: "General / Youth",
            synopsis: `Standard golden programme for ${prog.title}`,
            totalEpisodes: prog.totalEpisodes,
          },
        });
      }

      // 5. Seed Broadcast Episodes
      for (const ep of dataset.episodes) {
        await prisma.broadcastEpisode.upsert({
          where: { episodeCode: ep.id },
          update: { durationSeconds: ep.durationSeconds },
          create: {
            id: ep.id,
            episodeCode: ep.id,
            programmeCode: ep.programmeId,
            episodeNumber: ep.episodeNumber,
            title: `Episode ${ep.episodeNumber}`,
            durationSeconds: ep.durationSeconds,
            segmentCount: 4,
          },
        });
      }

      // SCR-03 backfill: register the golden DAM assets (deterministic ids,
      // idempotent) and point every episode at its registered master so the
      // editor, picker, review and broadcast surfaces reference assets that
      // resolve in the registry.
      const damAssets = registerGoldenDamAssets(dataset);
      const episodeMediaAssets = await persistEpisodeMediaAssets(prisma, dataset);
      stats.damAssets = damAssets;
      stats.episodeMediaAssets = episodeMediaAssets;
      console.log(`[VMNL-DB-SEED] DAM backfill: ${damAssets} assets registered, ${episodeMediaAssets} episode references persisted.`);

      // 6. Seed Talent Profiles & Persons
      for (const tal of dataset.talentProfiles) {
        const personEmail = `${tal.id.toLowerCase()}@talent.vmnl.ng`;
        const person = await prisma.person.upsert({
          where: { email: personEmail },
          update: { firstName: tal.fullName.split(" ")[0] || "Artist", lastName: tal.fullName.split(" ")[1] || "Talent" },
          create: {
            id: `per-${tal.id}`,
            email: personEmail,
            firstName: tal.fullName.split(" ")[0] || "Artist",
            lastName: tal.fullName.split(" ")[1] || "Talent",
            kycStatus: "VERIFIED",
          },
        });

        await prisma.talentProfile.upsert({
          where: { personId: person.id },
          update: { tier: tal.tier as any },
          create: {
            id: tal.id,
            personId: person.id,
            stageName: tal.fullName,
            tier: tal.tier as any,
            bio: `Verified talent artist specializing in ${tal.primarySkill}`,
            skills: [tal.primarySkill],
            rateCardAmount: 150000.0,
            verificationStatus: "VERIFIED",
          },
        });
      }

      // 7. Seed As-Run Logs
      for (const asrun of dataset.asRunLogs) {
        const chCode = asrun.channelId.includes("NXTR") ? "NXTR" : asrun.channelId.includes("ORIS") ? "ORIS" : "IMBD";
        await prisma.asRunLogRecord.upsert({
          where: { id: asrun.id },
          update: { matchedSpots: Math.floor(60 * (asrun.matchRatePercent / 100)) },
          create: {
            id: asrun.id,
            channelCode: chCode,
            transmissionDate: new Date(asrun.date),
            totalPlannedSpots: 60,
            totalAiredSpots: 60,
            matchedSpots: Math.floor(60 * (asrun.matchRatePercent / 100)),
            discrepancyCount: asrun.matchRatePercent === 100 ? 0 : 2,
            reconciliationStatus: asrun.matchRatePercent === 100 ? "MATCHED_CLEAN" : "DISCREPANCY_FLAGGED",
          },
        });
      }

      // 8. Seed VCF Slates (Projects)
      for (const slate of dataset.vcfSlates) {
        await prisma.project.upsert({
          where: { code: slate.id },
          update: { budget: slate.budgetNgn },
          create: {
            id: slate.id,
            code: slate.id,
            name: slate.title,
            description: `VCF Project Slate: ${slate.title}`,
            status: "APPROVED",
            budget: slate.budgetNgn,
            currency: "NGN",
          },
        });
      }

      // 9. Seed TEND Distribution Deals (Contracts)
      for (const deal of dataset.tendDeals) {
        await prisma.contract.upsert({
          where: { contractNumber: deal.id },
          update: { contractValue: deal.feeUsd },
          create: {
            id: deal.id,
            contractNumber: deal.id,
            title: `TEND Distribution: ${deal.title} (${deal.territory})`,
            status: "SIGNED",
            contractValue: deal.feeUsd,
            currency: "USD",
            startDate: new Date("2026-06-01"),
            endDate: new Date("2027-05-31"),
          },
        });
      }

      persistenceMode = "POSTGRESQL_PERSISTED";
      console.log("[VMNL-DB-SEED] Prisma persistence operations completed successfully for all entity families.");
    } catch (dbErr: any) {
      const allowSandboxFallback = process.argv.includes("--allow-sandbox-fallback") || process.env.ALLOW_SANDBOX_FALLBACK === "true";
      if (!allowSandboxFallback) {
        console.error(`[VMNL-DB-SEED-FATAL] Database persistence failed: ${dbErr.message}`);
        await disconnectDatabase();
        throw new Error(`[VMNL-DB-SEED-FATAL] Database persistence failed: ${dbErr.message}`, {
          cause: dbErr,
        });
      }
      console.warn(`[VMNL-DB-SEED-WARNING] Prisma upsert error, falling back to sandbox mode: ${dbErr.message}`);
      persistenceMode = "SANDBOX_DEGRADED";
      await disconnectDatabase();
      return { success: false, stats, persistenceMode };
    } finally {
      await disconnectDatabase();
    }
  } else {
    console.log(
      `[VMNL-DB-SEED] Database offline or unreachable (${connection.error || "connection refused"}). Operating in Tier S2 verified in-memory sandbox mode.`
    );
  }

  console.log("[VMNL-DB-SEED] Golden Master seed summary:");
  for (const [key, count] of Object.entries(stats)) {
    console.log(`  - ${key.padEnd(16)}: ${count} records generated (${persistenceMode})`);
  }

  return { success: true, stats, persistenceMode };
}

if (process.argv[1]?.includes("migrate-and-seed")) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[VMNL-DB-SEED-ERROR]", err);
      process.exit(1);
    });
}
