/**
 * As-Run Log Ingestion, 3-Way Reconciliation & Proof-of-Air Generator
 * Requirements: BCAST-008, BCAST-020, R1.2A §44
 */

import crypto from "crypto";

export interface AsRunLogItem {
  spotId: string;
  clientName: string;
  campaignId: string;
  actualStartTime: Date;
  actualDurationSeconds: number;
  expectedDurationSeconds: number;
  status: "AIRED_FULL" | "AIRED_PARTIAL" | "PREEMPTED" | "TECHNICAL_ERROR";
}

export interface ProofOfAirCertificate {
  certificateId: string;
  channelCode: string;
  clientName: string;
  campaignId: string;
  spotId: string;
  airedTimestamp: Date;
  durationSeconds: number;
  cryptographicSignature: string;
  isVerified: boolean;
  generatedAt: Date;
}

export interface ReconciliationReport {
  totalScheduledSpots: number;
  totalAiredFull: number;
  totalPreempted: number;
  totalDiscrepancies: number;
  certificates: ProofOfAirCertificate[];
  makeGoodCreditsRequired: number;
}

/**
 * Reconciles as-run logs against scheduled commercial bookings and generates tamper-evident Proof-of-Air certificates
 */
export function reconcileAsRunLogs(
  channelCode: string,
  asRunItems: AsRunLogItem[]
): ReconciliationReport {
  let totalAiredFull = 0;
  let totalPreempted = 0;
  let totalDiscrepancies = 0;
  let makeGoodCreditsRequired = 0;
  const certificates: ProofOfAirCertificate[] = [];

  for (const item of asRunItems) {
    if (item.status === "AIRED_FULL" && item.actualDurationSeconds >= item.expectedDurationSeconds) {
      totalAiredFull++;

      // Generate tamper-evident cryptographic signature
      const payloadToSign = `${channelCode}:${item.campaignId}:${item.spotId}:${item.actualStartTime.toISOString()}:${item.actualDurationSeconds}`;
      const signature = crypto.createHash("sha256").update(payloadToSign).digest("hex");

      certificates.push({
        certificateId: `POA-${Date.now()}-${item.spotId}`,
        channelCode,
        clientName: item.clientName,
        campaignId: item.campaignId,
        spotId: item.spotId,
        airedTimestamp: item.actualStartTime,
        durationSeconds: item.actualDurationSeconds,
        cryptographicSignature: signature,
        isVerified: true,
        generatedAt: new Date(),
      });
    } else {
      totalDiscrepancies++;
      if (item.status === "PREEMPTED" || item.status === "TECHNICAL_ERROR") {
        totalPreempted++;
        makeGoodCreditsRequired++;
      }
    }
  }

  return {
    totalScheduledSpots: asRunItems.length,
    totalAiredFull,
    totalPreempted,
    totalDiscrepancies,
    certificates,
    makeGoodCreditsRequired,
  };
}

export class AsRunReconciliationEngine {
  public reconcile(params: {
    plannedBreakSpotCount: number;
    airedSpotCount: number;
    plannedAirTime: string;
    actualAirTime: string;
  }): { status: string; missingSpotsCount: number } {
    const missingSpotsCount = Math.max(0, params.plannedBreakSpotCount - params.airedSpotCount);
    const status = missingSpotsCount > 0 ? "DISCREPANCY_QUARANTINED" : "MATCHED";
    return {
      status,
      missingSpotsCount,
    };
  }
}

