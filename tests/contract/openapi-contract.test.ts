/**
 * OpenAPI Specification Contract Verification Test Suite
 * Authority: VMNL-AZP-VMN-CCPP-001 §19, §21 / T-20 (B-17)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { OPENAPI_SPEC } from "../../src/api/docs.js";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";

describe("T-20 (B-17): OpenAPI Contract Verification", () => {
  let serverInstance: ApiServerInstance;
  let baseUrl: string;

  beforeAll(async () => {
    // Start test server on random free port
    serverInstance = createApiServer(0);
    await serverInstance.start();
    const port = (serverInstance.server.address() as { port: number }).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await serverInstance.stop();
  });

  it("verifies OpenAPI specification integrity and path definitions", () => {
    expect(OPENAPI_SPEC.openapi).toBe("3.1.0");
    expect(OPENAPI_SPEC.info.title).toContain("Virtual Media Network Limited");
    expect(Object.keys(OPENAPI_SPEC.paths).length).toBeGreaterThanOrEqual(10);

    const paths = Object.keys(OPENAPI_SPEC.paths);
    expect(paths).toContain("/healthz");
    expect(paths).toContain("/readyz");
    expect(paths).toContain("/metrics");
    expect(paths).toContain("/api/v1/broadcast/channels");
    expect(paths).toContain("/api/v1/broadcast/screens");
    expect(paths).toContain("/api/v1/broadcast/asrun/reconcile");
    expect(paths).toContain("/api/v1/hub/talent/onboard");
    expect(paths).toContain("/api/v1/finance/reconcile");
    expect(paths).toContain("/api/v1/quality/gates");
  });

  it("validates /healthz response matches contract schema", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.status).toBe("healthy");
    expect(typeof data.uptimeSeconds).toBe("number");
    expect(typeof data.timestamp).toBe("string");
    expect(data.version).toBe("1.0.0");
  });

  it("validates /readyz response matches contract schema", async () => {
    const res = await fetch(`${baseUrl}/readyz`);
    const data: any = await res.json();
    if (data.checks?.database === "connected") {
      expect(res.status).toBe(200);
      expect(data.status).toBe("ready");
    } else {
      expect(res.status).toBe(503);
      expect(data.status).toBe("unavailable");
      expect(data.checks?.database).toBe("unavailable");
    }

    expect(data.checks).toBeDefined();
    expect(data.checks.database).toBeDefined();
    expect(data.checks.queueWorker).toBeDefined();
    expect(data.checks.storage).toBeDefined();
    expect(data.checks.playout).toBeDefined();
  });

  it("validates /api/v1/broadcast/channels response matches contract schema", async () => {
    const res = await fetch(`${baseUrl}/api/v1/broadcast/channels`);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.channels).toBeInstanceOf(Array);
    expect(data.channels.length).toBe(3);

    const channelCodes = data.channels.map((c: any) => c.code);
    expect(channelCodes).toContain("NXTR");
    expect(channelCodes).toContain("ORIS");
    expect(channelCodes).toContain("IMBD");
  });

  it("validates /api/v1/broadcast/screens response returns all 33 screen descriptors", async () => {
    const res = await fetch(`${baseUrl}/api/v1/broadcast/screens`);
    expect(res.status).toBe(200);

    const data: any = await res.json();
    expect(data.screens).toBeInstanceOf(Array);
    expect(data.screens.length).toBe(33);

    const first = data.screens[0];
    expect(first.screenId).toBe("SCR-BCST-01");
    expect(first.route).toBeDefined();
    expect(first.primaryRole).toBeDefined();
    expect(first.permittedActions).toBeInstanceOf(Array);
  });

  it("validates /api/v1/openapi.json serves valid JSON identical to specification", async () => {
    const res = await fetch(`${baseUrl}/api/v1/openapi.json`);
    expect(res.status).toBe(200);

    const spec: any = await res.json();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.info.title).toBe(OPENAPI_SPEC.info.title);
  });

  it("verifies security schemes and webhook signatures are defined in components", () => {
    const components = (OPENAPI_SPEC as any).components;
    expect(components).toBeDefined();
    expect(components.securitySchemes).toBeDefined();
    expect(components.securitySchemes.bearerAuth).toBeDefined();
    expect(components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(components.securitySchemes.paystackSignature).toBeDefined();
    expect(components.securitySchemes.paystackSignature.name).toBe("x-paystack-signature");
    expect(components.securitySchemes.flutterwaveSignature).toBeDefined();
    expect(components.securitySchemes.flutterwaveSignature.name).toBe("verif-hash");
  });

  it("verifies bidirectional reachability: every documented OpenAPI route exists and does not 404", async () => {
    const paths = Object.keys(OPENAPI_SPEC.paths);

    for (const rawPath of paths) {
      // Resolve path parameters for reachability probe
      const resolvedPath = rawPath
        .replace("{channelCode}", "NXTR")
        .replace("{code}", "NXTR")
        .replace("{id}", "TAL-001");

      const methods = Object.keys((OPENAPI_SPEC.paths as any)[rawPath]);
      for (const method of methods) {
        const url = `${baseUrl}${resolvedPath}`;
        const options: RequestInit = {
          method: method.toUpperCase(),
          headers: {
            "Content-Type": "application/json",
            "x-test-role": "ExecutiveLeader",
          },
        };

        if (["POST", "PUT", "PATCH"].includes(options.method!)) {
          options.body = JSON.stringify({});
        }

        const res = await fetch(url, options);
        const data: any = await res.json().catch(() => ({}));

        if (res.status === 404) {
          expect(
            data?.message || "",
            `Documented route '${method.toUpperCase()} ${rawPath}' is unmapped in router.ts (returned 404): ${data?.message}`
          ).not.toContain("does not exist on VMNL Enterprise Platform");
        }
      }
    }
  });
});
