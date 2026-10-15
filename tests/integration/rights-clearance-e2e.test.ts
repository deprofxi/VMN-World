/**
 * TSK-14 (report.md CA-32) — the two rights implementations are one context, and a
 * cleared review request really does satisfy the gate.
 *
 * CA-32's complaint was that `src/core/rights` (review-request workflow) and
 * `src/modules/broadcast/rights` (clearance gate) never spoke to each other: the
 * request half was wired and tested, so the domain *looked* covered while the gate
 * was decided on a caller-authored copy of a RightsRecord. The four checks below are
 * the closure conditions, in the order the register states them:
 *
 *   1. one rights context owns both halves (`src/modules/broadcast/rights`);
 *   2. a cleared review request writes the same durable RightsRecord the gate reads;
 *   3. the naming collision is gone — nothing in the product calls the workflow a
 *      waiver, and `src/core/rights` no longer exists;
 *   4. end-to-end over HTTP, not unit-isolated: blocked slot → request → evidence →
 *      resolution → the same request now passes the gate.
 *
 * Negative controls are part of the claim: a retained block writes nothing, clearing
 * without authoritative evidence is refused, and a phantom RightsRecord cannot be
 * cleared at all.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { createApiServer, ApiServerInstance } from "../../src/api/server.js";
import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { RightsRepository } from "../../src/core/database/repositories/rights.repository.js";
import {
  rightsRepository,
  _resetRightsReviewRequestsForTesting,
} from "../../src/modules/broadcast/rights/index.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4288;
const RECORD_ID = "rr-tsk14-e2e";

const START = new Date(Date.UTC(2026, 0, 1));
const BLOCKED_EXPIRY = new Date(Date.UTC(2026, 8, 30));
const CLEARED_EXPIRY = new Date(Date.UTC(2026, 11, 31));

// Slot 20:30–21:45 WAT on 2026-10-20: finishes 55 min after the blocked expiry.
const AIR_TIME = "2026-10-20T19:30:00.000Z";
const AIR_SECONDS = 4500;

function postJson(
  p: string,
  payload: unknown,
  role = "RightsManager"
): Promise<{ statusCode: number; json: any }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path: p,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...(role ? { "x-test-role": role } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 0, json: data ? JSON.parse(data) : null });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const gateCheck = (role = "RightsManager") =>
  postJson("/api/v1/broadcast/rights/validate", {
    rightsRecordId: RECORD_ID,
    episodeId: "ep-urban-4102",
    channelCode: "NXTR",
    scheduledAirTime: AIR_TIME,
    scheduledDurationSeconds: AIR_SECONDS,
    targetTerritory: "NG",
  }, role);

async function openRequest(overrides: Record<string, unknown> = {}) {
  const res = await postJson("/api/v1/broadcast/rights/review-requests", {
    slotId: "SLOT-4102",
    carrier: "NXTR",
    distributor: "Afro-Beat Media Global",
    justification: "Signed addendum extends the exploitation window through 31 Dec 2026.",
    rightsRecordId: RECORD_ID,
    intendedUse: "Linear transmission on NXTR, 20:30-21:45 WAT",
    observedBlocker: "POST_EXPIRY_DATE — slot finishes after the recorded rights expiry",
    receivingOwner: "Broadcast Rights Coordinator",
    ...overrides,
  });
  expect(res.statusCode, JSON.stringify(res.json)).toBe(200);
  return res.json as { requestId: string; ticketId: string };
}

/** RECEIVED -> ASSIGNED -> EVIDENCE_REVIEW: the only route to a resolution. */
async function advanceToEvidenceReview(requestId: string) {
  for (const targetStatus of ["ASSIGNED", "EVIDENCE_REVIEW"]) {
    const step = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/transition`, { targetStatus });
    expect(step.statusCode, JSON.stringify(step.json)).toBe(200);
    expect(step.json.requestStatus).toBe(targetStatus);
  }
}

let dbConnected = false;

describe("TSK-14 (CA-32): one rights context, and a cleared review satisfies the gate", () => {
  let app: ApiServerInstance;

  beforeAll(async () => {
    app = createApiServer(PORT, { NODE_ENV: "test", AUTH_BYPASS_ENABLED: "false" });
    await app.start();

    const db = await checkDatabaseConnection();
    dbConnected = db.connected;
    console.log(
      `\n[TSK-14] rights clearance path under test: ${dbConnected ? "Postgres (fail_closed)" : "in-memory sandbox (Rule 0.4a — not persistence)"}`
    );

    await rightsRepository.upsert({
      id: RECORD_ID,
      assetId: "ast-urban-4102",
      title: "Urban Sound Showcase #4102",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      channelCode: "NXTR",
      exclusivity: false,
      startDate: START,
      expiryDate: BLOCKED_EXPIRY,
      subLicensable: false,
    });
  });

  afterAll(async () => {
    await app.stop();
    if (dbConnected) {
      try {
        await getPrismaClient().rightsRecord.deleteMany({ where: { id: RECORD_ID } });
      } catch {
        // the row is a fixture, not a gate; a failed cleanup must not mask a result
      }
    }
    _resetRightsReviewRequestsForTesting();
  });

  beforeEach(async () => {
    _resetRightsReviewRequestsForTesting();
    await rightsRepository.upsert({
      id: RECORD_ID,
      assetId: "ast-urban-4102",
      title: "Urban Sound Showcase #4102",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      channelCode: "NXTR",
      exclusivity: false,
      startDate: START,
      expiryDate: BLOCKED_EXPIRY,
      subLicensable: false,
    });
  });

  it("hosts one rights context and removes the colliding one", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "src/core/rights"))).toBe(false);
    const contextDir = path.join(REPO_ROOT, "src/modules/broadcast/rights");
    // clearance + review-request (TSK-14), plus the registry and the schedule
    // clearance link that make the gate authoritative (TSK-10).
    expect(fs.readdirSync(contextDir).sort()).toEqual([
      "clearance.ts",
      "index.ts",
      "registry.ts",
      "review-request.ts",
      "schedule-clearance.ts",
    ]);
  });

  it("blocks the slot on the registered record before any review exists", async () => {
    const blocked = await gateCheck();
    expect(blocked.statusCode).toBe(200);
    expect(blocked.json.allowed).toBe(false);
    expect(blocked.json.code).toBe("POST_EXPIRY_DATE");
    expect(blocked.json.recordProvenance.source).toBe("REGISTERED_RIGHTS_RECORD");
    expect(blocked.json.recordProvenance.recordSource).toBe(dbConnected ? "DB" : "MEMORY");
  });

  it("clears the block end-to-end: request -> evidence -> durable record -> gate allows the slot", async () => {
    const { requestId, ticketId } = await openRequest();
    expect(ticketId).toMatch(/^RW-\d{4}-\d{4}$/);

    // Opening a request changes nothing: the rights block stays intact (UIUX §2.2 R09).
    const stillBlocked = await gateCheck();
    expect(stillBlocked.json.allowed).toBe(false);
    expect(stillBlocked.json.code).toBe("POST_EXPIRY_DATE");

    await advanceToEvidenceReview(requestId);

    const resolved = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, {
      decision: "RESOLVED_CLEARED_BY_SOURCE",
      resolutionNote: "Distributor addendum ADD-2026-017 signed 2026-10-02 extends the window to 31 Dec 2026.",
      evidenceReferences: ["CONTRACT-ADD-2026-017"],
      clearedExpiryDate: CLEARED_EXPIRY.toISOString(),
    });
    expect(resolved.statusCode, JSON.stringify(resolved.json)).toBe(200);
    expect(resolved.json.requestStatus).toBe("RESOLVED_CLEARED_BY_SOURCE");
    expect(resolved.json.rightsRecord.expiryDate).toBe(CLEARED_EXPIRY.toISOString());
    expect(resolved.json.rightsRecord.source).toBe(dbConnected ? "DB" : "MEMORY");
    expect(resolved.json.gateRechecked).toBe(true);

    // The same call, the same slot, the same record id — now allowed.
    const cleared = await gateCheck();
    expect(cleared.json.allowed).toBe(true);
    expect(cleared.json.recordProvenance.expiryDate).toBe(CLEARED_EXPIRY.toISOString());

    if (dbConnected) {
      // Rule 0.4a: a second repository instance has its own empty Map, so reading
      // the extended window through it proves the write left the process.
      const independent = await new RightsRepository().findById(RECORD_ID);
      expect(independent?.source).toBe("DB");
      expect(independent?.expiryDate.toISOString()).toBe(CLEARED_EXPIRY.toISOString());
      expect(independent?.channelCode).toBe("NXTR");
    } else {
      expect(await new RightsRepository().findById(RECORD_ID)).toBeNull();
    }
  });

  it("keeps the block and writes nothing when the review retains it", async () => {
    const { requestId } = await openRequest();
    await advanceToEvidenceReview(requestId);

    const retained = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, {
      decision: "RESOLVED_BLOCK_RETAINED",
      resolutionNote: "No countersigned evidence supplied; exploitation window unchanged.",
    });
    expect(retained.statusCode).toBe(200);
    expect(retained.json.rightsRecord).toBeNull();
    expect(retained.json.gateRechecked).toBe(false);

    const gate = await gateCheck();
    expect(gate.json.allowed).toBe(false);
    expect(gate.json.code).toBe("POST_EXPIRY_DATE");
    const current = await rightsRepository.findById(RECORD_ID);
    expect(current?.expiryDate.toISOString()).toBe(BLOCKED_EXPIRY.toISOString());
  });

  it("refuses to clear without authoritative evidence", async () => {
    const { requestId } = await openRequest();
    await advanceToEvidenceReview(requestId);

    const noEvidence = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, {
      decision: "RESOLVED_CLEARED_BY_SOURCE",
      resolutionNote: "Distributor said it was fine on the phone.",
      clearedExpiryDate: CLEARED_EXPIRY.toISOString(),
    });
    expect(noEvidence.statusCode).toBe(400);
    expect(noEvidence.json.code).toBe("RRR-06");

    const shortNote = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, {
      decision: "RESOLVED_CLEARED_BY_SOURCE",
      resolutionNote: "ok",
      evidenceReferences: ["CONTRACT-ADD-2026-017"],
      clearedExpiryDate: CLEARED_EXPIRY.toISOString(),
    });
    expect(shortNote.statusCode).toBe(400);
    expect(shortNote.json.code).toBe("RRR-05");

    // Still blocked, and still in EVIDENCE_REVIEW: a refused resolution changes nothing.
    const gate = await gateCheck();
    expect(gate.json.allowed).toBe(false);
    const reopened = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/transition`, {
      targetStatus: "ASSIGNED",
    });
    expect(reopened.statusCode).toBe(400);
    expect(reopened.json.code).toBe("RRR-04");
  });

  it("cannot clear a RightsRecord that is not registered", async () => {
    const { requestId } = await openRequest({ rightsRecordId: "rr-tsk14-phantom" });
    await advanceToEvidenceReview(requestId);

    const attempt = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, {
      decision: "RESOLVED_CLEARED_BY_SOURCE",
      resolutionNote: "Evidence references an unregistered rights record id.",
      evidenceReferences: ["CONTRACT-ADD-2026-018"],
      clearedExpiryDate: CLEARED_EXPIRY.toISOString(),
    });
    expect(attempt.statusCode).toBe(400);
    expect(attempt.json.code).toBe("RRR-09");
  });

  it("requires staff authority to resolve, not just a session", async () => {
    const { requestId } = await openRequest();
    await advanceToEvidenceReview(requestId);
    const resolvePayload = {
      decision: "RESOLVED_CLEARED_BY_SOURCE",
      resolutionNote: "Addendum ADD-2026-017 extends the window to 31 Dec 2026.",
      evidenceReferences: ["CONTRACT-ADD-2026-017"],
      clearedExpiryDate: CLEARED_EXPIRY.toISOString(),
    };

    const anonymous = await postJson(`/api/v1/broadcast/rights/review-requests/${requestId}/resolve`, resolvePayload, "");
    expect(anonymous.statusCode).toBe(401);

    const wrongRole = await postJson(
      `/api/v1/broadcast/rights/review-requests/${requestId}/resolve`,
      resolvePayload,
      "PlayoutOperator"
    );
    expect(wrongRole.statusCode).toBe(403);

    // Refusing the resolution means the gate never saw a cleared window. The gate
    // itself is guarded update:rights, so a PlayoutOperator is refused there too —
    // the check below runs as a rights staff role to prove the *record* is unchanged.
    const gate = await gateCheck();
    expect(gate.json.allowed).toBe(false);
    expect(gate.json.code).toBe("POST_EXPIRY_DATE");

    const operatorGate = await postJson("/api/v1/broadcast/rights/validate", {}, "PlayoutOperator");
    expect(operatorGate.statusCode).toBe(403);
  });

  it("AC-UI-RL1-R07-18 refuses a caller-supplied copy of the RightsRecord (TSK-10: the store decides)", async () => {
    // The spoof asserts a window the register does not hold: the record of
    // account expires 2026-09-30, the copy claims 2026-12-31. Under TSK-14 this
    // was still validated and merely labelled CALLER_SUPPLIED_COPY; TSK-10
    // refuses it, because a clearance the caller writes himself is not a
    // clearance (report.md CA-07 defect 3).
    const spoof = await postJson("/api/v1/broadcast/rights/validate", {
      request: {
        episodeId: "ep-urban-4102",
        channelCode: "NXTR",
        scheduledAirTime: AIR_TIME,
        scheduledDurationSeconds: AIR_SECONDS,
        rightsRecord: {
          id: RECORD_ID,
          assetId: "ast-urban-4102",
          title: "Urban Sound Showcase #4102",
          rightsType: "BROADCAST_LINEAR",
          territory: "NG",
          mediaType: "LINEAR_TV",
          channelCode: "NXTR",
          startDate: START.toISOString(),
          expiryDate: CLEARED_EXPIRY.toISOString(),
        },
      },
    });
    expect(spoof.statusCode).toBe(400);
    expect(spoof.json.code).toBe("RIGHTS_RECORD_FIELDS_NOT_TRUSTED");
    expect(JSON.stringify(spoof.json)).not.toMatch(/"allowed"\s*:\s*true/);

    // The same attempt flat on the request body is refused for the same reason.
    const flat = await postJson("/api/v1/broadcast/rights/validate", {
      episodeId: "ep-urban-4102",
      channelCode: "NXTR",
      scheduledAirTime: AIR_TIME,
      scheduledDurationSeconds: AIR_SECONDS,
      expiryDate: CLEARED_EXPIRY.toISOString(),
      territory: "GLOBAL",
    });
    expect(flat.statusCode).toBe(400);
    expect(flat.json.code).toBe("RIGHTS_RECORD_FIELDS_NOT_TRUSTED");

    // And a validation with no record named at all is refused rather than waved
    // through on the arithmetic of an empty claim.
    const noRecord = await postJson("/api/v1/broadcast/rights/validate", {
      episodeId: "ep-urban-4102",
      channelCode: "NXTR",
      scheduledAirTime: AIR_TIME,
      scheduledDurationSeconds: AIR_SECONDS,
    });
    expect(noRecord.statusCode).toBe(400);
    expect(noRecord.json.code).toBe("RIGHTS_RECORD_ID_REQUIRED");

    // The registered record still decides, and it still blocks this slot.
    const gate = await gateCheck();
    expect(gate.json.allowed).toBe(false);
    expect(gate.json.code).toBe("POST_EXPIRY_DATE");
    expect(gate.json.recordProvenance.source).toBe("REGISTERED_RIGHTS_RECORD");
  });
});
