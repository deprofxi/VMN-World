/**
 * SCTE-35 (ANSI/SCTE 35 2020) Digital Program Insertion Cueing Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §20, §44 / StarTimes MCR Headend Spec
 *
 * Implements standard SCTE-35 splice_info_section serialization and parsing
 * for automated commercial break insertion (DPI) across StarTimes DTT / DTH.
 */

import crypto from "node:crypto";
import dgram from "node:dgram";

export const SCTE35_TABLE_ID = 0xfc;

export type SpliceCommand =
  | "SPLICE_NULL"
  | "SPLICE_SCHEDULE"
  | "SPLICE_INSERT"
  | "TIME_SIGNAL"
  | "BANDWIDTH_RESERVATION"
  | "PRIVATE_COMMAND";

export interface SpliceInsertCommand {
  spliceEventId: number;
  spliceEventCancelIndicator: boolean;
  outOfNetworkIndicator: boolean; // true = cue out (start ad break); false = cue in (return to network)
  programSpliceFlag: boolean;
  durationFlag: boolean;
  spliceImmediateFlag: boolean;
  ptsTime?: number; // 90kHz ticks
  breakDurationSeconds?: number;
  autoReturn?: boolean;
  uniqueProgramId: number;
  availNum: number;
  availsExpected: number;
}

export interface SpliceInfoSection {
  protocolVersion: number;
  ptsAdjustment: number;
  tier: number;
  commandType: SpliceCommand;
  commandTypeId: number;
  insertCommand?: SpliceInsertCommand;
  rawBytes: Buffer;
  base64: string;
  crc32: number;
  crcValid: boolean;
}

/**
 * Standard MPEG-2 CRC-32 (polynomial 0x04C11DB7, initial 0xFFFFFFFF)
 */
export function calculateMpegCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    for (let bit = 7; bit >= 0; bit--) {
      const bitVal = (byte >> bit) & 1;
      const msb = (crc >>> 31) & 1;
      crc = (crc << 1) >>> 0;
      if ((msb ^ bitVal) !== 0) {
        crc = (crc ^ 0x04c11db7) >>> 0;
      }
    }
  }
  return crc >>> 0;
}

/**
 * Encodes an SCTE-35 splice_insert command into a compliant binary splice_info_section.
 */
export function encodeSpliceInsert(params: {
  spliceEventId: number;
  outOfNetwork: boolean; // true = start commercial break (cue out)
  durationSeconds?: number;
  uniqueProgramId?: number;
  availNum?: number;
  availsExpected?: number;
  ptsTime?: number;
  immediate?: boolean;
}): SpliceInfoSection {
  const eventId = params.spliceEventId >>> 0;
  const outOfNetwork = params.outOfNetwork ? 1 : 0;
  const immediate = params.immediate !== false ? 1 : 0;
  const hasDuration = params.durationSeconds && params.durationSeconds > 0 ? 1 : 0;
  const durationTicks = Math.round((params.durationSeconds || 0) * 90000);
  const progId = (params.uniqueProgramId || 1) & 0xffff;
  const availNum = (params.availNum || 1) & 0xff;
  const availsExp = (params.availsExpected || 1) & 0xff;

  // Build command payload
  const cmdChunks: number[] = [];
  // splice_event_id (32 bits)
  cmdChunks.push((eventId >> 24) & 0xff, (eventId >> 16) & 0xff, (eventId >> 8) & 0xff, eventId & 0xff);
  // splice_event_cancel_indicator (1) + reserved (7)
  cmdChunks.push(0x7f); // cancel = 0, 7 reserved bits = 1s

  // Flags: out_of_network (1), program_splice_flag (1), duration_flag (1), splice_immediate (1), reserved (4 = 1111)
  const flags = (outOfNetwork << 7) | (1 << 6) | (hasDuration << 5) | (immediate << 4) | 0x0f;
  cmdChunks.push(flags);

  if (hasDuration) {
    // auto_return (1), reserved (6 = 111111), duration (33 bits)
    // 33-bit duration split: bit 32 into byte 1, bits 0-31 into remaining 4 bytes
    const durHigh = Math.floor(durationTicks / 0x100000000) & 0x01;
    const durLow = durationTicks >>> 0;
    cmdChunks.push(0x80 | 0x7e | durHigh); // auto_return = 1
    cmdChunks.push((durLow >> 24) & 0xff, (durLow >> 16) & 0xff, (durLow >> 8) & 0xff, durLow & 0xff);
  }

  // unique_program_id (16), avail_num (8), avails_expected (8)
  cmdChunks.push((progId >> 8) & 0xff, progId & 0xff);
  cmdChunks.push(availNum);
  cmdChunks.push(availsExp);

  const commandType = 0x05; // splice_insert
  const commandLength = cmdChunks.length;

  // Header length = 11 bytes (protocol_version through splice_command_length)
  // Section length = header bytes after section_length (11) + commandLength + 2 (descriptors length) + 4 (CRC)
  const sectionLength = 11 + commandLength + 2 + 4;

  const header: number[] = [];
  header.push(SCTE35_TABLE_ID);
  // section_syntax_indicator (0), private_indicator (0), SAP_type (11 = 3), section_length (12)
  header.push(0x30 | ((sectionLength >> 8) & 0x0f));
  header.push(sectionLength & 0xff);
  header.push(0x00); // protocol_version = 0

  // encrypted_packet (0), encryption_algorithm (000000), pts_adjustment (33 bits = 0)
  header.push(0x00, 0x00, 0x00, 0x00, 0x00);
  header.push(0x00); // cw_index = 0
  header.push(0xff, 0xf0); // tier (12 bits = 0xFFF) + splice_command_length (high 4 bits)
  header.push(commandLength & 0xff);
  header.push(commandType);

  const sectionWithoutCrc = Buffer.from([...header, ...cmdChunks, 0x00, 0x00]);
  const crc = calculateMpegCrc32(sectionWithoutCrc);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  const rawBytes = Buffer.concat([sectionWithoutCrc, crcBuf]);
  const base64 = rawBytes.toString("base64");

  return {
    protocolVersion: 0,
    ptsAdjustment: 0,
    tier: 0xfff,
    commandType: "SPLICE_INSERT",
    commandTypeId: 0x05,
    insertCommand: {
      spliceEventId: eventId,
      spliceEventCancelIndicator: false,
      outOfNetworkIndicator: !!params.outOfNetwork,
      programSpliceFlag: true,
      durationFlag: !!hasDuration,
      spliceImmediateFlag: !!immediate,
      ptsTime: params.ptsTime,
      breakDurationSeconds: params.durationSeconds,
      autoReturn: true,
      uniqueProgramId: progId,
      availNum,
      availsExpected: availsExp,
    },
    rawBytes,
    base64,
    crc32: crc,
    crcValid: true,
  };
}

