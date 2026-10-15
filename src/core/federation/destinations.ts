/**
 * VMNL Verified Azeebo+ Destination Registry — UX-CMS-007
 * Authority: UIUX-001 §5.5 / HX-13 — navigation survives optional attribution
 * failure; invalid destinations use the approved fallback; no invented endpoints.
 *
 * PRD §41 / CLAUDE.md `<azeebo>`: a destination URL is an external fact. This
 * registry never supplies one itself — when nothing is configured it fails
 * closed instead of guessing a production domain.
 */

import { getConfig } from "../config/index.js";
import { registerDurableStore, stageDurableWrite } from "../database/durable-journal.js";
import {
  loadAzeeboDestinations,
  persistAzeeboDestination,
  type AzeeboDestinationWrite,
} from "../database/repositories/release-critical.repository.js";

export type AzeeboDestinationStatus = "CANDIDATE" | "VERIFIED" | "DEPRECATED" | "BLOCKED" | "REVOKED";

export interface AzeeboDestination {
  id: string;
  universe: string;
  universalUrl: string;
  status: AzeeboDestinationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  statusReason?: string;
  stateChangedAt: Date;
  campaignContextAllowed: boolean;
}

const destinations = new Map<string, AzeeboDestination>();

/**
 * TSK-17: verification state is a durable fact, not a process-local assertion.
 * The registry is the read index for the `AzeeboDestination` rows, and a status
 * change the database rejects is rolled back here rather than left standing as
 * VERIFIED in one process only.
 */
registerDurableStore<AzeeboDestinationWrite>("azeeboDestination", persistAzeeboDestination);

function stageDestination(dest: AzeeboDestination, registeredBy?: string): void {
  stageDurableWrite<AzeeboDestinationWrite>({
    store: "azeeboDestination",
    key: dest.id,
    payload: { destination: dest, ...(registeredBy ? { registeredBy } : {}) },
    rollback: () => {
      destinations.delete(dest.id);
    },
  });
}

/** Boot hydration (TSK-17): rebuild the destination registry from durable rows. */
export async function refreshDestinationIndex(): Promise<{ destinations: number }> {
  const loaded = await loadAzeeboDestinations();
  destinations.clear();
  for (const dest of loaded) destinations.set(dest.id, dest);
  return { destinations: destinations.size };
}

/**
 * Records a destination as a CANDIDATE. Registration is an assertion by an
 * operator, not a verification, so it never grants VERIFIED state.
 */
