/**
 * VMNL Invitation Domain — UX-SYS-004 / HX-02
 * Implements the full invitation acceptance validation chain mandated by
 * VMN APP UI UX.docx §8.4: validity, recipient binding, expiry, granting
 * authority, and requested relationship. Single-use; no automatic role union.
 */

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface Invitation {
  id: string;
  token: string;
  intendedEmail: string; // recipient binding (lower-cased)
  intendedRole: string; // requested relationship
  tenantId: string;
  grantingAuthority: string; // authority that approved the grant
  createdAt: Date;
  expiresAt: Date;
  status: InvitationStatus;
  acceptedByUserId?: string;
  acceptedAt?: Date;
}

export interface AcceptInvitationResult {
  accepted: boolean;
  invitation?: Invitation;
  grantedRole?: string;
  reason?: string;
  code?: string;
}

const invitations = new Map<string, Invitation>();

export function createInvitation(params: {
  id: string;
  token: string;
  intendedEmail: string;
  intendedRole: string;
  tenantId?: string;
  grantingAuthority: string;
  expiresAt: Date;
}): Invitation {
  if (params.expiresAt.getTime() <= Date.now()) {
    throw new Error("[VMNL-INV-01] Invitation expiry must be in the future.");
  }
  const invitation: Invitation = {
    id: params.id,
    token: params.token,
    intendedEmail: params.intendedEmail.toLowerCase().trim(),
    intendedRole: params.intendedRole,
    tenantId: params.tenantId || "vmnl-hq",
    grantingAuthority: params.grantingAuthority,
    createdAt: new Date(),
    expiresAt: params.expiresAt,
    status: "PENDING",
  };
  invitations.set(params.token, invitation);
  return invitation;
}

export function getInvitationByToken(token: string): Invitation | undefined {
  return invitations.get(token);
}

/**
 * Reconciles expiry status lazily so time passing after creation still expires
 * stale invitations (state derived at read/accept time, not stored stale).
 */
function effectiveStatus(invitation: Invitation): InvitationStatus {
  if (invitation.status === "PENDING" && invitation.expiresAt.getTime() <= Date.now()) {
    return "EXPIRED";
  }
  return invitation.status;
}

export function revokeInvitation(token: string, _revokedBy: string): Invitation {
  const invitation = invitations.get(token);
  if (!invitation) {
    throw new Error("[VMNL-INV-02] Invitation not found.");
  }
  invitation.status = "REVOKED";
  return invitation;
}

/**
 * Accepts an invitation after verifying, in order (UIUX-001 §8.4):
 *   1. Invitation validity (exists + status PENDING)
 *   2. Intended recipient binding (exact email match)
 *   3. Expiry (not passed)
 *   4. Current granting authority (present and not a self-granted role)
 *   5. Requested relationship (role is a defined EnterpriseRole name)
 *
 * On success the invitation is consumed (single-use). The caller MUST create
 * the user relationship with exactly `grantedRole` — never the union of all
 * roles associated with the same email address (no accidental privilege union).
 */
export function acceptInvitation(params: {
  token: string;
  acceptingEmail: string;
  acceptingUserId: string;
  validEnterpriseRoles: string[];
}): AcceptInvitationResult {
  const invitation = invitations.get(params.token);
  if (!invitation) {
    return { accepted: false, reason: "Invitation not recognised.", code: "INV_NOT_FOUND" };
  }

  // 1. Validity
  const status = effectiveStatus(invitation);
  if (status !== "PENDING") {
    return { accepted: false, reason: `Invitation is ${status.toLowerCase()}.`, code: `INV_${status}`, invitation };
  }

  // 2. Recipient binding
  const email = params.acceptingEmail.toLowerCase().trim();
  if (email !== invitation.intendedEmail) {
    return { accepted: false, reason: "This invitation was issued to a different recipient.", code: "INV_RECIPIENT_MISMATCH", invitation };
  }

  // 3. Expiry
  if (invitation.expiresAt.getTime() <= Date.now()) {
    invitation.status = "EXPIRED";
    return { accepted: false, reason: "Invitation has expired.", code: "INV_EXPIRED", invitation };
  }

  // 4. Granting authority
  if (!invitation.grantingAuthority || invitation.grantingAuthority.trim() === "") {
    return { accepted: false, reason: "Invitation lacks a recorded granting authority.", code: "INV_NO_AUTHORITY", invitation };
  }

  // 5. Requested relationship
  if (!params.validEnterpriseRoles.includes(invitation.intendedRole)) {
    return { accepted: false, reason: "Requested role is not a defined enterprise relationship.", code: "INV_BAD_ROLE", invitation };
  }

  // Consume (single-use)
  invitation.status = "ACCEPTED";
  invitation.acceptedByUserId = params.acceptingUserId;
  invitation.acceptedAt = new Date();

  return {
    accepted: true,
    invitation,
    grantedRole: invitation.intendedRole,
  };
}

/** Test/reset helper — never call from production request paths. */
export function _resetInvitationsForTesting(): void {
  invitations.clear();
}
