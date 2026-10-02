/**
 * VMNL Enterprise Identity, Authentication & RBAC Presentation Shell
 * Authority: VMN APP UI UX.docx §8.4 / VMN UI UX CLAUDE CODE PROMPTS .docx S-IDENTITY (UX-SYS-001 to UX-SYS-014)
 * Journey: J-RL1-02 (Sign in, select relationship and enter authorised work)
 *
 * Implements complete UX-SYS identity and access suite:
 * - UX-SYS-001: Sign In (with sandbox one-click persona quick switch)
 * - UX-SYS-002: MFA / Step-Up Authentication
 * - UX-SYS-003: Account Recovery (generic confirmation, zero account leakage)
 * - UX-SYS-004: Invitation Acceptance
 * - UX-SYS-005: First-Use Profile Review
 * - UX-SYS-006: Workspace and Relationship Selection (Multi-Role Hub)
 * - UX-SYS-007: Session Expired / Resume
 * - UX-SYS-008: Access Unavailable / 403 Forbidden with Next Steps
 * - UX-SYS-009: Access Request Form
 * - UX-SYS-010: Sign Out Confirmation
 * - UX-SYS-011: Account and Profile Settings
 * - UX-SYS-012: Notification Preferences
 * - UX-SYS-013: Active Sessions and Revocation
 * - UX-SYS-014: Contextual Operator Help & SOPs
 */

import { SessionUser } from "../../core/auth/index.js";
import { EnterpriseRole } from "../../core/rbac/index.js";
import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";

export interface SandboxPersona {
  email: string;
  name: string;
  role: EnterpriseRole;
  badgeTone: "success" | "warning" | "info" | "neutral";
  description: string;
  defaultDestination: string;
}

export const SANDBOX_PERSONAS: SandboxPersona[] = [
  {
    email: "admin@vmnl.ng",
    name: "System SuperAdmin",
    role: "SuperAdmin",
    badgeTone: "warning",
    description: "Full platform governance, feature flag console, cryptographic audit logs",
    defaultDestination: "/admin/feature-flags",
  },
  {
    email: "director@vmnl.ng",
    name: "Broadcast Director",
    role: "BroadcastDirector",
    badgeTone: "info",
    description: "Broadcast transmission authority, channel lineup, emergency filler",
    defaultDestination: "/broadcast/dashboard",
  },
  {
    email: "mcr@vmnl.ng",
    name: "MCR Supervisor",
    role: "MCRSupervisor",
    badgeTone: "success",
    description: "Master Control Room duty stations, 33 operational linear screens, playout",
    defaultDestination: "/broadcast/screens",
  },
  {
    email: "scheduler@vmnl.ng",
    name: "Programme Scheduler",
    role: "ProgrammeScheduler",
    badgeTone: "neutral",
    description: "7-day rolling EPG scheduling, conflict detection, transmission grids",
    defaultDestination: "/broadcast/screens/SCR-BCST-01",
  },
  {
    email: "traffic@vmnl.ng",
    name: "Commercial Traffic Officer",
    role: "CommercialTrafficOfficer",
    badgeTone: "neutral",
    description: "Ad sales placement, commercial break compliance, log reconciliation",
    defaultDestination: "/broadcast/screens/SCR-BCST-04",
  },
  {
    email: "rights@vmnl.ng",
    name: "Broadcast Rights Coordinator",
    role: "BroadcastRightsCoordinator",
    badgeTone: "info",
    description: "Licensing windows, territory restrictions, StarTimes carriage clearance",
    defaultDestination: "/broadcast/screens/SCR-BCST-03",
  },
  {
    email: "finance@vmnl.ng",
    name: "Finance Controller",
    role: "FinanceController",
    badgeTone: "success",
    description: "General ledger, Paystack/Flutterwave recon, SWIFT MT940, 85/15 talent payouts",
    defaultDestination: "/workspace",
  },
  {
    email: "talent@vmnl.ng",
    name: "Virtual Talent Manager",
    role: "TalentManager",
    badgeTone: "info",
    description: "Talent casting roster, buyout tiers, 85/15 contract digital execution",
    defaultDestination: "/vtm/marketplace",
  },
  {
    email: "operator@vmnl.ng",
    name: "Broadcast Operator",
    role: "Operator",
    badgeTone: "neutral",
    description: "Continuity monitoring, live cueing, playout incident reporting",
    defaultDestination: "/broadcast/screens/SCR-BCST-05",
  },
  {
    email: "auditor@vmnl.ng",
    name: "Compliance Auditor",
    role: "Auditor",
    badgeTone: "warning",
    description: "Independent audit chain verification, NBC compliance, SLA conformance",
    defaultDestination: "/admin/feature-flags",
  },
];

/**
 * UX-SYS-001: Sign In Screen
 */
