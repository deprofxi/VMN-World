/**
 * TSK-58 box 1: cross-tenant refusal proven through an HTTP route, not only at
 * the predicate.
 *
 * The tenant-bearing models are the three that carry a `tenantId` column —
 * `MediaAssetRecord`, `Organisation` and `UserRole` — and this file runs each
 * surface that has a route:
 *
 *   • `MediaAssetRecord` mutating route `POST /api/v1/cms/media-assets`: before
 *     this increment a tenant session could (a) register a key inside another
 *     tenant's `tenants/<id>/` namespace and (b) re-register another tenant's
 *     existing key, which the registry's idempotency lookups answered by
 *     **returning the foreign record** — a write route that read another
 *     tenant's title, checksum and provenance back to the caller.
 *   • `MediaAssetRecord` read-by-reference surface: the CMS editor binds
 *     `mediaAssetIds` into a revision, and `[CMS-11]` checked only that the id
 *     was registered and AVAILABLE — never whose it was. A foreign reference is
 *     now refused with the *same* message an unknown id gets, so the route
 *     cannot be used to discover which ids belong to another tenant.
 *   • `Organisation` reading route `/portal/client/organisations/{orgId}/projects`
 *     for a foreign-tenant subject (asserted here so the box is evidenced in one
 *     place; the pre-existing cases are `tests/unit/client-portal-and-operations.test.ts:284`).
 *   • `UserRole`: no HTTP route writes it — `grep -rn "userRole\\." src/api/router.ts
 *     src/core/rbac/index.ts` returns nothing, and roles arrive on the session
 *     claims. Recorded in `tasks.md` rather than tested against an absent surface.
 *
 * Real **signed** tenant sessions are required: the `x-test-role` harness mints
 * a user with no `tenantId` (src/api/router.ts:733), which is exactly the
 * unscoped caller, so it cannot stand in for a tenant subject.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createHash } from "node:crypto";
import { createApiServer, type ApiServerInstance } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { registerMediaAsset, listApprovedMediaAssets, _resetMediaAssetsForTesting } from "../../src/core/storage/index.js";
import { issueCsrfToken, CSRF_COOKIE_NAME } from "../../src/core/websecurity/index.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";

const TEST_PORT = 4281;
const TENANT_A = "tsk58b1-tenant-a";
const TENANT_B = "tsk58b1-tenant-b";

const ASSET_A = "MA-TSK58B1-A1";
const ASSET_B = "MA-TSK58B1-B1";
// Tenant A's row carries a *legacy* key (no `tenants/<id>/` prefix), which is
// the shape the registry's idempotency lookup actually matches on over HTTP.
const KEY_A = `legacy/${TENANT_A}/master.mp4`;
const KEY_B = `tenants/${TENANT_B}/master.mp4`;
const KEY_PLATFORM = "enterprise/sting.mp4";
const TITLE_A = "Tenant A master — must never surface to tenant B";
const EDIT_CONTENT_ID = "CNT-TSK58B1-EDIT";
// The two ids the CMS-binding refusals POST. They must never exist in Postgres.
const REFUSAL_IDS = ["CNT-TSK58B1-NOPE", "CNT-TSK58B1-NOPE2"];

function request(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = options.body;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path,
        method: options.method || "GET",
        headers: { ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}), ...options.headers },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode || 0, body: data }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * BroadcastDirector derives create/update:content from broadcast authoring.
 * Writes also need a CSRF cookie + header pair (src/api/router.ts:1182): the
 * token is a stateless HMAC, so the test mints one through the same helper the
 * server uses.
 */
function tenantSession(tenantId: string, roles: string[] = ["BroadcastDirector"]): { Cookie: string } {
  const token = signSessionToken({
    userId: `usr-${tenantId}`,
    personId: `per-${tenantId}`,
    email: `director@${tenantId}.vmnl.ng`,
    roles,
    tenantId,
  }).accessToken;
  return { Cookie: `vmnl_session=${token}` };
}

function tenantWriteHeaders(tenantId: string): Record<string, string> {
  const csrf = issueCsrfToken();
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrf,
    Cookie: `${tenantSession(tenantId).Cookie}; ${CSRF_COOKIE_NAME}=${csrf}`,
  };
}

