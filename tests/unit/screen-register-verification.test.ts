/**
 * TSK-24 (report.md CA-11): the screen register as a verification instrument.
 *
 * CA-11's fair record was that the register is not fabricated — every cited
 * evidence path exists and spot-checked IDs really are in the cited files. Its
 * defect is that it verifies nothing: 23 of 60 entries collapse an ID range into
 * one tally (`UX-PUB-001..028` counted 28 documented screens as 1), no route
 * mount was checked, no evidence path was asserted, no provenance was recorded.
 * `computeScreenRegisterCounts` therefore tallied *entries* while callers read
 * "total screens" — which is how "60 governed screens" and "225 system screens"
 * could both be quoted about the same document.
 *
 * This suite makes the document falsifiable:
 *   1. expansion — entries → discrete documented IDs, by arithmetic not assertion;
 *   2. evidence  — every cited file must exist in this repository, and an entry
 *                  that names no file at all is reported, not counted as evidence;
 *   3. mount     — every route an entry claims IMPLEMENTED must be in the router's
 *                  own dispatch surface (extracted from the source, not guessed),
 *                  and a catch-all must not shadow it;
 *   4. provenance— DOMAIN_ENGINE / PROVISIONAL / NOT_CONNECTED / MOCK read from the
 *                  served page, else from the handler that serves it, else
 *                  NOT_VERIFIED — which is never presented as a pass;
 *   5. surfaces  — a measured count of reachable HTML, so "how many screens are
 *                  there" has a reproducible answer instead of a quoted estimate.
 *
 * Authority: tasks.md TSK-24 · Rule 0.2 · Rule 0.4 (honest statuses).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import {
  loadScreenRegister,
  expandScreenRegister,
  computeDocumentedIdCounts,
  computeScreenRegisterCounts,
  type ExpandedScreenId,
} from "../../src/core/config/screen-register.js";
import { resolveIARoute } from "../../src/web/ia/index.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ROUTER_SOURCE = fs.readFileSync(path.join(REPO_ROOT, "src/api/router.ts"), "utf8");

/** Sample values for the parameterised route segments the register declares. */
const PARAM_SAMPLES: Record<string, string> = {
  id: "X-1",
  orgId: "ORG-1",
  projectId: "PRJ-1",
  screenId: "SCR-BCST-23",
  certId: "POA-1",
};

/**
 * The four classes TSK-24 names, plus one the register needs: absence of a
 * demonstration banner is not evidence of an engine. A page that declares no
 * provenance at all is NOT_VERIFIED, and upgrading it takes work in TSK-11/TSK-17,
 * not a friendlier test (Rule 0.4: NOT_TESTED never rendered as PASS).
 */
type ProvenanceClass = "DOMAIN_ENGINE" | "PROVISIONAL" | "NOT_CONNECTED" | "MOCK" | "NOT_VERIFIED";

/** What the classification was read from, in descending order of directness. */
type ProvenanceBasis = "live probe" | "handler source" | "cited module" | "route not mounted";

interface Verification {
  entryId: string;
  group: string;
  status: string;
  ids: number;
  declaredRoutes: string[];
  mounted: string[];
  unmounted: string[];
  /** Cited evidence that resolves to a file in this repository. */
  evidenceFiles: string[];
  /** Cited evidence that names a file which does not exist. */
  missingEvidence: string[];
  /** True when the entry's `evidence` prose names no checkable file at all. */
  evidenceUncheckable: boolean;
  provenance: ProvenanceClass;
  basis: ProvenanceBasis;
  /** The concrete path that answered 200 with HTML — one reachable surface. */
  htmlSurface: string | null;
  probes: { route: string; status: number; contentType: string; marker: string }[];
}

