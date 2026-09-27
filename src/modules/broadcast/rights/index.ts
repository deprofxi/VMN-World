/**
 * Broadcast Rights & Schedule Exploitation Gate
 * Requirements: BCAST-011, R1.2A §45
 */

import { RightsRecordEntity, isRightsActive } from "../../../core/domain/types.js";

export interface ScheduleRightsCheckRequest {
  episodeId: string;
  channelCode: string;
  scheduledAirTime: Date;
  scheduledDurationSeconds: number;
  rightsRecord: RightsRecordEntity;
}

export interface ScheduleRightsValidationResult {
  allowed: boolean;
  reason?: string;
  rightsExpiryDate?: Date;
}

/**
 * Validates linear television broadcast rights prior to schedule commit or playout.
 * Hard rule: No rights clearance -> no exploitation (BCAST-011).
 */
export function validateScheduleRights(
  req: ScheduleRightsCheckRequest
): ScheduleRightsValidationResult {
  const airStart = req.scheduledAirTime;
  const airEnd = new Date(airStart.getTime() + req.scheduledDurationSeconds * 1000);

  // 1. Verify media type includes linear broadcast
  if (
    req.rightsRecord.rightsType !== "BROADCAST_LINEAR" &&
    req.rightsRecord.rightsType !== "SYNDICATION"
  ) {
    return {
      allowed: false,
      reason: `Rights type '${req.rightsRecord.rightsType}' does not permit linear broadcast transmission`,
    };
  }

  // 2. Verify start time is active
  if (airStart < req.rightsRecord.startDate) {
    return {
      allowed: false,
      reason: `Scheduled air time ${airStart.toISOString()} is prior to rights start date ${req.rightsRecord.startDate.toISOString()}`,
    };
  }

  // 3. Verify air finish time does not exceed rights expiration (BCAST UAT Drill 1 & 14)
  if (airEnd > req.rightsRecord.expiryDate) {
    return {
      allowed: false,
      reason: `Broadcast slot finishes at ${airEnd.toISOString()} which exceeds rights expiry date ${req.rightsRecord.expiryDate.toISOString()}`,
      rightsExpiryDate: req.rightsRecord.expiryDate,
    };
  }

  // 4. Verify base domain invariant
  if (!isRightsActive(req.rightsRecord, airStart)) {
    return {
      allowed: false,
      reason: "RightsRecord is currently inactive",
    };
  }

  return {
    allowed: true,
    rightsExpiryDate: req.rightsRecord.expiryDate,
  };
}

export class BroadcastRightsGate {
  public checkRightsReadiness(rightsRecord: RightsRecordEntity, checkDate: Date = new Date()): boolean {
    try {
      return isRightsActive(rightsRecord, checkDate);
    } catch {
      return false;
    }
  }

  public assertRightsClearance(rightsRecord: RightsRecordEntity, checkDate: Date = new Date()): void {
    if (!this.checkRightsReadiness(rightsRecord, checkDate)) {
      throw new Error(`[RIGHTS-EXPIRED] Cannot exploit expired rights '${rightsRecord.id}'`);
    }
  }

  public checkWindow(playDate: Date, start: Date, end: Date): boolean {
    return playDate >= start && playDate <= end;
  }
}

