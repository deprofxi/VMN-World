import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import {
  getSystemConfig,
  updateSystemConfig,
  resetSystemConfig,
  getEnvironmentPosture,
  _resetSystemConfigForTesting,
} from "../../src/core/config/system-config.js";
import { getBrandConfig } from "../../src/core/branding/logo-service.js";
import { _getAuditLogStoreForTesting } from "../../src/core/audit/index.js";
import { renderMasterLayout, renderHomePageHtml } from "../../src/web/public/dashboard.js";
import { CLIENT_BOOTSTRAP_JS } from "../../src/web/assets/index.js";

function httpRequest(
  port: number,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const payload = options.body !== undefined ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode || 500, body: data, headers: res.headers }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe("Header & Footer Rework, Logo Customizer Removal, and SuperAdmin System Configuration", () => {
  let app: ApiServerInstance;
  let port = 0;
  let superAdminToken = "";
  let executiveToken = "";
  let operatorToken = "";

  beforeAll(async () => {
    app = createApiServer(0);
    await app.start();
    port = (app.server.address() as { port: number }).port;
    superAdminToken = signSessionToken({
      userId: "usr-superadmin-test",
      personId: "per-superadmin-test",
      email: "superadmin@vmnl.ng",
      roles: ["SuperAdmin"],
    }).accessToken;
    executiveToken = signSessionToken({
      userId: "usr-exec-test",
      personId: "per-exec-test",
      email: "exec@vmnl.ng",
      roles: ["ExecutiveLeader"],
    }).accessToken;
    operatorToken = signSessionToken({
      userId: "usr-op-test",
      personId: "per-op-test",
      email: "operator@vmnl.ng",
      roles: ["Operator"],
    }).accessToken;
  });

  afterAll(async () => {
    await app.stop();
  });

  beforeEach(() => {
    _resetSystemConfigForTesting();
  });

  it("removes the public Customize Logo button, modal, and localStorage customizer", () => {
    const html = renderMasterLayout("Home", renderHomePageHtml(), "/");
    expect(html).not.toContain("Customize Logo");
    expect(html).not.toContain("vmn-footer-logo-trigger");
    expect(html).not.toContain("vmn-logo-modal-trigger");
    expect(html).not.toContain("Brand Logo Customizer");
    expect(CLIENT_BOOTSTRAP_JS).not.toContain("Brand Logo Customizer");
    expect(CLIENT_BOOTSTRAP_JS).not.toContain("vmn-footer-logo-trigger");
    expect(CLIENT_BOOTSTRAP_JS).not.toContain("vmn-custom-logo");
  });

  it("renders the reworked header and architectural footer and surfaces System Config only for SuperAdmin", () => {
    const publicHtml = renderMasterLayout("Home", renderHomePageHtml(), "/");
    expect(publicHtml).toContain('class="vmn-navbar"');
    expect(publicHtml).toContain('class="vmn-navbar-inner"');
    expect(publicHtml).toContain('class="vmn-footer-nav"');
    expect(publicHtml).not.toContain('href="/admin/system-config"');

    const operatorWorkHtml = renderMasterLayout("Work", "<div>Body</div>", "/workspace", {
      shell: "work",
      sessionUser: {
        userId: "usr-op",
        personId: "per-op",
        email: "op@vmnl.ng",
        roles: ["Operator"],
      },
    });
    expect(operatorWorkHtml).not.toContain('href="/admin/system-config"');

    const adminWorkHtml = renderMasterLayout("Work", "<div>Body</div>", "/workspace", {
      shell: "work",
      sessionUser: {
        userId: "usr-sa",
        personId: "per-sa",
        email: "admin@vmnl.ng",
        roles: ["SuperAdmin"],
      },
    });
    expect(adminWorkHtml).toContain('href="/admin/system-config"');
  });

  it("updates and resets SystemConfig with brand sync, audit logging, and non-secret posture", () => {
    const auditBefore = _getAuditLogStoreForTesting().length;

    const updated = updateSystemConfig(
      {
        brandName: "VMNL Broadcast Group",
        brandShort: "VMNG",
        logoUrl: "/assets/brand-test.svg",
        sessionTtlHours: 12,
        maintenanceBannerEnabled: true,
        maintenanceBannerMessage: "Scheduled maintenance at 02:00 WAT",
      },
      { userId: "usr-super", email: "admin@vmnl.ng" }
    );

    expect(updated.brandShort).toBe("VMNG");
    expect(updated.sessionTtlHours).toBe(12);
    expect(getBrandConfig().logoUrl).toBe("/assets/brand-test.svg");
    expect(_getAuditLogStoreForTesting().length).toBe(auditBefore + 1);
    expect(_getAuditLogStoreForTesting().at(-1)?.action).toBe("system_config.update");

    const posture = getEnvironmentPosture();
    expect(posture.databaseConfigured).toBe(true);
    expect(JSON.stringify(posture)).not.toContain("JWT_SECRET");

    const reset = resetSystemConfig({ userId: "usr-super", email: "admin@vmnl.ng" });
    expect(reset.brandShort).toBe("VMN World");
    expect(getBrandConfig().logoUrl).toBeNull();
    expect(getSystemConfig().revision).toBe(reset.revision);
  });

  it("strictly enforces SuperAdmin-only access on /admin/system-config HTML and API endpoints", async () => {
    // 1. HTML routes
    const anonHtml = await httpRequest(port, "/admin/system-config");
    expect(anonHtml.status).toBe(302);
    expect(anonHtml.headers.location).toBe("/sign-in?returnUrl=%2Fadmin%2Fsystem-config");

    const execHtml = await httpRequest(port, "/admin/system-config", {
      headers: { Authorization: `Bearer ${executiveToken}` },
    });
    expect(execHtml.status).toBe(403);

    const opHtml = await httpRequest(port, "/workspace/admin/system-config", {
      headers: { Authorization: `Bearer ${operatorToken}` },
    });
    expect(opHtml.status).toBe(403);

    const adminHtml = await httpRequest(port, "/admin/system-config", {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    expect(adminHtml.status).toBe(200);
    expect(adminHtml.body).toContain("Enterprise System Configuration");
    expect(adminHtml.body).toContain("SUPER ADMIN ACCESS ONLY");

    // 2. API GET & mutations
    expect((await httpRequest(port, "/api/v1/admin/system-config")).status).toBe(401);
    expect(
      (
        await httpRequest(port, "/api/v1/admin/system-config", {
          headers: { Authorization: `Bearer ${executiveToken}` },
        })
      ).status
    ).toBe(403);

    expect(
      (
        await httpRequest(port, "/api/v1/admin/system-config", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${operatorToken}` },
          body: { brandShort: "HACKED" },
        })
      ).status
    ).toBe(403);

    expect(
      (
        await httpRequest(port, "/api/v1/branding/logo", {
          method: "POST",
          headers: { Authorization: `Bearer ${operatorToken}` },
          body: { logoDataUrl: "https://example.com/x.png" },
        })
      ).status
    ).toBe(403);

    // 3. SuperAdmin mutation succeeds and reflects in rendered homepage
    const patchRes = await httpRequest(port, "/api/v1/admin/system-config", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        brandShort: "VMN Pro",
        maintenanceBannerEnabled: true,
        maintenanceBannerMessage: "Playout failover rehearsal active",
      },
    });
    expect(patchRes.status).toBe(200);
    const parsedPatch = JSON.parse(patchRes.body);
    expect(parsedPatch.success).toBe(true);
    expect(parsedPatch.config.brandShort).toBe("VMN Pro");

    const homeRes = await httpRequest(port, "/");
    expect(homeRes.status).toBe(200);
    expect(homeRes.body).toContain("VMN Pro");
    expect(homeRes.body).toContain("Playout failover rehearsal active");

    // 4. Reset requires SuperAdmin
    expect(
      (
        await httpRequest(port, "/api/v1/admin/system-config/reset", {
          method: "POST",
          headers: { Authorization: `Bearer ${executiveToken}` },
          body: {},
        })
      ).status
    ).toBe(403);

    const resetRes = await httpRequest(port, "/api/v1/admin/system-config/reset", {
      method: "POST",
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {},
    });
    expect(resetRes.status).toBe(200);
    expect(JSON.parse(resetRes.body).config.brandShort).toBe("VMN World");
  });
});
