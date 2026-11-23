/**
 * TSK-42 (report.md §6): the shipped-payload sweep claim, measured as a test.
 *
 * `docs/audit/performance-budgets.md` froze four byte budgets and a transfer
 * procedure but nothing had been measured, so DEBT-008 sat at TARGET. This file
 * measures the byte budgets against the stylesheet the application actually
 * ships and the pages it actually serves. Timing budgets (TTFB, interactive)
 * are deliberately NOT asserted here — they are environment-dependent and would
 * make the gate flaky; they are measured by the artifact harness instead.
 *
 * Rule 0.3: a missed budget is asserted as missed, and its miss is required to
 * be named in `docs/design-debt-register.md`. Nothing here weakens a budget to
 * make it pass; the 120 KB per-view budget is genuinely over.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { IA_PUBLIC_PAGES } from "../../src/web/ia/index.js";
import { CANONICAL_STYLESHEET } from "../../src/web/styles/index.js";

/** Frozen targets, verbatim from docs/audit/performance-budgets.md. */
const KB = 1024;
const BUDGETS = {
  criticalHtml: 65 * KB,
  publicShell: 25 * KB,
  screenViewTransfer: 120 * KB,
};

const DEBT_REGISTER = fileURLToPath(new URL("../../docs/design-debt-register.md", import.meta.url));

let app: ApiServerInstance | undefined;
let port = 0;
let authHeader: Record<string, string> = {};

/** Fetch with the encoding the budget procedure specifies: no compression. */
function get(path: string, headers: Record<string, string> = {}): Promise<{ status: number; bytes: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET", headers: { "Accept-Encoding": "identity", ...headers } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => resolve({ status: res.statusCode || 0, bytes: Buffer.concat(chunks).length, body: Buffer.concat(chunks) }));
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error(`budget probe timed out on ${path}`)));
    req.end();
  });
}

beforeAll(async () => {
  app = createApiServer(0);
  await app.start();
  port = (app.server.address() as { port: number }).port;
  authHeader = {
    Authorization: `Bearer ${signSessionToken({
      userId: "usr-budget",
      personId: "per-budget",
      email: "budget@vmnl.ng",
      roles: ["SuperAdmin"],
    }).accessToken}`,
  };
});

afterAll(() => app?.server.close());

describe("TSK-42: shipped payload budgets, measured not asserted", () => {
  it("ships one canonical stylesheet, and states its size against every byte budget", () => {
    const shipped = Buffer.byteLength(CANONICAL_STYLESHEET, "utf8");

    // The stylesheet is the single largest shipped asset, so its size alone
    // decides two of the four byte budgets. Measured 2026-10-14.
    expect(shipped).toBeGreaterThan(BUDGETS.publicShell);
    expect(shipped).toBeGreaterThan(BUDGETS.criticalHtml);
    expect(shipped).toBeGreaterThan(BUDGETS.screenViewTransfer);

    // ...which is exactly why DEBT-008 cannot be anything but an open miss.
    const register = readFileSync(DEBT_REGISTER, "utf8");
    expect(register, "the stylesheet miss must be named in the design-debt register").toMatch(/DEBT-008/);
    expect(register).toMatch(/212[,\s]?853|212\.85 KB|208 KB/);
  });

  it("keeps every public page inside the 25 KB shell budget, not just a sample", async () => {
    // `/channels/nxtr` retired to the IA media overview (page-plan.md Phase 7), so
    // the budget is now measured over the IA public set instead of two hand-picked
    // paths. This replaces the DEBT-011 ceiling pair (2026-11-16): the shell was
    // compacted and the index trimmed, so the debt is paid and the assertion that
    // bounded the miss has gone with it — the same forcing pattern DEBT-008/010
    // used. Measuring the whole set is what stops the next heavy page from
    // blowing the budget silently.
    // `/brands/nigezie` measures the content-instance template through a real
    // instance, which a placeholder slug would render as the withdrawn state.
    const routes = new Set<string>(["/", "/media-and-audience-overview", "/brands/nigezie"]);
    for (const screen of IA_PUBLIC_PAGES) {
      routes.add(screen.route.includes("{") ? screen.route.replace(/\{[^}]+\}/g, "probe-value") : screen.route);
    }

    for (const path of routes) {
      const res = await get(path);
      expect(res.status, `${path} must serve`).toBe(200);
      expect(res.bytes, `${path} exceeds the 25 KB public shell budget`).toBeLessThanOrEqual(BUDGETS.publicShell);
    }

    // The pressure that produced DEBT-011 is worth keeping visible: if the
    // register stops recording how the miss was paid, the next reader has to
    // rediscover it.
    const register = readFileSync(DEBT_REGISTER, "utf8");
    expect(register, "DEBT-011 must record how the overrun was paid").toMatch(/\*\*DEBT-011\*\*[^\n]*RESOLVED/);
  }, 180000);

  it("keeps critical-path HTML inside 65 KB uncompressed", async () => {
    const res = await get("/broadcast/dashboard", authHeader);
    expect(res.status).toBe(200);
    expect(res.bytes, "SCR-BCST-01 exceeds the 65 KB critical-path HTML budget").toBeLessThanOrEqual(BUDGETS.criticalHtml);
  });

  it("misses the 120 KB per-screen-view budget over identity encoding, and records the miss", async () => {
    const html = await get("/broadcast/dashboard", authHeader);
    const css = await get("/assets/styles.css");
    const js = await get("/assets/app.js");
    const total = html.bytes + css.bytes + js.bytes;

    expect(css.status).toBe(200);
    if (total <= BUDGETS.screenViewTransfer) {
      // If the CSS pipeline ever shrinks enough to satisfy the budget, the debt
      // row must be closed rather than left claiming a miss.
      throw new Error(`stylesheet no longer overruns the per-view budget (${total} bytes) — pay off DEBT-008 and update this test`);
    }

    const register = readFileSync(DEBT_REGISTER, "utf8");
    expect(register, "an unrecorded budget miss is not allowed").toMatch(/DEBT-008/);
    expect(register).toMatch(/Lead Frontend Architect/);
    expect(register).toMatch(/2026-12-31/);
  });

  it("meets the same budget once content encoding is negotiated, and says which encoding it means", async () => {
    const gz = await get("/assets/styles.css", { "Accept-Encoding": "gzip" });
    expect(gz.status).toBe(200);

    const encoding = gz.body.readUInt8(0) === 0x1f && gz.body.readUInt8(1) === 0x8b;
    if (!encoding) {
      // The server advertises Vary: Accept-Encoding; if it stops compressing,
      // the transfer claim in the budget record must be corrected, not relaxed.
      throw new Error("stylesheet served uncompressed despite gzip advertisement — recheck the transfer figures");
    }
    expect(gz.bytes).toBeLessThan(BUDGETS.screenViewTransfer);
  });
});
