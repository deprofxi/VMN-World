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
}

export interface ScreenRegisterGroup {
  group: string;
  docSource: string;
  entries: ScreenRegisterEntry[];
}

export interface ScreenRegisterDocument {
  document: string;
  documentId: string;
  version: string;
  authority: string;
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
  summary: {
    totalScreens: number;
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
 */
export function computeScreenRegisterCounts(register: ScreenRegisterDocument): ScreenRegisterDocument["summary"] {
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
