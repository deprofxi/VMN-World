import { describe, it, expect } from "vitest";
import { canPerform, assertPermission } from "../../src/core/rbac/index.js";
import { SessionUser } from "../../src/core/auth/index.js";

describe("Multi-Tenant RBAC / ABAC Policy Engine (TASK-P1-03)", () => {
  const superAdminUser: SessionUser = {
    userId: "usr-admin",
    personId: "per-admin",
    email: "admin@vmn.ng",
    roles: ["SuperAdmin"],
  };

  const broadcastDirector: SessionUser = {
    userId: "usr-bd",
    personId: "per-bd",
    email: "broadcast@vmn.ng",
    roles: ["BroadcastDirector"],
    tenantId: "tenant-vmn",
  };

  const trafficManager: SessionUser = {
    userId: "usr-tm",
    personId: "per-tm",
    email: "traffic@vmn.ng",
    roles: ["TrafficManager"],
    tenantId: "tenant-vmn",
  };

  const auditorUser: SessionUser = {
    userId: "usr-aud",
    personId: "per-aud",
    email: "auditor@vmn.ng",
    roles: ["Auditor"],
    tenantId: "tenant-vmn",
  };

  it("should allow SuperAdmin to perform any action on any resource", () => {
    expect(canPerform(superAdminUser, "create", "broadcast")).toBe(true);
    expect(canPerform(superAdminUser, "delete", "finance")).toBe(true);
    expect(canPerform(superAdminUser, "execute", "agent")).toBe(true);
  });

  it("should allow BroadcastDirector to approve schedules and execute playout", () => {
    expect(canPerform(broadcastDirector, "approve", "schedule")).toBe(true);
    expect(canPerform(broadcastDirector, "execute", "playout")).toBe(true);
    // But BroadcastDirector cannot approve finance
    expect(canPerform(broadcastDirector, "approve", "finance")).toBe(false);
  });

  it("should enforce schedule lock constraints", () => {
    // TrafficManager can update schedule when not locked
    expect(canPerform(trafficManager, "update", "schedule", { isScheduleLocked: false })).toBe(true);

    // TrafficManager CANNOT update schedule when locked
    expect(canPerform(trafficManager, "update", "schedule", { isScheduleLocked: true })).toBe(false);

    // BroadcastDirector CAN update schedule even when locked
    expect(canPerform(broadcastDirector, "update", "schedule", { isScheduleLocked: true })).toBe(true);
  });

  it("should enforce multi-tenant isolation", () => {
    // User from tenant-vmn cannot access tenant-other resources unless SuperAdmin
    expect(
      canPerform(broadcastDirector, "read", "broadcast", { tenantId: "tenant-other" })
    ).toBe(false);

    // SuperAdmin can access across tenants
    expect(
      canPerform(superAdminUser, "read", "broadcast", { tenantId: "tenant-other" })
    ).toBe(true);
  });

  it("should restrict Auditor to read-only actions", () => {
    expect(canPerform(auditorUser, "read", "audit")).toBe(true);
    expect(canPerform(auditorUser, "read", "finance")).toBe(true);
    expect(canPerform(auditorUser, "create", "finance")).toBe(false);
    expect(canPerform(auditorUser, "delete", "schedule")).toBe(false);
  });

  it("should throw authorization error on assertPermission failure", () => {
    expect(() =>
      assertPermission(trafficManager, "delete", "finance")
    ).toThrowError(/is not authorized to 'delete' on resource 'finance'/);
  });
});
