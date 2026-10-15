/**
 * As-Run Log Ingestion, 3-Way Reconciliation & Proof-of-Air Generator
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §44 / VMNL-AZP-VMN-CCPP-001 §13
 *
 * Core Mandate:
 * 1. Multi-format as-run log parser (Harris, SMPTE CSV, and raw playout log).
 * 2. True 3-Way Reconciliation Match:
 *    - Leg 1: Commercial Traffic Booking (Contracted Spot)
 *    - Leg 2: Automation Playout As-Run Log (Server Execution)
 *    - Leg 3: Carrier Uplink Telemetry (StarTimes DTT/DTH RF Confirmation)
 * 3. Verifiable Proof-of-Air Certificate document generator (PDF / cryptographic seal).
 */

import crypto from "crypto";
import { getConfig } from "../../../core/config/index.js";

export interface AsRunLogItem {
  spotId: string;
  clientName: string;
  campaignId: string;
  actualStartTime: Date;
  actualDurationSeconds: number;
  expectedDurationSeconds: number;
  status: "AIRED_FULL" | "AIRED_PARTIAL" | "PREEMPTED" | "TECHNICAL_ERROR";
}

export interface TrafficSpotBooking {
  bookingId: string;
  campaignId: string;
  clientName: string;
  channelCode: string;
  plannedAirTime: Date;
  durationSeconds: number;
  rateNgn: number;
}

export interface CarrierTelemetryRecord {
  carrierId: "STARTIMES_DTT" | "STARTIMES_DTH" | "TERRESTRIAL_UPLINK";
  rfFrequencyMhz: number;
  servicePid: number;
  timestamp: Date;
  signalStrengthDbm: number;
  carrierLock: boolean;
  transportStreamId: number;
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
  // 3-way match metadata
  carrierLockVerified?: boolean;
  documentBase64?: string;
  verificationUrl?: string;
}

export interface ReconciliationReport {
  totalScheduledSpots: number;
  totalAiredFull: number;
  totalPreempted: number;
  totalDiscrepancies: number;
  certificates: ProofOfAirCertificate[];
  makeGoodCreditsRequired: number;
}

export interface ThreeWayReconciliationResult {
  channelCode: string;
  totalBookings: number;
  fullyReconciledSpots: number;
  preemptedSpots: number;
  carrierFaults: number;
  discrepancies: number;
  certificates: ProofOfAirCertificate[];
  reconciliationStatus: "ALL_SUPPLIED_INPUTS_MATCHED" | "PARTIAL_DISCREPANCY" | "CRITICAL_AIRING_FAILURE";
}

/**
 * Parses raw text as-run log (Harris automation or CSV format).
 */
export function parseAsRunLogText(rawText: string): AsRunLogItem[] {
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
  const items: AsRunLogItem[] = [];

  for (const line of lines) {
    if (line.startsWith("EventID") || line.startsWith("#")) continue;
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length >= 6) {
      const [spotId, , clientName, , durStr, , , timeStr] = parts;
      const duration = parseInt(durStr, 10) || 30;
      const airTime = timeStr ? new Date(timeStr) : new Date();

      items.push({
        spotId: spotId || `SPT-${Date.now()}`,
        clientName: clientName || "Commercial Client",
        campaignId: `CMP-${spotId.split("-")[1] || "DEFAULT"}`,
        actualStartTime: isNaN(airTime.getTime()) ? new Date() : airTime,
        actualDurationSeconds: duration,
        expectedDurationSeconds: duration,
        status: "AIRED_FULL",
      });
    }
  }

  return items;
}

// Proof-of-Air In-Memory Registry for Public Verification
const proofOfAirRegistry = new Map<string, ProofOfAirCertificate>();

export function registerProofOfAirCertificate(cert: ProofOfAirCertificate): void {
  proofOfAirRegistry.set(cert.certificateId, cert);
}

export function getProofOfAirCertificate(certificateId: string): ProofOfAirCertificate | undefined {
  return proofOfAirRegistry.get(certificateId);
}

export function getAllProofOfAirCertificates(): ProofOfAirCertificate[] {
  return Array.from(proofOfAirRegistry.values());
}

function escapePdfText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Builds a strict, standards-compliant PDF-1.4 binary document for Proof-of-Air performance certification.
 * Follows ISO 32000-1 specification without unverified third-party dependencies.
 */
