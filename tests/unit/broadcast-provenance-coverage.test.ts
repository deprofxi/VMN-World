/**
 * TSK-25 (report.md §6, the item the audit left UNCONFIRMED): the real
 * provenance-banner coverage figure for the broadcast screens.
 *
 * The claim under test was "only 3 of 33 broadcast screens emit the mock-data
 * provenance banner". The audit could not establish it and said so: the banner
 * has one call site (`src/web/broadcast/index.ts:1163`) inside the *shared*
 * per-screen template, and six screens substitute a bespoke domain panel — so
 * the open question was whether those six bypass the shared call.
 *
 * This suite answers it by rendering, not by reading: it walks
 * `BROADCAST_SCREEN_INVENTORY`, serves every screen through
 * `renderBroadcastScreenHtml` for an authorised role, and counts the banner
 * marker in the returned bytes. Measured 2026-10-11: the banner is on **33 of
 * 33** screens including all six bespoke panels, so "3 of 33" was wrong — and it
 * was wrong in the direction that hid the real figure, which was that **0 of 33**
 * served screens carried an engine-sourced KPI strip, because the honest
 * provenance layer (`getScreenData` / `renderScreenKpis`) had no production
 * caller. TSK-11 later put that layer on the render path, so this file now pins
 * both halves of the same census: the per-screen `kpis` literal table is gone
 * (0 fabricated values), every screen serves a provenance-badged strip, and every
 * screen still shows at least one NOT_CONNECTED / PROVISIONAL badge — which is
 * what gates the screen register leaving `MOCK`.
 *
 * Scope of that figure: it is measured at the *renderer*, with no engine
 * snapshot argument. The router now injects the two projections its process can
 * honestly make (billing totals, sponsorship audit — TSK-11 box 6), so a served
 * desk can read better than this census while the as-run and playout panels stay
 * unsupplied. The served half is measured over HTTP in
 * `tests/unit/broadcast-screens.test.ts`; this file must not be read as claiming
 * the renderer's empty-snapshot numbers are what an operator sees.
 *
 * Authority: tasks.md TSK-25 · Rule 0.2 (evidence before claims) · Rule 0.4.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import {
  renderBroadcastScreenHtml,
  isRoleAuthorizedForScreen,
} from "../../src/web/broadcast/index.js";
import {
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
} from "../../src/web/public/screens-view.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RENDERER = "src/web/broadcast/index.ts";
const BANNER_MARKER = "vmn-provenance-banner";
/** A role the renderer's own authorization rule admits to every screen. */
const SUPERVISOR_ROLE = "BroadcastDirector";

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

/**
 * The bespoke panel branches, extracted from the dispatcher rather than
 * hard-coded: `screenId === "SCR-BCST-nn"` followed by a `render…Html()` call
 * that is not the shared table branch. A seventh branch is measured, not missed.
 */
