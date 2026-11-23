/**
 * DEBT-009 triage: the sites that carry externally-sourced strings.
 *
 * The census in `tests/unit/html-escape-census.test.ts` counts *bare*
 * interpolations into markup; it cannot tell an internal constant from a value
 * that arrived in a request. This file settles that question for the sites the
 * triage classified as external, by handing each renderer a hostile payload and
 * asserting it never survives as markup.
 *
 * The payloads are the two shapes that matter: a tag break (`<script>`) and an
 * attribute break (`" onmouseover="`). Each case asserts both halves — the raw
 * form is absent *and* the escaped form is present. A negative-only assertion
 * would also pass a renderer that silently drops the record, which is a
 * different defect.
 *
 * Over HTTP the same question is asked in
 * `tests/integration/reflected-input-escape.test.ts`, because there the
 * interesting part is whether the path/query value reaches the renderer at all.
 */

import { describe, expect, it } from "vitest";
import { renderPublicProgrammeDetailHtml } from "../../src/web/public/surface-a.js";
import { renderScreenDetailHtml, renderScreensCatalogHtml } from "../../src/web/public/screens-view.js";
import { renderWorkspaceDeskHtml } from "../../src/web/workspace/surface-bc.js";
import { renderProjectionTable } from "../../src/web/workspace/governance-registers.js";
import { renderVtmTermsReviewHtml, type MockVtmContract } from "../../src/web/portal/vtm-portal.js";
import { renderNowNextWidgetHtml, type NowAndNextView } from "../../src/web/public/schedule-presentation.js";
import {
  parsePrototypeViewOptions,
  renderPrototypesViewerHtml,
  type PrototypeDevice,
} from "../../src/web/public/prototypes.js";
import { renderBroadcastScreenHtml } from "../../src/web/broadcast/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../../src/modules/broadcast/screens/index.js";
import { renderMasterLayout } from "../../src/web/public/dashboard.js";
import {
  renderMyWorkHtml,
  renderNotificationsHtml,
  renderSearchResultsHtml,
} from "../../src/web/workspace/work-hub.js";
import type { WorkTask } from "../../src/core/work/index.js";

/** A tag break. */
const TAG = `"><script>alert(1)</script>`;
/** An attribute break — the shape a `href`, `title` or `class` sink needs. */
const ATTR = `" onmouseover="alert(1)`;
/** What `escapeHtml` produces for {@link TAG}. */
const TAG_ESCAPED = "&lt;script&gt;alert(1)&lt;/script&gt;";

/** Assert the payload arrived as text and never as markup. */
function expectInert(html: string, context: string): void {
  expect(html, `${context}: raw payload must not survive`).not.toContain(TAG);
  expect(html, `${context}: tag form must never appear`).not.toMatch(/<script>alert\(1\)/);
  expect(html, `${context}: attribute form must never appear`).not.toContain(ATTR);
  // Positive half — the value reached the document, escaped.
  expect(html, `${context}: payload was dropped instead of escaped`).toContain(TAG_ESCAPED);
}

describe("path segments echoed by a renderer", () => {
  it("escapes the programme id in the breadcrumb and the heading", () => {
    expectInert(renderPublicProgrammeDetailHtml(TAG), "programme detail");
    // The benign case still renders.
    expect(renderPublicProgrammeDetailHtml("PRG-001")).toContain("PRG-001");
  });

  it("escapes the screen id in the not-found branch", () => {
    expectInert(renderScreenDetailHtml(TAG), "screen detail");
    expect(renderScreenDetailHtml("SCR-BCST-01")).toContain("SCR-BCST-01");
  });

  it("never echoes the role filter", () => {
    // `?role=` is compared against inventory roles, not printed, so the payload
    // is absent in every form — including escaped — and filters the list out.
    const html = renderScreensCatalogHtml(ATTR);
    expect(html).not.toContain(ATTR);
    expect(html).not.toContain("onmouseover");
    expect(html).not.toContain("SCR-BCST-01");
    // A real role still selects its screens, so the filter itself works.
    expect(renderScreensCatalogHtml("ExecutiveLeader")).toContain("SCR-BCST-01");
  });

  it("escapes an unknown workspace key", () => {
    expectInert(renderWorkspaceDeskHtml(TAG), "workspace desk");
    expect(renderWorkspaceDeskHtml(TAG)).toContain("Workspace Desk Not Found");
    // A known desk still resolves to its own page.
    expect(renderWorkspaceDeskHtml("finance")).not.toContain("Workspace Desk Not Found");
  });

  it("escapes the route parameters a broadcast screen echoes", () => {
    // `matchBroadcastScreen` decodes the path, so these are the exact strings a
    // caller receives for `/broadcast/channels/<payload>`.
    const screen = BROADCAST_SCREEN_INVENTORY[2]; // SCR-BCST-03, /broadcast/channels/:id
    const html = renderBroadcastScreenHtml(screen, { id: TAG }, screen.primaryRole);
    expect(html).not.toContain(TAG);
    expect(html).not.toContain("<script>alert(1)");
    expect(html).toContain(TAG_ESCAPED);
    // The parameter key is escaped too, and the screen's own labels are intact.
    expect(html).toContain("id:");
    expect(html).toContain(screen.screenId);
  });

  it("escapes the role echoed by the 403 branch", () => {
    const screen = BROADCAST_SCREEN_INVENTORY[2];
    const html = renderBroadcastScreenHtml(screen, {}, TAG);
    expect(html).toContain("403 Access Denied");
    expect(html).not.toContain(TAG);
    expect(html).toContain(TAG_ESCAPED);
  });
});

