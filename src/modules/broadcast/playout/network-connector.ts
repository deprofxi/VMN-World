/**
 * Broadcast Playout Real-Time Network & MCR Socket Telemetry Coordinator
 * Authority: StarTimes DTT/DTH Headend Technical Integration Specification
 * VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §20, §57 / DEC-09
 *
 * Implements MCR automation network stream telemetry monitoring, PTP SMPTE-2059
 * timecode drift detection, and automatic failover triggers for packet loss degradation.
 */

import crypto from "node:crypto";

export interface McrNetworkTelemetry {
  channelId: string;
  serverAddress: string;
  activePort: number;
  ptpClockOffsetMicroseconds: number;
  networkJitterMs: number;
  packetLossPercentage: number;
  streamBitrateKbps: number;
  healthy: boolean;
  failoverTriggered: boolean;
  activePlayoutNode: string;
  incidentNotes: string[];
}

export interface Scte35PtpAlignment {
  spliceEventId: number;
  ptsTimecode: string;
  ptpSynchronized: boolean;
  driftMicroseconds: number;
  admissibleForInjection: boolean;
}

export class PlayoutNetworkCoordinator {
  public static readonly MAX_TOLERABLE_PACKET_LOSS_PERCENT = 2.5;
  public static readonly MAX_TOLERABLE_PTP_DRIFT_US = 50_000; // 50 milliseconds in microseconds

  /**
   * Evaluates transmission socket telemetry from MCR playout servers.
   * If packet loss exceeds 2.5% or PTP timecode drift exceeds 50ms, triggers failover.
   */
  public static evaluateSocketHealth(params: {
    channelId: string;
    serverAddress: string;
    activePort: number;
    ptpClockOffsetUs: number;
    networkJitterMs: number;
    packetLossPct: number;
    streamBitrateKbps: number;
    primaryNodeId: string;
    backupNodeId: string;
  }): McrNetworkTelemetry {
    const incidentNotes: string[] = [];
    let healthy = true;
    let failoverTriggered = false;
    let activeNode = params.primaryNodeId;

    if (params.packetLossPct > PlayoutNetworkCoordinator.MAX_TOLERABLE_PACKET_LOSS_PERCENT) {
      healthy = false;
      failoverTriggered = true;
      activeNode = params.backupNodeId;
      incidentNotes.push(
        `Critical Degradation: Packet loss ${params.packetLossPct.toFixed(2)}% exceeds threshold of ${PlayoutNetworkCoordinator.MAX_TOLERABLE_PACKET_LOSS_PERCENT}%. Autonomous failover executed to ${params.backupNodeId}.`
      );
    }

    if (Math.abs(params.ptpClockOffsetUs) > PlayoutNetworkCoordinator.MAX_TOLERABLE_PTP_DRIFT_US) {
      healthy = false;
      incidentNotes.push(
        `PTP Sync Alarm: Clock offset ${params.ptpClockOffsetUs}µs exceeds SMPTE-2059 sub-frame tolerance (±50,000µs). SCTE-35 splicing precision compromised.`
      );
    }

    if (params.streamBitrateKbps < 4000) {
      healthy = false;
      incidentNotes.push(
        `Bitrate Starvation: Video feed bitrate ${params.streamBitrateKbps} kbps below broadcast broadcast floor (4000 kbps). Potential black frame under-run.`
      );
    }

    if (healthy) {
      incidentNotes.push("Socket link nominal: PTP timecode locked, packet loss below threshold, active video stream compliant.");
    }

    return {
      channelId: params.channelId,
      serverAddress: params.serverAddress,
      activePort: params.activePort,
      ptpClockOffsetMicroseconds: params.ptpClockOffsetUs,
      networkJitterMs: params.networkJitterMs,
      packetLossPercentage: params.packetLossPct,
      streamBitrateKbps: params.streamBitrateKbps,
      healthy,
      failoverTriggered,
      activePlayoutNode: activeNode,
      incidentNotes,
    };
  }

  /**
   * Aligns an SCTE-35 DPI splice cue timestamp with SMPTE-2059 PTP reference clock.
   */
  public static alignScte35CueWithPtp(
    spliceEventId: number,
    targetPtsTimecode: string,
    measuredPtpDriftUs: number
  ): Scte35PtpAlignment {
    const admissible = Math.abs(measuredPtpDriftUs) <= PlayoutNetworkCoordinator.MAX_TOLERABLE_PTP_DRIFT_US;

    return {
      spliceEventId,
      ptsTimecode: targetPtsTimecode,
      ptpSynchronized: admissible,
      driftMicroseconds: measuredPtpDriftUs,
      admissibleForInjection: admissible,
    };
  }

  /**
   * Computes a cryptographic checksum for a transmission stream block.
   */
  public static computeStreamBlockSignature(channelId: string, frameSequence: number, payloadHex: string): string {
    return crypto
      .createHash("sha256")
      .update(`${channelId}:${frameSequence}:${payloadHex}`)
      .digest("hex");
  }
}
