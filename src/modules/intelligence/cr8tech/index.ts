/**
 * Cr8TechNG Creative Toolkits & AI Workflows
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §19, §34 / VMNL-AZP-VMN-CCPP-001 §15
 *
 * Core Mandate:
 * Creative technology sandbox, automated multilingual subtitling (English, Yoruba, Igbo, Hausa, Pidgin),
 * WebVTT/SRT formatting, and broadcast clip extraction with mandatory watermarks.
 */

export type SupportedLanguage = "EN" | "YOR" | "IGB" | "HAU" | "PCM"; // PCM = Nigerian Pidgin
export type SocialAspectRatio = "PORTRAIT_9_16" | "SQUARE_1_1" | "LANDSCAPE_16_9";
export type WatermarkBrand = "NXTR" | "ORIS" | "IMBD" | "VMN_NETWORK";

export interface SubtitleCue {
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  assetId: string;
  language: SupportedLanguage;
  format: "SRT" | "WEBVTT";
  cues: SubtitleCue[];
  renderedContent: string;
  createdAt: Date;
}

export interface SocialClipJob {
  id: string;
  sourceAssetId: string;
  title: string;
  startTimeSec: number;
  durationSec: number;
  aspectRatio: SocialAspectRatio;
  watermarkBrand: WatermarkBrand;
  watermarkPosition: "TOP_RIGHT" | "BOTTOM_RIGHT" | "TOP_LEFT";
  outputUrl?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  completedAt?: Date;
}

export class Cr8TechCreativeEngine {
  private subtitleTracks = new Map<string, SubtitleTrack>();
  private clipJobs = new Map<string, SocialClipJob>();

  /**
   * Generates formatted broadcast subtitles (SRT or WebVTT) with line-length constraints.
   */
  public generateSubtitles(params: {
    id: string;
    assetId: string;
    language: SupportedLanguage;
    format: "SRT" | "WEBVTT";
    cues: Array<{ startTimeSec: number; endTimeSec: number; text: string }>;
  }): SubtitleTrack {
    const formattedCues: SubtitleCue[] = [];
    const maxCharsPerLine = 42; // Broadcast standard maximum chars per line

    params.cues.forEach((raw, idx) => {
      if (raw.endTimeSec <= raw.startTimeSec) {
        throw new Error(`[CR8-SUB-01] Cue ${idx + 1}: endTime must be strictly after startTime.`);
      }

      // Check wrapping
      const wrappedText = this.wrapText(raw.text, maxCharsPerLine);
      formattedCues.push({
        index: idx + 1,
        startTimeSec: raw.startTimeSec,
        endTimeSec: raw.endTimeSec,
        text: wrappedText,
      });
    });

    const renderedContent =
      params.format === "WEBVTT"
        ? this.renderWebVtt(formattedCues)
        : this.renderSrt(formattedCues);

    const track: SubtitleTrack = {
      id: params.id,
      assetId: params.assetId,
      language: params.language,
      format: params.format,
      cues: formattedCues,
      renderedContent,
      createdAt: new Date(),
    };

    this.subtitleTracks.set(track.id, track);
    return track;
  }

  /**
   * Dispatches automated social clip extraction with mandatory broadcast watermark.
   */
  public createSocialClipJob(params: {
    id: string;
    sourceAssetId: string;
    title: string;
    startTimeSec: number;
    durationSec: number; // e.g. 15, 30, 60
    aspectRatio: SocialAspectRatio;
    watermarkBrand: WatermarkBrand;
  }): SocialClipJob {
    if (params.durationSec <= 0 || params.durationSec > 300) {
      throw new Error("[CR8-CLP-01] Clip duration must be between 1 and 300 seconds.");
    }

    const job: SocialClipJob = {
      ...params,
      watermarkPosition: "TOP_RIGHT",
      status: "COMPLETED",
      outputUrl: `https://vmnl.ng/dam/social_clips/${params.id}_${params.watermarkBrand}_${params.aspectRatio}.mp4`,
      completedAt: new Date(),
    };

    this.clipJobs.set(job.id, job);
    return job;
  }

  public getSubtitleTrack(id: string): SubtitleTrack | undefined {
    return this.subtitleTracks.get(id);
  }

  public getClipJob(id: string): SocialClipJob | undefined {
    return this.clipJobs.get(id);
  }

  private wrapText(text: string, maxLen: number): string {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + " " + word).trim().length > maxLen) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? " " : "") + word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines.join("\n");
  }

  private formatTimecode(seconds: number, separator: "," | "."): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, w: number = 2) => String(n).padStart(w, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}${separator}${pad(ms, 3)}`;
  }

  private renderWebVtt(cues: SubtitleCue[]): string {
    let out = "WEBVTT\n\n";
    for (const cue of cues) {
      const start = this.formatTimecode(cue.startTimeSec, ".");
      const end = this.formatTimecode(cue.endTimeSec, ".");
      out += `${cue.index}\n${start} --> ${end}\n${cue.text}\n\n`;
    }
    return out.trim();
  }

  private renderSrt(cues: SubtitleCue[]): string {
    let out = "";
    for (const cue of cues) {
      const start = this.formatTimecode(cue.startTimeSec, ",");
      const end = this.formatTimecode(cue.endTimeSec, ",");
      out += `${cue.index}\n${start} --> ${end}\n${cue.text}\n\n`;
    }
    return out.trim();
  }
}
