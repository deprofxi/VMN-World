/**
 * Proof-of-Air Delivery Exceptions — UX-BR-030 / UX-GOV-006 (J-RL1-10)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14 (as-run reconciliation),
 * §42 (delivery-based billing), FIN-07 (make-good obligations).
 *
 * TSK-16 (report.md CA-16): the exceptions workbench used to render two
 * hard-coded rows and its resolve route wrote an audit log and reported
 * "Make-good slot reserved and counterparty notification logged to ledger" —
 * nothing was reserved and nothing was logged to a ledger. This module is the
 * register that desk reads from: an exception exists because an as-run
 * reconciliation measured a delivery shortfall, and it carries the linkage to
 * the two remedies the engines actually own — the traffic make-good obligation
 * (inventory) and the billing make-good / credit note (finance).
 *
 * Ownership rule: this register records the exception and which remedy closed
 * it. It never books inventory and never issues a credit — those decisions
 * belong to `BroadcastTrafficEngine.resolveMakeGood` and
 * `BroadcastBillingEngine.issueCreditNoteForMakeGood`, which are called through
 * here so the desk cannot report a success the engines refused. Since TSK-33 a
 * credit remedy also requires the ledger: the credit note is journaled by
 * `LedgerPostingService.postMakeGoodCreditNote` before the exception is allowed
 * to close, so the desk names a real `JournalEntry.id` (or shows the refusal).
 *
 * Stated limit (Rule 0.4a): the register is per-process state. The durable
 * `AsRunLogRecord` (`prisma/schema.prisma:398`) stores aggregate counts only —
 * no per-spot shortfall and no credit linkage — so there is nothing to hydrate
 * these rows from yet. A restart empties the desk; it does not fabricate rows.
 */

import { BroadcastTrafficEngine } from "../traffic/index.js";
import { BroadcastBillingEngine, DaypartClassification } from "../billing/index.js";

/** How the delivery failed, measured from the as-run record itself. */
export type PoaExceptionNature = "SPOT_PREEMPTED" | "UNDER_DELIVERY_TIME" | "TECHNICAL_FAILURE";

/** Which remedy closed the exception. OPEN means the obligation is still owed. */
export type PoaExceptionStatus = "OPEN" | "MAKE_GOOD_REBOOKED" | "CREDIT_NOTE_ISSUED";

