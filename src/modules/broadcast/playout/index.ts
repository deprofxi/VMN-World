/**
 * Playout Automation & Emergency Filler Engine
 * Requirements: BCAST-007, R1.2A §20
 */

export interface PlaylistItem {
  id: string;
  itemType: "PROGRAMME" | "COMMERCIAL_SPOT" | "STATION_PROMO" | "STATION_IDENT" | "EMERGENCY_FILLER";
  title: string;
  assetUrl: string;
  durationSeconds: number;
  expectedStartTime: Date;
  isFiller: boolean;
}

export interface PlayoutScheduleExport {
  channelCode: string;
  broadcastDate: string; // YYYY-MM-DD
  generatedAt: Date;
  totalItems: number;
  totalDurationSeconds: number;
  items: PlaylistItem[];
}

/**
 * Inserts emergency station filler if media asset is missing or duration under-runs (BCAST UAT Drill 2, 19)
 */
export function insertEmergencyFiller(
  items: PlaylistItem[],
  targetDurationSeconds: number = 86400,
  fillerAssetUrl: string = "https://cdn.vmn.ng/assets/filler/vmn_emergency_loop_1080i.mp4"
): PlaylistItem[] {
  const result = [...items];
  const currentTotal = result.reduce((acc, item) => acc + item.durationSeconds, 0);

  if (currentTotal < targetDurationSeconds) {
    const deficitSeconds = targetDurationSeconds - currentTotal;
    const lastItem = result[result.length - 1];
    const fillerStartTime = lastItem
      ? new Date(lastItem.expectedStartTime.getTime() + lastItem.durationSeconds * 1000)
      : new Date();

    result.push({
      id: `filler-${Date.now()}`,
      itemType: "EMERGENCY_FILLER",
      title: "VMN Emergency Station Ident & Music Loop",
      assetUrl: fillerAssetUrl,
      durationSeconds: deficitSeconds,
      expectedStartTime: fillerStartTime,
      isFiller: true,
    });
  }

  return result;
}
