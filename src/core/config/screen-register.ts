/**
 * Machine-Readable Screen Register Loader — TODO-GVR-02 / TODO-GVR-03
 * Serves docs/decisions/screen-register.json as a typed, validated object so
 * reconciliation counts are testable and single-sourced.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type ScreenRegisterStatus = "IMPLEMENTED" | "MOCK" | "MISSING" | "DEFERRED" | "ALIAS";

export interface ScreenRegisterEntry {
  id: string;
  name: string;
  status: ScreenRegisterStatus;
  route: string;
  evidence: string;
  /** Rule 0.4a: the screen's data dies with the process (TSK-20). */
  dataState?: "sandbox-state";
  /** `sandboxState.families[].id` values this entry's evidence anchors to. */
  sandboxFamilies?: string[];
}

export interface ScreenRegisterGroup {
  group: string;
  docSource: string;
  entries: ScreenRegisterEntry[];
}

/**
 * One row of systems-of-record.md §3.3, mirrored into the register so a screen can
 * name the process-memory store it reads (TSK-20). The parity between this block and
 * that table is asserted in tests/unit/systems-of-record.test.ts.
 */
export interface SandboxStateFamily {
  id: string;
  entity: string;
  /** `path/file.ts:NN` store citations, verbatim from §3.3. */
  stores: string[];
  /**
   * Strings an entry's `evidence` must contain for that entry to carry this family.
   * A label with no anchor behind it is not a label the register can prove.
   */
  anchors: string[];
}

export interface ScreenRegisterDocument {
  document: string;
  documentId: string;
  version: string;
  generatedAt: string;
  verifiedAt?: string;
  authority: string;
  reconciliationStatus: string;
  note: string;
  groups: ScreenRegisterGroup[];
  routeConventions: {
    note: string;
    docxToRepo: Record<string, string>;
  };
  knownConflicts: Array<{
    id: string;
    resolution: string;
    status: string;
  }>;
  sandboxState?: {
    authority: string;
    measuredAt: string;
    meaning: string;
    derivation: string;
    families: SandboxStateFamily[];
    coverage: { note: string };
    limits: string;
  };
  summary: {
    /** ENTRY tally, not a screen count — see `documentedIds`. */
    totalScreens: number;
    totalScreensSemantics?: string;
    /** Documented screen IDs once collapsed ranges are expanded (TSK-24). */
    documentedIds: number;
    documentedIdsNote?: string;
    implemented: number;
    mock: number;
    missing: number;
    deferred: number;
    alias: number;
    note?: string;
  };
}

let cached: ScreenRegisterDocument | null = null;

export function loadScreenRegister(): ScreenRegisterDocument {
  if (cached) return cached;
  const path = fileURLToPath(new URL("../../../docs/decisions/screen-register.json", import.meta.url));
  const parsed = JSON.parse(readFileSync(path, "utf-8")) as ScreenRegisterDocument;
  if (parsed.document !== "VMNL-REG-SCREENS-001") {
    throw new Error("[VMNL-REG-SCREENS] Unknown screen register document id.");
  }
  cached = parsed;
  return parsed;
}

/**
 * Recomputes the summary counts from the group entries (single source of
 * truth: the entries themselves, never hand-tallied numbers).
 *
 * TSK-24: these are ENTRY counts. Before range expansion existed, a caller that
 * read `totalScreens` believed it was reading documented screens — 60 entries
 * stand for 226 IDs. Use `computeDocumentedIdCounts` for any screen-level figure.
 */
export function computeScreenRegisterCounts(
  register: ScreenRegisterDocument
): Omit<ScreenRegisterDocument["summary"], "documentedIds" | "documentedIdsNote" | "totalScreensSemantics"> {
  const counts = { totalScreens: 0, implemented: 0, mock: 0, missing: 0, deferred: 0, alias: 0 };
  for (const group of register.groups) {
    for (const entry of group.entries) {
      counts.totalScreens += 1;
      if (entry.status === "IMPLEMENTED") counts.implemented += 1;
      else if (entry.status === "MOCK") counts.mock += 1;
      else if (entry.status === "MISSING") counts.missing += 1;
      else if (entry.status === "DEFERRED") counts.deferred += 1;
      else if (entry.status === "ALIAS") counts.alias += 1;
    }
  }
  return counts;
}

export const screenRegister: ScreenRegisterDocument = loadScreenRegister();