describe("record values (contracts, projections, schedules)", () => {
  it("escapes every counterparty-authored contract field", () => {
    const contract: MockVtmContract = {
      id: TAG,
      contractNumber: TAG,
      projectName: TAG,
      productionCompany: ATTR,
      roleTitle: TAG,
      totalCompensationNgn: 1_000_000,
      netTalentAmountNgn: 850_000,
      platformCommissionNgn: 150_000,
      startDate: TAG,
      endDate: ATTR,
      isSigned: true,
      signedAt: TAG,
      signedHash: TAG,
      milestones: [{ title: TAG, amountNgn: 1000, deliverable: TAG, status: TAG }],
    };
    const html = renderVtmTermsReviewHtml(contract);
    expect(html).not.toContain(TAG);
    expect(html).not.toContain(ATTR);
    expect(html).toContain(TAG_ESCAPED);
    // The platform's own economic language is untouched.
    expect(html).toContain("Talent Engagement Agreement");
  });

  it("escapes the unsigned case's form action too", () => {
    const contract = {
      id: TAG,
      contractNumber: "VTM-1",
      projectName: "Project",
      productionCompany: "Company",
      roleTitle: "Role",
      totalCompensationNgn: 1,
      netTalentAmountNgn: 1,
      platformCommissionNgn: 0,
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      isSigned: false,
      milestones: [],
    } as MockVtmContract;
    const html = renderVtmTermsReviewHtml(contract);
    expect(html).not.toContain(TAG);
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
    expect(html).toContain(`/sign`);
  });

  it("escapes projection titles, badges and field values", () => {
    const html = renderProjectionTable(TAG, ATTR, [{ label: TAG, value: TAG, scope: "INTERNAL" }]);
    expect(html).not.toContain(TAG);
    expect(html).not.toContain(ATTR);
    expect(html).toContain(TAG_ESCAPED);
    // The scope badge is still the module's own constant.
    expect(html).toContain(">INTERNAL</span>");
  });

  it("escapes the viewer timezone and the show titles in the now/next widget", () => {
    const slot = (title: string, start: string, end: string) => ({
      entryId: "E1",
      title,
      startTimeUtc: "2026-11-16T19:00:00Z",
      endTimeUtc: "2026-11-16T20:00:00Z",
      startViewerTime: start,
      endViewerTime: end,
      startGoverningTime: "20:00",
      dayShiftViewer: 1,
    });
    const view: NowAndNextView = {
      available: true,
      channelCode: "NXTR",
      viewerTimezone: "Africa/Lagos",
      governingTimezone: "Africa/Lagos",
      epgFreshnessKey: "test",
      current: slot(TAG, TAG, TAG),
      next: slot(ATTR, ATTR, ATTR),
    };
    // `viewerTz` reaches this widget from the browser's Time-Zone header, so it
    // is passed the same payload a header could carry.
    const html = renderNowNextWidgetHtml(view, TAG as unknown as "Africa/Lagos");
    expect(html).not.toContain(TAG);
    expect(html).not.toContain(ATTR);
    expect(html).toContain(TAG_ESCAPED);
    // The governing-timezone label stays the platform's constant.
    expect(html).toContain("WAT");
  });
});

/**
 * The workspace work surfaces are written with the `html` write boundary rather
 * than `escapeHtml(...)` calls, so there is no escaping call on the line to
 * inspect. The question this suite asks is the one DEBT-009 never could: does a
 * hostile record still arrive as text when no author wrote an escape?
 */
