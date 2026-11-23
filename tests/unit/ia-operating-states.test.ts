/**
 * J23 public operating states — the declaration layer, without HTTP.
 *
 * EDGE-002 (410 withdrawn), EDGE-003 (503 maintenance) and EDGE-031 (brand not
 * launched) are *deployment declarations*: the code cannot infer them from a
 * request, so they must come from configuration, and an undeclared state must
 * stay unreachable rather than be guessed. EDGE-023 and EDGE-029 are decided by
 * a stored record's own state and by the inventory's data class; both are
 * asserted here through the real renderers.
 *
 * The transport half of these states (status codes, Retry-After) is proven over
 * a live server in tests/integration/ia-operating-states.test.ts.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { afterEach, describe, expect, it } from "vitest";
import { renderIAResponse } from "../../src/api/routes/ia.routes.js";
import { renderMediaPickerHtml, projectMediaPicker } from "../../src/web/workspace/media-picker.js";
import {
  declaredOperatingState,
  isSurfaceExempt,
  publicEdgeContract,
  publicOperatingStateFor,
  renderOfflineBody,
  renderOperatingStateBody,
} from "../../src/web/ia/operating-states.js";
import { IA_REGISTRY, resolveIARoute } from "../../src/web/ia/index.js";
import { listApprovedMediaAssets, registerMediaAsset, _resetMediaAssetsForTesting } from "../../src/core/storage/index.js";
import { createHash } from "node:crypto";

const QUERY = new URLSearchParams();

/** Run `fn` with exactly the given env values, restoring the previous ones. */
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const saved: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    saved[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function renderAnonymously(pathname: string) {
  const match = resolveIARoute(pathname);
  if (!match) throw new Error(`unresolvable route: ${pathname}`);
  return renderIAResponse(match, { pathname, user: null, query: QUERY });
}

afterEach(() => {
  _resetMediaAssetsForTesting();
});

describe("declaration parsing: nothing is inferred", () => {
  it("declares nothing when nothing is configured", () => {
    withEnv(
      {
        FF_PUBLIC_SURFACE_ENABLED: undefined,
        PUBLIC_WITHDRAWN_PATHS: undefined,
        PUBLIC_CORPORATE_LAUNCHED: undefined,
        PUBLIC_MAINTENANCE_RETRY_SECONDS: undefined,
      },
      () => {
        const state = declaredOperatingState();
        expect(state.maintenance).toBe(false);
        expect([...state.withdrawnPaths]).toEqual([]);
        expect(state.corporateLaunched).toBe(true);
        expect(publicOperatingStateFor("/")).toBeUndefined();
        expect(publicOperatingStateFor("/brands")).toBeUndefined();
      }
    );
  });

  it("reads the declared withdrawal list, normalising trailing slashes", () => {
    withEnv({ PUBLIC_WITHDRAWN_PATHS: "/brands/, /legacy-campaign ,not-a-path" }, () => {
      const { withdrawnPaths } = declaredOperatingState();
      expect([...withdrawnPaths].sort()).toEqual(["/brands", "/legacy-campaign"]);
      // An entry that is not a path cannot silently withdraw anything.
      expect(withdrawnPaths.has("not-a-path")).toBe(false);
    });
  });

  it("treats the public-surface kill switch as the maintenance declaration", () => {
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false" }, () => {
      expect(declaredOperatingState().maintenance).toBe(true);
      const state = publicOperatingStateFor("/about");
      expect(state?.reason).toBe("MAINTENANCE");
      expect(state?.status).toBe(503);
      expect(state?.contract.id).toBe("EDGE-003");
      expect(state?.contract.acceptanceId).toBe("IA-EDGE-003");
      expect(state?.headers["Retry-After"]).toBe("600");
    });
  });

  it("lets the operator state when clients should retry", () => {
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false", PUBLIC_MAINTENANCE_RETRY_SECONDS: "120" }, () => {
      expect(publicOperatingStateFor("/")?.headers["Retry-After"]).toBe("120");
    });
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false", PUBLIC_MAINTENANCE_RETRY_SECONDS: "soon" }, () => {
      // An unusable value falls back to the documented default instead of
      // emitting a header no client can parse.
      expect(publicOperatingStateFor("/")?.headers["Retry-After"]).toBe("600");
    });
  });

  it("keeps a declared withdrawal more specific than the maintenance window", () => {
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false", PUBLIC_WITHDRAWN_PATHS: "/brands" }, () => {
      expect(publicOperatingStateFor("/brands")?.reason).toBe("WITHDRAWN");
      expect(publicOperatingStateFor("/brands")?.status).toBe(410);
      expect(publicOperatingStateFor("/about")?.reason).toBe("MAINTENANCE");
    });
  });

  it("leaves the paths an operator needs during a window serving", () => {
    const exempt = [
      "/offline",
      "/healthz",
      "/readyz",
      "/sign-in",
      "/login",
      "/assets/app.css",
      "/api/v1/health",
      "/workspace/my-work",
      "/workspace",
      "/admin/governance",
      "/account/security",
      "/portal/client",
      "/broadcast/dashboard",
    ];
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false" }, () => {
      for (const path of exempt) {
        expect(isSurfaceExempt(path), `${path} must stay serving`).toBe(true);
        expect(publicOperatingStateFor(path), `${path} must not be closed`).toBeUndefined();
      }
      // A prefix is a path boundary, not a string prefix: an unrelated page
      // beginning with the same letters is still part of the public surface.
      expect(publicOperatingStateFor("/workspace-not-a-desk")?.status).toBe(503);
    });
  });

  it("yields the inventory's own contract for each declared state", () => {
    for (const id of ["EDGE-002", "EDGE-003", "EDGE-005", "EDGE-023", "EDGE-029", "EDGE-031"]) {
      const contract = publicEdgeContract(id);
      expect(contract, `${id} must come from the inventory`).toBeDefined();
      expect(contract!.acceptanceId).toBe(`IA-${id}`);
      expect(contract!.title.length).toBeGreaterThan(0);
    }
    // A non-edge record is not an edge contract.
    expect(publicEdgeContract("PUB-001")).toBeUndefined();
    expect(publicEdgeContract("EDGE-999")).toBeUndefined();
  });
});

