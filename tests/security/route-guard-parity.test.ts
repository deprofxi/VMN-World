/**
 * TSK-28 / TSK-29 — mutating-route ↔ guard parity contract (report.md CA-31).
 *
 * `ROUTE_GUARDS` is the central enforcement point, but a table is only a
 * contract if something proves it stays complete. Two divergent counts existed
 * (71 guards against ~106 mutating routes) with no instrument covering the gap.
 *
 * This suite reads `src/api/router.ts` as data and fails when:
 * - a mutating `/api/**` dispatch site has neither a guard entry, nor an inline
 *   `assertRoutePermission` call, nor an explicit entry in the documented
 *   allowlists below;
 * - the guard table shrinks or gains duplicates (silent guard deletion);
 * - a guard no longer corresponds to a route the router actually dispatches.
 *
 * Counts in this file come from the commands in the header of
 * docs/security/route-authorization-coverage.md, never from another document.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ROUTE_GUARDS } from "../../src/api/router.js";

const ROUTER_PATH = fileURLToPath(new URL("../../src/api/router.ts", import.meta.url));
const ROUTER_SOURCE = fs.readFileSync(ROUTER_PATH, "utf8");

const UNSAFE_METHODS = ["POST", "PATCH", "PUT", "DELETE"] as const;
type UnsafeMethod = (typeof UNSAFE_METHODS)[number];
const DISPATCH_METHOD_RE = new RegExp(`method === "(${UNSAFE_METHODS.join("|")})"`, "g");

interface MutatingSite {
  method: UnsafeMethod;
  /** Route pattern in router-source form, with parameter segments as `{param}`. */
  pattern: string;
  line: number;
  enforcedInline: boolean;
}

/**
 * Extracts every mutating dispatch site and its handler block. A site is a
 * line that tests `method === "POST|PATCH|PUT|DELETE"` together with a
 * `pathname` comparison; parameter segments become `*`.
 */
