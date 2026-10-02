/**
 * Approved Routing & Source Mappings Registry — TODO-SCR-15
 *
 * Single authoritative registry mapping every HX-01…HX-14 source-provenance
 * field to its approved backing source (domain engine, canonical repository,
 * or NOT_APPLICABLE). Surfaces consult this registry (via resolveSourceMapping
 * / assertApprovedSource) instead of hard-coding source assumptions, so the
 * source-provenance fields rendered on shared records are backed by an
 * approved, auditable mapping — never by convention.
 */

export type MappingStatus = "APPROVED" | "PENDING" | "NOT_APPLICABLE";

export type ApprovedSource =
  | "TALENT_ACCELERATOR_REGISTRY"
  | "AFCA_ACADEMY_SERVICE"
  | "VTM_ENGINE"
  | "ONE_STUDIOS_ENGINE"
  | "VCF_ENGINE"
  | "FUSION_EVENTS_ENGINE"
  | "TEND_ENGINE"
  | "COMMUNITY_HUB"
  | "QUOTE_TO_CASH_ENGINE"
  | "PAYOUT_ENGINE"
  | "BANK_RECONCILIATION"
  | "SEVEN_WAY_LEDGER"
  | "BROADCAST_RIGHTS_GATE"
  | "BROADCAST_TRAFFIC_ENGINE"
  | "BROADCAST_BILLING_ENGINE"
  | "PLAYOUT_ENGINE"
  | "SPONSORSHIP_ENGINE"
  | "CARRIAGE_ENGINE"
  | "VERSION_REGISTRY"
  | "WORK_DOMAIN"
  | "CASES_DOMAIN"
  | "APPROVALS_DOMAIN"
  | "CONTENT_DOMAIN"
  | "SESSION_REGISTRY"
  | "DESTINATION_REGISTRY"
  | "SOURCE_MAPPINGS_REGISTRY"
  | "NONE";

export interface SourceMapping {
  /** HX contract field identifier (HX-01…HX-14, with sub-field suffixes). */
  hxId: string;
  field: string;
  description: string;
  approvedSource: ApprovedSource;
  status: MappingStatus;
  /** Approval authority + date when APPROVED. */
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

const REGISTRY: SourceMapping[] = [
  { hxId: "HX-01", field: "person.identity", description: "Person identity fields on shared records", approvedSource: "SESSION_REGISTRY", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-02", field: "person.roles", description: "Granted role display (invitation chain)", approvedSource: "SESSION_REGISTRY", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-03", field: "talent.profile", description: "Talent profile projections", approvedSource: "TALENT_ACCELERATOR_REGISTRY", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-04", field: "talent.engagements", description: "VTM contracts & milestone state", approvedSource: "VTM_ENGINE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-05", field: "academy.certificates", description: "AFCA certificates & verification", approvedSource: "AFCA_ACADEMY_SERVICE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-06", field: "production.callsheets", description: "ONE Studios call sheets & gear", approvedSource: "ONE_STUDIOS_ENGINE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-07", field: "fund.pitches", description: "VCF pitch/slate records", approvedSource: "VCF_ENGINE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-08", field: "events.tickets", description: "Fusion Events tickets & gate stats", approvedSource: "FUSION_EVENTS_ENGINE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-09", field: "distribution.licences", description: "TEND catalogue/licences/royalties", approvedSource: "TEND_ENGINE", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-10", field: "finance.deal_state", description: "Quote-to-Cash deal stages & measures", approvedSource: "QUOTE_TO_CASH_ENGINE", status: "APPROVED", approvedBy: "Finance Controller", approvedAt: "2026-09-30" },
  { hxId: "HX-11", field: "finance.settlements", description: "Payout batches & 7-way splits (ledger-backed)", approvedSource: "SEVEN_WAY_LEDGER", status: "APPROVED", approvedBy: "Finance Controller", approvedAt: "2026-09-30" },
  { hxId: "HX-12", field: "broadcast.schedule_state", description: "Schedule lifecycle & EPG provenance", approvedSource: "WORK_DOMAIN", status: "APPROVED", approvedBy: "Broadcast Director", approvedAt: "2026-09-30" },
  { hxId: "HX-13", field: "navigation.attribution", description: "Deep-link attribution (fallback-safe)", approvedSource: "DESTINATION_REGISTRY", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
  { hxId: "HX-14", field: "records.provenance", description: "Shared-record field provenance badges", approvedSource: "SOURCE_MAPPINGS_REGISTRY", status: "APPROVED", approvedBy: "Principal Architect", approvedAt: "2026-09-30" },
];

const registry = new Map<string, SourceMapping>(REGISTRY.map((m) => [m.hxId, m]));

export function listSourceMappings(): SourceMapping[] {
  return [...registry.values()];
}

export function resolveSourceMapping(hxId: string): SourceMapping | undefined {
  return registry.get(hxId);
}

/**
 * Asserts that a surface rendering an HX field is backed by the approved
 * source. PENDING mappings throw — an unapproved source must not silently
 * back a provenance field (CCPP no-silent-substitution).
 */
export function assertApprovedSource(hxId: string, actualSource: ApprovedSource): void {
  const mapping = registry.get(hxId);
  if (!mapping) {
    throw new Error(`[SRCMAP-404] No source mapping registered for '${hxId}'.`);
  }
  if (mapping.status !== "APPROVED") {
    throw new Error(`[SRCMAP-01] Mapping '${hxId}' is ${mapping.status}; field '${mapping.field}' cannot be rendered from any source yet.`);
  }
  if (mapping.approvedSource !== actualSource) {
    throw new Error(`[SRCMAP-02] Field '${mapping.field}' (${hxId}) must be sourced from ${mapping.approvedSource}, not ${actualSource}.`);
  }
}

/** Admin console projection. */
export function computeSourceMappingCounts(): { total: number; approved: number; pending: number; notApplicable: number } {
  const all = [...registry.values()];
  return {
    total: all.length,
    approved: all.filter((m) => m.status === "APPROVED").length,
    pending: all.filter((m) => m.status === "PENDING").length,
    notApplicable: all.filter((m) => m.status === "NOT_APPLICABLE").length,
  };
}
