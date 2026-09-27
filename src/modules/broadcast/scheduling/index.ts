/**
 * 24/7 Daypart Schedule Grid & Conflict Detection Engine
 * Requirements: BCAST-004, R1.2A §15
 */

export type DaypartType = "EARLY_MORNING" | "DAYTIME" | "PRIME_TIME" | "LATE_NIGHT";

export interface DaypartDefinition {
  type: DaypartType;
  startHour: number; // 0 - 23
  endHour: number;   // 0 - 23
  rateMultiplier: number;
}

export const DAYPARTS: DaypartDefinition[] = [
  { type: "EARLY_MORNING", startHour: 6, endHour: 9, rateMultiplier: 1.0 },
  { type: "DAYTIME", startHour: 9, endHour: 16, rateMultiplier: 1.2 },
  { type: "PRIME_TIME", startHour: 16, endHour: 23, rateMultiplier: 2.5 },
  { type: "LATE_NIGHT", startHour: 23, endHour: 6, rateMultiplier: 0.8 },
];

export interface ScheduleSlot {
  id: string;
  channelId: string;
  startTime: Date;
  durationSeconds: number; // e.g. 1800 (30 mins)
  episodeId: string;
  title: string;
  isLocked: boolean;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  totalDurationSeconds: number;
  expectedDurationSeconds: number; // 86,400 for 24 hours
  overlapCount: number;
  gapCount: number;
  errors: string[];
}

/**
 * Validates a 24-hour day schedule for gaps, overlaps, and duration alignment
 */
export function validateDailySchedule(slots: ScheduleSlot[], dayStart: Date): ScheduleValidationResult {
  const errors: string[] = [];
  let overlapCount = 0;
  let gapCount = 0;
  let totalDurationSeconds = 0;

  // Sort slots chronologically
  const sorted = [...slots].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let currentTime = dayStart.getTime();

  for (let i = 0; i < sorted.length; i++) {
    const slot = sorted[i];
    const slotStart = slot.startTime.getTime();
    const slotEnd = slotStart + slot.durationSeconds * 1000;
    totalDurationSeconds += slot.durationSeconds;

    // Check for gaps
    if (slotStart > currentTime) {
      const gapSeconds = (slotStart - currentTime) / 1000;
      gapCount++;
      errors.push(`Gap of ${gapSeconds}s detected before slot '${slot.title}' at ${new Date(currentTime).toISOString()}`);
    }

    // Check for overlaps
    if (slotStart < currentTime && i > 0) {
      const overlapSeconds = (currentTime - slotStart) / 1000;
      overlapCount++;
      errors.push(`Overlap of ${overlapSeconds}s detected between '${sorted[i - 1].title}' and '${slot.title}'`);
    }

    currentTime = Math.max(currentTime, slotEnd);
  }

  const expectedDurationSeconds = 86400; // 24 hours in seconds
  if (totalDurationSeconds !== expectedDurationSeconds) {
    errors.push(`Daily schedule total duration is ${totalDurationSeconds}s (expected exactly 86400s).`);
  }

  return {
    isValid: errors.length === 0,
    totalDurationSeconds,
    expectedDurationSeconds,
    overlapCount,
    gapCount,
    errors,
  };
}

/**
 * Determines daypart type for a given timestamp
 */
export function getDaypartForTime(date: Date): DaypartType {
  const hour = date.getHours();
  if (hour >= 6 && hour < 9) return "EARLY_MORNING";
  if (hour >= 9 && hour < 16) return "DAYTIME";
  if (hour >= 16 && hour < 23) return "PRIME_TIME";
  return "LATE_NIGHT";
}
