/**
 * Electronic Programme Guide (EPG) Builder & Syndication Exporter
 * Requirements: BCAST-005, R1.2A §16
 */

import { ScheduleSlot } from "../scheduling/index.js";
import { BroadcastChannelConfig } from "../channels/index.js";

export interface EpgProgramItem {
  channelCode: string;
  channelName: string;
  startTime: Date;
  stopTime: Date;
  title: string;
  description: string;
  category: string;
  episodeNumber?: number;
}

/**
 * Formats a Date object into XMLTV date-time string (YYYYMMDDHHmmss +0000)
 */
export function formatXmltvDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}${h}${min}${s} +0000`;
}

/**
 * Builds XMLTV XML content for a channel and schedule slots
 */
export function generateXmltvFeed(
  channel: BroadcastChannelConfig,
  slots: ScheduleSlot[]
): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<tv generator-info-name="VMNL-EPG-Engine" generator-info-url="https://vmn.ng">\n`;
  xml += `  <channel id="${channel.code}">\n`;
  xml += `    <display-name>${channel.name}</display-name>\n`;
  xml += `  </channel>\n`;

  for (const slot of slots) {
    const startStr = formatXmltvDate(slot.startTime);
    const stopTime = new Date(slot.startTime.getTime() + slot.durationSeconds * 1000);
    const stopStr = formatXmltvDate(stopTime);

    xml += `  <programme start="${startStr}" stop="${stopStr}" channel="${channel.code}">\n`;
    xml += `    <title lang="${channel.language.split(" ")[0].toLowerCase()}">${escapeXml(slot.title)}</title>\n`;
    xml += `  </programme>\n`;
  }

  xml += `</tv>\n`;
  return xml;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
