/**
 * Extended Creative Hub Workspaces (UX-ACC, UX-AFC, UX-VTM, UX-ONE, UX-VCF, UX-EVT, UX-TEND)
 * Authority: VMN APP UI UX.docx §4.3–4.10 / BRD-PRD-001
 *
 * TODO-SCR-18: every desk is a projection over its existing domain engine —
 * the MOCK_* datasets are deleted. Each renderer receives an engine snapshot
 * (plain data) and renders only canonical records; an empty engine renders an
 * honest empty state, never invented rows. Mutating forms POST to guarded
 * routes (AUD-01 table or inline assertRoutePermission).
 *
 * Snapshot input shapes (built by the router from the live engines):
 * - AcceleratorDeskSnapshot   → TalentAcceleratorRegistry
 * - CommunityDeskSnapshot     → AfroFusionCommunityHub
 * - VtmWorkbenchSnapshot      → VirtualTalentManagementEngine
 * - OneStudiosDeskSnapshot    → OneStudiosEngine
 * - VcfMissionsSnapshot       → VirtualContentFundEngine
 * - FusionEventsDeskSnapshot  → FusionEventsEngine
 * - TendCatalogueSnapshot     → TendDistributionEngine
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";
import { SessionUser } from "../../core/auth/index.js";

function renderEmptyRecords(note: string): string {
  return `
    <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px dashed var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
      <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0;">${note}</p>
    </div>
  `;
}

// =============================================================================
// 1. TALENT ACCELERATOR (UX-ACC-001..008) — over TalentAcceleratorRegistry
// =============================================================================

export interface AcceleratorDeskSnapshot {
  hubs: Array<{
    id: string;
    name: string;
    state: string;
    leadCoordinator: string;
    activeTalentCount: number;
    isAccredited: boolean;
    facilitiesAvailable: string[];
  }>;
  verifiedTalentCount: number;
  pipelineTalentCount: number;
  totalTalentCount: number;
}

export function renderTalentAcceleratorDeskHtml(snapshot: AcceleratorDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_TALENT_ACCELERATOR_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_TALENT_ACCELERATOR_OPS",
      "Talent Accelerator Workspace (UX-ACC-001..008)",
      "/workspace"
    );
  }

  const hubs = snapshot?.hubs || [];
  const totalTalent = snapshot?.totalTalentCount ?? 0;
  const verified = snapshot?.verifiedTalentCount ?? 0;
  const pipeline = snapshot?.pipelineTalentCount ?? 0;
  const readinessPercent = totalTalent > 0 ? Math.round((verified / totalTalent) * 100) : 0;

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">ACCELERATOR &bull; UX-ACC-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Talent Accelerator Partner Network &amp; Funding Readiness
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of TalentAcceleratorRegistry &bull; Partner hubs, pipeline &amp; verification gates
          </p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="#partner-intake" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Register Partner Hub &rarr;
          </a>
        </div>
      </div>

      <!-- Metric Highlights (computed from the registry) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Registered Partner Hubs</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-brand-cyan); margin-top: 4px;">${hubs.length} Hubs</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">${hubs.filter((h) => h.isAccredited).length} accredited</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Talent in Registry</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-primary-text); margin-top: 4px;">${totalTalent} Profiles</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">${verified} verified &bull; ${pipeline} in pipeline</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Verification Gate BG1</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${readinessPercent}% Verified</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Share of registry holding VERIFIED status</div>
        </div>
      </div>

      <!-- Partner Hub Table (canonical) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Institutional Partner Hub Registry (UX-ACC-002)
        </h3>
        ${
          hubs.length === 0
            ? renderEmptyRecords("No partner hubs are registered in the TalentAcceleratorRegistry yet — this desk renders canonical registry records only.")
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Hub ID</th>
                <th style="padding: 10px 12px;">Partner Hub</th>
                <th style="padding: 10px 12px;">State</th>
                <th style="padding: 10px 12px;">Lead Coordinator</th>
                <th style="padding: 10px 12px;">Facilities</th>
                <th style="padding: 10px 12px; text-align: center;">Active Talent</th>
                <th style="padding: 10px 12px;">Accreditation</th>
              </tr>
            </thead>
            <tbody>
              ${hubs
                .map(
                  (h) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(h.id)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(h.name)}</td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">${escapeHtml(h.state)}</td>
                  <td style="padding: 12px;">${escapeHtml(h.leadCoordinator)}</td>
                  <td style="padding: 12px;">
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${h.facilitiesAvailable.slice(0, 3).map((f) => `<span class="vmn-badge badge-neutral" style="font-size: 0.7rem;">${escapeHtml(f)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="padding: 12px; text-align: center;">${h.activeTalentCount}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${h.isAccredited ? "badge-ready" : "badge-warning"}">${h.isAccredited ? "ACCREDITED" : "PENDING"}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>

      <!-- Partner Hub Intake Action Form -->
      <div id="partner-intake" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Register Institutional Partner Hub (UX-ACC-004)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Writes a new partner hub into the canonical TalentAcceleratorRegistry (guarded mutation, create:talent).
        </p>
        <form method="POST" action="/api/v1/workspace/accelerator/partners" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Partner Hub Name</label>
            <input type="text" name="name" required placeholder="e.g. Jos Plateau Creative Collective" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">City</label>
            <input type="text" name="city" required placeholder="e.g. Jos" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">State</label>
            <input type="text" name="state" required placeholder="e.g. Plateau" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Lead Coordinator</label>
            <input type="text" name="leadCoordinator" required placeholder="Coordinator full name" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Contact Email</label>
            <input type="email" name="contactEmail" required placeholder="hub@partner.example" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Facilities (comma-separated)</label>
            <input type="text" name="facilitiesAvailable" placeholder="Edit Lab, Screening Room" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Submit Partner Hub
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 2. AFRO-FUSION COMMUNITY GUILDS (UX-AFC-001..006) — over AfroFusionCommunityHub
// =============================================================================

export interface CommunityDeskSnapshot {
  locations: Array<{ id: string; name: string; city: string; address: string; open: string; close: string }>;
  resources: Array<{ id: string; name: string; type: string; hourlyRateNgn: number; minimumTierRequired: string; isActive: boolean }>;
  members: Array<{ id: string; fullName: string; tier: string; status: string; guilds: string[] }>;
  bookings: Array<{ id: string; resourceId: string; memberId: string; status: string; totalCostNgn: number }>;
}

export function renderCommunityGuildsDeskHtml(snapshot: CommunityDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_AFRO_FUSION_COMMUNITY_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_AFRO_FUSION_COMMUNITY_OPS",
      "Afro-Fusion Community Guilds (UX-AFC-001..006)",
      "/workspace"
    );
  }

  const locations = snapshot?.locations || [];
  const resources = snapshot?.resources || [];
  const members = snapshot?.members || [];
  const bookings = snapshot?.bookings || [];
  const activeMembers = members.filter((m) => m.status === "ACTIVE").length;

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">COMMUNITY &bull; UX-AFC-001..006</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Afro-Fusion Guilds &amp; Peer Collaboration Hub
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of AfroFusionCommunityHub &bull; Locations, resources, memberships &amp; bookings
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#register-member" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("bolt", { size: 16 })} Register Guild Member &rarr;
          </a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Hub Locations</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-brand-cyan); margin-top: 4px;">${locations.length}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Members Registered</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-primary-text); margin-top: 4px;">${members.length}</div>
          <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">${activeMembers} ACTIVE</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Bookable Resources</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${resources.filter((r) => r.isActive).length}</div>
        </div>
        <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Resource Bookings</div>
          <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${bookings.length}</div>
        </div>
      </div>

      ${
        locations.length === 0
          ? renderEmptyRecords("No hub locations exist in the AfroFusionCommunityHub yet — this desk renders canonical hub records only.")
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Hub Locations &amp; Bookable Resources (UX-AFC-002)</h3>
        ${locations
          .map(
            (l) => `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(l.name)} <span class="vmn-badge badge-info">${escapeHtml(l.city)}</span></div>
            <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">${escapeHtml(l.address)} &bull; Open ${escapeHtml(l.open)}–${escapeHtml(l.close)}</div>
          </div>
          ${
            resources.filter((r) => locations.find((loc) => loc.id === r.id.substring(0, r.id.length)) === undefined).length >= 0
              ? `<div class="table-container" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                  <th style="padding: 8px 10px;">Resource</th>
                  <th style="padding: 8px 10px;">Type</th>
                  <th style="padding: 8px 10px; text-align: right;">Rate (NGN/hr)</th>
                  <th style="padding: 8px 10px;">Minimum Tier</th>
                  <th style="padding: 8px 10px;">State</th>
                </tr>
              </thead>
              <tbody>
                ${resources
                  .map(
                    (r) => `
                  <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                    <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(r.name)}</td>
                    <td style="padding: 8px 10px;"><span class="vmn-badge badge-neutral">${escapeHtml(r.type.replace(/_/g, " "))}</span></td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace;">${r.hourlyRateNgn.toLocaleString("en-NG")}</td>
                    <td style="padding: 8px 10px;">${escapeHtml(r.minimumTierRequired)}</td>
                    <td style="padding: 8px 10px;"><span class="vmn-badge ${r.isActive ? "badge-ready" : "badge-warning"}">${r.isActive ? "ACTIVE" : "INACTIVE"}</span></td>
                  </tr>`
                  )
                  .join("")}
                ${
                  resources.length === 0
                    ? `<tr><td colspan="5" style="padding: 10px; color: var(--vmn-color-secondary-text);">No resources registered for the hub yet.</td></tr>`
                    : ""
                }
              </tbody>
            </table>
          </div>`
              : ""
          }
        `
          )
          .join("")}
      </div>`
      }

      ${
        members.length === 0
          ? ""
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Registered Members &amp; Guild Affiliations (UX-AFC-003)</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 8px 10px;">Member</th>
                <th style="padding: 8px 10px;">Tier</th>
                <th style="padding: 8px 10px;">Status</th>
                <th style="padding: 8px 10px;">Guilds</th>
              </tr>
            </thead>
            <tbody>
              ${members
                .map(
                  (m) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(m.fullName)}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge badge-info">${escapeHtml(m.tier)}</span></td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge ${m.status === "ACTIVE" ? "badge-ready" : "badge-warning"}">${escapeHtml(m.status)}</span></td>
                  <td style="padding: 8px 10px;">${m.guilds.length ? m.guilds.map((g) => `<span class="vmn-badge badge-neutral" style="font-size: 0.7rem;">${escapeHtml(g)}</span>`).join(" ") : "—"}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Member Registration Form -->
      <div id="register-member" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Register Community Member (UX-AFC-004)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Writes a member into the canonical AfroFusionCommunityHub (guarded mutation, create:talent).
        </p>
        <form method="POST" action="/api/v1/workspace/community/sprints" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Full Name</label>
            <input type="text" name="fullName" required placeholder="Creator full name" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Email</label>
            <input type="email" name="email" required placeholder="creator@example.com" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Membership Tier</label>
            <select name="tier" required style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);">
              <option value="COMMUNITY">Community</option>
              <option value="STUDENT">Student</option>
              <option value="CREATOR">Creator</option>
              <option value="RESIDENT">Resident</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Guilds (comma-separated)</label>
            <input type="text" name="guilds" placeholder="Screenwriters, Cinematographers" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Register Member
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 3. VTM MATCHING & CASTING WORKBENCH (UX-VTM-003..007, 012) — over vtmEngine
// =============================================================================

export interface VtmWorkbenchSnapshot {
  brief?: { id: string; title: string; roleCategory: string; requiredTier: string; locationCity: string; budgetPerDayNgn: number; buyoutTier: string };
  matches: Array<{
    talentId: string;
    fullName: string;
    matchScorePercent: number;
    qualificationReasons: string[];
    dayRateNgn?: number;
    tier: string;
    status: string;
  }>;
}

export function renderVtmMatchingWorkbenchHtml(snapshot: VtmWorkbenchSnapshot | undefined, opportunityId: string = "OPP-2026-88"): string {
  if (!isFeatureEnabled("FF_VTM_MARKETPLACE_DEPLOYMENT")) {
    return renderFeatureDisabledNotice(
      "FF_VTM_MARKETPLACE_DEPLOYMENT",
      "VTM Talent Matching Workbench (UX-VTM-003..007, 012)",
      "/portal/vtm"
    );
  }

  const brief = snapshot?.brief;
  const matches = snapshot?.matches || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">VTM CASTING &bull; UX-VTM-003..007, 012</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Talent Matching &amp; Protected Deployment Workbench
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Active Opportunity: <strong>${escapeHtml(opportunityId)}</strong>${brief ? ` — ${escapeHtml(brief.title)} (${escapeHtml(brief.roleCategory.replace(/_/g, " "))}, tier ≥ ${escapeHtml(brief.requiredTier)}, ${escapeHtml(brief.locationCity)})` : " — brief not found in the VTM engine"}
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/portal/vtm/marketplace" class="btn btn-secondary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Back to Marketplace
          </a>
        </div>
      </div>

      ${
        !brief
          ? renderEmptyRecords(`No opportunity brief '${escapeHtml(opportunityId)}' exists in the VirtualTalentManagementEngine. Create one via POST /api/v1/hub/vtm/briefs — this workbench renders engine records only.`)
          : matches.length === 0
            ? renderEmptyRecords("No talent profiles match this brief in the registry yet — matches come from vtmEngine.matchTalent over TalentAcceleratorRegistry profiles.")
            : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Algorithmically Matched Candidates (vtmEngine.matchTalent)
        </h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Candidate</th>
                <th style="padding: 10px 12px;">Tier</th>
                <th style="padding: 10px 12px;">Match %</th>
                <th style="padding: 10px 12px;">Governed Day Rate</th>
                <th style="padding: 10px 12px;">Qualification Reasons</th>
                <th style="padding: 10px 12px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${matches
                .map(
                  (c) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">
                    ${escapeHtml(c.fullName)}
                    <div style="font-size: 0.75rem; font-family: monospace; color: var(--vmn-color-secondary-text);">${escapeHtml(c.talentId)}</div>
                  </td>
                  <td style="padding: 12px;"><span class="vmn-badge badge-info">${escapeHtml(c.tier)}</span></td>
                  <td style="padding: 12px;">
                    <span class="vmn-badge badge-ready" style="font-weight: 800;">${c.matchScorePercent}% Match</span>
                  </td>
                  <td style="padding: 12px; font-family: monospace; font-weight: 700;">NGN ${(c.dayRateNgn ?? 0).toLocaleString("en-NG")} / day</td>
                  <td style="padding: 12px;">
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${c.qualificationReasons.slice(0, 3).map((r) => `<span class="vmn-badge badge-neutral" style="font-size: 0.7rem;">${escapeHtml(r)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="padding: 12px; text-align: right;">
                    <form method="POST" action="/api/v1/workspace/vtm/cast" style="display: inline;">
                      <input type="hidden" name="candidateId" value="${escapeHtml(c.talentId)}" />
                      <input type="hidden" name="opportunityId" value="${escapeHtml(opportunityId)}" />
                      <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 16px; font-size: 0.85rem; font-weight: 700;">
                        Draft Term Sheet &rarr;
                      </button>
                    </form>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }
    </div>
  `;
}

// =============================================================================
// 4. ONE STUDIOS PRODUCTION DESK & CALL SHEETS (UX-ONE-001..009) — over oneStudios
// =============================================================================

export interface OneStudiosDeskSnapshot {
  assets: Array<{ id: string; assetTag: string; name: string; category: string; dailyRateNgn: number; condition: string; isAvailable: boolean }>;
  bookings: Array<{ id: string; productionName: string; assetIds: string[]; status: string; securityDepositNgn: number }>;
  callSheets: Array<{ id: string; productionName: string; shootDate: string; generalCallTime: string; location: string; scenesCount: number }>;
}

export function renderOneStudiosProductionDeskHtml(snapshot: OneStudiosDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_ONE_STUDIOS_PRODUCTION_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_ONE_STUDIOS_PRODUCTION_OPS",
      "ONE Studios Production Desk (UX-ONE-001..009)",
      "/workspace"
    );
  }

  const assets = snapshot?.assets || [];
  const bookings = snapshot?.bookings || [];
  const callSheets = snapshot?.callSheets || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">PRODUCTION &bull; UX-ONE-001..009</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            ONE Studios Production Command &amp; Call Sheet Dispatcher
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of OneStudiosEngine &bull; Gear locker, bookings &amp; call sheets
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#call-sheet" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Generate Call Sheet &rarr;
          </a>
        </div>
      </div>

      <!-- Gear Locker (canonical assets) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Production Gear Locker (UX-ONE-004)
        </h3>
        ${
          assets.length === 0
            ? renderEmptyRecords("No production assets are registered in OneStudiosEngine yet.")
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Asset Tag</th>
                <th style="padding: 10px 12px;">Item</th>
                <th style="padding: 10px 12px;">Category</th>
                <th style="padding: 10px 12px; text-align: right;">Day Rate</th>
                <th style="padding: 10px 12px;">Condition</th>
                <th style="padding: 10px 12px;">Availability</th>
              </tr>
            </thead>
            <tbody>
              ${assets
                .map(
                  (a) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700;">${escapeHtml(a.assetTag)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(a.name)}</td>
                  <td style="padding: 12px;"><span class="vmn-badge badge-neutral">${escapeHtml(a.category.replace(/_/g, " "))}</span></td>
                  <td style="padding: 12px; text-align: right; font-family: monospace;">NGN ${a.dailyRateNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${a.condition === "PRISTINE" || a.condition === "GOOD" ? "badge-ready" : "badge-warning"}">${escapeHtml(a.condition)}</span></td>
                  <td style="padding: 12px;"><span class="vmn-badge ${a.isAvailable ? "badge-ready" : "badge-warning"}">${a.isAvailable ? "AVAILABLE" : "IN USE"}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>

      ${
        bookings.length === 0 && callSheets.length === 0
          ? ""
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Active Bookings &amp; Published Call Sheets (UX-ONE-002)</h3>
        ${
          bookings.length === 0
            ? ""
            : `<div class="table-container" style="overflow-x: auto; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead><tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);"><th style="padding: 8px 10px;">Booking</th><th style="padding: 8px 10px;">Production</th><th style="padding: 8px 10px;">Assets</th><th style="padding: 8px 10px;">Status</th></tr></thead>
            <tbody>
              ${bookings
                .map(
                  (b) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-family: monospace;">${escapeHtml(b.id)}</td>
                  <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(b.productionName)}</td>
                  <td style="padding: 8px 10px;">${b.assetIds.length} asset(s)</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge badge-info">${escapeHtml(b.status)}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
        ${
          callSheets.length === 0
            ? ""
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead><tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);"><th style="padding: 8px 10px;">Call Sheet</th><th style="padding: 8px 10px;">Production</th><th style="padding: 8px 10px;">Shoot Date</th><th style="padding: 8px 10px;">Call Time</th><th style="padding: 8px 10px;">Scenes</th></tr></thead>
            <tbody>
              ${callSheets
                .map(
                  (c) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-family: monospace;">${escapeHtml(c.id)}</td>
                  <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(c.productionName)}</td>
                  <td style="padding: 8px 10px;">${escapeHtml(c.shootDate)}</td>
                  <td style="padding: 8px 10px;">${escapeHtml(c.generalCallTime)}</td>
                  <td style="padding: 8px 10px;">${c.scenesCount} scene(s)</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>`
      }

      <!-- Call Sheet Generator Form -->
      <div id="call-sheet" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Publish Digital Call Sheet (UX-ONE-002)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Publishes a call sheet into the canonical OneStudiosEngine (guarded mutation, create:talent).
        </p>
        <form method="POST" action="/api/v1/workspace/production/callsheet" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Production Name</label>
            <input type="text" name="productionName" required placeholder="e.g. Lagos Neon Chronicles S2" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Shoot Date</label>
            <input type="date" name="shootDate" required style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">General Call Time</label>
            <input type="time" name="generalCallTime" required value="06:30" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Location</label>
            <input type="text" name="location" required value="VMN ONE Studios, Soundstage A" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Nearest Hospital &amp; Safety Notes</label>
            <input type="text" name="nearestHospital" required value="Lagoon Hospital Lekki" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("lock", { size: 16 })} Publish Call Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 5. VCF CREATOR MISSIONS & FORMAT LAB (UX-VCF-001..008) — over vcfEngine
// =============================================================================

export interface VcfMissionsSnapshot {
  pitches: Array<{
    id: string;
    title: string;
    logline: string;
    format: string;
    budgetEstimateNgn: number;
    status: string;
    submittedAt: string;
    compositeScore?: number;
  }>;
  activeSlate: Array<{ id: string; title: string; stage: string; approvedBudgetNgn: number; disbursedCapitalNgn: number }>;
}

export function renderVcfCreatorMissionsHtml(snapshot: VcfMissionsSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_VCF_CREATOR_MISSIONS")) {
    return renderFeatureDisabledNotice(
      "FF_VCF_CREATOR_MISSIONS",
      "VCF Creator Missions Workspace (UX-VCF-001..008)",
      "/workspace"
    );
  }

  const pitches = snapshot?.pitches || [];
  const slate = snapshot?.activeSlate || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">VCF FORMAT LAB &bull; UX-VCF-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            VCF Creator Missions &amp; Rapid Format Sprints
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of VirtualContentFundEngine &bull; Pitch pipeline &amp; active slate
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#submit-pitch" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("bolt", { size: 16 })} Submit Mission Pitch &rarr;
          </a>
        </div>
      </div>

      ${
        pitches.length === 0
          ? renderEmptyRecords("No pitches exist in the VirtualContentFundEngine yet — this desk renders canonical fund records only. Submit one below.")
          : `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 32px;">
        ${pitches
          .map(
            (m) => `
          <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="vmn-badge badge-info" style="font-family: monospace;">${escapeHtml(m.id)}</span>
              <span class="vmn-badge ${m.status === "GREENLIT" || m.status === "CONTRACTED" ? "badge-ready" : "badge-warning"}">${escapeHtml(m.status)}</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">${escapeHtml(m.title)}</h3>
            <p style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin: 0 0 12px 0;">${escapeHtml(m.logline)}</p>
            <div style="display: flex; justify-content: space-between; background: var(--vmn-color-surface-hover); padding: 12px; border-radius: var(--vmn-radius-md); font-size: 0.85rem; margin-bottom: 12px;">
              <div>
                <span style="color: var(--vmn-color-secondary-text); display: block; font-size: 0.75rem;">Format</span>
                <strong>${escapeHtml(m.format.replace(/_/g, " "))}</strong>
              </div>
              <div style="text-align: right;">
                <span style="color: var(--vmn-color-secondary-text); display: block; font-size: 0.75rem;">Budget Estimate</span>
                <strong style="font-family: monospace;">NGN ${m.budgetEstimateNgn.toLocaleString("en-NG")}</strong>
              </div>
            </div>
            ${m.compositeScore !== undefined ? `<div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text);">Evaluation composite: <strong>${m.compositeScore}/100</strong></div>` : ""}
            <div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">Submitted: <strong>${escapeHtml(m.submittedAt)}</strong></div>
          </div>
        `
          )
          .join("")}
      </div>`
      }

      ${
        slate.length === 0
          ? ""
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Active Greenlit Slate (UX-VCF-006)</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead><tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);"><th style="padding: 8px 10px;">Project</th><th style="padding: 8px 10px;">Stage</th><th style="padding: 8px 10px; text-align: right;">Approved Budget</th><th style="padding: 8px 10px; text-align: right;">Disbursed</th></tr></thead>
            <tbody>
              ${slate
                .map(
                  (p) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(p.title)}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge badge-info">${escapeHtml(p.stage.replace(/_/g, " "))}</span></td>
                  <td style="padding: 8px 10px; text-align: right; font-family: monospace;">NGN ${p.approvedBudgetNgn.toLocaleString("en-NG")}</td>
                  <td style="padding: 8px 10px; text-align: right; font-family: monospace;">NGN ${p.disbursedCapitalNgn.toLocaleString("en-NG")}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Pitch Submission Form -->
      <div id="submit-pitch" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Submit Commissioning Pitch (UX-VCF-004)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Writes a pitch into the canonical VirtualContentFundEngine pipeline (guarded mutation, create:talent).
        </p>
        <form method="POST" action="/api/v1/workspace/vcf/missions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Pitch Title</label>
            <input type="text" name="title" required placeholder="e.g. Afro-SciFi 3-Minute Pilot" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Format</label>
            <select name="format" required style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);">
              <option value="CREATOR_SHORT">Creator Short</option>
              <option value="EPISODIC_SERIES">Episodic Series</option>
              <option value="DOCUMENTARY">Documentary</option>
              <option value="FORMAT_REALITY">Format / Reality</option>
              <option value="FEATURE_FILM">Feature Film</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Budget Estimate (NGN)</label>
            <input type="number" name="budgetEstimateNgn" required min="500000" step="250000" placeholder="2500000" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Treatment Deck URL</label>
            <input type="url" name="treatmentDeckUrl" required placeholder="https://..." style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Logline</label>
            <textarea name="logline" rows="2" required placeholder="One-sentence story hook..." style="width: 100%; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);"></textarea>
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Submit Pitch to Fund
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 6. FUSION EVENTS OPS & TICKET SCANNER (UX-EVT-001..008) — over eventsEngine
// =============================================================================

export interface FusionEventsDeskSnapshot {
  events: Array<{
    id: string;
    name: string;
    category: string;
    venueName: string;
    venueCity: string;
    eventDate: string;
    doorsOpenTime: string;
    capacity: number;
    totalSold: number;
    totalCheckedIn: number;
  }>;
}

export function renderFusionEventsDeskHtml(snapshot: FusionEventsDeskSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_FUSION_EVENTS_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_FUSION_EVENTS_OPS",
      "Fusion Events Experiential Operations (UX-EVT-001..008)",
      "/workspace"
    );
  }

  const events = snapshot?.events || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">LIVE EVENTS &bull; UX-EVT-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Fusion Events Stage Manager &amp; Gate Validation
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of FusionEventsEngine &bull; Live gate statistics &amp; HMAC ticket validation
          </p>
        </div>
      </div>

      ${
        events.length === 0
          ? renderEmptyRecords("No events exist in the FusionEventsEngine yet — this desk renders canonical event records only. Create one via POST /api/v1/hub/events (createEvent).")
          : `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${events
          .map((e) => {
            const scanRate = e.totalSold > 0 ? Math.round((e.totalCheckedIn / e.totalSold) * 100) : 0;
            return `
          <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="vmn-badge badge-info" style="font-family: monospace;">${escapeHtml(e.id)}</span>
              <span class="vmn-badge badge-neutral">${escapeHtml(e.category.replace(/_/g, " "))}</span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">${escapeHtml(e.name)}</h3>
            <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-bottom: 12px;">
              ${escapeHtml(e.venueName)}, ${escapeHtml(e.venueCity)} &bull; ${escapeHtml(e.eventDate)} &bull; Doors ${escapeHtml(e.doorsOpenTime)}
            </div>
            <div style="display: flex; justify-content: space-between; background: var(--vmn-color-surface-hover); padding: 12px; border-radius: var(--vmn-radius-md); font-size: 0.85rem; margin-bottom: 8px;">
              <div>
                <span style="color: var(--vmn-color-secondary-text); display: block; font-size: 0.75rem;">Gate Scans Verified</span>
                <strong style="font-size: 1.1rem; color: var(--vmn-color-brand-cyan);">${e.totalCheckedIn} / ${e.totalSold}</strong>
              </div>
              <div style="text-align: right;">
                <span style="color: var(--vmn-color-secondary-text); display: block; font-size: 0.75rem;">Venue Capacity</span>
                <strong>${e.capacity}</strong>
              </div>
            </div>
            <div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text);">${scanRate}% of sold tickets checked in</div>
          </div>
        `;
          })
          .join("")}
      </div>`
      }

      <!-- Quick QR Ticket Validator (real engine validation) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Gate Entry QR Ticket Validation (UX-EVT-006)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Validates the ticket against FusionEventsEngine (HMAC signature + single-use check). The result is recorded truthfully — reuse and forged tickets are rejected.
        </p>
        <form method="POST" action="/api/v1/workspace/events/scan" style="display: flex; gap: 12px; flex-wrap: wrap;">
          <select name="eventId" required style="min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);">
            ${events.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join("")}
            ${events.length === 0 ? `<option value="">No events in engine</option>` : ""}
          </select>
          <input type="text" name="ticketCode" required placeholder="Ticket number, e.g. EVT-XXXXXX-…" style="flex: 1; min-width: 260px; min-height: 44px; padding: 8px 12px; font-family: monospace; font-size: 1.05rem; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
            ${renderIcon("check", { size: 16 })} Validate Ticket Entry
          </button>
        </form>
      </div>
    </div>
  `;
}

// =============================================================================
// 7. TEND RIGHTS DISTRIBUTION & SYNDICATION (UX-TEND-001..008) — over tendEngine
// =============================================================================

export interface TendCatalogueSnapshot {
  titles: Array<{
    id: string;
    title: string;
    genre: string;
    runningTimeMinutes: number;
    minimumLicenseFeeUsd: number;
    masterDeliveryStatus: string;
  }>;
  licenses: Array<{
    id: string;
    titleId: string;
    licenseeName: string;
    territory: string;
    medium: string;
    isExclusive: boolean;
    startDate: string;
    endDate: string;
    licenseFeeUsd: number;
    paymentStatus: string;
  }>;
}

export function renderTendRightsDistributionHtml(snapshot: TendCatalogueSnapshot | undefined, user?: SessionUser): string {
  if (!isFeatureEnabled("FF_TND_DISTRIBUTION_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_TND_DISTRIBUTION_OPS",
      "TEND Distribution Catalogue (UX-TEND-001..008)",
      "/workspace"
    );
  }

  const titles = snapshot?.titles || [];
  const licenses = snapshot?.licenses || [];

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">TEND SYNDICATION &bull; UX-TEND-001..008</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            TEND B2B Rights Catalogue &amp; Territory Avails Matrix
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Canonical projection of TendDistributionEngine &bull; Avails computed from live licences
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#register-title" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Register Catalogue Title &rarr;
          </a>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Syndication Catalogue (TendDistributionEngine)
        </h3>
        ${
          titles.length === 0
            ? renderEmptyRecords("No titles are registered in the TendDistributionEngine catalogue yet — register the first below.")
            : `<div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 10px 12px;">Title ID</th>
                <th style="padding: 10px 12px;">Programme Title</th>
                <th style="padding: 10px 12px;">Genre</th>
                <th style="padding: 10px 12px; text-align: center;">Runtime (min)</th>
                <th style="padding: 10px 12px; text-align: right;">Min Licence Fee (USD)</th>
                <th style="padding: 10px 12px;">Master Delivery</th>
              </tr>
            </thead>
            <tbody>
              ${titles
                .map(
                  (t) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-family: monospace; font-weight: 700; color: var(--vmn-color-brand-cyan);">${escapeHtml(t.id)}</td>
                  <td style="padding: 12px; font-weight: 700; color: var(--vmn-color-primary-text);">${escapeHtml(t.title)}</td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">${escapeHtml(t.genre)}</td>
                  <td style="padding: 12px; text-align: center;">${t.runningTimeMinutes}</td>
                  <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700;">$${t.minimumLicenseFeeUsd.toLocaleString("en-US")}</td>
                  <td style="padding: 12px;"><span class="vmn-badge ${t.masterDeliveryStatus === "QC_APPROVED" || t.masterDeliveryStatus === "READY_FOR_DELIVERY" ? "badge-ready" : "badge-warning"}">${escapeHtml(t.masterDeliveryStatus.replace(/_/g, " "))}</span></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>`
        }
      </div>

      ${
        licenses.length === 0
          ? ""
          : `<div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 32px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">Active Distribution Licences (Avails Source of Truth)</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead><tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);"><th style="padding: 8px 10px;">Licence</th><th style="padding: 8px 10px;">Title</th><th style="padding: 8px 10px;">Licensee</th><th style="padding: 8px 10px;">Territory</th><th style="padding: 8px 10px;">Medium</th><th style="padding: 8px 10px;">Window</th><th style="padding: 8px 10px;">Terms</th></tr></thead>
            <tbody>
              ${licenses
                .map(
                  (l) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 8px 10px; font-family: monospace;">${escapeHtml(l.id)}</td>
                  <td style="padding: 8px 10px;">${escapeHtml(l.titleId)}</td>
                  <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(l.licenseeName)}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge badge-neutral">${escapeHtml(l.territory.replace(/_/g, " "))}</span></td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge badge-neutral">${escapeHtml(l.medium.replace(/_/g, " "))}</span></td>
                  <td style="padding: 8px 10px;">${escapeHtml(l.startDate)} → ${escapeHtml(l.endDate)}</td>
                  <td style="padding: 8px 10px;"><span class="vmn-badge ${l.isExclusive ? "badge-warning" : "badge-info"}">${l.isExclusive ? "EXCLUSIVE" : "NON-EXCL"}</span> <span class="vmn-badge ${l.paymentStatus === "PAID" ? "badge-ready" : "badge-warning"}">${escapeHtml(l.paymentStatus)}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Title Registration Form -->
      <div id="register-title" class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Register Catalogue Title (UX-TEND-002)
        </h3>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin-bottom: 20px;">
          Writes a title into the canonical TendDistributionEngine catalogue (guarded mutation, create:rights). Licence drafting with avails enforcement is available via POST /api/v1/hub/tend/licenses.
        </p>
        <form method="POST" action="/api/v1/workspace/tend/license" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Title ID</label>
            <input type="text" name="id" required placeholder="e.g. TND-2026-004" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Programme Title</label>
            <input type="text" name="title" required placeholder="Series or feature title" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Genre</label>
            <input type="text" name="genre" required placeholder="e.g. Afro-Futurist Crime Noir" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Runtime (minutes)</label>
            <input type="number" name="runningTimeMinutes" required min="1" placeholder="45" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Original Language</label>
            <input type="text" name="originalLanguage" required value="English" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div>
            <label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 6px;">Min Licence Fee (USD)</label>
            <input type="number" name="minimumLicenseFeeUsd" required min="1000" placeholder="50000" style="width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-sm); background: var(--vmn-color-background); color: var(--vmn-color-primary-text);" />
          </div>
          <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              ${renderIcon("check", { size: 16 })} Register Title
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
