/**
 * Unit verification for ANSI/SCTE 35 2020 Digital Program Insertion Cueing Engine
 */

import { describe, expect, it } from "vitest";
import {
  decodeSpliceInfoSection,
  encodeSpliceInsert,
  SCTE35_TABLE_ID,
  StarTimesPlayoutHeadendAdapter,
} from "../../src/modules/broadcast/playout/scte35.js";

describe("ANSI/SCTE-35 2020 Engine", () => {
  it("encodes a compliant splice_insert cue-out with 120s commercial break duration", () => {
    const cue = encodeSpliceInsert({
      spliceEventId: 1001,
      outOfNetwork: true,
      durationSeconds: 120,
      uniqueProgramId: 42,
      availNum: 1,
      availsExpected: 4,
      immediate: true,
    });

    expect(cue.crcValid).toBe(true);
    expect(cue.commandType).toBe("SPLICE_INSERT");
    expect(cue.base64).toBeDefined();
    expect(cue.rawBytes[0]).toBe(SCTE35_TABLE_ID);
    expect(cue.insertCommand?.outOfNetworkIndicator).toBe(true);
    expect(cue.insertCommand?.breakDurationSeconds).toBe(120);
    expect(cue.insertCommand?.spliceEventId).toBe(1001);
  });

  it("decodes encoded SCTE-35 binary and base64 with exact round-trip fidelity", () => {
    const original = encodeSpliceInsert({
      spliceEventId: 8888,
      outOfNetwork: true,
      durationSeconds: 60,
      uniqueProgramId: 10,
      availNum: 2,
      availsExpected: 3,
      immediate: true,
    });

    const decodedFromBuffer = decodeSpliceInfoSection(original.rawBytes);
    expect(decodedFromBuffer.crcValid).toBe(true);
    expect(decodedFromBuffer.commandType).toBe("SPLICE_INSERT");
    expect(decodedFromBuffer.insertCommand?.spliceEventId).toBe(8888);
    expect(decodedFromBuffer.insertCommand?.outOfNetworkIndicator).toBe(true);
    expect(decodedFromBuffer.insertCommand?.breakDurationSeconds).toBe(60);

    const decodedFromBase64 = decodeSpliceInfoSection(original.base64);
    expect(decodedFromBase64.crcValid).toBe(true);
    expect(decodedFromBase64.insertCommand?.spliceEventId).toBe(8888);
  });

  it("encodes return-to-network cue-in (out_of_network = false)", () => {
    const cue = encodeSpliceInsert({
      spliceEventId: 1002,
      outOfNetwork: false,
      immediate: true,
    });

    const decoded = decodeSpliceInfoSection(cue.base64);
    expect(decoded.insertCommand?.outOfNetworkIndicator).toBe(false);
  });

  it("detects corrupted MPEG-2 CRC-32 on tampered SCTE-35 packets", () => {
    const original = encodeSpliceInsert({
      spliceEventId: 5005,
      outOfNetwork: true,
      durationSeconds: 30,
    });

    const tampered = Buffer.from(original.rawBytes);
    // Tamper with a payload byte
    tampered[15] = tampered[15] ^ 0xff;

    const decoded = decodeSpliceInfoSection(tampered);
    expect(decoded.crcValid).toBe(false);
  });

  it("StarTimesPlayoutHeadendAdapter generates cues and reports carrier status", () => {
    const adapter = new StarTimesPlayoutHeadendAdapter();

    const result = adapter.injectCommercialBreakCue({
      channelCode: "NXTR",
      breakId: "BRK-TEN-PRIME-01",
      durationSeconds: 90,
      spotCount: 3,
    });

    expect(result.success).toBe(true);
    expect(result.cue.crcValid).toBe(true);
    expect(result.cue.insertCommand?.outOfNetworkIndicator).toBe(true);
    expect(result.cue.insertCommand?.breakDurationSeconds).toBe(90);

    const carrier = adapter.getCarrierStatus("NXTR");
    expect(carrier.locked).toBe(true);
    expect(carrier.carrier).toBe("STARTIMES_DTT");
    expect(carrier.headendOnline).toBe(true);
  });
});
