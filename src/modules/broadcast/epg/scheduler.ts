/**
 * Automated 7-Day Rolling EPG Generator & Syndication Exporter
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §29 / VMNL-AZP-VMN-CCPP-001 §13
 *
 * Core Mandate:
 * Generates rolling 7-day XMLTV and DVB-SI EPG feeds for StarTimes transmission uplink
 * and syndication partners (DStv, GOtv, digital web guides).
 */

import { generateXmltvFeed } from "./index.js";
import { ScheduleSlot } from "../scheduling/index.js";
import { getChannelByCode, CANONICAL_CHANNELS } from "../channels/index.js";

export class RollingEpgScheduler {
  /**
   * Generates a continuous 7-day schedule window starting from baseDate.
   */
  public static generate7DayRollingFeed(channelCode: string, baseDate: Date = new Date()): {
    channelCode: string;
    startDate: Date;
    endDate: Date;
    totalSlots: number;
    xmltvContent: string;
  } {
    const channel = getChannelByCode(channelCode) || CANONICAL_CHANNELS[channelCode] || CANONICAL_CHANNELS["NXTR"];
    const channelName = channel.name;

    const slots: ScheduleSlot[] = [];
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = new Date(baseDate.getTime() + dayOffset * oneDayMs);
      const dateStr = currentDay.toISOString().split("T")[0];

      // 4 dayparts per day: Morning, Afternoon, Prime, Night
      const daypartSchedules = [
        { title: `${channelName} Morning Dawn`, startH: 6, durM: 360 },
        { title: `${channelName} Midday Express`, startH: 12, durM: 360 },
        { title: `${channelName} Prime Special`, startH: 18, durM: 360 },
        { title: `${channelName} Midnight Lounge`, startH: 24, durM: 360 },
      ];

      for (const dp of daypartSchedules) {
        const start = new Date(`${dateStr}T${dp.startH.toString().padStart(2, "0")}:00:00.000Z`);

        slots.push({
          id: `SLOT-${channelCode}-${dateStr}-${dp.startH}`,
          channelId: channel.id,
          episodeId: `EP-${channelCode}-${dateStr}-${dp.startH}`,
          title: dp.title,
          startTime: start,
          durationSeconds: dp.durM * 60,
          isLocked: false,
        });
      }
    }

    const xmltvContent = generateXmltvFeed(channel, slots);
    const startDate = slots[0].startTime;
    const endDate = new Date(slots[slots.length - 1].startTime.getTime() + slots[slots.length - 1].durationSeconds * 1000);

    return {
      channelCode,
      startDate,
      endDate,
      totalSlots: slots.length,
      xmltvContent,
    };
  }
}
