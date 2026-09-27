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
