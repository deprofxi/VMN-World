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
import { renderSignInHostedStates } from "../ia/journey-auth.js";

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
  /**
   * The IA inventory's `AUTH-001` hosted states — unverified invitation, expired
   * invitation, MFA unavailable, and the rest. They are hosted on the sign-in
   * screen by the authority, so they are rendered here rather than on an address
   * the inventory does not give them (VMN World IA R1.1, Phase 4).
   */
  hostedStatesHtml?: string;
}): string {
  const returnUrl = options?.returnUrl ? escapeHtml(options.returnUrl) : "/workspace";
  const errorMessage = options?.error ? escapeHtml(options.error) : "";
  const infoMessage = options?.message ? escapeHtml(options.message) : "";
  const initialEmail = options?.email ? escapeHtml(options.email) : "";

  const personasHtml = SANDBOX_PERSONAS.map((p) => `
    <form method="POST" action="/sign-in" class="m-0">
      <input type="hidden" name="email" value="${escapeHtml(p.email)}" />
      <input type="hidden" name="quickPersona" value="true" />
      <input type="hidden" name="returnUrl" value="${returnUrl}" />
      <button type="submit" class="persona-card w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between">
        <div class="flex items-center justify-between gap-1 mb-1">
          <strong class="text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">${escapeHtml(p.name)}</strong>
          <span class="vmn-badge badge-${escapeHtml(p.badgeTone)} text-[10px]">${escapeHtml(p.role)}</span>
        </div>
        <div class="font-mono text-[11px] text-slate-400 truncate mb-0.5">${escapeHtml(p.email)}</div>
        <div class="text-[10px] text-slate-500 leading-tight">${escapeHtml(p.description)}</div>
      </button>
    </form>
  `).join("");

  return `
    <div class="max-w-md mx-auto my-8 px-4">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/5">
          ${renderIcon("lock", { size: 28 })}
        </div>
        <div class="inline-flex items-center gap-2 mb-1.5">
          <span class="vmn-badge badge-info text-xs font-mono">VMN World</span>
          <span class="vmn-badge badge-neutral text-xs font-mono">UX-SYS-001</span>
        </div>
        <h1 class="text-2xl font-black text-slate-100 tracking-tight m-0">
          Enterprise Sign In
        </h1>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Secure access to broadcast playout, executive consoles, and creative economy workspaces.
        </p>
      </div>

      ${errorMessage ? `
        <div class="vmn-card p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 shadow-lg" role="alert">
          ${renderIcon("alert", { size: 18 })}
          <div><strong>Authentication Failed:</strong> ${errorMessage}</div>
        </div>
      ` : ""}

      ${infoMessage ? `
        <div class="vmn-card p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg" role="status">
          ${renderIcon("check", { size: 18 })}
          <div>${infoMessage}</div>
        </div>
      ` : ""}

      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm">
        <form method="POST" action="/sign-in" class="flex flex-col gap-4">
          <input type="hidden" name="returnUrl" value="${returnUrl}" />

          <div class="vmn-form-field">
            <label for="signin-email" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Work Email Address <span class="text-emerald-400" aria-hidden="true">*</span>
            </label>
            <input
              id="signin-email"
              name="email"
              type="email"
              class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
              autocomplete="username"
              value="${initialEmail}"
              placeholder="operator@vmnl.ng"
            />
          </div>

          <div class="vmn-form-field">
            <div class="flex items-center justify-between mb-1.5">
              <label for="signin-password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password <span class="text-emerald-400" aria-hidden="true">*</span>
              </label>
              <a href="/auth/recovery" class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors no-underline font-medium">
                Forgot password?
              </a>
            </div>
            <input
              id="signin-password"
              name="password"
              type="password"
              class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
              autocomplete="current-password"
              placeholder="••••••••••••"
            />
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input id="remember-me" name="rememberMe" type="checkbox" class="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4" checked />
            <label for="remember-me" class="text-xs text-slate-300 cursor-pointer select-none">
              Keep session active on this secure terminal
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all mt-1"
          >
            ${renderIcon("lock", { size: 18 })}
            Sign In to Workstation
          </button>
        </form>

        <div class="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3.5 mt-5">
          <span>Secured Broadcast Console</span>
          <a href="/help/operator" class="text-slate-400 hover:text-slate-200 transition-colors no-underline">Operator SOPs</a>
        </div>
      </div>

      <!-- Sandbox One-Click Role Selector -->
      <details class="vmn-sandbox-drawer mt-6 text-center text-xs" id="sandbox-roles">
        <summary class="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors select-none">
          <span class="vmn-badge badge-warning text-[10px]">DEVELOPER &amp; UAT</span>
          <span class="font-bold">Sandbox Role Switcher</span>
          <span class="text-slate-400">(10 Personas)</span>
        </summary>
        <div class="mt-4 p-4 rounded-2xl border border-slate-800 bg-slate-950/90 text-left max-w-xl mx-auto shadow-2xl backdrop-blur-md">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div>
              <h2 class="text-xs font-bold text-slate-200 uppercase tracking-wider m-0">Sandbox Role Switcher</h2>
              <p class="text-[11px] text-slate-400 m-0">Click any persona to authenticate directly into its assigned operational workspace.</p>
            </div>
            <span class="vmn-badge badge-warning text-[10px]">TESTING TRAY</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
            ${personasHtml}
          </div>
        </div>
      </details>

      <div class="sr-only" aria-hidden="true">
        ${options?.hostedStatesHtml ?? renderSignInHostedStates()}
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
  challenge?: string;
  csrfToken?: string;
}): string {
  const returnUrl = options?.returnUrl ? escapeHtml(options.returnUrl) : "/workspace";
  const errorMessage = options?.error ? escapeHtml(options.error) : "";
  const email = options?.userEmail ? escapeHtml(options.userEmail) : "operator@vmnl.ng";

  return `
    <div class="max-w-md mx-auto my-8 px-4">
      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center backdrop-blur-sm">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-lg">
          ${renderIcon("shield", { size: 28 })}
        </div>
        <div class="inline-flex items-center gap-2 mb-1.5">
          <span class="vmn-badge badge-warning text-xs font-mono">STEP-UP MFA</span>
          <span class="vmn-badge badge-neutral text-xs font-mono">UX-SYS-002</span>
        </div>
        <h1 class="text-2xl font-black text-slate-100 tracking-tight m-0 mb-1">
          Step-Up Authentication
        </h1>
        <p class="text-xs text-slate-400 mb-5 leading-relaxed">
          The requested action requires elevated verification for <strong class="text-slate-200">${email}</strong>. Enter the 6-digit verification code from your authenticator app or hardware token (UX-SYS-002).
        </p>

        ${errorMessage ? `
          <div class="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 text-left shadow-lg" role="alert">
            ${renderIcon("alert", { size: 16 })}
            <div>${errorMessage}</div>
          </div>
        ` : ""}

        <form method="POST" action="/auth/mfa" class="flex flex-col gap-4 text-left">
          <input type="hidden" name="csrfToken" value="${escapeHtml(options?.csrfToken)}" />
          <input type="hidden" name="returnUrl" value="${returnUrl}" />
          <input type="hidden" name="challenge" value="${escapeHtml(options?.challenge)}" />

          <div class="vmn-form-field">
            <label for="mfa-code" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              6-Digit Security Code <span class="text-amber-400" aria-hidden="true">*</span>
            </label>
            <input
              id="mfa-code"
              name="mfaCode"
              type="text"
              class="vmn-input w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-center font-mono text-xl tracking-[0.3em] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              autocomplete="one-time-code"
              placeholder="123456"
              autofocus
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-500 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer transition-all mt-1"
          >
            Verify &amp; Elevate Access
          </button>
        </form>

        <div class="text-xs text-slate-400 border-t border-slate-800/80 pt-4 mt-5">
          Lost authenticator? <a href="/help/operator" class="text-amber-400 hover:text-amber-300 no-underline font-medium">Contact MCR Supervisor</a>
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
  error?: string;
}): string {
  const isSubmitted = Boolean(options?.submitted);
  const email = options?.email ? escapeHtml(options.email) : "";
  const errorMessage = options?.error ? escapeHtml(options.error) : "";

  return `
    <div class="max-w-md mx-auto my-8 px-4">
      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center backdrop-blur-sm">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-3 shadow-lg">
          ${renderIcon("refresh", { size: 28 })}
        </div>
        <div class="inline-flex items-center gap-2 mb-1.5">
          <span class="vmn-badge badge-info text-xs font-mono">RECOVERY</span>
          <span class="vmn-badge badge-neutral text-xs font-mono">UX-SYS-003</span>
        </div>
        <h1 class="text-2xl font-black text-slate-100 tracking-tight m-0 mb-1">
          Account Recovery
        </h1>
        <p class="text-xs text-slate-400 mb-5 leading-relaxed">
          UX-SYS-003 &bull; Privacy-Safe Identity Recovery
        </p>

        ${errorMessage ? `
          <div class="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 text-left shadow-lg" role="alert">
            ${renderIcon("alert", { size: 16 })}
            <div>${errorMessage}</div>
          </div>
        ` : ""}

        ${isSubmitted ? `
          <div class="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-left mb-4 shadow-lg">
            <strong class="block text-emerald-300 text-sm mb-1">Recovery Instructions Dispatched</strong>
            <p class="text-xs text-emerald-200/80 m-0 leading-relaxed">
              If a registered enterprise profile matches the address provided, a secure, time-bounded recovery token has been transmitted. In accordance with security policy §8.4, confirmation does not disclose account presence.
            </p>
          </div>
          <div>
            <a href="/sign-in" class="btn btn-outline w-full py-2.5 rounded-xl text-xs font-bold no-underline inline-block text-center">
              Return to Sign In
            </a>
          </div>
        ` : `
          <p class="text-xs text-slate-300 text-left mb-4 leading-relaxed">
            Enter your work email address below. We will send you instructions to securely reset your credentials and restore access to your assigned duty stations.
          </p>
          <form method="POST" action="/auth/recovery" class="flex flex-col gap-4 text-left">
            <div class="vmn-form-field">
              <label for="recovery-email" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address <span class="text-sky-400" aria-hidden="true">*</span>
              </label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                required
                value="${email}"
                placeholder="operator@vmnl.ng"
              />
            </div>
            <button type="submit" class="btn btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-sky-600 hover:bg-sky-500 flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer transition-all mt-1">
              Send Recovery Link
            </button>
            <div class="text-center pt-2">
              <a href="/sign-in" class="text-xs text-slate-400 hover:text-slate-200 transition-colors no-underline">
                &larr; Back to Sign In
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
  _returnUrl?: string
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
      description: "Direct linear television operations across the three channel profiles and broadcast operations workstations. Carriage details require independent verification.",
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
 <div class="s-pzA_vTZf72">
 <div class="s--5BXthbePa">
 <div class="s-0bb2GI60el">
                ${renderIcon(ws.icon as any, { size: 20 })}
              </div>
              <div>
 <h3 class="s-jxRK7DWv2Q">${escapeHtml(ws.title)}</h3>
 <span class="s-OdlmY1tzrc">${escapeHtml(ws.subtitle)}</span>
              </div>
            </div>
 ${isCurrent ? '<span class="vmn-badge badge-ready s-tDhtntWwE7" >CURRENT ACTIVE</span>' : ""}
          </div>
 <p class="s-opZH8ywGNz">
            ${escapeHtml(ws.description)}
          </p>
        </div>

 <div class="s-ANKytrnZet">
 <span style="font-size: 0.75rem; font-weight: 600; color: ${hasRole ? "var(--vmn-color-primary-text)" : "var(--vmn-color-text-muted)"};">
            ${hasRole ? "Authorized" : "Access Request Required"}
          </span>

          ${hasRole ? `
 <a href="${escapeHtml(ws.url)}" class="btn s-xpqECJulZc ${isCurrent ? "btn-primary" : "btn-outline"}" >
              Launch Workspace &rarr;
            </a>
          ` : `
 <a href="/access-request?role=${encodeURIComponent(ws.role)}" class="btn btn-secondary s-maCDneS_JS" >
              Request Access
            </a>
          `}
        </div>
      </div>
    `;
  }).join("");

  return `
 <div class="s-pDOVXGiU2L">
 <div class="s-C8JvYetRIl">
        <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >IDENTITY CONTEXT &bull; J-RL1-02</span>
 <h1 class="s-tbjG2caAQF">
            Select Operational Workspace
          </h1>
 <p class="s-g4BZ0X7VED">
            Logged in as <strong>${escapeHtml(user.email)}</strong> &bull; Assigned Roles: <code>${escapeHtml(userRoles.join(", "))}</code>
          </p>
        </div>
 <div class="s-1ffWzM6Quc">
 <a href="/account/profile" class="btn btn-outline s-QozL0KCL7V" >Account Settings</a>
 <form method="GET" action="/sign-out" class="s-OZBX34IsZp">
 <button class="btn btn-secondary" type="submit" >Sign Out</button>
          </form>
        </div>
      </div>

 <div class="s-v3V6AtbsTX">
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
    <div class="max-w-lg mx-auto my-8 px-4">
      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center backdrop-blur-sm">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-3 shadow-lg">
          ${renderIcon("alert", { size: 28 })}
        </div>
        <div class="inline-flex items-center gap-2 mb-1.5">
          <span class="vmn-badge badge-danger text-xs font-mono">AUTHORIZATION</span>
          <span class="vmn-badge badge-neutral text-xs font-mono">UX-SYS-008</span>
        </div>
        <h1 class="text-2xl font-black text-slate-100 tracking-tight m-0 mb-1">
          403 Access Unavailable
        </h1>
        <p class="text-xs text-slate-400 mb-4 leading-relaxed">
          Your current session context does not hold the authorization required to access <code>${url}</code>.
        </p>

        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-300 flex flex-col gap-1.5 mb-5 font-mono">
          <div><strong class="text-slate-400">Authenticated As:</strong> ${email}</div>
          <div><strong class="text-slate-400">Assigned Roles:</strong> <code class="text-slate-200">${roles}</code></div>
          <div><strong class="text-slate-400">Required Permission:</strong> <span class="text-red-400 font-bold">${required}</span></div>
          <div class="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">Governance Code: R1.2A &sect;48 &bull; Strict Principle of Least Privilege</div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <a href="/select-workspace" class="btn btn-primary py-2.5 px-4 rounded-xl text-xs font-bold no-underline">
            Switch Role / Workspace
          </a>
          <a href="/access-request?url=${encodeURIComponent(attemptedUrl || "")}" class="btn btn-outline py-2.5 px-4 rounded-xl text-xs font-bold no-underline">
            Request Elevation
          </a>
          <a href="/" class="btn btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold no-underline">
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
  attemptedUrl?: string,
  csrfToken?: string
): string {
  const role = defaultRole ? escapeHtml(defaultRole) : "MCRSupervisor";
  const url = attemptedUrl ? escapeHtml(attemptedUrl) : "/broadcast/screens";

  return `
    <div class="max-w-xl mx-auto my-8 px-4">
      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm">
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-md">
            ${renderIcon("shield", { size: 24 })}
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="vmn-badge badge-warning text-[10px] font-mono">ELEVATION</span>
              <span class="vmn-badge badge-neutral text-[10px] font-mono">UX-SYS-009</span>
            </div>
            <h1 class="text-xl font-bold text-slate-100 tracking-tight m-0">
              Operational Access Elevation
            </h1>
          </div>
        </div>

        <p class="text-xs text-slate-400 mb-5 leading-relaxed">
          Submit a time-bounded role elevation or permission request for user <strong class="text-slate-200">${escapeHtml(user.email)}</strong>. All access elevations are cryptographically sealed in the audit log.
        </p>

        <form method="POST" action="/access-request" class="flex flex-col gap-4">
          <input type="hidden" name="returnUrl" value="${url}" />
          ${csrfToken ? `<input type="hidden" name="csrfToken" value="${escapeHtml(csrfToken)}" />` : ""}

          <div class="vmn-form-field">
            <label for="req-role" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Operational Role <span class="text-emerald-400" aria-hidden="true">*</span>
            </label>
            <select id="req-role" name="role" class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
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
            <label for="req-duration" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Elevation Duration <span class="text-emerald-400" aria-hidden="true">*</span>
            </label>
            <select id="req-duration" name="duration" class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
              <option value="SHIFT_8H">Single Shift (8 Hours)</option>
              <option value="EMERGENCY_24H">Emergency Outage Window (24 Hours)</option>
              <option value="PERMANENT">Permanent Duty Station Reassignment</option>
            </select>
          </div>

          <div class="vmn-form-field">
            <label for="req-justification" class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Business &amp; Operational Justification <span class="text-emerald-400" aria-hidden="true">*</span>
            </label>
            <textarea
              id="req-justification"
              name="justification"
              required
              rows="4"
              class="vmn-input w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="Detail the broadcast duty, incident reference, or operational requirement..."
            ></textarea>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button type="submit" class="btn btn-primary py-2.5 px-5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all">
              Submit Access Request
            </button>
            <a href="/select-workspace" class="btn btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold no-underline">
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
 <div class="s-j_o2LsN6rz">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-neutral s-Dnmmv3HPR8" >USER PROFILE &bull; UX-SYS-011</span>
 <h1 class="s-obf-J7lNAE">
          Account &amp; Security Settings
        </h1>
      </div>

 <div class="vmn-card s-siWzyk-6ha" >
 <h2 class="s-8XyHQIP_yA">
          Operator Identity
        </h2>
 <div class="s-QfG7EyQfsY">
          <div>
 <div class="s-Nb3w08KQ-O">Email Address</div>
 <div class="s-NXtjI4edSi">${escapeHtml(user.email)}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">User Identifier</div>
 <div class="s-3lwy5Jm1g-">${escapeHtml(user.userId)}</div>
          </div>
          <div>
 <div class="s-Nb3w08KQ-O">Assigned Roles</div>
 <div class="s-mKdqcT57so">
              ${user.roles.map((r) => `<span class="vmn-badge badge-info">${escapeHtml(r)}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>

 <div class="vmn-card s-IP6ONpGkoj" >
 <h2 class="s-8XyHQIP_yA">
          Quick Security Actions
        </h2>
 <div class="s-GNTtGikGkV">
 <a href="/select-workspace" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("bolt", { size: 16 })} Switch Active Workspace
          </a>
 <a href="/auth/mfa" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("shield", { size: 16 })} Configure Step-Up MFA
          </a>
 <a href="/account/notifications" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("info", { size: 16 })} Notification Preferences
          </a>
 <a href="/account/sessions" class="btn btn-outline s-oskDBiEZSv" >
            ${renderIcon("lock", { size: 16 })} Active Sessions
          </a>
 <form method="GET" action="/sign-out" class="s-OZBX34IsZp">
 <button class="btn btn-secondary" type="submit" >
              ${renderIcon("lock", { size: 16 })} Sign Out of Workstation
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * UX-SYS-004: Invitation Acceptance
 */
