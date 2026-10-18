#!/usr/bin/env node
/**
 * VMNL Enterprise Operations CLI
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §21
 */

import fs from "node:fs";
import path from "node:path";
import { generateGoldenDataset } from "../db/seeds/golden/index.js";
import { ReleaseGatePipeline, type BroadcastReleaseManifest } from "../modules/quality/gates.js";
import { getChannelByCode } from "../modules/broadcast/channels/index.js";
import { generateXmltvFeed } from "../modules/broadcast/epg/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../modules/broadcast/screens/index.js";
import { loadConfig } from "../core/config/index.js";
import { computeArtifactDigest, signCanonicalManifest, verifyManifestSignature } from "../modules/quality/artifact.js";

/**
 * A release manifest as it exists on disk: `signedAt`/`evaluatedAt` are JSON
 * strings until this module converts them, and unknown fields are preserved so a
 * re-serialized manifest is not silently narrowed. Typing it removes the four
 * `any` annotations the gates commands used to carry (AUD-12 / PR-27).
 */
interface ManifestJson {
  version?: string;
  environment?: string;
  gitCommitSha?: string;
  artifactDigest?: string;
  humanReleaseOwner: {
    name?: string;
    role?: string;
    employeeId?: string;
    signedAt: string;
  } & Record<string, unknown>;
  gates: Record<string, { evaluatedAt: string } & Record<string, unknown>>;
  [field: string]: unknown;
}

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

      let parsedJson: ManifestJson;
      try {
        const fileContent = fs.readFileSync(resolvedPath, "utf-8");
        parsedJson = JSON.parse(fileContent) as ManifestJson;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[VMNL-CLI] Failed to read or parse release manifest: ${message}`);
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
          Object.entries(parsedJson.gates).map(([id, gate]) => [
            id,
            { ...gate, evaluatedAt: new Date(gate.evaluatedAt) },
          ])
        ),
      };


      // PR-03: a signed release decision is bound to the commit it was signed
      // against. This block used to print a "Notice" and carry on, so a manifest
      // signed for one tree could clear an entirely different one — and
      // `--allow-sha-drift` was computed and then never read, so there was no
      // way to make the check bite at all. Divergence is now fatal unless the
      // override is explicit, and an active override announces itself rather
      // than passing silently.
      const allowDrift = args.includes("--allow-sha-drift") || process.env.ALLOW_SHA_DRIFT === "true";
      const manifestSha = broadcastManifest.gitCommitSha;
      if (manifestSha && manifestSha !== "HEAD") {
        let currentSha: string | null;
        try {
          const { execSync } = await import("node:child_process");
          currentSha = execSync("git rev-parse HEAD", {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
          }).trim();
        } catch {
          currentSha = null; // no git, or not a repository: drift cannot be tested here
        }

        if (currentSha === null) {
          console.warn(
            "[VMNL-CLI] Notice: the current commit could not be resolved (no git available), so the manifest's commit binding was NOT verified."
          );
        } else if (!currentSha.startsWith(manifestSha) && !manifestSha.startsWith(currentSha)) {
          const divergence =
            `[VMNL-CLI] Manifest commit ${manifestSha.substring(0, 7)} does not match HEAD ${currentSha.substring(0, 7)}: ` +
            "the release decision was signed against a different tree, so this evaluation does not attest the code being released.";
          if (!allowDrift) {
            console.error(divergence);
            console.error(
              "[VMNL-CLI] Re-pin release-manifest.json to a commit that carries the work (see HD-01 / TSK-37), or pass --allow-sha-drift to record an explicit override."
            );
            return 1;
          }
          console.warn(divergence);
          console.warn(
            "[VMNL-CLI] OVERRIDE ACTIVE: --allow-sha-drift was passed, so this gate did NOT attest the current commit. Remove the override once the manifest is re-pinned."
          );
        }
      }

      // PR-04: resolve the evidence each gate names, refuse stale evaluations,
      // and bind the decision to the artefact it decides on. Before this, the
      // gate was self-attestation: it read the manifest's own status strings and
      // never opened a cited file.
      const maxAgeIndex = args.indexOf("--max-evidence-age-days");
      const maxEvidenceAgeDays = maxAgeIndex !== -1 && args[maxAgeIndex + 1]
        ? Number.parseInt(args[maxAgeIndex + 1], 10)
        : 30;
      if (!Number.isFinite(maxEvidenceAgeDays) || maxEvidenceAgeDays <= 0) {
        console.error("[VMNL-CLI] --max-evidence-age-days must be a positive integer number of days.");
        return 1;
      }

      const digestIndex = args.indexOf("--artifact-digest");
      const declaredDigest = digestIndex !== -1 && args[digestIndex + 1] ? args[digestIndex + 1] : undefined;
      // Prefer an explicit digest, then a digest the release job computed, then
      // the local build output. An absent build is reported, never invented.
      let computedDigest = declaredDigest ?? process.env.RELEASE_ARTIFACT_DIGEST ?? undefined;
      let digestSource = declaredDigest ? "--artifact-digest" : computedDigest ? "RELEASE_ARTIFACT_DIGEST" : "";
      if (!computedDigest) {
        const build = computeArtifactDigest(path.resolve(process.cwd(), "dist"));
        if (build) {
          computedDigest = build.digest;
          digestSource = `dist/ (${build.fileCount} files, ${build.totalBytes} bytes)`;
        }
      }

      // Boundary cast: the shape above is what the file claims to be, not what has
      // been validated. `evaluateBroadcastRelease` is where it is validated — it
      // refuses a missing owner, an unknown environment and an unresolvable gate.
      const result = ReleaseGatePipeline.evaluateBroadcastRelease(
        broadcastManifest as unknown as BroadcastReleaseManifest,
        {
        evidenceRoot: process.cwd(),
        maxEvidenceAgeDays,
        artifactDigest: computedDigest,
        requireArtifactBinding: broadcastManifest.environment === "PRODUCTION_S5",
      });

      if (result.evidenceFindings.length > 0) {
        console.error(`[VMNL-CLI] EVIDENCE NOT RESOLVED (${result.evidenceFindings.length}):`);
        result.evidenceFindings.forEach((finding) =>
          console.error(`  - [${finding.code}] ${finding.gateId}: ${finding.detail}`)
        );
      }

      const signature = verifyManifestSignature(
        broadcastManifest as unknown as BroadcastReleaseManifest,
        process.env.RELEASE_SIGNING_KEY
      );
      if (signature.verified) {
        console.log(`[VMNL-CLI] Artefact binding: owner signature verified over digest ${broadcastManifest.artifactDigest?.substring(0, 12)}…`);
      } else {
        console.warn(`[VMNL-CLI] Artefact binding NOT VERIFIED — ${signature.reason}`);
        if (broadcastManifest.environment === "PRODUCTION_S5") {
          console.error("[VMNL-CLI] PRODUCTION_S5 requires a signed artefact binding (PR-04 / §5.2).");
          return 1;
        }
      }
      if (result.artifactAttested) {
        console.log(`[VMNL-CLI] Artefact digest matched (source: ${digestSource}).`);
      } else if (computedDigest) {
        console.log(`[VMNL-CLI] Artefact digest computed (${digestSource}) but the manifest does not bind it.`);
      } else {
        console.log("[VMNL-CLI] No artefact digest was available and the manifest binds none: this evaluation attests gate statuses and evidence paths only.");
      }

      // Honesty clause: the command resolves evidence paths; it does not re-run
      // the tests they name. Say so, rather than implying more than it did.
      console.log("[VMNL-CLI] Evidence paths resolved against the working tree; cited tests were NOT re-executed by this command.");

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
        console.log(`[VMNL-CLI] STATUS: RELEASE CLEARED FOR ${broadcastManifest.environment} (${result.decision}).`);
        return 0;
      } else {
        console.error("[VMNL-CLI] BROADCAST RELEASE GATES FAILED:");
        result.failingGates.forEach((g) => console.error(`  - ${g}`));
        return 1;
      }
    }

    // PR-04/§5.2: signing is a release-owner act. This command produces the
    // signature the owner commits; it never reads a key from the repository and
    // never writes the manifest itself, so signing stays an explicit human step.
    case "gates:sign": {
      const signingKey = process.env.RELEASE_SIGNING_KEY;
      if (!signingKey || signingKey.trim().length === 0) {
        console.error("[VMNL-CLI] RELEASE_SIGNING_KEY is not set, so no signature can be produced.");
        console.error("[VMNL-CLI] The key belongs to the release owner's secure environment and must never be committed.");
        return 1;
      }
      const signManifestIndex = args.indexOf("--manifest");
      const signPath = signManifestIndex !== -1 && args[signManifestIndex + 1] ? args[signManifestIndex + 1] : "release-manifest.json";
      const resolvedSignPath = path.resolve(process.cwd(), signPath);
      if (!fs.existsSync(resolvedSignPath)) {
        console.error(`[VMNL-CLI] Manifest file not found at: ${resolvedSignPath}`);
        return 1;
      }
      const signDigestIndex = args.indexOf("--artifact-digest");
      const signDigest = signDigestIndex !== -1 && args[signDigestIndex + 1]
        ? args[signDigestIndex + 1]
        : computeArtifactDigest(path.resolve(process.cwd(), "dist"))?.digest;
      if (!signDigest) {
        console.error("[VMNL-CLI] No artefact digest available: pass --artifact-digest <sha256> or build to dist/ first.");
        return 1;
      }
      let signTarget: ManifestJson;
      try {
        signTarget = JSON.parse(fs.readFileSync(resolvedSignPath, "utf-8")) as ManifestJson;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[VMNL-CLI] Failed to read or parse release manifest: ${message}`);
        return 1;
      }
      const signable = {
        ...signTarget,
        artifactDigest: signDigest,
        humanReleaseOwner: {
          ...signTarget.humanReleaseOwner,
          signedAt: new Date(signTarget.humanReleaseOwner.signedAt),
        },
        gates: Object.fromEntries(
          Object.entries(signTarget.gates).map(([id, gate]) => [
            id,
            { ...gate, evaluatedAt: new Date(gate.evaluatedAt) },
          ])
        ),
      };
      const signatureHex = signCanonicalManifest(signable as unknown as BroadcastReleaseManifest, signingKey);
      console.log(`[VMNL-CLI] Artifact digest: ${signDigest}`);
      console.log(`[VMNL-CLI] ownerSignature: ${signatureHex}`);
      console.log("[VMNL-CLI] Add both fields to the manifest yourself after review; this command writes nothing.");
      return 0;
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
  gates:check            Evaluate broadcast release gates (BG0–BG9), resolving cited evidence
  gates:sign             Produce an owner signature binding the manifest to the built artefact
                         (requires RELEASE_SIGNING_KEY; prints, never writes)
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
