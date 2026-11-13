/**
 * VMN World IA R1.1 — dispatch behaviour.
 *
 * Exercises the same entry point the router calls, so the tests cover path
 * acceptance, decline-to-legacy behaviour, status codes and cache headers
 * without booting a database-backed HTTP server.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../src/core/auth/index.js";
import { dispatchIARoute } from "../../src/api/routes/ia.routes.js";
import type { RouteContext } from "../../src/api/routes/types.js";

interface Captured {
  status: number;
  body: string;
  headers: Record<string, string | number>;
}

function createResponse(url: string): { res: ServerResponse; captured: Captured } {
  const captured: Captured = { status: 0, body: "", headers: {} };
  const res = {
    req: { method: "GET", url, headers: {} as Record<string, string> },
    setHeader(name: string, value: string | number) {
      captured.headers[name] = value;
    },
    writeHead(status: number, headers?: Record<string, string | number>) {
      captured.status = status;
      if (headers) Object.assign(captured.headers, headers);
      return res;
    },
    end(chunk?: string | Buffer) {
      if (chunk) captured.body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    },
  };
  return { res: res as unknown as ServerResponse, captured };
}

async function dispatch(
  url: string,
  options: { method?: string; user?: SessionUser | null } = {}
): Promise<{ handled: boolean; captured: Captured }> {
  const { res, captured } = createResponse(url);
  const parsedUrl = new URL(url, "http://localhost");
  const handled = await dispatchIARoute({
    req: { method: options.method ?? "GET", url, headers: {} } as unknown as IncomingMessage,
    res,
    pathname: parsedUrl.pathname,
    method: options.method ?? "GET",
    parsedUrl,
    user: options.user ?? null,
  } as RouteContext);
  return { handled, captured };
}

const USER: SessionUser = {
  userId: "u-1",
  personId: "p-1",
  email: "operator@vmnl.ng",
  roles: ["BroadcastOperationsManager"],
};

describe("IA dispatch", () => {
  it("serves a public inventory route with revalidating public caching", async () => {
    const { handled, captured } = await dispatch("/ecosystem");
    expect(handled).toBe(true);
    expect(captured.status).toBe(200);
    expect(captured.headers["Content-Type"]).toBe("text/html; charset=utf-8");
    expect(captured.headers["Cache-Control"]).toBe("public, max-age=0, must-revalidate");
    expect(captured.body).toContain("IA-PUB-003");
  });

  it("takes over the legacy home and about URLs with the inventory contract", async () => {
    const home = await dispatch("/");
    expect(home.handled).toBe(true);
    expect(home.captured.body).toContain("IA-PUB-001");

    const about = await dispatch("/about");
    expect(about.handled).toBe(true);
    expect(about.captured.body).toContain("IA-PUB-002");
    // The retained corporate content is still rendered inside the IA page.
    expect(about.captured.body).toContain("About Virtual Media Network Limited");
  });

  it("declines the platform-owned identity routes", async () => {
    for (const path of ["/sign-in", "/login"]) {
      const { handled } = await dispatch(path);
      expect(handled, `${path} must stay with the identity chain`).toBe(false);
    }
  });

  it("declines unknown paths so the existing 404 chain still answers", async () => {
    const { handled, captured } = await dispatch("/not-an-inventory-route");
    expect(handled).toBe(false);
    expect(captured.status).toBe(0);
  });

  it("serves GET only", async () => {
    const { handled } = await dispatch("/about", { method: "POST" });
    expect(handled).toBe(false);
  });

  it("denies an anonymous gated request with 401 and private caching", async () => {
    const { handled, captured } = await dispatch("/broadcast/broadcast-service-registry");
    expect(handled).toBe(true);
    expect(captured.status).toBe(401);
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
    expect(captured.body).toContain("Sign in to open this screen");
  });

  it("renders an authenticated gated request without exposing any record", async () => {
    const { captured } = await dispatch("/broadcast/broadcast-service-registry", { user: USER });
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("Source not connected");
    expect(captured.headers["Cache-Control"]).toBe("private, no-store");
  });

  it("passes the query through to the public search screen", async () => {
    const { captured } = await dispatch("/search?q=governance");
    expect(captured.status).toBe(200);
    expect(captured.body).toContain("value=\"governance\"");
    expect(captured.body).toContain("/corporate-governance-overview");
  });
});
