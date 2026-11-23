/**
 * VMN World IA R1.1 — Phase 4 `W1` read and `W2` work surfaces.
 *
 * What this suite settles, in the order the plan states it:
 *  - the gate still governs every routed CIRC/AUTH/MISS/CAP screen (401 without
 *    a session, 200 with one), and each page carries its acceptance ID;
 *  - a gated screen renders in the work shell, not the public marketing shell,
 *    and the AUTH journey renders in the identity shell;
 *  - the surfaces whose sources are real read them (work aggregator, session
 *    registry, in-app inbox, notification preferences) and show no value where
 *    the source is absent;
 *  - every hosted child appears on its named host, including the ten hosted on
 *    the platform-owned sign-in screen.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderIAResponse } from "../../src/api/routes/ia.routes.js";
import type { SessionUser } from "../../src/core/auth/index.js";
import {
  _resetInboxForTesting,
  _resetPreferencesForTesting,
  _resetSessionsForTesting,
  deliverInAppNotification,
  registerSession,
  saveNotificationPreferences,
} from "../../src/core/auth/sessions.js";
import {
  _resetWorkSourcesForTesting,
  aggregateMyWork,
  registerWorkTaskSource,
} from "../../src/core/work/index.js";
import { renderSignInHostedStates } from "../../src/web/ia/journey-auth.js";
import {
  getHostedChildren,
  getIAScreen,
  resolveIARoute,
  type IAScreen,
} from "../../src/web/ia/index.js";

const QUERY = new URLSearchParams();

const USER: SessionUser = {
  userId: "usr-phase4",
  personId: "person-phase4",
  email: "operator@vmnl.ng",
  roles: ["OperationsManager"],
  tenantId: "tenant-phase4",
  mfaEnabled: true,
};

/** The four journeys Phase 4 builds, routed rows only. */
function phase4Routed(): IAScreen[] {
  return ["CIRC", "AUTH", "MISS", "CAP"]
    .flatMap((prefix) => [...Array(40).keys()].map((n) => getIAScreen(`${prefix}-${String(n + 1).padStart(3, "0")}`)))
    .filter((screen): screen is IAScreen => screen !== undefined)
    .filter((screen) => screen.routeKind === "ROUTED")
    // `/sign-in` is platform-owned: IA never shadows the identity shell.
    .filter((screen) => screen.id !== "AUTH-001");
}

function probePath(screen: IAScreen): string {
  return screen.route.includes("{")
    ? screen.route.replace(/\{[^}]+\}/g, "probe-value")
    : screen.route;
}

function render(screen: IAScreen, user: SessionUser | null, pathname = probePath(screen)): string {
  const match = resolveIARoute(pathname);
  if (!match) throw new Error(`route did not resolve: ${pathname}`);
  return renderIAResponse({ ...match, screen }, { pathname, user, query: QUERY }).html;
}

beforeEach(() => {
  _resetWorkSourcesForTesting();
  _resetSessionsForTesting();
  _resetInboxForTesting();
  _resetPreferencesForTesting();
});

afterEach(() => {
  _resetWorkSourcesForTesting();
});

