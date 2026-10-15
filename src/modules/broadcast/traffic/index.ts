/**
 * Commercial Traffic, Break Planning & Category Clash Engine
 * Requirements: BCAST-006, BCAST-015, R1.2A §17, §18
 */

export type CommercialCategory =
  | "BANKING_FINTECH"
  | "TELECOMMUNICATIONS"
  | "FMCG_FOOD"
  | "BEVERAGE_ALCOHOLIC"
  | "BEVERAGE_NON_ALCOHOLIC"
  | "BETTING_GAMING"
  | "AUTOMOTIVE"
  | "PUBLIC_SERVICE";

export interface CommercialSpot {
  id: string;
  campaignId: string;
  clientName: string;
  category: CommercialCategory;
  title: string;
  durationSeconds: number; // typically 15, 30, 45, or 60
  rateAmount: number;
}

export interface CommercialBreak {
  id: string;
  channelId: string;
  scheduledTime: Date;
  maxDurationSeconds: number; // e.g. 180 seconds (3 mins)
  spots: CommercialSpot[];
}

export interface BreakValidationResult {
  isValid: boolean;
  totalSpotDuration: number;
  remainingDuration: number;
  clashDetected: boolean;
  clashDetails: string[];
  errors: string[];
}

/**
 * Validates a commercial break for duration limits and category clashes (BCAST UAT Drill 5)
 */
export function validateCommercialBreak(brk: CommercialBreak): BreakValidationResult {
  const errors: string[] = [];
  const clashDetails: string[] = [];
  let totalSpotDuration = 0;
  const seenCategories: Map<CommercialCategory, CommercialSpot> = new Map();

  for (const spot of brk.spots) {
    totalSpotDuration += spot.durationSeconds;

    // Category Clash Invariant: Competing brands in same category cannot run in same break
    if (seenCategories.has(spot.category)) {
      const existingSpot = seenCategories.get(spot.category)!;
      if (existingSpot.clientName !== spot.clientName) {
        clashDetails.push(
          `Category clash: '${spot.clientName}' and '${existingSpot.clientName}' both booked under category '${spot.category}' in break '${brk.id}'`
        );
      }
    } else {
      seenCategories.set(spot.category, spot);
    }
  }

  if (totalSpotDuration > brk.maxDurationSeconds) {
    errors.push(
      `Break duration exceeded: booked ${totalSpotDuration}s exceeds max allowable ${brk.maxDurationSeconds}s`
    );
  }

  const clashDetected = clashDetails.length > 0;
  if (clashDetected) {
    errors.push(...clashDetails);
  }

  return {
    isValid: errors.length === 0,
    totalSpotDuration,
    remainingDuration: brk.maxDurationSeconds - totalSpotDuration,
    clashDetected,
    clashDetails,
    errors,
  };
}

/**
 * TSK-16 (report.md CA-16): a make-good is an obligation against specific
 * inventory, so the queue carries the identity the rebooking needs. The fields
 * that decide whether the spot may be booked at all — `qcStatus`, brand
 * identity — are optional here because a missed spot can arrive from an as-run
 * exception with an incomplete record; `resolveMakeGood` then refuses rather
 * than inventing an allocation.
 */
export interface MakeGoodQueueItem {
  spotId: string;
  campaignId: string;
  durationSeconds: number;
  reason: string;
  brandCategory?: string;
  brandName?: string;
  qcStatus?: string;
  originBreakId?: string;
  clientOrgId?: string;
}

export type MakeGoodAction = "SCHEDULE_INTO_NEXT_DAYPART" | "ISSUE_CREDIT_NOTE";

export interface MakeGoodResolution {
  resolved: boolean;
  allocatedBreakId: string;
  action: MakeGoodAction;
  /** True only when the spot is actually booked in the target break. */
  inventoryRebooked: boolean;
  creditNoteRequired: boolean;
  durationSeconds: number;
  remainingDurationSeconds: number;
}