describe("TSK-58 box 1: cross-tenant refusal reaches the HTTP surface", () => {
  let app: ApiServerInstance;

  const fixture = (assetId: string, title: string, assetKey: string, tenantId?: string) =>
    registerMediaAsset({
      assetId,
      title,
      assetKey,
      mimeType: "video/mp4",
      sizeBytes: 8192,
      checksumSha256: createHash("sha256").update(assetKey).digest("hex"),
      provenance: "TSK-58 box 1 fixture",
      virusScanPassed: true,
      registeredBy: `ingest@${tenantId || "platform"}.vmnl.ng`,
      ...(tenantId ? { tenantId } : {}),
    });

  beforeAll(async () => {
    app = createApiServer(TEST_PORT, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();
    // Boot backfills the golden (unowned) library; the three rows below are the
    // scoped set under test, so start from an empty registry.
    _resetMediaAssetsForTesting();
    fixture(ASSET_A, TITLE_A, KEY_A, TENANT_A);
    fixture(ASSET_B, "Tenant B master", KEY_B, TENANT_B);
    fixture("MA-TSK58B1-UNOWNED", "Unowned platform sting", KEY_PLATFORM);
  });

  afterAll(async () => {
    await app.stop();
    _resetMediaAssetsForTesting();
    const db = await checkDatabaseConnection();
    if (db.connected) {
      const prisma = getPrismaClient();
      await prisma.mediaAssetRecord.deleteMany({ where: { id: { in: [ASSET_A, ASSET_B, "MA-TSK58B1-UNOWNED"] } } });
      await prisma.contentRevisionRecord.deleteMany({ where: { contentId: { in: [EDIT_CONTENT_ID, ...REFUSAL_IDS] } } });
      await prisma.contentItemRecord.deleteMany({ where: { id: { in: [EDIT_CONTENT_ID, ...REFUSAL_IDS] } } });
    }
  });

  it("refuses a registration that targets another tenant's namespace, without squatting the key", async () => {
    const squatKey = `tenants/${TENANT_A}/squat.mp4`;
    const res = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        title: "Attempted squat",
        assetKey: squatKey,
        mimeType: "video/mp4",
        sizeBytes: 1024,
        checksumSha256: "b".repeat(64),
        virusScanPassed: true,
      }),
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("MEDIA-ASSET-07");
    // Fail-closed means the row was never created, not merely hidden from B.
    expect(listApprovedMediaAssets({ includeNonAvailable: true }).some((a) => a.assetKey === squatKey)).toBe(false);
  });

  it("refuses to re-register another tenant's key and does not return their record", async () => {
    const res = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        title: "Adoption attempt",
        assetKey: KEY_A,
        mimeType: "video/mp4",
        sizeBytes: 1024,
        checksumSha256: "c".repeat(64),
        virusScanPassed: true,
      }),
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("MEDIA-ASSET-07");
    // The pre-fix behaviour was 201 carrying tenant A's whole record: the
    // registry's idempotency lookup returned the matching foreign row.
    expect(res.body).not.toContain(TITLE_A);
    expect(res.body).not.toContain(createHash("sha256").update(KEY_A).digest("hex"));
    // Tenant A's row is untouched and no twin was minted.
    expect(listApprovedMediaAssets({ tenantId: TENANT_A, includeNonAvailable: true }).map((a) => a.assetId)).toEqual([ASSET_A]);
    expect(listApprovedMediaAssets({ includeNonAvailable: true }).filter((a) => a.assetKey === KEY_A)).toHaveLength(1);
  });

  it("refuses an explicit foreign assetId at the domain seam too", () => {
    // The registration route drops `body.assetId` (src/api/router.ts:8103-8114
    // never reads it), so this is not an HTTP vector today — but the backfill
    // and any future caller pass it, and the guard is in the domain for them.
    expect(() =>
      registerMediaAsset({
        assetId: ASSET_A,
        title: "Domain adoption",
        assetKey: `tenants/${TENANT_B}/adopt.mp4`,
        mimeType: "video/mp4",
        sizeBytes: 1024,
        checksumSha256: "e".repeat(64),
        registeredBy: `b@${TENANT_B}.vmnl.ng`,
        tenantId: TENANT_B,
      })
    ).toThrow(/\[MEDIA-ASSET-07\]/);
  });

  it("still admits a tenant's own re-registration (the guard is not a blanket refusal)", async () => {
    const res = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        title: "Tenant B master",
        assetKey: KEY_B,
        mimeType: "video/mp4",
        sizeBytes: 8192,
        checksumSha256: createHash("sha256").update(KEY_B).digest("hex"),
        virusScanPassed: true,
      }),
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).asset.assetId).toBe(ASSET_B);
  });

  it("refuses a CMS binding of another tenant's asset with the unknown-id message (no existence oracle)", async () => {
    const foreign = await request("/api/v1/workspace/content", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        id: "CNT-TSK58B1-NOPE",
        title: "Foreign media",
        slug: "tsk58b1-foreign-media",
        summary: "s",
        body: "b",
        relatedUnit: "VMNL",
        mediaAssetIds: [ASSET_A],
      }),
    });
    expect(foreign.statusCode).toBe(422);
    const unknown = await request("/api/v1/workspace/content", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        id: "CNT-TSK58B1-NOPE2",
        title: "Unknown media",
        slug: "tsk58b1-unknown-media",
        summary: "s",
        body: "b",
        relatedUnit: "VMNL",
        mediaAssetIds: ["MA-DOES-NOT-EXIST"],
      }),
    });
    expect(unknown.statusCode).toBe(422);
    // Same code, and the only difference between the bodies is the id in the
    // sentence — the route never says the foreign id exists elsewhere.
    const f = JSON.parse(foreign.body), u = JSON.parse(unknown.body);
    expect(f.code).toBe(u.code);
    expect(f.message).toBe(u.message.replace("MA-DOES-NOT-EXIST", ASSET_A));
    expect(foreign.body).not.toContain(TITLE_A);
    // Neither refusal may reach persistence. A starved run on 2026-10-15 wrote one of these
    // rows through an expired Prisma transaction, and the orphan made the next run fail on
    // [CMS-01] "already exists" instead of on the refusal it was asserting.
    const persisted = await getPrismaClient().contentItemRecord.findMany({
      where: { id: { in: [...REFUSAL_IDS] } },
      select: { id: true },
    });
    expect(persisted).toEqual([]);
  });

  it("refuses an edit that binds another tenant's asset, on the mutating route", async () => {
    const own = await request("/api/v1/workspace/content", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        id: EDIT_CONTENT_ID,
        title: "Own media",
        slug: "tsk58b1-own-media",
        summary: "s",
        body: "b",
        relatedUnit: "VMNL",
        mediaAssetIds: [ASSET_B],
      }),
    });
    expect(own.statusCode).toBe(201);

    const cross = await request("/api/v1/workspace/content", {
      method: "PUT",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({ id: EDIT_CONTENT_ID, mediaAssetIds: [ASSET_A] }),
    });
    expect(cross.statusCode).toBe(404);
    expect(cross.body).not.toContain(TITLE_A);

    // The tenant's own reference still binds, so the route is not dead.
    const same = await request("/api/v1/workspace/content", {
      method: "PUT",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({ id: EDIT_CONTENT_ID, mediaAssetIds: [ASSET_B] }),
    });
    expect(same.statusCode).toBe(200);
  });

  it("answers a foreign-tenant subject with 403 on the organisation reading route", async () => {
    // A client-side role carries a tenant but no staff relationship: the portal
    // refuses it outright rather than rendering another organisation's rows.
    const res = await request("/portal/client/organisations/org-dangote/projects", {
      headers: tenantSession(TENANT_B, ["AcademyLearner"]),
    });
    expect(res.statusCode).toBe(403);
    expect(res.body).not.toContain("COMM-DAG-8842");

    // A staff-shaped session is not a loophole either: it fails closed at 503
    // until canonical membership exists (the same rule TSK-13 records).
    const staff = await request("/portal/client/organisations/org-dangote/projects", {
      headers: tenantSession(TENANT_B),
    });
    expect(staff.statusCode).toBe(503);
    expect(staff.body).not.toContain("COMM-DAG-8842");
  });

  it("leaves the unowned platform rows addressable by their own tenant rules, not by silence", async () => {
    // Box 2's fail-closed read rule still holds after box 1's write rule: an
    // unowned row is visible to no tenant session…
    const b = await request("/api/v1/cms/media-assets", { headers: tenantSession(TENANT_B) });
    expect(JSON.parse(b.body).assets.map((a: { assetId: string }) => a.assetId)).not.toContain("MA-TSK58B1-UNOWNED");
    // …and tenant B cannot adopt it through the registration route either.
    const adopt = await request("/api/v1/cms/media-assets", {
      method: "POST",
      headers: tenantWriteHeaders(TENANT_B),
      body: JSON.stringify({
        title: "Adopt the platform sting",
        assetKey: KEY_PLATFORM,
        mimeType: "video/mp4",
        sizeBytes: 1024,
        checksumSha256: "d".repeat(64),
        virusScanPassed: true,
      }),
    });
    expect(adopt.statusCode).toBe(403);
    expect(listApprovedMediaAssets({ includeNonAvailable: true }).find((a) => a.assetId === "MA-TSK58B1-UNOWNED")?.tenantId).toBeUndefined();
  });
});