export interface PoaDeliveryException {
  id: string;
  channelCode: string;
  campaignId: string;
  clientName: string;
  spotId: string;
  nature: PoaExceptionNature;
  plannedDurationSeconds: number;
  airedDurationSeconds: number;
  /** The undelivered inventory this exception owes. */
  shortfallSeconds: number;
  /** `BillingMakeGood.id` raised by the billing engine for the same spot. */
  makeGoodId: string;
  /** Provisional rate-card value carried by that make-good. */
  makeGoodValueNgn: number;
  status: PoaExceptionStatus;
  /** Break the make-good was actually booked into (TSK-16 rebooking). */
  allocatedBreakId?: string;
  creditNoteId?: string;
  /** `JournalEntry.id` of the durable contra-revenue posting (TSK-33). */
  journalEntryId?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export interface PoaAsRunInputItem {
  spotId: string;
  campaignId: string;
  clientName: string;
  actualStartTime: Date;
  actualDurationSeconds: number;
  expectedDurationSeconds: number;
  status: "AIRED_FULL" | "AIRED_PARTIAL" | "PREEMPTED" | "TECHNICAL_ERROR";
  daypart?: DaypartClassification;
  /**
   * Creative identity, when the ingesting system supplies it. Without it the
   * traffic engine refuses to rebook as inventory ([MG-03]) and the only
   * available remedy is the credit note — the desk does not invent an approval.
   */
  brandCategory?: string;
  qcStatus?: string;
}

const exceptions = new Map<string, PoaDeliveryException>();

function exceptionId(campaignId: string, spotId: string): string {
  return `EXP-${campaignId}-${spotId}`;
}

function natureOf(item: PoaAsRunInputItem): PoaExceptionNature {
  if (item.status === "TECHNICAL_ERROR") return "TECHNICAL_FAILURE";
  if (item.status === "PREEMPTED" || item.actualDurationSeconds === 0) return "SPOT_PREEMPTED";
  return "UNDER_DELIVERY_TIME";
}

/** An as-run record is a delivery exception unless it aired the full contracted length. */
function isDiscrepancy(item: PoaAsRunInputItem): boolean {
  return !(item.status === "AIRED_FULL" && item.actualDurationSeconds >= item.expectedDurationSeconds);
}

/**
 * Raises the delivery exceptions for one reconciled as-run batch.
 *
 * The billing side is not recomputed here: the whole batch goes through
 * `generateBillingScheduleFromAsRun`, which is the engine that already owns
 * delivery-based recognition, so the exception's make-good value is the rate
 * card the billing engine itself priced, not a figure this register invents.
 *
 * Idempotent per spot: a re-run of the same log raises nothing, and an
 * exception already closed by a credit note is never re-opened by a second
 * ingestion.
 */
export function raisePoaExceptionsFromAsRun(params: {
  channelCode: string;
  items: PoaAsRunInputItem[];
  traffic: BroadcastTrafficEngine;
  billing: BroadcastBillingEngine;
}): { exceptions: PoaDeliveryException[]; raised: number; discrepancies: number } {
  const discrepant = params.items.filter(isDiscrepancy);
  const fresh = discrepant.filter((item) => !exceptions.has(exceptionId(item.campaignId, item.spotId)));
  if (fresh.length === 0) {
    return { exceptions: listPoaExceptions(), raised: 0, discrepancies: discrepant.length };
  }

  const billedCampaigns = new Set(fresh.map((item) => item.campaignId));
  const makeGoods = new Map<string, { id: string; valueNgn: number }>();
  for (const campaignId of billedCampaigns) {
    // Every spot of the campaign, not just the failures: the engine derives the
    // matched/missed split and the recognised value from the full delivery set.
    const campaignItems = params.items.filter((item) => item.campaignId === campaignId);
    const startTimes = campaignItems.map((item) => item.actualStartTime.getTime());
    const { makeGoods: raised } = params.billing.generateBillingScheduleFromAsRun({
      campaignCode: campaignId,
      clientName: campaignItems[0].clientName,
      // The as-run log names the client, not the brand; the schedule carries the
      // client on both fields rather than inventing a brand name.
      brand: campaignItems[0].clientName,
      channelCode: params.channelCode,
      contractedSpots: campaignItems.length,
      asRunItems: campaignItems.map((item) => ({
        spotId: item.spotId,
        campaignId: item.campaignId,
        status: item.status === "AIRED_PARTIAL" ? "PARTIAL" as const : item.status === "AIRED_FULL" ? "AIRED_FULL" as const : item.status,
        expectedDurationSeconds: item.expectedDurationSeconds,
        actualDurationSeconds: item.actualDurationSeconds,
        daypart: item.daypart,
      })),
      startDate: new Date(Math.min(...startTimes)),
      endDate: new Date(Math.max(...startTimes)),
    });
    for (const mg of raised) makeGoods.set(`${mg.campaignCode}:${mg.spotId}`, { id: mg.id, valueNgn: mg.valueNgn });
  }

  const raisedNow: PoaDeliveryException[] = [];
  for (const item of fresh) {
    const makeGood = makeGoods.get(`${item.campaignId}:${item.spotId}`);
    if (!makeGood) {
      // The billing engine priced no obligation for a spot it saw as delivered.
      // That contradicts this module's own discrepancy test, so it is a defect,
      // not a business case — refuse rather than record an unlinked exception.
      throw new Error(`[POA-EXP-04] No billing make-good was raised for '${item.spotId}' of campaign '${item.campaignId}'.`);
    }
    const shortfall = Math.max(0, item.expectedDurationSeconds - item.actualDurationSeconds);
    const exception: PoaDeliveryException = {
      id: exceptionId(item.campaignId, item.spotId),
      channelCode: params.channelCode,
      campaignId: item.campaignId,
      clientName: item.clientName,
      spotId: item.spotId,
      nature: natureOf(item),
      plannedDurationSeconds: item.expectedDurationSeconds,
      airedDurationSeconds: item.actualDurationSeconds,
      shortfallSeconds: shortfall,
      makeGoodId: makeGood.id,
      makeGoodValueNgn: makeGood.valueNgn,
      status: "OPEN",
      createdAt: new Date(),
    };

    // Nothing is owed as inventory when the spot ran its full length and only
    // its status differs (a clipped/late flag with no lost seconds) — the
    // obligation is then purely financial, so the traffic queue is not fed a
    // zero-second make-good it would have to refuse.
    if (shortfall > 0) {
      params.traffic.addToMakeGoodQueue({
        spotId: item.spotId,
        campaignId: item.campaignId,
        durationSeconds: shortfall,
        brandCategory: item.brandCategory,
        brandName: item.clientName,
        qcStatus: item.qcStatus,
        clientOrgId: item.clientName,
        reason: `Proof-of-air ${exception.nature}: planned ${item.expectedDurationSeconds}s, run ${item.actualDurationSeconds}s`,
      });
    }

    exceptions.set(exception.id, exception);
    raisedNow.push(exception);
  }

  return { exceptions: listPoaExceptions(), raised: raisedNow.length, discrepancies: discrepant.length };
}

export function getPoaException(id: string): PoaDeliveryException | undefined {
  return exceptions.get(id);
}

export function listPoaExceptions(filter?: { status?: PoaExceptionStatus }): PoaDeliveryException[] {
  const all = [...exceptions.values()];
  return filter?.status ? all.filter((e) => e.status === filter.status) : all;
}

/** Consolidated delivery shortfall still owed, in seconds of commercial inventory. */
export function totalOpenShortfallSeconds(): number {
  return listPoaExceptions({ status: "OPEN" }).reduce((sum, e) => sum + e.shortfallSeconds, 0);
}

export type PoaResolutionType = "APPROVE_MAKE_GOOD" | "ISSUE_CREDIT_NOTE";

/**
 * TSK-33: the credit remedy needs a ledger. Declared structurally (the same
 * shape `publishContent` takes for `destinationRegistry`) so the broadcast
 * register states what it requires without importing the finance module.
 * `LedgerPostingService.postMakeGoodCreditNote` satisfies it.
 */
export interface MakeGoodCreditLedger {
  postMakeGoodCreditNote(params: {
    creditNoteId: string;
    campaignCode: string;
    spotId: string;
    valueNgn: number;
    reason: string;
    issuedBy: string;
  }): { entry: { id: string } };
}

/**
 * Closes an exception through the engine that owns the remedy, then records
 * what that engine actually returned. A refusal propagates: the register is
 * untouched, so the desk cannot show a closed exception the engine declined.
 */
export function resolvePoaException(params: {
  exceptionId: string;
  resolutionType: PoaResolutionType;
  actor: string;
  targetBreakId?: string;
  traffic: BroadcastTrafficEngine;
  billing: BroadcastBillingEngine;
  ledger: MakeGoodCreditLedger;
}): PoaDeliveryException {
  const exception = exceptions.get(params.exceptionId);
  if (!exception) {
    throw new Error(`[POA-EXP-01] Delivery exception '${params.exceptionId}' is not registered; nothing was resolved.`);
  }
  if (exception.status !== "OPEN") {
    throw new Error(`[POA-EXP-02] Delivery exception '${exception.id}' is already ${exception.status}.`);
  }

  if (params.resolutionType === "APPROVE_MAKE_GOOD") {
    if (!params.targetBreakId) {
      throw new Error(
        `[POA-EXP-03] A make-good authorisation must name the break the ${exception.shortfallSeconds}s obligation is booked into.`
      );
    }
    const outcome = params.traffic.resolveMakeGood(exception.spotId, "SCHEDULE_INTO_NEXT_DAYPART", params.targetBreakId);
    if (!outcome.inventoryRebooked) {
      throw new Error(`[POA-EXP-05] The traffic engine rebooked no inventory into '${params.targetBreakId}'.`);
    }
    exception.status = "MAKE_GOOD_REBOOKED";
    exception.allocatedBreakId = outcome.allocatedBreakId;
  } else {
    const note = params.billing.issueCreditNoteForMakeGood({
      makeGoodId: exception.makeGoodId,
      issuedBy: params.actor,
      note: `Credit note for proof-of-air exception ${exception.id} (${exception.nature}).`,
    });
    // TSK-33: the credit is a financial fact the moment it is issued, so it is
    // journaled before the exception is allowed to close. The ledger is a
    // required collaborator precisely because the CA-16 desk reported a ledger
    // entry that no code produced; an unposted credit must not look settled.
    const { entry } = params.ledger.postMakeGoodCreditNote({
      creditNoteId: note.id,
      campaignCode: note.campaignCode,
      spotId: note.spotId,
      valueNgn: note.valueNgn,
      reason: note.reason,
      issuedBy: note.issuedBy,
    });
    exception.status = "CREDIT_NOTE_ISSUED";
    exception.creditNoteId = note.id;
    exception.journalEntryId = entry.id;
    // The inventory obligation is discharged by the credit, not forgotten: the
    // traffic queue would otherwise keep offering a spot the client has been
    // paid for. An exception that owed no seconds never entered the queue.
    if (exception.shortfallSeconds > 0) {
      params.traffic.dischargeMakeGoodByCreditNote(exception.spotId, note.id);
    }
  }

  exception.resolvedAt = new Date();
  exception.resolvedBy = params.actor;
  return { ...exception };
}

export function _resetPoaExceptionsForTesting(): void {
  exceptions.clear();
}