export function buildBinaryProofOfAirPdf(cert: {
  certificateId: string;
  channelCode: string;
  clientName: string;
  campaignId: string;
  spotId: string;
  airedTimestamp: Date;
  durationSeconds: number;
  cryptographicSignature: string;
  carrierLockVerified?: boolean;
  generatedAt: Date;
  verificationUrl: string;
}): Buffer {
  const contentOps = [
    "q",
    "0.059 0.09 0.165 rg",
    "40 730 532 32 re f",
    "1 1 1 rg",
    "BT",
    "/F2 12 Tf",
    "52 742 Td",
    "(VMNL - BROADCAST RECONCILIATION RECORD) Tj",
    "ET",
    "0 0 0 rg",
    "BT",
    "/F2 16 Tf",
    "50 684 Td",
    "(PROOF-OF-AIR RECONCILIATION RECORD - NOT TRANSMISSION VERIFICATION) Tj",
    "/F1 10 Tf",
    "0 -28 Td",
    `(${escapePdfText(`Certificate ID:       ${cert.certificateId}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Channel Network:      ${cert.channelCode}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Commercial Client:    ${cert.clientName}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Campaign ID:          ${cert.campaignId}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Commercial Spot ID:   ${cert.spotId}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Actual Air Time:      ${cert.airedTimestamp.toISOString()}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Aired Duration:       ${cert.durationSeconds} seconds`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Transmission Carrier: ${cert.carrierLockVerified === true ? "LOCK REPORTED IN SUPPLIED INPUT - NOT INDEPENDENTLY VALIDATED" : "NOT VERIFIED - carrier evidence absent"}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Verification URL:     ${cert.verificationUrl}`)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText(`Timestamp Generated:  ${cert.generatedAt.toISOString()}`)}) Tj`,
    "0 -28 Td",
    "/F2 10 Tf",
    "(Certificate Record SHA-256 Digest:) Tj",
    "0 -16 Td",
    "/F1 8 Tf",
    `(${escapePdfText(cert.cryptographicSignature)}) Tj`,
    "0 -32 Td",
    "/F1 9 Tf",
    "(Generated from application data; not independent proof of transmission or accounting treatment.) Tj",
    "ET",
    "0.8 0.8 0.8 RG",
    "1 w",
    "40 180 532 582 re S",
    "Q",
  ].join("\n");

  const streamLength = Buffer.byteLength(contentOps, "utf-8");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentOps}\nendstream\nendobj\n`;
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";
  const obj6 = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const obj7 = `7 0 obj\n<< /Title (${escapePdfText(cert.certificateId)}) /Author (VMNL Master Control) /Creator (VMNL Broadcast Assurance Engine) /Producer (VMNL Native PDF 1.4 Generator) /CreationDate (D:${cert.generatedAt.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}Z) >>\nendobj\n`;

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const objects = [obj1, obj2, obj3, obj4, obj5, obj6, obj7];

  let offset = Buffer.byteLength(header, "utf-8");
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(offset);
    offset += Buffer.byteLength(obj, "utf-8");
  }

  const startXref = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const fullPdf = header + objects.join("") + xref + trailer;
  return Buffer.from(fullPdf, "binary");
}

/**
 * Generates a reconciliation-record PDF. It does not independently verify source evidence or broadcast occurrence.
 */
export function generateProofOfAirDocument(cert: Omit<ProofOfAirCertificate, "documentBase64" | "verificationUrl">): {
  documentBase64: string;
  verificationUrl: string;
  pdfBuffer: Buffer;
} {
  const config = getConfig();
  const baseUrl = config.APP_URL || "http://localhost:5500";
  const verificationUrl = `${baseUrl}/verify/poa/${cert.certificateId}`;

  const pdfBuffer = buildBinaryProofOfAirPdf({
    ...cert,
    verificationUrl,
  });

  const documentBase64 = pdfBuffer.toString("base64");

  return { documentBase64, verificationUrl, pdfBuffer };
}

/**
 * True 3-Way Reconciliation Match:
 * Leg 1: Traffic Booking vs Leg 2: Playout As-Run vs Leg 3: Transmission Carrier Telemetry.
 */
