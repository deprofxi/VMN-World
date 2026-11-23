/**
 * VMN World IA R1.1 — Wave 1 RBAC Screen-to-Rule Mapping Unit Tests
 * Authority: docs/decisions/DEC-RBAC-MAPPING-001.md §D3
 */

import { describe, expect, it } from "vitest";
import {
  IA_WAVE_1_SCREEN_RULES,
  getIAScreenRequiredRule,
  getIAScreen,
  resolveIARoute,
} from "../../src/web/ia/index.js";
import { evaluateIAAccess, renderIAResponse } from "../../src/api/routes/ia.routes.js";
import type { SessionUser } from "../../src/core/auth/index.js";

const SUPER_ADMIN: SessionUser = {
  userId: "usr-superadmin",
  personId: "person-superadmin",
  email: "admin@vmnl.ng",
  roles: ["SuperAdmin"],
};

const FINANCE_CONTROLLER: SessionUser = {
  userId: "usr-finance",
  personId: "person-finance",
  email: "cfo@vmnl.ng",
  roles: ["FinanceController"],
};

const MCR_SUPERVISOR: SessionUser = {
  userId: "usr-mcr",
  personId: "person-mcr",
  email: "mcr@vmnl.ng",
  roles: ["MCRSupervisor"],
};

const RIGHTS_MANAGER: SessionUser = {
  userId: "usr-rights",
  personId: "person-rights",
  email: "rights@vmnl.ng",
  roles: ["RightsManager"],
};

const OPERATOR_WITHOUT_PRIVILEGE: SessionUser = {
  userId: "usr-viewer",
  personId: "person-viewer",
  email: "viewer@vmnl.ng",
  roles: ["PlayoutMcoOperator"],
};

describe("IA Wave 1 Screen-to-Rule Mapping (DEC-RBAC-MAPPING-001)", () => {
  it("maps exactly 41 screens across the five approved resources", () => {
    expect(IA_WAVE_1_SCREEN_RULES.size).toBe(41);

    const counts = { finance: 0, rights: 0, broadcast: 0, agent: 0, content: 0 };
    for (const mapping of IA_WAVE_1_SCREEN_RULES.values()) {
      expect(mapping.action).toBe("read");
      counts[mapping.resource as keyof typeof counts]++;
      // Every mapped screen must exist in IA_REGISTRY
      const screen = getIAScreen(mapping.screenId);
      expect(screen, `Screen ${mapping.screenId} must exist in registry`).toBeDefined();
    }

    expect(counts).toEqual({
      finance: 26,
      rights: 5,
      broadcast: 7,
      agent: 2,
      content: 1,
    });
  });

  it("evaluates public screens as PUBLIC regardless of session", () => {
    const pubScreen = getIAScreen("PUB-001")!;
    expect(evaluateIAAccess(pubScreen, null)).toBe("PUBLIC");
    expect(evaluateIAAccess(pubScreen, OPERATOR_WITHOUT_PRIVILEGE)).toBe("PUBLIC");
  });

  it("evaluates unmapped gated screens as SESSION_REQUIRED or AUTHENTICATED", () => {
    // CIRC-001 is gated W1 and deliberately unmapped in Wave 1
    const circScreen = getIAScreen("CIRC-001")!;
    expect(getIAScreenRequiredRule("CIRC-001")).toBeUndefined();
    expect(evaluateIAAccess(circScreen, null)).toBe("SESSION_REQUIRED");
    expect(evaluateIAAccess(circScreen, OPERATOR_WITHOUT_PRIVILEGE)).toBe("AUTHENTICATED");
  });

  it("denies unauthenticated access to mapped screens with SESSION_REQUIRED", () => {
    const finScreen = getIAScreen("FIN-005")!;
    expect(evaluateIAAccess(finScreen, null)).toBe("SESSION_REQUIRED");
  });

  it("admits SuperAdmin to all 41 mapped screens", () => {
    for (const [screenId] of IA_WAVE_1_SCREEN_RULES) {
      const screen = getIAScreen(screenId)!;
      expect(
        evaluateIAAccess(screen, SUPER_ADMIN),
        `SuperAdmin must not be denied on ${screenId}`
      ).toBe("AUTHENTICATED");
    }
  });

  it("enforces least-privilege role boundaries on finance screens", () => {
    const finScreen = getIAScreen("FIN-005")!; // /finance/contracts-and-obligations-financial-index
    // FinanceController holds read:finance -> AUTHENTICATED
    expect(evaluateIAAccess(finScreen, FINANCE_CONTROLLER)).toBe("AUTHENTICATED");
    // MCRSupervisor does NOT hold read:finance -> FORBIDDEN
    expect(evaluateIAAccess(finScreen, MCR_SUPERVISOR)).toBe("FORBIDDEN");
    // PlayoutMcoOperator does NOT hold read:finance -> FORBIDDEN
    expect(evaluateIAAccess(finScreen, OPERATOR_WITHOUT_PRIVILEGE)).toBe("FORBIDDEN");
  });

  it("enforces least-privilege role boundaries on rights screens", () => {
    const rightsScreen = getIAScreen("IPR-003")!; // /rights/title-chain-of-title-record
    // RightsManager holds read:rights -> AUTHENTICATED
    expect(evaluateIAAccess(rightsScreen, RIGHTS_MANAGER)).toBe("AUTHENTICATED");
    // FinanceController does NOT hold read:rights -> FORBIDDEN
    expect(evaluateIAAccess(rightsScreen, FINANCE_CONTROLLER)).toBe("FORBIDDEN");
    // MCRSupervisor does NOT hold read:rights -> FORBIDDEN
    expect(evaluateIAAccess(rightsScreen, MCR_SUPERVISOR)).toBe("FORBIDDEN");
  });

  it("enforces least-privilege role boundaries on broadcast screens", () => {
    const bcastScreen = getIAScreen("BRC-006")!; // /broadcast/traffic-order-and-booking-detail
    // MCRSupervisor holds read:broadcast -> AUTHENTICATED
    expect(evaluateIAAccess(bcastScreen, MCR_SUPERVISOR)).toBe("AUTHENTICATED");
    // FinanceController does NOT hold read:broadcast -> FORBIDDEN
    expect(evaluateIAAccess(bcastScreen, FINANCE_CONTROLLER)).toBe("FORBIDDEN");
  });

  it("renders HTTP 403 denial screen with recourse and no leaked records on FORBIDDEN", () => {
    const match = resolveIARoute("/finance/contracts-and-obligations-financial-index")!;
    expect(match).toBeDefined();

    const response = renderIAResponse(match, {
      pathname: "/finance/contracts-and-obligations-financial-index",
      user: MCR_SUPERVISOR,
      query: new URLSearchParams(),
    });

    expect(response.status).toBe(403);
    expect(response.html).toContain("403 · Access denied");
    expect(response.html).toContain("Your session is not cleared for this screen");
    expect(response.html).toContain("/access-request");
    expect(response.html).toContain("/support");
    expect(response.html).not.toContain("Source not connected");
  });
});
