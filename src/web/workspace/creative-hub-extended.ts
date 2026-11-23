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
 <div class="vmn-card s-jBAg6JRnQZ" >
 <p class="s-s8QClmJr6r">${escapeHtml(note)}</p>
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

export function renderTalentAcceleratorDeskHtml(snapshot: AcceleratorDeskSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >ACCELERATOR &bull; UX-ACC-001..008</span>
 <h1 class="s-n_bp1PhViu">
            Talent Accelerator Partner Network &amp; Funding Readiness
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of TalentAcceleratorRegistry &bull; Partner hubs, pipeline &amp; verification gates
          </p>
        </div>
 <div class="s-URRPIWgn0i">
 <a href="#partner-intake" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Register Partner Hub &rarr;
          </a>
        </div>
      </div>

      <!-- Metric Highlights (computed from the registry) -->
 <div class="s-LKssrCZ4j1">
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Registered Partner Hubs</div>
 <div class="s-ykrP-ZIQ8m">${escapeHtml(hubs.length)} Hubs</div>
 <div class="s-_tdYXnR5PA">${hubs.filter((h) => h.isAccredited).length} accredited</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Talent in Registry</div>
 <div class="s-5bXu9tLBIv">${escapeHtml(totalTalent)} Profiles</div>
 <div class="s-_tdYXnR5PA">${escapeHtml(verified)} verified &bull; ${escapeHtml(pipeline)} in pipeline</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Verification Gate BG1</div>
 <div class="s-Am3eRxce65">${escapeHtml(readinessPercent)}% Verified</div>
 <div class="s-_tdYXnR5PA">Share of registry holding VERIFIED status</div>
        </div>
      </div>

      <!-- Partner Hub Table (canonical) -->
 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Institutional Partner Hub Registry (UX-ACC-002)
        </h3>
        ${
          hubs.length === 0
            ? renderEmptyRecords("No partner hubs are registered in the TalentAcceleratorRegistry yet — this desk renders canonical registry records only.")
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Hub ID</th>
 <th class="s-lr_pOFE4_J">Partner Hub</th>
 <th class="s-lr_pOFE4_J">State</th>
 <th class="s-lr_pOFE4_J">Lead Coordinator</th>
 <th class="s-lr_pOFE4_J">Facilities</th>
 <th class="s-WWQfr0I4fx">Active Talent</th>
 <th class="s-lr_pOFE4_J">Accreditation</th>
              </tr>
            </thead>
            <tbody>
              ${hubs
                .map(
                  (h) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(h.id)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(h.name)}</td>
 <td class="s-gvP_yDU8_J">${escapeHtml(h.state)}</td>
 <td class="s-6FCnPHXEyo">${escapeHtml(h.leadCoordinator)}</td>
 <td class="s-6FCnPHXEyo">
 <div class="s-96uk0pGIx0">
 ${h.facilitiesAvailable.slice(0, 3).map((f) => `<span class="vmn-badge badge-neutral s-y4qO95-ZKm" >${escapeHtml(f)}</span>`).join("")}
                    </div>
                  </td>
 <td class="s-5fSyfN0kQ1">${escapeHtml(h.activeTalentCount)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${h.isAccredited ? "badge-ready" : "badge-warning"}">${h.isAccredited ? "ACCREDITED" : "PENDING"}</span></td>
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
 <div id="partner-intake" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Register Institutional Partner Hub (UX-ACC-004)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Writes a new partner hub into the canonical TalentAcceleratorRegistry (guarded mutation, create:talent).
        </p>
 <form method="POST" action="/api/v1/workspace/accelerator/partners" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Partner Hub Name</label>
 <input type="text" name="name" required placeholder="e.g. Jos Plateau Creative Collective" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">City</label>
 <input type="text" name="city" required placeholder="e.g. Jos" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">State</label>
 <input type="text" name="state" required placeholder="e.g. Plateau" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Lead Coordinator</label>
 <input type="text" name="leadCoordinator" required placeholder="Coordinator full name" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Contact Email</label>
 <input type="email" name="contactEmail" required placeholder="hub@partner.example" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Facilities (comma-separated)</label>
 <input type="text" name="facilitiesAvailable" placeholder="Edit Lab, Screening Room" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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

export function renderCommunityGuildsDeskHtml(snapshot: CommunityDeskSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >COMMUNITY &bull; UX-AFC-001..006</span>
 <h1 class="s-n_bp1PhViu">
            Afro-Fusion Guilds &amp; Peer Collaboration Hub
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of AfroFusionCommunityHub &bull; Locations, resources, memberships &amp; bookings
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#register-member" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("bolt", { size: 16 })} Register Guild Member &rarr;
          </a>
        </div>
      </div>

 <div class="s-LKssrCZ4j1">
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Hub Locations</div>
 <div class="s-ykrP-ZIQ8m">${escapeHtml(locations.length)}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Members Registered</div>
 <div class="s-5bXu9tLBIv">${escapeHtml(members.length)}</div>
 <div class="s-_tdYXnR5PA">${escapeHtml(activeMembers)} ACTIVE</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Bookable Resources</div>
 <div class="s-Am3eRxce65">${resources.filter((r) => r.isActive).length}</div>
        </div>
 <div class="vmn-card s-OAPQ4AS9-O" >
 <div class="s-cU3Cr5m8eq">Resource Bookings</div>
 <div class="s-vu7vwqr--r">${escapeHtml(bookings.length)}</div>
        </div>
      </div>

      ${
        locations.length === 0
          ? renderEmptyRecords("No hub locations exist in the AfroFusionCommunityHub yet — this desk renders canonical hub records only.")
 : `<div class="vmn-card s-58Wdku8jfj" >
 <h3 class="s-spyfDabz02">Hub Locations &amp; Bookable Resources (UX-AFC-002)</h3>
        ${locations
          .map(
            (l) => `
 <div class="s-BFqsiZ1_zP">
 <div class="s-v9ujfxeGxB">${escapeHtml(l.name)} <span class="vmn-badge badge-info">${escapeHtml(l.city)}</span></div>
 <div class="s-ypL9N-nGuz">${escapeHtml(l.address)} &bull; Open ${escapeHtml(l.open)}–${escapeHtml(l.close)}</div>
          </div>
          ${
            resources.filter((r) => locations.find((loc) => loc.id === r.id.substring(0, r.id.length)) === undefined).length >= 0
 ? `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-xtFEjzqBpd">
              <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">Resource</th>
 <th class="s-JKTsUAJmov">Type</th>
 <th class="s-sHkXKtnkuz">Rate (NGN/hr)</th>
 <th class="s-JKTsUAJmov">Minimum Tier</th>
 <th class="s-JKTsUAJmov">State</th>
                </tr>
              </thead>
              <tbody>
                ${resources
                  .map(
                    (r) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-sXJ_a8BSrJ">${escapeHtml(r.name)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-neutral">${escapeHtml(r.type.replace(/_/g, " "))}</span></td>
 <td class="s-WE5rq80ON-">${r.hourlyRateNgn.toLocaleString("en-NG")}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(r.minimumTierRequired)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge ${r.isActive ? "badge-ready" : "badge-warning"}">${r.isActive ? "ACTIVE" : "INACTIVE"}</span></td>
                  </tr>`
                  )
                  .join("")}
                ${
                  resources.length === 0
 ? `<tr><td colspan="5" class="s-sd0ON7oyx3">No resources registered for the hub yet.</td></tr>`
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
 : `<div class="vmn-card s-58Wdku8jfj" >
 <h3 class="s-spyfDabz02">Registered Members &amp; Guild Affiliations (UX-AFC-003)</h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-xtFEjzqBpd">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">Member</th>
 <th class="s-JKTsUAJmov">Tier</th>
 <th class="s-JKTsUAJmov">Status</th>
 <th class="s-JKTsUAJmov">Guilds</th>
              </tr>
            </thead>
            <tbody>
              ${members
                .map(
                  (m) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-emRVQFo-en">${escapeHtml(m.fullName)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-info">${escapeHtml(m.tier)}</span></td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge ${m.status === "ACTIVE" ? "badge-ready" : "badge-warning"}">${escapeHtml(m.status)}</span></td>
 <td class="s-JKTsUAJmov">${m.guilds.length ? m.guilds.map((g) => `<span class="vmn-badge badge-neutral s-y4qO95-ZKm" >${escapeHtml(g)}</span>`).join(" ") : "—"}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Member Registration Form -->
 <div id="register-member" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Register Community Member (UX-AFC-004)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Writes a member into the canonical AfroFusionCommunityHub (guarded mutation, create:talent).
        </p>
 <form method="POST" action="/api/v1/workspace/community/sprints" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Full Name</label>
 <input type="text" name="fullName" required placeholder="Creator full name" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Email</label>
 <input type="email" name="email" required placeholder="creator@example.com" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Membership Tier</label>
 <select name="tier" required class="s-eRsuZyv9DA">
              <option value="COMMUNITY">Community</option>
              <option value="STUDENT">Student</option>
              <option value="CREATOR">Creator</option>
              <option value="RESIDENT">Resident</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>
          <div>
 <label class="s-glAYpXXGqp">Guilds (comma-separated)</label>
 <input type="text" name="guilds" placeholder="Screenwriters, Cinematographers" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >VTM CASTING &bull; UX-VTM-003..007, 012</span>
 <h1 class="s-n_bp1PhViu">
            Talent Matching &amp; Protected Deployment Workbench
          </h1>
 <p class="s-zrikAgYqXF">
            Active Opportunity: <strong>${escapeHtml(opportunityId)}</strong>${brief ? ` — ${escapeHtml(brief.title)} (${escapeHtml(brief.roleCategory.replace(/_/g, " "))}, tier ≥ ${escapeHtml(brief.requiredTier)}, ${escapeHtml(brief.locationCity)})` : " — brief not found in the VTM engine"}
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="/portal/vtm/marketplace" class="btn btn-secondary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Back to Marketplace
          </a>
        </div>
      </div>

      ${
        !brief
          ? renderEmptyRecords(`No opportunity brief '${escapeHtml(opportunityId)}' exists in the VirtualTalentManagementEngine. Create one via POST /api/v1/hub/vtm/briefs — this workbench renders engine records only.`)
          : matches.length === 0
            ? renderEmptyRecords("No talent profiles match this brief in the registry yet — matches come from vtmEngine.matchTalent over TalentAcceleratorRegistry profiles.")
 : `<div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Algorithmically Matched Candidates (vtmEngine.matchTalent)
        </h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Candidate</th>
 <th class="s-lr_pOFE4_J">Tier</th>
 <th class="s-lr_pOFE4_J">Match %</th>
 <th class="s-lr_pOFE4_J">Governed Day Rate</th>
 <th class="s-lr_pOFE4_J">Qualification Reasons</th>
 <th class="s-gY5FUZdHNU">Action</th>
              </tr>
            </thead>
            <tbody>
              ${matches
                .map(
                  (c) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-8i5j_3VdTg">
                    ${escapeHtml(c.fullName)}
 <div class="s-VvM1U78BMi">${escapeHtml(c.talentId)}</div>
                  </td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-info">${escapeHtml(c.tier)}</span></td>
 <td class="s-6FCnPHXEyo">
 <span class="vmn-badge badge-ready s-axrwUtMWNR" >${escapeHtml(c.matchScorePercent)}% Match</span>
                  </td>
 <td class="s-_19bh8jnKf">NGN ${(c.dayRateNgn ?? 0).toLocaleString("en-NG")} / day</td>
 <td class="s-6FCnPHXEyo">
 <div class="s-96uk0pGIx0">
 ${c.qualificationReasons.slice(0, 3).map((r) => `<span class="vmn-badge badge-neutral s-y4qO95-ZKm" >${escapeHtml(r)}</span>`).join("")}
                    </div>
                  </td>
 <td class="s-Uw0RpPbWMz">
 <form method="POST" action="/api/v1/workspace/vtm/cast" class="s-Q0_DLsKcmN">
                      <input type="hidden" name="candidateId" value="${escapeHtml(c.talentId)}" />
                      <input type="hidden" name="opportunityId" value="${escapeHtml(opportunityId)}" />
 <button type="submit" class="btn btn-primary s-xJgunlT-Qo" >
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

export function renderOneStudiosProductionDeskHtml(snapshot: OneStudiosDeskSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >PRODUCTION &bull; UX-ONE-001..009</span>
 <h1 class="s-n_bp1PhViu">
            ONE Studios Production Command &amp; Call Sheet Dispatcher
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of OneStudiosEngine &bull; Gear locker, bookings &amp; call sheets
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#call-sheet" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Generate Call Sheet &rarr;
          </a>
        </div>
      </div>

      <!-- Gear Locker (canonical assets) -->
 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Production Gear Locker (UX-ONE-004)
        </h3>
        ${
          assets.length === 0
            ? renderEmptyRecords("No production assets are registered in OneStudiosEngine yet.")
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Asset Tag</th>
 <th class="s-lr_pOFE4_J">Item</th>
 <th class="s-lr_pOFE4_J">Category</th>
 <th class="s-gY5FUZdHNU">Day Rate</th>
 <th class="s-lr_pOFE4_J">Condition</th>
 <th class="s-lr_pOFE4_J">Availability</th>
              </tr>
            </thead>
            <tbody>
              ${assets
                .map(
                  (a) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-_19bh8jnKf">${escapeHtml(a.assetTag)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(a.name)}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-neutral">${escapeHtml(a.category.replace(/_/g, " "))}</span></td>
 <td class="s-ldn0EUQsLQ">NGN ${a.dailyRateNgn.toLocaleString("en-NG")}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${a.condition === "PRISTINE" || a.condition === "GOOD" ? "badge-ready" : "badge-warning"}">${escapeHtml(a.condition)}</span></td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${a.isAvailable ? "badge-ready" : "badge-warning"}">${a.isAvailable ? "AVAILABLE" : "IN USE"}</span></td>
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
 : `<div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">Active Bookings &amp; Published Call Sheets (UX-ONE-002)</h3>
        ${
          bookings.length === 0
            ? ""
 : `<div class="table-container s-oebN1UELCP" >
 <table class="s-xtFEjzqBpd">
 <thead><tr class="s-UnSdr9bWTK"><th class="s-JKTsUAJmov">Booking</th><th class="s-JKTsUAJmov">Production</th><th class="s-JKTsUAJmov">Assets</th><th class="s-JKTsUAJmov">Status</th></tr></thead>
            <tbody>
              ${bookings
                .map(
                  (b) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-TlsG8972c3">${escapeHtml(b.id)}</td>
 <td class="s-sXJ_a8BSrJ">${escapeHtml(b.productionName)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(b.assetIds.length)} asset(s)</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-info">${escapeHtml(b.status)}</span></td>
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
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-xtFEjzqBpd">
 <thead><tr class="s-UnSdr9bWTK"><th class="s-JKTsUAJmov">Call Sheet</th><th class="s-JKTsUAJmov">Production</th><th class="s-JKTsUAJmov">Shoot Date</th><th class="s-JKTsUAJmov">Call Time</th><th class="s-JKTsUAJmov">Scenes</th></tr></thead>
            <tbody>
              ${callSheets
                .map(
                  (c) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-TlsG8972c3">${escapeHtml(c.id)}</td>
 <td class="s-sXJ_a8BSrJ">${escapeHtml(c.productionName)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(c.shootDate)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(c.generalCallTime)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(c.scenesCount)} scene(s)</td>
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
 <div id="call-sheet" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Publish Digital Call Sheet (UX-ONE-002)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Publishes a call sheet into the canonical OneStudiosEngine (guarded mutation, create:talent).
        </p>
 <form method="POST" action="/api/v1/workspace/production/callsheet" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Production Name</label>
 <input type="text" name="productionName" required placeholder="e.g. Lagos Neon Chronicles S2" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Shoot Date</label>
 <input type="date" name="shootDate" required class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">General Call Time</label>
 <input type="time" name="generalCallTime" required value="06:30" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Location</label>
 <input type="text" name="location" required value="VMN ONE Studios, Soundstage A" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-1bQzQqLk7S">
 <label class="s-glAYpXXGqp">Nearest Hospital &amp; Safety Notes</label>
 <input type="text" name="nearestHospital" required value="Lagoon Hospital Lekki" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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

export function renderVcfCreatorMissionsHtml(snapshot: VcfMissionsSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >VCF FORMAT LAB &bull; UX-VCF-001..008</span>
 <h1 class="s-n_bp1PhViu">
            VCF Creator Missions &amp; Rapid Format Sprints
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of VirtualContentFundEngine &bull; Pitch pipeline &amp; active slate
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#submit-pitch" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("bolt", { size: 16 })} Submit Mission Pitch &rarr;
          </a>
        </div>
      </div>

      ${
        pitches.length === 0
          ? renderEmptyRecords("No pitches exist in the VirtualContentFundEngine yet — this desk renders canonical fund records only. Submit one below.")
 : `<div class="s-YdRO5DshrX">
        ${pitches
          .map(
            (m) => `
 <div class="vmn-card s-kgrZN_iynv" >
 <div class="s-WM6XG5HQUT">
 <span class="vmn-badge badge-info s-qTUXcN3Iww" >${escapeHtml(m.id)}</span>
              <span class="vmn-badge ${m.status === "GREENLIT" || m.status === "CONTRACTED" ? "badge-ready" : "badge-warning"}">${escapeHtml(m.status)}</span>
            </div>
 <h3 class="s-Yf9jqLUK_x">${escapeHtml(m.title)}</h3>
 <p class="s-sxiMUOYbqf">${escapeHtml(m.logline)}</p>
 <div class="s-gX_Ln-BTiX">
              <div>
 <span class="s-cebWBtjHHK">Format</span>
                <strong>${escapeHtml(m.format.replace(/_/g, " "))}</strong>
              </div>
 <div class="s-E8vgO5r8HT">
 <span class="s-cebWBtjHHK">Budget Estimate</span>
 <strong class="s-qTUXcN3Iww">NGN ${m.budgetEstimateNgn.toLocaleString("en-NG")}</strong>
              </div>
            </div>
 ${m.compositeScore !== undefined ? `<div class="s-5lRpk1R_hM">Evaluation composite: <strong>${escapeHtml(m.compositeScore)}/100</strong></div>` : ""}
 <div class="s-hLHhA2FLqE">Submitted: <strong>${escapeHtml(m.submittedAt)}</strong></div>
          </div>
        `
          )
          .join("")}
      </div>`
      }

      ${
        slate.length === 0
          ? ""
 : `<div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">Active Greenlit Slate (UX-VCF-006)</h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-xtFEjzqBpd">
 <thead><tr class="s-UnSdr9bWTK"><th class="s-JKTsUAJmov">Project</th><th class="s-JKTsUAJmov">Stage</th><th class="s-sHkXKtnkuz">Approved Budget</th><th class="s-sHkXKtnkuz">Disbursed</th></tr></thead>
            <tbody>
              ${slate
                .map(
                  (p) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-sXJ_a8BSrJ">${escapeHtml(p.title)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-info">${escapeHtml(p.stage.replace(/_/g, " "))}</span></td>
 <td class="s-WE5rq80ON-">NGN ${p.approvedBudgetNgn.toLocaleString("en-NG")}</td>
 <td class="s-WE5rq80ON-">NGN ${p.disbursedCapitalNgn.toLocaleString("en-NG")}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Pitch Submission Form -->
 <div id="submit-pitch" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Submit Commissioning Pitch (UX-VCF-004)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Writes a pitch into the canonical VirtualContentFundEngine pipeline (guarded mutation, create:talent).
        </p>
 <form method="POST" action="/api/v1/workspace/vcf/missions" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Pitch Title</label>
 <input type="text" name="title" required placeholder="e.g. Afro-SciFi 3-Minute Pilot" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Format</label>
 <select name="format" required class="s-eRsuZyv9DA">
              <option value="CREATOR_SHORT">Creator Short</option>
              <option value="EPISODIC_SERIES">Episodic Series</option>
              <option value="DOCUMENTARY">Documentary</option>
              <option value="FORMAT_REALITY">Format / Reality</option>
              <option value="FEATURE_FILM">Feature Film</option>
            </select>
          </div>
          <div>
 <label class="s-glAYpXXGqp">Budget Estimate (NGN)</label>
 <input type="number" name="budgetEstimateNgn" required min="500000" step="250000" placeholder="2500000" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Treatment Deck URL</label>
 <input type="url" name="treatmentDeckUrl" required placeholder="https://..." class="s-eRsuZyv9DA" />
          </div>
 <div class="s-1bQzQqLk7S">
 <label class="s-glAYpXXGqp">Logline</label>
 <textarea name="logline" rows="2" required placeholder="One-sentence story hook..." class="s-fpsb2azaU2"></textarea>
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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

export function renderFusionEventsDeskHtml(snapshot: FusionEventsDeskSnapshot | undefined, _user?: SessionUser): string {
  if (!isFeatureEnabled("FF_FUSION_EVENTS_OPS")) {
    return renderFeatureDisabledNotice(
      "FF_FUSION_EVENTS_OPS",
      "Fusion Events Experiential Operations (UX-EVT-001..008)",
      "/workspace"
    );
  }

  const events = snapshot?.events || [];

  return `
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >LIVE EVENTS &bull; UX-EVT-001..008</span>
 <h1 class="s-n_bp1PhViu">
            Fusion Events Stage Manager &amp; Gate Validation
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of FusionEventsEngine &bull; Live gate statistics &amp; HMAC ticket validation
          </p>
        </div>
      </div>

      ${
        events.length === 0
          ? renderEmptyRecords("No events exist in the FusionEventsEngine yet — this desk renders canonical event records only. Create one via POST /api/v1/hub/events (createEvent).")
 : `<div class="s-DHJOCS9XTL">
        ${events
          .map((e) => {
            const scanRate = e.totalSold > 0 ? Math.round((e.totalCheckedIn / e.totalSold) * 100) : 0;
            return `
 <div class="vmn-card s-kgrZN_iynv" >
 <div class="s-WM6XG5HQUT">
 <span class="vmn-badge badge-info s-qTUXcN3Iww" >${escapeHtml(e.id)}</span>
              <span class="vmn-badge badge-neutral">${escapeHtml(e.category.replace(/_/g, " "))}</span>
            </div>
 <h3 class="s-Yf9jqLUK_x">${escapeHtml(e.name)}</h3>
 <div class="s-jABXzle_lO">
              ${escapeHtml(e.venueName)}, ${escapeHtml(e.venueCity)} &bull; ${escapeHtml(e.eventDate)} &bull; Doors ${escapeHtml(e.doorsOpenTime)}
            </div>
 <div class="s-FWmtsKvycn">
              <div>
 <span class="s-cebWBtjHHK">Gate Scans Verified</span>
 <strong class="s-mTg8mhX6j2">${escapeHtml(e.totalCheckedIn)} / ${escapeHtml(e.totalSold)}</strong>
              </div>
 <div class="s-E8vgO5r8HT">
 <span class="s-cebWBtjHHK">Venue Capacity</span>
                <strong>${escapeHtml(e.capacity)}</strong>
              </div>
            </div>
 <div class="s-5lRpk1R_hM">${escapeHtml(scanRate)}% of sold tickets checked in</div>
          </div>
        `;
          })
          .join("")}
      </div>`
      }

      <!-- Quick QR Ticket Validator (real engine validation) -->
 <div class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Gate Entry QR Ticket Validation (UX-EVT-006)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Validates the ticket against FusionEventsEngine (HMAC signature + single-use check). The result is recorded truthfully — reuse and forged tickets are rejected.
        </p>
 <form method="POST" action="/api/v1/workspace/events/scan" class="s-GNTtGikGkV">
 <select name="eventId" required class="s-sWbHXyoQ0U">
            ${events.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}</option>`).join("")}
            ${events.length === 0 ? `<option value="">No events in engine</option>` : ""}
          </select>
 <input type="text" name="ticketCode" required placeholder="Ticket number, e.g. EVT-XXXXXX-…" class="s-hjveWV9WsR" />
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
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

export function renderTendRightsDistributionHtml(snapshot: TendCatalogueSnapshot | undefined, _user?: SessionUser): string {
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >TEND SYNDICATION &bull; UX-TEND-001..008</span>
 <h1 class="s-n_bp1PhViu">
            TEND B2B Rights Catalogue &amp; Territory Avails Matrix
          </h1>
 <p class="s-zrikAgYqXF">
            Canonical projection of TendDistributionEngine &bull; Avails computed from live licences
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="#register-title" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Register Catalogue Title &rarr;
          </a>
        </div>
      </div>

 <div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">
          Syndication Catalogue (TendDistributionEngine)
        </h3>
        ${
          titles.length === 0
            ? renderEmptyRecords("No titles are registered in the TendDistributionEngine catalogue yet — register the first below.")
 : `<div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-lr_pOFE4_J">Title ID</th>
 <th class="s-lr_pOFE4_J">Programme Title</th>
 <th class="s-lr_pOFE4_J">Genre</th>
 <th class="s-WWQfr0I4fx">Runtime (min)</th>
 <th class="s-gY5FUZdHNU">Min Licence Fee (USD)</th>
 <th class="s-lr_pOFE4_J">Master Delivery</th>
              </tr>
            </thead>
            <tbody>
              ${titles
                .map(
                  (t) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-p_p4UYzKzj">${escapeHtml(t.id)}</td>
 <td class="s-8i5j_3VdTg">${escapeHtml(t.title)}</td>
 <td class="s-gvP_yDU8_J">${escapeHtml(t.genre)}</td>
 <td class="s-5fSyfN0kQ1">${escapeHtml(t.runningTimeMinutes)}</td>
 <td class="s-I8HUUerhjm">$${t.minimumLicenseFeeUsd.toLocaleString("en-US")}</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge ${t.masterDeliveryStatus === "QC_APPROVED" || t.masterDeliveryStatus === "READY_FOR_DELIVERY" ? "badge-ready" : "badge-warning"}">${escapeHtml(t.masterDeliveryStatus.replace(/_/g, " "))}</span></td>
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
 : `<div class="vmn-card s-1lEgQrBXgX" >
 <h3 class="s-spyfDabz02">Active Distribution Licences (Avails Source of Truth)</h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-xtFEjzqBpd">
 <thead><tr class="s-UnSdr9bWTK"><th class="s-JKTsUAJmov">Licence</th><th class="s-JKTsUAJmov">Title</th><th class="s-JKTsUAJmov">Licensee</th><th class="s-JKTsUAJmov">Territory</th><th class="s-JKTsUAJmov">Medium</th><th class="s-JKTsUAJmov">Window</th><th class="s-JKTsUAJmov">Terms</th></tr></thead>
            <tbody>
              ${licenses
                .map(
                  (l) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-TlsG8972c3">${escapeHtml(l.id)}</td>
 <td class="s-JKTsUAJmov">${escapeHtml(l.titleId)}</td>
 <td class="s-sXJ_a8BSrJ">${escapeHtml(l.licenseeName)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-neutral">${escapeHtml(l.territory.replace(/_/g, " "))}</span></td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge badge-neutral">${escapeHtml(l.medium.replace(/_/g, " "))}</span></td>
 <td class="s-JKTsUAJmov">${escapeHtml(l.startDate)} → ${escapeHtml(l.endDate)}</td>
 <td class="s-JKTsUAJmov"><span class="vmn-badge ${l.isExclusive ? "badge-warning" : "badge-info"}">${l.isExclusive ? "EXCLUSIVE" : "NON-EXCL"}</span> <span class="vmn-badge ${l.paymentStatus === "PAID" ? "badge-ready" : "badge-warning"}">${escapeHtml(l.paymentStatus)}</span></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
      }

      <!-- Title Registration Form -->
 <div id="register-title" class="vmn-card s-JOKW7YLeUA" >
 <h3 class="s-k4BT8HxObJ">
          Register Catalogue Title (UX-TEND-002)
        </h3>
 <p class="s-i_qnuR0Wq0">
          Writes a title into the canonical TendDistributionEngine catalogue (guarded mutation, create:rights). Licence drafting with avails enforcement is available via POST /api/v1/hub/tend/licenses.
        </p>
 <form method="POST" action="/api/v1/workspace/tend/license" class="s-U3mAiGQfXk">
          <div>
 <label class="s-glAYpXXGqp">Title ID</label>
 <input type="text" name="id" required placeholder="e.g. TND-2026-004" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Programme Title</label>
 <input type="text" name="title" required placeholder="Series or feature title" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Genre</label>
 <input type="text" name="genre" required placeholder="e.g. Afro-Futurist Crime Noir" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Runtime (minutes)</label>
 <input type="number" name="runningTimeMinutes" required min="1" placeholder="45" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Original Language</label>
 <input type="text" name="originalLanguage" required value="English" class="s-eRsuZyv9DA" />
          </div>
          <div>
 <label class="s-glAYpXXGqp">Min Licence Fee (USD)</label>
 <input type="number" name="minimumLicenseFeeUsd" required min="1000" placeholder="50000" class="s-eRsuZyv9DA" />
          </div>
 <div class="s-Rt7hql7QwU">
 <button type="submit" class="btn btn-primary s-IA9-EU7SCj" >
              ${renderIcon("check", { size: 16 })} Register Title
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}