/** Routes the router dispatches on: exact literals and prefixes, read off the source. */
const LITERAL_PATHS = new Set(
  [...ROUTER_SOURCE.matchAll(/pathname === "([^"]+)"/g)].map((m) => m[1])
);
const PREFIX_PATHS = [...ROUTER_SOURCE.matchAll(/pathname\.startsWith\("([^"]*)"\)/g)].map((m) => m[1]);

function isMounted(route: string): boolean {
  if (route === "/" || route === "") return LITERAL_PATHS.has("/");
  if (LITERAL_PATHS.has(route)) return true;
  if (PREFIX_PATHS.some((p) => route.startsWith(p))) return true;
  // A route the IA resolver owns is mounted by the router too: `dispatchIARoute`
  // runs before the page handlers and answers every registry route, so "is this
  // declared path dispatched?" must consult the resolver as well as the literal
  // `pathname ===` guards. Reading the registry — not a hand-list — keeps the
  // mount check a fact about the code the router runs.
  if (resolveIARoute(route)) return true;
  // A declared pattern like /programmes/:id mounts if the router has a matching
  // literal-with-wildcard or an explicit startsWith for its first segment.
  if (route.includes(":")) {
    const concrete = route
      .split("/")
      .map((seg) => (seg.startsWith(":") ? PARAM_SAMPLES[seg.slice(1)] ?? "X-1" : seg))
      .join("/");
    if (LITERAL_PATHS.has(concrete)) return true;
    if (PREFIX_PATHS.some((p) => concrete.startsWith(p))) return true;
    // /a/b/:id is served by a startsWith("/a/b") branch in practice.
    const parent = route.slice(0, route.lastIndexOf("/:"));
    if (parent && PREFIX_PATHS.some((p) => p === parent || p.startsWith(parent))) return true;
    return false;
  }
  if (route.endsWith("*")) return Boolean(resolveWildcard(route));
  return false;
}

/**
 * `/vtm/*` is not a route the router owns; it is shorthand for the set of literals
 * under that prefix. Resolve it so a wildcard declaration is checked against real
 * mounts instead of silently passing (or silently failing).
 */
function resolveWildcard(route: string): string | undefined {
  const base = route.slice(0, -1).replace(/\/$/, "");
  if (LITERAL_PATHS.has(base)) return base;
  return [...LITERAL_PATHS].sort().find((p) => p.startsWith(`${base}/`) || p === base);
}

/** Split a register `route` field into method + path tokens; "surface-bc desk" yields none. */
function parseRoutes(route: string): { method: string; path: string }[] {
  const out: { method: string; path: string }[] = [];
  for (const token of route.split(/[;,]/).map((t) => t.trim()).filter(Boolean)) {
    const m = /^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S*)$/.exec(token);
    if (m) {
      out.push({ method: m[1], path: m[2] });
      continue;
    }
    if (/^\//.test(token)) out.push({ method: "GET", path: token.split(/\s+/)[0] });
  }
  return out;
}

function extractEvidencePaths(evidence: string): string[] {
  return [...evidence.matchAll(/\b(?:src|docs|prisma|tests)\/[\w./-]*\w\b/g)].map((m) => m[0]);
}

/**
 * The register's `evidence` prose cites files two ways: repo-relative paths
 * (`src/web/workspace/governance-registers.ts`) and bare names
 * (`destinations.ts routing rules`). Both are checkable, so both are resolved —
 * a bare name against an index of the real tree. Anything that resolves to
 * nothing is either a broken citation or an entry that asserts something no
 * command in this repository can verify.
 */
const FILE_CITE_RE = /\b[A-Za-z][A-Za-z0-9_-]*\.(?:ts|tsx|js|mjs|cjs|json|md|sql|prisma|html|css)\b/g;

function buildFileIndex(dirs: string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const root of dirs) {
    const stack = [root];
    while (stack.length) {
      const rel = stack.pop() as string;
      let dirents: fs.Dirent[];
      try {
        dirents = fs.readdirSync(path.join(REPO_ROOT, rel), { withFileTypes: true });
      } catch {
        continue;
      }
      for (const d of dirents) {
        if (d.name === "node_modules" || d.name === "dist" || d.name.startsWith(".")) continue;
        const child = `${rel}/${d.name}`;
        if (d.isDirectory()) stack.push(child);
        else if (d.isFile()) index.set(d.name, [...(index.get(d.name) ?? []), child]);
      }
    }
  }
  return index;
}

