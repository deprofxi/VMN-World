/**
 * Azeebo+ Level 3 Federation: Cross-Platform Conversion & Attribution Funnel
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §71 / VMNL-AZP-VMN-CCPP-001 §16
 *
 * Core Mandate:
 * Tracks 6-stage cross-platform conversion from linear TV airtime to digital Azeebo+ subscription.
 * Adheres strictly to NDPR / GDPR privacy laws with SHA-256 pseudonymized identifiers.
 */

import { createHash } from "node:crypto";

export type FunnelStage =
  | "BROADCAST_AIRING"
  | "QR_SCAN_CLICK"
  | "LANDING_PAGE_VISIT"
  | "USER_REGISTRATION"
  | "SUBSCRIPTION_PURCHASE"
  | "LONG_TERM_ENGAGEMENT";

export interface FunnelEvent {
  id: string;
  stage: FunnelStage;
  campaignId: string;
  channelId?: "NXTR" | "ORIS" | "IMBD";
  trackingId: string;
  pseudonymizedUserId?: string; // SHA-256 hash of email/phone
  gmvNgn?: number;
  timestamp: Date;
}

export interface FunnelSummary {
  campaignId: string;
  totalBroadcastAired: number;
  totalQrScans: number;
  totalLandingVisits: number;
  totalRegistrations: number;
  totalSubscriptions: number;
  totalGmvNgn: number;
  scanToVisitRatePercent: number;
  visitToRegistrationRatePercent: number;
  registrationToPaidRatePercent: number;
  overallAirToSubscriptionRatePercent: number;
}

export class AzeeboAttributionEngine {
  private events: FunnelEvent[] = [];

  public static hashUserIdentifier(identifier: string): string {
    return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
  }

  public recordEvent(params: {
    stage: FunnelStage;
    campaignId: string;
    channelId?: "NXTR" | "ORIS" | "IMBD";
    trackingId: string;
    rawUserIdentifier?: string; // Automatically hashed for privacy
    gmvNgn?: number;
  }): FunnelEvent {
    const pseudonymizedUserId = params.rawUserIdentifier
      ? AzeeboAttributionEngine.hashUserIdentifier(params.rawUserIdentifier)
      : undefined;

    const event: FunnelEvent = {
      id: `FNL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: params.stage,
      campaignId: params.campaignId,
      channelId: params.channelId,
      trackingId: params.trackingId,
      pseudonymizedUserId,
      gmvNgn: params.gmvNgn ?? 0,
      timestamp: new Date(),
    };

    this.events.push(event);
    return event;
  }

  public getFunnelSummary(campaignId: string): FunnelSummary {
    const campaignEvents = this.events.filter((e) => e.campaignId === campaignId);

    const airs = campaignEvents.filter((e) => e.stage === "BROADCAST_AIRING").length;
    const scans = campaignEvents.filter((e) => e.stage === "QR_SCAN_CLICK").length;
    const visits = campaignEvents.filter((e) => e.stage === "LANDING_PAGE_VISIT").length;
    const regs = campaignEvents.filter((e) => e.stage === "USER_REGISTRATION").length;
    const subs = campaignEvents.filter((e) => e.stage === "SUBSCRIPTION_PURCHASE");

    const totalSubscriptions = subs.length;
    const totalGmvNgn = subs.reduce((sum, s) => sum + (s.gmvNgn || 0), 0);

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    return {
      campaignId,
      totalBroadcastAired: airs,
      totalQrScans: scans,
      totalLandingVisits: visits,
      totalRegistrations: regs,
      totalSubscriptions,
      totalGmvNgn,
      scanToVisitRatePercent: pct(visits, scans),
      visitToRegistrationRatePercent: pct(regs, visits),
      registrationToPaidRatePercent: pct(totalSubscriptions, regs),
      overallAirToSubscriptionRatePercent: pct(totalSubscriptions, airs),
    };
  }

  public getEvents(): FunnelEvent[] {
    return [...this.events];
  }
}
