import { SessionUser } from "../auth/index.js";

export type EnterpriseAction = "read" | "create" | "update" | "delete" | "approve" | "execute";

export type EnterpriseResource =
  | "broadcast"
  | "schedule"
  | "rights"
  | "traffic"
  | "playout"
  | "talent"
  | "academy"
  | "finance"
  | "contract"
  | "audit"
  | "agent"
  // DAM resources introduced with the storage authorization fix (AUD-04):
  // read/upload/delete are gated on existing role matrices, so no role-matrix
  // rows need to change.
  | "storage"
  // Editorial content (UX-CMS) and restricted privacy/security cases
  // (UX-GOV-009/010) — TODO-SCR-01..02 / TODO-SCR-08. Permissions are derived
  // from existing role semantics via registerDerivedRolePermissions below.
  | "content"
  | "case"
  // TODO-SCR-19: enterprise risk & issue registers (UX-REC-004/005).
  // update:risk gates register mutations; reads stay on the feature-flagged
  // workspace surfaces. Derived from broadcast/schedule operational authority.
  | "risk"
  // Enquiry collection resource (AUD-03)
  | "enquiry";

export type EnterpriseRole =
  | "SuperAdmin"
  | "ExecutiveLeader"
  | "BroadcastDirector"
  | "TrafficManager"
  | "PlayoutOperator"
  | "RightsManager"
  | "TalentManager"
  | "AcademyDirector"
  | "FinanceController"
  | "Auditor"
  // R1.2A §48 The 17 Broadcast Capability Roles
  | "HeadOfBroadcast"
  | "ChannelManager"
  | "HeadOfProgramming"
  | "ProgrammeScheduler"
  | "AcquisitionsCommissioningManager"
  | "CommercialTrafficOfficer"
  | "BroadcastOperationsManager"
  | "PlayoutMcoOperator"
  | "BroadcastEngineer"
  | "EpgMetadataCoordinator"
  | "PromoProducer"
  | "AdSalesCommercialManager"
  | "SponsorshipManager"
  | "BroadcastRightsCoordinator"
  | "BroadcastFinanceAssurance"
  | "CarriagePlatformOwner"
  // Core Operational Desks
  | "MCRSupervisor"
  | "Operator";

export interface PermissionRule {
  action: EnterpriseAction;
  resource: EnterpriseResource;
}

export interface AccessContext {
  tenantId?: string;
  isOwner?: boolean;
  approvalAmount?: number;
  isScheduleLocked?: boolean;
}

/**
 * Standard Role-Permission Mapping Matrix (R1.2A §48, §49)
 */
