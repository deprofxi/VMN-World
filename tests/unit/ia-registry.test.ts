/**
 * VMN World IA R1.1 — registry integrity and route resolution.
 *
 * The registry is generated from docs/authorities/ia/*.csv. These tests fail if
 * the checked-in registry drifts from the authority's own counts, or if route
 * resolution becomes ambiguous.
 */

import { describe, expect, it } from "vitest";
import {
  getContentInstances,
  getHostedChildren,
  getIAScreen,
  IA_JOURNEYS,
  IA_PUBLIC_PAGES,
  IA_REGISTRY,
  IA_REGISTRY_SOURCE,
  IA_ROUTE_PATTERNS,
  resolveIARoute,
} from "../../src/web/ia/index.js";

const GATES = ["W0", "W1", "W2", "W3", "W4", "G"];

describe("IA registry source", () => {
  it("matches the authority inventory's own counts", () => {
    expect(IA_REGISTRY_SOURCE.rowCount).toBe(619);
    expect(IA_REGISTRY).toHaveLength(619);
    expect(IA_REGISTRY_SOURCE.routedCount).toBe(393);
    expect(IA_REGISTRY_SOURCE.hostedCount).toBe(226);
    expect(IA_REGISTRY_SOURCE.journeyCount).toBe(24);
    expect(IA_ROUTE_PATTERNS).toHaveLength(358);
  });

  it("records the CSV path and a verifiable digest", () => {
    expect(IA_REGISTRY_SOURCE.csvPath).toBe(
      "docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv"
    );
    expect(IA_REGISTRY_SOURCE.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gives every record a unique id and acceptance id", () => {
    const ids = new Set(IA_REGISTRY.map((screen) => screen.id));
    const acceptanceIds = new Set(IA_REGISTRY.map((screen) => screen.acceptanceId));
    expect(ids.size).toBe(IA_REGISTRY.length);
    expect(acceptanceIds.size).toBe(IA_REGISTRY.length);
  });

  it("carries the contract fields every screen needs to be reviewable", () => {
    for (const screen of IA_REGISTRY) {
      expect(GATES).toContain(screen.gate);
      expect(screen.screenName.length).toBeGreaterThan(0);
      expect(screen.acceptanceId).toMatch(/^IA-[A-Z]+-\d{3}$/);
      expect(screen.acceptanceCriterion.length).toBeGreaterThan(0);
      expect(screen.evidenceContract.length).toBeGreaterThan(0);
      expect(screen.primaryAction.length).toBeGreaterThan(0);
      expect(screen.sourceOffice.length).toBeGreaterThan(0);
      expect(screen.releaseStatus).toContain("NOT VERIFIED");
    }
  });

  it("only routes a screen from its own URL, or hosts it from a real host", () => {
    for (const screen of IA_REGISTRY) {
      if (screen.routeKind === "ROUTED") {
        expect(screen.route.startsWith("/")).toBe(true);
        // A routed template may also name its parent (BRD-006 is the reusable
        // sub-brand template under the /brands directory), so an empty host is
        // not required — an unknown one still is not allowed.
        if (screen.hostScreenId) {
          expect(getIAScreen(screen.hostScreenId), `${screen.id} parent`).toBeDefined();
        }
        continue;
      }
      expect(screen.route).toBe("");
      expect(screen.hostScreenId.length).toBeGreaterThan(0);

      // A hosted state may be hosted by another hosted state; follow the chain
      // until it reaches a screen that owns a URL.
      let host = getIAScreen(screen.hostScreenId);
      expect(host, `${screen.id} names unknown host ${screen.hostScreenId}`).toBeDefined();
      for (let hops = 0; host && host.routeKind !== "ROUTED"; hops += 1) {
        expect(hops, `${screen.id} host chain does not reach a routed screen`).toBeLessThan(5);
        host = getIAScreen(host.hostScreenId);
      }
      expect(host?.routeKind).toBe("ROUTED");

      // GLOBAL_STATE rows (STATE@HOST) are reachable from any request and own no
      // URL; only a HOSTED row must resolve to a host location.
      if (screen.routeKind === "HOSTED") {
        // The CSV's HOSTED@ path sometimes names a parent area (`/account`)
        // rather than the host's own route (`/sign-in`). hostScreenId is the
        // authoritative link, so the lookup must work through the id alone.
        expect(screen.hostPath.startsWith("/"), `${screen.id} has no hostPath`).toBe(true);
      } else {
        expect(screen.hostPath).toBe("");
      }
      expect(getHostedChildren(host!).map((child) => child.id)).toContain(screen.id);
    }
  });

  it("groups every record into exactly one journey", () => {
    const grouped = IA_JOURNEYS.reduce((total, journey) => total + journey.screens.length, 0);
    expect(grouped).toBe(IA_REGISTRY.length);
    expect(IA_JOURNEYS).toHaveLength(24);
    expect(IA_JOURNEYS.map((journey) => journey.code)).toContain("PUB");
  });
});

describe("IA route resolution", () => {
  it("resolves a static route to its own screen", () => {
    const match = resolveIARoute("/about");
    expect(match?.screen.id).toBe("PUB-002");
    expect(match?.params).toEqual({});
  });

  it("prefers a literal segment over a parameter pattern", () => {
    const match = resolveIARoute("/brands/ten");
    expect(match?.screen.route).toBe("/brands/ten");
    expect(match?.sharedWithInstances).toBe(false);
  });

  it("resolves a parameter pattern and decodes its parameter", () => {
    // A published brand has its own literal route; an unpublished slug falls
    // through to the reusable template.
    const match = resolveIARoute("/brands/unpublished-example-brand");
    expect(match?.screen.route).toBe("/brands/{approved-brand-slug}");
    expect(match?.params["approved-brand-slug"]).toBe("unpublished-example-brand");
    expect(match?.sharedWithInstances).toBe(true);
  });

  it("normalises a trailing slash and preserves the root path", () => {
    expect(resolveIARoute("/about/")?.screen.id).toBe("PUB-002");
    expect(resolveIARoute("/")?.screen.id).toBe("PUB-001");
    expect(resolveIARoute("/")?.params).toEqual({});
  });

  it("returns no match for a path the inventory does not define", () => {
    expect(resolveIARoute("/this-route-is-not-in-the-inventory")).toBeUndefined();
  });

  it("makes every route pattern resolve to its own screen", () => {
    for (const pattern of IA_ROUTE_PATTERNS) {
      if (pattern.includes("{")) continue;
      const match = resolveIARoute(pattern);
      expect(match, `${pattern} did not resolve`).toBeDefined();
      expect(match?.screen.route).toBe(pattern);
    }
  });

  it("lists only public, routed pages in the sitemap source", () => {
    expect(IA_PUBLIC_PAGES.length).toBeGreaterThan(0);
    for (const screen of IA_PUBLIC_PAGES) {
      expect(screen.gate).toBe("W0");
      expect(screen.routeKind).toBe("ROUTED");
      expect(screen.archetype).not.toBe("CONTENT_INSTANCE");
      expect(screen.route.startsWith("/")).toBe(true);
    }
  });

  it("finds a host's hosted states and a template's content instances", () => {
    const home = getIAScreen("PUB-001");
    expect(home).toBeDefined();
    const hosted = getHostedChildren(home!).map((screen) => screen.id);
    expect(hosted).toContain("PUB-014");
    expect(hosted).toContain("PUB-022");

    const instances = getContentInstances("/brands/{approved-brand-slug}");
    expect(instances.length).toBeGreaterThan(0);
    for (const instance of instances) {
      expect(instance.archetype).toBe("CONTENT_INSTANCE");
    }
  });
});