const FILE_INDEX = buildFileIndex(["src", "docs", "prisma", "tests", "scripts"]);

/** Resolve an entry's evidence into repo-relative files that exist (or are claimed and missing). */
function resolveEvidence(evidence: string): { files: string[]; missing: string[]; uncheckable: boolean } {
  const files: string[] = [];
  const missing: string[] = [];
  const pathCites = extractEvidencePaths(evidence);
  for (const p of pathCites) {
    if (fs.existsSync(path.join(REPO_ROOT, p))) files.push(p);
    else missing.push(p);
  }
  // Scan for bare names only in the prose left after the path citations are removed,
  // otherwise `desk-census.test.ts` contributes a phantom `test.ts` citation.
  let residue = evidence;
  for (const p of pathCites) residue = residue.split(p).join(" ");
  const bare = [...new Set([...residue.matchAll(FILE_CITE_RE)].map((m) => m[0]))];
  for (const name of bare) {
    if (name.includes("/")) continue; // already handled as a path citation
    const hits = FILE_INDEX.get(name);
    if (hits?.length) files.push(...hits);
    else missing.push(name);
  }
  return { files: [...new Set(files)], missing: [...new Set(missing)], uncheckable: bare.length === 0 && files.length === 0 };
}

function concretePath(p: string): string | null {
  if (p.includes("*")) return resolveWildcard(p) ?? null;
  if (!p.includes(":")) return p;
  const concrete = p
    .split("/")
    .map((seg) => (seg.startsWith(":") ? PARAM_SAMPLES[seg.slice(1)] ?? null : seg))
    .join("/");
  return concrete.includes("null") ? null : concrete;
}

/**
 * The handler block the router runs for a given literal path: the source from the
 * `if (pathname === "<p>" …)` guard to the closing brace of that branch. Extracted
 * by brace matching on the real source, so "this page binds an engine" is a claim
 * about code that exists, not about a page that looked plausible.
 */
function handlerBlock(literalPath: string): string | null {
  const needle = `"${literalPath}"`;
  const idx = ROUTER_SOURCE.indexOf(needle);
  if (idx < 0) return null;
  const braceStart = ROUTER_SOURCE.indexOf("{", ROUTER_SOURCE.indexOf(")", idx));
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < ROUTER_SOURCE.length && i < braceStart + 8000; i++) {
    const c = ROUTER_SOURCE[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return ROUTER_SOURCE.slice(braceStart, i + 1);
    }
  }
  return ROUTER_SOURCE.slice(braceStart, braceStart + 8000);
}

/**
 * Domain state the handler reads: an engine/repository call through the request
 * context, or a module-level engine accessor. This is the positive evidence
 * TSK-24 requires before an ID may be called DOMAIN_ENGINE.
 */