export const ROLE_PERMISSIONS: Record<EnterpriseRole, PermissionRule[]> = {
  SuperAdmin: [
    { action: "read", resource: "broadcast" },
    { action: "create", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
    { action: "delete", resource: "broadcast" },
    { action: "approve", resource: "broadcast" },
    { action: "execute", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "create", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "delete", resource: "schedule" },
    { action: "approve", resource: "schedule" },
    { action: "execute", resource: "schedule" },
    { action: "read", resource: "rights" },
    { action: "create", resource: "rights" },
    { action: "update", resource: "rights" },
    { action: "delete", resource: "rights" },
    { action: "approve", resource: "rights" },
    { action: "execute", resource: "rights" },
    { action: "read", resource: "traffic" },
    { action: "create", resource: "traffic" },
    { action: "update", resource: "traffic" },
    { action: "delete", resource: "traffic" },
    { action: "approve", resource: "traffic" },
    { action: "execute", resource: "traffic" },
    { action: "read", resource: "playout" },
    { action: "create", resource: "playout" },
    { action: "update", resource: "playout" },
    { action: "delete", resource: "playout" },
    { action: "approve", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "read", resource: "talent" },
    { action: "create", resource: "talent" },
    { action: "update", resource: "talent" },
    { action: "delete", resource: "talent" },
    { action: "approve", resource: "talent" },
    { action: "execute", resource: "talent" },
    { action: "read", resource: "academy" },
    { action: "create", resource: "academy" },
    { action: "update", resource: "academy" },
    { action: "delete", resource: "academy" },
    { action: "approve", resource: "academy" },
    { action: "execute", resource: "academy" },
    { action: "read", resource: "finance" },
    { action: "create", resource: "finance" },
    { action: "update", resource: "finance" },
    { action: "delete", resource: "finance" },
    { action: "approve", resource: "finance" },
    { action: "execute", resource: "finance" },
    { action: "read", resource: "contract" },
    { action: "create", resource: "contract" },
    { action: "update", resource: "contract" },
    { action: "delete", resource: "contract" },
    { action: "approve", resource: "contract" },
    { action: "execute", resource: "contract" },
    { action: "read", resource: "audit" },
    { action: "create", resource: "audit" },
    { action: "update", resource: "audit" },
    { action: "delete", resource: "audit" },
    { action: "approve", resource: "audit" },
    { action: "execute", resource: "audit" },
    { action: "read", resource: "agent" },
    { action: "create", resource: "agent" },
    { action: "update", resource: "agent" },
    { action: "delete", resource: "agent" },
    { action: "approve", resource: "agent" },
    { action: "execute", resource: "agent" },
    { action: "read", resource: "enquiry" },
    { action: "create", resource: "enquiry" },
    { action: "update", resource: "enquiry" },
    { action: "delete", resource: "enquiry" },
    { action: "approve", resource: "enquiry" },
    { action: "execute", resource: "enquiry" },
  ],

  ExecutiveLeader: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "read", resource: "rights" },
    { action: "read", resource: "traffic" },
    { action: "read", resource: "talent" },
    { action: "read", resource: "academy" },
    { action: "read", resource: "finance" },
    { action: "approve", resource: "finance" },
    { action: "read", resource: "contract" },
    { action: "approve", resource: "contract" },
    { action: "read", resource: "audit" },
    { action: "read", resource: "agent" },
  ],

  BroadcastDirector: [
    { action: "read", resource: "broadcast" },
    { action: "create", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
    { action: "approve", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "create", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "approve", resource: "schedule" },
    { action: "read", resource: "rights" },
    { action: "read", resource: "playout" },
    { action: "execute", resource: "playout" },
  ],

  TrafficManager: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "read", resource: "traffic" },
    { action: "create", resource: "traffic" },
    { action: "update", resource: "traffic" },
    { action: "delete", resource: "traffic" },
    { action: "read", resource: "contract" },
  ],

  PlayoutOperator: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "read", resource: "playout" },
    { action: "execute", resource: "playout" }, // emergency filler activation, manual override
  ],

  RightsManager: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "rights" },
    { action: "create", resource: "rights" },
    { action: "update", resource: "rights" },
    { action: "approve", resource: "rights" },
    { action: "read", resource: "contract" },
  ],

  TalentManager: [
    { action: "read", resource: "talent" },
    { action: "create", resource: "talent" },
    { action: "update", resource: "talent" },
    { action: "approve", resource: "talent" },
    { action: "read", resource: "contract" },
    { action: "create", resource: "contract" },
  ],

  AcademyDirector: [
    { action: "read", resource: "academy" },
    { action: "create", resource: "academy" },
    { action: "update", resource: "academy" },
    { action: "approve", resource: "academy" },
    { action: "execute", resource: "academy" }, // certificate issuance
    { action: "read", resource: "talent" },
  ],

  FinanceController: [
    { action: "read", resource: "finance" },
    { action: "create", resource: "finance" },
    { action: "update", resource: "finance" },
    { action: "approve", resource: "finance" },
    { action: "read", resource: "contract" },
    { action: "read", resource: "traffic" },
    { action: "read", resource: "audit" },
  ],

  Auditor: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "read", resource: "rights" },
    { action: "read", resource: "traffic" },
    { action: "read", resource: "playout" },
    { action: "read", resource: "talent" },
    { action: "read", resource: "academy" },
    { action: "read", resource: "finance" },
    { action: "read", resource: "contract" },
    { action: "read", resource: "audit" },
    { action: "read", resource: "agent" },
  ],

  // R1.2A §48 & §49 Broadcast Capability Role Mappings
  HeadOfBroadcast: [
    { action: "read", resource: "broadcast" },
    { action: "create", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
    { action: "approve", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "approve", resource: "schedule" },
    { action: "read", resource: "rights" },
    { action: "approve", resource: "rights" },
    { action: "read", resource: "traffic" },
    { action: "read", resource: "playout" },
  ],

  ChannelManager: [
    { action: "read", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "read", resource: "traffic" },
  ],

  HeadOfProgramming: [
    { action: "read", resource: "broadcast" },
    { action: "create", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "create", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "approve", resource: "schedule" },
  ],

  ProgrammeScheduler: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "create", resource: "schedule" },
    { action: "update", resource: "schedule" },
    { action: "read", resource: "rights" },
  ],

  AcquisitionsCommissioningManager: [
    { action: "read", resource: "rights" },
    { action: "create", resource: "rights" },
    { action: "update", resource: "rights" },
    { action: "approve", resource: "rights" },
    { action: "read", resource: "contract" },
    { action: "create", resource: "contract" },
    { action: "update", resource: "contract" },
  ],

  CommercialTrafficOfficer: [
    { action: "read", resource: "traffic" },
    { action: "create", resource: "traffic" },
    { action: "update", resource: "traffic" },
    { action: "read", resource: "schedule" },
  ],

  BroadcastOperationsManager: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "playout" },
    { action: "update", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "read", resource: "schedule" },
  ],

  PlayoutMcoOperator: [
    { action: "read", resource: "playout" },
    { action: "update", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "read", resource: "schedule" },
  ],

  BroadcastEngineer: [
    { action: "read", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "read", resource: "broadcast" },
  ],

  EpgMetadataCoordinator: [
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "update", resource: "schedule" },
  ],

  PromoProducer: [
    { action: "read", resource: "broadcast" },
    { action: "create", resource: "broadcast" },
    { action: "read", resource: "schedule" },
  ],

  AdSalesCommercialManager: [
    { action: "read", resource: "traffic" },
    { action: "create", resource: "traffic" },
    { action: "update", resource: "traffic" },
    { action: "approve", resource: "traffic" },
    { action: "read", resource: "finance" },
  ],

  SponsorshipManager: [
    { action: "read", resource: "traffic" },
    { action: "create", resource: "traffic" },
    { action: "update", resource: "traffic" },
    { action: "read", resource: "contract" },
  ],

  BroadcastRightsCoordinator: [
    { action: "read", resource: "rights" },
    { action: "create", resource: "rights" },
    { action: "update", resource: "rights" },
  ],

  BroadcastFinanceAssurance: [
    { action: "read", resource: "finance" },
    { action: "approve", resource: "finance" },
    { action: "read", resource: "traffic" },
  ],

  CarriagePlatformOwner: [
    { action: "read", resource: "broadcast" },
    { action: "update", resource: "broadcast" },
  ],

  MCRSupervisor: [
    { action: "read", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "update", resource: "playout" },
    { action: "read", resource: "broadcast" },
    { action: "execute", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "read", resource: "traffic" },
    { action: "read", resource: "audit" },
  ],

  Operator: [
    { action: "read", resource: "playout" },
    { action: "execute", resource: "playout" },
    { action: "read", resource: "broadcast" },
    { action: "read", resource: "schedule" },
    { action: "read", resource: "traffic" },
  ],
};

