/**
 * Linear Television Public Channels Hub
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §10 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Public channel profiles and an honest unavailable state for live programme
 * information until an approved schedule and verified live source are connected.
 */

import { escapeHtml } from "../components/escape.js";

export type ChannelCode = "NXTR" | "ORIS" | "IMBD" | (string & {});

export interface PublicChannelInfo {
  code: ChannelCode;
  name: string;
  tagline: string;
  dttChannel?: number;
  dthChannel?: number;
  genre: string;
  primaryLanguage: string;
  targetAudience: string;
  accentColor: string;
  isProvisional: boolean;
  onAirProgram?: string;
  airTimeWAT?: string;
  streamUrl?: string;
  logoUrl?: string;
}

const DEFAULT_CHANNELS: PublicChannelInfo[] = [
  {
    code: "NXTR",
    name: "Nigezie Xtreme",
    tagline: "The Pulse of African Youth Culture",
    genre: "Urban Youth, Music, Street Lifestyle",
    primaryLanguage: "English / Nigerian Pidgin",
    targetAudience: "Ages 16-32 Urban Trendsetters",
    accentColor: "var(--vmn-color-channel-nxtr, #E50914)",
    isProvisional: true,
    onAirProgram: "Street Beats Live",
    airTimeWAT: "On Air",
  },
  {
    code: "ORIS",
    name: "Orisun — The Source",
    tagline: "The True Source of Yoruba Heritage & Culture",
    genre: "Yoruba Cultural Entertainment, Drama, Lifestyle",
    primaryLanguage: "Yoruba",
    targetAudience: "Yoruba speakers and cultural enthusiasts worldwide",
    accentColor: "var(--vmn-color-channel-oris, #FFB800)",
    isProvisional: true,
    onAirProgram: "Alaroye Theatre",
    airTimeWAT: "05:30",
  },
  {
    code: "IMBD",
    name: "Isi Mbido — The Beginning",
    tagline: "Roots of the Igbo Heritage",
    genre: "Igbo Cultural Programming, Film, Folklore",
    primaryLanguage: "Igbo",
    targetAudience: "Igbo speakers, Eastern cultural diaspora",
    accentColor: "var(--vmn-color-channel-imbd, #0369A1)",
    isProvisional: true,
    onAirProgram: "Ogene Rhythms",
    airTimeWAT: "Live",
  },
];

let activeChannels: PublicChannelInfo[] = [...DEFAULT_CHANNELS];

/**
 * Returns the dynamic list of registered broadcast channels.
 * Channels are not hardcoded — operators or runtime adapters can register new linear channels.
 */
export function getPublicChannels(): PublicChannelInfo[] {
  return [...activeChannels];
}

/**
 * Dynamically registers or updates a broadcast channel.
 */
export function registerChannel(channel: PublicChannelInfo): void {
  const existingIdx = activeChannels.findIndex((c) => c.code.toUpperCase() === channel.code.toUpperCase());
  if (existingIdx >= 0) {
    activeChannels[existingIdx] = { ...activeChannels[existingIdx], ...channel };
  } else {
    activeChannels.push(channel);
  }
}

/**
 * Resets channels to standard defaults.
 */
export function resetChannels(): void {
  activeChannels = [...DEFAULT_CHANNELS];
}

export const PUBLIC_CHANNELS: PublicChannelInfo[] = activeChannels;

export interface PublicEpgProgramItem {
  title: string;
  episodeTitle?: string;
  startTime: string;
  endTime: string;
  synopsis: string;
  rating: string;
}

export class PublicChannelsHub {
  public static getChannel(code: ChannelCode): PublicChannelInfo {
    const channel = getPublicChannels().find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (!channel) {
      throw new Error(`[CHAN-404] Channel '${code}' not found.`);
    }
    return channel;
  }

  /**
   * Renders an unavailable state until approved schedule and live sources are connected.
   */
  public static renderNowAndNextWidget(
    channelCode: ChannelCode,
    _currentProgram: PublicEpgProgramItem,
    _nextProgram: PublicEpgProgramItem
  ): string {
    const channel = this.getChannel(channelCode);
    return `
<section class="vmn-on-air-widget" aria-label="${escapeHtml(channel.name)} Broadcast Status">
 <div class="vmn-widget-header" style="border-left: 4px solid ${escapeHtml(channel.accentColor)}">
    <span class="vmn-channel-badge">${escapeHtml(channel.name)}</span>
    <span role="note">Carriage verification does not establish live transmission status.</span>
  </div>
  <p>Now/next programme information is unavailable until an approved schedule and verified live source are connected.</p>
</section>`.trim();
  }
}
