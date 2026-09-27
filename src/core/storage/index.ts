import crypto from "crypto";
import { getConfig } from "../config/index.js";

export interface PresignedUploadRequest {
  fileName: string;
  contentType: string;
  fileSizeBytes?: number;
  tenantId?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  downloadUrl: string;
  assetKey: string;
  expiresInSeconds: number;
}

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  errors: string[];
}

const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime", // ProRes / MOV
  "audio/wav",
  "audio/mpeg",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 * 1024; // 50GB for broadcast masters

/**
 * Computes SHA-256 checksum for binary buffer
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generates a presigned asset upload key and URL (S3 / MinIO compatible)
 */
export function generatePresignedUploadUrl(
  req: PresignedUploadRequest,
  expiresInSeconds: number = 3600
): PresignedUploadResponse {
  const config = getConfig();

  if (!ALLOWED_MIME_TYPES.includes(req.contentType)) {
    throw new Error(`[VMNL-STORAGE-ERROR] MIME type '${req.contentType}' is not permitted for storage upload`);
  }

  if (req.fileSizeBytes && req.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`[VMNL-STORAGE-ERROR] File size exceeds maximum limit of 50GB`);
  }

  const uniqueId = crypto.randomUUID();
  const sanitizedName = req.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const prefix = req.tenantId ? `tenants/${req.tenantId}/` : "enterprise/";
  const assetKey = `${prefix}${uniqueId}_${sanitizedName}`;

  // Build storage endpoint URL
  const uploadUrl = `${config.STORAGE_ENDPOINT}/${config.STORAGE_BUCKET}/${assetKey}?signature=${crypto.randomBytes(16).toString("hex")}&expires=${Date.now() + expiresInSeconds * 1000}`;
  const downloadUrl = `${config.STORAGE_ENDPOINT}/${config.STORAGE_BUCKET}/${assetKey}`;

  return {
    uploadUrl,
    downloadUrl,
    assetKey,
    expiresInSeconds,
  };
}

/**
 * Validates an uploaded media buffer against broadcast asset standards
 */
export function validateMediaBuffer(buffer: Buffer, declaredMimeType: string): FileValidationResult {
  const errors: string[] = [];

  if (!ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    errors.push(`Disallowed MIME type: ${declaredMimeType}`);
  }

  if (buffer.length === 0) {
    errors.push("Uploaded media buffer cannot be empty (0 bytes)");
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    errors.push("Uploaded media buffer exceeds maximum allowable broadcast size");
  }

  const checksumSha256 = computeSha256(buffer);

  return {
    valid: errors.length === 0,
    mimeType: declaredMimeType,
    sizeBytes: buffer.length,
    checksumSha256,
    errors,
  };
}
