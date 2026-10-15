/**
 * Approved-Schedule Demo Seed — SCR-03 follow-on (now/next master visibility)
 *
 * Why this exists: the now/next widget (BCST-08/09) resolves ONLY from
 * APPROVED schedules, and until now nothing in production ever authored one —
 * channel pages could only ever show the honest "guide being updated" state,
 * so an episode-linked schedule entry could never be seen live.
 *
 * What it does: for each active channel, when no eligible schedule exists for
 * today (governing WAT date), it derives a full-day, gap-free schedule from
 * the boot-refreshed episode-master index:
 *   - one entry per distinct programme (up to 8), equal slots covering 24h,
 *     each carrying the canonical `episodeCode`;
 *   - a MASTER broadcast version per episode (QC PASSED → Ready-For-Air),
 *     bound to the episode's registered DAM `mediaAssetId`;
 *   - walked through the full PRD §15 pre-air chain (DRAFT → PROGRAMMING_REVIEW →
 *     RIGHTS_CHECK → TRAFFIC_READY → APPROVED) via the real lifecycle, so the
 *     schedule passes every BCST-03 invariant (airable versions, rights
 *     attestation, no overlaps) and the rights gate genuinely clears it.
 *
 * Honesty contract:
 *   - Idempotent: a channel already covered for today is skipped.
 *   - Skips (seeds nothing) when the episode-master index is empty for a
 *     channel — no index, no schedule; it never fabricates entries.
 *   - Skips when an entry has **no registered RightsRecord** for its master
 *     (TSK-10): the lifecycle now runs the clearance gate at approval, so a
 *     sandbox seed with nothing to clear against would be refused. It reports
 *     those channels as `unclearedChannels` instead of inventing a window —
 *     a demo schedule must not be the reason a rights record exists.
 *   - This is a SANDBOX DEMO seed: the reviewer, rights checker, traffic officer,
 *     approver and rights attestation strings all say so explicitly
 *     (`golden-seed sandbox demo`), so the stage trail names the seed as the
 *     authority for every stage rather than a real desk operator. Real schedule
 *     authoring remains an operator workflow.
 */

import { getAllActiveChannels } from "./channels/index.js";
import { listEpisodeMasters } from "./episode-masters.js";
import { findRegisteredRightsRecordForAsset } from "./rights/registry.js";
import {
  approveSchedule,
  getVersion,
  isApprovedForAir,
  listSchedules,
  markReadyForAir,
  passProgrammingReview,
  passRightsCheck,
  passTrafficCheck,
  registerVersion,
  submitScheduleForApproval,
  upsertDraftSchedule,
  type ScheduleEntry,
  type VersionQcReport,
} from "./versions/index.js";

export const SCHEDULE_DEMO_APPROVER = "golden-seed sandbox demo";
export const SCHEDULE_DEMO_RIGHTS_ATTESTATION = "Golden seed sandbox demo schedule clearance";

const MAX_SLOTS = 8;
const DEMO_QC: VersionQcReport = {
  videoStandard: "1080i50",
  aspectRatio: "16:9",
  audioLoudnessLufs: -23,
  hasCountdownSlate: true,
  hasBlackGaps: false,
  hasClosedCaptionTrack: true,
};

/** Today's broadcast date in the governing timezone (WAT = UTC+1, no DST). */
export function governingDate(now: Date = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface ScheduleDemoSeedStats {
  channelsSeeded: number;
  entries: number;
  skipped: number;
  /** Channels whose masters carry no registered RightsRecord — nothing to clear against (TSK-10). */
  unclearedChannels: number;
}

export function ensureScheduleDemoSeed(now: Date = new Date()): ScheduleDemoSeedStats {
  const today = governingDate(now);
  const stats: ScheduleDemoSeedStats = { channelsSeeded: 0, entries: 0, skipped: 0, unclearedChannels: 0 };

  for (const channel of getAllActiveChannels()) {
    const covered = listSchedules(channel.code).some(
      (s) => s.broadcastDate === today && isApprovedForAir(s.state)
    );
    if (covered) {
      stats.skipped += 1;
      continue;
    }

    // One episode per distinct programme so the day reads like a real grid.
    const masters = listEpisodeMasters(channel.code);
    const chosen: typeof masters = [];
    const seenProgrammes = new Set<string>();
    for (const row of masters) {
      if (seenProgrammes.has(row.programmeCode)) continue;
      seenProgrammes.add(row.programmeCode);
      chosen.push(row);
      if (chosen.length === MAX_SLOTS) break;
    }
    // Fewer than two programmes cannot produce a now/next pair; a schedule
    // with gaps would only earn the honest OUTSIDE_COVERAGE states anyway.
    if (chosen.length < 2) {
      stats.skipped += 1;
      continue;
    }

    // TSK-10: every entry must clear against a registered RightsRecord, so a
    // channel whose masters carry no rights cannot be approved and is not seeded.
    // Checking before registering anything keeps the refusal side-effect-free.
    const uncleared = chosen.filter((row) => !findRegisteredRightsRecordForAsset(row.mediaAssetId));
    if (uncleared.length > 0) {
      stats.unclearedChannels += 1;
      continue;
    }

    // Equal slots spanning the full broadcast day: no invented gaps.
    const slotSeconds = Math.floor(86_400 / chosen.length);
    const entries: ScheduleEntry[] = chosen.map((row, index) => {
      const versionId = `ver-demo-${row.episodeCode}`;
      if (!getVersion(versionId)) {
        registerVersion({
          id: versionId,
          episodeId: row.episodeCode,
          versionType: "MASTER",
          durationSeconds: slotSeconds,
          qc: DEMO_QC,
          mediaAssetId: row.mediaAssetId,
        });
      }
      if (!getVersion(versionId)!.readyForAir) {
        markReadyForAir({ versionId, rfaBy: SCHEDULE_DEMO_APPROVER });
      }
      return {
        entryId: `se-${channel.code}-${index}`,
        versionId,
        programmeTitle: row.programmeTitle,
        startSecondsFromDayStart: index * slotSeconds,
        durationSeconds: slotSeconds,
        rightsClearedBy: SCHEDULE_DEMO_RIGHTS_ATTESTATION,
        rightsRecordId: findRegisteredRightsRecordForAsset(row.mediaAssetId)!.id,
        episodeCode: row.episodeCode,
      };
    });

    const scheduleId = `SCHED-DEMO-${channel.code}-${today}`;
    upsertDraftSchedule({ scheduleId, channelId: channel.code, broadcastDate: today, entries });
    submitScheduleForApproval(scheduleId);
    passProgrammingReview({ scheduleId, reviewedBy: SCHEDULE_DEMO_APPROVER });
    passRightsCheck({ scheduleId, checkedBy: SCHEDULE_DEMO_APPROVER });
    passTrafficCheck({ scheduleId, attestedBy: SCHEDULE_DEMO_APPROVER });
    approveSchedule({ scheduleId, approvedBy: SCHEDULE_DEMO_APPROVER });

    stats.channelsSeeded += 1;
    stats.entries += entries.length;
  }

  return stats;
}
