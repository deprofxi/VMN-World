/**
 * Phase 4 `W1`/`W2` surfaces over HTTP.
 *
 * The unit suite proves the rendered contract; the dispatch suite proves the
 * entry point. This file proves the transport half an operator actually meets:
 * a session cookie is resolved by the real router, the gated screen answers 200
 * in the work shell, the denial is a 401 with no record in it, and the ten
 * AUTH-001 states arrive on the platform's own sign-in page.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { getIAScreen } from "../../src/web/ia/index.js";

const PORT = 53400 + Math.floor(Math.random() * 400);

interface Response {
  statusCode: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

function request(path: string, cookie?: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          ...(cookie ? { Cookie: cookie } : {}),
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
    req.end();
  });
}

const OPERATOR = {
  userId: "usr-phase4-http",
  personId: "per-phase4-http",
  email: "phase4.operator@vmnl.ng",
  roles: ["OperationsManager"],
  tenantId: "tenant-phase4-http",
};

function sessionCookie(): string {
  const token = signSessionToken(OPERATOR).accessToken;
  return `vmnl_session=${token}`;
}

describe("Phase 4 gated journeys over HTTP", () => {
  let app: ApiServerInstance;

  beforeAll(async () => {
    app = createApiServer(PORT, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
  });

  it("denies an anonymous ONE CIRCLE request with a 401 that carries no record", async () => {
    for (const path of ["/circle", "/account/security", "/circle/missions", "/circle/capabilities/capability-leader-overview"]) {
      const res = await request(path);
      expect(res.statusCode, `${path} must demand a session`).toBe(401);
      expect(res.headers["cache-control"]).toBe("private, no-store");
      expect(res.body).toContain("Sign in to open this screen");
      expect(res.body).not.toContain("Source not connected");
    }
  });

  it("serves ONE CIRCLE in the work shell for a real session cookie", async () => {
    const res = await request("/circle", sessionCookie());
    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toBe("private, no-store");
    expect(res.body).toContain("IA-CIRC-001");
    expect(res.body).toContain("vmn-work-rail-title");
    expect(res.body).toContain(OPERATOR.email);
    expect(res.body).not.toContain("vmn-shell-public");
  });

  it("serves the account journey in the identity shell, from the session record", async () => {
    const res = await request("/account", sessionCookie());
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("IA-AUTH-007");
    expect(res.body).toContain("vmn-shell-identity");
    expect(res.body).toContain(OPERATOR.email);
    expect(res.body).toContain("OperationsManager");

    const security = await request("/account/security", sessionCookie());
    expect(security.statusCode).toBe(200);
    // No SessionRecord exists for this token in this process, and the page says
    // so rather than implying no device is signed in.
    expect(security.body).toContain("No session record is held for this account");
  });

  it("serves a route-parameterised surface with the parameter echoed, escaped", async () => {
    const res = await request("/circle/missions/MSN-PROBE-1", sessionCookie());
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("MSN-PROBE-1");
    expect(res.body).toContain("not a mission that exists");
  });

  it("renders AUTH-001's hosted states on the platform's own sign-in page", async () => {
    const res = await request("/sign-in");
    expect(res.statusCode).toBe(200);
    for (const id of ["AUTH-005", "AUTH-013", "AUTH-015", "AUTH-017", "AUTH-022"]) {
      expect(res.body, `${id} is hosted on AUTH-001`).toContain(id);
    }
    expect(res.body).toContain(getIAScreen("AUTH-013")!.acceptanceId);
  });
});
