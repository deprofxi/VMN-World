/**
 * TSK-23 (report.md CA-10): authoritative engine-backed desk census.
 *
 * CA-10 recorded two divergent hand-sweeps of the same question (10 vs 15 of 48
 * desks "engine-backed"). A sweep by reading is not reproducible, so this suite
 * asks the running router instead: for every registered desk key it issues the
 * real GET /workspace/{key} and classifies what actually came back.
 *
 * Classification is behavioural, not textual-guesswork:
 *   SHELL      — the response is renderWorkspaceDeskHtml's presentation shell
 *                (it carries the shell's "Desk Operating State" panel, which no
 *                dedicated desk page renders).
 *   DEDICATED  — some other handler answered, i.e. the route is really mounted.
 *
 * Authority: tasks.md TSK-23 · Rule 0.2 (evidence before claims).
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import {
  ENTERPRISE_WORKSPACES,
  ENGINE_BACKED_DESK_KEYS,
  renderWorkspaceDeskHtml,
} from "../../src/web/workspace/surface-bc.js";
import { WORKSPACE_HTML_GUARDS } from "../../src/api/router.js";
import { signSessionToken } from "../../src/core/auth/index.js";

/** The panel only the presentation shell emits. */
const SHELL_MARKER = "Desk Operating State";

function makeRequest(
  port: number,
  path: string,
  options: { headers?: Record<string, string> } = {}
): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET", headers: options.headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ statusCode: res.statusCode || 500, body: data, headers: res.headers })
        );
      }
    );
    req.on("error", reject);
    req.end();
  });
}

interface DeskRow {
  key: string;
  status: number;
  shell: boolean;
  anonymousStatus: number;
  lowPrivStatus: number;
  guarded: boolean;
}