export function renderSignInHtml(options?: {
  error?: string;
  returnUrl?: string;
  email?: string;
  message?: string;
}): string {
  const returnUrl = options?.returnUrl ? escapeHtml(options.returnUrl) : "/workspace";
  const errorMessage = options?.error ? escapeHtml(options.error) : "";
  const infoMessage = options?.message ? escapeHtml(options.message) : "";
  const initialEmail = options?.email ? escapeHtml(options.email) : "";

  const personasHtml = SANDBOX_PERSONAS.map((p) => `
    <form method="POST" action="/sign-in" style="margin: 0;">
      <input type="hidden" name="email" value="${escapeHtml(p.email)}" />
      <input type="hidden" name="quickPersona" value="true" />
      <input type="hidden" name="returnUrl" value="${returnUrl}" />
      <button type="submit" class="persona-card" style="width: 100%; text-align: left; background: var(--vmn-color-surface-subtle); border: 1px solid var(--vmn-color-border-subtle); border-radius: var(--vmn-radius-md); padding: 12px 14px; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; gap: 4px; min-height: 44px;">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <strong style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-primary-text);">${escapeHtml(p.name)}</strong>
          <span class="vmn-badge badge-${p.badgeTone}" style="font-size: 0.7rem; font-weight: 700;">${escapeHtml(p.role)}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${escapeHtml(p.email)}</div>
        <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); line-height: 1.3;">${escapeHtml(p.description)}</div>
      </button>
    </form>
  `).join("");

  return `
    <div style="max-width: 960px; margin: 32px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--vmn-accent-primary); color: #FFFFFF; margin-bottom: 16px;">
          ${renderIcon("lock", { size: 28 })}
        </div>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-color-primary-text); margin-bottom: 8px;">
          Virtual Media Network Limited
        </h1>
        <p style="font-size: var(--vmn-font-size-base); color: var(--vmn-color-secondary-text); max-width: 560px; margin: 0 auto;">
          Enterprise Identity &amp; Role-Based Presentation Shell (S-IDENTITY &bull; UX-SYS-001)
        </p>
      </div>

      ${errorMessage ? `
        <div class="vmn-card" style="border-left: 4px solid #DC2626; background: #FEF2F2; color: #991B1B; padding: 14px 18px; margin-bottom: 24px; border-radius: var(--vmn-radius-md);" role="alert">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderIcon("alert", { size: 18 })}
            <strong>Authentication Failed:</strong> ${errorMessage}
          </div>
        </div>
      ` : ""}

      ${infoMessage ? `
        <div class="vmn-card" style="border-left: 4px solid #059669; background: #ECFDF5; color: #065F46; padding: 14px 18px; margin-bottom: 24px; border-radius: var(--vmn-radius-md);" role="status">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderIcon("check", { size: 18 })}
            ${infoMessage}
          </div>
        </div>
      ` : ""}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; align-items: start;">
        <!-- Left Column: Standard Password Authentication Form -->
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h2 style="font-size: var(--vmn-font-size-xl); font-weight: 700; color: var(--vmn-color-primary-text); margin-bottom: 8px;">
            Enterprise Sign In
          </h2>
          <p style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-secondary-text); margin-bottom: 24px;">
            Access linear broadcast operations, creative economy workspaces, or administrative tools.
          </p>

          <form method="POST" action="/sign-in" style="display: flex; flex-direction: column; gap: 20px;">
            <input type="hidden" name="returnUrl" value="${returnUrl}" />

            <div class="vmn-form-field">
              <label for="signin-email" class="vmn-label" style="display: block; font-weight: 600; margin-bottom: 6px; color: var(--vmn-color-primary-text);">
                Work Email Address <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                class="vmn-input"
                required
                autocomplete="username"
                value="${initialEmail}"
                placeholder="operator@vmnl.ng"
                style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); font-size: var(--vmn-font-size-base);"
              />
            </div>

            <div class="vmn-form-field">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label for="signin-password" class="vmn-label" style="font-weight: 600; color: var(--vmn-color-primary-text);">
                  Password <span style="color: #DC2626;" aria-hidden="true">*</span>
                </label>
                <a href="/auth/recovery" style="font-size: var(--vmn-font-size-xs); color: var(--vmn-accent-primary); text-decoration: underline;">
                  Forgot password?
                </a>
              </div>
              <input
                id="signin-password"
                name="password"
                type="password"
                class="vmn-input"
                required
                autocomplete="current-password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); font-size: var(--vmn-font-size-base);"
              />
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <input id="remember-me" name="rememberMe" type="checkbox" style="width: 18px; height: 18px;" checked />
              <label for="remember-me" style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-secondary-text);">
                Keep session active for 24 hours on this secure terminal
              </label>
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; min-height: 46px; font-weight: 700; font-size: var(--vmn-font-size-base); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;"
            >
              ${renderIcon("lock", { size: 18 })}
              Sign In to Workstation
            </button>
          </form>

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--vmn-color-border-subtle); display: flex; justify-content: space-between; font-size: var(--vmn-font-size-xs); color: var(--vmn-color-text-muted);">
            <span>Authority: R1.2A &bull; NBC Code</span>
            <a href="/help/operator" style="color: var(--vmn-color-secondary-text); text-decoration: underline;">Operator SOPs</a>
          </div>
        </div>

        <!-- Right Column: Sandbox One-Click Role Selector -->
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h2 style="font-size: var(--vmn-font-size-xl); font-weight: 700; color: var(--vmn-color-primary-text);">
              Sandbox Role Switcher
            </h2>
            <span class="vmn-badge badge-warning" style="font-size: 0.7rem; font-weight: 800;">DEVELOPER &amp; UAT</span>
          </div>
          <p style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-secondary-text); margin-bottom: 16px;">
            Select any enterprise persona to instantly sign in and verify role-based presentation context and screen access rules:
          </p>

          <div style="display: grid; grid-template-columns: 1fr; gap: 10px; max-height: 420px; overflow-y: auto; padding-right: 4px;">
            ${personasHtml}
          </div>

          <div style="margin-top: 16px; font-size: 0.75rem; color: var(--vmn-color-text-muted); text-align: center;">
            Tokens conform to salted bcrypt hashes loaded via <code>DEV_SEED_PASSWORD</code> (Zero plaintext in source).
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-002: MFA / Step-Up Authentication Screen
 */
export function renderMfaStepUpHtml(options?: {
  returnUrl?: string;
  error?: string;
  userEmail?: string;
}): string {
  const returnUrl = options?.returnUrl ? escapeHtml(options.returnUrl) : "/workspace";
  const errorMessage = options?.error ? escapeHtml(options.error) : "";
  const email = options?.userEmail ? escapeHtml(options.userEmail) : "operator@vmnl.ng";

  return `
    <div style="max-width: 520px; margin: 48px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.08); text-align: center;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #EFF6FF; color: #2563EB; margin-bottom: 20px;">
          ${renderIcon("shield", { size: 28 })}
        </div>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin-bottom: 8px;">
          Step-Up Authentication
        </h1>
        <p style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-secondary-text); margin-bottom: 24px; line-height: 1.5;">
          The requested action requires elevated verification for <strong>${email}</strong>. Enter the 6-digit verification code from your authenticator app or hardware token (UX-SYS-002).
        </p>

        ${errorMessage ? `
          <div style="border-left: 4px solid #DC2626; background: #FEF2F2; color: #991B1B; padding: 12px; margin-bottom: 20px; text-align: left; border-radius: 4px; font-size: 0.85rem;" role="alert">
            ${errorMessage}
          </div>
        ` : ""}

        <form method="POST" action="/auth/mfa" style="display: flex; flex-direction: column; gap: 20px; text-align: left;">
          <input type="hidden" name="returnUrl" value="${returnUrl}" />

          <div class="vmn-form-field">
            <label for="mfa-code" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              6-Digit Security Code <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="mfa-code"
              name="mfaCode"
              type="text"
              class="vmn-input"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123456"
              style="width: 100%; min-height: 48px; text-align: center; letter-spacing: 0.35em; font-family: monospace; font-size: 1.4rem; font-weight: 700; border: 2px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width: 100%; min-height: 46px; font-weight: 700; font-size: var(--vmn-font-size-base); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;"
          >
            Verify &amp; Elevate Access
          </button>
        </form>

        <div style="margin-top: 24px; font-size: var(--vmn-font-size-xs); color: var(--vmn-color-text-muted);">
          Lost authenticator? <a href="/help/operator" style="color: var(--vmn-accent-primary); text-decoration: underline;">Contact MCR Supervisor</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-003: Account Recovery Screen
 */