describe("workspace work surfaces (write boundary)", () => {
  const user = { email: TAG, roles: [TAG] };

  const task = (overrides: Partial<WorkTask> = {}): WorkTask => ({
    id: "TASK-1",
    domain: "RIGHTS",
    title: TAG,
    relatedRecordId: "RTS-1",
    context: ATTR,
    state: "OPEN",
    reasonActionNeeded: TAG,
    route: `/workspace/rights/${encodeURIComponent(TAG)}`,
    priority: 1,
    ...overrides,
  });

  it("escapes every field a domain queue puts on the My Work row", () => {
    const markup = String(renderMyWorkHtml(user, [task()]));
    expectInert(markup, "my work row");
    expect(markup).not.toContain(ATTR);
    // The row is still a row: the queue's own labels and the priority badge stay
    // markup, and the task is not silently dropped.
    expect(markup).toContain("BLOCKER");
    expect(markup).toContain("RIGHTS");
    expect(markup).toContain("Open");
  });

  it("keeps the empty queues readable instead of printing a placeholder row of markup", () => {
    const markup = String(renderMyWorkHtml(user, []));
    expect(markup).toContain("Nothing needs your attention right now");
    expectInert(String(renderSearchResultsHtml(user, TAG, [])), "search empty state");
  });

  it("escapes the query, the result fields and the roles it echoes", () => {
    const markup = String(
      renderSearchResultsHtml(user, TAG, [
        {
          kind: ATTR,
          id: TAG,
          title: TAG,
          snippet: ATTR,
          requiredRoles: [TAG],
          route: `/workspace/search?q=${encodeURIComponent(TAG)}`,
          score: 1,
        },
      ])
    );
    expectInert(markup, "search results");
    expect(markup).not.toContain(ATTR);
    // A benign query still renders its own count and role list.
    const benign = String(renderSearchResultsHtml({ email: "a@b.test", roles: ["Finance"] }, "invoice", []));
    expect(benign).toContain("0 result(s)");
    expect(benign).toContain("Finance");
  });

  it("escapes the category, title and body of an inbox notification", () => {
    const markup = String(
      renderNotificationsHtml({ email: TAG }, [
        { id: "N1", category: TAG, title: TAG, body: ATTR, createdAt: new Date("2026-11-16T09:00:00Z") },
        { id: "N2", category: "APPROVAL", title: "Signed", body: "ok", createdAt: new Date(), readAt: new Date() },
      ])
    );
    expectInert(markup, "inbox");
    expect(markup).not.toContain(ATTR);
    // The unread badge belongs to the unread row only.
    expect(markup).toContain("NEW");
    expect(markup).toContain("1 unread");
  });

  it("passes the boundary's markup through the master layout without escaping it twice", () => {
    // A migrated renderer returns `SafeHtml`; the layout interpolates it. If the
    // layout escaped it, the page would print `<h1>` instead of a heading.
    const layout = renderMasterLayout(
      "My Work | VMNL",
      renderMyWorkHtml(user, [task()]),
      "/workspace/my-work"
    );
    expect(layout).toContain("<h1");
    expect(layout).not.toContain("&lt;h1");
    expect(layout).not.toContain("&lt;table");
    expectInert(layout, "my work page");
  });
});

describe("query parameters that select a closed set", () => {
  it("rejects an out-of-set screen/scenario/device instead of trusting the cast", () => {
    expect(
      parsePrototypeViewOptions(new URLSearchParams({ screen: TAG, scenario: ATTR, device: `mobile${ATTR}` }))
    ).toEqual({ screen: "home", scenario: "normal", device: "desktop" });
  });

  it("keeps an in-set selection working", () => {
    expect(
      parsePrototypeViewOptions(
        new URLSearchParams({ screen: "schedule", scenario: "blocked", device: "mobile" })
      )
    ).toEqual({ screen: "schedule", scenario: "blocked", device: "mobile" });
  });

  it("cannot inject a class or an attribute through the device parameter", () => {
    // A direct caller bypassing the router still cannot break out: the renderer
    // validates at its own boundary, so the union types are actually true.
    const html = renderPrototypesViewerHtml({ device: `desktop${ATTR}` as PrototypeDevice });
    expect(html).not.toContain("onmouseover");
    expect(html).toContain("vmn-stage-desktop");
    expect(html).not.toContain("vmn-stage-desktop&quot;");
  });

  it("encodes the viewer's own links from the validated values", () => {
    const html = renderPrototypesViewerHtml({ screen: "terms", scenario: "recovery", device: "compact" });
    // Every screen link carries the validated scenario and device, so the
    // viewer's navigation round-trips instead of resetting.
    expect(html).toContain("href=\"/prototypes?screen=home&scenario=recovery&device=compact\"");
    expect(html).toContain("/prototypes?screen=terms&scenario=normal&device=compact");
  });
});
