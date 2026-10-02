/**
 * VMNL Verified Azeebo+ Destination Registry — UX-CMS-007 (todo.md TODO-SCR-04)
 * Authority: UIUX-001 §5.5 / HX-13 — navigation survives optional attribution
 * failure; invalid destinations use the approved fallback; no invented endpoints.
 */

export interface AzeeboDestination {
  id: string;
  universe: string;
  universalUrl: string;
  verifiedAt: Date;
  verifiedBy: string;
  status: "VERIFIED" | "REVOKED";
  campaignContextAllowed: boolean;
}

const destinations = new Map<string, AzeeboDestination>();

export function registerDestination(params: {
  id: string;
  universe: string;
  universalUrl: string;
  verifiedBy: string;
  campaignContextAllowed?: boolean;
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
    ...params,
    campaignContextAllowed: params.campaignContextAllowed ?? true,
    verifiedAt: new Date(),
    status: "VERIFIED",
  };
  destinations.set(params.id, destination);
  return destination;
}

export function revokeDestination(id: string, _revokedBy: string): AzeeboDestination {
  const dest = destinations.get(id);
  if (!dest) throw new Error(`[DEST-03] Destination '${id}' not found.`);
  dest.status = "REVOKED";
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
 * HX-13 fallback: attribution failure must not break safe navigation. Returns
 * the destination URL, or the approved fallback when destination is missing/
 * revoked/attribution fails.
 */
export function resolveNavigationUrl(destinationId: string, attributionParams?: Record<string, string>): { url: string; fallbackUsed: boolean } {
  const dest = destinations.get(destinationId);
  if (!dest || dest.status !== "VERIFIED") {
    return { url: process.env.AZEEBO_PLUS_UNIVERSAL_URL || "https://azeebo.plus", fallbackUsed: true };
  }
  try {
    const url = new URL(dest.universalUrl);
    if (dest.campaignContextAllowed && attributionParams) {
      for (const [key, value] of Object.entries(attributionParams)) {
        url.searchParams.set(key, value);
      }
    }
    return { url: url.toString(), fallbackUsed: false };
  } catch {
    return { url: process.env.AZEEBO_PLUS_UNIVERSAL_URL || "https://azeebo.plus", fallbackUsed: true };
  }
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