export function renderAccountRecoveryHtml(options?: {
  submitted?: boolean;
  email?: string;
}): string {
  const isSubmitted = Boolean(options?.submitted);
  const email = options?.email ? escapeHtml(options.email) : "";

  return `
    <div style="max-width: 520px; margin: 48px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #FEF3C7; color: #D97706; margin-bottom: 16px;">
            ${renderIcon("refresh", { size: 28 })}
          </div>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin-bottom: 8px;">
            Account Recovery
          </h1>
          <p style="font-size: var(--vmn-font-size-sm); color: var(--vmn-color-secondary-text);">
            UX-SYS-003 &bull; Privacy-Safe Identity Recovery
          </p>
        </div>

        ${isSubmitted ? `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--vmn-radius-md); padding: 20px; color: #065F46; line-height: 1.6; margin-bottom: 24px;">
            <strong style="display: block; font-size: 1rem; margin-bottom: 6px;">Recovery Instructions Dispatched</strong>
            <p style="margin: 0; font-size: 0.9rem;">
              If a registered enterprise profile matches the address provided, a secure, time-bounded recovery token has been transmitted. In accordance with security policy §8.4, confirmation does not disclose account presence.
            </p>
          </div>
          <div style="text-align: center;">
            <a href="/sign-in" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 24px;">
              Return to Sign In
            </a>
          </div>
        ` : `
          <p style="font-size: 0.9rem; color: var(--vmn-color-secondary-text); margin-bottom: 20px; line-height: 1.5;">
            Enter your work email address below. We will send you instructions to securely reset your credentials and restore access to your assigned duty stations.
          </p>
          <form method="POST" action="/auth/recovery" style="display: flex; flex-direction: column; gap: 20px;">
            <div class="vmn-form-field">
              <label for="recovery-email" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Work Email Address <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                class="vmn-input"
                required
                value="${email}"
                placeholder="operator@vmnl.ng"
                style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 46px; font-weight: 700; cursor: pointer;">
              Send Recovery Link
            </button>
            <div style="text-align: center;">
              <a href="/sign-in" style="font-size: 0.85rem; color: var(--vmn-accent-primary); text-decoration: underline;">
                Back to Sign In
              </a>
            </div>
          </form>
        `}
      </div>
    </div>
  `;
}

/**
 * UX-SYS-006: Workspace and Relationship Selection Screen (Journey J-RL1-02)
 */
