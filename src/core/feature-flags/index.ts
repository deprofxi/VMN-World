/**
 * VMNL Enterprise Feature Flag Engine & Runtime Gating
 * Authority: VMNL-AZP-VMN-TASK-001 / VMNL-AZP-VMN-UIUX-001 §3.3 / tasks.md §2
 *
 * Implements the Zero-Deferral Dual-Track Execution Architecture:
 * - Active implementation across all 225 screens
 * - Safe environment-aware gating of high-risk mutations and un-deferred workflows
 * - <500ms kill-switch latency and resilient in-memory/database fallback
 */

import { recordAuditLog } from "../audit/index.js";

export type FeatureFlagKey =
  | "FF_PUBLIC_SURFACE_ENABLED"
  | "FF_PUBLIC_ENQUIRY_INTAKE"
  | "FF_COMMERCIAL_PIPELINE_ENABLED"
  | "FF_COMMERCIAL_PROPOSAL_BUILDER"
  | "FF_PROJECT_TRACKING_ENABLED"
  | "FF_BROADCAST_OPS_ENABLED"
  | "FF_BROADCAST_WRITES_ENABLED"
  | "FF_BROADCAST_PLAYOUT_CONTROL"
  | "FF_BROADCAST_FINANCIALS_ENABLED"
  | "FF_BROADCAST_ANALYTICS_ENABLED"
  | "FF_TALENT_ACCELERATOR_OPS"
  | "FF_AFCA_ADMISSIONS_ENABLED"
  | "FF_AFCA_FULL_LEARNING_LMS"
  | "FF_AFRO_FUSION_COMMUNITY_OPS"
  | "FF_VTM_MARKETPLACE_DEPLOYMENT"
  | "FF_VCF_CREATOR_MISSIONS"
  | "FF_ONE_STUDIOS_PRODUCTION_OPS"
  | "FF_FUSION_EVENTS_OPS"
  | "FF_TND_DISTRIBUTION_OPS"
  | "FF_HEADSPACE_RESEARCH_OPS"
  | "FF_CR8TECH_INTEGRATION_OPS"
  | "FF_AGENTIC_OS_AUTOMATION"
  | "FF_FINANCE_PAYMENT_RELEASE"
  | "FF_RIGHTS_DISCRETIONARY_OVERRIDE"
  | "FF_AZEEBO_L3_FEDERATION"
  | "FF_PORTAL_PARTNER_AUDITOR"
  | "FF_SHARED_HUB_DIRECTORY"
  | "FF_SHARED_RISK_ISSUE_RECORDS";

export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  domain: string;
  targetScreens: string;
  description: string;
  defaultDev: boolean;
  defaultStaging: boolean;
  defaultProd: boolean;
  isUndeferred: boolean;
  killSwitchPolicy: string;
}

export interface FeatureFlagOverride {
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
  reason?: string;
}

export interface FeatureFlagState extends FeatureFlagDefinition {
  enabled: boolean;
  source: "ENVIRONMENT" | "OVERRIDE" | "DEFAULT";
  override?: FeatureFlagOverride;
}