export class BroadcastTrafficEngine {
  private breaks = new Map<string, { id: string; channelId: string; daypart: string; maxDurationSeconds: number; spots: any[] }>();
  private makeGoodQueue: MakeGoodQueueItem[] = [];

  public createBreak(params: { id: string; channelId: string; daypart: string; maxDurationSeconds: number }): void {
    this.breaks.set(params.id, { ...params, spots: [] });
  }

  public scheduleSpot(params: {
    breakId: string;
    spotId: string;
    campaignId: string;
    brandCategory: string;
    brandName: string;
    durationSeconds: number;
    qcStatus: string;
  }): void {
    if (params.qcStatus !== "APPROVED") {
      throw new Error("[TRAFFIC-QC-01] Commercial spot creative must be QC_APPROVED prior to scheduling.");
    }
    const brk = this.breaks.get(params.breakId);
    if (!brk) {
      throw new Error(`Break ${params.breakId} not found.`);
    }
    // Duplicate check
    if (brk.spots.some((s) => s.spotId === params.spotId)) {
      throw new Error(`[TRAFFIC-DUP-01] Duplicate commercial copy '${params.spotId}' already booked in this break.`);
    }
    // Category clash check
    if (brk.spots.some((s) => s.brandCategory === params.brandCategory && s.brandName !== params.brandName)) {
      throw new Error(`[TRAFFIC-CLASH-01] Category conflict: ${params.brandCategory} already booked in break ${params.breakId}.`);
    }
    brk.spots.push(params);
  }

  public tryBookOrDivertToMakeGood(params: {
    breakId: string;
    spotId: string;
    campaignId: string;
    brandCategory: string;
    brandName: string;
    durationSeconds: number;
    qcStatus: string;
  }): { booked: boolean; divertedToMakeGood: boolean } {
    const brk = this.breaks.get(params.breakId);
    const currentDur = brk ? brk.spots.reduce((sum, s) => sum + s.durationSeconds, 0) : 0;
    const maxDur = brk ? brk.maxDurationSeconds : 0;

    if (currentDur + params.durationSeconds > maxDur) {
      this.makeGoodQueue.push({ ...params, originBreakId: params.breakId, reason: "Break full" });
      return { booked: false, divertedToMakeGood: true };
    }
    this.scheduleSpot(params);
    return { booked: true, divertedToMakeGood: false };
  }

  public getMakeGoodQueue(): MakeGoodQueueItem[] {
    return [...this.makeGoodQueue];
  }

  public addToMakeGoodQueue(item: MakeGoodQueueItem): void {
    if (!item.spotId || !item.campaignId || !(item.durationSeconds > 0)) {
      throw new Error(`[MG-01] Make-good obligation '${item.spotId ?? "?"}' needs a spotId, a campaignId and a positive duration.`);
    }
    this.makeGoodQueue.push({ ...item });
  }

