/**
 * Golden-Seed DAM Backfill — TODO-SCR-03 follow-on
 *
 * Registers the canonical DAM assets that the golden dataset implies (one
 * broadcast master per episode, one key-art still per programme) and persists
 * the resulting asset ids onto the BroadcastEpisode rows, so the editor,
 * picker and review surfaces start POPULATED with references that resolve.
 *
 * Determinism contract: every asset uses an explicit `assetId` derived from
 * the golden ids (`MA-EP-0001-MASTER`, `MA-PRG-GOLDEN-001-KEYART`, …) and a
 * deterministic checksum (sha256 of the asset key), so re-running the seed or
 * re-booting the sandbox re-registers THE SAME ids and every persisted
 * `mediaAssetId` keeps resolving against the in-memory registry.
 *
 * Honesty note: these are registry records for synthetic golden assets — the
 * underlying media files are NOT uploaded anywhere. Provenance strings say so.
 */

import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { registerMediaAsset, type RegisterMediaAssetParams } from "../../core/storage/index.js";
import { generateGoldenDataset, type GoldenDataset } from "./golden/index.js";

/** Deterministic checksum so seeded records are byte-identical across runs. */
function deterministicChecksum(assetKey: string): string {
  return createHash("sha256").update(`vmnl-golden-dam:${assetKey}`).digest("hex");
}

/**
 * Builds the canonical registration set implied by the golden dataset:
 * one broadcast master per episode + one key-art still per programme.
 */
export function goldenDamAssetRegistrations(dataset: GoldenDataset = generateGoldenDataset()): RegisterMediaAssetParams[] {
  const programmesById = new Map(dataset.programmes.map((p) => [p.id, p]));
  const params: RegisterMediaAssetParams[] = [];

  for (const ep of dataset.episodes) {
    const programme = programmesById.get(ep.programmeId);
    const title = programme ? `${programme.title} — Episode ${ep.episodeNumber} master` : `Episode ${ep.id} master`;
    const assetKey = `golden/episodes/${ep.id}/master.mp4`;
    params.push({
      assetId: `MA-${ep.id}-MASTER`,
      title,
      assetKey,
      mimeType: "video/mp4",
      sizeBytes: ep.durationSeconds * 1_000_000, // ≈1 MB/s deterministic stand-in
      checksumSha256: deterministicChecksum(assetKey),
      provenance: "Golden seed ingest (synthetic master — no media file uploaded)",
      virusScanPassed: true,
      registeredBy: "golden-seed",
    });
  }

  for (const prog of dataset.programmes) {
    const assetKey = `golden/programmes/${prog.id}/keyart.jpg`;
    params.push({
      assetId: `MA-${prog.id}-KEYART`,
      title: `${prog.title} — key art`,
      assetKey,
      mimeType: "image/jpeg",
      sizeBytes: 480_000,
      checksumSha256: deterministicChecksum(assetKey),
      provenance: "Golden seed ingest (synthetic key art — no media file uploaded)",
      virusScanPassed: true,
      registeredBy: "golden-seed",
    });
  }

  return params;
}

/**
 * Registers every golden asset. Idempotent: explicit assetIds + assetKey
 * dedupe in the registry make repeated calls no-ops.
 */
export function registerGoldenDamAssets(dataset: GoldenDataset = generateGoldenDataset()): number {
  const registrations = goldenDamAssetRegistrations(dataset);
  for (const p of registrations) registerMediaAsset(p);
  return registrations.length;
}

/** The stable asset id a golden episode's master registers under. */
export function episodeMasterAssetId(episodeId: string): string {
  return `MA-${episodeId}-MASTER`;
}

/**
 * Persists the registered master ids onto the BroadcastEpisode rows so
 * broadcast surfaces (EPG export, playout, schedules) reference DAM ids that
 * resolve. Only rows whose stored value differs are written; the return value
 * is the standing total of episodes carrying their expected reference — not a
 * per-run delta — so seed summaries report the same truth on first and
 * subsequent runs. Missing episode rows are warned about, never silently
 * counted as persisted.
 */
export async function persistEpisodeMediaAssets(prisma: PrismaClient, dataset: GoldenDataset = generateGoldenDataset()): Promise<number> {
  let persisted = 0;
  for (const ep of dataset.episodes) {
    const assetId = episodeMasterAssetId(ep.id);
    const existing = await prisma.broadcastEpisode.findUnique({ where: { episodeCode: ep.id }, select: { mediaAssetId: true } });
    if (!existing) {
      console.warn(`[VMNL-DB-SEED] DAM backfill: episode ${ep.id} not found — master reference ${assetId} NOT persisted.`);
      continue;
    }
    if (existing.mediaAssetId !== assetId) {
      await prisma.broadcastEpisode.update({ where: { episodeCode: ep.id }, data: { mediaAssetId: assetId } });
    }
    persisted += 1;
  }
  return persisted;
}