describe("Phase 4 gate matrix", () => {
  it("covers the four journeys' routed rows", () => {
    const routed = phase4Routed();
    // 106 inventory rows across CIRC/AUTH/MISS/CAP; 57 routed once AUTH-001
    // (served by the identity shell) is excluded.
    expect(routed.length).toBe(57);
    for (const screen of routed) {
      expect(["W1", "W2", "W3", "W4"]).toContain(screen.gate);
    }
  });

  it("answers 401 without a session and 200 with one, on every routed path", () => {
    for (const screen of phase4Routed()) {
      const pathname = probePath(screen);
      const anonymous = renderIAResponse({ screen, params: {}, sharedWithInstances: false }, {
        pathname,
        user: null,
        query: QUERY,
      });
      expect(anonymous.status, `${screen.id} must demand a session`).toBe(401);

      const authed = renderIAResponse({ screen, params: {}, sharedWithInstances: false }, {
        pathname,
        user: USER,
        query: QUERY,
      });
      expect(authed.status, `${screen.id} must render for a session`).toBe(200);
      expect(authed.html, `${screen.id} must carry its acceptance ID`).toContain(screen.acceptanceId);
      expect(authed.html, `${screen.id} must carry one h1`).toMatch(/<h1[^>]*>/);
      expect(authed.html, `${screen.id} must not leak the public sitemap nav`).not.toContain(
        "vmn-shell-public"
      );
    }
  });

  it("renders work screens in the work shell and the account journey in the identity shell", () => {
    for (const screen of phase4Routed()) {
      const html = render(screen, USER);
      if (screen.id.startsWith("AUTH-")) {
        expect(html, `${screen.id} belongs to the identity shell`).toContain("vmn-shell-identity");
        expect(html, `${screen.id} must not render the operator rail`).not.toContain(
          "vmn-work-rail-title"
        );
      } else {
        expect(html, `${screen.id} is a work surface`).toContain("vmn-work-rail-title");
      }
    }
  });
});

describe("Phase 4: real sources are read, absent ones are stated", () => {
  it("CIRC-001 lists the tasks the aggregator returns, with their real fields", () => {
    registerWorkTaskSource({
      listTasks: () => [
        {
          id: "task-phase4",
          domain: "APPROVALS",
          title: "Rate card override awaiting decision",
          relatedRecordId: "apr-001",
          context: "Campaign pricing",
          state: "PENDING",
          reasonActionNeeded: "Four-eyes decision required",
          route: "/workspace/approvals/apr-001",
          priority: 1,
        },
      ],
    });

    const html = render(getIAScreen("CIRC-001")!, USER);
    expect(html).toContain("Rate card override awaiting decision");
    expect(html).toContain("Four-eyes decision required");
    expect(html).toContain("/workspace/approvals/apr-001");
    expect(html).toContain("APPROVALS");
  });

  it("CIRC-001 states an empty queue as a state, not as a company-wide zero", () => {
    expect(aggregateMyWork(USER.userId, USER.roles).length).toBe(0);
    const html = render(getIAScreen("CIRC-001")!, USER);
    expect(html).toContain("No task is assigned to this account");
    expect(html).toContain("An empty list is a state, not a measurement");
  });

  it("AUTH-009 reads the session registry for this account only", () => {
    registerSession({
      token: "token-phase4-a",
      userId: USER.userId,
      email: USER.email,
      deviceLabel: "MCR Edit Suite",
      ipAddress: "203.0.113.9",
    });
    registerSession({
      token: "token-phase4-b",
      userId: "usr-other",
      email: "other@vmnl.ng",
      deviceLabel: "Someone Else's Laptop",
    });

    const html = render(getIAScreen("AUTH-009")!, USER);
    expect(html).toContain("MCR Edit Suite");
    expect(html).toContain("203.0.113.9");
    expect(html).toContain("Active sessions recorded for this account: 1");
    expect(html, "another account's device must not appear").not.toContain(
      "Someone Else's Laptop"
    );
  });

  it("CIRC-025 reads the inbox and the preferences the dispatcher obeys", () => {
    saveNotificationPreferences(USER.userId, {
      categories: {
        playoutDisruption: true,
        rightsBlocks: true,
        financeApprovals: true,
        admissionsDecisions: false,
      },
    });
    deliverInAppNotification({
      userId: USER.userId,
      category: "RIGHTS_BLOCK",
      title: "Rights clearance missing for scheduled episode",
      body: "Episode 14 has no recorded clearance for the linear window.",
      route: "/workspace/rights/r-14",
    });
    // Suppressed by preference: must not be delivered, so must not appear.
    deliverInAppNotification({
      userId: USER.userId,
      category: "ADMISSIONS_DECISION",
      title: "Admissions decision suppressed",
      body: "Opted out of admissions decisions.",
    });

    const html = render(getIAScreen("CIRC-025")!, USER);
    expect(html).toContain("Rights clearance missing for scheduled episode");
    expect(html).toContain("/workspace/rights/r-14");
    expect(html, "a suppressed category must not be delivered").not.toContain(
      "Admissions decision suppressed"
    );
    expect(html).toContain("Admissions decisions");
    expect(html).toContain("Off");
  });

  it("CIRC-022 shows the session's own roles and invents no capability", () => {
    const html = render(getIAScreen("CIRC-022")!, USER);
    expect(html).toContain("operator@vmnl.ng");
    expect(html).toContain("OperationsManager");
    expect(html).toContain("tenant-phase4");
    expect(html).toContain("Skills, professional scopes, supervision and capability review have no model");
  });

  it("a not-connected surface carries the notice and no date-shaped record", () => {
    const dateLike = /\b(19|20)\d\d-\d\d-\d\d\b/;
    for (const id of ["CIRC-009", "CIRC-008", "MISS-001", "MISS-002", "CAP-001", "CIRC-018"]) {
      const html = render(getIAScreen(id)!, USER);
      expect(html, `${id} must state the absence`).toMatch(/Source not connected|No connected/);
      expect(html, `${id} must not invent a dated record`).not.toMatch(dateLike);
    }
  });

  it("the W2 frame distinguishes a work-gate read from a request", () => {
    const read = render(getIAScreen("MISS-001")!, USER);
    expect(read).toContain("it records nothing");

    const request = render(getIAScreen("MISS-003")!, USER);
    expect(request).toContain("no form is offered");
  });

  it("echoes a route parameter as requested input, escaped and labelled", () => {
    const hostile = "</p><script>alert(1)</script>";
    const html = render(getIAScreen("CIRC-010")!, USER, `/circle/sops/${encodeURIComponent(hostile)}`);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("what the address asked for, not a record that exists");
  });
});