export function registerDestination(params: {
  id: string;
  universe: string;
  universalUrl: string;
  campaignContextAllowed?: boolean;
  registeredBy: string;
}): AzeeboDestination {
  let parsed: URL;
  try {
    parsed = new URL(params.universalUrl);
  } catch {
    throw new Error("[DEST-01] Destination universalUrl must be an absolute URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("[DEST-02] Destinations must be https for verified deep links.");
  }
  const destination: AzeeboDestination = {
    id: params.id,
    universe: params.universe,
    universalUrl: params.universalUrl,
    campaignContextAllowed: params.campaignContextAllowed ?? true,
    status: "CANDIDATE",
    statusReason: `Registered by ${params.registeredBy}`,
    stateChangedAt: new Date(),
  };
  destinations.set(params.id, destination);
  stageDestination(destination, params.registeredBy);
  return destination;
}

/** Promotes a CANDIDATE to VERIFIED. Only an explicit verification is a gate. */
export function verifyDestination(id: string, verifiedBy: string): AzeeboDestination {
  const dest = destinations.get(id);
  if (!dest) throw new Error(`[DEST-03] Destination '${id}' not found.`);
  if (dest.status !== "CANDIDATE") {
    throw new Error(`[DEST-04] Only a CANDIDATE destination can be verified (current status: ${dest.status}).`);
  }
  if (!verifiedBy) throw new Error("[DEST-05] Verification requires a named verifier.");
  dest.status = "VERIFIED";
  dest.verifiedAt = new Date();
  dest.verifiedBy = verifiedBy;
  dest.statusReason = undefined;
  dest.stateChangedAt = new Date();
  // `registeredBy` stays the original registrant: a verification is a state
  // change, not a re-registration, and it is recorded in `verifiedBy`.
  stageDestination(dest);
  return dest;
}

export function revokeDestination(id: string, revokedBy: string, reason?: string): AzeeboDestination {
  return transitionTo(id, "REVOKED", revokedBy, reason);
}

export function deprecateDestination(id: string, changedBy: string, reason?: string): AzeeboDestination {
  return transitionTo(id, "DEPRECATED", changedBy, reason);
}

/** BLOCKED suspends navigation without discarding the verification record. */
export function blockDestination(id: string, changedBy: string, reason?: string): AzeeboDestination {
  return transitionTo(id, "BLOCKED", changedBy, reason);
}

function transitionTo(id: string, status: AzeeboDestinationStatus, changedBy: string, reason?: string): AzeeboDestination {
  const dest = destinations.get(id);
  if (!dest) throw new Error(`[DEST-03] Destination '${id}' not found.`);
  if (!changedBy) throw new Error("[DEST-06] Status changes require a named operator.");
  dest.status = status;
  dest.statusReason = reason;
  dest.stateChangedAt = new Date();
  stageDestination(dest);
  return dest;
}

export function isVerifiedDestination(id: string): boolean {
  const dest = destinations.get(id);
  return Boolean(dest && dest.status === "VERIFIED");
}

export function getVerifiedDestination(id: string): AzeeboDestination | undefined {
  const dest = destinations.get(id);
  return dest && dest.status === "VERIFIED" ? dest : undefined;
}

export function listDestinations(): AzeeboDestination[] {
  return [...destinations.values()];
}

/**
 * HX-13 approved fallback for safe navigation when a destination is unusable.
 * A configured `AZEEBO_PLUS_UNIVERSAL_URL` is used verbatim; when absent,
 * navigation fails closed with an explicit error rather than an invented
 * endpoint. Never throws for a reachable destination.
 */
export function resolveNavigationUrl(destinationId: string, attributionParams?: Record<string, string>): { url: string; fallbackUsed: boolean } {
  const dest = destinations.get(destinationId);
  if (dest && dest.status === "VERIFIED") {
    try {
      const url = new URL(dest.universalUrl);
      if (dest.campaignContextAllowed && attributionParams) {
        for (const [key, value] of Object.entries(attributionParams)) {
          url.searchParams.set(key, value);
        }
      }
      return { url: url.toString(), fallbackUsed: false };
    } catch {
      // Malformed stored URL — treat the destination as unusable, below.
    }
  }
  return approvedFallback();
}

/** The partner origin this deployment explicitly configured, if any (TSK-35). */
export function getConfiguredFederationOrigin(): string | undefined {
  const configured = getConfig().AZEEBO_PLUS_UNIVERSAL_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : undefined;
}

function approvedFallback(): { url: string; fallbackUsed: true } {
  const configured = getConfiguredFederationOrigin();
  if (!configured) {
    throw new Error("[DEST-07] No Azeebo+ destination is available and AZEEBO_PLUS_UNIVERSAL_URL is not configured; navigation fails closed (no endpoint may be invented).");
  }
  return { url: configured, fallbackUsed: true };
}

export function _resetDestinationsForTesting(): void {
  destinations.clear();
}

// ---------------------------------------------------------------------------
// UX-CMS-008: Enquiry routing configuration (authorised operator managed)
// ---------------------------------------------------------------------------

export interface EnquiryRoutingRule {
  vertical: string;
  targetQueue: string;
  targetOwner: string;
  acknowledgementTemplate: string;
  active: boolean;
  updatedBy: string;
  updatedAt: Date;
}

const routingRules = new Map<string, EnquiryRoutingRule>();

export function setRoutingRule(params: {
  vertical: string;
  targetQueue: string;
  targetOwner: string;
  acknowledgementTemplate?: string;
  updatedBy: string;
}): EnquiryRoutingRule {
  if (!params.vertical || !params.targetQueue || !params.targetOwner) {
    throw new Error("[ROUTE-CFG-01] vertical, targetQueue and targetOwner are required.");
  }
  const rule: EnquiryRoutingRule = {
    vertical: params.vertical,
    targetQueue: params.targetQueue,
    targetOwner: params.targetOwner,
    acknowledgementTemplate: params.acknowledgementTemplate || "Your enquiry has been received and routed to the accountable queue.",
    active: true,
    updatedBy: params.updatedBy,
    updatedAt: new Date(),
  };
  routingRules.set(params.vertical, rule);
  return rule;
}

export function getRoutingRule(vertical: string): EnquiryRoutingRule | undefined {
  return routingRules.get(vertical);
}

export function listRoutingRules(): EnquiryRoutingRule[] {
  return [...routingRules.values()];
}

export function deactivateRoutingRule(vertical: string, updatedBy: string): EnquiryRoutingRule {
  const rule = routingRules.get(vertical);
  if (!rule) throw new Error(`[ROUTE-CFG-02] No routing rule for '${vertical}'.`);
  rule.active = false;
  rule.updatedBy = updatedBy;
  rule.updatedAt = new Date();
  return rule;
}

export function _resetRoutingForTesting(): void {
  routingRules.clear();
}