export function renderWorkspaceSelectionHtml(
  user: SessionUser,
  currentRole?: string,
  returnUrl?: string
): string {
  const activeRole = currentRole || user.roles[0] || "Operator";
  const userRoles = user.roles.length > 0 ? user.roles : ["Operator"];

  const roleWorkspaces: Array<{
    role: EnterpriseRole;
    title: string;
    subtitle: string;
    url: string;
    icon: string;
    description: string;
  }> = [
    {
      role: "SuperAdmin",
      title: "Executive & Admin Console",
      subtitle: "UX-ADM-001 to 004",
      url: "/admin/feature-flags",
      icon: "shield",
      description: "Feature flag toggles, master system configuration, chained audit logs, and enterprise-wide governance.",
    },
    {
      role: "MCRSupervisor",
      title: "Master Control Room Consoles",
      subtitle: "SCR-BCST-01 to 33",
      url: "/broadcast/screens",
      icon: "broadcast",
      description: "Direct linear television operations across all 3 channels (NXTR 428, ORIS 430, IMBD 432) and 10 duty stations.",
    },
    {
      role: "BroadcastDirector",
      title: "Broadcast Executive Station",
      subtitle: "UX-BCST-001 to 033",
      url: "/broadcast/dashboard",
      icon: "tv",
      description: "Transmission executive oversight, NBC code compliance, StarTimes carriage metrics, and emergency filler.",
    },
    {
      role: "CommercialTrafficOfficer",
      title: "Commercial & Traffic Desk",
      subtitle: "UX-COM-001 to 012",
      url: "/broadcast/screens/SCR-BCST-04",
      icon: "document",
      description: "Ad placement bookings, rate card management, commercial spot logs, and as-run compliance checks.",
    },
    {
      role: "ProgrammeScheduler",
      title: "Programme Scheduling & EPG",
      subtitle: "SCR-BCST-01 & 02",
      url: "/broadcast/screens/SCR-BCST-01",
      icon: "calendar",
      description: "7-day rolling EPG scheduler, programme rights verification, metadata coordination, and grid conflict locks.",
    },
    {
      role: "FinanceController",
      title: "Financial Ledger & Payouts",
      subtitle: "UX-FIN-001 to 015",
      url: "/workspace",
      icon: "check",
      description: "Quote-to-cash billing, Paystack/Flutterwave idempotent recon, SWIFT MT940, and 85/15 escrow payouts.",
    },
    {
      role: "TalentManager",
      title: "Virtual Talent Marketplace",
      subtitle: "UX-VTM-001 to 010",
      url: "/vtm/marketplace",
      icon: "shield",
      description: "Talent discovery roster, buyout tier multipliers, digital contract execution, and 85/15 payout transparency.",
    },
    {
      role: "AcademyDirector",
      title: "AFCA Admissions & LMS",
      subtitle: "UX-AFCA-001 to 008",
      url: "/workspace/afca",
      icon: "film",
      description: "Academy curriculum planning, student gradebook, assignment rubrics, and applicant review workbench.",
    },
    {
      role: "Operator",
      title: "Playout Operator Console",
      subtitle: "SCR-BCST-05 to 08",
      url: "/broadcast/screens/SCR-BCST-05",
      icon: "play",
      description: "Real-time playout automation, live countdown, manual override, and continuity cue monitoring.",
    },
    {
      role: "Auditor",
      title: "Independent Compliance Audit",
      subtitle: "UX-GOV-001 to 010",
      url: "/admin/feature-flags",
      icon: "shield",
      description: "Cryptographic SHA-256 ledger tamper inspection, NBC licensing audit, and SLA uptime records.",
    },
  ];

  const cardsHtml = roleWorkspaces.map((ws) => {
    const hasRole = userRoles.includes(ws.role) || userRoles.includes("SuperAdmin");
    const isCurrent = ws.role === activeRole;

    return `
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 2px solid ${isCurrent ? "var(--vmn-accent-primary)" : "var(--vmn-color-border)"}; border-radius: var(--vmn-radius-lg); padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background: var(--vmn-color-surface-subtle); display: flex; align-items: center; justify-content: center; color: var(--vmn-accent-primary);">
                ${renderIcon(ws.icon as any, { size: 20 })}
              </div>
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--vmn-color-primary-text); margin: 0;">${escapeHtml(ws.title)}</h3>
                <span style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">${escapeHtml(ws.subtitle)}</span>
              </div>
            </div>
            ${isCurrent ? '<span class="vmn-badge badge-ready" style="font-size: 0.7rem; font-weight: 700;">CURRENT ACTIVE</span>' : ""}
          </div>
          <p style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-bottom: 16px; line-height: 1.5;">
            ${escapeHtml(ws.description)}
          </p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--vmn-color-border-subtle);">
          <span style="font-size: 0.75rem; font-weight: 600; color: ${hasRole ? "var(--vmn-color-primary-text)" : "var(--vmn-color-text-muted)"};">
            ${hasRole ? "Authorized" : "Access Request Required"}
          </span>

          ${hasRole ? `
            <a href="${escapeHtml(ws.url)}" class="btn ${isCurrent ? "btn-primary" : "btn-outline"}" style="min-height: 44px; padding: 0 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
              Launch Workspace &rarr;
            </a>
          ` : `
            <a href="/access-request?role=${encodeURIComponent(ws.role)}" class="btn btn-secondary" style="min-height: 44px; padding: 0 14px; font-size: 0.85rem; display: inline-flex; align-items: center;">
              Request Access
            </a>
          `}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="max-width: 1080px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">IDENTITY CONTEXT &bull; J-RL1-02</span>
          <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">
            Select Operational Workspace
          </h1>
          <p style="font-size: var(--vmn-font-size-base); color: var(--vmn-color-secondary-text); margin: 0;">
            Logged in as <strong>${escapeHtml(user.email)}</strong> &bull; Assigned Roles: <code>${escapeHtml(userRoles.join(", "))}</code>
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <a href="/account/profile" class="btn btn-outline" style="min-height: 44px; font-size: 0.85rem; display: inline-flex; align-items: center; padding: 0 14px;">Account Settings</a>
          <a href="/sign-out" class="btn btn-secondary" style="min-height: 44px; font-size: 0.85rem; display: inline-flex; align-items: center; padding: 0 14px;">Sign Out</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        ${cardsHtml}
      </div>
    </div>
  `;
}

/**
 * UX-SYS-008: Access Unavailable / 403 Forbidden Screen
 */
export function renderAccessDeniedHtml(
  user: SessionUser | null,
  requiredPermissionOrRole?: string,
  attemptedUrl?: string
): string {
  const email = user ? escapeHtml(user.email) : "Anonymous User";
  const roles = user && user.roles.length > 0 ? escapeHtml(user.roles.join(", ")) : "None";
  const required = requiredPermissionOrRole ? escapeHtml(requiredPermissionOrRole) : "Elevated Operational Role";
  const url = attemptedUrl ? escapeHtml(attemptedUrl) : "/";

  return `
    <div style="max-width: 640px; margin: 48px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 2px solid #F87171; border-radius: var(--vmn-radius-lg); padding: 36px; text-align: center; box-shadow: 0 8px 16px -4px rgba(0,0,0,0.08);">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #FEF2F2; color: #DC2626; margin-bottom: 20px;">
          ${renderIcon("alert", { size: 28 })}
        </div>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin-bottom: 8px;">
          403 Access Unavailable
        </h1>
        <p style="font-size: var(--vmn-font-size-base); color: var(--vmn-color-secondary-text); margin-bottom: 24px; line-height: 1.5;">
          Your current session context does not hold the authorization required to access <code>${url}</code>.
        </p>

        <div style="background: var(--vmn-color-surface-subtle); border: 1px solid var(--vmn-color-border-subtle); border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.85rem; line-height: 1.6;">
          <div><strong>Authenticated As:</strong> ${email}</div>
          <div><strong>Assigned Roles:</strong> <code>${roles}</code></div>
          <div><strong>Required Permission:</strong> <span style="color: #DC2626; font-weight: 700;">${required}</span></div>
          <div><strong>Governance Code:</strong> R1.2A &sect;48 &bull; Strict Principle of Least Privilege</div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="/select-workspace" class="btn btn-primary" style="min-height: 44px; padding: 0 20px; font-weight: 600;">
            Switch Role / Workspace
          </a>
          <a href="/access-request?url=${encodeURIComponent(attemptedUrl || "")}" class="btn btn-outline" style="min-height: 44px; padding: 0 20px; font-weight: 600;">
            Request Elevation
          </a>
          <a href="/" class="btn btn-secondary" style="min-height: 44px; padding: 0 20px;">
            Return Home
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-009: Access Request Form
 */
export function renderAccessRequestHtml(
  user: SessionUser,
  defaultRole?: string,
  attemptedUrl?: string
): string {
  const role = defaultRole ? escapeHtml(defaultRole) : "MCRSupervisor";
  const url = attemptedUrl ? escapeHtml(attemptedUrl) : "/broadcast/screens";

  return `
    <div style="max-width: 600px; margin: 40px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div style="width: 44px; height: 44px; border-radius: 8px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center;">
            ${renderIcon("shield", { size: 24 })}
          </div>
          <div>
            <h1 style="font-size: var(--vmn-font-size-xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0;">
              Operational Access Elevation
            </h1>
            <span style="font-size: 0.8rem; color: var(--vmn-color-text-muted);">UX-SYS-009 &bull; Delegated Authority Governance</span>
          </div>
        </div>

        <p style="font-size: 0.9rem; color: var(--vmn-color-secondary-text); margin-bottom: 24px; line-height: 1.5;">
          Submit a time-bounded role elevation or permission request for user <strong>${escapeHtml(user.email)}</strong>. All access elevations are cryptographically sealed in the audit log.
        </p>

        <form method="POST" action="/access-request" style="display: flex; flex-direction: column; gap: 18px;">
          <input type="hidden" name="returnUrl" value="${url}" />

          <div class="vmn-form-field">
            <label for="req-role" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Target Operational Role <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <select id="req-role" name="role" class="vmn-input" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
              <option value="MCRSupervisor" ${role === "MCRSupervisor" ? "selected" : ""}>MCR Supervisor (Master Control Room)</option>
              <option value="BroadcastDirector" ${role === "BroadcastDirector" ? "selected" : ""}>Broadcast Director (Transmission Authority)</option>
              <option value="CommercialTrafficOfficer" ${role === "CommercialTrafficOfficer" ? "selected" : ""}>Commercial Traffic Officer</option>
              <option value="ProgrammeScheduler" ${role === "ProgrammeScheduler" ? "selected" : ""}>Programme Scheduler (EPG Grid)</option>
              <option value="BroadcastRightsCoordinator" ${role === "BroadcastRightsCoordinator" ? "selected" : ""}>Broadcast Rights Coordinator</option>
              <option value="FinanceController" ${role === "FinanceController" ? "selected" : ""}>Finance Controller</option>
              <option value="SuperAdmin" ${role === "SuperAdmin" ? "selected" : ""}>System SuperAdmin</option>
            </select>
          </div>

          <div class="vmn-form-field">
            <label for="req-duration" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Elevation Duration <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <select id="req-duration" name="duration" class="vmn-input" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
              <option value="SHIFT_8H">Single Shift (8 Hours)</option>
              <option value="EMERGENCY_24H">Emergency Outage Window (24 Hours)</option>
              <option value="PERMANENT">Permanent Duty Station Reassignment</option>
            </select>
          </div>

          <div class="vmn-form-field">
            <label for="req-justification" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Business &amp; Operational Justification <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <textarea
              id="req-justification"
              name="justification"
              required
              rows="4"
              class="vmn-input"
              placeholder="Detail the broadcast duty, incident reference, or operational requirement..."
              style="width: 100%; padding: 10px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            ></textarea>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-height: 46px; font-weight: 700; cursor: pointer;">
              Submit Access Request
            </button>
            <a href="/select-workspace" class="btn btn-secondary" style="min-height: 46px; padding: 0 20px; display: inline-flex; align-items: center;">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-011: Account and Profile Settings
 */
export function renderAccountSettingsHtml(user: SessionUser): string {
  return `
    <div style="max-width: 800px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-neutral" style="margin-bottom: 8px; font-weight: 700;">USER PROFILE &bull; UX-SYS-011</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0;">
          Account &amp; Security Settings
        </h1>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px; margin-bottom: 24px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
          Operator Identity
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Email Address</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--vmn-color-primary-text);">${escapeHtml(user.email)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">User Identifier</div>
            <div style="font-size: 0.9rem; font-family: monospace; color: var(--vmn-color-secondary-text);">${escapeHtml(user.userId)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Assigned Roles</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
              ${user.roles.map((r) => `<span class="vmn-badge badge-info">${escapeHtml(r)}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
          Quick Security Actions
        </h2>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="/select-workspace" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("bolt", { size: 16 })} Switch Active Workspace
          </a>
          <a href="/auth/mfa" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("shield", { size: 16 })} Configure Step-Up MFA
          </a>
          <a href="/account/notifications" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("info", { size: 16 })} Notification Preferences
          </a>
          <a href="/account/sessions" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("lock", { size: 16 })} Active Sessions
          </a>
          <a href="/sign-out" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("lock", { size: 16 })} Sign Out of Workstation
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-004: Invitation Acceptance
 */
