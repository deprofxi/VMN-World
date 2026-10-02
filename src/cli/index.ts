#!/usr/bin/env node
/**
 * VMNL Enterprise Operations CLI
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §21
 */

import fs from "node:fs";
import path from "node:path";
import { generateGoldenDataset } from "../db/seeds/golden/index.js";
import { ReleaseGatePipeline } from "../modules/quality/gates.js";
import { getChannelByCode } from "../modules/broadcast/channels/index.js";
import { generateXmltvFeed } from "../modules/broadcast/epg/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../modules/broadcast/screens/index.js";
import { loadConfig } from "../core/config/index.js";

export async function runCli(args: string[] = process.argv.slice(2)): Promise<number> {
  const command = args[0] || "--help";

  switch (command) {
    case "seed": {
      console.log("[VMNL-CLI] Generating deterministic Golden Master seed dataset...");
      const dataset = generateGoldenDataset();
      console.log(`[VMNL-CLI] Successfully seeded:`);
      console.log(`  - Channels:    ${dataset.channels.length} (NXTR, ORIS, IMBD)`);
      console.log(`  - Programmes:  ${dataset.programmes.length}`);
      console.log(`  - Episodes:    ${dataset.episodes.length}`);
      console.log(`  - Schedules:   ${dataset.schedules.length}`);
      console.log(`  - Campaigns:   ${dataset.commercialCampaigns.length}`);
      console.log(`  - As-Run Logs: ${dataset.asRunLogs.length}`);
      console.log(`  - Talent:      ${dataset.talentProfiles.length}`);
      console.log(`  - AFCA:        ${dataset.afcaCourses.length}`);
      console.log(`  - VCF Slates:  ${dataset.vcfSlates.length}`);
      console.log(`  - TEND Deals:  ${dataset.tendDeals.length}`);
      return 0;
    }

    case "gates:check": {
      console.log("[VMNL-CLI] Evaluating R1.2A §67 Broadcast Release Gates (BG0 to BG9)...");
      let manifestPath = "release-manifest.json";
      const manifestIndex = args.indexOf("--manifest");
      if (manifestIndex !== -1 && args[manifestIndex + 1]) {
        manifestPath = args[manifestIndex + 1];
      }

      const resolvedPath = path.resolve(process.cwd(), manifestPath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`[VMNL-CLI] Manifest file not found at: ${resolvedPath}`);
        console.error("Provide a valid manifest via --manifest <path> or ensure release-manifest.json exists.");
        return 1;
      }

      let parsedJson: any;
      try {
        const fileContent = fs.readFileSync(resolvedPath, "utf-8");
        parsedJson = JSON.parse(fileContent);
      } catch (err: any) {
        console.error(`[VMNL-CLI] Failed to read or parse release manifest: ${err.message}`);
        return 1;
      }

      // Convert dates
      const broadcastManifest = {
        ...parsedJson,
        humanReleaseOwner: {
          ...parsedJson.humanReleaseOwner,
          signedAt: new Date(parsedJson.humanReleaseOwner.signedAt),
        },
        gates: Object.fromEntries(
          Object.entries(parsedJson.gates).map(([id, gate]: [string, any]) => [
            id,
            { ...gate, evaluatedAt: new Date(gate.evaluatedAt) },
          ])
        ),
      };


      const allowDrift = args.includes("--allow-sha-drift") || process.env.ALLOW_SHA_DRIFT === "true";
      if (!allowDrift && broadcastManifest.gitCommitSha && broadcastManifest.gitCommitSha !== "HEAD") {
        try {
          const { execSync } = await import("node:child_process");
          const currentSha = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
          if (
            currentSha &&
            !currentSha.startsWith(broadcastManifest.gitCommitSha) &&
            !broadcastManifest.gitCommitSha.startsWith(currentSha)
          ) {
            console.warn(
              `[VMNL-CLI] Notice: Manifest SHA (${broadcastManifest.gitCommitSha.substring(0, 7)}) diverges from current HEAD (${currentSha.substring(0, 7)}).`
            );
          }
        } catch {
          // Non-blocking in non-git environments
        }
      }

      const result = ReleaseGatePipeline.evaluateBroadcastRelease(broadcastManifest);
      if (result.canDeploy) {
        console.log("[VMNL-CLI] ALL R1.2A §67 BROADCAST GATES EVALUATED (BG0 to BG9).");
        console.log(`[VMNL-CLI] Release Decision: ${result.decision}`);
        console.log(`[VMNL-CLI] Environment: ${broadcastManifest.environment}`);
        console.log(
          `[VMNL-CLI] Human Release Owner: ${broadcastManifest.humanReleaseOwner.name} (${broadcastManifest.humanReleaseOwner.role})`
        );
        result.passedGates.forEach((g) => console.log(`  - [PASSED] ${g}`));
        if (result.untestedGates.length > 0) {
          result.untestedGates.forEach((g) => console.log(`  - [CONDITION/UNTESTED] ${g}`));
        }
        console.log(`[VMNL-CLI] STATUS: RELEASE CLEARED FOR SANDBOX S2 TARGET (${result.decision}).`);
        return 0;
      } else {
        console.error("[VMNL-CLI] BROADCAST RELEASE GATES FAILED:");
        result.failingGates.forEach((g) => console.error(`  - ${g}`));
        return 1;
      }
    }

    case "epg:export": {
      const channelIndex = args.indexOf("--channel");
      const code = channelIndex !== -1 && args[channelIndex + 1] ? args[channelIndex + 1] : "NXTR";
      const channel = getChannelByCode(code);
      if (!channel) {
        console.error(`[VMNL-CLI] Channel code '${code}' not found.`);
        return 1;
      }
      const now = new Date();
      const xml = generateXmltvFeed(channel, [
        {
          id: `${channel.code}-item-001`,
          channelId: channel.id,
          episodeId: "ep-001",
          title: `${channel.name} Showcase`,
          startTime: now,
          durationSeconds: 7200,
          isLocked: false,
        },
      ]);
      console.log(xml);
      return 0;
    }

    case "screens:list": {
      console.log(`[VMNL-CLI] VMNL 33 Broadcast Operational Screen Inventory (R1.2A §46):`);
      BROADCAST_SCREEN_INVENTORY.forEach((s) => {
        console.log(`  [${s.screenNumber.toString().padStart(2, "0")}] ${s.screenId} | ${s.name.padEnd(38)} | ${s.route.padEnd(35)} | Role: ${s.primaryRole}`);
      });
      return 0;
    }

    case "config:verify": {
      console.log("[VMNL-CLI] Verifying environment configuration against Zod schema...");
      try {
        const config = loadConfig();
        console.log(`[VMNL-CLI] Configuration verified successfully.`);
        console.log(`  - APP_NAME:     ${config.APP_NAME}`);
        console.log(`  - NODE_ENV:     ${config.NODE_ENV}`);
        console.log(`  - PORT:         ${config.PORT}`);
        console.log(`  - DATABASE:     ${config.DATABASE_URL.replace(/:[^:@]+@/, ":***@")}`);
        console.log(`  - REDIS:        ${config.REDIS_HOST}:${config.REDIS_PORT}`);
        console.log(`  - STORAGE:      ${config.STORAGE_DRIVER} (${config.STORAGE_BUCKET})`);
        return 0;
      } catch (err: any) {
        console.error(`[VMNL-CLI] Configuration verification failed:`, err.message);
        return 1;
      }
    }

    case "--help":
    default: {
      console.log(`
Virtual Media Network Limited (VMNL) Enterprise Operations CLI
Usage: vmnl <command> [options]

Commands:
  seed                   Generate deterministic golden master datasets
  gates:check            Evaluate broadcast release gates (BG0–BG9) and sign-off manifests
  epg:export --channel   Export standard XMLTV EPG feed (e.g. NXTR, ORIS, IMBD)
  screens:list           List all 33 broadcast operational screen descriptors
  config:verify          Validate active environment variables against schema
  --help                 Display this help dialog
      `.trim());
      return 0;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().then((exitCode) => process.exit(exitCode));
}