const DOMAIN_STATE_RE =
  /\bcontext\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\(|\bcontext\.[a-zA-Z0-9_]+\.filter|\bget[A-Z][a-zA-Z0-9_]*Engine\b|\bgetAllActive[A-Z]\w*\(/;

/**
 * Fallback when the live page declares no provenance. Claims only what the code
 * the route actually runs states; everything else stays NOT_VERIFIED.
 */
function classifyByHandler(template: string, concrete: string): { cls: ProvenanceClass; reason: string } {
  const block = handlerBlock(template) ?? handlerBlock(concrete);
  const label = handlerBlock(template) ? template : concrete;
  if (!block) return { cls: "NOT_VERIFIED", reason: `no handler block located for ${label}` };
  if (block.includes("renderMockDataBanner")) return { cls: "MOCK", reason: `handler ${label} calls renderMockDataBanner` };
  if (DOMAIN_STATE_RE.test(block))
    return { cls: "DOMAIN_ENGINE", reason: `handler ${label} reads domain state via request context` };
  if (block.includes("PROVISIONAL")) return { cls: "PROVISIONAL", reason: `handler ${label} declares provisional state` };
  return { cls: "NOT_VERIFIED", reason: `handler ${label} binds no identifiable domain state` };
}

/**
 * Last resort when no route is mounted: only claims what a cited file itself
 * states. A route the router never dispatches is NOT_CONNECTED by definition.
 */
function classifyByCitedModule(evidence: string, mounted: string[]): { cls: ProvenanceClass; reason: string } {
  if (!mounted.length) return { cls: "NOT_CONNECTED", reason: "no mounted route declared" };
  for (const p of resolveEvidence(evidence).files) {
    const abs = path.join(REPO_ROOT, p);
    if (!fs.statSync(abs).isFile()) continue;
    const src = fs.readFileSync(abs, "utf8");
    if (src.includes("Presentation shell — no bound operational feed"))
      return { cls: "NOT_CONNECTED", reason: `cited ${p} renders the presentation shell` };
    if (src.includes("renderMockDataBanner"))
      return { cls: "MOCK", reason: `cited ${p} emits the demonstration banner` };
  }
  return { cls: "NOT_VERIFIED", reason: "route not probeable; cited module declares no provenance" };
}

/**
 * Markers the shipped renderers emit. Each is a provenance statement the product
 * itself makes: `SOURCE: …` (`renderScreenKpis`), `PROVISIONAL`, `NOT CONNECTED`,
 * the demonstration-data banner (`renderMockDataBanner`), and the TSK-23 shell
 * label. A page that matches none of them stays NOT_VERIFIED.
 */
const MARKERS: Array<[ProvenanceClass, string, string]> = [
  ["MOCK", "vmn-provenance-banner", "demonstration-data banner"],
  ["DOMAIN_ENGINE", "SOURCE:", "engine provenance badge"],
  ["PROVISIONAL", ">PROVISIONAL<", "provisional badge"],
  ["NOT_CONNECTED", ">NOT CONNECTED<", "not-connected badge"],
  ["NOT_CONNECTED", "Presentation shell — no bound operational feed", "presentation shell (TSK-23)"],
];

function classifyByHtml(html: string): { cls: ProvenanceClass; marker: string } {
  for (const [cls, needle, label] of MARKERS) {
    if (html.includes(needle)) return { cls, marker: label };
  }
  return { cls: "NOT_VERIFIED", marker: "page declares no provenance" };
}

const register = loadScreenRegister();
const expanded = expandScreenRegister(register);

// Group the expanded IDs back onto their source entry so the report is per-entry.
const byEntry = new Map<string, { group: string; ids: string[]; sample: ExpandedScreenId }>();
for (const e of expanded) {
  const key = e.fromEntry ?? e.id;
  const bucket = byEntry.get(key) ?? { group: e.group, ids: [], sample: e };
  bucket.ids.push(e.id);
  byEntry.set(key, bucket);
}

/**
 * Measured 2026-10-07: literal router paths that answered 200 text/html to a
 * SuperAdmin bearer session. Parameterised literals are excluded (no defensible
 * sample entity for every one), so this is a floor for the HTML surface, not a
 * total — and it is the figure that replaces the withdrawn "225 system screens".
 *
 * Re-measured 2026-11-16 (111 → 103): IA Phase 7 retired seven overlapping
 * legacy `pathname ===` branches to permanent redirects (`/channels`,
 * `/channels/isimbido`, `/channels/nxtr`, `/channels/orisun`, `/enquiry`,
 * `/help`, `/hub`) and `/contact` is now answered by the IA resolver rather than
 * by a literal branch, so eight literals left the probed set. Nothing was
 * un-mounted to reach the figure: the seven redirects are asserted one by one in
 * `tests/integration/ia-routing.test.ts` and the IA route set is counted by
 * `tests/unit/ia-registry.test.ts`.
 */
// 108 → 112: added /verify/afca, /verify/poa, and browser-HTML portal surfaces answering 200 text/html.
const HTML_SURFACES_PIN = 112;

let app: ApiServerInstance | undefined;
let port = 0;
let authHeader: Record<string, string> = {};

function get(p: string): Promise<{ status: number; contentType: string; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path: p, method: "GET", headers: authHeader }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () =>
        resolve({ status: res.statusCode || 0, contentType: String(res.headers["content-type"] ?? ""), body: data })
      );
    });
    req.on("error", reject);
    // 30s, not 10s: the probe is the first request a freshly booted server
    // answers and it shares the machine with the rest of the suite. At `maxWorkers:
    // 1` a full run once held `/` past a 10s bound and failed this file on load,
    // not on a register defect (re-run alone: 7/7 green). Still bounded, so a
    // genuinely hung route is reported rather than waited on indefinitely.
    req.setTimeout(30000, () => req.destroy(new Error(`probe timeout after 30000ms on ${p}`)));
    req.end();
  });
}