/**
 * Decodes a raw binary SCTE-35 buffer or base64 string.
 */
export function decodeSpliceInfoSection(input: Buffer | string): SpliceInfoSection {
  const buf = typeof input === "string" ? Buffer.from(input, "base64") : input;

  if (buf.length < 18) {
    throw new Error(`Invalid SCTE-35 buffer length: ${buf.length} bytes (minimum 18 required)`);
  }

  const tableId = buf[0];
  if (tableId !== SCTE35_TABLE_ID) {
    throw new Error(`Invalid SCTE-35 table_id: 0x${tableId.toString(16)} (expected 0xFC)`);
  }

  const sectionLength = ((buf[1] & 0x0f) << 8) | buf[2];
  if (buf.length < sectionLength + 3) {
    throw new Error(`SCTE-35 buffer truncated: declared length ${sectionLength + 3}, got ${buf.length}`);
  }

  // Validate CRC
  const calculatedCrc = calculateMpegCrc32(buf.subarray(0, sectionLength - 1));
  const embeddedCrc = buf.readUInt32BE(sectionLength - 1);
  const crcValid = calculatedCrc === embeddedCrc;

  const protocolVersion = buf[3];
  const commandTypeByte = buf[13];

  let commandType: SpliceCommand = "PRIVATE_COMMAND";
  if (commandTypeByte === 0x00) commandType = "SPLICE_NULL";
  else if (commandTypeByte === 0x04) commandType = "SPLICE_SCHEDULE";
  else if (commandTypeByte === 0x05) commandType = "SPLICE_INSERT";
  else if (commandTypeByte === 0x06) commandType = "TIME_SIGNAL";
  else if (commandTypeByte === 0x07) commandType = "BANDWIDTH_RESERVATION";

  let insertCommand: SpliceInsertCommand | undefined;

  if (commandTypeByte === 0x05) {
    // Offset for splice_insert parameters starts at byte 14
    const eventId = buf.readUInt32BE(14);
    const cancelIndicator = (buf[18] & 0x80) !== 0;

    if (!cancelIndicator && buf.length >= 20) {
      const flags = buf[19];
      const outOfNetwork = (flags & 0x80) !== 0;
      const programSplice = (flags & 0x40) !== 0;
      const hasDuration = (flags & 0x20) !== 0;
      const immediate = (flags & 0x10) !== 0;

      let offset = 20;
      let durationSeconds: number | undefined;

      if (hasDuration && buf.length >= offset + 5) {
        const durHigh = buf[offset] & 0x01;
        const durLow = buf.readUInt32BE(offset + 1);
        const totalTicks = durHigh * 0x100000000 + durLow;
        durationSeconds = totalTicks / 90000;
        offset += 5;
      }

      const uniqueProgramId = buf.length >= offset + 2 ? buf.readUInt16BE(offset) : 1;
      const availNum = buf.length >= offset + 3 ? buf[offset + 2] : 1;
      const availsExpected = buf.length >= offset + 4 ? buf[offset + 3] : 1;

      insertCommand = {
        spliceEventId: eventId,
        spliceEventCancelIndicator: cancelIndicator,
        outOfNetworkIndicator: outOfNetwork,
        programSpliceFlag: programSplice,
        durationFlag: hasDuration,
        spliceImmediateFlag: immediate,
        breakDurationSeconds: durationSeconds,
        autoReturn: true,
        uniqueProgramId,
        availNum,
        availsExpected,
      };
    }
  }

  return {
    protocolVersion,
    ptsAdjustment: 0,
    tier: 0xfff,
    commandType,
    commandTypeId: commandTypeByte,
    insertCommand,
    rawBytes: buf,
    base64: buf.toString("base64"),
    crc32: embeddedCrc,
    crcValid,
  };
}

