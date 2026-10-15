import fs from "node:fs";

// Rule 0.2: after re-pinning, re-open every published file:line and check the
// router.ts line it now names still contains the symbol the sentence describes.
const DOCS = [
  "tasks.md",
  "docs/handoffs/LATEST.md",
  "docs/security/route-authorization-coverage.md",
  "docs/domain/canonical-model.md",
  "docs/domain/systems-of-record.md",
  "docs/domain/data-dictionary.md",
  "docs/audit/todo-remediation-evidence.md",
  "docs/audit/evidence/tsk11-served-screen-engine-snapshot-2026-10-12/README.md",
];

// pin -> token that must appear on that line of src/api/router.ts
const EXPECT = new Map([
  ["573", "sendJson"],
  ["580", "flushDurableJournal"],
  ["709", "function sessionTokenFrom"],
  ["719", "resolveSessionUser"],
  ["733", "test-user-id"],
  ["769", "canPerform(user, action, resource)"],
  ["789", "ROUTE_GUARDS"],
  ["933", "WORKSPACE_HTML_GUARDS"],
  ["979", "getClientOrgRelationship"],
  ["1148", "primeSessionRevocation"],
  ["1207", "ADMIN_ALIASES"],
  ["1464", "revokeToken(token)"],
  ["1467", "revokeSessionById"],
  ["2660", "/assets/styles.css"],
  ["2973", "/broadcast/dashboard"],
  ["3028", "/broadcast/asrun/exceptions"],
  ["3512", "matchBroadcastScreen"],
  ["3553", "buildScreenEngineSnapshot(context)"],
  ["3596", "kvHealthy"],
  ["3608", "isReady"],
  ["4154", "sendJson(res, 503"],
  ["4156", "CANONICAL_CONTRACT_WORKFLOW_UNAVAILABLE"],
  ["4521", "context.ledgerService"],
  ["6065", "/api/v1/broadcast/rights/validate"],
  ["6973", "azeeboLinks.isConfigured"],
  ["7235", "setRoutingRule"],
  ["7357", "settlements: []"],
  ["7358", "evidence: []"],
  ["7491", "/api/v1/finance/deals"],
  ["7876", '"paystack"'],
  ["7900", 'confirmProviderEventIngested("paystack"'],
  ["7968", '"flutterwave"'],
  ["7992", 'confirmProviderEventIngested("flutterwave"'],
  ["8093", 'canPerform(user, "create", "content")'],
  ["406", "buildScreenEngineSnapshot"],
]);

const src = fs.readFileSync("src/api/router.ts", "utf8").split("\n");
let bad = 0;
let checked = 0;
const unmapped = new Set();

for (const doc of DOCS) {
  const text = fs.readFileSync(doc, "utf8");
  const lines = text.split("\n");
  lines.forEach((lineText, i) => {
    for (const m of lineText.matchAll(/router\.ts:(\d+)/g)) {
      const num = m[1];
      if (!EXPECT.has(num)) {
        unmapped.add(`${doc}:${i + 1} -> router.ts:${num}`);
        continue;
      }
      checked += 1;
      const actual = src[Number(num) - 1] ?? "";
      if (!actual.includes(EXPECT.get(num))) {
        console.error(
          `BAD ${doc}:${i + 1} -> router.ts:${num} expected "${EXPECT.get(num)}"\n    actual: ${actual.trim().slice(0, 120)}`
        );
        bad += 1;
      }
    }
  });
}

console.log(`checked ${checked} mapped pins, ${bad} mismatched`);
console.log("unmapped pins (hand-check these; historical by design unless noted):");
console.log(`  ${[...unmapped].join("\n  ") || "(none)"}`);
process.exit(bad === 0 ? 0 : 1);
