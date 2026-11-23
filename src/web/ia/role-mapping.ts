/**
 * VMN World IA R1.1 — Screen-to-Rule Mapping (Wave 1)
 * Authority: docs/decisions/DEC-RBAC-MAPPING-001.md §D3
 *
 * Implements the explicit least-privilege rule mapping for Wave 1 screens.
 * Only screens that resolve to verified, non-SuperAdmin-only reader sets
 * are mapped here. Screens lacking an authoritative mapping remain session-bound
 * (401 for anonymous, 200 for authenticated) until an explicit decision record
 * admits them to a subsequent wave.
 */

import type { EnterpriseAction, EnterpriseResource } from "../../core/rbac/index.js";

export interface IAScreenRuleMapping {
  screenId: string;
  action: EnterpriseAction;
  resource: EnterpriseResource;
  readerNote?: string;
}

/**
 * Wave 1 IA Screen-to-Rule Mapping
 * Exactly 41 screens across finance (26), rights (5), broadcast (7), agent (2), and content (1).
 */
export const IA_WAVE_1_SCREEN_RULES: ReadonlyMap<string, IAScreenRuleMapping> = new Map([
  // Finance (26 screens) -> read:finance
  ["FIN-001", { screenId: "FIN-001", action: "read", resource: "finance" }],
  ["FIN-004", { screenId: "FIN-004", action: "read", resource: "finance" }],
  ["FIN-005", { screenId: "FIN-005", action: "read", resource: "finance" }],
  ["FIN-008", { screenId: "FIN-008", action: "read", resource: "finance" }],
  ["FIN-009", { screenId: "FIN-009", action: "read", resource: "finance" }],
  ["FIN-011", { screenId: "FIN-011", action: "read", resource: "finance" }],
  ["FIN-012", { screenId: "FIN-012", action: "read", resource: "finance" }],
  ["FIN-013", { screenId: "FIN-013", action: "read", resource: "finance" }],
  ["FIN-014", { screenId: "FIN-014", action: "read", resource: "finance" }],
  ["FIN-015", { screenId: "FIN-015", action: "read", resource: "finance" }],
  ["FIN-016", { screenId: "FIN-016", action: "read", resource: "finance" }],
  ["FIN-017", { screenId: "FIN-017", action: "read", resource: "finance" }],
  ["FIN-018", { screenId: "FIN-018", action: "read", resource: "finance" }],
  ["FIN-019", { screenId: "FIN-019", action: "read", resource: "finance" }],
  ["FIN-020", { screenId: "FIN-020", action: "read", resource: "finance" }],
  ["FIN-022", { screenId: "FIN-022", action: "read", resource: "finance" }],
  ["FIN-023", { screenId: "FIN-023", action: "read", resource: "finance" }],
  ["FIN-024", { screenId: "FIN-024", action: "read", resource: "finance" }],
  ["FIN-025", { screenId: "FIN-025", action: "read", resource: "finance" }],
  ["FIN-026", { screenId: "FIN-026", action: "read", resource: "finance" }],
  ["FIN-027", { screenId: "FIN-027", action: "read", resource: "finance" }],
  ["FIN-028", { screenId: "FIN-028", action: "read", resource: "finance" }],
  ["FIN-029", { screenId: "FIN-029", action: "read", resource: "finance" }],
  ["FIN-030", { screenId: "FIN-030", action: "read", resource: "finance" }],
  ["FIN-032", { screenId: "FIN-032", action: "read", resource: "finance" }],
  ["FIN-035", { screenId: "FIN-035", action: "read", resource: "finance" }],

  // Rights (5 screens) -> read:rights
  ["IPR-003", { screenId: "IPR-003", action: "read", resource: "rights" }],
  ["IPR-004", { screenId: "IPR-004", action: "read", resource: "rights" }],
  ["IPR-006", { screenId: "IPR-006", action: "read", resource: "rights" }],
  ["IPR-007", { screenId: "IPR-007", action: "read", resource: "rights" }],
  ["IPR-008", { screenId: "IPR-008", action: "read", resource: "rights" }],

  // Broadcast (7 screens) -> read:broadcast
  ["BRC-006", { screenId: "BRC-006", action: "read", resource: "broadcast" }],
  ["BRC-007", { screenId: "BRC-007", action: "read", resource: "broadcast" }],
  ["BRC-008", { screenId: "BRC-008", action: "read", resource: "broadcast" }],
  ["BRC-014", { screenId: "BRC-014", action: "read", resource: "broadcast" }],
  ["BRC-015", { screenId: "BRC-015", action: "read", resource: "broadcast" }],
  ["BRC-016", { screenId: "BRC-016", action: "read", resource: "broadcast" }],
  ["BRC-019", { screenId: "BRC-019", action: "read", resource: "broadcast" }],

  // Agent / Security Audit (2 screens) -> read:agent
  ["SYS-021", { screenId: "SYS-021", action: "read", resource: "agent" }],
  ["SYS-036", { screenId: "SYS-036", action: "read", resource: "agent" }],

  // Content (1 screen) -> read:content
  ["BRD-011", { screenId: "BRD-011", action: "read", resource: "content" }],
]);

/**
 * Returns the asserted rule mapping for an IA screen if mapped in Wave 1.
 */
export function getIAScreenRequiredRule(screenId: string): IAScreenRuleMapping | undefined {
  return IA_WAVE_1_SCREEN_RULES.get(screenId);
}