describe("TSK-23 (CA-10): authoritative desk census measured through the router", () => {
  let app: ApiServerInstance;
  let port: number;
  let authHeader: Record<string, string>;
  let rows: DeskRow[] = [];

  beforeAll(async () => {
    app = createApiServer(0);
    await app.start();
    port = (app.server.address() as { port: number }).port;
    const { accessToken } = signSessionToken({
      userId: "usr-desk-census",
      personId: "per-desk-census",
      email: "desk-census@vmnl.ng",
      roles: ["SuperAdmin"],
    });
    authHeader = { Authorization: `Bearer ${accessToken}` };
    const operator = signSessionToken({
      userId: "usr-desk-census-op",
      personId: "per-desk-census-op",
      email: "desk-census-op@vmnl.ng",
      roles: ["PlayoutOperator"],
    }).accessToken;
    const operatorHeader = { Authorization: `Bearer ${operator}` };

    const guardedPrefixes = WORKSPACE_HTML_GUARDS.map((g) => g.prefix);
    rows = [];
    const table: string[] = [];
    for (const desk of ENTERPRISE_WORKSPACES) {
      const path = `/workspace/${desk.key}`;
      const authed = await makeRequest(port, path, { headers: authHeader });
      const anon = await makeRequest(port, path);
      const lowPriv = await makeRequest(port, path, { headers: operatorHeader });
      const guard = WORKSPACE_HTML_GUARDS.find((g) => path.startsWith(g.prefix));
      const row = {
        key: desk.key,
        status: authed.statusCode,
        shell: authed.body.includes(SHELL_MARKER),
        anonymousStatus: anon.statusCode,
        lowPrivStatus: lowPriv.statusCode,
        guarded: guardedPrefixes.some((p) => path.startsWith(p)),
      };
      rows.push(row);
      table.push(
        `| ${desk.key} | ${desk.category} | ${desk.primaryRole} | ` +
          `${row.shell ? "shell" : "dedicated handler"} | ${row.anonymousStatus} | ${row.lowPrivStatus} | ` +
          `${guard ? guard.roles.join("/") : "—"} |`
      );
    }

    const shell = rows.filter((r) => r.shell);
    const dedicated = rows.filter((r) => !r.shell);
    console.log(
      `\n[TSK-23] desk census — registered: ${rows.length} · presentation shell: ${shell.length} · ` +
        `dedicated handler answered: ${dedicated.length}`
    );
    console.log(`[TSK-23] dedicated desks: ${dedicated.map((r) => `${r.key} (${r.status})`).join(", ") || "none"}`);
    console.log(
      `[TSK-23] anonymous access to a desk page: 200=${rows.filter((r) => r.anonymousStatus === 200).length} ` +
        `302=${rows.filter((r) => r.anonymousStatus === 302).length} ` +
        `403=${rows.filter((r) => r.anonymousStatus === 403).length} ` +
        `other=${rows.filter((r) => ![200, 302, 403].includes(r.anonymousStatus)).length}`
    );
    console.log(
      `[TSK-23] a PlayoutOperator can open ${rows.filter((r) => r.lowPrivStatus === 200).length} of ${rows.length} ` +
        `desk pages; ${rows.filter((r) => r.lowPrivStatus === 403).length} are role-scoped by WORKSPACE_HTML_GUARDS ` +
        `(${rows.filter((r) => r.guarded).map((r) => r.key).join(", ") || "none"})`
    );
    console.log("[TSK-23] per-desk rows — reproduce: pnpm vitest run tests/unit/desk-census.test.ts");
    for (const line of table) console.log(`[TSK-23] ${line}`);
  });

  afterAll(async () => {
    await app.stop();
  });

  it("registers 48 desk routes and reaches every one of them as an authorized operator", () => {
    expect(ENTERPRISE_WORKSPACES).toHaveLength(48);
    const unreachable = rows.filter((r) => r.status !== 200).map((r) => `${r.key} → ${r.status}`);
    expect(unreachable, `desk routes that did not answer 200: ${unreachable.join(", ")}`).toEqual([]);
  });

  it("classifies every desk by what the router actually served", () => {
    const dedicated = rows.filter((r) => !r.shell).map((r) => r.key).sort();
    // The shell branch answers every registered desk except these — and the
    // exported census list must match the measurement, not somebody's sweep.
    expect(dedicated).toEqual([...ENGINE_BACKED_DESK_KEYS].sort());
    expect(rows.filter((r) => r.shell)).toHaveLength(ENTERPRISE_WORKSPACES.length - dedicated.length);
    expect(rows).toHaveLength(48);
  });

  it("measures how many desk pages any authenticated operator can open", () => {
    const open = rows.filter((r) => r.lowPrivStatus === 200).map((r) => r.key);
    const scoped = rows.filter((r) => r.lowPrivStatus === 403).map((r) => r.key);
    // Recorded, not fixed: role scoping exists for exactly the guarded prefixes.
    expect(scoped.sort()).toEqual(["executive"]);
    expect(open).toHaveLength(47);
    // Nothing is anonymous-readable — sign-in is enforced on every desk route.
    expect(rows.filter((r) => r.anonymousStatus !== 302)).toEqual([]);
  });

  it("no longer asserts a currency the shell cannot know", () => {
    const frozenDate = rows.filter((r) => renderWorkspaceDeskHtml(r.key).includes("2026-09-28")).map((r) => r.key);
    expect(frozenDate, `desk shells still printing a hard-coded date: ${frozenDate.join(", ")}`).toEqual([]);

    const synchronized = rows
      .filter((r) => />Synchronized<\/span>/.test(renderWorkspaceDeskHtml(r.key)))
      .map((r) => r.key);
    expect(synchronized, `desk shells claiming a sync they never performed: ${synchronized.join(", ")}`).toEqual([]);
  });

  it("every desk page states its wiring truthfully", () => {
    // A shell must not claim an operational state it has not measured.
    for (const row of rows.filter((r) => r.shell)) {
      const html = renderWorkspaceDeskHtml(row.key);
      expect(html, `${row.key} shell claims LIVE OPERATING without data`).not.toContain("LIVE OPERATING");
      expect(html, `${row.key} shell claims every workflow is Ready`).not.toContain(">Ready<");
    }
  });
});
