/**
 * Rights fixture helpers — TSK-10
 *
 * The clearance gate decides on **registered** RightsRecords, so a test that
 * needs a cleared slot has to put a row in the durable store. These helpers keep
 * that write honest in both repository modes:
 *  - Postgres connected (`fail_closed`, the mode CI runs in): a real
 *    `RightsRecord` row, published into the gate's read index by the repository's
 *    write-through hook;
 *  - database unavailable: the repository's sandbox Map (Rule 0.4a — not
 *    persistence), so the same assertions still describe the same behaviour.
 *
 * Cleanup mirrors `tests/helpers/db-parents.ts`: rows are deleted in FK-free
 * order by id, in both `beforeAll` and `afterAll`, so an interrupted run cannot
 * leave fixture rights behind for the next one to mistake for real clearance.
 */

import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { RightsRecordWrite, StoredRightsRecord } from "../../src/core/database/repositories/rights.repository.js";
import { registerRightsRecord, rightsRepository } from "../../src/modules/broadcast/rights/index.js";
import {
  approveSchedule,
  getSchedule,
  passProgrammingReview,
  passRightsCheck,
  passTrafficCheck,
  submitScheduleForApproval,
  type BroadcastScheduleRecord,
} from "../../src/modules/broadcast/versions/index.js";

/**
 * Walk the PRD §15 pre-air chain a draft has to pass before approval
 * (TSK-12): submit → programming review → rights check → traffic attestation →
 * approve. Suites that are about *something else* (the rights gate, episode
 * linkage, exports) need an approved day as a precondition, not as the subject;
 * the lifecycle transitions themselves are asserted edge by edge in
 * `tests/unit/broadcast-schedule-lifecycle.test.ts`.
 *
 * The stage authorities are parameters, never defaults of convenience: an empty
 * string here must fail the same way it would in production.
 *
 * It advances only the stages the day is actually sitting on, so a suite that
 * asserted one transition itself (e.g. that a submit was previously refused and
 * now succeeds) can still use this for the rest of the chain. Out-of-order calls
 * are still refused by the machine; a schedule that is not on the pre-air chain at
 * all fails here rather than returning a misleading record.
 */
export function approvePreAirChain(
  scheduleId: string,
  actors: { submittedBy?: string; reviewedBy?: string; checkedBy?: string; attestedBy?: string; approvedBy?: string } = {}
): BroadcastScheduleRecord {
  const actor = actors.approvedBy ?? "test-authority";
  const current = (): BroadcastScheduleRecord => {
    const schedule = getSchedule(scheduleId);
    if (!schedule) throw new Error(`approvePreAirChain: unknown schedule '${scheduleId}'.`);
    return schedule;
  };

  const state = () => current().state;
  if (state() === "DRAFT" || state() === "AMENDED") submitScheduleForApproval(scheduleId, actors.submittedBy ?? actor);
  if (state() === "PROGRAMMING_REVIEW") passProgrammingReview({ scheduleId, reviewedBy: actors.reviewedBy ?? actor });
  if (state() === "RIGHTS_CHECK") passRightsCheck({ scheduleId, checkedBy: actors.checkedBy ?? actor });
  // RIGHTS_CHECK entering the stage and the traffic officer *satisfying* it are two
  // different facts; only the second one is missing here.
  if (state() === "TRAFFIC_READY" && current().trafficReady === undefined)
    passTrafficCheck({ scheduleId, attestedBy: actors.attestedBy ?? actor });
  if (state() === "TRAFFIC_READY") return approveSchedule({ scheduleId, approvedBy: actor });
  throw new Error(`approvePreAirChain: '${scheduleId}' is in ${state()}, which is not a pre-air stage.`);
}

export async function registerFixtureRights(data: RightsRecordWrite): Promise<StoredRightsRecord> {
  return registerRightsRecord(data);
}

export async function findFixtureRights(id: string): Promise<StoredRightsRecord | null> {
  return rightsRepository.findById(id);
}

/** Best-effort teardown: a failed cleanup must never mask a test result. */
export async function deleteFixtureRights(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await checkDatabaseConnection();
  if (!db.connected) return;
  try {
    await getPrismaClient().rightsRecord.deleteMany({ where: { id: { in: ids } } });
  } catch {
    // fixture rows, not a gate
  }
}

/**
 * A registered record wide enough to clear any slot in the fixture day, so a
 * positive control passes for the right reason (the record exists and covers the
 * window) rather than by accident.
 */
export function fixtureRightsWrite(
  id: string,
  overrides: Partial<RightsRecordWrite> = {}
): RightsRecordWrite {
  return {
    id,
    assetId: `ast-${id}`,
    title: `Fixture rights record ${id}`,
    rightsType: "BROADCAST_LINEAR",
    territory: "NG",
    mediaType: "LINEAR_TV",
    channelCode: null,
    exclusivity: false,
    startDate: new Date(Date.UTC(2020, 0, 1)),
    expiryDate: new Date(Date.UTC(2035, 11, 31)),
    subLicensable: false,
    ...overrides,
  };
}
