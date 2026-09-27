/**
 * Broadcast Programme Catalogue & Technical Quality Gate
 * Requirements: BCAST-003, BCAST-012, R1.2A §14
 */

export interface BroadcastProgramme {
  id: string;
  channelId: string;
  title: string;
  genre: "Music" | "Cultural" | "Drama" | "News" | "Talk" | "Reality" | "Documentary";
  synopsis: string;
  totalEpisodes: number;
  ratingClassification: "G" | "PG" | "12" | "15" | "18";
  isActive: boolean;
}

export interface BroadcastEpisode {
  id: string;
  programmeId: string;
  episodeNumber: number;
  title: string;
  nominalDurationSeconds: number; // e.g., 1800 (30 mins) or 3600 (60 mins)
  rightsRecordId: string;
  qcStatus: "PENDING" | "PASSED" | "FAILED" | "OVERRIDDEN";
  qcReport?: TechnicalQcReport;
}

export interface TechnicalQcReport {
  videoStandard: "1080i50" | "720p50";
  aspectRatio: "16:9";
  audioLoudnessLufs: number; // Target: -23.0 LUFS (+/- 0.5 LUFS)
  hasCountdownSlate: boolean;
  hasBlackGaps: boolean;
  isCompliant: boolean;
  notes: string[];
}

/**
 * Validates a broadcast episode against the technical master quality gate (BCAST-012)
 */
export function validateBroadcastMasterQc(report: TechnicalQcReport): { isCompliant: boolean; errors: string[] } {
  const errors: string[] = [];

  if (report.videoStandard !== "1080i50" && report.videoStandard !== "720p50") {
    errors.push(`Invalid video standard: ${report.videoStandard}. Must be 1080i50 or 720p50.`);
  }

  if (report.aspectRatio !== "16:9") {
    errors.push(`Invalid aspect ratio: ${report.aspectRatio}. Must be 16:9.`);
  }

  // EBU R128 standard: target -23 LUFS with ±1 LUFS tolerance
  if (report.audioLoudnessLufs < -24.0 || report.audioLoudnessLufs > -22.0) {
    errors.push(`Audio loudness out of EBU R128 spec: ${report.audioLoudnessLufs} LUFS (target: -23.0 ± 1.0 LUFS).`);
  }

  if (report.hasBlackGaps) {
    errors.push("Media master contains unexpected un-rendered black frame gaps.");
  }

  return {
    isCompliant: errors.length === 0,
    errors,
  };
}