export function renderInvitationAcceptanceHtml(token?: string, email?: string, error?: string): string {
  const inviteToken = token || "INV-7849-VMN";
  const inviteEmail = email || "operator.onboarding@vmnl.ng";
  const errorBanner = error
    ? `
    <div style="border-left: 4px solid #DC2626; background: #FEF2F2; color: #991B1B; padding: 12px 14px; margin-bottom: 20px; border-radius: 4px; font-size: 0.85rem;" role="alert">
      ${escapeHtml(error)}
    </div>`
    : "";

  return `
    <div style="max-width: 520px; margin: 48px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="text-align: center; margin-bottom: 24px;">
          <span class="vmn-badge badge-info" style="margin-bottom: 12px; font-weight: 700;">INVITATION &bull; UX-SYS-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
            Accept Enterprise Invitation
          </h1>
          <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0;">
            You have been invited to join the Voice of Nigeria (VMNL) Broadcast &amp; Commerce Platform.
          </p>
        </div>

        ${errorBanner}

        <div style="background: var(--vmn-color-background); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">Target Account</div>
          <div style="font-weight: 700; color: var(--vmn-color-primary-text); font-size: 0.95rem;">${escapeHtml(inviteEmail)}</div>
          <div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text); margin-top: 4px; font-family: monospace;">Token: ${escapeHtml(inviteToken)}</div>
        </div>

        <form method="POST" action="/auth/invitation/accept" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" name="token" value="${escapeHtml(inviteToken)}" />

          <div class="vmn-form-field">
            <label for="inv-email" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Invited Email Address <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-email"
              name="email"
              type="email"
              required
              class="vmn-input"
              value="${escapeHtml(inviteEmail)}"
              placeholder="you@company.com"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">
              Must match the address the invitation was issued to.
            </div>
          </div>

          <div class="vmn-form-field">
            <label for="inv-fullname" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Full Legal Name <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-fullname"
              name="fullName"
              type="text"
              required
              class="vmn-input"
              placeholder="e.g. Ibrahim Abubakar"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="inv-password" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Create Password <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-password"
              name="password"
              type="password"
              required
              minlength="12"
              class="vmn-input"
              placeholder="Minimum 12 characters"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">
              Must contain upper, lower, numbers, and symbols.
            </div>
          </div>

          <div class="vmn-form-field">
            <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--vmn-color-primary-text);">
              <input type="checkbox" name="termsAccepted" required style="margin-top: 3px;" />
              <span>I accept the Broadcast Conduct Policy, Commercial Confidentiality, and Terms of Service.</span>
            </label>
          </div>

          <button type="submit" class="btn btn-primary" style="min-height: 48px; font-weight: 700; width: 100%; margin-top: 8px; cursor: pointer;">
            Complete Account Activation
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-005: First-Use Profile Review
 */
export function renderFirstUseProfileHtml(user: SessionUser): string {
  return `
    <div style="max-width: 600px; margin: 48px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="margin-bottom: 24px;">
          <span class="vmn-badge badge-warning" style="margin-bottom: 12px; font-weight: 700;">ONBOARDING &bull; UX-SYS-005</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
            First-Use Profile &amp; Workstation Setup
          </h1>
          <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0;">
            Please verify your operational details and workstation settings before commencing transmission duties.
          </p>
        </div>

        <form method="POST" action="/auth/profile-setup" style="display: flex; flex-direction: column; gap: 20px;">
          <div class="vmn-form-field">
            <label class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">Operator Identifier</label>
            <input
              type="text"
              disabled
              value="${escapeHtml(user.userId)}"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); background: var(--vmn-color-background); font-family: monospace;"
            />
          </div>

          <div class="vmn-form-field">
            <label for="prof-displayname" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Display Name / Playout Sign-off Name <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="prof-displayname"
              name="displayName"
              type="text"
              required
              value="${escapeHtml(user.email.split("@")[0].toUpperCase())}"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="prof-duty-phone" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Emergency MCR Duty Phone (NG +234) <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="prof-duty-phone"
              name="dutyPhone"
              type="tel"
              required
              placeholder="+234 800 000 0000"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="prof-timezone" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Operational Broadcast Timezone
            </label>
            <select
              id="prof-timezone"
              name="timezone"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            >
              <option value="Africa/Lagos" selected>Africa/Lagos (WAT, UTC+1 - Primary VMN Broadcast)</option>
              <option value="UTC">UTC (Universal Coordinated Time - Satellite Uplink)</option>
              <option value="Europe/London">Europe/London (GMT/BST - UK Commercial Ingest)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="min-height: 48px; font-weight: 700; width: 100%; cursor: pointer;">
            Confirm Profile &amp; Enter Workstation
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-007: Session Expired / Resume
 */