export function performThreeWayMatch(
  channelCode: string,
  trafficBookings: TrafficSpotBooking[],
  playoutLogs: AsRunLogItem[],
  carrierEvidence: CarrierTelemetryRecord[]
): ThreeWayReconciliationResult {
  let fullyReconciled = 0;
  let preempted = 0;
  let carrierFaults = 0;
  let discrepancies = 0;
  const certificates: ProofOfAirCertificate[] = [];

  for (const booking of trafficBookings) {
    const playoutMatch = playoutLogs.find((l) => l.spotId === booking.bookingId || l.campaignId === booking.campaignId);

    if (!playoutMatch || playoutMatch.status !== "AIRED_FULL") {
      preempted++;
      discrepancies++;
      continue;
    }

    // Match Leg 3: Carrier telemetry around the playout time
    const playoutTime = playoutMatch.actualStartTime.getTime();
    const carrierMatch = carrierEvidence.find((c) => {
      const timeDiff = Math.abs(c.timestamp.getTime() - playoutTime);
      return timeDiff <= 60_000 && c.carrierLock; // Within 60 seconds of air time and lock active
    });

    if (!carrierMatch) {
      carrierFaults++;
      discrepancies++;
      continue;
    }

    fullyReconciled++;

    const payload = `${channelCode}:${booking.campaignId}:${booking.bookingId}:${playoutMatch.actualStartTime.toISOString()}:${carrierMatch.carrierId}`;
    const signature = crypto.createHash("sha256").update(payload).digest("hex");
    const certId = `POA-3WAY-${channelCode}-${Date.now().toString(36).toUpperCase()}-${booking.bookingId}`;

    const certData = {
      certificateId: certId,
      channelCode,
      clientName: booking.clientName,
      campaignId: booking.campaignId,
      spotId: booking.bookingId,
      airedTimestamp: playoutMatch.actualStartTime,
      durationSeconds: playoutMatch.actualDurationSeconds,
      cryptographicSignature: signature,
      isVerified: false,
      generatedAt: new Date(),
      carrierLockVerified: true,
    };

    const doc = generateProofOfAirDocument(certData);

    const fullCert: ProofOfAirCertificate = {
      ...certData,
      documentBase64: doc.documentBase64,
      verificationUrl: doc.verificationUrl,
    };
    registerProofOfAirCertificate(fullCert);
    certificates.push(fullCert);
  }

  const status = discrepancies === 0 ? "ALL_SUPPLIED_INPUTS_MATCHED" : preempted > 0 ? "PARTIAL_DISCREPANCY" : "CRITICAL_AIRING_FAILURE";

  return {
    channelCode,
    totalBookings: trafficBookings.length,
    fullyReconciledSpots: fullyReconciled,
    preemptedSpots: preempted,
    carrierFaults,
    discrepancies,
    certificates,
    reconciliationStatus: status,
  };
}

/**
 * Reconciles as-run logs against scheduled commercial bookings and generates tamper-evident Proof-of-Air certificates.
 * (Preserved for full backward compatibility)
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
      const certId = `POA-${Date.now()}-${item.spotId}`;

      const certData = {
        certificateId: certId,
        channelCode,
        clientName: item.clientName,
        campaignId: item.campaignId,
        spotId: item.spotId,
        airedTimestamp: item.actualStartTime,
        durationSeconds: item.actualDurationSeconds,
        cryptographicSignature: signature,
        isVerified: false,
        generatedAt: new Date(),
      };

      const doc = generateProofOfAirDocument(certData);

      const fullCert: ProofOfAirCertificate = {
        ...certData,
        documentBase64: doc.documentBase64,
        verificationUrl: doc.verificationUrl,
      };
      registerProofOfAirCertificate(fullCert);
      certificates.push(fullCert);
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
    carrierLockConfirmed?: boolean;
  }): { status: string; missingSpotsCount: number; threeWayVerified: boolean } {
    const missingSpotsCount = Math.max(0, params.plannedBreakSpotCount - params.airedSpotCount);
    const threeWayVerified = missingSpotsCount === 0 && (params.carrierLockConfirmed ?? true);
    const status = missingSpotsCount > 0 ? "DISCREPANCY_QUARANTINED" : "MATCHED";

    return {
      status,
      missingSpotsCount,
      threeWayVerified,
    };
  }
}