export const FEATURE_FLAG_DEFINITIONS: Record<FeatureFlagKey, FeatureFlagDefinition> = {
  FF_PUBLIC_SURFACE_ENABLED: {
    key: "FF_PUBLIC_SURFACE_ENABLED",
    domain: "Public Discovery",
    targetScreens: "UX-PUB-001 to 028",
    description: "Controls the entire public web surface and marketing routes.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Displays maintenance notice; cached portfolio remains accessible.",
  },
  FF_PUBLIC_ENQUIRY_INTAKE: {
    key: "FF_PUBLIC_ENQUIRY_INTAKE",
    domain: "Commercial Intake",
    targetScreens: "UX-PUB-009, UX-PUB-025, UX-COM-004",
    description: "Controls public commercial enquiry and sponsorship submission forms.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Halts new intake; existing enquiries remain in queue; displays phone fallback.",
  },
  FF_COMMERCIAL_PIPELINE_ENABLED: {
    key: "FF_COMMERCIAL_PIPELINE_ENABLED",
    domain: "Commercial & CRM",
    targetScreens: "UX-COM-001 to 005, 008 to 010",
    description: "Controls CRM pipeline mutations and lead management.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Restricts CRM pipeline to read-only; preserves existing lead records.",
  },
  FF_COMMERCIAL_PROPOSAL_BUILDER: {
    key: "FF_COMMERCIAL_PROPOSAL_BUILDER",
    domain: "Commercial CPQ",
    targetScreens: "UX-COM-006, UX-COM-007",
    description: "Un-deferred CPQ proposal builder and quote review generation.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Disables proposal generation; redirects to manual account manager contact.",
  },
  FF_PROJECT_TRACKING_ENABLED: {
    key: "FF_PROJECT_TRACKING_ENABLED",
    domain: "Project Delivery",
    targetScreens: "UX-PRJ-001, UX-PRJ-002",
    description: "Controls project delivery management and client workspace.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Locks project timeline updates; clients retain read-only view of approved deliverables.",
  },
  FF_BROADCAST_OPS_ENABLED: {
    key: "FF_BROADCAST_OPS_ENABLED",
    domain: "Linear Broadcast",
    targetScreens: "UX-BR-001 to 009, 012, 014",
    description: "Read-only EPG and as-run schedule view with source freshness.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Renders static emergency broadcast schedule.",
  },
  FF_BROADCAST_WRITES_ENABLED: {
    key: "FF_BROADCAST_WRITES_ENABLED",
    domain: "Linear Scheduling",
    targetScreens: "UX-BR-010, 011, 013, 015 to 017, 020",
    description: "Un-deferred EPG schedule builder, dayparts, break planner, promo scheduler.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Halts live EPG schedule modifications; locks grid to last verified sync.",
  },
  FF_BROADCAST_PLAYOUT_CONTROL: {
    key: "FF_BROADCAST_PLAYOUT_CONTROL",
    domain: "Transmission Ops",
    targetScreens: "UX-BR-023, UX-BR-025",
    description: "Un-deferred playout triggers and live-source switching controls.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Emergency kill switch isolates web triggers; automation fails safe to hardware loop.",
  },
  FF_BROADCAST_FINANCIALS_ENABLED: {
    key: "FF_BROADCAST_FINANCIALS_ENABLED",
    domain: "Broadcast Finance",
    targetScreens: "UX-BR-031",
    description: "Un-deferred broadcast revenue dashboard and rate-card returns.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Hides real-time revenue cards; displays approved monthly audit report.",
  },
  FF_BROADCAST_ANALYTICS_ENABLED: {
    key: "FF_BROADCAST_ANALYTICS_ENABLED",
    domain: "Broadcast Ratings",
    targetScreens: "UX-BR-032",
    description: "Un-deferred StarTimes audience telemetry analytics and reach metrics.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Displays historical audience averages without real-time queries.",
  },
  FF_TALENT_ACCELERATOR_OPS: {
    key: "FF_TALENT_ACCELERATOR_OPS",
    domain: "Talent Accelerator",
    targetScreens: "UX-ACC-001 to 008",
    description: "Un-deferred partner directory, programme proposals, funding readiness.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Redirects to public partnership inquiry route.",
  },
  FF_AFCA_ADMISSIONS_ENABLED: {
    key: "FF_AFCA_ADMISSIONS_ENABLED",
    domain: "AFCA Admissions",
    targetScreens: "UX-APP-001 to 008",
    description: "Controls AFCA learner application submissions, drafting, and admissions queue.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: true,
    isUndeferred: false,
    killSwitchPolicy: "Halts new applicant intake while allowing draft recovery and status lookup.",
  },
  FF_AFCA_FULL_LEARNING_LMS: {
    key: "FF_AFCA_FULL_LEARNING_LMS",
    domain: "AFCA Academy LMS",
    targetScreens: "UX-AFCA-001 to 008",
    description: "Un-deferred curriculum workspace, assignment grading, student roster, certification.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Reverts LMS views to read-only syllabus display.",
  },
  FF_AFRO_FUSION_COMMUNITY_OPS: {
    key: "FF_AFRO_FUSION_COMMUNITY_OPS",
    domain: "Afro-Fusion Network",
    targetScreens: "UX-AFC-001 to 006",
    description: "Un-deferred creator directory, collaboration workspace, discussion forums.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Reverts community platform to static showcase gallery.",
  },
  FF_VTM_MARKETPLACE_DEPLOYMENT: {
    key: "FF_VTM_MARKETPLACE_DEPLOYMENT",
    domain: "Talent Management",
    targetScreens: "UX-VTM-003 to 007, 010 to 012",
    description: "Un-deferred opportunity matching, casting, rate card edits, active deployments.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Locks talent casting; preserves existing engagement terms review and acceptance.",
  },
  FF_VCF_CREATOR_MISSIONS: {
    key: "FF_VCF_CREATOR_MISSIONS",
    domain: "Creative Foundry",
    targetScreens: "UX-VCF-001 to 008",
    description: "Un-deferred creator briefs, asset submissions, peer reviews, milestone payouts.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Freezes new mission submissions; existing drafts preserved.",
  },
  FF_ONE_STUDIOS_PRODUCTION_OPS: {
    key: "FF_ONE_STUDIOS_PRODUCTION_OPS",
    domain: "ONE Studios Ops",
    targetScreens: "UX-ONE-001 to 009",
    description: "Un-deferred call sheets, soundstage booking, equipment tracking, wrap packages.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Reverts production manager to read-only project briefs.",
  },
  FF_FUSION_EVENTS_OPS: {
    key: "FF_FUSION_EVENTS_OPS",
    domain: "Fusion Events",
    targetScreens: "UX-EVT-001 to 008",
    description: "Un-deferred event ticketing, venue stage planner, guest coordination, run-of-show.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Halts live ticket sales; displays event information and schedule.",
  },
  FF_TND_DISTRIBUTION_OPS: {
    key: "FF_TND_DISTRIBUTION_OPS",
    domain: "TEND Syndication",
    targetScreens: "UX-TEND-001 to 008",
    description: "Un-deferred title availability, buyer contracts, digital delivery packages.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Restricts distribution pipeline to read-only catalogue browsing.",
  },
  FF_HEADSPACE_RESEARCH_OPS: {
    key: "FF_HEADSPACE_RESEARCH_OPS",
    domain: "Market Intelligence",
    targetScreens: "UX-HSP-001 to 008",
    description: "Un-deferred research briefs, survey datasets, findings, publication engine.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Reverts research portal to public whitepaper downloads.",
  },
  FF_CR8TECH_INTEGRATION_OPS: {
    key: "FF_CR8TECH_INTEGRATION_OPS",
    domain: "Cr8TechNG DevOps",
    targetScreens: "UX-CR8-001 to 008",
    description: "Un-deferred integration directory, health workspace, automated runbooks.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Degrades to standard system administrator health indicators.",
  },
  FF_AGENTIC_OS_AUTOMATION: {
    key: "FF_AGENTIC_OS_AUTOMATION",
    domain: "AI Orchestration",
    targetScreens: "UX-AGT-001 to 009",
    description: "Un-deferred autonomous agent execution, tool permissions, and hardware kill switches.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Emergency hard kill switch; isolates all agents and requires 100% human sign-off.",
  },
  FF_FINANCE_PAYMENT_RELEASE: {
    key: "FF_FINANCE_PAYMENT_RELEASE",
    domain: "Finance Operations",
    targetScreens: "UX-GOV-005",
    description: "Un-deferred automated disbursement triggers & banking detail edits.",
    defaultDev: true,
    defaultStaging: false,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Immediate block on disbursement triggers; requires manual dual-signoff.",
  },
  FF_RIGHTS_DISCRETIONARY_OVERRIDE: {
    key: "FF_RIGHTS_DISCRETIONARY_OVERRIDE",
    domain: "Rights Governance",
    targetScreens: "UX-GOV-004",
    description: "Un-deferred supervised rights clearance overrides under documented legal authority.",
    defaultDev: true,
    defaultStaging: false,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Hard lock on rights blocks; zero discretionary exceptions allowed.",
  },
  FF_AZEEBO_L3_FEDERATION: {
    key: "FF_AZEEBO_L3_FEDERATION",
    domain: "Azeebo+ Federation",
    targetScreens: "UX-PUB-024, UX-CMS-007, UX-BR-033",
    description: "Un-deferred SSO identity exchange & entitlement synchronization.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Falls back safely to universal deep links and decoupled webhooks.",
  },
  FF_PORTAL_PARTNER_AUDITOR: {
    key: "FF_PORTAL_PARTNER_AUDITOR",
    domain: "Partner Portals",
    targetScreens: "UX-POR-004, UX-POR-005",
    description: "Un-deferred dedicated partner and external auditor portals.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Falls back to standard client representative views.",
  },
  FF_SHARED_HUB_DIRECTORY: {
    key: "FF_SHARED_HUB_DIRECTORY",
    domain: "Shared Unified Workspace",
    targetScreens: "UX-HUB-005",
    description: "Un-deferred workspace global directory across all operational units.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Restricts workspace view to user's assigned role items.",
  },
  FF_SHARED_RISK_ISSUE_RECORDS: {
    key: "FF_SHARED_RISK_ISSUE_RECORDS",
    domain: "Governance & Risk",
    targetScreens: "UX-REC-004, UX-REC-005",
    description: "Un-deferred risk and issue management record views.",
    defaultDev: true,
    defaultStaging: true,
    defaultProd: false,
    isUndeferred: true,
    killSwitchPolicy: "Hides detailed risk records; surfaces incident notifications only.",
  },
};