/**
 * Programmatic permission seeding for resource families whose rules derive
 * mechanically from existing role semantics (e.g. DAM storage operations).
 * Keeps ROLE_PERMISSIONS declarative while avoiding hand-written duplication.
 */
export function registerDerivedRolePermissions(
  resource: EnterpriseResource,
  rulesForRole: (role: EnterpriseRole) => PermissionRule[]
): void {
  for (const role of Object.keys(ROLE_PERMISSIONS) as EnterpriseRole[]) {
    const derived = rulesForRole(role);
    const existing = ROLE_PERMISSIONS[role];
    for (const rule of derived) {
      const alreadyGranted = existing.some(
        (perm) => perm.action === rule.action && perm.resource === rule.resource
      );
      if (!alreadyGranted) {
        existing.push(rule);
      }
    }
  }
}

// Storage permissions derive from existing broadcast permissions: any role that
// may create or update broadcast assets may upload DAM assets; read access
// follows read:broadcast; delete follows delete:broadcast.
registerDerivedRolePermissions("storage", (role) => {
  const perms = ROLE_PERMISSIONS[role];
  const rules: PermissionRule[] = [];
  if (perms.some((p) => p.resource === "broadcast" && (p.action === "create" || p.action === "update"))) {
    rules.push({ action: "create", resource: "storage" });
  }
  if (perms.some((p) => p.resource === "broadcast" && p.action === "read")) {
    rules.push({ action: "read", resource: "storage" });
  }
  if (perms.some((p) => p.resource === "broadcast" && p.action === "delete")) {
    rules.push({ action: "delete", resource: "storage" });
  }
  return rules;
});

// Editorial content (UX-CMS): create/edit derives from broadcast authoring;
// publication (update) requires schedule or broadcast mutation authority;
// approval derives from schedule/broadcast approval rights.
registerDerivedRolePermissions("content", (role) => {
  const perms = ROLE_PERMISSIONS[role];
  const rules: PermissionRule[] = [];
  if (perms.some((p) => p.resource === "broadcast" && (p.action === "create" || p.action === "update"))) {
    rules.push({ action: "create", resource: "content" });
    rules.push({ action: "update", resource: "content" });
  }
  if (perms.some((p) => p.resource === "broadcast" && p.action === "read")) {
    rules.push({ action: "read", resource: "content" });
  }
  if (perms.some((p) => (p.resource === "broadcast" || p.resource === "schedule") && p.action === "approve")) {
    rules.push({ action: "approve", resource: "content" });
  }
  return rules;
});