describe("Phase 4: gated page weight", () => {
  /**
   * Measured 2026-11-17 through the real dispatcher, unseeded. The layout shell
   * alone is ~14 KB, so every page below is mostly its own content. The heaviest
   * is CIRC-001 at 47,532 B because it hosts fifteen inventory states inline;
   * the ceiling is set just above that so growth is caught, not merely noted.
   */
  const CEILING_BYTES = 49_152;

  it("keeps every gated page under the measured ceiling", () => {
    const heavy: { id: string; bytes: number }[] = [];
    for (const screen of phase4Routed()) {
      const bytes = Buffer.byteLength(render(screen, USER), "utf8");
      heavy.push({ id: screen.id, bytes });
      expect(bytes, `${screen.id} exceeded the gated page ceiling`).toBeLessThanOrEqual(
        CEILING_BYTES
      );
    }
    heavy.sort((a, b) => b.bytes - a.bytes);
    // The operator home is the documented heaviest surface; if it is no longer
    // that, the recorded figure in page-plan.md §8.8 is stale.
    expect(heavy[0].id).toBe("CIRC-001");
    expect(heavy[0].bytes).toBeGreaterThan(40_000);
  });
});

describe("Phase 4: hosted states render on their named host", () => {
  it("every hosted child of a Phase 4 screen appears on that screen", () => {
    for (const screen of phase4Routed()) {
      const hosted = getHostedChildren(screen);
      if (hosted.length === 0) continue;
      const html = render(screen, USER);
      for (const child of hosted) {
        expect(html, `${child.id} is hosted on ${screen.id} and must be rendered there`).toContain(
          child.id
        );
      }
    }
  });

  it("renders the ten AUTH-001 states on the platform's own sign-in screen", () => {
    const host = getIAScreen("AUTH-001")!;
    const hosted = getHostedChildren(host);
    expect(hosted.length).toBe(10);
    const html = renderSignInHostedStates();
    for (const child of hosted) {
      expect(html, `${child.id} must appear on the sign-in screen`).toContain(child.id);
    }
  });

  it("keeps a hosted state's own acceptance criterion, not just its name", () => {
    const html = render(getIAScreen("MISS-004")!, USER);
    for (const child of getHostedChildren(getIAScreen("MISS-004")!)) {
      expect(html).toContain(child.acceptanceId);
    }
  });
});