export interface SandboxCoverage {
  families: number;
  /** Register entries carrying `dataState: "sandbox-state"` (a tally of objects). */
  labelledEntries: number;
  /** Documented screen IDs carrying the label, after range expansion. */
  labelledIds: number;
  documentedIds: number;
  labelledImplemented: number;
  /** entry count per family id */
  byFamily: Record<string, number>;
}

/**
 * TSK-20: how much of the register is labelled `sandbox-state`, computed from the
 * entries — never tallied by hand, and never quoted in the JSON's own `coverage`
 * note (which says so for exactly this reason). A range entry such as
 * `UX-VCF-001..008` labels eight documented screens, so the entry count and the
 * screen count answer different questions and both are returned.
 */
export function computeSandboxCoverage(register: ScreenRegisterDocument = screenRegister): SandboxCoverage {
  const byFamily: Record<string, number> = {};
  let labelledEntries = 0;
  let labelledImplemented = 0;
  for (const group of register.groups) {
    for (const entry of group.entries) {
      if (entry.dataState !== "sandbox-state") continue;
      labelledEntries += 1;
      if (entry.status === "IMPLEMENTED") labelledImplemented += 1;
      for (const family of entry.sandboxFamilies ?? []) {
        byFamily[family] = (byFamily[family] ?? 0) + 1;
      }
    }
  }
  const expanded = expandScreenRegister(register);
  const labelledIds = expanded.filter((screen) => screen.dataState === "sandbox-state").length;
  return {
    families: register.sandboxState?.families.length ?? 0,
    labelledEntries,
    labelledIds,
    documentedIds: expanded.length,
    labelledImplemented,
    byFamily,
  };
}

/**
 * TSK-24 (CA-11): the register shipped as 60 entries, but 23 of them collapse an
 * ID range into one tally — `UX-PUB-001..028` counted 28 documented screens as 1.
 * That is why `computeScreenRegisterCounts` could never be a verification: its
 * "total screens" was an entry count. Expansion turns each `PREFIX-0nn..0mm` entry
 * into the discrete IDs it stands for, inheriting route/evidence/status, so the
 * documented-screen tally is arithmetic rather than a hand-written number.
 */
const RANGE_ID_RE = /^(?<prefix>.*-)(?<from>\d+)\.\.(?<to>\d+)$/;

export interface ExpandedScreenId {
  id: string;
  /** The register entry this ID was expanded from (null for a discrete entry). */
  fromEntry: string | null;
  group: string;
  status: ScreenRegisterStatus;
  route: string;
  evidence: string;
  /** Carried from the entry the ID was expanded from (TSK-20). */
  dataState?: ScreenRegisterEntry["dataState"];
  sandboxFamilies?: string[];
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export function expandScreenRegister(register: ScreenRegisterDocument = screenRegister): ExpandedScreenId[] {
  const out: ExpandedScreenId[] = [];
  for (const group of register.groups) {
    for (const entry of group.entries) {
      const range = RANGE_ID_RE.exec(entry.id);
      if (!range) {
        out.push({ ...entry, fromEntry: null, group: group.group });
        continue;
      }
      const { prefix, from, to } = range.groups as { prefix: string; from: string; to: string };
      const width = from.length;
      for (let n = Number(from); n <= Number(to); n++) {
        out.push({
          id: `${prefix}${pad(n, width)}`,
          fromEntry: entry.id,
          group: group.group,
          status: entry.status,
          route: entry.route,
          evidence: entry.evidence,
          dataState: entry.dataState,
          sandboxFamilies: entry.sandboxFamilies,
        });
      }
    }
  }
  return out;
}

/** Per-status tallies over the expanded ID set — the figure "N documented screens" must mean. */
export function computeDocumentedIdCounts(
  expanded: ExpandedScreenId[] = expandScreenRegister()
): { ids: number; entries: number; byStatus: Record<ScreenRegisterStatus, number> } {
  const byStatus: Record<ScreenRegisterStatus, number> = { IMPLEMENTED: 0, MOCK: 0, MISSING: 0, DEFERRED: 0, ALIAS: 0 };
  for (const e of expanded) byStatus[e.status] += 1;
  const entries = new Set(
    expanded.map((e) => e.fromEntry ?? e.id)
  );
  return { ids: expanded.length, entries: entries.size, byStatus };
}
