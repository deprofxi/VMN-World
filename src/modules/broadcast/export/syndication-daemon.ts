/**
 * Automated Broadcast Schedule Syndication & StarTimes Multiplexer Exporter
 * Authority: SMPTE-2021 (BXF 5.0) / StarTimes DTT/DTH Multiplex Protocol
 * VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §28, §30 / S-BRC-02
 *
 * Implements automated XML syndication batch generation, cryptographic hash sealing,
 * and delivery packaging for DVB multiplexers and electronic programme guide syndicators.
 */

import crypto from "node:crypto";
import { PlayoutExportEngine } from "./index.js";
import type { PlaylistItem } from "../playout/index.js";

export interface SyndicationManifestHeader {
  manifestId: string;
  channelCode: string;
  scheduleDateWat: string;
  itemCount: number;
  totalDurationSeconds: number;
  sha256Checksum: string;
  formatStandard: "SMPTE_2021_BXF" | "SMPTE_2067_IMF" | "HARRIS_ADC_CSV" | "GRASS_VALLEY_XML";
}

export interface SyndicationExportPackage {
  header: SyndicationManifestHeader;
  serializedPayload: string;
  destinationEndpoint: string;
  admissibleForAir: boolean;
  clearanceGatePassed: boolean;
  warnings: string[];
}

export class SyndicationDaemon {
  /**
   * Packages a broadcast schedule into a cryptographically sealed syndication bundle for StarTimes multiplexers.
   */
  public static packageSchedule(params: {
    channelCode: string;
    scheduleDateWat: string;
    items: PlaylistItem[];
    format: "SMPTE_2021_BXF" | "SMPTE_2067_IMF" | "HARRIS_ADC_CSV" | "GRASS_VALLEY_XML";
    destinationEndpoint: string;
    rightsCleared: boolean;
  }): SyndicationExportPackage {
    const warnings: string[] = [];

    if (!params.rightsCleared) {
      warnings.push("Clearance Lock: Schedule contains uncleared rights windows. Delivery to multiplexer blocked (TSK-10).");
    }

    if (params.items.length === 0) {
      warnings.push("Empty Schedule: No playlist items present for target broadcast date.");
    }

    let serialized = "";
    switch (params.format) {
      case "SMPTE_2021_BXF":
        serialized = PlayoutExportEngine.toBxfXml(params.channelCode, params.scheduleDateWat, params.items);
        break;
      case "SMPTE_2067_IMF":
        serialized = PlayoutExportEngine.toSmpte2067Xml(params.channelCode, params.scheduleDateWat, params.items);
        break;
      case "HARRIS_ADC_CSV":
        serialized = PlayoutExportEngine.toHarrisCsv(params.channelCode, params.items);
        break;
      case "GRASS_VALLEY_XML":
        serialized = PlayoutExportEngine.toGrassValleyXml(params.channelCode, params.items);
        break;
    }

    const totalSeconds = params.items.reduce((acc, it) => acc + (it.durationSeconds || 0), 0);
    const checksum = crypto.createHash("sha256").update(serialized).digest("hex");
    const manifestId = `SYN-${params.channelCode}-${params.scheduleDateWat.replace(/-/g, "")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const header: SyndicationManifestHeader = {
      manifestId,
      channelCode: params.channelCode,
      scheduleDateWat: params.scheduleDateWat,
      itemCount: params.items.length,
      totalDurationSeconds: totalSeconds,
      sha256Checksum: checksum,
      formatStandard: params.format,
    };

    const admissible = params.rightsCleared && params.items.length > 0;

    return {
      header,
      serializedPayload: serialized,
      destinationEndpoint: params.destinationEndpoint,
      admissibleForAir: admissible,
      clearanceGatePassed: params.rightsCleared,
      warnings,
    };
  }
}
