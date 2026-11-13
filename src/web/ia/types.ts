/**
 * VMN World IA R1.1 — canonical screen contract types.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 * These types describe the inventory; they do not add requirements to it.
 */

export type IAGate = "W0" | "W1" | "W2" | "W3" | "W4" | "G";

export type IAArchetype =
  | "PAGE"
  | "STATE"
  | "DIALOG"
  | "DASHBOARD"
  | "WIZARD"
  | "CONTENT_INSTANCE"
  | "TAB";

/** How a record is reached: its own URL, a host screen, or a global handler state. */
export type IARouteKind = "ROUTED" | "HOSTED" | "GLOBAL_STATE";

export interface IAScreen {
  /** Inventory ID, e.g. PUB-001. Unique across all 619 records. */
  id: string;
  journeyCode: string;
  journey: string;
  /** Step within the journey, 1-based. */
  step: number;
  /** Raw inventory type, preserved verbatim (e.g. "Edge / exception screen"). */
  type: string;
  screenName: string;
  roles: string;
  roleIds: readonly string[];
  coreUi: string;
  primaryAction: string;
  gate: IAGate;
  /** CSV route pattern. Empty string for hosted screens without a path. */
  route: string;
  routeKind: IARouteKind;
  hostScreenId: string;
  /** Resolved host path for hosted screens, derived from hostScreenId or HOSTED@ prefix. */
  hostPath: string;
  entryTrigger: string;
  archetype: IAArchetype;
  renderContract: string;
  actionClass: string;
  domainObjects: string;
  dataClass: string;
  sourceOffice: string;
  permissionContract: string;
  consequentialEffect: string;
  adverseStates: string;
  recoveryRoute: string;
  evidenceContract: string;
  a11y: string;
  acceptanceCriterion: string;
  acceptanceId: string;
  priority: string;
  releaseStatus: string;
  changeClass: string;
  sourceFamily: string;
  authority: string;
  implementationHint: string;
  screenRole: string;
}

export interface IARegistrySource {
  csvPath: string;
  sha256: string;
  rowCount: number;
  routedCount: number;
  hostedCount: number;
  journeyCount: number;
  generatedBy: string;
}