function bespokePanelScreens(): string[] {
  const src = read(RENDERER);
  const ids: string[] = [];
  for (const match of src.matchAll(/screen\.screenId === "(SCR-BCST-\d+)"\)\s*\{\s*\n\s*panelContent = (render\w+Html)\(/g)) {
    ids.push(`${match[1]} via ${match[2]}`);
  }
  return ids;
}

/**
 * The per-screen label table (`SCREEN_DECISION_TEXT`) must carry decision text and
 * an action label and nothing else — the fabricated `kpis` literals it used to hold
 * are deleted (TSK-11 box 1/7), so a reintroduced value table fails here.
 */
function fabricatedKpiTableEntries(): string[] {
  const src = read(RENDERER);
  const table = /const SCREEN_DECISION_TEXT[^=]*=\s*\{([\s\S]*?)\n\};/.exec(src);
  expect(table, "the SCREEN_DECISION_TEXT label table must be findable in the renderer").toBeTruthy();
  const body = (table as RegExpExecArray)[1];
  return [...body.matchAll(/kpis\s*:/g)].map(() => "kpis entry");
}

function renderAll(): Array<{ screenId: string; html: string }> {
  return BROADCAST_SCREEN_INVENTORY.map((screen) => ({
    screenId: screen.screenId,
    html: renderBroadcastScreenHtml(screen, {}, SUPERVISOR_ROLE),
  }));
}

describe("TSK-25: provenance-banner coverage, measured by rendering", () => {
  const rendered = renderAll();
  const withBanner = rendered.filter((r) => r.html.includes(BANNER_MARKER));
  const without = rendered.filter((r) => !r.html.includes(BANNER_MARKER)).map((r) => r.screenId);
  const bespoke = bespokePanelScreens();
  const kpiTable = fabricatedKpiTableEntries();
  const strips = rendered.filter((r) => r.html.includes("vmn-kpi-strip"));

  console.log(
    `[TSK-25] screens ${rendered.length} · banner ${withBanner.length} · without ${without.length}` +
      ` · bespoke panels ${bespoke.length} (${bespoke.join(", ")})` +
      ` · KPI strips ${strips.length} · fabricated kpis left in the label table ${kpiTable.length}`
  );

  it("renders the provenance banner on every screen that still has unsourced content, including the bespoke panels", () => {
    expect(rendered.length, "the inventory the figure is measured over").toBe(33);
    // The audit's open question, answered: the banner sits in the shared outer
    // template, so the six bespoke panels substitute their *panel* and still
    // carry the banner. "3 of 33" was wrong in the direction of understating it.
    expect(without, `screens served without the banner: ${without.join(", ")}`).toEqual([]);
    expect(withBanner.length).toBe(rendered.length);
    expect(bespoke.length, "the six bespoke branches are the ones the claim suspected").toBe(6);
  });

  it("keeps the banner on the state variants that bypass the domain panel entirely", () => {
    // empty/error/loading replace panelContent, so a future refactor that moves
    // the banner inside the default branch would silently drop it here.
    for (const state of ["empty", "error", "loading"]) {
      const missing = BROADCAST_SCREEN_INVENTORY.filter(
        (s) => !renderBroadcastScreenHtml(s, { state }, SUPERVISOR_ROLE).includes(BANNER_MARKER)
      ).map((s) => s.screenId);
      expect(missing, `state=${state} screens served without the banner`).toEqual([]);
    }
  });

  it("refuses an unauthorised role rather than banner-ing its way past the guard", () => {
    // The banner is a provenance label, never a substitute for authorization:
    // an anonymous caller must get the 403 render, which carries no KPI block
    // at all — measured here so "all 33 screens are labelled" cannot be read as
    // "all 33 screens are publicly served".
    const anonymous = renderBroadcastScreenHtml(BROADCAST_SCREEN_INVENTORY[0], {}, undefined);
    expect(anonymous).toContain("403 Access Denied");
    expect(anonymous).not.toContain(BANNER_MARKER);
    expect(isRoleAuthorizedForScreen(undefined, BROADCAST_SCREEN_INVENTORY[0])).toBe(false);
  });

  it("measures the census the \"3/33\" claim was standing in for, after the TSK-11 rewiring", () => {
    // Two figures, both measured over the same 33 renders:
    // (a) fabricated KPI literals left in the per-screen label table — zero since
    //     TSK-11 deleted them; the table carries a decision line and an action label;
    // (b) screens serving the provenance-badged KPI strip. After TSK-11 that is all
    //     of them, and the strip's badges say DOMAIN_ENGINE or NOT_CONNECTED — the
    //     strip is never fed by a per-screen literal again.
    expect(kpiTable, `kpis entries left in SCREEN_DECISION_TEXT: ${kpiTable.length}`).toEqual([]);
    expect(strips.length, "screens serving a provenance-badged KPI strip").toBe(33);
    // And the honest half: with no engine snapshot supplied to the *renderer*
    // (this file never injects one — the router's own projections are measured
    // over HTTP in broadcast-screens.test.ts), every screen still shows at least
    // one unsourced badge. Box 6 of TSK-11 (the screen register leaving MOCK) is
    // gated on this figure reaching 0 at the route, not on prose.
    const stillUnsourced = rendered.filter((r) => /(NOT CONNECTED|PROVISIONAL)/.test(r.html)).map((r) => r.screenId);
    console.log(`[TSK-25] screens still showing an unsourced badge: ${stillUnsourced.length}/33`);
    expect(stillUnsourced.length, "screens with at least one NOT_CONNECTED / PROVISIONAL badge").toBe(33);
    // The other half of the same census: screens whose strip carries a real
    // DOMAIN_ENGINE `SOURCE:` badge. Today the channel registry and the schedule
    // store are read live by the renderer itself, so the figure is above zero;
    // TSK-11 box 6 and the screen register leaving MOCK are gated on this reaching
    // 33 while the unsourced count above reaches 0 — for the *served* page, which
    // is why the route-level injection is measured separately, not claimed here.
    const engineSourced = rendered.filter((r) => r.html.includes("SOURCE:")).map((r) => r.screenId);
    console.log(`[TSK-25] screens serving a DOMAIN_ENGINE SOURCE: badge: ${engineSourced.length}/33 (${engineSourced.join(", ")})`);
    expect(engineSourced.length, "screens reading at least one live domain source").toBeGreaterThan(0);
  });

  it("pins the wiring: the shared renderer is the provenance service's production caller", () => {
    // This was measured the other way round before TSK-11 — the honest layer
    // existed with zero production callers, which is how 33 labelled screens
    // could still serve no engine data. The guard now fails if the render path
    // loses the call (the census reverts to literals) or if a second caller
    // starts fabricating around it.
    const src = read(RENDERER);
    expect(src).toMatch(/getScreenData\(screen\.screenId, buildScreenDataContext\(engines\)\)/);
    expect(src).toMatch(/renderScreenKpis\(\s*screenData, esc\s*\)/);
    expect(src).toMatch(/import \{[\s\S]*getScreenData[\s\S]*\} from "\.\.\/\.\.\/modules\/broadcast\/screens\/data\.js"/);
  });
});


describe("TSK-25: the inventory pages publish the measured status, not a readiness claim", () => {
  const catalog = renderScreensCatalogHtml();
  const detail = renderScreenDetailHtml(BROADCAST_SCREEN_INVENTORY[0].screenId);

  // The catalog used to render a "33 of 33 Screens Ready" badge and the spec page
  // used to render a §46 "Verified" badge, four Gate-cleared badges and a
  // tri-party sign-off sentence — while the closure record for those same screens
  // reads OPEN. The banner census makes "ready" unsupportable on its own terms:
  // 33 of 33 surfaces are labelled demonstration data and 0 serve engine data.
  it("serves no fabricated readiness or gate-clearance claim on the inventory surfaces", () => {
    for (const html of [catalog, detail]) {
      expect(html).not.toContain("Screens Ready");
      expect(html).not.toContain("(§46) Verified");
      expect(html).not.toContain("validated under tri-party sign-off");
      expect(html).not.toContain("Gate 3 (Transmission Authorization)");
      expect(html).not.toContain("Audit & Quality Gate Clearance");
    }
    expect(catalog).toContain("0 fully engine-sourced");
    expect(detail).toContain("DG-RL1-06");
    expect(detail).toContain("OPEN");
    expect(detail).toContain("NOT_RECORDED");
  });

  it("does not print the withdrawn S2 tier as a live operating stat", () => {
    expect(catalog).not.toContain("<span class=\"stat-val\">S2</span>");
    expect(catalog).toContain("S2 tier claim withdrawn");
  });
});

describe("TSK-11: no fabricated broadcast value survives the rewiring", () => {
  const renders = BROADCAST_SCREEN_INVENTORY.flatMap((screen) =>
    [undefined, "empty", "error", "loading"].map((state) => ({
      where: `${screen.screenId}${state ? `?state=${state}` : ""}`,
      html: renderBroadcastScreenHtml(screen, state ? { state } : {}, SUPERVISOR_ROLE),
    }))
  );

  /**
   * Every literal below was served to an operator as an operational fact. They
   * are enumerated as data so a reintroduction anywhere in the render path fails
   * with the offending screen named, and so the list itself is auditable.
   */
  const fabricated = [
    "11,554 MHz",
    "0x1021",
    "0x1022",
    "Eutelsat 16A",
    "Channel 142",
    "Dedicated DVB-S2",
    "api.startimes.com",
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "Carriage Uptime",
    "99.98%",
    "Daily Yield",
    "19,240,000",
    "18.4M",
    "19.2M",
    "98.2%",
    "94.2%",
    "SLA Compliance",
    "TRANSMITTING ON AIR",
    "Push EPG to StarTimes",
    "Gate BG6 Cleared",
    "Zenith Bank Plc",
    "Dangote Cement",
    "Afro-Urban Master Release 2026",
  ];

  for (const literal of fabricated) {
    it(`never serves ${literal} from any screen or state`, () => {
      const hits = renders.filter((r) => r.html.includes(literal)).map((r) => r.where);
      expect(hits, `served by: ${hits.join(", ")}`).toEqual([]);
    });
  }

  it("keeps the fabricated KPI table deleted at the source, not just the render", () => {
    const src = read(RENDERER);
    expect(src).not.toMatch(/^\s*kpis: \[/m);
    expect(src).not.toContain("SCREEN_DECISIONS");
    expect(src).toContain("SCREEN_DECISION_TEXT");
  });
});
