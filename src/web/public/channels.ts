/**
 * Linear Television Public Channels Hub
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §10 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Core Mandate:
 * Dedicated public microsites for Nigezie Xtreme, Orisun, and Isi Mbido.
 * Real-time "On Air Now" and "Up Next" consumer widgets driven directly by approved EPG data.
 */

import { getConfig } from "../../core/config/index.js";

export interface PublicChannelInfo {
  code: "NXTR" | "ORIS" | "IMBD";
  name: string;
  tagline: string;
  dttChannel: number;
  dthChannel: number;
  genre: string;
  primaryLanguage: string;
  targetAudience: string;
  accentColor: string;
  isProvisional: boolean;
}

export function getPublicChannels(): PublicChannelInfo[] {
  const config = getConfig();
  return [
    {
      code: "NXTR",
      name: "Nigezie Xtreme",
      tagline: "The Pulse of African Youth Culture",
      dttChannel: config.NXTR_DTT_CHANNEL,
      dthChannel: config.NXTR_DTH_CHANNEL,
      genre: "Urban Youth, Music, Street Lifestyle",
      primaryLanguage: "English / Nigerian Pidgin",
      targetAudience: "Ages 16-32 Urban Trendsetters",
      accentColor: "#E50914",
      isProvisional: !config.STARTIMES_CARRIAGE_VERIFIED,
    },
    {
      code: "ORIS",
      name: "Orisun",
      tagline: "The True Source of Yoruba Heritage & Culture",
      dttChannel: config.ORIS_DTT_CHANNEL,
      dthChannel: config.ORIS_DTH_CHANNEL,
      genre: "Yoruba Cultural Entertainment, Drama, Lifestyle",
      primaryLanguage: "Yoruba",
      targetAudience: "Yoruba speakers and cultural enthusiasts worldwide",
      accentColor: "#FFB800",
      isProvisional: !config.STARTIMES_CARRIAGE_VERIFIED,
    },
    {
      code: "IMBD",
      name: "Isi Mbido",
      tagline: "Roots of the Igbo Heritage",
      dttChannel: config.IMBD_DTT_CHANNEL,
      dthChannel: config.IMBD_DTH_CHANNEL,
      genre: "Igbo Cultural Programming, Film, Folklore",
      primaryLanguage: "Igbo",
      targetAudience: "Igbo speakers, Eastern cultural diaspora",
      accentColor: "#00875A",
      isProvisional: !config.STARTIMES_CARRIAGE_VERIFIED,
    },
  ];
}

export const PUBLIC_CHANNELS: PublicChannelInfo[] = getPublicChannels();

export interface PublicEpgProgramItem {
  title: string;
  episodeTitle?: string;
  startTime: string; // e.g. "20:00"
  endTime: string; // e.g. "21:00"
  synopsis: string;
  rating: string;
}

export class PublicChannelsHub {
  public static getChannel(code: "NXTR" | "ORIS" | "IMBD"): PublicChannelInfo {
    const channel = PUBLIC_CHANNELS.find((c) => c.code === code);
    if (!channel) {
      throw new Error(`[CHAN-404] Channel '${code}' not found.`);
    }
    return channel;
  }

  /**
   * Renders the real-time "On Air Now" and "Up Next" widget.
   */
  public static renderNowAndNextWidget(
    channelCode: "NXTR" | "ORIS" | "IMBD",
    currentProgram: PublicEpgProgramItem,
    nextProgram: PublicEpgProgramItem
  ): string {
    const channel = this.getChannel(channelCode);

    return `
<section class="vmn-on-air-widget" aria-label="${channel.name} Broadcast Status">
  <div class="vmn-widget-header" style="border-left: 4px solid ${channel.accentColor}">
    <span class="vmn-live-badge" aria-label="Live broadcast"><span class="vmn-pulse-dot" aria-hidden="true"></span> ON AIR NOW</span>
    <span class="vmn-channel-badge">${channel.name} (StarTimes Ch ${channel.dttChannel} DTT / ${channel.dthChannel} DTH)</span>
  </div>

  <div class="vmn-now-playing">
    <div class="vmn-time-range">${currentProgram.startTime} – ${currentProgram.endTime}</div>
    <h3 class="vmn-show-title">${currentProgram.title}${currentProgram.episodeTitle ? ` — ${currentProgram.episodeTitle}` : ""}</h3>
    <p class="vmn-show-synopsis">${currentProgram.synopsis}</p>
    <span class="vmn-age-rating">Rating: ${currentProgram.rating}</span>
  </div>

  <div class="vmn-up-next">
    <span class="vmn-up-next-label">COMING UP NEXT (${nextProgram.startTime})</span>
    <h4 class="vmn-next-title">${nextProgram.title}</h4>
    <p class="vmn-next-synopsis">${nextProgram.synopsis}</p>
  </div>
</section>`.trim();
  }
}
