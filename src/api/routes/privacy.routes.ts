/**
 * Privacy Domain Route Handlers (AUD-24 / AUD-31)
 */

import { randomUUID } from "node:crypto";
import { DomainRoute, RouteContext } from "./types.js";
import { PrivacyExportRequestSchema } from "../schemas/index.js";
import { recordAuditLog, getAuditLogs, verifyAuditLogChainIntegrity } from "../../core/audit/index.js";
import { getPrismaClient } from "../../core/database/index.js";
import { checkSharedRateLimit } from "../../core/auth/index.js";
import { parseJsonBody, sendJson, resolveClientIp, sendHtml, readFormBodyStash } from "../router.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { renderAuditDeskHtml } from "../../web/workspace/audit-desk.js";
import { renderGovernanceGrcDeskHtml } from "../../web/workspace/governance-grc-desk.js";
import { renderClientProjectsListHtml } from "../../web/portal/client-portal.js";
import { renderVtmMarketplaceHtml } from "../../web/portal/vtm-portal.js";
import {
  renderLearningPlanHtml,
  renderAssignmentSubmissionHtml,
  renderFacultyGradingRubricHtml,
} from "../../web/workspace/afca-extended-lms.js";
import { issueCsrfToken } from "../../core/websecurity/index.js";

/**
 * AUD-08: a data-subject request must not claim a processing lifecycle that
 * does not exist. Until a durable DSR workflow (table, SLA clock, archive
 * generation) is approved and built, requests are acknowledged as
 * RECORD_ONLY: the audit log carries the evidence trail, but no queue, no
 * status transitions and no archive are implied by the API surface.
 */
interface DataSubjectRequest {
  requestId: string;
  userId: string;
  email: string;
  /** RECEIVED only when a durable ledger row exists; RECORD_ONLY otherwise. */
  status: "RECEIVED" | "RECORD_ONLY";
  requestedAt: string;
  durable: boolean;
}

const requestsByUser = new Map<string, DataSubjectRequest>();

function sendProblem(res: RouteContext["res"], status: number, title: string, detail: string, type: string, extensions: Record<string, unknown> = {}): void {
  res.writeHead(status, { "Content-Type": "application/problem+json; charset=utf-8" });
  res.end(JSON.stringify({ type: `https://vmnl.ng/problems/${type}`, title, status, detail, ...extensions }));
}

function requireAuthenticatedUser(
  req: RouteContext["req"],
  res: RouteContext["res"],
  user: RouteContext["user"],
  returnUrl: string
): NonNullable<RouteContext["user"]> | null {
  if (user) return user;
  const accept = String(req?.headers?.accept || "");
  if (accept.includes("text/html")) {
    res.writeHead(302, { Location: `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}` });
    res.end();
    return null;
  }
  sendJson(res, 401, { error: "Authentication Required", message: "Please sign in to access this page." });
  return null;
}