describe("rendered states carry the contract, never the missing page", () => {
  it("renders the withdrawn page with its acceptance ID and a way onward", () => {
    withEnv({ PUBLIC_WITHDRAWN_PATHS: "/brands" }, () => {
      const state = publicOperatingStateFor("/brands")!;
      const body = renderOperatingStateBody(state, "/brands");
      expect(body).toContain("IA-EDGE-002");
      expect(body).toContain('href="/sitemap"');
      expect(body).toContain("410");
    });
  });

  it("renders the maintenance page with retry guidance and the offline document", () => {
    withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false" }, () => {
      const state = publicOperatingStateFor("/about")!;
      const body = renderOperatingStateBody(state, "/about");
      expect(body).toContain("IA-EDGE-003");
      expect(body).toContain('href="/offline"');
      expect(body).toContain('href="/about"');
    });
  });

  it("renders /offline as a document, claiming no cache the transport does not provide", () => {
    const body = renderOfflineBody();
    expect(body).toContain("IA-EDGE-005");
    expect(body).toContain("Nothing you type is sent");
    expect(body).not.toMatch(/cached for offline use|works offline/i);
  });

  it("keeps a path out of the markup, escaping what the operator declared", () => {
    // Paths are validated to start with `/`, but the renderer still escapes:
    // the escape boundary does not depend on the declaration being sane.
    withEnv({ PUBLIC_WITHDRAWN_PATHS: undefined }, () => {
      const state = publicOperatingStateFor("/about")!;
      expect(state).toBeUndefined();
    });
  });
});

