/**
 * Electronic Programme Guide (EPG) Builder & Syndication Exporter
 * Requirements: BCAST-005, R1.2A §16
 */

import { ScheduleSlot } from "../scheduling/index.js";
import { BroadcastChannelConfig } from "../channels/index.js";
import { resolveEpisodeMasterAssetId } from "../episode-masters.js";

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
 * Builds XMLTV XML content for a channel and schedule slots.
 *
 * SCR-03 follow-on: when a slot's episode resolves to a REGISTERED DAM
 * master, the feed carries it as `<episode-num system="vmnl-media-asset">`.
 * The default resolver consults the boot-refreshed episode-master index AND
 * the live DAM registry, so processes that never loaded either (CLI sample
 * exports, the rolling sample scheduler) emit no episode-num instead of
 * referencing something unregistered. Inject `resolveEpisodeMediaAsset` to
 * override (tests, future approved sources).
 */
export function generateXmltvFeed(
  channel: BroadcastChannelConfig,
  slots: ScheduleSlot[],
  options: { resolveEpisodeMediaAsset?: (episodeId: string) => string | null } = {}
): string {
  const resolveEpisodeMediaAsset = options.resolveEpisodeMediaAsset ?? resolveEpisodeMasterAssetId;
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
    const mediaAssetId = resolveEpisodeMediaAsset(slot.episodeId);
    if (mediaAssetId) {
      xml += `    <episode-num system="vmnl-media-asset">${escapeXml(mediaAssetId)}</episode-num>\n`;
    }
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

export class XmlTvGenerator {
  public detectDiscrepancy(
    approvedSchedule: Array<{ id: string; title: string; start: string; end: string }>,
    staleEpg: Array<{ id: string; title: string; start: string; end: string }>
  ): { hasDiscrepancy: boolean; discrepancies: string[] } {
    const discrepancies: string[] = [];
    for (const app of approvedSchedule) {
      const match = staleEpg.find((s) => s.start === app.start);
      if (match && match.title !== app.title) {
        discrepancies.push(`Title mismatch at ${app.start}: Approved '${app.title}' vs EPG '${match.title}'`);
      }
    }
    return {
      hasDiscrepancy: discrepancies.length > 0,
      discrepancies,
    };
  }
}

