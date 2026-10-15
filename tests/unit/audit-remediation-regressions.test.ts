import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import zlib from "node:zlib";
import http from "node:http";
import { renderMasterLayout, serializeJsonLd } from "../../src/web/public/dashboard.js";
import { PUBLIC_INDEXABLE_ROUTES } from "../../src/web/public/public-route-registry.js";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { issueCsrfToken } from "../../src/core/websecurity/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { claimProviderEvent } from "../../src/core/database/repositories/release-critical.repository.js";

function request(port: number, pathname: string, options: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
} = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string; raw: Buffer }> {
  return new Promise((resolve, reject) => {
    const body = options.body;
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: pathname,
      method: options.method || "GET",
      headers: { ...(body ? { "Content-Length": String(Buffer.byteLength(body)) } : {}), ...options.headers },
    }, (res) => {
      // Buffer-accumulate so binary bodies (gzip) stay byte-exact.
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => { chunks.push(chunk); });
      res.on("end", () => {
        const raw = Buffer.concat(chunks);
        resolve({ status: res.statusCode || 0, headers: res.headers, body: raw.toString("utf8"), raw });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

describe("verified audit remediations", () => {
  it("escapes JSON-LD delimiters and omits canonical metadata from unregistered paths", () => {
    const payload = `</script><script>alert(1)</script>&\u2028`;
    const serialized = serializeJsonLd({ description: payload });
    expect(serialized).toContain('"description":"\\u003c/script\\u003e\\u003cscript\\u003e');
    expect(serialized).toContain("\\u0026\\u2028");
    expect(serialized).not.toContain("</script><script>alert(1)");
    const html = renderMasterLayout("Page", "<p>body</p>", "/workspace/private");
    expect(html).not.toContain('<link rel="canonical" href="https://vmnl.ng/workspace/private"');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  });

  it("only places live registered public URLs in the indexable registry", () => {
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/hub/vtm" as never);
    expect(PUBLIC_INDEXABLE_ROUTES).not.toContain("/programmes/:id" as never);
  });

  it("keeps canonical/noindex metadata in parity with the public-route registry (AUD-23)", () => {
    for (const route of PUBLIC_INDEXABLE_ROUTES) {
      const html = renderMasterLayout("Parity", "<p>body</p>", route);
      const expectedHref = route === "/" ? "https://vmnl.ng" : `https://vmnl.ng${route}`;
      expect(html).toContain(`<link rel="canonical" href="${expectedHref}">`);
      expect(html).not.toContain("noindex");
    }
    // Unregistered routes (auth-gated, private, alias or dynamic) must stay
    // non-indexable with no canonical signal — never regress to silent drift.
    for (const route of ["/vtm/terms", "/workspace/private", "/programmes/PRG-999"]) {
      const html = renderMasterLayout("Parity", "<p>body</p>", route);
      expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
      expect(html).not.toContain('rel="canonical"');
    }
  });

  describe("HTTP boundaries", () => {
    let server: ApiServerInstance;
    let port: number;
    const previousPaystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const previousNodeEnv = process.env.NODE_ENV;
    const email = "audit-regression@vmnl.ng";
    const token = signSessionToken({ userId: "audit-regression", personId: "audit-regression", email, roles: ["SuperAdmin"] }).accessToken;

    it("requires CSRF on cookie-authenticated writes, denies cross-site origins, and preserves public intake", async () => {
      process.env.PAYSTACK_SECRET_KEY = "audit-paystack-secret-key-minimum-32-chars";
      process.env.NODE_ENV = "test";
      server = createApiServer(0, {
        NODE_ENV: "test",
        SESSION_SECRET: "audit-csrf-session-secret-at-least-32-bytes",
      });
      await server.start();
      port = (server.server.address() as { port: number }).port;
      const cookie = `vmnl_session=${token}`;

      const csrfJson = await request(port, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ enabled: true, reason: "csrf test" }),
      });
      expect(csrfJson.status).toBe(403);
      expect(csrfJson.body).toContain("CSRF_CHECK_FAILED");

      const validToken = issueCsrfToken();
      const validCookie = `${cookie}; vmnl_csrf=${validToken}`;
      const validCookieWrite = await request(port, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: validCookie,
          "X-CSRF-Token": validToken,
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ enabled: true, reason: "valid csrf test" }),
      });
      expect(validCookieWrite.status).toBe(200);

      const crossSite = await request(port, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
          Origin: "https://attacker.invalid",
          "Sec-Fetch-Site": "cross-site",
        },
        body: JSON.stringify({ enabled: true, reason: "cross-site test" }),
      });
      expect(crossSite.status).toBe(403);
      expect(crossSite.body).toContain("INVALID_ORIGIN");

      const csrfForm = await request(port, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method: "PATCH",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
        body: "enabled=true&reason=csrf-test",
      });
      expect(csrfForm.status).toBe(403);

      const publicIntake = await request(port, "/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          fullName: "Audit Test",
          email: "audit-public-intake@example.test",
          vertical: "GENERAL_ENQUIRY",
          message: "This is a public intake CSRF regression test.",
          ndprConsent: "true",
        }).toString(),
      });
      expect(publicIntake.status).toBe(201);

      const bearer = await request(port, "/api/v1/feature-flags/FF_PUBLIC_SURFACE_ENABLED", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: true, reason: "bearer test" }),
      });
      expect(bearer.status).toBe(200);
    });

    it("rejects incomplete signed payments and unsupported event types before ingestion", async () => {
      const secret = "audit-paystack-secret-key-minimum-32-chars";
      const postPaystack = async (event: string, data: Record<string, unknown>) => {
        const body = JSON.stringify({ event, data });
        const signature = createHmac("sha512", secret).update(body).digest("hex");
        return request(port, "/api/v1/webhooks/paystack", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-paystack-signature": signature },
          body,
        });
      };

      // TSK-19: run-unique event id, because the durable claim makes one provider
      // event id single-use for the life of the database. A fixed id would silently
      // degrade every later run into a duplicate-path test that believes it is
      // measuring a fresh delivery.
      const eventId = Number(`${Date.now()}`.slice(-12));
      const charge = { id: eventId, reference: `audit-charge-${eventId}`, amount: 1000, currency: "NGN", status: "success" };

      const missingFields = await postPaystack("charge.success", { id: eventId, amount: 1000 });
      expect(missingFields.status).toBe(400);
      expect(missingFields.body).toContain("PAYSTACK_EVENT_INVALID");

      const unsupported = await postPaystack("transfer.success", { ...charge, id: eventId + 1 });
      expect(unsupported.status).toBe(501);
      expect(unsupported.body).toContain("PAYSTACK_EVENT_UNSUPPORTED");

      // A refused event must not have taken the claim: the provider's next attempt
      // for the same id has to be able to land.
      const db = await checkDatabaseConnection();
      if (db.connected) {
        const refused = await getPrismaClient().providerEventClaim.findMany({
          where: { provider: "paystack", eventId: { in: [String(eventId), String(eventId + 1)] } },
        });
        expect(refused).toEqual([]);
      }

      const valid = await postPaystack("charge.success", charge);
      expect(valid.status).toBe(200);
      expect(valid.body).toContain("Paystack webhook processed");
      expect(valid.body).not.toContain('"duplicate":true');

      const replay = await postPaystack("charge.success", charge);
      expect(replay.status).toBe(200);
      expect(replay.body).toContain('"duplicate":true');
      expect(replay.body).toContain("Paystack webhook duplicate acknowledged");

      if (db.connected) {
        // Exactly one claim row for two deliveries — the constraint, not a counter.
        const rows = await getPrismaClient().providerEventClaim.findMany({
          where: { provider: "paystack", eventId: String(eventId) },
        });
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe(`paystack:${eventId}`);
        await getPrismaClient().providerEventClaim.deleteMany({
          where: { provider: "paystack", eventId: String(eventId) },
        });
      } else {
        console.warn(`[TSK-19] SKIP durable claim row check: no reachable Postgres (${db.error}).`);
      }
    });

    it("re-processes a provider retry whose earlier attempt claimed the event and never ingested it (TSK-19)", async () => {
      const secret = "audit-paystack-secret-key-minimum-32-chars";
      const postPaystack = async (event: string, data: Record<string, unknown>) => {
        const body = JSON.stringify({ event, data });
        const signature = createHmac("sha512", secret).update(body).digest("hex");
        return request(port, "/api/v1/webhooks/paystack", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-paystack-signature": signature },
          body,
        });
      };

      const eventId = Number(`8${Date.now()}`.slice(-12));
      const charge = { id: eventId, reference: `abandoned-${eventId}`, amount: 1500, currency: "NGN", status: "success" };
      const rowId = `paystack:${eventId}`;

      const db = await checkDatabaseConnection();
      if (db.connected) {
        // A previous process took the claim and died before reaching the engine.
        // That row records an attempt, not a delivered payment.
        expect(await claimProviderEvent("paystack", String(eventId))).toBe(true);
        const abandoned = await getPrismaClient().providerEventClaim.findUnique({ where: { id: rowId } });
        expect(abandoned?.ingestedAt).toBeNull();
      }

      const retry = await postPaystack("charge.success", charge);
      expect(retry.status).toBe(200);
      expect(retry.body).toContain("Paystack webhook processed");
      expect(retry.body).not.toContain('"duplicate":true');

      if (!db.connected) {
        console.warn(`[TSK-19] SKIP abandoned-claim takeover: no reachable Postgres (${db.error}).`);
        return;
      }

      const stamped = await getPrismaClient().providerEventClaim.findUnique({ where: { id: rowId } });
      expect(stamped?.ingestedAt).toBeInstanceOf(Date);

      // Now the same event id is a real replay and is refused — and refusing it
      // must not roll the delivered payment's stamp back.
      const replay = await postPaystack("charge.success", charge);
      expect(replay.body).toContain('"duplicate":true');
      const afterReplay = await getPrismaClient().providerEventClaim.findUnique({ where: { id: rowId } });
      expect(afterReplay?.ingestedAt).toBeInstanceOf(Date);

      await getPrismaClient().providerEventClaim.deleteMany({ where: { id: rowId } });
    });

    it("blocks financial portal views until canonical relationship support exists", async () => {
      const paths = ["/portal/partner/ORG-PART-01", "/portal/creator/CRT-2026-09", "/portal/vendor/VND-2026-04"];
      for (const pathname of paths) {
        const response = await request(port, pathname, { headers: { "x-test-role": "SuperAdmin" } });
        expect(response.status).toBe(503);
        expect(response.body).not.toContain("amount");
        expect(response.body).not.toContain("totalContractValue");
      }
    });

    it("keeps the mutable stable Open Graph image on revalidation caching", async () => {
      const response = await request(port, "/assets/og-vmnl-master.png");
      expect(response.status).toBe(200);
      expect(response.headers["cache-control"]).toBe("public, max-age=0, must-revalidate");
      expect(response.headers["content-type"]).toContain("image/png");
    });

    it("compresses large JSON off the event loop and leaves small responses uncompressed (AUD-17)", async () => {
      const gzipped = await request(port, "/api/v1/openapi.json", { headers: { "Accept-Encoding": "gzip" } });
      expect(gzipped.status).toBe(200);
      expect(gzipped.headers["content-encoding"]).toBe("gzip");
      const decompressed = JSON.parse(zlib.gunzipSync(gzipped.raw).toString("utf8"));
      expect(decompressed.openapi).toBeDefined();

      const small = await request(port, "/healthz", { headers: { "Accept-Encoding": "gzip" } });
      expect(small.status).toBe(200);
      expect(small.headers["content-encoding"]).toBeUndefined();
    });

    it("surfaces audit durability and KV backend in the readiness payload (AUD-05/AUD-04)", async () => {
      const ready = await request(port, "/readyz");
      expect([200, 503]).toContain(ready.status);
      const payload = JSON.parse(ready.body);
      expect(["memory", "prisma", "prisma_error"]).toContain(payload.checks.auditPersistence);
      expect(typeof payload.checks.auditChainSequence).toBe("number");
      // TSK-18: a ledger entry that rolled back with its transaction must be
      // countable from outside the process, not only in the log stream.
      expect(typeof payload.checks.auditDurableFailures).toBe("number");
      expect(Number.isInteger(payload.checks.auditDurableFailures)).toBe(true);
      expect(["redis", "memory"]).toContain(payload.checks.kvBackend);
      expect(typeof payload.checks.kvHealthy).toBe("boolean");
    });

    it("releases the server and restores global test settings", async () => {
      await server.stop();
      if (previousPaystackSecret === undefined) delete process.env.PAYSTACK_SECRET_KEY;
      else process.env.PAYSTACK_SECRET_KEY = previousPaystackSecret;
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    });
  });

  it("refuses boot when the sandbox fallback is enabled in production/staging (AUD-10)", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousFallback = process.env.ALLOW_SANDBOX_FALLBACK;
    try {
      process.env.ALLOW_SANDBOX_FALLBACK = "true";

      process.env.NODE_ENV = "production";
      expect(() => createApiServer(0, { NODE_ENV: "production" })).toThrow(
        /ALLOW_SANDBOX_FALLBACK=true is forbidden in production\/staging/
      );

      process.env.NODE_ENV = "staging";
      expect(() => createApiServer(0, { NODE_ENV: "staging" })).toThrow(
        /fail closed when the database is unavailable/
      );

      // Explicit development/test deployments retain the escape hatch.
      process.env.NODE_ENV = "test";
      expect(() => createApiServer(0, { NODE_ENV: "test" })).not.toThrow();
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
      if (previousFallback === undefined) delete process.env.ALLOW_SANDBOX_FALLBACK;
      else process.env.ALLOW_SANDBOX_FALLBACK = previousFallback;
    }
  });
});
