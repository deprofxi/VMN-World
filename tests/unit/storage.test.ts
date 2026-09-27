import { describe, it, expect } from "vitest";
import {
  generatePresignedUploadUrl,
  validateMediaBuffer,
  computeSha256,
} from "../../src/core/storage/index.js";

describe("Digital Asset Management (DAM) & Storage Service (TASK-P1-04)", () => {
  it("should generate a valid presigned upload response for allowed MIME types", () => {
    const res = generatePresignedUploadUrl({
      fileName: "nigezie_show_master.mov",
      contentType: "video/quicktime",
      fileSizeBytes: 1024 * 1024 * 500, // 500MB
      tenantId: "vmn-broadcast",
    });

    expect(res.uploadUrl).toBeDefined();
    expect(res.downloadUrl).toBeDefined();
    expect(res.assetKey).toContain("tenants/vmn-broadcast/");
    expect(res.assetKey).toContain("nigezie_show_master.mov");
    expect(res.expiresInSeconds).toBe(3600);
  });

  it("should reject disallowed MIME types (e.g. executable binaries)", () => {
    expect(() =>
      generatePresignedUploadUrl({
        fileName: "malware.exe",
        contentType: "application/x-msdownload",
      })
    ).toThrowError(/is not permitted for storage upload/);
  });

  it("should compute accurate SHA-256 hashes and validate buffer integrity", () => {
    const testBuffer = Buffer.from("VMNL Broadcast Quality Master Content Verification");
    const expectedHash = computeSha256(testBuffer);

    const validation = validateMediaBuffer(testBuffer, "video/mp4");
    expect(validation.valid).toBe(true);
    expect(validation.checksumSha256).toBe(expectedHash);
    expect(validation.sizeBytes).toBe(testBuffer.length);
    expect(validation.errors.length).toBe(0);
  });

  it("should reject empty (0-byte) buffers", () => {
    const emptyBuffer = Buffer.alloc(0);
    const validation = validateMediaBuffer(emptyBuffer, "video/mp4");

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("Uploaded media buffer cannot be empty (0 bytes)");
  });
});
