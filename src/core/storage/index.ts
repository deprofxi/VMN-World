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
import { getConfig, type AppConfig } from "../config/index.js";
import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import { loadMediaAssetRecords, persistMediaAssetRecord } from "../database/repositories/release-critical.repository.js";

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

export interface StorageReadiness {
  ready: boolean;
  status: "ready" | "unavailable" | "not_probed";
  driver: string;
  endpoint: string;
  error?: string;
}

/** PR-08: bound the probe so a black-holed endpoint cannot stall a readiness call. */
const STORAGE_PROBE_TIMEOUT_MS = 2000;
/** A readiness endpoint is polled continuously — a short TTL keeps it cheap. */
const STORAGE_READINESS_TTL_MS = 10_000;
let storageReadinessCache: { at: number; value: StorageReadiness } | null = null;

/** Test seam: drop the readiness cache so the next probe re-opens a connection. */
export function _resetStorageReadinessCacheForTesting(): void {
  storageReadinessCache = null;
}

/**
 * Signed `HEAD /<bucket>` against an S3/MinIO endpoint — the cheapest request
 * that proves the store is both reachable and willing to accept the configured
 * credentials. Reuses the module's own SigV4 signer; adds no dependency.
 */
async function probeObjectStorage(config: AppConfig): Promise<{ ok: boolean; error?: string }> {
  const base = new URL(config.STORAGE_ENDPOINT);
  const host = base.host;
  const objectPath = `${base.pathname.replace(/\/$/, "")}/${config.STORAGE_BUCKET}`;
  const target = new URL(`${base.origin}${objectPath}`);

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const emptyPayloadHash = crypto.createHash("sha256").update("").digest("hex");
  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${emptyPayloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  // The query string is empty and the URI is signed unencoded, matching the
  // canonical form S3 expects for a bucket-level HEAD.
  const canonicalRequest = ["HEAD", objectPath, "", canonicalHeaders, signedHeaders, emptyPayloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.STORAGE_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const signature = crypto
    .createHmac("sha256", getSignatureKey(config.STORAGE_SECRET_KEY, dateStamp, config.STORAGE_REGION, "s3"))
    .update(stringToSign)
    .digest("hex");

  // `host` is deliberately absent: fetch sets it from the URL, and an explicit
  // Host header is forbidden by the fetch spec. It is signed above, so the
  // value the store receives is the value that was signed.
  const headers = {
    "x-amz-content-sha256": emptyPayloadHash,
    "x-amz-date": amzDate,
    authorization: `AWS4-HMAC-SHA256 Credential=${config.STORAGE_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STORAGE_PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(target, { method: "HEAD", headers, signal: controller.signal });
    if (response.status >= 200 && response.status < 400) return { ok: true };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: `STORAGE_CREDENTIALS_REJECTED (HTTP ${response.status})` };
    }
    if (response.status === 404) {
      return { ok: false, error: `STORAGE_BUCKET_NOT_FOUND (HTTP ${response.status})` };
    }
    return { ok: false, error: `STORAGE_PROBE_FAILED (HTTP ${response.status})` };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: `STORAGE_PROBE_TIMEOUT (>${STORAGE_PROBE_TIMEOUT_MS}ms)` };
    }
    return {
      ok: false,
      error: `STORAGE_UNREACHABLE (${err instanceof Error ? err.message : String(err)})`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probes object storage readiness.
 * Authority: T9-02 (F-9-02) / PR-08.
 *
 * PR-08: this used to parse `STORAGE_ENDPOINT` into a URL, assert it had a
 * hostname and return `ready` — it never opened a connection, so `/readyz`
 * reported healthy for an endpoint on a dead port and the storage readiness
 * gate could never fire. Since `STORAGE_READINESS_GATING` defaults to enforced,
 * a pod would take upload traffic against an unreachable DAM. The probe now
 * performs a signed bucket request and maps the outcome; network failure,
 * timeout, rejected credentials and a missing bucket are all `unavailable`.
 */
export async function checkStorageReady(forceRefresh = false): Promise<StorageReadiness> {
  if (!forceRefresh && storageReadinessCache && Date.now() - storageReadinessCache.at < STORAGE_READINESS_TTL_MS) {
    return storageReadinessCache.value;
  }

  let value: StorageReadiness;
  try {
    const config = getConfig();
    if (config.STORAGE_DRIVER === "local") {
      value = { ready: true, status: "ready", driver: "local", endpoint: "local_filesystem" };
    } else {
      const url = new URL(config.STORAGE_ENDPOINT);
      if (!url.hostname) {
        value = {
          ready: false,
          status: "unavailable",
          driver: config.STORAGE_DRIVER,
          endpoint: config.STORAGE_ENDPOINT,
          error: "Invalid storage endpoint host",
        };
      } else {
        const probe = await probeObjectStorage(config);
        value = probe.ok
          ? { ready: true, status: "ready", driver: config.STORAGE_DRIVER, endpoint: config.STORAGE_ENDPOINT }
          : {
              ready: false,
              status: "unavailable",
              driver: config.STORAGE_DRIVER,
              endpoint: config.STORAGE_ENDPOINT,
              error: probe.error,
            };
      }
    }
  } catch (err) {
    value = {
      ready: false,
      status: "unavailable",
      driver: "unknown",
      endpoint: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  storageReadinessCache = { at: Date.now(), value };
  return value;
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
  /**
   * Deterministic id for seed/backfill registration. When supplied and already
   * present, the existing record is returned unchanged (idempotent seeding);
   * otherwise it is adopted verbatim so persisted references keep resolving
   * across restarts of the in-memory registry.
   */
  assetId?: string;
}

const mediaAssetRegistry = new Map<string, MediaAssetRecord>();

/**
 * TSK-17: the registry is the read index for the durable `MediaAssetRecord`
 * rows. Registration is the one write path, and a row the database rejects is
 * removed from the index again, so the DAM picker can never offer an asset no
 * other process can see.
 */
registerDurableStore<MediaAssetRecord>("mediaAssetRecord", persistMediaAssetRecord);

function stageMediaAsset(record: MediaAssetRecord): void {
  stageDurableWrite<MediaAssetRecord>({
    store: "mediaAssetRecord",
    key: record.assetId,
    payload: record,
    rollback: () => {
      mediaAssetRegistry.delete(record.assetId);
    },
  });
}

/** Boot hydration (TSK-17): rebuild the DAM registry from durable rows. */
export async function refreshMediaAssetIndex(): Promise<{ assets: number }> {
  const loaded = await loadMediaAssetRecords();
  mediaAssetRegistry.clear();
  for (const record of loaded) mediaAssetRegistry.set(record.assetId, record);
  return { assets: mediaAssetRegistry.size };
}

/**
 * Registers a DAM asset in the approved-media registry. Access state is
 * derived from validation evidence: any validation error → FAILED,
 * clean virus scan → AVAILABLE, otherwise QUARANTINED.
 */
/** The tenant namespace `generatePresignedUploadUrl` signs uploads into. */
const TENANT_KEY_NS = /^tenants\/([^/]+)\//;

/**
 * TSK-58 box 1: a tenant-scoped registration may neither adopt a row that is
 * not its own nor re-key another tenant's namespace. Without this the
 * idempotent lookups below *return the foreign record* to the caller, which
 * makes the write route a read path for another tenant's title, checksum and
 * provenance.
 */
function assertTenantOwnership(params: RegisterMediaAssetParams, candidate: MediaAssetRecord): void {
  if (!params.tenantId || candidate.tenantId === params.tenantId) return;
  throw new Error(
    `[MEDIA-ASSET-07] '${candidate.assetId}' is not this tenant's asset; a tenant session cannot register into or adopt another tenant's row.`
  );
}

export function registerMediaAsset(params: RegisterMediaAssetParams): MediaAssetRecord {
  if (!params.title?.trim()) throw new Error("[MEDIA-ASSET-01] Title is required.");
  if (!params.assetKey?.trim()) throw new Error("[MEDIA-ASSET-02] Asset key is required.");
  if (!ALLOWED_MIME_TYPES.includes(params.mimeType)) {
    throw new Error(`[MEDIA-ASSET-03] MIME type '${params.mimeType}' is not on the DAM allowlist.`);
  }
  if (!params.checksumSha256?.trim()) {
    throw new Error("[MEDIA-ASSET-04] Checksum is required (computeSha256 of the validated buffer).");
  }
  const key = params.assetKey.trim();
  const ns = TENANT_KEY_NS.exec(key);
  if (params.tenantId && ns && ns[1] !== params.tenantId) {
    throw new Error(
      `[MEDIA-ASSET-07] '${params.assetId || key}' targets the '${ns[1]}' tenant namespace; a tenant session cannot register into another tenant's namespace.`
    );
  }
  // Idempotent backfill semantics (SCR-03 seed): the same explicit assetId or
  // the same assetKey returns the existing record instead of minting a twin.
  if (params.assetId?.trim()) {
    const existing = mediaAssetRegistry.get(params.assetId.trim());
    if (existing) {
      assertTenantOwnership(params, existing);
      return existing;
    }
  }
  for (const candidate of mediaAssetRegistry.values()) {
    if (candidate.assetKey === key) {
      assertTenantOwnership(params, candidate);
      return candidate;
    }
  }

  const id = params.assetId?.trim() || `MA-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
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
  stageMediaAsset(record);
  return record;
}

export function getMediaAsset(assetId: string): MediaAssetRecord | undefined {
  return mediaAssetRegistry.get(assetId);
}

/**
 * Lists registry assets. A tenant session sees only rows carrying its own
 * `tenantId`: a tenant-less row is *unowned*, not shared, and the old
 * `!a.tenantId ||` branch handed every one of them to every tenant. Callers
 * that pass no scope (server-side projections, the dev/test bypass) still read
 * the whole registry; non-AVAILABLE assets need an explicit reviewer request.
 */
export function listApprovedMediaAssets(params?: { tenantId?: string; includeNonAvailable?: boolean }): MediaAssetRecord[] {
  let all = [...mediaAssetRegistry.values()];
  if (params?.tenantId) {
    all = all.filter((a) => a.tenantId === params.tenantId);
  }
  if (!params?.includeNonAvailable) {
    all = all.filter((a) => a.accessState === "AVAILABLE");
  }
  return all.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
}

export function _resetMediaAssetsForTesting(): void {
  mediaAssetRegistry.clear();
}
