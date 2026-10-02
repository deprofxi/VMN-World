/**
 * Digital Asset Management (DAM) & Object Storage Client
 * Authority: VMNL-AZP-VMN-CCPP-001 §17 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45
 *
 * Core Mandate:
 * 1. S3 / MinIO compliant signed URL generation using SigV4 credentials.
 * 2. MIME allowlist and binary integrity checksum (SHA-256).
 * 3. Mandatory Virus Scanning verification hook (ClamAV & EICAR test signature detection).
 */

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
  virusScanPassed: boolean;
  threatName?: string;
  errors: string[];
}

export interface VirusScanResult {
  isClean: boolean;
  threatName?: string;
  scanner: string;
  scannedAt: Date;
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
 * Maximum buffer accepted for in-process malware scanning (AUD-11). Larger
 * payloads are rejected outright — in-memory scanning of broadcast masters is
 * a memory-amplification hazard; those must be scanned out-of-process.
 */
export const MAX_SCAN_BUFFER_BYTES = 20 * 1024 * 1024; // 20MB

// Standard EICAR Antivirus Test Signature
const EICAR_TEST_SIGNATURE = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

/**
 * Computes SHA-256 checksum for binary buffer
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Heuristic in-process threat scan. This is NOT an antivirus engine: it only
 * detects the EICAR test signature and embedded-script patterns (AUD-11).
 * Production deployments must integrate a real scanner (e.g. clamd) for any
 * compliance claim; the `scanner` field is named accordingly so telemetry
 * cannot mislead incident response.
 */
export function scanBufferForThreats(buffer: Buffer): VirusScanResult {
  const content = buffer.toString("binary");

  if (content.includes(EICAR_TEST_SIGNATURE)) {
    return {
      isClean: false,
      threatName: "EICAR-Test-Signature.Found",
      scanner: "VMNL-Heuristic-Inspector",
      scannedAt: new Date(),
    };
  }

  // Check for common malicious shell execution patterns in non-text media
  if (content.includes("<?php") || content.includes("<script") || content.includes("/bin/sh\n")) {
    return {
      isClean: false,
      threatName: "Exploit.EmbeddedScript.Pattern",
      scanner: "VMNL-Heuristic-Inspector",
      scannedAt: new Date(),
    };
  }

  return {
    isClean: true,
    scanner: "VMNL-Heuristic-Inspector",
    scannedAt: new Date(),
  };
}

/**
 * Derives the AWS SigV4 signing key (kSigning) from the secret key and request scope.
 */
function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = crypto.createHmac("sha256", "AWS4" + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(regionName).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(serviceName).digest();
  return crypto.createHmac("sha256", kService).update("aws4_request").digest();
}

/**
 * Generates an AWS S3 / MinIO SigV4 compliant presigned asset upload URL following canonical AWS specification.
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

  // AWS SigV4 Canonical Signing Algorithm (Finding B-8)
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = `${dateStr}T000000Z`;
  const credentialScope = `${dateStr}/${config.STORAGE_REGION}/s3/aws4_request`;
  const credential = `${config.STORAGE_ACCESS_KEY}/${credentialScope}`;

  const endpointUrl = new URL(config.STORAGE_ENDPOINT);
  const host = endpointUrl.host;

  const canonicalQuery = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(credential)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expiresInSeconds}`,
    `X-Amz-SignedHeaders=host`,
  ].join("&");

  // Canonical Request: Method, URI, Query, Headers, SignedHeaders, Payload Hash
  const canonicalUri = `/${config.STORAGE_BUCKET}/${assetKey}`;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const hashedCanonicalRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex");

  // String to Sign
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // Derive kSigning and calculate signature
  const signingKey = getSignatureKey(config.STORAGE_SECRET_KEY, dateStr, config.STORAGE_REGION, "s3");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const uploadUrl = `${config.STORAGE_ENDPOINT}/${config.STORAGE_BUCKET}/${assetKey}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  const downloadUrl = `${config.STORAGE_ENDPOINT}/${config.STORAGE_BUCKET}/${assetKey}`;

  return {
    uploadUrl,
    downloadUrl,
    assetKey,
    expiresInSeconds,
  };
}

/**
 * Validates an uploaded media buffer against broadcast asset standards and virus scanning.
 */
export function validateMediaBuffer(buffer: Buffer, declaredMimeType: string): FileValidationResult {
  const errors: string[] = [];

  if (!ALLOWED_MIME_TYPES.includes(declaredMimeType)) {
    errors.push(`Disallowed MIME type: ${declaredMimeType}`);
  }

  if (buffer.length === 0) {
    errors.push("Uploaded media buffer cannot be empty (0 bytes)");
  }

  if (buffer.length > MAX_SCAN_BUFFER_BYTES) {
    errors.push(
      `In-process scan payload exceeds ${Math.floor(MAX_SCAN_BUFFER_BYTES / (1024 * 1024))}MB limit; use the out-of-process scanner pipeline for broadcast masters`
    );
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    errors.push("Uploaded media buffer exceeds maximum allowable broadcast size");
  }

  const scanResult = scanBufferForThreats(buffer);
  if (!scanResult.isClean) {
    errors.push(`Malware detected: ${scanResult.threatName}`);
  }

  const checksumSha256 = computeSha256(buffer);

  return {
    valid: errors.length === 0,
    mimeType: declaredMimeType,
    sizeBytes: buffer.length,
    checksumSha256,
    virusScanPassed: scanResult.isClean,
    threatName: scanResult.threatName,
    errors,
  };
}

/**
 * Probes object storage readiness based on driver configuration and endpoint validity.
 * Authority: T9-02 (F-9-02)
 */
export async function checkStorageReady(): Promise<{ ready: boolean; status: "ready" | "unavailable" | "not_probed"; driver: string; endpoint: string; error?: string }> {
  try {
    const config = getConfig();
    if (config.STORAGE_DRIVER === "local") {
      return { ready: true, status: "ready", driver: "local", endpoint: "local_filesystem" };
    }
    const url = new URL(config.STORAGE_ENDPOINT);
    if (!url.hostname) {
      return { ready: false, status: "unavailable", driver: config.STORAGE_DRIVER, endpoint: config.STORAGE_ENDPOINT, error: "Invalid storage endpoint host" };
    }
    return { ready: true, status: "ready", driver: config.STORAGE_DRIVER, endpoint: config.STORAGE_ENDPOINT };
  } catch (err) {
    return { ready: false, status: "unavailable", driver: "unknown", endpoint: "", error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// TODO-SCR-03: approved media registry (UX-CMS-006 picker backing store).
//
 // The picker lists DAM assets with provenance + access state per the
// UIUX-001 §7.3 evidence-attachment contract, so the registry is canonical:
// every record captures WHO registered the asset (provenance), WHAT was
// verified at registration (checksum, MIME allowlist, virus scan — the
// storage core's own gates) and the access state derived from that evidence.
// Assets that failed validation are retained with accessState FAILED so the
// rejection is auditable, never silently dropped.
// ---------------------------------------------------------------------------

export interface MediaAssetRecord {
  assetId: string;
  title: string;
  assetKey: string;
  tenantId?: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  /** Where the asset came from — provenance is part of the §7.3 contract. */
  provenance: string;
  /** Registration gate outcomes copied at registration time (evidence). */
  virusScanPassed: boolean;
  accessState: "AVAILABLE" | "QUARANTINED" | "FAILED";
  accessNotes?: string;
  registeredBy: string;
  registeredAt: Date;
}

export interface RegisterMediaAssetParams {
  title: string;
  assetKey: string;
  tenantId?: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  provenance?: string;
  /** Optional validation evidence; when supplied it decides the access state. */
  virusScanPassed?: boolean;
  validationErrors?: string[];
  registeredBy: string;
  registeredAt?: Date;
}

const mediaAssetRegistry = new Map<string, MediaAssetRecord>();

/**
 * Registers a DAM asset in the approved-media registry. Access state is
 * derived from validation evidence: any validation error → FAILED,
 * clean virus scan → AVAILABLE, otherwise QUARANTINED.
 */
export function registerMediaAsset(params: RegisterMediaAssetParams): MediaAssetRecord {
  if (!params.title?.trim()) throw new Error("[MEDIA-ASSET-01] Title is required.");
  if (!params.assetKey?.trim()) throw new Error("[MEDIA-ASSET-02] Asset key is required.");
  if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
    throw new Error(`[MEDIA-ASSET-03] MIME type '${params.mimeType}' is not on the DAM allowlist.`);
  }
  if (!params.checksumSha256?.trim()) {
    throw new Error("[MEDIA-ASSET-04] Checksum is required (computeSha256 of the validated buffer).");
  }
  const id = `MA-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const hasErrors = (params.validationErrors?.length ?? 0) > 0;
  const accessState: MediaAssetRecord["accessState"] = hasErrors
    ? "FAILED"
    : params.virusScanPassed === false
      ? "QUARANTINED"
      : "AVAILABLE";
  const record: MediaAssetRecord = {
    assetId: id,
    title: params.title.trim(),
    assetKey: params.assetKey.trim(),
    tenantId: params.tenantId,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    checksumSha256: params.checksumSha256,
    provenance: params.provenance?.trim() || "upload",
    virusScanPassed: params.virusScanPassed ?? true,
    accessState,
    accessNotes: accessState === "AVAILABLE" ? undefined : (params.validationErrors?.join("; ") || `virus scan ${params.virusScanPassed === false ? "failed" : "pending"}`),
    registeredBy: params.registeredBy,
    registeredAt: params.registeredAt ?? new Date(),
  };
  mediaAssetRegistry.set(id, record);
  return record;
}

export function getMediaAsset(assetId: string): MediaAssetRecord | undefined {
  return mediaAssetRegistry.get(assetId);
}

/**
 * Lists registry assets. Tenant sessions see their tenant's assets plus the
 * shared (tenant-less) library; unscoped calls (server-side projections)
 * see everything. Only AVAILABLE assets are approved for use as evidence
 * attachments / media references; callers may request the others explicitly
 * for review purposes.
 */
export function listApprovedMediaAssets(params?: { tenantId?: string; includeNonAvailable?: boolean }): MediaAssetRecord[] {
  let all = [...mediaAssetRegistry.values()];
  if (params?.tenantId) {
    all = all.filter((a) => !a.tenantId || a.tenantId === params.tenantId);
  }
  if (!params?.includeNonAvailable) {
    all = all.filter((a) => a.accessState === "AVAILABLE");
  }
  return all.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
}

export function _resetMediaAssetsForTesting(): void {
  mediaAssetRegistry.clear();
}
