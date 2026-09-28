/**
 * Playout Automation & Export Format Serializers
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §28, §30
 *
 * Core Mandate:
 * Exports broadcast daypart playlists into industry-standard playout automation formats:
 * 1. SMPTE-2067 (IMF - Interoperable Master Format playlist XML)
 * 2. BXF (SMPTE-2021 Broadcast eXchange Format XML)
 * 3. Harris Automation / Imagine Communications CSV
 * 4. Grass Valley K2 / Miranda Playlist XML
 */

import { PlaylistItem } from "../playout/index.js";

function formatSmpteTimecode(secondsFromMidnight: number, frameRate: number = 25): string {
  const hours = Math.floor(secondsFromMidnight / 3600) % 24;
  const minutes = Math.floor((secondsFromMidnight % 3600) / 60);
  const seconds = Math.floor(secondsFromMidnight % 60);
  const frames = Math.floor((secondsFromMidnight % 1) * frameRate);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

export class PlayoutExportEngine {
  /**
   * Serializes playlist into SMPTE-2067 Interoperable Master Format XML.
   */
  public static toSmpte2067Xml(channelCode: string, scheduleDate: string, items: PlaylistItem[]): string {
    const xmlItems = items
      .map((item, index) => {
        const som = formatSmpteTimecode(index * 1800);
        const eom = formatSmpteTimecode(index * 1800 + item.durationSeconds);
        return `    <SequenceItem id="${item.id}">
      <ItemType>${item.itemType}</ItemType>
      <Title><![CDATA[${item.title}]]></Title>
      <AssetId>${item.mediaAssetId || "ASSET-SLATE"}</AssetId>
      <DurationSeconds>${item.durationSeconds}</DurationSeconds>
      <SOM>${som}</SOM>
      <EOM>${eom}</EOM>
    </SequenceItem>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<CompositionPlaylist xmlns="http://www.smpte-ra.org/schemas/2067-2/2016">
  <Id>urn:uuid:${channelCode}-${scheduleDate}</Id>
  <AnnotationText>VMNL Playout Playlist: ${channelCode} for ${scheduleDate}</AnnotationText>
  <IssueDate>${new Date().toISOString()}</IssueDate>
  <Issuer>VMNL Master Control</Issuer>
  <SegmentList>
${xmlItems}
  </SegmentList>
</CompositionPlaylist>`;
  }

  /**
   * Serializes playlist into SMPTE-2021 BXF (Broadcast eXchange Format) XML.
   */
  public static toBxfXml(channelCode: string, scheduleDate: string, items: PlaylistItem[]): string {
    const bxfItems = items
      .map(
        (item) => `      <ScheduleEvent eventType="${item.itemType}">
        <EventId>${item.id}</EventId>
        <EventTitle><![CDATA[${item.title}]]></EventTitle>
        <Length>${item.durationSeconds}S</Length>
        <StartTime>${item.expectedStartTime.toISOString()}</StartTime>
        <MediaAsset>${item.mediaAssetId || "FILLER_DEFAULT"}</MediaAsset>
      </ScheduleEvent>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<BxfMessage origin="VMNL_ENTERPRISE_HUB" messageType="Schedule" version="5.0">
  <BxfData action="Create">
    <Schedule channel="${channelCode}" scheduleDate="${scheduleDate}">
${bxfItems}
    </Schedule>
  </BxfData>
</BxfMessage>`;
  }

  /**
   * Serializes playlist into Harris / Imagine Communications Automation CSV.
   */
  public static toHarrisCsv(channelCode: string, items: PlaylistItem[]): string {
    const headers = "EventID,Channel,Title,Type,DurationSec,SOM,MediaID,ScheduledTime";
    const rows = items.map((item, idx) => {
      const som = formatSmpteTimecode(idx * 1800);
      const cleanTitle = `"${item.title.replace(/"/g, '""')}"`;
      return `${item.id},${channelCode},${cleanTitle},${item.itemType},${item.durationSeconds},${som},${item.mediaAssetId || "SLATE"},${item.expectedStartTime.toISOString()}`;
    });
    return [headers, ...rows].join("\n");
  }

  /**
   * Serializes playlist into Grass Valley K2 / Miranda Playlist XML.
   */
  public static toGrassValleyXml(channelCode: string, items: PlaylistItem[]): string {
    const elements = items
      .map(
        (item) => `  <PlaylistItem clipName="${item.mediaAssetId || "EMERGENCY_SLATE"}" duration="${item.durationSeconds}">
    <MediaTitle>${item.title}</MediaTitle>
    <Type>${item.itemType}</Type>
    <AirTime>${item.expectedStartTime.toISOString()}</AirTime>
  </PlaylistItem>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<GrassValleyPlaylist station="${channelCode}" frameRate="25fps">
${elements}
</GrassValleyPlaylist>`;
  }
}
