import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";

function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = options.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe("S-IDENTITY Presentation Shell & RBAC Suite (UX-SYS-001 to 014 / Journey J-RL1-02)", () => {
  let app: ApiServerInstance;
  const testPort = 4215;

  beforeAll(async () => {
    app = createApiServer(testPort, {
      NODE_ENV: "test",
      AUTH_BYPASS_ENABLED: "false",
    });
    await app.start();
  });

  afterAll(async () => {
    await app.stop();
  });

  it("renders UX-SYS-001 Sign In screen with one-click sandbox personas and WCAG form controls", async () => {
    const res = await makeRequest(testPort, "/sign-in");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Enterprise Sign In");
    expect(res.body).toContain("UX-SYS-001");
    expect(res.body).toContain("Sandbox Role Switcher");
    expect(res.body).toContain("signin-email");
    expect(res.body).toContain("signin-password");
    // Verify sandbox personas are present
    expect(res.body).toContain("admin@vmnl.ng");
    expect(res.body).toContain("mcr@vmnl.ng");
    expect(res.body).toContain("director@vmnl.ng");
  });

  it("logs in via one-click sandbox persona and sets HttpOnly vmnl_session cookie", async () => {
    const body = new URLSearchParams({
      email: "mcr@vmnl.ng",
      quickPersona: "true",
      returnUrl: "/broadcast/screens",
    }).toString();

    const res = await makeRequest(testPort, "/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers["location"]).toBe("/broadcast/screens");
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeTruthy();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie || "";
    expect(cookieStr).toContain("vmnl_session=");
    expect(cookieStr).toContain("HttpOnly");
  });

  it("authenticates via valid email and password credentials", async () => {
    const devPass = process.env.DEV_SEED_PASSWORD || "vmnl-dev-seed-pass-2026#secure";
    const body = new URLSearchParams({
      email: "admin@vmnl.ng",
      password: devPass,
      returnUrl: "/admin/feature-flags",
    }).toString();

    const res = await makeRequest(testPort, "/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers["location"]).toBe("/admin/feature-flags");
    const setCookie = res.headers["set-cookie"];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie || "";
    expect(cookieStr).toContain("vmnl_session=");
  });

  it("rejects invalid password with 401 and error notice", async () => {
    const body = new URLSearchParams({
      email: "admin@vmnl.ng",
      password: "wrong-password-123",
    }).toString();

    const res = await makeRequest(testPort, "/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toContain("Authentication Failed");
    expect(res.body).toContain("Invalid email or password");
  });

  it("protects /select-workspace (UX-SYS-006) by requiring authentication", async () => {
    const unauthRes = await makeRequest(testPort, "/select-workspace");
    expect(unauthRes.statusCode).toBe(302);
    expect(unauthRes.headers["location"]).toContain("/sign-in");

    // Authenticated visit
    const token = signSessionToken({
      userId: "usr-mcr",
      personId: "per-mcr",
      email: "mcr@vmnl.ng",
      roles: ["MCRSupervisor", "Operator"],
    }).accessToken;

    const authRes = await makeRequest(testPort, "/select-workspace", {
      headers: { Cookie: `vmnl_session=${token}` },
    });
    expect(authRes.statusCode).toBe(200);
    expect(authRes.body).toContain("Select Operational Workspace");
    expect(authRes.body).toContain("Master Control Room Consoles");
    expect(authRes.body).toContain("SCR-BCST-01 to 33");
    expect(authRes.body).toContain("mcr@vmnl.ng");
  });

  it("logs out via /sign-out, clears session cookie, and revokes session", async () => {
    const token = signSessionToken({
      userId: "usr-mcr",
      personId: "per-mcr",
      email: "mcr@vmnl.ng",
      roles: ["MCRSupervisor"],
    }).accessToken;

    const res = await makeRequest(testPort, "/sign-out", {
      headers: { Cookie: `vmnl_session=${token}` },
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers["location"]).toContain("signed_out=true");
    const setCookie = res.headers["set-cookie"];
    const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie || "";
    expect(cookieStr).toContain("Max-Age=0");
  });

  it("renders UX-SYS-008 Access Denied with role elevation pathways", async () => {
    const res = await makeRequest(testPort, "/access-denied?url=/broadcast/screens/SCR-BCST-01&required=ProgrammeScheduler");
    expect(res.statusCode).toBe(403);
    expect(res.body).toContain("403 Access Unavailable");
    expect(res.body).toContain("ProgrammeScheduler");
    expect(res.body).toContain("Switch Role / Workspace");
    expect(res.body).toContain("Request Elevation");
  });

  it("renders and submits UX-SYS-009 Access Request form", async () => {
    const token = signSessionToken({
      userId: "usr-operator",
      personId: "per-operator",
      email: "operator@vmnl.ng",
      roles: ["Operator"],
    }).accessToken;

    const getRes = await makeRequest(testPort, "/access-request?role=MCRSupervisor", {
      headers: { Cookie: `vmnl_session=${token}` },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toContain("Operational Access Elevation");
    expect(getRes.body).toContain("MCR Supervisor");

    const body = new URLSearchParams({
      role: "MCRSupervisor",
      duration: "SHIFT_8H",
      justification: "Covering MCR supervisor shift during transmission outage",
    }).toString();

    const postRes = await makeRequest(testPort, "/access-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `vmnl_session=${token}`,
      },
      body,
    });
    expect(postRes.statusCode).toBe(302);
  });

  it("enforces RBAC on broadcast screens with friendly sign-in and denial UX", async () => {
    // 1. Unauthenticated request to /broadcast/playout/live yields 401 with sign-in link
    const unauthRes = await makeRequest(testPort, "/broadcast/playout/live");
    expect(unauthRes.statusCode).toBe(401);
    expect(unauthRes.body).toContain("AUTHENTICATION REQUIRED");
    expect(unauthRes.body).toContain("/sign-in?returnUrl=");

    // 2. Authenticated operator without PlayoutOperator/MCRSupervisor role gets 403 Access Denied
    const operatorToken = signSessionToken({
      userId: "usr-talent",
      personId: "per-talent",
      email: "talent@vmnl.ng",
      roles: ["TalentManager"], // SCR-BCST-23 allows PlayoutOperator, MCRSupervisor, BroadcastDirector, SuperAdmin
    }).accessToken;

    const deniedRes = await makeRequest(testPort, "/broadcast/playout/live", {
      headers: { Cookie: `vmnl_session=${operatorToken}` },
    });
    expect(deniedRes.statusCode).toBe(403);
    expect(deniedRes.body).toContain("403 Access Unavailable");

    // 3. Authorized playout operator gets 200 with operator role layout
    const playoutToken = signSessionToken({
      userId: "usr-playout",
      personId: "per-playout",
      email: "playout@vmnl.ng",
      roles: ["PlayoutOperator"],
    }).accessToken;

    const okRes = await makeRequest(testPort, "/broadcast/playout/live", {
      headers: { Cookie: `vmnl_session=${playoutToken}` },
    });
    expect(okRes.statusCode).toBe(200);
    expect(okRes.body).toContain("SCR-BCST-23");
    // Verify navbar displays the authenticated user
    expect(okRes.body).toContain("playout");
    expect(okRes.body).toContain("PlayoutOperator");
    expect(okRes.body).toContain("Sign Out");
  });
});