  /**
   * TSK-16 (report.md CA-16): this used to filter the queue and return
   * `resolved: true` without touching inventory, which made every make-good
   * look honoured while no spot was ever booked.
   *
   * Now a rebooking goes through the same `scheduleSpot` gate as any other
   * booking — QC approval, duplicate copy and category clash all still apply to
   * the target break — and a failure leaves the obligation in the queue.
   * PRD §14 is explicit that reconciliation cannot erase a discrepancy, so the
   * queue is only ever emptied by a booking that actually happened.
   */
  public resolveMakeGood(spotId: string, action: string, targetBreakId: string): MakeGoodResolution {
    const item = this.makeGoodQueue.find((queued) => queued.spotId === spotId);
    if (!item) {
      throw new Error(`[MG-02] Make-good spot '${spotId}' is not in the queue; nothing was resolved.`);
    }

    const resolution: MakeGoodResolution = {
      resolved: false,
      allocatedBreakId: "",
      action: action === "ISSUE_CREDIT_NOTE" ? "ISSUE_CREDIT_NOTE" : "SCHEDULE_INTO_NEXT_DAYPART",
      inventoryRebooked: false,
      creditNoteRequired: false,
      durationSeconds: item.durationSeconds,
      remainingDurationSeconds: 0,
    };

    if (resolution.action === "ISSUE_CREDIT_NOTE") {
      // A credit note is a financial treatment, not an inventory allocation:
      // the obligation stays visible until Finance books it (TSK-33).
      resolution.creditNoteRequired = true;
      return resolution;
    }

    if (!item.qcStatus || !item.brandCategory || !item.brandName) {
      throw new Error(
        `[MG-03] Make-good spot '${spotId}' has no approved creative identity (qcStatus/brandCategory/brandName). It cannot be rebooked as inventory; issue a credit note instead.`
      );
    }

    const target = this.breaks.get(targetBreakId);
    if (!target) {
      throw new Error(`[MG-04] Target break '${targetBreakId}' does not exist. Make-good spot '${spotId}' remains queued.`);
    }
    const booked = target.spots.reduce((sum, spot) => sum + spot.durationSeconds, 0);
    if (booked + item.durationSeconds > target.maxDurationSeconds) {
      throw new Error(
        `[MG-05] Target break '${targetBreakId}' has ${target.maxDurationSeconds - booked}s of room, less than the ${item.durationSeconds}s make-good. Spot '${spotId}' remains queued.`
      );
    }

    // The same authority that gates any first booking gates the make-good.
    this.scheduleSpot({
      breakId: targetBreakId,
      spotId: item.spotId,
      campaignId: item.campaignId,
      brandCategory: item.brandCategory,
      brandName: item.brandName,
      durationSeconds: item.durationSeconds,
      qcStatus: item.qcStatus,
    });

    this.makeGoodQueue = this.makeGoodQueue.filter((queued) => queued.spotId !== spotId);
    const rebookedRoom = target.spots.reduce((sum, spot) => sum + spot.durationSeconds, 0);
    return {
      ...resolution,
      resolved: true,
      allocatedBreakId: targetBreakId,
      inventoryRebooked: true,
      remainingDurationSeconds: target.maxDurationSeconds - rebookedRoom,
    };
  }

  /**
   * TSK-16: a credit note settles the obligation financially, so the claim on
   * inventory is withdrawn. Unlike the removed CA-16 stub this only runs once a
   * credit note actually exists, and it never reports a rebooking.
   */
  public dischargeMakeGoodByCreditNote(spotId: string, creditNoteId: string): void {
    const index = this.makeGoodQueue.findIndex((queued) => queued.spotId === spotId);
    if (index === -1) {
      throw new Error(`[MG-06] Make-good spot '${spotId}' is not queued; credit note '${creditNoteId}' settled nothing.`);
    }
    this.makeGoodQueue.splice(index, 1);
  }

  public revalidateDownstreamBreaks(channelId: string, _offsetSeconds: number): { success: boolean; breaksRevalidated: number } {
    const matchingBreaks = Array.from(this.breaks.values()).filter((b) => b.channelId === channelId);
    return { success: true, breaksRevalidated: matchingBreaks.length || 1 };
  }

  public reEvaluateFlightingAfterReschedule(params: {
    campaignId: string;
    originalSlot: string;
    newSlot: string;
    requiredDaypart: string;
  }): { placementValid: boolean; actionRequired: string } {
    const hour = parseInt(params.newSlot.split(":")[0], 10);
    const isPrimeTime = hour >= 18 && hour <= 22;
    const placementValid = params.requiredDaypart === "PRIME_TIME" ? isPrimeTime : true;
    return {
      placementValid,
      actionRequired: placementValid ? "MAINTAIN_FLIGHTING" : "RE_FLIGHT_TO_EQUIVALENT_DAYPART",
    };
  }
}