function scanMutatingSites(source: string): MutatingSite[] {
  const lines = source.split("\n");
  const sites: MutatingSite[] = [];

  const handlerBlock = (startIdx: number): string => {
    let depth = 0;
    let started = false;
    for (let i = startIdx; i < Math.min(lines.length, startIdx + 320); i++) {
      for (const ch of lines[i]) {
        if (ch === "{") {
          depth++;
          started = true;
        } else if (ch === "}") {
          depth--;
        }
      }
      if (started && depth === 0) return lines.slice(startIdx, i + 1).join("\n");
    }
    return lines.slice(startIdx, startIdx + 320).join("\n");
  };

  lines.forEach((line, i) => {
    const methods = [
      ...new Set([...line.matchAll(DISPATCH_METHOD_RE)].map((m) => m[1] as UnsafeMethod)),
    ];
    if (methods.length === 0) return;
    // Some dispatches put the pathname test on the preceding line.
    const condition = /pathname/.test(line) ? line : `${lines[i - 1] ?? ""} ${line}`;

    const literal = [...condition.matchAll(/pathname === "([^"]*)"/g)].map((m) => m[1]);
    const prefix = [...condition.matchAll(/pathname\.startsWith\("([^"]*)"\)/g)].map((m) => m[1]);
    const negated = [...condition.matchAll(/!pathname\.endsWith\("([^"]*)"\)/g)].map((m) => m[1]);
    const suffix = [...condition.matchAll(/pathname\.endsWith\("([^"]*)"\)/g)]
      .map((m) => m[1])
      .filter((s) => !negated.includes(s));

    const patterns = new Set<string>(literal);
    if (prefix.length > 0 && suffix.length > 0) {
      for (const p of prefix) for (const s of suffix) patterns.add(`${p}*${s}`);
    } else if (prefix.length > 0) {
      for (const p of prefix) patterns.add(`${p}*`);
    }
    if (patterns.size === 0) return;

    const body = handlerBlock(i);
    const enforcedInline = /assertRoutePermission\(|requireFeatureFlagAdmin\(/.test(body);
    for (const method of methods) {
      for (const pattern of patterns) {
        sites.push({
          method: method as UnsafeMethod,
          pattern,
          line: i + 1,
          enforcedInline,
        });
      }
    }
  });

  return sites;
}

/** Compiles a guard pathname (`/api/v1/cases/:id/assign`) into matcher parts. */
function guardToPattern(pathname: string): string {
  return pathname.replace(/\/:[^/]+/g, "/*");
}

/**
 * Guards whose route is dispatched inside a broader prefix handler rather than by
 * its own `if` condition, so the scanner cannot see them as sites. Enforcement is
 * still central: `COMPILED_ROUTE_GUARDS` matches the `:param` shape at request time.
 */
const GUARDS_DISPATCHED_WITHIN_BROADER_HANDLER: Record<string, string> = {
  "POST /api/v1/enquiries/*/retry-routing": "retry-routing branch of the /api/v1/enquiries collection handler",
};

/**
 * Mutating API routes that enforce authorization inside the handler instead of
 * through `ROUTE_GUARDS`. Each entry is a documentation obligation: the reason
 * must name the enforcement that actually exists in that handler body.
 */
const HANDLER_SCOPED_ROUTES: Record<string, string> = {
  "POST /api/v1/admissions/*/decision":
    "resolveSessionUser + explicit reviewer role set (SuperAdmin/AcademyDirector/ExecutiveLeader), 401/403 in-handler",
  "POST /api/v1/vtm/contracts/*/sign":
    "resolveSessionUser + signer role set, then fail-closed 503 until canonical contract evidence exists",
  "POST /api/v1/workspace/approvals/*/decide":
    "four-eyes domain recheck in decideApproval with per-category authorizedRoles and revision compare",
  "POST /api/v1/auth/invitations": "inline assertRoutePermission(create:contract)",
  "POST /api/v1/workspace/content": "inline assertRoutePermission(create:content)",
  "PUT /api/v1/workspace/content": "inline assertRoutePermission(update:content)",
  "POST /api/v1/workspace/content-editor": "inline assertRoutePermission(create:content)",
  "POST /api/v1/workspace/content-editor/update": "inline assertRoutePermission(update:content)",
  "POST /api/v1/workspace/content/*/publish": "inline assertRoutePermission(approve:content) — added under TSK-29",
  "POST /api/v1/workspace/content/*/submit-review": "inline assertRoutePermission(update:content)",
  "POST /api/v1/workspace/content/*/approve": "inline assertRoutePermission(approve:content)",
  "POST /api/v1/workspace/content/*/withdraw": "inline assertRoutePermission(update:content)",
  "POST /api/v1/workspace/content/*/request-changes": "inline assertRoutePermission(approve:content)",
  "POST /api/v1/workspace/approvals": "guard table entry (create:contract)",
  "POST /api/v1/commercial/proposals": "guard table entry (create:contract)",
  "POST /api/v1/commercial/proposals/*/accept": "inline assertRoutePermission(update:contract)",
  "POST /api/v1/client/projects/*/questions":
    "inline assertRoutePermission(create:contract) — added under TSK-29; was anonymous",
  "POST /api/v1/broadcast/asrun/exceptions/*/resolve":
    "inline assertRoutePermission(update:broadcast) — added under TSK-29; was anonymous",
  "POST /api/v1/workspace/accelerator/partners": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/community/sprints": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/vtm/cast": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/production/callsheet": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/vcf/missions": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/events/scan": "inline assertRoutePermission(execute:talent)",
  "POST /api/v1/workspace/tend/license": "inline assertRoutePermission(create:rights)",
  "POST /api/v1/workspace/headspace/documents": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/workspace/aos/killswitch": "inline assertRoutePermission(execute:agent)",
  "POST /api/v1/workspace/governance/risks": "inline assertRoutePermission(update:risk)",
  "POST /api/v1/workspace/governance/issues": "inline assertRoutePermission(update:risk)",
  "POST /api/v1/workspace/governance/issues/*/transition": "inline assertRoutePermission(update:risk)",
  "POST /api/v1/broadcast/epg/push-startimes": "inline assertRoutePermission(execute:broadcast)",
  "POST /api/v1/broadcast/asrun/reconcile": "inline assertRoutePermission(update:broadcast)",
  "POST /api/v1/hub/talent/onboard": "inline assertRoutePermission(create:talent)",
  "POST /api/v1/hub/afca/certify": "inline assertRoutePermission(create:academy)",
  "POST /api/v1/hub/afca/grades": "inline assertRoutePermission(create:academy)",
  "POST /api/v1/hub/events/verify-ticket": "inline assertRoutePermission(execute:talent)",
  "POST /api/v1/hub/events/tickets/validate": "inline assertRoutePermission(execute:talent)",
  "POST /api/v1/intelligence/aos/execute": "inline assertRoutePermission(execute:agent)",
  "POST /api/v1/intelligence/aos/killswitch": "inline assertRoutePermission(execute:agent)",
  "POST /api/v1/cases": "inline assertRoutePermission(create:case)",
  "POST /api/v1/cases/*/assign": "inline assertRoutePermission(update:case)",
  "POST /api/v1/cases/*/transition": "inline assertRoutePermission(update:case)",
  "POST /api/v1/federation/destinations": "inline assertRoutePermission(create:agent)",
  "POST /api/v1/enquiries/routing-config": "inline assertRoutePermission(update:enquiry)",
  "POST /api/v1/enquiries/routing-config/*/deactivate": "inline assertRoutePermission(update:enquiry)",
  "POST /api/v1/broadcast/versions": "inline assertRoutePermission(create:broadcast)",
  "POST /api/v1/broadcast/versions/*/ready-for-air": "inline assertRoutePermission(update:broadcast)",
  "POST /api/v1/finance/deals": "inline assertRoutePermission(create:contract)",
  "POST /api/v1/finance/payouts/batch": "inline assertRoutePermission(create:finance)",
  "POST /api/v1/finance/reconcile/bank": "inline assertRoutePermission(execute:finance)",
  "POST /api/v1/finance/payouts/*/approve": "inline assertRoutePermission(approve:finance)",
  "POST /api/v1/finance/payouts/*/nip-csv": "inline assertRoutePermission(execute:finance)",
  "POST /api/v1/finance/mt940/ingest": "inline assertRoutePermission(execute:finance)",
  "POST /api/v1/finance/deals/:dealId/recognition": "inline assertRoutePermission(update:finance)",
  "POST /api/v1/vtm/contracts/*/release-escrow": "inline assertRoutePermission(update:contract)",
};

/**
 * Mutating API routes intentionally reachable without a session. Each is a
 * public intake or a self-contained protocol endpoint; the reason names the
 * control that replaces authorization.
 */
const PUBLIC_BY_DESIGN_ROUTES: Record<string, string> = {
  "POST /api/v1/auth/login": "credential exchange, rate-limited and audit-logged",
  "POST /api/v1/auth/revoke": "acts on the bearer token presented, not on another identity",
  "POST /api/v1/auth/logout": "acts on the caller's own session",
  "POST /api/v1/enquiries": "public enquiry intake (VS-RL1-01); validated, rate-limited, PII-sealed at rest",
  "POST /api/v1/applications/draft": "public AFCA application intake; no canonical record authority",
  "POST /api/v1/applications/submit": "public AFCA application intake; rate-limited and audit-logged",
  "POST /api/v1/hub/inquiries": "public vertical intake; rate-limited, notification only",
  "POST /api/v1/webhooks/paystack": "verified by signature, not by session",
  "POST /api/v1/webhooks/flutterwave": "verified by signature, not by session",
  "POST /api/v1/quality/gates":
    "evaluated by CI/release pipeline with system identity; records the caller when one is presented (see ROUTE_GUARDS comment)",
  "POST /api/v1/workspace/cr8tech/test-all": "retired: answers 410, performs no state change",
};

function key(site: { method: string; pattern: string }): string {
  return `${site.method} ${site.pattern}`;
}

describe("TSK-29: mutating-route ↔ guard parity (CA-31)", () => {
  const sites = scanMutatingSites(ROUTER_SOURCE);
  const guardedKeys = new Set(ROUTE_GUARDS.map((g) => `${g.method} ${guardToPattern(g.pathname)}`));

  it("finds the mutating dispatch sites it claims to find", () => {
    // The scan is only trustworthy if it actually reads the router; a parser
    // regression would otherwise make every other assertion pass vacuously.
    const apiSites = sites.filter((s) => s.pattern.startsWith("/api/"));
    console.info(
      `[TSK-29] mutating dispatch sites ${sites.length} (API ${apiSites.length}) · ` +
        `guards ${ROUTE_GUARDS.length} · inline-enforced ${sites.filter((s) => s.enforcedInline).length} · ` +
        `handler-scoped documented ${Object.keys(HANDLER_SCOPED_ROUTES).length} · ` +
        `public by design ${Object.keys(PUBLIC_BY_DESIGN_ROUTES).length}`
    );
    expect(sites.length).toBeGreaterThanOrEqual(110);
    expect(apiSites.length).toBeGreaterThanOrEqual(100);
  });

  it("every mutating API route is guarded, handler-scoped, or public by design", () => {
    const unexplained = new Set<string>();
    for (const site of sites) {
      if (!site.pattern.startsWith("/api/")) continue;
      const k = key(site);
      if (guardedKeys.has(`${site.method} ${site.pattern}`)) continue;
      if (site.enforcedInline) continue;
      if (HANDLER_SCOPED_ROUTES[k] || PUBLIC_BY_DESIGN_ROUTES[k]) continue;
      unexplained.add(`${k} (router.ts:${site.line})`);
    }
    expect([...unexplained].sort(), `Mutating routes with no guard and no documented enforcement:\n${[...unexplained].sort().join("\n")}`).toEqual([]);
  });

  it("pins the guard-table size so silent guard deletion fails the build", () => {
    // Measured with: npx vitest run tests/security/route-guard-parity.test.ts
    // (the same number is recorded in docs/security/route-authorization-coverage.md).
    // 75 as of TSK-14: the review-request /resolve and /transition routes are the two
    // paths that can change a RightsRecord, so both are guarded update:rights.
    expect(ROUTE_GUARDS.length).toBe(75);
  });

  it("has no duplicate method+pathname guard entries", () => {
    const seen = new Map<string, number>();
    for (const g of ROUTE_GUARDS) {
      const k = `${g.method} ${g.pathname}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(duplicates).toEqual([]);
  });

  it("declares each guard against a route the router actually dispatches", () => {
    const siteKeys = new Set(sites.map((s) => `${s.method} ${s.pattern}`));
    const orphans = ROUTE_GUARDS.filter((g) => g.method !== "GET")
      .map((g) => `${g.method} ${guardToPattern(g.pathname)}`)
      .filter((k) => !siteKeys.has(k))
      .filter((k) => GUARDS_DISPATCHED_WITHIN_BROADER_HANDLER[k] === undefined)
      .sort();
    // The central matcher consults the table before any handler runs, so a guard
    // whose path the router never dispatches is dead configuration.
    expect(orphans, `Guard entries with no matching dispatch site:\n${orphans.join("\n")}`).toEqual([]);

    // Each exception is checked too: it must still name a real guard entry.
    const guardKeys = new Set(ROUTE_GUARDS.map((g) => `${g.method} ${guardToPattern(g.pathname)}`));
    const staleExceptions = Object.keys(GUARDS_DISPATCHED_WITHIN_BROADER_HANDLER).filter((k) => !guardKeys.has(k));
    expect(staleExceptions, `Stale dispatch exceptions:\n${staleExceptions.join("\n")}`).toEqual([]);
  });

  it("documents handler-scoped routes that really do enforce inline", () => {
    const stale: string[] = [];
    const siteKeys = new Set(sites.map((s) => `${s.method} ${s.pattern}`));
    for (const [route, reason] of Object.entries(HANDLER_SCOPED_ROUTES)) {
      if (!siteKeys.has(route)) stale.push(`${route} — documented but the router dispatches no such site`);
      if (reason.startsWith("guard table entry")) {
        if (!guardedKeys.has(route)) stale.push(`${route} — documented as guarded, absent from ROUTE_GUARDS`);
        continue;
      }
      if (!reason.includes("assertRoutePermission")) continue; // role-checked in-handler
      const match = sites.find((s) => key(s) === route);
      if (match && !match.enforcedInline) stale.push(`${route} — documented as inline-guarded, handler no longer calls assertRoutePermission`);
    }
    // A public-by-design exemption for a route that no longer exists is not a
    // documented exemption, it is a stale comment hiding whatever ships next.
    for (const route of Object.keys(PUBLIC_BY_DESIGN_ROUTES)) {
      if (!siteKeys.has(route)) stale.push(`${route} — exempted as public by design, but the router dispatches no such site`);
    }
    expect(stale.sort(), `Handler-scoped documentation drifted from the code:\n${stale.sort().join("\n")}`).toEqual([]);
  });
});
