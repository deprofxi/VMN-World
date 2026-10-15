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

// Ratchet floor — measured 2026-10-06 at 138. Only ever decrease this number.
const BUDGET = 138;

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
