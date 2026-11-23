/**
 * Intelligence & AI Agent OS Modular Domain Route Handlers (AUD-24 / PRD R1.3C)
 * Authority: Canonical Law 13 / CCPP §18
 */

import { DomainRoute, RouteContext } from "./types.js";
import { sendJson, parseJsonBody } from "../router.js";
import {
  saveAgent,
  listAgents,
  saveProposal,
  listProposals,
  getGlobalKillSwitch,
  setGlobalKillSwitch,
} from "../../core/database/repositories/intelligence.repository.js";

export const intelligenceRoutes: DomainRoute[] = [
  // --------------------------------------------------------------------------
  // AGENTS
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/intelligence/agents",
    handle: async ({ res }: RouteContext) => {
      const result = await listAgents();
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
    pathname: "/api/v1/intelligence/agents",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Admin session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const agent = await saveAgent({
          id: (body.id as string) || `AGT-${Date.now()}`,
          agentIdentifier: (body.agentIdentifier as string) || `agent-${Date.now()}`,
          name: (body.name as string) || "Autonomous Subagent",
          purpose: (body.purpose as string) || "Domain task automation",
          operationalScope: (body.operationalScope as string) || "GENERAL",
          humanOwnerId: user.userId,
          allowedTools: (body.allowedTools as string[]) || [],
          status: ((body.status as "ACTIVE" | "PAUSED" | "TERMINATED") || "ACTIVE"),
          killSwitchEngaged: false,
        });
        await sendJson(res, 201, { success: true, data: agent });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // PROPOSALS (CANONICAL LAW 13: HUMAN IN THE LOOP)
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/intelligence/proposals",
    handle: async ({ res, parsedUrl }: RouteContext) => {
      const rawStatus = parsedUrl.searchParams.get("status");
      const status = (rawStatus === "PENDING" || rawStatus === "APPROVED" || rawStatus === "REJECTED") ? rawStatus : undefined;
      const proposals = await listProposals(status);
      await sendJson(res, 200, { success: true, data: proposals });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/intelligence/proposals/review",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Human reviewer session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const proposal = await saveProposal({
          id: body.proposalId as string,
          agentId: (body.agentId as string) || "agent-unknown",
          actionType: (body.actionType as string) || "CONSEQUENTIAL_ACTION",
          rationale: (body.rationale as string) || "Action reviewed by operator",
          payloadJson: JSON.stringify(body.payload || {}),
          status: body.decision === "APPROVE" ? "APPROVED" : "REJECTED",
          reviewedByUserId: user.userId,
          reviewedAt: new Date(),
          rejectionReason: body.rejectionReason as string | undefined,
          createdAt: new Date(),
        });
        await sendJson(res, 200, {
          success: true,
          action: "PROPOSAL_REVIEWED",
          data: proposal,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await sendJson(res, 400, { error: "Bad Request", message });
        return true;
      }
    },
  },

  // --------------------------------------------------------------------------
  // GLOBAL EMERGENCY AI KILL SWITCH
  // --------------------------------------------------------------------------
  {
    method: "GET",
    pathname: "/api/v1/intelligence/kill-switch",
    handle: async ({ res }: RouteContext) => {
      const active = await getGlobalKillSwitch();
      await sendJson(res, 200, {
        killSwitchActive: active,
        status: active ? "ENGAGED_ALL_AGENTS_HALTED" : "DISENGAGED_NORMAL_OPERATION",
      });
      return true;
    },
  },
  {
    method: "POST",
    pathname: "/api/v1/intelligence/kill-switch",
    handle: async ({ req, res, pathname, user }: RouteContext) => {
      if (!user) {
        await sendJson(res, 401, { error: "Unauthorized", message: "Superadmin session required" });
        return true;
      }
      try {
        const body = (await parseJsonBody(req, pathname)) as Record<string, unknown>;
        const active = Boolean(body.active);
        await setGlobalKillSwitch(active);
        await sendJson(res, 200, {
          success: true,
          action: active ? "KILL_SWITCH_ENGAGED" : "KILL_SWITCH_DISENGAGED",
          killSwitchActive: active,
          operatorId: user.userId,
          timestamp: new Date().toISOString(),
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