/**
 * StarTimes MCR Headend Playout Adapter
 * Simulates real-time SCTE-35 cue injection and monitors broadcast carrier status.
 */
export class StarTimesPlayoutHeadendAdapter {
  private lastInjectedCue?: SpliceInfoSection;
  private channelCarrierLocks: Record<string, boolean> = {
    NXTR: true, // TEN Root Linear HD
    ORIS: true, // TEN Urban Youth
    IMBD: true, // TEN Classic/Afro
  };

  /**
   * Generates and injects a real SCTE-35 cue marker for an upcoming commercial break.
   */
  public injectCommercialBreakCue(params: {
    channelCode: string;
    breakId: string;
    durationSeconds: number;
    spotCount?: number;
  }): {
    success: boolean;
    cue: SpliceInfoSection;
    cueBase64: string;
    channelCode: string;
    timestamp: Date;
  } {
    const numericId = parseInt(crypto.createHash("md5").update(params.breakId).digest("hex").slice(0, 8), 16);

    const cue = encodeSpliceInsert({
      spliceEventId: numericId,
      outOfNetwork: true,
      durationSeconds: params.durationSeconds,
      availsExpected: params.spotCount || 4,
      immediate: true,
    });

    this.lastInjectedCue = cue;
    void this.transmitCueOverUdp(cue);

    return {
      success: true,
      cue,
      cueBase64: cue.base64,
      channelCode: params.channelCode,
      timestamp: new Date(),
    };
  }

