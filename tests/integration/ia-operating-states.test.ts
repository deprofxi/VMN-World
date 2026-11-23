/**
 * J23 public operating states — proven over a live server.
 *
 * The unit sweep (tests/unit/ia-operating-states.test.ts) proves the declaration
 * layer. This file proves the transport half: a declared state reaches the
 * client as the status code and contract the inventory names, and the paths an
 * operator needs stay serving while the public surface is closed. A page body
 * alone would not prove either — a 200 carrying EDGE-003 markup would still be
 * cached and retried as success.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { createHash } from "node:crypto";
import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { issueCsrfToken, CSRF_COOKIE_NAME } from "../../src/core/websecurity/index.js";
import {
  listApprovedMediaAssets,
  _resetMediaAssetsForTesting,
} from "../../src/core/storage/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { IA_REGISTRY } from "../../src/web/ia/index.js";

const PORT = 52500 + Math.floor(Math.random() * 900);
const QUARANTINED_ASSET = "MA-EDGE023-HTTP";

interface Response {
  statusCode: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

function request(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const payload = options.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method: options.method || "GET",
        headers: {
          // A browser's Accept header: the states below are the ones a visitor
          // meets, not the ones an API client meets.
          Accept: "text/html,application/xhtml+xml",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ statusCode: res.statusCode || 0, body: data, headers: res.headers })
        );
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function writeHeaders(): Record<string, string> {
  const token = signSessionToken({
    userId: "usr-edge023",
    personId: "per-edge023",
    email: "director@vmnl.ng",
    roles: ["BroadcastDirector"],
  }).accessToken;
  const csrf = issueCsrfToken();
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf,
    Cookie: `vmnl_session=${token}; ${CSRF_COOKIE_NAME}=${csrf}`,
  };
}

/** Set env values for the duration of one test and restore them afterwards. */
async function withEnv(vars: Record<string, string>, fn: () => Promise<void>): Promise<void> {
  const saved: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("J23 public operating states over HTTP", () => {
  let app: ApiServerInstance;

  beforeAll(async () => {
    app = createApiServer(PORT, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
    _resetMediaAssetsForTesting();
    const db = await checkDatabaseConnection();
    if (db.connected) {
      await getPrismaClient().mediaAssetRecord.deleteMany({
        where: { id: { startsWith: "MA-EDGE023" } },
      });
    }
  });

  it("serves the public surface normally when no state is declared", async () => {
    const home = await request("/");
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain("IA-PUB-001");
    expect(home.headers["retry-after"]).toBeUndefined();
  });

  it("answers EDGE-003 to the public surface while the kill switch is off", async () => {
    await withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false" }, async () => {
      for (const path of ["/", "/about", "/brands"]) {
        const closed = await request(path);
        expect(closed.statusCode, `${path} must be closed`).toBe(503);
        expect(closed.body).toContain("IA-EDGE-003");
        expect(closed.body).not.toContain("IA-PUB-001");
        // 503 is retryable; a client must be told when, not left to poll.
        expect(closed.headers["retry-after"]).toBe("600");
      }

      // The operating paths keep serving, or the window cannot be worked from
      // inside it.
      const offline = await request("/offline");
      expect(offline.statusCode).toBe(200);
      const signIn = await request("/sign-in");
      expect(signIn.statusCode).not.toBe(503);
    });

    // The declaration is read per request: lifting it restores service without
    // a restart, which is what an operator closing a window needs.
    const restored = await request("/");
    expect(restored.statusCode).toBe(200);
  });

  it("refuses a public form submission while the surface is closed", async () => {
    await withEnv({ FF_PUBLIC_SURFACE_ENABLED: "false" }, async () => {
      const { listEnquiries } = await import("../../src/modules/hub/enquiry/index.js");
      const before = listEnquiries().length;
      const res = await request("/work-with-vmn/submit", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "wizardScreenId=LEAD-001&fullName=Closed+Window&email=closed%40example.com&message=Attempt",
      });
      // The wizard page answers 503 while closed, so accepting the submission
      // would record a request whose outcome the visitor cannot see.
      expect(res.statusCode).toBe(503);
      expect(res.body).toContain("IA-EDGE-003");
      expect(listEnquiries().length, "no enquiry may be filed through a closed surface").toBe(before);
    });
  });

  it("answers EDGE-002 for a declared withdrawal and only for that path", async () => {
    await withEnv({ PUBLIC_WITHDRAWN_PATHS: "/brands/, /legacy-campaign" }, async () => {
      const withdrawn = await request("/brands");
      expect(withdrawn.statusCode).toBe(410);
      expect(withdrawn.body).toContain("IA-EDGE-002");
      expect(withdrawn.body).toContain('href="/sitemap"');

      // Trailing slash and the second declared path both withdraw.
      expect((await request("/legacy-campaign")).statusCode).toBe(410);

      // Everything undeclared keeps serving — a withdrawal list is not a switch.
      const about = await request("/about");
      expect(about.statusCode).toBe(200);
      expect(about.body).not.toContain("IA-EDGE-002");
    });

    expect((await request("/brands")).statusCode).toBe(200);
  });

  it("answers EDGE-031 on the corporate home until the launch is declared", async () => {
    await withEnv({ PUBLIC_CORPORATE_LAUNCHED: "false" }, async () => {
      const home = await request("/");
      expect(home.statusCode).toBe(200);
      expect(home.body).toContain("IA-EDGE-031");
      expect(home.body).not.toContain("IA-PUB-001");

      const about = await request("/about");
      expect(about.statusCode).toBe(200);
      expect(about.body).not.toContain("IA-EDGE-031");
    });
  });

  it("serves the offline document, cacheable and claiming no offline cache", async () => {
    const offline = await request("/offline");
    expect(offline.statusCode).toBe(200);
    expect(offline.body).toContain("IA-EDGE-005");
    expect(offline.body).toContain("Nothing you type is sent");
    // A utilizable document: the cache policy is present rather than absent.
    expect(offline.headers["cache-control"]).toBeTruthy();
    expect(offline.body).not.toMatch(/cached for offline use|works offline/i);
    // It is a handler document, not a published page: it must not invite a
    // crawler to index "offline" as site content.
    expect(offline.body).toContain('name="robots" content="noindex, nofollow"');
  });

  it("answers EDGE-029 to an anonymous request for age-restricted inventory", async () => {
    const restricted = IA_REGISTRY.find(
      (screen) =>
        screen.gate === "W3" &&
        screen.dataClass === "RESTRICTED_CASTING" &&
        screen.routeKind === "ROUTED" &&
        !screen.route.includes("{")
    )!;
    const denied = await request(restricted.route);
    expect(denied.statusCode).toBe(401);
    expect(denied.body).toContain("IA-EDGE-029");
    expect(denied.body).toContain("/sign-in?returnUrl=");

    // The generic gate is unchanged for ordinary gated screens.
    const ordinary = IA_REGISTRY.find(
      (screen) =>
        screen.gate === "W3" &&
        screen.dataClass !== "RESTRICTED_CASTING" &&
        screen.routeKind === "ROUTED" &&
        !screen.route.includes("{")
    )!;
    const generic = await request(ordinary.route);
    expect(generic.statusCode).toBe(401);
    expect(generic.body).not.toContain("IA-EDGE-029");
  });

  it("answers EDGE-023 to a registration whose scan did not pass, and keeps it unusable", async () => {
    const res = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: writeHeaders(),
      body: JSON.stringify({
        title: "Master with a failed scan",
        assetKey: "legacy/edge023/master.mp4",
        mimeType: "video/mp4",
        sizeBytes: 4096,
        checksumSha256: createHash("sha256").update(QUARANTINED_ASSET).digest("hex"),
        virusScanPassed: false,
      }),
    });

    expect(res.statusCode).toBe(201);
    const payload = JSON.parse(res.body);
    expect(payload.asset.accessState).toBe("QUARANTINED");
    expect(payload.edgeState.id).toBe("EDGE-023");
    expect(payload.edgeState.acceptanceId).toBe("IA-EDGE-023");

    // The state is not merely described: the asset is not approved media, so
    // the picker's data source never offers it.
    const listed = listApprovedMediaAssets({ includeNonAvailable: false });
    expect(listed.some((asset) => asset.assetId === payload.asset.assetId)).toBe(false);
  });

  it("does not attach EDGE-023 to a clean registration", async () => {
    const res = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: writeHeaders(),
      body: JSON.stringify({
        title: "Clean master",
        assetKey: "legacy/edge023/clean.mp4",
        mimeType: "video/mp4",
        sizeBytes: 4096,
        checksumSha256: createHash("sha256").update(`${QUARANTINED_ASSET}-clean`).digest("hex"),
        virusScanPassed: true,
      }),
    });
    expect(res.statusCode).toBe(201);
    const payload = JSON.parse(res.body);
    expect(payload.asset.accessState).toBe("AVAILABLE");
    expect(payload.edgeState).toBeUndefined();
  });
});
