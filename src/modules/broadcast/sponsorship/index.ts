/**
 * Broadcast Sponsorship Engine & On-Air Entitlement Fulfillment Tracker
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §32, §42
 *
 * Core Mandate:
 * Models sponsor brand entitlements (opening billboards, lower-third overlays, verbal mentions,
 * co-branded segments) and automatically audits playout fulfillment against contracted minimums.
 */

export interface SponsorEntitlement {
  id: string;
  sponsorName: string;
  brand: string;
  channelCode: string;
  programmeCode: string;
  campaignCode: string;
  contractedOnScreenSeconds: number;
  contractedBillboardsCount: number;
  contractedLowerThirdsCount: number;
  deliveredOnScreenSeconds: number;
  deliveredBillboardsCount: number;
  deliveredLowerThirdsCount: number;
  status: "ACTIVE" | "COMPLETED" | "UNDER_DELIVERED" | "BREACH";
  startDate: Date;
  endDate: Date;
}

export interface SponsorImpressionLog {
  entitlementId: string;
  asRunLogId: string;
  impressionType: "BILLBOARD" | "LOWER_THIRD" | "SEGMENT_SPONSOR" | "GRAPHIC_BUG";
  durationSeconds: number;
  loggedAt: Date;
}

export class SponsorshipEngine {
  private entitlements = new Map<string, SponsorEntitlement>();
  private impressions: SponsorImpressionLog[] = [];

  public createEntitlement(entitlement: Omit<SponsorEntitlement, "deliveredOnScreenSeconds" | "deliveredBillboardsCount" | "deliveredLowerThirdsCount" | "status">): SponsorEntitlement {
    const fullEntitlement: SponsorEntitlement = {
      ...entitlement,
      deliveredOnScreenSeconds: 0,
      deliveredBillboardsCount: 0,
      deliveredLowerThirdsCount: 0,
      status: "ACTIVE",
    };
    this.entitlements.set(fullEntitlement.id, fullEntitlement);
    return fullEntitlement;
  }

  public logImpression(log: SponsorImpressionLog): { entitlement: SponsorEntitlement; fulfillmentPercent: number } {
    const entitlement = this.entitlements.get(log.entitlementId);
    if (!entitlement) {
      throw new Error(`[SPONSOR-01] Entitlement '${log.entitlementId}' not found.`);
    }

    this.impressions.push(log);
    entitlement.deliveredOnScreenSeconds += log.durationSeconds;

    if (log.impressionType === "BILLBOARD") {
      entitlement.deliveredBillboardsCount += 1;
    } else if (log.impressionType === "LOWER_THIRD") {
      entitlement.deliveredLowerThirdsCount += 1;
    }

    const secRatio = entitlement.contractedOnScreenSeconds > 0
      ? entitlement.deliveredOnScreenSeconds / entitlement.contractedOnScreenSeconds
      : 1.0;
    const bbRatio = entitlement.contractedBillboardsCount > 0
      ? entitlement.deliveredBillboardsCount / entitlement.contractedBillboardsCount
      : 1.0;
    const ltRatio = entitlement.contractedLowerThirdsCount > 0
      ? entitlement.deliveredLowerThirdsCount / entitlement.contractedLowerThirdsCount
      : 1.0;

    const fulfillmentPercent = Math.min(100, Math.round(((secRatio + bbRatio + ltRatio) / 3) * 100));

    if (fulfillmentPercent >= 100) {
      entitlement.status = "COMPLETED";
    }

    return { entitlement, fulfillmentPercent };
  }

  public getEntitlement(id: string): SponsorEntitlement | undefined {
    return this.entitlements.get(id);
  }

  public getAuditReport(id: string): {
    entitlement: SponsorEntitlement;
    fulfillmentPercent: number;
    isDeliveredFully: boolean;
    deficitSeconds: number;
  } {
    const entitlement = this.entitlements.get(id);
    if (!entitlement) {
      throw new Error(`[SPONSOR-02] Entitlement '${id}' not found.`);
    }

    const deficitSeconds = Math.max(0, entitlement.contractedOnScreenSeconds - entitlement.deliveredOnScreenSeconds);
    const fulfillmentPercent = entitlement.contractedOnScreenSeconds > 0
      ? Math.min(100, Math.round((entitlement.deliveredOnScreenSeconds / entitlement.contractedOnScreenSeconds) * 100))
      : 100;

    return {
      entitlement,
      fulfillmentPercent,
      isDeliveredFully: deficitSeconds === 0,
      deficitSeconds,
    };
  }
}