  /**
   * Transmits a byte-accurate 188-byte MPEG-2 Transport Stream packet carrying
   * the ANSI/SCTE-35 section over a raw UDP socket to the broadcast headend.
   * Authority: SMPTE 2022-2 / ANSI/SCTE 35 2020.
   */
  public async transmitCueOverUdp(
    cue: SpliceInfoSection,
    host = process.env.BROADCAST_HEADEND_UDP_HOST || "127.0.0.1",
    port = Number(process.env.BROADCAST_HEADEND_UDP_PORT) || 1234
  ): Promise<boolean> {
    try {
      const tsPacket = Buffer.alloc(188, 0xff);
      tsPacket[0] = 0x47; // Sync byte
      tsPacket[1] = 0x41; // PUSI = 1, PID high = 0x01
      tsPacket[2] = 0x04; // PID low = 0x04 (PID 0x0104)
      tsPacket[3] = 0x10; // No adaptation, payload only, CC = 0
      tsPacket[4] = 0x00; // Pointer field

      cue.rawBytes.copy(tsPacket, 5, 0, Math.min(cue.rawBytes.length, 183));

      const socket = dgram.createSocket("udp4");
      return await new Promise<boolean>((resolve) => {
        socket.send(tsPacket, port, host, (err) => {
          try {
            socket.close();
          } catch {
            // ignore close error
          }
          if (err) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Generates a return-to-network cue marker (cue-in).
   */
  public injectReturnToNetworkCue(channelCode: string, breakId: string): {
    success: boolean;
    cue: SpliceInfoSection;
    channelCode: string;
  } {
    const numericId = parseInt(crypto.createHash("md5").update(`return-${breakId}`).digest("hex").slice(0, 8), 16);

    const cue = encodeSpliceInsert({
      spliceEventId: numericId,
      outOfNetwork: false,
      immediate: true,
    });

    this.lastInjectedCue = cue;

    return {
      success: true,
      cue,
      channelCode,
    };
  }

  /**
   * Inspects carrier lock status for StarTimes DTT/DTH headend.
   */
  public getCarrierStatus(channelCode: string): {
    locked: boolean;
    carrier: "STARTIMES_DTT" | "STARTIMES_DTH";
    rfSignalDbm: number;
    headendOnline: boolean;
  } {
    const locked = this.channelCarrierLocks[channelCode] !== false;
    return {
      locked,
      carrier: "STARTIMES_DTT",
      rfSignalDbm: locked ? -48.5 : -99.9,
      headendOnline: true,
    };
  }

  public getLastCue(): SpliceInfoSection | undefined {
    return this.lastInjectedCue;
  }
}

export interface ScheduledBreak {
  breakId: string;
  channelCode: string;
  scheduledTime: Date;
  durationSeconds: number;
  spotCount: number;
  uniqueProgramId: number;
  status: "SCHEDULED" | "CUE_OUT_ACTIVE" | "COMPLETED" | "CANCELLED";
  cueOutSection?: SpliceInfoSection;
  cueInSection?: SpliceInfoSection;
  createdAt: Date;
}

export class Scte35ScheduleCoordinator {
  private injectionService: StarTimesPlayoutHeadendAdapter;
  private scheduledBreaks = new Map<string, ScheduledBreak>();

  constructor(injectionService?: StarTimesPlayoutHeadendAdapter) {
    this.injectionService = injectionService || new StarTimesPlayoutHeadendAdapter();
  }

  public scheduleBreak(params: {
    breakId?: string;
    channelCode: string;
    scheduledTime: Date;
    durationSeconds: number;
    spotCount?: number;
    uniqueProgramId?: number;
  }): ScheduledBreak {
    const breakId = params.breakId || `BRK-${params.channelCode}-${Date.now()}`;
    const scheduled: ScheduledBreak = {
      breakId,
      channelCode: params.channelCode,
      scheduledTime: params.scheduledTime,
      durationSeconds: params.durationSeconds,
      spotCount: params.spotCount || 4,
      uniqueProgramId: params.uniqueProgramId || 1,
      status: "SCHEDULED",
      createdAt: new Date(),
    };
    this.scheduledBreaks.set(breakId, scheduled);
    return scheduled;
  }

  public async triggerBreakCueOut(breakId: string): Promise<{ success: boolean; cue: SpliceInfoSection }> {
    const scheduled = this.getBreakOrThrow(breakId);
    if (scheduled.status !== "SCHEDULED") {
      throw new Error(`Cannot trigger cue-out for break in status '${scheduled.status}'.`);
    }

    const res = this.injectionService.injectCommercialBreakCue({
      channelCode: scheduled.channelCode,
      breakId: scheduled.breakId,
      durationSeconds: scheduled.durationSeconds,
      spotCount: scheduled.spotCount,
    });

    scheduled.status = "CUE_OUT_ACTIVE";
    scheduled.cueOutSection = res.cue;
    return { success: true, cue: res.cue };
  }

  public async triggerBreakCueIn(breakId: string): Promise<{ success: boolean; cue: SpliceInfoSection }> {
    const scheduled = this.getBreakOrThrow(breakId);
    if (scheduled.status !== "CUE_OUT_ACTIVE") {
      throw new Error(
        `Cannot trigger cue-in for break in status '${scheduled.status}'. Must be 'CUE_OUT_ACTIVE'.`
      );
    }

    const res = this.injectionService.injectReturnToNetworkCue(scheduled.channelCode, scheduled.breakId);
    scheduled.status = "COMPLETED";
    scheduled.cueInSection = res.cue;
    return { success: true, cue: res.cue };
  }

  public getScheduledBreaks(channelCode?: string): ScheduledBreak[] {
    const all = Array.from(this.scheduledBreaks.values());
    if (channelCode) {
      return all.filter((b) => b.channelCode === channelCode);
    }
    return all;
  }

  public cancelBreak(breakId: string): boolean {
    const b = this.scheduledBreaks.get(breakId);
    if (b && b.status === "SCHEDULED") {
      b.status = "CANCELLED";
      return true;
    }
    return false;
  }

  private getBreakOrThrow(breakId: string): ScheduledBreak {
    const b = this.scheduledBreaks.get(breakId);
    if (!b) {
      throw new Error(`Scheduled break '${breakId}' not found.`);
    }
    return b;
  }
}

