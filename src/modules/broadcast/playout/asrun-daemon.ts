/**
 * Broadcast Playout As-Run Log Ingestion & Automated Reconciliation Daemon
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§57) / CCPP-001 §14
 *
 * Ingests raw playout transmission logs from MCR hardware automation and
 * executes automated reconciliation against scheduled commercial traffic logs.
 */

export interface RawAsRunEntry {
  channelCode: string;
  itemId: string;
  itemType: "PROGRAM" | "COMMERCIAL" | "PROMO" | "STATION_ID";
  scheduledTime: string;
  actualAirTime: string;
  scheduledDurationSec: number;
  actualDurationSec: number;
  playoutServerId: string;
  status: "PLAYED" | "ABORTED" | "SKIPPED" | "ERROR";
  deviceError?: string;
}

export type DiscrepancySeverity = "NONE" | "MINOR" | "MAJOR" | "CRITICAL";

export interface ReconciliationResult {
  channelCode: string;
  itemId: string;
  reconciled: boolean;
  status: "AIRED_VERIFIED" | "UNDER_DELIVERED" | "OVER_RUN" | "MISSED_AIRING";
  varianceSeconds: number;
  discrepancySeverity: DiscrepancySeverity;
  makeGoodRequired: boolean;
  notes: string;
}

export class AsRunIngestionDaemon {
  /**
   * Parses raw CSV transmission log export from MCR hardware playout server.
   */
  public static parseCsvLog(csvContent: string): RawAsRunEntry[] {
    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const entries: RawAsRunEntry[] = [];
    const rows = lines.slice(1);

    for (const row of rows) {
      const parts = row.split(",").map((s) => s.trim());
      if (parts.length < 8) continue;

      const [channelCode, itemId, itemType, scheduledTime, actualAirTime, schedDur, actDur, serverId, status, deviceError] = parts;
      entries.push({
        channelCode,
        itemId,
        itemType: (itemType as RawAsRunEntry["itemType"]) || "COMMERCIAL",
        scheduledTime,
        actualAirTime,
        scheduledDurationSec: Number(schedDur) || 0,
        actualDurationSec: Number(actDur) || 0,
        playoutServerId: serverId,
        status: (status as RawAsRunEntry["status"]) || "PLAYED",
        deviceError: deviceError || undefined,
      });
    }

    return entries;
  }

  /**
   * Reconciles a raw as-run log entry against scheduled traffic requirements.
   */
  public static reconcileEntry(
    entry: RawAsRunEntry,
    toleranceSeconds = 2
  ): ReconciliationResult {
    if (entry.status !== "PLAYED" || entry.actualDurationSec === 0) {
      return {
        channelCode: entry.channelCode,
        itemId: entry.itemId,
        reconciled: false,
        status: "MISSED_AIRING",
        varianceSeconds: -entry.scheduledDurationSec,
        discrepancySeverity: "CRITICAL",
        makeGoodRequired: entry.itemType === "COMMERCIAL",
        notes: `Spot did not air on ${entry.channelCode}: playout status '${entry.status}'. Error: ${entry.deviceError || "Playout engine failure"}`,
      };
    }

    const varianceSeconds = entry.actualDurationSec - entry.scheduledDurationSec;

    if (Math.abs(varianceSeconds) <= toleranceSeconds) {
      return {
        channelCode: entry.channelCode,
        itemId: entry.itemId,
        reconciled: true,
        status: "AIRED_VERIFIED",
        varianceSeconds,
        discrepancySeverity: "NONE",
        makeGoodRequired: false,
        notes: `Verified broadcast transmission within tolerance (variance: ${varianceSeconds}s).`,
      };
    }

    if (varianceSeconds < -toleranceSeconds) {
      const isMajor = Math.abs(varianceSeconds) > 5;
      return {
        channelCode: entry.channelCode,
        itemId: entry.itemId,
        reconciled: false,
        status: "UNDER_DELIVERED",
        varianceSeconds,
        discrepancySeverity: isMajor ? "MAJOR" : "MINOR",
        makeGoodRequired: entry.itemType === "COMMERCIAL" && isMajor,
        notes: `Spot clipped or cut short by ${Math.abs(varianceSeconds)} seconds.`,
      };
    }

    return {
      channelCode: entry.channelCode,
      itemId: entry.itemId,
      reconciled: true,
      status: "OVER_RUN",
      varianceSeconds,
      discrepancySeverity: "MINOR",
      makeGoodRequired: false,
      notes: `Spot over-ran by ${varianceSeconds} seconds.`,
    };
  }
}
