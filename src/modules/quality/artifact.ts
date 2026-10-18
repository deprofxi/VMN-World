/**
 * Release artefact binding — digest and signature
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §67 · VMNL-AZP-VMN-CCPP-001 — R1.1
 *
 * PR-04: a release manifest used to be self-attestation. `evaluateBroadcastRelease`
 * read the manifest's own `status` strings, so a manifest could clear a tree that
 * had never been built. These helpers make the artefact part of the claim:
 *
 * - `computeArtifactDigest()` hashes the built output, so the digest names a real
 *   build rather than a string someone typed.
 * - `signCanonicalManifest()` binds the release owner's key to that digest and to
 *   every gate status, so changing a gate after signing invalidates the signature.
 * - `verifyManifestSignature()` returns a *reason* on refusal, never a bare boolean,
 *   so the operator can tell "no key configured" from "signature forged".
 *
 * The signing key is never read from the repository. It comes from the release
 * job's environment (`RELEASE_SIGNING_KEY`) and is never logged.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { BroadcastReleaseManifest } from "./gates.js";

export interface ArtifactDigest {
  digest: string;
  fileCount: number;
  totalBytes: number;
  root: string;
}

/**
 * Deterministic digest of a build directory: SHA-256 over the sorted list of
 * `relativePath \0 fileDigest`, so renaming or adding a file changes the result.
 * Returns `null` when the directory does not exist — an absent build is not an
 * empty build and must not hash to a stable value.
 */
export function computeArtifactDigest(root: string): ArtifactDigest | null {
  const absoluteRoot = path.resolve(root);
  if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
    return null;
  }

  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && !entry.name.endsWith(".map")) {
        files.push(full);
      }
    }
  };
  walk(absoluteRoot);
  files.sort();

  const outer = crypto.createHash("sha256");
  let totalBytes = 0;
  for (const file of files) {
    const relative = path.relative(absoluteRoot, file).split(path.sep).join("/");
    const content = fs.readFileSync(file);
    totalBytes += content.byteLength;
    outer.update(`${relative}\0${crypto.createHash("sha256").update(content).digest("hex")}\n`);
  }

  return {
    digest: outer.digest("hex"),
    fileCount: files.length,
    totalBytes,
    root: absoluteRoot,
  };
}

/**
 * Canonical, key-sorted projection of everything the signature is meant to bind.
 * Deliberately excludes `ownerSignature` itself and any free-text rationale: the
 * signature covers claims that change the release decision, not prose.
 */
export function canonicalManifestPayload(manifest: BroadcastReleaseManifest): string {
  const gates = Object.entries(manifest.gates ?? {})
    .map(([id, gate]) => ({
      id,
      status: gate?.status ?? null,
      evidenceRef: gate?.evidenceRef ?? null,
      evaluatedAt: gate?.evaluatedAt instanceof Date ? gate.evaluatedAt.toISOString() : String(gate?.evaluatedAt ?? ""),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify({
    version: manifest.version ?? null,
    environment: manifest.environment ?? null,
    gitCommitSha: manifest.gitCommitSha ?? null,
    artifactDigest: manifest.artifactDigest ?? null,
    humanReleaseOwner: {
      name: manifest.humanReleaseOwner?.name ?? null,
      employeeId: manifest.humanReleaseOwner?.employeeId ?? null,
      signedAt:
        manifest.humanReleaseOwner?.signedAt instanceof Date
          ? manifest.humanReleaseOwner.signedAt.toISOString()
          : String(manifest.humanReleaseOwner?.signedAt ?? ""),
    },
    gates,
  });
}

export function signCanonicalManifest(manifest: BroadcastReleaseManifest, signingKey: string): string {
  if (!signingKey || signingKey.trim().length === 0) {
    throw new Error("A release signing key is required to sign a manifest.");
  }
  return crypto
    .createHmac("sha256", signingKey)
    .update(canonicalManifestPayload(manifest))
    .digest("hex");
}

export type ManifestSignatureVerdict =
  | { verified: true; reason?: undefined }
  | { verified: false; reason: string };

/**
 * Verifies the owner signature. A missing signature, a missing key and a forged
 * signature are three different answers and are reported as three different
 * reasons — "could not check" must never be indistinguishable from "checked and
 * passed".
 */
export function verifyManifestSignature(
  manifest: BroadcastReleaseManifest,
  signingKey: string | undefined
): ManifestSignatureVerdict {
  if (!manifest.ownerSignature) {
    return { verified: false, reason: "NO_SIGNATURE: the manifest carries no ownerSignature." };
  }
  if (!signingKey || signingKey.trim().length === 0) {
    return {
      verified: false,
      reason:
        "NO_SIGNING_KEY: RELEASE_SIGNING_KEY is not set, so the owner signature could not be checked.",
    };
  }
  const expected = signCanonicalManifest(manifest, signingKey);
  const provided = manifest.ownerSignature.trim().toLowerCase();
  if (provided.length !== expected.length) {
    return { verified: false, reason: "SIGNATURE_INVALID: the owner signature does not match the manifest." };
  }
  const matches = crypto.timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(expected, "utf8"));
  return matches
    ? { verified: true }
    : { verified: false, reason: "SIGNATURE_INVALID: the owner signature does not match the manifest." };
}