// Restricted privacy/security cases (UX-GOV-009/010): only operators with
// audit read may open/work cases; assignment and transitions require update.
// Case CONTENT reads are further restricted to the assigned case owner by the
// cases domain itself (canReadCase) — RBAC only admits the queue.
registerDerivedRolePermissions("case", (role) => {
  const perms = ROLE_PERMISSIONS[role];
  const rules: PermissionRule[] = [];
  if (perms.some((p) => p.resource === "audit" && p.action === "read")) {
    rules.push({ action: "read", resource: "case" });
    rules.push({ action: "create", resource: "case" });
    rules.push({ action: "update", resource: "case" });
  }
  return rules;
});

// TODO-SCR-19: risk/issue register mutations derive from broadcast or schedule
// update authority (operational governance), plus finance/approval authority.
registerDerivedRolePermissions("risk", (role) => {
  const perms = ROLE_PERMISSIONS[role];
  const rules: PermissionRule[] = [];
  if (
    perms.some(
      (p) =>
        ((p.resource === "broadcast" || p.resource === "schedule") && p.action === "update") ||
        (p.resource === "finance" && (p.action === "approve" || p.action === "update"))
    )
  ) {
    rules.push({ action: "update", resource: "risk" });
    rules.push({ action: "read", resource: "risk" });
  }
  return rules;
});

// Enquiry access follows the route's explicitly approved roles. Do not infer
// mutation rights from broad read permissions on talent/contracts.
registerDerivedRolePermissions("enquiry", (role) => {
  const rules: PermissionRule[] = [];
  if (["SuperAdmin", "ExecutiveLeader", "CommercialTrafficOfficer", "TrafficManager", "Auditor"].includes(role)) {
    rules.push({ action: "read", resource: "enquiry" });
  }
  if (["SuperAdmin", "ExecutiveLeader", "CommercialTrafficOfficer"].includes(role)) {
    rules.push({ action: "create", resource: "enquiry" });
    rules.push({ action: "update", resource: "enquiry" });
  }
  return rules;
});

/**
 * Startup and CI Invariant:
 * Asserts that every role referenced in the credential store exists in the RBAC permissions matrix.
 */
export function assertSeedRolesConformToRbac(seedRoles: string[]): boolean {
  const definedRoles = new Set(Object.keys(ROLE_PERMISSIONS));
  for (const role of seedRoles) {
    if (!definedRoles.has(role)) {
      throw new Error(`[VMNL-RBAC-INVARIANT] Seeded role '${role}' is not defined in ROLE_PERMISSIONS matrix.`);
    }
  }
  return true;
}

/**
 * Evaluates whether a user with given roles can perform an action on a resource.
 * Supports multi-tenant scoping and attribute-based contextual constraints.
 */
export function canPerform(
  user: SessionUser,
  action: EnterpriseAction,
  resource: EnterpriseResource,
  context?: AccessContext
): boolean {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }

  // Tenant Boundary Check: If context specifies tenant, user must belong to tenant or be SuperAdmin
  if (context?.tenantId && user.tenantId && user.tenantId !== context.tenantId) {
    if (!user.roles.includes("SuperAdmin")) {
      return false;
    }
  }

  // Schedule Lock Invariant: When schedule is locked, only BroadcastDirector or SuperAdmin can update
  if (resource === "schedule" && action === "update" && context?.isScheduleLocked) {
    if (!user.roles.includes("BroadcastDirector") && !user.roles.includes("SuperAdmin")) {
      return false;
    }
  }

  // Iterate over user roles to check if any role grants the permission
  for (const roleName of user.roles) {
    const rolePermissions = ROLE_PERMISSIONS[roleName as EnterpriseRole];
    if (!rolePermissions) continue;

    const hasMatch = rolePermissions.some(
      (perm) => perm.action === action && perm.resource === resource
    );

    if (hasMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Asserts permission, throwing an authorization error if denied.
 */
export function assertPermission(
  user: SessionUser,
  action: EnterpriseAction,
  resource: EnterpriseResource,
  context?: AccessContext
): void {
  if (!canPerform(user, action, resource, context)) {
    throw new Error(
      `[VMNL-FORBIDDEN] User '${user.userId}' with roles [${user.roles.join(
        ", "
      )}] is not authorized to '${action}' on resource '${resource}'`
    );
  }
}