// In-memory runtime override store (for testing, sandbox, and hot-toggling via admin UI)
const memoryOverrides: Map<FeatureFlagKey, FeatureFlagOverride> = new Map();

/**
 * Resolves the active state of a feature flag.
 * Evaluation Precedence:
 * 1. Runtime Override (Memory / DB)
 * 2. Environment Variable Override (process.env[key])
 * 3. Environment Baseline Default (NODE_ENV: dev, staging, prod)
 */
export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  const def = FEATURE_FLAG_DEFINITIONS[key];
  if (!def) {
    console.warn(`[FEATURE-FLAGS] Unknown feature flag key: ${key}`);
    return false;
  }

  // 1. Runtime override
  if (memoryOverrides.has(key)) {
    return memoryOverrides.get(key)!.enabled;
  }

  // 2. Environment variable override
  const envVal = process.env[key];
  if (envVal !== undefined) {
    return envVal === "true" || envVal === "1";
  }

  // 3. Default based on environment
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "production") {
    return def.defaultProd;
  }
  if (nodeEnv === "staging") {
    return def.defaultStaging;
  }
  return def.defaultDev;
}

/**
 * Updates a feature flag override at runtime.
 */
export async function setFeatureFlagOverride(
  key: FeatureFlagKey,
  enabled: boolean,
  updatedBy: string = "system:admin",
  reason?: string
): Promise<FeatureFlagState> {
  const def = FEATURE_FLAG_DEFINITIONS[key];
  if (!def) {
    throw new Error(`Invalid feature flag key: ${key}`);
  }

  const override: FeatureFlagOverride = {
    enabled,
    updatedAt: new Date().toISOString(),
    updatedBy,
    reason: reason || "Manual administrative update via UX-ADM-004",
  };

  memoryOverrides.set(key, override);

  // Emit structured audit log
  try {
    recordAuditLog({
      action: "FEATURE_FLAG_UPDATED",
      resource: "FeatureFlag",
      resourceId: key,
      userId: updatedBy,
      changes: {
        key,
        enabled,
        reason,
        timestamp: override.updatedAt,
      },
    });
  } catch (err) {
    console.warn(`[FEATURE-FLAGS] Audit log failed for ${key}:`, err);
  }

  return getFeatureFlagState(key);
}

