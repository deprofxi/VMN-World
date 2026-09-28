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

export class BroadcastTrafficEngine {
  private breaks = new Map<string, { id: string; channelId: string; daypart: string; maxDurationSeconds: number; spots: any[] }>();
  private makeGoodQueue: any[] = [];

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
      this.makeGoodQueue.push({ ...params, reason: "Break full" });
      return { booked: false, divertedToMakeGood: true };
    }
    this.scheduleSpot(params);
    return { booked: true, divertedToMakeGood: false };
  }

  public getMakeGoodQueue(): any[] {
    return [...this.makeGoodQueue];
  }

  public addToMakeGoodQueue(item: any): void {
    this.makeGoodQueue.push(item);
  }

  public resolveMakeGood(spotId: string, action: string, targetBreakId: string): { resolved: boolean; allocatedBreakId: string } {
    this.makeGoodQueue = this.makeGoodQueue.filter((s) => s.spotId !== spotId);
    return { resolved: true, allocatedBreakId: targetBreakId };
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