export function renderInvitationAcceptanceHtml(token?: string, email?: string, error?: string, csrfToken?: string): string {
  const inviteToken = token || "INV-7849-VMN";
  const inviteEmail = email || "operator.onboarding@vmnl.ng";
  const errorBanner = error
    ? `
 <div class="s-hMyC6wHubA" role="alert">
      ${escapeHtml(error)}
    </div>`
    : "";

  return `
 <div class="s-MuIFkBo9jl">
 <div class="vmn-card s-dO7c-Jko1Y" >
 <div class="s-OXbXKNybuO">
 <span class="vmn-badge badge-info s-3CrzrsuCx5" >INVITATION &bull; UX-SYS-004</span>
 <h1 class="s-4hDFIYz_z0">
            Accept Enterprise Invitation
          </h1>
 <p class="s-s8QClmJr6r">
            You have been invited to join the Voice of Nigeria (VMNL) Broadcast &amp; Commerce Platform.
          </p>
        </div>

        ${errorBanner}

 <div class="s-5OWNCdDL8u">
 <div class="s-fYE4FZVFtz">Target Account</div>
 <div class="s-QtLcO6bVNZ">${escapeHtml(inviteEmail)}</div>
 <div class="s-tuESyeq6jM">Token: ${escapeHtml(inviteToken)}</div>
        </div>

 <form method="POST" action="/auth/invitation/accept" class="s-jvR2_DF1C2">
          <input type="hidden" name="token" value="${escapeHtml(inviteToken)}" />
          ${csrfToken ? `<input type="hidden" name="csrfToken" value="${escapeHtml(csrfToken)}" />` : ""}

          <div class="vmn-form-field">
 <label for="inv-email" class="vmn-label s-d6tlFZezBi" >
 Invited Email Address <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-email"
              name="email"
              type="email"
              required
              class="vmn-input"
              value="${escapeHtml(inviteEmail)}"
              placeholder="you@company.com"
 class="s-npZXKSAIoi"
            />
 <div class="s-JPNhjxkr8H">
              Must match the address the invitation was issued to.
            </div>
          </div>

          <div class="vmn-form-field">
 <label for="inv-fullname" class="vmn-label s-d6tlFZezBi" >
 Full Legal Name <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-fullname"
              name="fullName"
              type="text"
              required
              class="vmn-input"
              placeholder="e.g. Ibrahim Abubakar"
 class="s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="inv-password" class="vmn-label s-d6tlFZezBi" >
 Create Password <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="inv-password"
              name="password"
              type="password"
              required
              minlength="12"
              class="vmn-input"
              placeholder="Minimum 12 characters"
 class="s-npZXKSAIoi"
            />
 <div class="s-JPNhjxkr8H">
              Must contain upper, lower, numbers, and symbols.
            </div>
          </div>

          <div class="vmn-form-field">
 <label class="s-o4A-EPRnJ6">
 <input type="checkbox" name="termsAccepted" required class="s-RfOVtrZ5JX" />
              <span>I accept the Broadcast Conduct Policy, Commercial Confidentiality, and Terms of Service.</span>
            </label>
          </div>

 <button type="submit" class="btn btn-primary s-RfFbU7F3sf" >
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
 <div class="s-6sXyenBuCp">
 <div class="vmn-card s-dO7c-Jko1Y" >
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-warning s-3CrzrsuCx5" >ONBOARDING &bull; UX-SYS-005</span>
 <h1 class="s-4hDFIYz_z0">
            First-Use Profile &amp; Workstation Setup
          </h1>
 <p class="s-s8QClmJr6r">
            Please verify your operational details and workstation settings before commencing transmission duties.
          </p>
        </div>

 <form method="POST" action="/auth/profile-setup" class="s-79hbkssy5K">
          <div class="vmn-form-field">
 <label class="vmn-label s-d6tlFZezBi" >Operator Identifier</label>
            <input
              type="text"
              disabled
              value="${escapeHtml(user.userId)}"
              class="vmn-input"
 class="s-32by3lkuBT"
            />
          </div>

          <div class="vmn-form-field">
 <label for="prof-displayname" class="vmn-label s-d6tlFZezBi" >
 Display Name / Playout Sign-off Name <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="prof-displayname"
              name="displayName"
              type="text"
              required
              value="${escapeHtml(user.email.split("@")[0].toUpperCase())}"
              class="vmn-input"
 class="s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="prof-duty-phone" class="vmn-label s-d6tlFZezBi" >
 Emergency MCR Duty Phone (NG +234) <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="prof-duty-phone"
              name="dutyPhone"
              type="tel"
              required
              placeholder="+234 800 000 0000"
              class="vmn-input"
 class="s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="prof-timezone" class="vmn-label s-d6tlFZezBi" >
              Operational Broadcast Timezone
            </label>
            <select
              id="prof-timezone"
              name="timezone"
              class="vmn-input"
 class="s-npZXKSAIoi"
            >
              <option value="Africa/Lagos" selected>Africa/Lagos (WAT, UTC+1 - Primary VMN Broadcast)</option>
              <option value="UTC">UTC (Universal Coordinated Time - Satellite Uplink)</option>
              <option value="Europe/London">Europe/London (GMT/BST - UK Commercial Ingest)</option>
            </select>
          </div>

 <button type="submit" class="btn btn-primary s-XneFSgE1Un" >
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
    <div class="max-w-md mx-auto my-8 px-4">
      <div class="vmn-card p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center backdrop-blur-sm">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-lg">
          ${renderIcon("warning", { size: 30 })}
        </div>
        <div class="inline-flex items-center gap-2 mb-1.5">
          <span class="vmn-badge badge-warning text-xs font-mono">SECURITY TIMEOUT</span>
          <span class="vmn-badge badge-neutral text-xs font-mono">UX-SYS-007</span>
        </div>
        <h1 class="text-2xl font-black text-slate-100 tracking-tight m-0 mb-1">
          Operational Session Expired
        </h1>
        <p class="text-xs text-slate-400 mb-6 leading-relaxed">
          Your broadcast security session timed out due to 15 minutes of station inactivity. Playout state and form drafts have been saved to local cache.
        </p>

        <a href="/sign-in?returnUrl=${encodeURIComponent(returnUrl)}" class="btn btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all mb-3 no-underline">
          Sign In to Resume Session
        </a>

        <div class="pt-2">
          <a href="/" class="text-xs text-slate-400 hover:text-slate-200 transition-colors no-underline">
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
 <div class="s-j_o2LsN6rz">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-neutral s-Dnmmv3HPR8" >PREFERENCES &bull; UX-SYS-012</span>
 <h1 class="s-4hDFIYz_z0">
          Notification &amp; Escalation Preferences
        </h1>
 <p class="s-74eGsJhV6B">
          Configure critical broadcast alerts, commercial reconciliation notifications, and compliance escalations.
        </p>
      </div>

 <form method="POST" action="/account/notifications" class="vmn-card s-IP6ONpGkoj" >
 <h2 class="s-SFw3up4E3Z">
          Delivery Channels for ${escapeHtml(user.email)}
        </h2>

 <div class="s-uquducrKzN">
 <label class="s-aM09kSk4Vn">
 <input type="checkbox" name="alert_playout_deadair" checked class="s-xxNz4ecjPo" />
            <div>
 <div class="s-v9ujfxeGxB">Playout Disruption &amp; Dead-Air Failures (Level 1 CRITICAL)</div>
 <div class="s-ypL9N-nGuz">Immediate SMS and audio alarm whenever automated filler engages or playout stalls.</div>
            </div>
          </label>

 <label class="s-aM09kSk4Vn">
 <input type="checkbox" name="alert_rights_hold" checked class="s-xxNz4ecjPo" />
            <div>
 <div class="s-v9ujfxeGxB">Rights Blockers &amp; StarTimes Carriage Expiry</div>
 <div class="s-ypL9N-nGuz">Receive notifications 24 hours prior to scheduled broadcast of un-cleared assets.</div>
            </div>
          </label>

 <label class="s-aM09kSk4Vn">
 <input type="checkbox" name="alert_commercial_underdelivery" checked class="s-xxNz4ecjPo" />
            <div>
 <div class="s-v9ujfxeGxB">Commercial Under-delivery &amp; Make-Good Triggers</div>
 <div class="s-ypL9N-nGuz">Alerts when as-run logs fail to reconcile with sponsored spot commitments.</div>
            </div>
          </label>

 <label class="s-aM09kSk4Vn">
 <input type="checkbox" name="alert_audit_security" checked class="s-xxNz4ecjPo" />
            <div>
 <div class="s-v9ujfxeGxB">Cryptographic Audit &amp; High-Privilege Changes</div>
 <div class="s-ypL9N-nGuz">Notification on feature flag changes, role grants, or emergency overrides.</div>
            </div>
          </label>
        </div>

 <div class="s-1jFqfgs1FA">
 <button type="submit" class="btn btn-primary s-lnwVfi83nm" >
            Save Preferences
          </button>
 <a href="/account/profile" class="btn btn-secondary s-mtkKfdtyAq" >
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
 <div class="s-cbKLTxjKjt">
          <div>
 <div class="s-MIjaETFWG6">
 <span class="s-nr2jL1Vk4N">${escapeHtml(s.deviceLabel)}</span>
              ${s.revokedAt ? `<span class="vmn-badge badge-neutral">REVOKED</span>` : `<span class="vmn-badge badge-success">ACTIVE</span>`}
            </div>
 <div class="s-1Mi_BAvYdD">
              IP: ${escapeHtml(s.ipAddress)} &bull; Started ${escapeHtml(s.createdAt.toISOString().replace("T", " ").substring(0, 16))} UTC
            </div>
          </div>
          ${
            s.revokedAt
              ? ""
              : `<form method="POST" action="/account/sessions/revoke">
            <input type="hidden" name="tokenId" value="${escapeHtml(s.tokenId)}" />
 <button type="submit" class="btn btn-outline s-CVZzKu6qqM" >
              Revoke Access
            </button>
          </form>`
          }
        </div>`
          )
          .join("")
 : `<div class="s-LiTWtW8ZGt">No registered sessions found for this account.</div>`;
    return `
 <div class="s-j_o2LsN6rz">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-neutral s-Dnmmv3HPR8" >SESSIONS &bull; UX-SYS-013</span>
 <h1 class="s-4hDFIYz_z0">
          Active Workstation Sessions
        </h1>
 <p class="s-74eGsJhV6B">
          Live session registry for ${escapeHtml(user.email)}. Revoking a session invalidates its token immediately.
        </p>
      </div>
 <div class="vmn-card s-siWzyk-6ha" >
        ${rows}
      </div>
 <div class="s-wrzqCFgz1Y">
 <a href="/account/profile" class="btn btn-secondary s-8lcmUa1Avn" >
          Back to Profile
        </a>
        <form method="POST" action="/account/sessions/revoke-all">
 <button type="submit" class="btn btn-outline s-EkqxLqqgeR" >
            Revoke All Other Sessions
          </button>
        </form>
      </div>
    </div>
  `;
  }
  return `
 <div class="s-j_o2LsN6rz">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-neutral s-Dnmmv3HPR8" >SECURITY AUDIT &bull; UX-SYS-013</span>
 <h1 class="s-4hDFIYz_z0">
          Active Workstation Sessions
        </h1>
 <p class="s-74eGsJhV6B">
          Inspect authorized devices currently connected to Voice of Nigeria broadcast consoles with your credentials.
        </p>
      </div>

 <div class="vmn-card s-siWzyk-6ha" >
 <div class="s-6CE9gm8vME">
          <div>
 <div class="s-MIjaETFWG6">
 <span class="s-nr2jL1Vk4N">Current Workstation</span>
              <span class="vmn-badge badge-success">ACTIVE NOW</span>
            </div>
 <div class="s-1Mi_BAvYdD">
              IP: 192.168.1.104 &bull; Lagos MCR Primary Console &bull; Mozilla/5.0 Enterprise Broadcast Agent
            </div>
          </div>
 <span class="s-RzYBnbw9uI">Session ID: sess-${escapeHtml(user.userId.slice(0, 8))}</span>
        </div>

 <div class="s-rzoJeJ4UE6">
          <div>
 <div class="s-MIjaETFWG6">
 <span class="s-nr2jL1Vk4N">Mobile Supervisor Client</span>
              <span class="vmn-badge badge-neutral">IDLE (42m ago)</span>
            </div>
 <div class="s-1Mi_BAvYdD">
              IP: 102.89.34.12 &bull; MTN Nigeria Cellular &bull; VMN Mobile Inspection App
            </div>
          </div>
          <form method="POST" action="/account/sessions/revoke">
            <input type="hidden" name="sessionId" value="sess-mobile-002" />
 <button type="submit" class="btn btn-outline s-CVZzKu6qqM" >
              Revoke Access
            </button>
          </form>
        </div>
      </div>

 <div class="s-wrzqCFgz1Y">
 <a href="/account/profile" class="btn btn-secondary s-8lcmUa1Avn" >
          Back to Profile
        </a>
        <form method="POST" action="/account/sessions/revoke-all">
 <button type="submit" class="btn btn-outline s-EkqxLqqgeR" >
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
 <div class="s-6m0XILdru8">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >SOP &bull; UX-SYS-014</span>
 <h1 class="s-4hDFIYz_z0">
          MCR Contextual Help &amp; Standard Operating Procedures
        </h1>
 <p class="s-74eGsJhV6B">
          Active reference documentation for transmission operators, rights officers, and traffic managers.
        </p>
      </div>

 <div class="s-AmsMTcznn6">
 <div class="vmn-card s-dGCBkXqo9J" >
 <div class="s-IQLhdN3eI5">
            SOP Categories
          </div>
 <nav class="s-7x86Xf9Fnz">
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

 <div class="vmn-card s-IP6ONpGkoj" >
          ${
            currentTopic === "rights"
              ? `
 <h2 class="s-s6KO0XsRz_">
              SOP-BCST-002: Broadcast Rights Clearance &amp; Blackouts
            </h2>
 <div class="s-7DQ_ExARZd">
              <p>All linear transmissions on StarTimes DTT/DTH and terrestrial carriage require an active, un-expired rights window. If a rights hold occurs within 2 hours of transmission:</p>
 <ol class="s-bG9yzdLYMU">
                <li>Do NOT bypass without documented authorization from the Broadcast Rights Coordinator.</li>
                <li>Submit an expedited Rights Review Request via <code>/broadcast/rights/review-request</code>.</li>
                <li>If unresolved within 30 minutes of airtime, prime approved secondary cultural filler asset.</li>
              </ol>
            </div>
          `
              : currentTopic === "traffic"
              ? `
 <h2 class="s-s6KO0XsRz_">
              SOP-BCST-003: Commercial Break Reconciliation
            </h2>
 <div class="s-7DQ_ExARZd">
              <p>Commercial break compliance is audited by the Advertising Regulatory Council of Nigeria (ARCON) and counterparties:</p>
 <ul class="s-bG9yzdLYMU">
                <li>Ensure as-run log capture matches within 100ms tolerance.</li>
                <li>Under-delivered spots must be logged to the Proof-of-Air Exceptions Workbench.</li>
                <li>Make-goods must be rescheduled into equivalent audience dayparts within 48 hours.</li>
              </ul>
            </div>
          `
              : currentTopic === "escalations"
              ? `
 <h2 class="s-s6KO0XsRz_">
              SOP-BCST-004: Master Control Room Escalation Tree
            </h2>
 <div class="s-7DQ_ExARZd">
 <table class="s-Cv7ocnTHFs">
                <thead>
 <tr class="s-A_Iz40xZtX">
 <th class="s-lmg2jNx7rT">Severity</th>
 <th class="s-lmg2jNx7rT">Incident Type</th>
 <th class="s-lmg2jNx7rT">Primary Responder</th>
                  </tr>
                </thead>
                <tbody>
 <tr class="s-EK6K8Vq5tY">
 <td class="s-lmg2jNx7rT"><span class="vmn-badge badge-warning">L1 - CRITICAL</span></td>
 <td class="s-lmg2jNx7rT">Carrier Outage / Dead Air &gt; 10s</td>
 <td class="s-lmg2jNx7rT">Broadcast Director + Chief Engineer</td>
                  </tr>
 <tr class="s-EK6K8Vq5tY">
 <td class="s-lmg2jNx7rT"><span class="vmn-badge badge-info">L2 - HIGH</span></td>
 <td class="s-lmg2jNx7rT">Rights Conflict / Missing Media File</td>
 <td class="s-lmg2jNx7rT">MCR Supervisor + Rights Coordinator</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
              : `
 <h2 class="s-s6KO0XsRz_">
              SOP-BCST-001: Playout Automation &amp; Emergency Fallback
            </h2>
 <div class="s-7DQ_ExARZd">
              <p>Standard operating procedures for primary transmission playout:</p>
 <ul class="s-bG9yzdLYMU">
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