let results: Verification[] = [];
/** Literal router paths that answered 200 text/html to an authorised operator. */
let appHtmlSurfaces: string[] = [];
/** Paths never GET-probed: a GET here would end the session or mutate auth state. */
const UNPROBEABLE = /logout|signout|revoke|terminate|session-end/i;

describe("TSK-24 (CA-11): the screen register verifies what it claims", () => {
  beforeAll(async () => {
    app = createApiServer(0);
    await app.start();
    port = (app.server.address() as { port: number }).port;
    authHeader = {
      Authorization: `Bearer ${signSessionToken({
        userId: "usr-register",
        personId: "per-register",
        email: "register@vmnl.ng",
        roles: ["SuperAdmin"],
      }).accessToken}`,
    };

    results = [];
    for (const [entryId, bucket] of byEntry) {
      const s = bucket.sample;
      const declared = parseRoutes(s.route);
      const mounted = declared.filter((r) => isMounted(r.path)).map((r) => `${r.method} ${r.path}`);
      const unmounted = declared.filter((r) => !isMounted(r.path)).map((r) => `${r.method} ${r.path}`);
      const evidence = resolveEvidence(s.evidence);

      let provenance: ProvenanceClass = "NOT_VERIFIED";
      let basis: Verification["basis"] = "route not mounted";
      let htmlSurface: string | null = null;
      const probes: Verification["probes"] = [];

      const candidates = declared
        .filter((r) => r.method === "GET")
        .map((r) => ({ template: r.path, concrete: concretePath(r.path) }))
        .filter((c): c is { template: string; concrete: string } => c.concrete !== null && isMounted(c.concrete));
      // A `/broadcast/*` declaration denotes the 33 operational screens, which are
      // mounted dynamically as /broadcast/screens/{id} — probe one directly instead
      // of letting the wildcard resolve to an unrelated literal under /broadcast/.
      if (candidates.some((c) => c.concrete.startsWith("/broadcast/"))) {
        const first = `/broadcast/screens/${BROADCAST_SCREEN_INVENTORY[0].screenId}`;
        candidates.unshift({ template: first, concrete: first });
      }

      for (const c of candidates.slice(0, 4)) {
        const res = await get(c.concrete);
        const cls = classifyByHtml(res.body);
        probes.push({ route: c.concrete, status: res.status, contentType: res.contentType, marker: cls.marker });
        if (!htmlSurface && res.status === 200 && res.contentType.includes("text/html")) htmlSurface = c.concrete;
        if (cls.cls !== "NOT_VERIFIED") {
          provenance = cls.cls;
          basis = "live probe";
          break;
        }
      }

      // The page itself declared nothing: fall back to the code the route runs, then
      // to the cited module. Both fallbacks must state their reason, never a guess.
      if (basis === "route not mounted" && candidates.length) {
        const handler = classifyByHandler(candidates[0].template, candidates[0].concrete);
        provenance = handler.cls;
        basis = "handler source";
        probes.push({ route: `handler ${candidates[0].template}`, status: 0, contentType: "—", marker: handler.reason });
      } else if (basis === "route not mounted") {
        const cls = classifyByCitedModule(s.evidence, mounted);
        provenance = cls.cls;
        basis = cls.reason === "no mounted route declared" ? "route not mounted" : "cited module";
        probes.push({ route: "—", status: 0, contentType: "—", marker: cls.reason });
      }

      results.push({
        entryId,
        group: bucket.group,
        status: s.status,
        ids: bucket.ids.length,
        declaredRoutes: declared.map((r) => `${r.method} ${r.path}`),
        mounted,
        unmounted,
        evidenceFiles: evidence.files,
        missingEvidence: evidence.missing,
        evidenceUncheckable: evidence.uncheckable,
        provenance,
        basis,
        htmlSurface,
        probes,
      });
    }

    const counts = computeDocumentedIdCounts(expanded);
    // Whole-repository reading of "reachable HTML surface": every literal path the
    // router dispatches on, probed once as an authorised operator. Parameterised
    // literals are skipped (no defensible sample value for every entity), which is
    // why this is a floor, not a total.
    const html: string[] = [];
    for (const p of [...LITERAL_PATHS].sort()) {
      if (UNPROBEABLE.test(p)) continue;
      const res = await get(p);
      if (res.status === 200 && res.contentType.includes("text/html")) html.push(p);
    }
    appHtmlSurfaces = html;

    const surfaces = [...new Set(results.map((r) => r.htmlSurface).filter((p): p is string => Boolean(p)))];
    const prov: Record<string, number> = {};
    for (const r of results) prov[r.provenance] = (prov[r.provenance] ?? 0) + r.ids;
    console.log(
      `\n[TSK-24] register verification — entries: ${counts.entries} · documented IDs: ${counts.ids} · ` +
        `router dispatch surface: ${LITERAL_PATHS.size} literals + ${PREFIX_PATHS.length} prefixes`
    );
    console.log(`[TSK-24] provenance by documented ID: ${JSON.stringify(prov)}`);
    console.log(
      `[TSK-24] reachable HTML surfaces (distinct register-declared paths answered 200 text/html): ${surfaces.length}`
    );
    console.log(
      `[TSK-24] application-wide literal-path HTML surfaces: ${appHtmlSurfaces.length} — ${appHtmlSurfaces.join(",")}`
    );
    console.log(
      `[TSK-24] entries with an unmounted declared route: ${results.filter((r) => r.unmounted.length).length}` +
        ` · entries claiming IMPLEMENTED with no mounted route: ` +
        `${results.filter((r) => r.status === "IMPLEMENTED" && !r.mounted.length).length}` +
        ` · entries whose evidence names no checkable file: ${results.filter((r) => r.evidenceUncheckable).length}` +
        ` · entries with a broken evidence citation: ${results.filter((r) => r.missingEvidence.length).length}`
    );
    console.log(`[TSK-24] per-entry table (entry | ids | mounted/declared | provenance | basis | first probe):`);
    for (const r of results) {
      const firstProbe = r.probes[0];
      console.log(
        `[TSK-24] | ${r.entryId} | ${r.ids} | ${r.mounted.length}/${r.declaredRoutes.length} | ${r.provenance} | ${r.basis} | ` +
          `${firstProbe ? `${firstProbe.route} ${firstProbe.status}` : ""} ${firstProbe?.marker ?? ""} | ` +
          `evidence ${r.evidenceFiles.length}/${r.evidenceFiles.length + r.missingEvidence.length}${r.missingEvidence.length ? ` MISSING:${r.missingEvidence.join(",")}` : ""}`
      );
    }
  }, 180000);

  afterAll(async () => {
    await app?.stop();
  }, 30000);

  it("expands the collapsed ranges so a screen count means screens, not entries", () => {
    const counts = computeDocumentedIdCounts(expanded);
    expect(counts.entries).toBe(60);
    // 60 entries stand for 226 documented IDs — the arithmetic behind the old
    // "225 system screens" figure (226 including the single ALIAS entry).
    expect(counts.ids).toBe(226);
    expect(expanded.filter((e) => e.fromEntry === "UX-PUB-001..028")).toHaveLength(28);
    expect(expanded.map((e) => e.id)).toContain("UX-PUB-014");
    expect(expanded.map((e) => e.id)).not.toContain("UX-PUB-029");
    // The entry-level tally the register still carries is unchanged and consistent.
    const entryCounts = computeScreenRegisterCounts(register);
    expect(entryCounts.totalScreens).toBe(register.summary.totalScreens);
    expect(entryCounts.implemented).toBe(register.summary.implemented);
  });

  it("every cited evidence file exists", () => {
    const bad = results
      .filter((r) => r.missingEvidence.length)
      .map((r) => `${r.entryId} → ${r.missingEvidence.join(", ")}`);
    expect(bad, `evidence citations that name no file in this repository: ${bad.join("; ")}`).toEqual([]);

    // An entry whose prose names no file cannot be verified by any command, so it
    // must be called out rather than counted as evidence. Only the ALIAS entry is
    // exempt, because it is a cross-reference inside the register by design.
    const uncheckable = results.filter((r) => r.evidenceUncheckable).map((r) => r.entryId);
    expect(uncheckable.sort(), `entries citing no checkable file: ${uncheckable.join(", ")}`).toEqual(["UX-VTM-010"]);
  });

  it("every route an entry claims IMPLEMENTED is actually mounted", () => {
    const unmountedImpl = results
      .filter((r) => r.status === "IMPLEMENTED" && r.declaredRoutes.length > 0 && r.unmounted.length === r.declaredRoutes.length)
      .map((r) => `${r.entryId} (${r.declaredRoutes.join(", ")})`);
    expect(unmountedImpl, `IMPLEMENTED entries whose routes are not mounted: ${unmountedImpl.join("; ")}`).toEqual([]);

    // Entries that declare no mountable path at all (e.g. "surface-bc desk") must not
    // be presented as implemented surfaces.
    const noRouteImpl = results
      .filter((r) => r.status === "IMPLEMENTED" && r.declaredRoutes.length === 0)
      .map((r) => r.entryId);
    expect(noRouteImpl, `IMPLEMENTED entries declaring no route: ${noRouteImpl.join(", ")}`).toEqual([]);
    const mockNoRoute = results.filter((r) => r.status === "MOCK" && r.declaredRoutes.length === 0);
    expect(mockNoRoute.length).toBeGreaterThan(0);
  });

  it("assigns a provenance class to every documented ID, and never upgrades an unproven page", () => {
    expect(results.length).toBe(60);
    const classes: ProvenanceClass[] = ["DOMAIN_ENGINE", "PROVISIONAL", "NOT_CONNECTED", "MOCK", "NOT_VERIFIED"];
    expect(results.every((r) => classes.includes(r.provenance))).toBe(true);

    const idsByClass = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.provenance] = (acc[r.provenance] ?? 0) + r.ids;
      return acc;
    }, {});
    // Measured 2026-10-07. Pinned so that "everything is engine-backed" has to move
    // this number through a test, and NOT_VERIFIED can only shrink by shipping
    // provenance into the pages themselves (TSK-11/TSK-17), never by editing a
    // classifier (Rule 0.4: an unproven page is never reported as a proven one).
    expect(idsByClass).toEqual({ DOMAIN_ENGINE: 75, NOT_CONNECTED: 4, NOT_VERIFIED: 147 });

    // Every DOMAIN_ENGINE claim must say where it came from: a marker in the served
    // page, or domain state read by the handler that serves it.
    const unproven = results
      .filter((r) => r.provenance === "DOMAIN_ENGINE" && !["live probe", "handler source"].includes(r.basis))
      .map((r) => r.entryId);
    expect(unproven, `DOMAIN_ENGINE without probe or handler evidence: ${unproven.join(", ")}`).toEqual([]);

    // The register's own documented-ID tally must equal the expansion, so the JSON
    // cannot drift from what the entries say.
    const counts = computeDocumentedIdCounts(expanded);
    expect(register.summary.documentedIds).toBe(counts.ids);
    expect(register.summary.totalScreens).toBe(counts.entries);
  });

  it("counts reachable HTML surfaces instead of quoting an unmeasured screen total", () => {
    const surfaces = [...new Set(results.map((r) => r.htmlSurface).filter((p): p is string => Boolean(p)))].sort();
    // Measured 2026-10-07: register-declared paths that answered 200 text/html to an
    // authorised operator. The withdrawn "225 system screens" figure was 60 entries
    // mis-tallied as screens; the reachable surface is an order of magnitude smaller.
    expect(surfaces.length).toBe(40);
    expect(surfaces).toContain("/workspace/my-work");
    expect(surfaces).toContain("/workspace/notifications");
    expect(surfaces).toContain("/workspace/governance/records");
    console.log(`[TSK-24] reachable HTML surfaces: ${surfaces.join(", ")}`);

    // The register's routes are coarse — 226 documented IDs collapse onto these 40
    // paths — so the whole-repository figure is measured separately below rather
    // than assumed from either number.
    expect(appHtmlSurfaces.length).toBe(HTML_SURFACES_PIN);
    console.log(
      `[TSK-24] application-wide HTML surfaces (literal router paths answering 200 text/html to SuperAdmin): ` +
        `${appHtmlSurfaces.length} of ${LITERAL_PATHS.size} literals probed`
    );
  });

  it("does not let the /workspace catch-all shadow a registered surface", async () => {
    // Measured 2026-10-07: the unmatched-/workspace 404 shell used to sit ahead of
    // every specific GET handler, so these documented screens answered 404 no matter
    // what their own handler did. A catch-all belongs at the end of the chain.
    const revived = [
      "/workspace/my-work",
      "/workspace/search",
      "/workspace/notifications",
      "/workspace/governance/records",
      "/workspace/cases/privacy",
      "/workspace/cases/security",
    ];
    for (const p of revived) {
      const res = await get(p);
      expect(res.status, `${p} answered ${res.status}, not 200`).toBe(200);
      expect(res.contentType).toContain("text/html");
    }
    // The catch-all itself still behaves: an unregistered desk path is a truthful 404.
    const unknown = await get("/workspace/no-such-desk");
    expect(unknown.status).toBe(404);
  });

  it("does not let an entry's provenance contradict its declared status", () => {
    // A MOCK entry must carry the demonstration-data banner, and nothing classified
    // DOMAIN_ENGINE from a live probe may be labelled MOCK in the register.
    const mockWithoutBanner = results
      .filter((r) => r.status === "MOCK" && r.basis === "live probe" && r.provenance !== "MOCK")
      .map((r) => `${r.entryId} probed ${r.probes[0]?.route} → ${r.provenance}`);
    expect(mockWithoutBanner, `MOCK entries whose page carries no demonstration banner: ${mockWithoutBanner.join("; ")}`).toEqual([]);

    const implButShell = results
      .filter((r) => r.status === "IMPLEMENTED" && r.provenance === "NOT_CONNECTED" && r.basis === "live probe")
      .map((r) => `${r.entryId} → ${r.probes[0]?.route}`);
    expect(implButShell, `IMPLEMENTED entries that serve a shell: ${implButShell.join("; ")}`).toEqual([]);
  });
});