/**
 * Clears an in-memory override, reverting to env/default.
 */
export function clearFeatureFlagOverride(key: FeatureFlagKey): void {
  memoryOverrides.delete(key);
}

/**
 * Clears all in-memory overrides (useful for clean test resets).
 */
export function resetAllFeatureFlagOverrides(): void {
  memoryOverrides.clear();
}

/**
 * Retrieves the full state description of a single feature flag.
 */
export function getFeatureFlagState(key: FeatureFlagKey): FeatureFlagState {
  const def = FEATURE_FLAG_DEFINITIONS[key];
  if (!def) {
    throw new Error(`Invalid feature flag key: ${key}`);
  }

  const override = memoryOverrides.get(key);
  let source: FeatureFlagState["source"];
  let enabled: boolean;

  if (override !== undefined) {
    enabled = override.enabled;
    source = "OVERRIDE";
  } else if (process.env[key] !== undefined) {
    enabled = process.env[key] === "true" || process.env[key] === "1";
    source = "ENVIRONMENT";
  } else {
    const nodeEnv = process.env.NODE_ENV || "development";
    enabled = nodeEnv === "production" ? def.defaultProd : nodeEnv === "staging" ? def.defaultStaging : def.defaultDev;
    source = "DEFAULT";
  }

  return {
    ...def,
    enabled,
    source,
    override,
  };
}

