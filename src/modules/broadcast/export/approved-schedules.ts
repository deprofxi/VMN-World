/**
 * Engine-backed Approved Schedule Source — TSK-10
 * Authority: VMNL-AZP-VMN-BRD-001 R1.2A §45; tasks.md TASK-P2-05 (UAT Drill 07).
 *
 * The EPG export used to have nothing connected to it, so it could only ever
 * answer `APPROVED_SCHEDULE_UNAVAILABLE`. That was honest but not enforceable:
 * with no source, "the approval timestamp is not a rights decision" had nothing
 * to check. This file connects the real BCST-03 lifecycle — schedules that
 * reached an approved-for-air state (`APPROVED` and any later PRD §15 stage, plus
 * the `AMENDED`/`LOCKED` controls) through `approveSchedule`, which already ran
 * the rights gate — and hands the slots over with their `rightsRecordId` and the
 * schedule revision identity, so `exportXmltv` can re-decide clearance at export
 * time and name the revision it exported.
 *
 * Honesty contract:
 * - A DRAFT or pre-approval day (PROGRAMMING_REVIEW / RIGHTS_CHECK / TRAFFIC_READY)
 *   is not an approved source: it returns null, and the export refuses.
 * - Slots carry the version's own episode identity. An entry with no version and
 *   no `episodeCode` yields no `episodeId`, so the XMLTV generator emits no
 *   `episode-num` rather than inventing one.
 */

import { getVersion, isApprovedForAir, listSchedules } from "../versions/index.js";
import { scheduleDayStartUtc } from "../rights/schedule-clearance.js";
import type { ApprovedScheduleDay, ApprovedScheduleSlot, ApprovedScheduleSource } from "./epg.js";

export function findApprovedScheduleDay(channelCode: string, dateIso: string): ApprovedScheduleDay | null {
  const schedule = listSchedules(channelCode).find(
    (s) => s.broadcastDate === dateIso && isApprovedForAir(s.state) && s.entries.length > 0
  );
  if (!schedule) return null;
  const dayStartMs = scheduleDayStartUtc(schedule.broadcastDate).getTime();
  // Only APPROVED/AMENDED days can still be amended (and only before lock-out);
  // every other approved-for-air state is frozen, so the slot is genuinely locked.
  const amendable = schedule.state === "APPROVED" || schedule.state === "AMENDED";
  const slots: ApprovedScheduleSlot[] = schedule.entries.map((entry) => ({
    id: entry.entryId,
    channelId: schedule.channelId,
    startTime: new Date(dayStartMs + entry.startSecondsFromDayStart * 1000),
    durationSeconds: entry.durationSeconds,
    episodeId: getVersion(entry.versionId)?.episodeId ?? entry.episodeCode ?? "",
    title: entry.programmeTitle,
    isLocked: !amendable,
    rightsRecordId: entry.rightsRecordId,
  }));
  // PRD §15: an exportable EPG export identifies the source schedule revision. An
  // approved day always has one; a blank here would mean the source bypassed the
  // lifecycle, so `exportXmltv` refuses rather than publishing an unattributed feed.
  return { broadcastDate: schedule.broadcastDate, revisionId: schedule.revisionId ?? "", slots };
}

export const engineScheduleSource: ApprovedScheduleSource = {
  getApprovedSchedule: (channelCode, dateIso) => findApprovedScheduleDay(channelCode, dateIso),
};
