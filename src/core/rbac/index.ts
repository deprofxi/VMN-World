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
 * PR-09: the request-scoped attribute context the central authorization helper
 * is meant to consume. Before this, every `canPerform` call site passed three
 * arguments, so the tenant predicate and the schedule-lock invariant in the
 * policy engine were unreachable and the two dead branches read like controls.
 *
 * `AccessContext.tenantId` is the tenant a request *claims* to be acting in. A
 * claim can only ever deny: `evaluateAccess` refuses it unless it is the
 * caller's own tenant (or the caller is a SuperAdmin), so supplying it from an
 * untrusted header cannot grant anything a session did not already have.
 */
export const TENANT_SCOPE_HEADER = "x-tenant-id";

export type AccessDenialReason = "TENANT_SCOPE" | "SCHEDULE_LOCK" | "NO_ROLE_PERMISSION";

export interface AccessDecision {
  allowed: boolean;
  /** Present whenever `allowed` is false, so a refusal can say why. */
  reason?: AccessDenialReason;
}

/** Thrown by `assertPermission`; carries the failing predicate for the caller. */
export class AuthorizationError extends Error {
  public readonly reason: AccessDenialReason;
  public readonly action: EnterpriseAction;
  public readonly resource: EnterpriseResource;
  public readonly tenantId?: string;

  constructor(params: {
    user: SessionUser;
    action: EnterpriseAction;
    resource: EnterpriseResource;
    reason: AccessDenialReason;
    tenantId?: string;
  }) {
    super(
      `[VMNL-FORBIDDEN] User '${params.user.userId}' with roles [${params.user.roles.join(
        ", "
      )}] is not authorized to '${params.action}' on resource '${params.resource}'`
    );
    this.name = "AuthorizationError";
    this.reason = params.reason;
    this.action = params.action;
    this.resource = params.resource;
    this.tenantId = params.tenantId;
  }
}

/**
 * Builds the attribute context for one request from a single resolver, so every
 * authorization decision on that request is made against the same claims.
 *
 * Precedence for the tenant claim: an explicit tenant named by the route, then
 * the request's `x-tenant-id` claim, then the session's own tenant. The final
 * fallback is what makes the predicate run *by construction* — a context is
 * always supplied — while a claim that names someone else's tenant is refused by
 * `evaluateAccess` rather than quietly narrowing the caller's scope.
 *
 * Isolation itself remains handler-level (`tenantId` filters on the queries the
 * handler runs, plus the domain guards in `core/storage` and `core/content`),
 * which `tests/unit/tenant-scoping-routes.test.ts` proves end to end. This
 * context adds the central refusal; it does not replace those.
 */
export function accessContextFor(
  user: SessionUser | null | undefined,
  headers: Record<string, string | string[] | undefined> = {},
  options: { requestedTenantId?: string; isScheduleLocked?: boolean } = {}
): AccessContext {
  const raw = headers[TENANT_SCOPE_HEADER];
  const claimed = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const tenantId = options.requestedTenantId || (claimed ? claimed : user?.tenantId);
  return {
    ...(tenantId ? { tenantId } : {}),
    ...(options.isScheduleLocked === undefined ? {} : { isScheduleLocked: options.isScheduleLocked }),
  };
}

/**
 * The policy engine: returns the decision *and* the predicate that produced it,
 * so a caller (the HTTP layer) can answer with the real reason instead of a
 * generic refusal.
 */
export function evaluateAccess(
  user: SessionUser,
  action: EnterpriseAction,
  resource: EnterpriseResource,
  context?: AccessContext
): AccessDecision {
  if (!user || !user.roles || user.roles.length === 0) {
    return { allowed: false, reason: "NO_ROLE_PERMISSION" };
  }

  const isSuperAdmin = user.roles.includes("SuperAdmin");

  // Tenant Boundary Check: the tenant a request claims must be the caller's own.
  // The pre-fix form — `context?.tenantId && user.tenantId && user.tenantId !==
  // context.tenantId` — failed OPEN for a session carrying no tenant at all, so
  // the one shape that most needs the boundary (an unscoped credential) was the
  // one shape the boundary never applied to.
  if (context?.tenantId && context.tenantId !== user.tenantId && !isSuperAdmin) {
    return { allowed: false, reason: "TENANT_SCOPE" };
  }

  // Schedule Lock Invariant: When schedule is locked, only BroadcastDirector or SuperAdmin can update
  if (resource === "schedule" && action === "update" && context?.isScheduleLocked && !isSuperAdmin) {
    if (!user.roles.includes("BroadcastDirector")) {
      return { allowed: false, reason: "SCHEDULE_LOCK" };
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
      return { allowed: true };
    }
  }

  return { allowed: false, reason: "NO_ROLE_PERMISSION" };
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
  return evaluateAccess(user, action, resource, context).allowed;
}

/**
 * Asserts permission, throwing an authorization error if denied. Used by the
 * HTTP layer (`assertRoutePermission`), which shapes the throw into the
 * protocol answer and keeps the reason.
 */
export function assertPermission(
  user: SessionUser,
  action: EnterpriseAction,
  resource: EnterpriseResource,
  context?: AccessContext
): void {
  const decision = evaluateAccess(user, action, resource, context);
  if (!decision.allowed) {
    throw new AuthorizationError({
      user,
      action,
      resource,
      reason: decision.reason ?? "NO_ROLE_PERMISSION",
      tenantId: context?.tenantId,
    });
  }
}
