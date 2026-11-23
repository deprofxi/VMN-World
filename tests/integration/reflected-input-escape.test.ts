/**
 * Reflected-input escaping over HTTP.
 *
 * The unit sweep (`tests/unit/reflected-input-escape.test.ts`) proves the
 * renderers escape what they are handed. This file asks the prior question:
 * what does the router hand them? Three of these paths decode before rendering
 * — `matchBroadcastScreen` calls `decodeURIComponent`, and the query string is
 * decoded by `URL` — so a hostile segment arrives at the renderer as real
 * markup unless something refuses it.
 *
 * Every case asserts the same three things: the payload did not become a tag,
 * the page still answered (not a silent drop), and the platform's own labels are
 * intact — because escaping the user's value must not cost the page its content.
 *
 * Authority: VMNL-AZP-VMN-CCPP-001 §*.  Debt: DEBT-009 (docs/design-debt-register.md).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";

const PORT = 53400 + Math.floor(Math.random() * 400);

/** `"><script>alert(1)</script>` — a tag break, percent-encoded for a URL. */
const TAG_ENCODED = "%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E";
/** `" onmouseover="alert(1)` — an attribute break, percent-encoded. */
const ATTR_ENCODED = "%22%20onmouseover%3D%22alert(1)";

interface Response {
  statusCode: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}

function request(path: string, headers: Record<string, string> = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method: "GET",
        headers: { Accept: "text/html,application/xhtml+xml", ...headers },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode || 0, body: data, headers: res.headers }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

/** No tag break survived, in any spelling. */
function expectNoBreakout(body: string, context: string): void {
  expect(body, `${context}: a script tag reached the document`).not.toMatch(/<script>alert\(1\)/i);
  expect(body, `${context}: an event handler attribute reached the document`).not.toContain(`onmouseover="alert(1)`);
}

describe("reflected input over HTTP", () => {
  let app: ApiServerInstance;
  let directorCookie: string;
  let trafficCookie: string;

  beforeAll(async () => {
    app = createApiServer(PORT, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
    const token = signSessionToken({
      userId: "usr-debt009",
      personId: "per-debt009",
      email: "director@vmnl.ng",
      roles: ["BroadcastDirector"],
    }).accessToken;
    directorCookie = `vmnl_session=${token}`;
    trafficCookie = `vmnl_session=${
      signSessionToken({
        userId: "usr-debt009-traffic",
        personId: "per-debt009-traffic",
        email: "traffic@vmnl.ng",
        roles: ["TrafficManager"],
      }).accessToken
    }`;
  });

  afterAll(async () => {
    await app.stop();
  });

  it("does not break out of a programme id echoed in the breadcrumb and heading", async () => {
    const res = await request(`/programmes/${TAG_ENCODED}`);
    expect(res.statusCode).toBe(404);
    expectNoBreakout(res.body, "programme detail");
    // The unknown-id branch still renders an honest profile page.
    expect(res.body).toContain("Programme profile");
    // The identifier is echoed, so the tester can see which id was not found —
    // percent-encoded, because the router never decoded it.
    expect(res.body).toContain("%3Cscript%3E");
  });

  it("does not break out of a screen id echoed in the not-found branch", async () => {
    const res = await request(`/broadcast/screens/${TAG_ENCODED}`);
    expect(res.statusCode).toBe(404);
    expectNoBreakout(res.body, "screen detail");
    expect(res.body).toContain("Screen Surface Not Found");
  });

  it("escapes a decoded broadcast route parameter", async () => {
    // `matchBroadcastScreen` decodes, so this is the reflected path that matters:
    // the renderer is handed the real `<script>` string.
    const res = await request(`/broadcast/channels/${TAG_ENCODED}`, { Cookie: directorCookie });
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "broadcast screen parameter");
    expect(res.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    // The screen itself still renders: this is an escaping fix, not a refusal.
    expect(res.body).toContain("SCR-BCST-03");
  });

  it("keeps a decoded route parameter from breaking an attribute", async () => {
    const res = await request(`/broadcast/channels/${ATTR_ENCODED}`, { Cookie: directorCookie });
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "broadcast screen attribute");
    expect(res.body).toContain("&quot; onmouseover=&quot;alert(1)");
  });

  it("escapes a decoded date segment echoed in the operator context bar", async () => {
    // `SCR-BCST-21` is `/broadcast/traffic/log/:date`. The value is decoded by
    // `matchBroadcastScreen` and printed on a line that carries no tag of its own
    // ("Broadcast Date:" is the line above), which is exactly the shape the
    // census's line rule and the taint pass both miss — found by probing that
    // class on 2026-11-18, escaped at the interpolation since.
    const res = await request(`/broadcast/traffic/log/${TAG_ENCODED}`, { Cookie: trafficCookie });
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "broadcast date segment");
    expect(res.body).toContain("Broadcast Date:");
    expect(res.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(res.body).toContain("SCR-BCST-21");
  });

  it("does not break out of an Azeebo+ resolver item id", async () => {
    // `/azeebo/content/:id` and `/content/:id` both reach here, and the id is the
    // whole remainder of the path — the largest reflected value on the tree.
    const res = await request(`/azeebo/content/${TAG_ENCODED}`);
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "azeebo resolver");
    // The resolver still states what it resolved to.
    expect(res.body).toContain("Resolving to");
    expect(res.body).toContain("Content Referral Gateway");
  });

  it("keeps the resolver's item id out of the deep link's attribute values", async () => {
    const res = await request(`/azeebo/live/${ATTR_ENCODED}`);
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "azeebo resolver attribute");
    expect(res.body).toContain("azeebo://live/");
  });

  it("refuses an out-of-set prototype device instead of casting it", async () => {
    const res = await request(`/prototypes?screen=home&scenario=normal&device=mobile${ATTR_ENCODED}`);
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "prototype device");
    // The viewer fell back to the declared default rather than rendering a
    // stage class built from the query value.
    expect(res.body).toContain("vmn-stage-desktop");
    expect(res.body).not.toContain("vmn-stage-mobile&quot;");
  });

  it("refuses an out-of-set prototype scenario and screen", async () => {
    const res = await request(`/prototypes?screen=${TAG_ENCODED}&scenario=${ATTR_ENCODED}&device=tablet`);
    expect(res.statusCode).toBe(200);
    expectNoBreakout(res.body, "prototype screen/scenario");
    expect(res.body).toContain("vmn-stage-tablet");
    expect(res.body).toContain("/prototypes?screen=home&scenario=normal&device=tablet");
  });
});