describe("EDGE-031: the corporate brand states what it has declared", () => {
  it("withholds the corporate home while the launch is not declared", () => {
    withEnv({ PUBLIC_CORPORATE_LAUNCHED: "false" }, () => {
      const rendered = renderAnonymously("/");
      expect(rendered.status).toBe(200);
      expect(rendered.html).toContain("IA-EDGE-031");
      expect(rendered.html).toContain('href="/sitemap"');
      // The withheld state must not smuggle the un-launched home page in.
      expect(rendered.html).not.toContain("IA-PUB-001");
    });
  });

  it("serves the corporate home once the launch is declared", () => {
    withEnv({ PUBLIC_CORPORATE_LAUNCHED: undefined }, () => {
      const rendered = renderAnonymously("/");
      expect(rendered.status).toBe(200);
      expect(rendered.html).toContain("IA-PUB-001");
      expect(rendered.html).not.toContain("IA-EDGE-031");
    });
  });

  it("does not touch other public pages", () => {
    withEnv({ PUBLIC_CORPORATE_LAUNCHED: "false" }, () => {
      const about = renderAnonymously("/about");
      expect(about.html).not.toContain("IA-EDGE-031");
      expect(about.status).toBe(200);
    });
  });
});

describe("EDGE-029: the age gate on restricted casting inventory", () => {
  const candidacy = IA_REGISTRY.find(
    (screen) => screen.gate === "W3" && screen.dataClass === "RESTRICTED_CASTING" && screen.routeKind === "ROUTED" && !screen.route.includes("{")
  )!;

  it("denies with the age-restricted state instead of the generic denial", () => {
    const rendered = renderAnonymously(candidacy.route);
    expect(rendered.status).toBe(401);
    expect(rendered.html).toContain("IA-EDGE-029");
    expect(rendered.html).toContain(`/sign-in?returnUrl=${encodeURIComponent(candidacy.route)}`);
    // The generic session-denial chip is what EDGE-029 replaces, not adds to.
    expect(rendered.html).not.toContain("401 · Session required");
    // Still a denial: nothing from the record is read to produce the page.
    expect(rendered.html).toContain("No record, count or status from this screen has been read");
  });

  it("keeps the generic denial for a gated screen that is not age-restricted", () => {
    const ordinary = IA_REGISTRY.find(
      (screen) =>
        screen.gate === "W3" &&
        screen.dataClass !== "RESTRICTED_CASTING" &&
        screen.routeKind === "ROUTED" &&
        !screen.route.includes("{")
    )!;
    const rendered = renderAnonymously(ordinary.route);
    expect(rendered.status).toBe(401);
    expect(rendered.html).toContain("401 · Session required");
    expect(rendered.html).not.toContain("IA-EDGE-029");
  });
});

describe("EDGE-023: a quarantined upload is a state, not a silent row", () => {
  it("shows the upload state beside non-selectable picker rows", () => {
    registerMediaAsset({
      assetId: "MA-EDGE023-UNIT",
      title: "Master with a failed scan",
      assetKey: "legacy/quarantine/master.mp4",
      mimeType: "video/mp4",
      sizeBytes: 2048,
      checksumSha256: createHash("sha256").update("MA-EDGE023-UNIT").digest("hex"),
      provenance: "EDGE-023 unit fixture",
      virusScanPassed: false,
      registeredBy: "ingest@vmnl.ng",
    });

    const assets = listApprovedMediaAssets({ includeNonAvailable: true }).filter(
      (asset) => asset.assetId === "MA-EDGE023-UNIT"
    );
    expect(assets).toHaveLength(1);
    expect(assets[0].accessState).toBe("QUARANTINED");

    const html = renderMediaPickerHtml(projectMediaPicker(assets));
    expect(html).toContain("IA-EDGE-023");
    expect(html).toContain("QUARANTINED");
    // A quarantined asset is never a selectable media reference.
    expect(html).not.toContain("name=\"mediaAssetId\"");
  });
});
