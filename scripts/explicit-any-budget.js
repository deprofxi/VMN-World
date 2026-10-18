#!/usr/bin/env node
/**
 * AUD-12/AUD-18: explicit-`any` ratchet gate.
 *
 * Counts remaining `any` annotations in src/** and fails when the count grows
 * beyond the recorded budget. Re-enablement of `@typescript-eslint/no-explicit-any`
 * is deliberately sequenced as a burn-down; until the budget reaches zero this
 * gate guarantees the debt cannot silently grow. Ratchet the BUDGET downward
 * as annotations are removed — never upward.
 */
import { execSync } from "node:child_process";

// Ratchet floor. Only ever decrease this number.
//   2026-10-06: measured 138 (AUD-12/AUD-18 baseline).
//   2026-10-17 (PR-27): measured 135. The release-gate commands in
//   `src/cli/index.ts` were typed — a `ManifestJson` boundary interface plus
//   `err instanceof Error` narrowing — instead of annotated `any`, so the four
//   annotations that block carried are gone and the floor moves with them.
//   2026-10-18 (PR-27 increment, plan phase 4.2): measured 108. The 28 removed
//   annotations were `catch (err: any)` in the four write-behind repositories
//   (26 sites — `handleRepoError` already takes `err: unknown`, so the
//   annotation was noise) and the two notification provider catches (typed
//   with `err instanceof Error` narrowing instead). The remainder is dominated
//   by `src/api/router.ts` (73) and `src/modules/hub/enquiry/index.ts` (11),
//   which move with the TSK-54/55/56 extraction, not with spot edits.
//   The audit asked for the budget to ratchet down in fixed increments rather
//   than sit at its ceiling: this is the next such step, recorded here because
//   the number is only meaningful next to the measurement it came from.
const BUDGET = 108;

let count = 0;
try {
  const out = execSync(
    `grep -rEn ':\\s*any\\b|<any>|as any\\b' src --include="*.ts" | wc -l`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  );
  count = parseInt(out.trim(), 10) || 0;
} catch {
  // grep exits 1 on zero matches — that is the target state.
  count = 0;
}

console.log(`[any-budget] explicit-any occurrences in src: ${count} (budget ${BUDGET})`);
if (count > BUDGET) {
  console.error(`[any-budget] FAIL: ${count} exceeds the budget of ${BUDGET}.`);
  console.error("[any-budget] Remove existing annotations (never raise the budget) before adding new ones.");
  process.exit(1);
}
console.log("[any-budget] OK.");
