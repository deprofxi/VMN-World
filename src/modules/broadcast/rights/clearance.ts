/**
 * Broadcast Rights & Schedule Exploitation Gate — the **clearance** half of the
 * rights context. Renamed out of `rights/index.ts` under TSK-14 so a reader
 * cannot mistake rights *request tracking* for rights *clearance* (report.md
 * CA-32: the review-request half was wired and tested, which made the domain
 * look covered while the gate was not).
 * Requirements: BCAST-011, R1.2A §45
 */

import { RightsRecordEntity, isRightsActive } from "../../../core/domain/types.js";

export type RightsBlockingReason =
  | "INVALID_RIGHTS_TYPE"
  | "PRE_START_DATE"
  | "POST_EXPIRY_DATE"
  | "INACTIVE_RIGHTS"
  | "TERRITORY_MISMATCH"
  | "MEDIA_TYPE_MISMATCH"
  | "CHANNEL_NOT_PERMITTED"
  | "SUBLICENSE_NOT_PERMITTED"
  | "EXCLUSIVE_WINDOW_CONFLICT";

export interface ExclusiveWindow {
  channelCode: string;
  startDate: Date;
  expiryDate: Date;
  exclusivity: boolean;
}

export interface ScheduleRightsCheckRequest {
  episodeId: string;
  channelCode: string;
  scheduledAirTime: Date;
  scheduledDurationSeconds: number;
  rightsRecord: RightsRecordEntity;
  targetTerritory?: string; // "NG" | "WEST_AFRICA" | "GLOBAL"
  targetMediaType?: string; // e.g. "LINEAR_TV"
  isSubLicenceAttempt?: boolean;
  existingExclusiveWindows?: ExclusiveWindow[];
}

export interface ScheduleRightsValidationResult {
  allowed: boolean;
  code?: RightsBlockingReason;
  reason?: string;
  rightsExpiryDate?: Date;
}

/**
 * Validates linear television broadcast rights prior to schedule commit or playout.
 * Hard rule: No rights clearance -> no exploitation (BCAST-011, R1.2A §45).
 */
export function validateScheduleRights(
  req: ScheduleRightsCheckRequest
): ScheduleRightsValidationResult {
  const airStart = req.scheduledAirTime;
  const airEnd = new Date(airStart.getTime() + req.scheduledDurationSeconds * 1000);
  const targetTerritory = req.targetTerritory || "NG";
  const targetMediaType = req.targetMediaType || "LINEAR_TV";

  // 1. Verify rights type permits linear broadcast or syndication
  if (
    req.rightsRecord.rightsType !== "BROADCAST_LINEAR" &&
    req.rightsRecord.rightsType !== "SYNDICATION"
  ) {
    return {
      allowed: false,
      code: "INVALID_RIGHTS_TYPE",
      reason: `Rights type '${req.rightsRecord.rightsType}' does not permit linear broadcast transmission`,
    };
  }

  // 2. Verify media type compatibility
  const recordMedia = req.rightsRecord.mediaType || "LINEAR_TV";
  if (recordMedia !== "ALL" && recordMedia !== targetMediaType) {
    return {
      allowed: false,
      code: "MEDIA_TYPE_MISMATCH",
      reason: `Media type '${recordMedia}' does not match requested transmission type '${targetMediaType}'`,
    };
  }

  // 3. Verify territory clearance (NG | WEST_AFRICA | GLOBAL)
  const recordTerritory = req.rightsRecord.territory || "NG";
  const isTerritoryPermitted =
    recordTerritory === "GLOBAL" ||
    (recordTerritory === "WEST_AFRICA" && (targetTerritory === "WEST_AFRICA" || targetTerritory === "NG")) ||
    (recordTerritory === "NG" && targetTerritory === "NG");

  if (!isTerritoryPermitted) {
    return {
      allowed: false,
      code: "TERRITORY_MISMATCH",
      reason: `Rights territory '${recordTerritory}' does not permit transmission in target territory '${targetTerritory}'`,
    };
  }

  // 4. Verify channel scoping if channelCode is constrained on rights record
  if (req.rightsRecord.channelCode && req.rightsRecord.channelCode !== "ALL") {
    if (req.rightsRecord.channelCode !== req.channelCode) {
      return {
        allowed: false,
        code: "CHANNEL_NOT_PERMITTED",
        reason: `Rights record is restricted to channel '${req.rightsRecord.channelCode}', cannot exploit on '${req.channelCode}'`,
      };
    }
  }

  // 5. Verify sub-licensing permission
  if (req.isSubLicenceAttempt && !req.rightsRecord.subLicensable) {
    return {
      allowed: false,
      code: "SUBLICENSE_NOT_PERMITTED",
      reason: `Rights record '${req.rightsRecord.id}' does not grant sub-licensing authorization`,
    };
  }

  // 6. Verify start time is active
  if (airStart < req.rightsRecord.startDate) {
    return {
      allowed: false,
      code: "PRE_START_DATE",
      reason: `Scheduled air time ${airStart.toISOString()} is prior to rights start date ${req.rightsRecord.startDate.toISOString()}`,
    };
  }

  // 7. Verify air finish time does not exceed rights expiration (BCAST UAT Drill 1 & 14)
  if (airEnd > req.rightsRecord.expiryDate) {
    return {
      allowed: false,
      code: "POST_EXPIRY_DATE",
      reason: `Broadcast slot finishes at ${airEnd.toISOString()} which exceeds rights expiry date ${req.rightsRecord.expiryDate.toISOString()}`,
      rightsExpiryDate: req.rightsRecord.expiryDate,
    };
  }

  // 8. Verify exclusivity window overlaps
  if (req.rightsRecord.exclusivity && req.existingExclusiveWindows && req.existingExclusiveWindows.length > 0) {
    for (const win of req.existingExclusiveWindows) {
      if (win.exclusivity) {
        const hasOverlap = airStart < win.expiryDate && airEnd > win.startDate;
        if (hasOverlap && win.channelCode !== req.channelCode) {
          return {
            allowed: false,
            code: "EXCLUSIVE_WINDOW_CONFLICT",
            reason: `Conflicting exclusive window on channel '${win.channelCode}' from ${win.startDate.toISOString()} to ${win.expiryDate.toISOString()}`,
          };
        }
      }
    }
  }

  // 9. Verify base domain invariant
  if (!isRightsActive(req.rightsRecord, airStart)) {
    return {
      allowed: false,
      code: "INACTIVE_RIGHTS",
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

