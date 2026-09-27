/**
 * StarTimes Carriage & Transmission Monitoring Engine
 * Requirements: BCAST-009, BCAST-010, R1.2A §21
 */

export interface TransmissionIncident {
  id: string;
  channelCode: string;
  platform: "STARTIMES_DTT" | "STARTIMES_DTH" | "PLAYOUT_SERVER";
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  startedAt: Date;
  resolvedAt?: Date | null;
  outageDurationSeconds: number;
  rootCause: string;
  affectedSpotsCount: number;
  slaPenaltyApplicable: boolean;
}

/**
 * Calculates transmission outage duration and checks SLA penalty threshold
 */
export function recordTransmissionOutage(
  channelCode: string,
  platform: "STARTIMES_DTT" | "STARTIMES_DTH" | "PLAYOUT_SERVER",
  startedAt: Date,
  resolvedAt: Date,
  rootCause: string,
  affectedSpots: number = 0
): TransmissionIncident {
  const outageDurationSeconds = Math.max(
    0,
    Math.floor((resolvedAt.getTime() - startedAt.getTime()) / 1000)
  );

  // SLA Invariant: Outages exceeding 300 seconds (5 minutes) incur SLA penalties
  const slaPenaltyApplicable = outageDurationSeconds > 300;
  const severity =
    outageDurationSeconds > 1800
      ? "CRITICAL"
      : outageDurationSeconds > 300
      ? "MAJOR"
      : "MINOR";

  return {
    id: `inc-${Date.now()}`,
    channelCode,
    platform,
    severity,
    startedAt,
    resolvedAt,
    outageDurationSeconds,
    rootCause,
    affectedSpotsCount: affectedSpots,
    slaPenaltyApplicable,
  };
}

export class CarriageMonitoringEngine {
  public logTransmissionIncident(params: {
    id: string;
    carrier: string;
    channelId: string;
    startUtc: Date;
    endUtc: Date;
    rootCause: string;
  }): { id: string; durationMinutes: number } {
    const durationMinutes = Math.round((params.endUtc.getTime() - params.startUtc.getTime()) / (1000 * 60));
    return {
      id: params.id,
      durationMinutes,
    };
  }

  public calculateAffectedAdCredits(
    incident: { durationMinutes: number },
    affectedSpotsCount: number
  ): { makeGoodSpotsDue: number } {
    return {
      makeGoodSpotsDue: affectedSpotsCount,
    };
  }

  public calculateSlaPenalty(params: {
    monthlyUptimePercent: number;
    contractedSlaUptimePercent: number;
    monthlyCarriageFeeNgn: number;
  }): { slaViolated: boolean; rebateDueNgn: number } {
    const deficit = params.contractedSlaUptimePercent - params.monthlyUptimePercent;
    const slaViolated = deficit > 0;
    const rebateDueNgn = slaViolated ? Math.round(params.monthlyCarriageFeeNgn * (deficit / 100)) : 0;
    return {
      slaViolated,
      rebateDueNgn,
    };
  }
}