export const privacyRoutes: DomainRoute[] = [
  {
    method: "POST",
    pathname: "/api/v1/privacy/export-request",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        sendProblem(res, 401, "Unauthorized", "An authenticated session is required for data export requests.", "unauthorized");
        return true;
      }
      // AUD-14: shared per-principal intake budget — one limit across all
      // instances; sheds load (429) when the shared backend is unreachable.
      const intakeRate = await checkSharedRateLimit(`dsr-export:${user.userId}`, 5, 60 * 60_000);
      if (!intakeRate.allowed) {
        sendProblem(res, 429, "Too Many Requests", "Too many export requests. Please try again later.", "rate-limited", { retryAfterMs: intakeRate.resetInMs });
        return true;
      }
      try {
        const body = await parseJsonBody(req, pathname);
        const parsed = PrivacyExportRequestSchema.safeParse(body);
        if (!parsed.success) {
          sendProblem(res, 422, "Unprocessable Content", "One or more request fields are invalid.", "validation-error", { errors: parsed.error.issues });
          return true;
        }
        if (parsed.data.email.toLowerCase() !== user.email.toLowerCase()) {
          sendProblem(res, 403, "Forbidden", "Export request must match the authenticated account.", "forbidden");
          return true;
        }
        const requestId = `DSR-EXP-${randomUUID().toUpperCase()}`;
        // AUD-08: record durably in the DataSubjectRequest ledger when the
        // database is reachable; the in-memory entry is a best-effort copy.
        // The reported status stays truthful either way: RECEIVED only when a
        // durable row exists, RECORD_ONLY when it does not.
        let durable = false;
        try {
          await getPrismaClient().dataSubjectRequest.create({
            data: {
              requestRef: requestId,
              userId: user.userId,
              email: user.email,
              requestType: "EXPORT",
              status: "RECEIVED",
            },
          });
          durable = true;
        } catch {
          durable = false; // DB unavailable: honest in-memory record only
        }
        const request: DataSubjectRequest = {
          requestId,
          userId: user.userId,
          email: user.email,
          status: durable ? "RECEIVED" : "RECORD_ONLY",
          requestedAt: new Date().toISOString(),
          durable,
        };
        requestsByUser.set(user.userId, request);
        recordAuditLog({
          userId: user.userId,
          action: "privacy.data_subject.export_requested",
          resource: "privacy",
          resourceId: requestId,
          changes: { subjectUserId: user.userId, reason: parsed.data.reason || "Self-service export", durableRecorded: durable },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 202, {
          status: "ACCEPTED",
          requestId,
          exportStatus: request.status,
          durableRecorded: durable,
          message: durable
            ? "Request durably recorded in the DSR ledger. Archive generation is not implemented and no processing queue exists; do not treat this response as a completed or in-progress export."
            : "Request recorded in process memory only (durable ledger unavailable) and will not survive a restart. Archive generation is not implemented and no processing queue exists.",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bad Request";
        sendProblem(res, 400, "Bad Request", message, "bad-request");
      }
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/api/v1/privacy/export-request",
    handle: async ({ req, res, user }: RouteContext) => {
      if (!user) {
        sendProblem(res, 401, "Unauthorized", "An authenticated session is required to view export status.", "unauthorized");
        return true;
      }
      // AUD-08: report the durable ledger record when the database is
      // reachable; otherwise fall back to the process-local copy (which may
      // not survive a restart) and say so.
      let request = requestsByUser.get(user.userId);
      try {
        const durableRow = await getPrismaClient().dataSubjectRequest.findFirst({
          where: { userId: user.userId },
          orderBy: { requestedAt: "desc" },
        });
        if (durableRow) {
          request = {
            requestId: durableRow.requestRef,
            userId: durableRow.userId,
            email: durableRow.email,
            status: "RECEIVED",
            requestedAt: durableRow.requestedAt.toISOString(),
            durable: true,
          };
        }
      } catch {
        /* DB unavailable: report the in-memory record */
      }
      recordAuditLog({
        userId: user.userId,
        action: "privacy.data_subject.export_status_checked",
        resource: "privacy",
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, {
        status: "SUCCESS",
        exportStatus: request?.status || "NONE",
        request: request || null,
        message: request ? "Request recorded; archive generation is not implemented and the request does not progress through any queue." : "No export request exists for this account.",
      });
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 4: Cryptographic Audit Trail Explorer Desk
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/admin/audit",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;
      const logs = (await getAuditLogs()).slice(-50).reverse();
      const verification = verifyAuditLogChainIntegrity();

      const body = renderAuditDeskHtml({
        logs,
        verification,
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("Cryptographic Audit Trail | VMN Enterprise", body, "/workspace/admin/audit", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 4: GRC Risk & Privacy Governance Desk
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/governance/registers",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderGovernanceGrcDeskHtml({
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("Enterprise Risk & Governance Registers | VMN Enterprise", body, "/workspace/governance/registers", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/governance/risks",
    handle: async ({ req, res, user }: RouteContext) => {
      const raw = await readFormBodyStash(req);
      const params = new URLSearchParams(raw);
      const title = params.get("title") || "Untitled Risk";
      const category = params.get("category") || "BROADCAST_OPERATIONS";
      const impact = params.get("impact") || "MEDIUM";
      const mitigation = params.get("mitigation") || "Standard Runbook Control";

      recordAuditLog({
        action: "create",
        resource: "risk",
        userId: user?.userId || "usr_risk_officer",
        changes: { title, category, impact, mitigation },
      });

      res.writeHead(303, { Location: "/workspace/governance/registers?msg=Enterprise+Risk+Logged+Successfully" });
      res.end();
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 3: Client & Counterparty Portal
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/portal/client",
    handle: async ({ req, res, user }: RouteContext) => {
      const authed = requireAuthenticatedUser(req, res, user, "/portal/client");
      if (!authed) return true;

      const orgId = authed.tenantId || authed.userId;
      const body = renderClientProjectsListHtml(orgId, []);

      const html = renderMasterLayout("Client & Advertiser Portal | VMN Enterprise", body, "/portal/client", {
        sessionUser: authed,
        shell: "portal",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 3: VTM Talent Marketplace Portal
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/portal/vtm",
    handle: async ({ req, res, user }: RouteContext) => {
      const authed = requireAuthenticatedUser(req, res, user, "/portal/vtm");
      if (!authed) return true;

      const body = renderVtmMarketplaceHtml([]);

      const html = renderMasterLayout("VTM Talent Marketplace | VMN Enterprise", body, "/portal/vtm", {
        sessionUser: authed,
        shell: "portal",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 3: AFCA Academy LMS Portal
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/afca",
    handle: async ({ req, res, user }: RouteContext) => {
      const authed = requireAuthenticatedUser(req, res, user, "/workspace/afca");
      if (!authed) return true;

      const body = renderLearningPlanHtml("AFCA-CRS-101");
      const html = renderMasterLayout("AFCA Learning Plan & Curriculum | VMN Enterprise", body, "/workspace/afca", {
        sessionUser: authed,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/workspace/afca/assignments",
    handle: async ({ req, res, user }: RouteContext) => {
      const authed = requireAuthenticatedUser(req, res, user, "/workspace/afca/assignments");
      if (!authed) return true;

      const body = renderAssignmentSubmissionHtml("ASN-CINEMA-01");
      const html = renderMasterLayout("Submit Assignment | AFCA Academy", body, "/workspace/afca/assignments", {
        sessionUser: authed,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/workspace/afca/grading",
    handle: async ({ req, res, user }: RouteContext) => {
      const authed = requireAuthenticatedUser(req, res, user, "/workspace/afca/grading");
      if (!authed) return true;

      const body = renderFacultyGradingRubricHtml("SUB-2026-001");
      const html = renderMasterLayout("Faculty Grading Rubric | AFCA Academy", body, "/workspace/afca/grading", {
        sessionUser: authed,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
];
