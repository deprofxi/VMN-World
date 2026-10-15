/**
 * Linear Television Public Channels Hub
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §10 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Public channel profiles and an honest unavailable state for live programme
 * information until an approved schedule and verified live source are connected.
 */

export interface PublicChannelInfo {
  code: "NXTR" | "ORIS" | "IMBD";
  name: string;
  tagline: string;
  dttChannel?: number;
  dthChannel?: number;
  genre: string;
  primaryLanguage: string;
  targetAudience: string;
  accentColor: string;
  isProvisional: boolean;
}

export function getPublicChannels(): PublicChannelInfo[] {
  return [
    {
      code: "NXTR",
      name: "Nigezie Xtreme",
      tagline: "The Pulse of African Youth Culture",
      genre: "Urban Youth, Music, Street Lifestyle",
      primaryLanguage: "English / Nigerian Pidgin",
      targetAudience: "Ages 16-32 Urban Trendsetters",
      accentColor: "#E50914",
      isProvisional: true,
    },
    {
      code: "ORIS",
      name: "Orisun — The Source",
      tagline: "The True Source of Yoruba Heritage & Culture",
      genre: "Yoruba Cultural Entertainment, Drama, Lifestyle",
      primaryLanguage: "Yoruba",
      targetAudience: "Yoruba speakers and cultural enthusiasts worldwide",
      accentColor: "#FFB800",
      isProvisional: true,
    },
    {
      code: "IMBD",
      name: "Isi Mbido — The Beginning",
      tagline: "Roots of the Igbo Heritage",
      genre: "Igbo Cultural Programming, Film, Folklore",
      primaryLanguage: "Igbo",
      targetAudience: "Igbo speakers, Eastern cultural diaspora",
      accentColor: "#0369A1",
      isProvisional: true,
    },
  ];
}

export const PUBLIC_CHANNELS: PublicChannelInfo[] = getPublicChannels();

export interface PublicEpgProgramItem {
  title: string;
  episodeTitle?: string;
  startTime: string;
  endTime: string;
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
   * Renders an unavailable state until approved schedule and live sources are connected.
   */
  public static renderNowAndNextWidget(
    channelCode: "NXTR" | "ORIS" | "IMBD",
    _currentProgram: PublicEpgProgramItem,
    _nextProgram: PublicEpgProgramItem
  ): string {
    const channel = this.getChannel(channelCode);
    return `
<section class="vmn-on-air-widget" aria-label="${channel.name} Broadcast Status">
 <div class="vmn-widget-header" style="border-left: 4px solid ${channel.accentColor}">
    <span class="vmn-channel-badge">${channel.name}</span>
    <span role="note">Carriage verification does not establish live transmission status.</span>
  </div>
  <p>Now/next programme information is unavailable until an approved schedule and verified live source are connected.</p>
</section>`.trim();
  }
}
