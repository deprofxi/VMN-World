/**
 * Broadcast Channel Registry & Technical Portfolio
 * Requirements: BCAST-001, BCAST-002, R1.2A §11, §13
 */

export interface BroadcastChannelConfig {
  id: string;
  name: string;
  code: string;
  tagline: string;
  language: string;
  targetAudience: string;
  aspectRatio: "16:9";
  resolution: "1080i50" | "720p50";
  audioFormat: "Stereo / EBU R128 (-23 LUFS)";
  starTimesCarriage: {
    dttChannelNumber?: number;
    dthChannelNumber?: number;
    bouquetTier: "Basic" | "Classic" | "Super";
    servicePid?: number;
    isProvisional: boolean; // Authority: CLAUDE.md <broadcast> law (mark unverified until confirmed by StarTimes / NBC)
  };
  isActive: boolean;
}

export const CANONICAL_CHANNELS: Record<string, BroadcastChannelConfig> = {
  nigezie_xtreme: {
    id: "chn-nigezie-xtreme",
    name: "Nigezie Xtreme",
    code: "NXTR",
    tagline: "The Pulse of Urban Culture",
    language: "English / Nigerian Pidgin",
    targetAudience: "Youth 15-35, Urban music & contemporary pop culture",
    aspectRatio: "16:9",
    resolution: "1080i50",
    audioFormat: "Stereo / EBU R128 (-23 LUFS)",
    starTimesCarriage: {
      dttChannelNumber: 428,
      dthChannelNumber: 312,
      bouquetTier: "Basic",
      servicePid: 1042,
      isProvisional: true, // Marked provisional per CLAUDE.md until formal StarTimes/NBC certificate confirmation
    },
    isActive: true,
  },
  orisun: {
    id: "chn-orisun",
    name: "Orisun — The Source",
    code: "ORIS",
    tagline: "Voice & Heritage of the Yoruba Nation",
    language: "Yoruba",
    targetAudience: "Yoruba-speaking families, cultural enthusiasts, diaspora",
    aspectRatio: "16:9",
    resolution: "1080i50",
    audioFormat: "Stereo / EBU R128 (-23 LUFS)",
    starTimesCarriage: {
      dttChannelNumber: 430,
      dthChannelNumber: 315,
      bouquetTier: "Basic",
      servicePid: 1044,
      isProvisional: true, // Marked provisional per CLAUDE.md until formal StarTimes/NBC certificate confirmation
    },
    isActive: true,
  },
  isi_mbido: {
    id: "chn-isi-mbido",
    name: "Isi Mbido — The Beginning",
    code: "IMBD",
    tagline: "The Pride & Heritage of Ndi Igbo",
    language: "Igbo",
    targetAudience: "Igbo-speaking households, cultural drama & music followers",
    aspectRatio: "16:9",
    resolution: "1080i50",
    audioFormat: "Stereo / EBU R128 (-23 LUFS)",
    starTimesCarriage: {
      dttChannelNumber: 432,
      dthChannelNumber: 318,
      bouquetTier: "Basic",
      servicePid: 1046,
      isProvisional: true, // Marked provisional per CLAUDE.md until formal StarTimes/NBC certificate confirmation
    },
    isActive: true,
  },
};

export function getChannelByCode(code: string): BroadcastChannelConfig | undefined {
  return Object.values(CANONICAL_CHANNELS).find(
    (c) => c.code.toLowerCase() === code.toLowerCase()
  );
}

export function getAllActiveChannels(): BroadcastChannelConfig[] {
  return Object.values(CANONICAL_CHANNELS).filter((c) => c.isActive);
}
