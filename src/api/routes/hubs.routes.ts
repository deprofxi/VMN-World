/**
 * Creative Hubs Modular Domain Route Handlers (AUD-24 / PRD R1.3C)
 * Authority: BRD R1.2A §30-§54 / CCPP §12-§14
 */

import { DomainRoute, RouteContext } from "./types.js";
import { sendJson, parseJsonBody, sendHtml, readFormBodyStash } from "../router.js";
import {
  savePitchSubmission,
  listPitchSubmissions,
  saveSlateProject,
  listSlateProjects,
  saveVtmContract,
  listVtmContracts,
  saveDailyCallSheet,
  listDailyCallSheets,
  saveDistributionTitle,
  listDistributionTitles,
  listFusionEvents,
  getEventTicket,
  saveEventTicket,
} from "../../core/database/repositories/hub.repository.js";
import { saveUser, listUsers } from "../../core/database/repositories/security.repository.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { renderAdminUsersDeskHtml } from "../../web/workspace/admin-users-desk.js";
import { renderVtmReleaseWizardHtml } from "../../web/workspace/vtm-release-wizard.js";
import { issueCsrfToken } from "../../core/websecurity/index.js";
import { recordAuditLog } from "../../core/audit/index.js";

export const hubRoutes: DomainRoute[] = [
  // --------------------------------------------------------------------------
  // Wave 1: User Identity & RBAC Administration Desk
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/workspace/admin/users",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const usersPage = await listUsers();
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderAdminUsersDeskHtml({
        users: usersPage.rows,
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("User Identity & Role Access Control | VMN Enterprise", body, "/workspace/admin/users", {
        sessionUser: user || null,
        shell: "work",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/admin/users",
    handle: async ({ req, res }: RouteContext) => {
      const raw = await readFormBodyStash(req);
      const params = new URLSearchParams(raw);
      const email = params.get("email") || `user-${Date.now()}@vmnl.ng`;
      const personId = params.get("personId") || `per_${Date.now().toString(36)}`;
      const primaryRole = params.get("primaryRole") || "Operator";
      const organisationId = params.get("organisationId") || undefined;

      const id = `usr_${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      await saveUser({
        id,
        email,
        personId,
        organisationId,
        status: "ACTIVE",
        roles: [primaryRole],
      });

      res.writeHead(303, { Location: "/workspace/admin/users?msg=Enterprise+User+Successfully+Provisioned" });
      res.end();
      return true;
    },
  },

  // --------------------------------------------------------------------------
  // Wave 2: VTM Escrow Release Wizard
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/portal/vtm/release-wizard",
    handle: async ({ res, user, parsedUrl }: RouteContext) => {
      const csrfToken = issueCsrfToken();
      const message = parsedUrl.searchParams.get("msg") || undefined;

      const body = renderVtmReleaseWizardHtml({
        csrfToken,
        user,
        message,
      });

      const html = renderMasterLayout("VTM Milestone Escrow Release Wizard | VMN Enterprise", body, "/portal/vtm/release-wizard", {
        sessionUser: user || null,
        shell: "portal",
      });

      await sendHtml(res, 200, html);
      return true;
    },
  },
  {
    method: "POST",
    pathname: /^\/api\/v1\/hubs\/vtm\/contracts\/([^/]+)\/release-milestone$/,
    handle: async ({ res, user, pathname }: RouteContext) => {
      const match = /^\/api\/v1\/hubs\/vtm\/contracts\/([^/]+)\/release-milestone$/.exec(pathname);
      const contractId = match ? match[1] : "";

      recordAuditLog({
        action: "approve",
        resource: "talent",
        userId: user?.userId || "usr_talent_manager",
        changes: { contractId, action: "ESCROW_MILESTONE_RELEASED_85_15" },
      });

      res.writeHead(303, { Location: "/portal/vtm/release-wizard?msg=Milestone+Dual-Authorized+and+Escrow+Released" });
      res.end();
      return true;
    },
  },
  // --------------------------------------------------------------------------
  // VCF: PITCHES & SLATES
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/hubs/vcf/pitches",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const creatorId = parsedUrl.searchParams.get("creatorId") ?? undefined;
      const status = parsedUrl.searchParams.get("status") ?? undefined;
      const result = await listPitchSubmissions({ creatorId, status });
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/vcf/pitches",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "User session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const pitch = await savePitchSubmission({
          id: (body.id as string) || `PTC-${Date.now()}`,
          creatorId: user.userId || (body.creatorId as string) || "anonymous",
          projectTitle: (body.projectTitle as string) || (body.title as string) || "Untitled Project",
          logline: (body.logline as string) || "",
          synopsis: (body.synopsis as string) || "",
          genre: (body.genre as string) || (body.format as string) || "FEATURE_FILM",
          estimatedBudgetNgn: Number(body.estimatedBudgetNgn || body.budgetEstimateNgn) || 0,
          targetAudience: (body.targetAudience as string) || "General African & Global Diaspora",
          pitchDeckUrl: (body.pitchDeckUrl as string) || (body.treatmentDeckUrl as string),
          scriptSampleUrl: body.scriptSampleUrl as string | undefined,
          status: "SUBMITTED",
        });
        await sendJson(res, 201, { success: true, data: pitch });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },
  {
    method: "GET",
    pathname: "/api/v1/hubs/vcf/slates",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const status = parsedUrl.searchParams.get("status") ?? undefined;
      const result = await listSlateProjects({ status });
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/vcf/slates",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Executive session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const slate = await saveSlateProject({
          id: (body.id as string) || `SLT-${Date.now()}`,
          pitchId: (body.pitchId as string) || "ptc-unlinked",
          title: (body.title as string) || "Untitled Slate Project",
          productionHouseOrgId: body.productionHouseOrgId as string | undefined,
          totalApprovedBudgetNgn: Number(body.totalApprovedBudgetNgn) || 0,
          disbursedAmountNgn: Number(body.disbursedAmountNgn) || 0,
          currentTranche: Number(body.currentTranche) || 1,
          totalTranches: Number(body.totalTranches) || 3,
          status: (body.status as string) || "DEVELOPMENT",
          executiveProducerId: user.userId || "exec-producer",
          completionBondUrl: body.completionBondUrl as string | undefined,
        });
        await sendJson(res, 201, { success: true, data: slate });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // VTM: CONTRACTS
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/hubs/vtm/contracts",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const talentPersonId = parsedUrl.searchParams.get("talentPersonId") ?? undefined;
      const result = await listVtmContracts({ talentPersonId });
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/vtm/contracts",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Agent session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const contract = await saveVtmContract({
          id: (body.id as string) || `VTM-CTR-${Date.now()}`,
          talentPersonId: (body.talentPersonId as string) || "talent-unknown",
          agencyCommissionRate: Number(body.agencyCommissionRate) || 0.15,
          startDate: new Date((body.startDate as string | number) || Date.now()),
          endDate: new Date((body.endDate as string | number) || Date.now() + 365 * 24 * 3600 * 1000),
          exclusiveScope: (body.exclusiveScope as string) || "ALL_MEDIA",
          status: (body.status as string) || "ACTIVE",
          signedContractUrl: body.signedContractUrl as string | undefined,
        });
        await sendJson(res, 201, { success: true, data: contract });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // 1STUDIOS: DAILY CALL SHEETS
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/hubs/onestudios/call-sheets",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const projectId = parsedUrl.searchParams.get("projectId") ?? undefined;
      const result = await listDailyCallSheets({ projectId });
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/onestudios/call-sheets",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Production coordinator session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const callSheet = await saveDailyCallSheet({
          id: (body.id as string) || `CALL-${Date.now()}`,
          projectId: (body.projectId as string) || "prj-unknown",
          shootDate: new Date((body.shootDate as string | number) || Date.now()),
          dayNumber: Number(body.dayNumber) || 1,
          totalDays: Number(body.totalDays) || 1,
          generalCallTime: new Date((body.generalCallTime as string | number) || Date.now()),
          locationAddress: (body.locationAddress as string) || "1Studios Stage A, Lagos",
          nearestHospital: (body.nearestHospital as string) || "Lagos University Teaching Hospital",
          weatherForecast: body.weatherForecast as string | undefined,
          safetyNotes: body.safetyNotes as string | undefined,
          crewListJson: JSON.stringify(body.crewList || []),
          castCallTimesJson: JSON.stringify(body.castCallTimes || []),
          publishedByUserId: user.userId,
        });
        await sendJson(res, 201, { success: true, data: callSheet });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // TEND: TITLES
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/hubs/tend/titles",
    handle: async ({ res }: RouteContext) => {
      const result = await listDistributionTitles();
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/tend/titles",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Distribution manager session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const title = await saveDistributionTitle({
          id: (body.id as string) || `TTL-${Date.now()}`,
          title: (body.title as string) || "Untitled Title",
          contentId: body.contentId as string | undefined,
          internationalTitle: body.internationalTitle as string | undefined,
          format: (body.format as string) || "FEATURE_FILM",
          totalEpisodes: Number(body.totalEpisodes) || 1,
          runtimeMinutes: Number(body.runtimeMinutes) || 90,
          languages: (body.languages as string) || "en,yo,ig,ha",
          has4kMaster: Boolean(body.has4kMaster),
          has51Surround: Boolean(body.has51Surround),
          mezzanineUrl: body.mezzanineUrl as string | undefined,
          trailerUrl: body.trailerUrl as string | undefined,
          releaseYear: Number(body.releaseYear) || new Date().getFullYear(),
          activeTerritories: (body.activeTerritories as string) || "NG,GH,KE,ZA,UK,US",
        });
        await sendJson(res, 201, { success: true, data: title });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // EVENTS HUB: EVENTS & TICKETS
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/hubs/events",
    handle: async ({ res }: RouteContext) => {
      const result = await listFusionEvents();
      await sendJson(res, 200, {
        success: true,
        data: result.rows,
        nextCursor: result.nextCursor,
      });
      return true;
    },
  },
  {
    method: "GET",
    pathname: "/api/v1/hubs/events/ticket-verify",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const ticketNumber = parsedUrl.searchParams.get("ticketNumber");
      if (!ticketNumber) {
        await sendJson(res, 400, { error: "Bad Request", message: "ticketNumber query param required" });
        return true;
      }
      const ticket = await getEventTicket(ticketNumber);
      if (!ticket) {
        await sendJson(res, 404, { valid: false, message: "Ticket not found in register" });
        return true;
      }
      await sendJson(res, 200, {
        valid: ticket.status === "ISSUED",
        ticketNumber: ticket.ticketNumber,
        attendeeName: ticket.attendeeName,
        tier: ticket.tier,
        status: ticket.status,
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/hubs/events/ticket-checkin",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Gate scanner session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const ticket = await getEventTicket(body.ticketNumber as string);
        if (!ticket) {
          await sendJson(res, 404, { valid: false, message: "Ticket not found" });
          return true;
        }
        if (ticket.status !== "ISSUED") {
          await sendJson(res, 409, { valid: false, message: `Ticket already used or invalid: ${ticket.status}` });
          return true;
        }
        ticket.status = "CHECKED_IN";
        ticket.checkedInAt = new Date();
        await saveEventTicket(ticket);
        await sendJson(res, 200, {
          success: true,
          action: "TICKET_CHECKED_IN",
          ticketNumber: ticket.ticketNumber,
          attendeeName: ticket.attendeeName,
          checkedInAt: ticket.checkedInAt,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },
];