export function renderSessionExpiredHtml(returnUrl: string = "/"): string {
  return `
    <div style="max-width: 480px; margin: 60px auto; padding: 0 16px;">
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 36px 32px; box-shadow: var(--vmn-shadow-md); text-align: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto;">
          ${renderIcon("warning", { size: 30 })}
        </div>

        <span class="vmn-badge badge-warning" style="margin-bottom: 12px; font-weight: 700;">SECURITY TIMEOUT &bull; UX-SYS-007</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 10px 0;">
          Operational Session Expired
        </h1>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.95rem; line-height: 1.5; margin: 0 0 24px 0;">
          Your broadcast security session timed out due to 15 minutes of station inactivity. Playout state and form drafts have been saved to local cache.
        </p>

        <a href="/sign-in?returnUrl=${encodeURIComponent(returnUrl)}" class="btn btn-primary" style="min-height: 48px; width: 100%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700;">
          Sign In to Resume Session
        </a>

        <div style="margin-top: 16px;">
          <a href="/" style="font-size: 0.85rem; color: var(--vmn-color-text-muted); text-decoration: underline;">
            Return to Public Landing Page
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-012: Notification Preferences
 */
export function renderNotificationPreferencesHtml(user: SessionUser): string {
  return `
    <div style="max-width: 800px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-neutral" style="margin-bottom: 8px; font-weight: 700;">PREFERENCES &bull; UX-SYS-012</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Notification &amp; Escalation Preferences
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Configure critical broadcast alerts, commercial reconciliation notifications, and compliance escalations.
        </p>
      </div>

      <form method="POST" action="/account/notifications" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; color: var(--vmn-color-primary-text);">
          Delivery Channels for ${escapeHtml(user.email)}
        </h2>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px;">
          <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="alert_playout_deadair" checked style="margin-top: 4px;" />
            <div>
              <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Playout Disruption &amp; Dead-Air Failures (Level 1 CRITICAL)</div>
              <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Immediate SMS and audio alarm whenever automated filler engages or playout stalls.</div>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="alert_rights_hold" checked style="margin-top: 4px;" />
            <div>
              <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Rights Blockers &amp; StarTimes Carriage Expiry</div>
              <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Receive notifications 24 hours prior to scheduled broadcast of un-cleared assets.</div>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="alert_commercial_underdelivery" checked style="margin-top: 4px;" />
            <div>
              <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Commercial Under-delivery &amp; Make-Good Triggers</div>
              <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Alerts when as-run logs fail to reconcile with sponsored spot commitments.</div>
            </div>
          </label>

          <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="alert_audit_security" checked style="margin-top: 4px;" />
            <div>
              <div style="font-weight: 700; color: var(--vmn-color-primary-text);">Cryptographic Audit &amp; High-Privilege Changes</div>
              <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Notification on feature flag changes, role grants, or emergency overrides.</div>
            </div>
          </label>
        </div>

        <div style="display: flex; gap: 12px;">
          <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; cursor: pointer;">
            Save Preferences
          </button>
          <a href="/account/profile" class="btn btn-secondary" style="min-height: 44px; padding: 0 20px; display: inline-flex; align-items: center;">
            Back to Profile
          </a>
        </div>
      </form>
    </div>
  `;
}

/**
 * UX-SYS-013: Active Sessions and Revocation
 */
export function renderActiveSessionsHtml(
  user: SessionUser,
  options: { sessions?: Array<{ tokenId: string; deviceLabel: string; ipAddress: string; createdAt: Date; revokedAt?: Date }> } = {}
): string {
  const sessions = options.sessions;
  // TODO-SEC-03: when real registry rows are supplied they are rendered
  // verbatim; the legacy illustrative layout remains only when no registry
  // data was passed (deprecated path, retained for renderer-level tests).
  if (sessions) {
    const rows = sessions.length
      ? sessions
          .map(
            (s) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--vmn-color-border);">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: var(--vmn-color-primary-text); font-size: 1rem;">${escapeHtml(s.deviceLabel)}</span>
              ${s.revokedAt ? `<span class="vmn-badge badge-neutral">REVOKED</span>` : `<span class="vmn-badge badge-success">ACTIVE</span>`}
            </div>
            <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">
              IP: ${escapeHtml(s.ipAddress)} &bull; Started ${escapeHtml(s.createdAt.toISOString().replace("T", " ").substring(0, 16))} UTC
            </div>
          </div>
          ${
            s.revokedAt
              ? ""
              : `<form method="POST" action="/account/sessions/revoke">
            <input type="hidden" name="tokenId" value="${escapeHtml(s.tokenId)}" />
            <button type="submit" class="btn btn-outline" style="min-height: 44px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; color: #DC2626; border-color: #DC2626; cursor: pointer;">
              Revoke Access
            </button>
          </form>`
          }
        </div>`
          )
          .join("")
      : `<div style="padding: 16px 0; color: var(--vmn-color-secondary-text);">No registered sessions found for this account.</div>`;
    return `
    <div style="max-width: 800px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-neutral" style="margin-bottom: 8px; font-weight: 700;">SESSIONS &bull; UX-SYS-013</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Active Workstation Sessions
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Live session registry for ${escapeHtml(user.email)}. Revoking a session invalidates its token immediately.
        </p>
      </div>
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px; margin-bottom: 24px;">
        ${rows}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="/account/profile" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; padding: 0 20px;">
          Back to Profile
        </a>
        <form method="POST" action="/account/sessions/revoke-all">
          <button type="submit" class="btn btn-outline" style="min-height: 44px; color: #DC2626; border-color: #DC2626; cursor: pointer; font-weight: 700;">
            Revoke All Other Sessions
          </button>
        </form>
      </div>
    </div>
  `;
  }
  return `
    <div style="max-width: 800px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-neutral" style="margin-bottom: 8px; font-weight: 700;">SECURITY AUDIT &bull; UX-SYS-013</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Active Workstation Sessions
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Inspect authorized devices currently connected to Voice of Nigeria broadcast consoles with your credentials.
        </p>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--vmn-color-border); padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: var(--vmn-color-primary-text); font-size: 1rem;">Current Workstation</span>
              <span class="vmn-badge badge-success">ACTIVE NOW</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">
              IP: 192.168.1.104 &bull; Lagos MCR Primary Console &bull; Mozilla/5.0 Enterprise Broadcast Agent
            </div>
          </div>
          <span style="font-family: monospace; font-size: 0.85rem; color: var(--vmn-color-text-muted);">Session ID: sess-${escapeHtml(user.userId.slice(0, 8))}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; color: var(--vmn-color-primary-text); font-size: 1rem;">Mobile Supervisor Client</span>
              <span class="vmn-badge badge-neutral">IDLE (42m ago)</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">
              IP: 102.89.34.12 &bull; MTN Nigeria Cellular &bull; VMN Mobile Inspection App
            </div>
          </div>
          <form method="POST" action="/account/sessions/revoke">
            <input type="hidden" name="sessionId" value="sess-mobile-002" />
            <button type="submit" class="btn btn-outline" style="min-height: 44px; padding: 0 16px; display: inline-flex; align-items: center; justify-content: center; color: #DC2626; border-color: #DC2626; cursor: pointer;">
              Revoke Access
            </button>
          </form>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="/account/profile" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; padding: 0 20px;">
          Back to Profile
        </a>
        <form method="POST" action="/account/sessions/revoke-all">
          <button type="submit" class="btn btn-outline" style="min-height: 44px; color: #DC2626; border-color: #DC2626; cursor: pointer; font-weight: 700;">
            Revoke All Other Sessions
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-014: Contextual Operator Help & SOPs
 */
export function renderContextualHelpHtml(topic?: string): string {
  const currentTopic = topic || "general";

  return `
    <div style="max-width: 900px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">SOP &bull; UX-SYS-014</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          MCR Contextual Help &amp; Standard Operating Procedures
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Active reference documentation for transmission operators, rights officers, and traffic managers.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr; gap: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 16px; height: fit-content;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--vmn-color-text-muted); margin-bottom: 12px; padding: 0 8px;">
            SOP Categories
          </div>
          <nav style="display: flex; flex-direction: column; gap: 4px;">
            <a href="/help/operator?topic=general" style="padding: 10px 12px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; font-size: 0.9rem; background: ${currentTopic === "general" ? "var(--vmn-color-primary)" : "transparent"}; color: ${currentTopic === "general" ? "#FFFFFF" : "var(--vmn-color-primary-text)"};">
              1. Playout &amp; Emergency Filler
            </a>
            <a href="/help/operator?topic=rights" style="padding: 10px 12px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; font-size: 0.9rem; background: ${currentTopic === "rights" ? "var(--vmn-color-primary)" : "transparent"}; color: ${currentTopic === "rights" ? "#FFFFFF" : "var(--vmn-color-primary-text)"};">
              2. Rights Clearance &amp; Holds
            </a>
            <a href="/help/operator?topic=traffic" style="padding: 10px 12px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; font-size: 0.9rem; background: ${currentTopic === "traffic" ? "var(--vmn-color-primary)" : "transparent"}; color: ${currentTopic === "traffic" ? "#FFFFFF" : "var(--vmn-color-primary-text)"};">
              3. Commercial Traffic &amp; As-Run
            </a>
            <a href="/help/operator?topic=escalations" style="padding: 10px 12px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; font-size: 0.9rem; background: ${currentTopic === "escalations" ? "var(--vmn-color-primary)" : "transparent"}; color: ${currentTopic === "escalations" ? "#FFFFFF" : "var(--vmn-color-primary-text)"};">
              4. MCR Escalation Matrix
            </a>
          </nav>
        </div>

        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px;">
          ${
            currentTopic === "rights"
              ? `
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
              SOP-BCST-002: Broadcast Rights Clearance &amp; Blackouts
            </h2>
            <div style="font-size: 0.95rem; line-height: 1.6; color: var(--vmn-color-secondary-text);">
              <p>All linear transmissions on StarTimes DTT/DTH and terrestrial carriage require an active, un-expired rights window. If a rights hold occurs within 2 hours of transmission:</p>
              <ol style="padding-left: 20px; margin-bottom: 16px;">
                <li>Do NOT bypass without documented authorization from the Broadcast Rights Coordinator.</li>
                <li>Submit an expedited Rights Review Request via <code>/broadcast/rights/review-request</code>.</li>
                <li>If unresolved within 30 minutes of airtime, prime approved secondary cultural filler asset.</li>
              </ol>
            </div>
          `
              : currentTopic === "traffic"
              ? `
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
              SOP-BCST-003: Commercial Break Reconciliation
            </h2>
            <div style="font-size: 0.95rem; line-height: 1.6; color: var(--vmn-color-secondary-text);">
              <p>Commercial break compliance is audited by the Advertising Regulatory Council of Nigeria (ARCON) and counterparties:</p>
              <ul style="padding-left: 20px; margin-bottom: 16px;">
                <li>Ensure as-run log capture matches within 100ms tolerance.</li>
                <li>Under-delivered spots must be logged to the Proof-of-Air Exceptions Workbench.</li>
                <li>Make-goods must be rescheduled into equivalent audience dayparts within 48 hours.</li>
              </ul>
            </div>
          `
              : currentTopic === "escalations"
              ? `
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
              SOP-BCST-004: Master Control Room Escalation Tree
            </h2>
            <div style="font-size: 0.95rem; line-height: 1.6; color: var(--vmn-color-secondary-text);">
              <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
                    <th style="padding: 8px 12px;">Severity</th>
                    <th style="padding: 8px 12px;">Incident Type</th>
                    <th style="padding: 8px 12px;">Primary Responder</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                    <td style="padding: 8px 12px;"><span class="vmn-badge badge-warning">L1 - CRITICAL</span></td>
                    <td style="padding: 8px 12px;">Carrier Outage / Dead Air &gt; 10s</td>
                    <td style="padding: 8px 12px;">Broadcast Director + Chief Engineer</td>
                  </tr>
                  <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                    <td style="padding: 8px 12px;"><span class="vmn-badge badge-info">L2 - HIGH</span></td>
                    <td style="padding: 8px 12px;">Rights Conflict / Missing Media File</td>
                    <td style="padding: 8px 12px;">MCR Supervisor + Rights Coordinator</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
              : `
            <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 16px; color: var(--vmn-color-primary-text);">
              SOP-BCST-001: Playout Automation &amp; Emergency Fallback
            </h2>
            <div style="font-size: 0.95rem; line-height: 1.6; color: var(--vmn-color-secondary-text);">
              <p>Standard operating procedures for primary transmission playout:</p>
              <ul style="padding-left: 20px; margin-bottom: 16px;">
                <li>The automation engine queries scheduled blocks every 60 seconds.</li>
                <li>If the primary stream drops below 15fps or frame freeze exceeds 3 seconds, automated audio-video filler engages immediately.</li>
                <li>MCR duty operators must acknowledge the alert in <code>/broadcast/playout/live</code> within 45 seconds to suppress audible buzzer.</li>
              </ul>
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;
}