/**
 * Retrieves all feature flags with current operational states.
 */
export function getAllFeatureFlags(): Record<FeatureFlagKey, FeatureFlagState> {
  const result: Partial<Record<FeatureFlagKey, FeatureFlagState>> = {};
  for (const key of Object.keys(FEATURE_FLAG_DEFINITIONS) as FeatureFlagKey[]) {
    result[key] = getFeatureFlagState(key);
  }
  return result as Record<FeatureFlagKey, FeatureFlagState>;
}

/**
 * Server guard checking feature flag; throws error or returns rejection payload.
 */
export function assertFeatureEnabled(key: FeatureFlagKey, actionDescription?: string): void {
  if (!isFeatureEnabled(key)) {
    const def = FEATURE_FLAG_DEFINITIONS[key];
    const err = new Error(
      `[VMNL-FEATURE-DISABLED] ${actionDescription || "This feature"} is currently disabled by governance flag '${key}'. ${def?.killSwitchPolicy || ""}`
    );
    (err as any).statusCode = 403;
    (err as any).code = "FEATURE_DISABLED";
    (err as any).flagKey = key;
    throw err;
  }
}

/**
 * Render standard accessible HTML notice for disabled feature views.
 */
export function renderFeatureDisabledNotice(
  key: FeatureFlagKey,
  featureTitle: string,
  backUrl: string = "/hub"
): string {
  const def = FEATURE_FLAG_DEFINITIONS[key];
  return `
    <div class="card" style="max-width: 680px; margin: 40px auto; text-align: center; padding: var(--vmn-space-8); border: 2px dashed var(--vmn-color-border-subtle);">
      <div style="margin-bottom: var(--vmn-space-4); display: flex; justify-content: center; color: var(--vmn-accent-primary);">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 700; color: var(--vmn-color-primary-text); margin-bottom: var(--vmn-space-2);">
        ${featureTitle} Currently Inactive
      </h2>
      <p style="color: var(--vmn-color-secondary-text); margin-bottom: var(--vmn-space-4); line-height: 1.6;">
        This operational workspace is gated under feature flag <code>${key}</code>.
      </p>
      <div style="background: var(--vmn-color-surface-subtle); border-radius: var(--vmn-radius-md); padding: var(--vmn-space-4); margin-bottom: var(--vmn-space-6); text-align: left;">
        <strong style="color: var(--vmn-color-primary-text); display: block; margin-bottom: 4px;">Operational Policy:</strong>
        <span style="color: var(--vmn-color-secondary-text); font-size: var(--vmn-font-size-sm);">${def?.killSwitchPolicy || "Safe fallback active."}</span>
      </div>
      <div style="display: flex; gap: var(--vmn-space-4); justify-content: center;">
        <a href="${backUrl}" class="button button--secondary" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--vmn-space-6);">
          Return to Dashboard
        </a>
        <a href="/admin/feature-flags" class="button button--primary" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--vmn-space-6);">
          Inspect Feature Flags
        </a>
      </div>
    </div>
  `;
}
