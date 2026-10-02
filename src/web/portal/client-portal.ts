/**
 * S-CLIENT Counterparty & Client Portal (UX-PRJ-002, UX-COM-010, UX-POR-002)
 * Authority: VMN APP UI UX.docx §8.4 / VMN UI UX CLAUDE CODE PROMPTS .docx S-CLIENT / J-RL1-07
 *
 * Implements:
 * - UX-PRJ-002: Client Project Identity & Approved Commercial Scope
 * - UX-COM-010: Delivery Commitments Table (deliverable, due date, delivery state, released supporting proof)
 * - UX-POR-002: Released Proof-of-Performance & Transmission Certificates
 * - Dispute / Question Submission Form (POST /api/v1/client/projects/:projectId/questions)
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";

export interface ClientCommitment {
  id: string;
  deliverable: string;
  channel: string;
  daypart: string;
  flightRange: string;
  scheduledRuns: number;
  deliveredRuns: number;
  deliveryState: "RELEASED" | "SCHEDULED" | "IN_PROGRESS" | "MAKE_GOOD_REQUIRED";
  proofCertificateId?: string;
  lastAsRunTimestamp?: string;
}

export interface ReleasedProofReport {
  id: string;
  certificateNumber: string;
  asRunTimestamp: string;
  channel: string;
  spotTitle: string;
  durationSeconds: number;
  carrier: string;
  complianceSignature: string;
  verified: boolean;
}

export interface ClientProject {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  commercialRef: string;
  status: "ACTIVE" | "COMPLETED" | "IN_RECONCILIATION";
  contractValueNgn: number;
  flightStart: string;
  flightEnd: string;
  accountExec: string;
  commitments: ClientCommitment[];
  releasedProofs: ReleasedProofReport[];
}

export const MOCK_CLIENT_PROJECTS: Record<string, ClientProject> = {
  "PRJ-VMN-2026-088": {
    id: "PRJ-VMN-2026-088",
    orgId: "org-dangote",
    orgName: "Dangote Group Holdings",
    title: "Q3 2026 Pan-African Industrial Awareness Campaign",
    commercialRef: "COMM-DAG-8842",
    status: "ACTIVE",
    contractValueNgn: 45000000,
    flightStart: "2026-09-01",
    flightEnd: "2026-10-31",
    accountExec: "Chidinma Nwosu (Senior Commercial Director)",
    commitments: [
      {
        id: "COM-001",
        deliverable: "30s Prime Time Spot (News at 8PM)",
        channel: "VMN News 24 (StarTimes 112)",
        daypart: "Prime 20:00 - 21:00",
        flightRange: "01 Sep - 30 Sep 2026",
        scheduledRuns: 60,
        deliveredRuns: 58,
        deliveryState: "RELEASED",
        proofCertificateId: "CERT-TX-2026-09228",
        lastAsRunTimestamp: "2026-09-29T20:14:32Z",
      },
      {
        id: "COM-002",
        deliverable: "15s Sports Squeeze-Back In-Game",
        channel: "VMN Sports HD (StarTimes 240)",
        daypart: "Live Match Live-Action",
        flightRange: "10 Sep - 25 Oct 2026",
        scheduledRuns: 24,
        deliveredRuns: 20,
        deliveryState: "IN_PROGRESS",
        proofCertificateId: "CERT-TX-2026-09241",
        lastAsRunTimestamp: "2026-09-28T16:45:10Z",
      },
      {
        id: "COM-003",
        deliverable: "Co-Sponsorship Ident (Morning Africa)",
        channel: "VMN General Entertainment",
        daypart: "Morning 07:00 - 09:00",
        flightRange: "01 Oct - 31 Oct 2026",
        scheduledRuns: 30,
        deliveredRuns: 0,
        deliveryState: "SCHEDULED",
      },
      {
        id: "COM-004",
        deliverable: "Late Night Financial Bulletin Crawler",
        channel: "VMN News 24 (StarTimes 112)",
        daypart: "Late 22:30 - 23:00",
        flightRange: "15 Sep - 20 Sep 2026",
        scheduledRuns: 10,
        deliveredRuns: 8,
        deliveryState: "MAKE_GOOD_REQUIRED",
        proofCertificateId: "CERT-TX-2026-09199",
        lastAsRunTimestamp: "2026-09-20T22:45:00Z",
      },
    ],
    releasedProofs: [
      {
        id: "PRF-001",
        certificateNumber: "CERT-TX-2026-09228",
        asRunTimestamp: "2026-09-29T20:14:32+01:00",
        channel: "VMN News 24 (StarTimes 112)",
        spotTitle: "Dangote Cement - Building the Continent (30s)",
        durationSeconds: 30,
        carrier: "Eutelsat 16A Ku-Band DTT Downlink",
        complianceSignature: "SHA256:d8a4f9104c9e830b1e4f9b8c0a82b992147",
        verified: true,
      },
      {
        id: "PRF-002",
        certificateNumber: "CERT-TX-2026-09241",
        asRunTimestamp: "2026-09-28T16:45:10+01:00",
        channel: "VMN Sports HD (StarTimes 240)",
        spotTitle: "Dangote Fertiliser - Harvest Wealth Squeeze (15s)",
        durationSeconds: 15,
        carrier: "StarTimes Multiplex Transponder 4",
        complianceSignature: "SHA256:7bc902fa438012bbec30291df994a0081e2",
        verified: true,
      },
      {
        id: "PRF-003",
        certificateNumber: "CERT-TX-2026-09199",
        asRunTimestamp: "2026-09-20T22:45:00+01:00",
        channel: "VMN News 24 (StarTimes 112)",
        spotTitle: "Dangote Refinery - Energy for Africa Crawler",
        durationSeconds: 20,
        carrier: "Eutelsat 16A Ku-Band DTT Downlink",
        complianceSignature: "SHA256:1a8fe99023c9a174092b34a9d01247fa10c",
        verified: true,
      },
    ],
  },
};

/**
 * Renders the Organisation Projects Overview (UX-POR-001)
 */
export function renderClientProjectsListHtml(orgId: string, projects: ClientProject[]): string {
  const orgName = projects[0]?.orgName || "Client Enterprise";

  return `
    <div style="max-width: 1040px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">COUNTERPARTY PORTAL &bull; S-CLIENT</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">
            ${escapeHtml(orgName)} &bull; Commercial Campaigns
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Inspect transmission proof-of-performance, delivery certificates, and active broadcast schedules.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/portal/client/organisations/${escapeHtml(orgId)}/projects/PRJ-VMN-2026-088" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Active Campaign
          </a>
        </div>
      </div>

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 16px; font-weight: 700;">Campaign Title</th>
              <th style="padding: 12px 16px; font-weight: 700;">Contract Ref</th>
              <th style="padding: 12px 16px; font-weight: 700;">Flight Dates</th>
              <th style="padding: 12px 16px; font-weight: 700;">Contract Value</th>
              <th style="padding: 12px 16px; font-weight: 700;">Status</th>
              <th style="padding: 12px 16px; font-weight: 700; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${projects
              .map(
                (p) => `
              <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                <td style="padding: 14px 16px; font-weight: 700; color: var(--vmn-color-primary-text);">
                  ${escapeHtml(p.title)}
                </td>
                <td style="padding: 14px 16px; font-family: monospace; color: var(--vmn-color-secondary-text);">
                  ${escapeHtml(p.commercialRef)}
                </td>
                <td style="padding: 14px 16px; color: var(--vmn-color-secondary-text);">
                  ${escapeHtml(p.flightStart)} &rarr; ${escapeHtml(p.flightEnd)}
                </td>
                <td style="padding: 14px 16px; font-weight: 700; color: var(--vmn-color-primary-text);">
                  &#8358;${p.contractValueNgn.toLocaleString()}
                </td>
                <td style="padding: 14px 16px;">
                  <span class="vmn-badge ${p.status === "ACTIVE" ? "badge-success" : p.status === "COMPLETED" ? "badge-neutral" : "badge-warning"}">
                    ${escapeHtml(p.status)}
                  </span>
                </td>
                <td style="padding: 14px 16px; text-align: right;">
                  <a href="/portal/client/organisations/${escapeHtml(orgId)}/projects/${escapeHtml(p.id)}" class="btn btn-outline" style="min-height: 44px; padding: 0 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                    ${renderIcon("document", { size: 14 })} View Proof &amp; Scope
                  </a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * UX-PRJ-002, UX-COM-010, UX-POR-002:
 * Project Identity, Scope Summary, Delivery Commitments, Proof Viewer, and Question Form
 */
export function renderClientProjectDetailHtml(project: ClientProject, successNotice?: string): string {
  const totalScheduled = project.commitments.reduce((acc, c) => acc + c.scheduledRuns, 0);
  const totalDelivered = project.commitments.reduce((acc, c) => acc + c.deliveredRuns, 0);
  const deliveryPercentage = Math.round((totalDelivered / (totalScheduled || 1)) * 100);

  return `
    <div style="max-width: 1040px; margin: 32px auto; padding: 0 16px;">
      <!-- Breadcrumb Navigation -->
      <nav style="display: flex; gap: 8px; align-items: center; font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin-bottom: 16px;">
        <a href="/portal/client/organisations/${escapeHtml(project.orgId)}/projects" style="color: var(--vmn-color-text-muted); text-decoration: none;">
          ${escapeHtml(project.orgName)}
        </a>
        <span>/</span>
        <span style="color: var(--vmn-color-primary-text); font-weight: 600;">${escapeHtml(project.id)}</span>
      </nav>

      ${
        successNotice
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Transmission Inquiry Logged Successfully</div>
            <div style="font-size: 0.85rem; color: #047857;">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

      <!-- Header & Identity (UX-PRJ-002) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 28px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="vmn-badge badge-info">PROJECT &bull; UX-PRJ-002</span>
              <span class="vmn-badge ${project.status === "ACTIVE" ? "badge-success" : "badge-warning"}">${escapeHtml(project.status)}</span>
            </div>
            <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
              ${escapeHtml(project.title)}
            </h1>
            <div style="font-size: 0.9rem; color: var(--vmn-color-secondary-text);">
              Client: <strong>${escapeHtml(project.orgName)}</strong> &bull; Commercial Booking: <code>${escapeHtml(project.commercialRef)}</code>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Approved Scope Value</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-primary-text);">
              &#8358;${project.contractValueNgn.toLocaleString()}
            </div>
            <div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text);">Flight: ${escapeHtml(project.flightStart)} &rarr; ${escapeHtml(project.flightEnd)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--vmn-color-border);">
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Account Executive</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text); font-size: 0.9rem;">${escapeHtml(project.accountExec)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Spots Completed</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text); font-size: 0.9rem;">${totalDelivered} of ${totalScheduled} spots (${deliveryPercentage}%)</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted); text-transform: uppercase; font-weight: 700;">Released As-Run Proofs</div>
            <div style="font-weight: 600; color: var(--vmn-color-primary-text); font-size: 0.9rem;">${project.releasedProofs.length} Certificates Available</div>
          </div>
        </div>
      </div>

      <!-- Commitments Table (UX-COM-010) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <span class="vmn-badge badge-neutral" style="margin-bottom: 4px; font-weight: 700;">DELIVERY COMMITMENTS &bull; UX-COM-010</span>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0;">
              Contracted Broadcast Commitments &amp; Flight Status
            </h2>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
            <thead>
              <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
                <th style="padding: 10px 12px; font-weight: 700;">Deliverable</th>
                <th style="padding: 10px 12px; font-weight: 700;">Target Channel / Daypart</th>
                <th style="padding: 10px 12px; font-weight: 700;">Flight Range</th>
                <th style="padding: 10px 12px; font-weight: 700; text-align: center;">Runs (Done/Goal)</th>
                <th style="padding: 10px 12px; font-weight: 700;">State</th>
                <th style="padding: 10px 12px; font-weight: 700;">Supporting Proof</th>
              </tr>
            </thead>
            <tbody>
              ${project.commitments
                .map(
                  (c) => `
                <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                  <td style="padding: 12px; font-weight: 600; color: var(--vmn-color-primary-text);">
                    ${escapeHtml(c.deliverable)}
                  </td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text);">
                    <div>${escapeHtml(c.channel)}</div>
                    <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">${escapeHtml(c.daypart)}</div>
                  </td>
                  <td style="padding: 12px; color: var(--vmn-color-secondary-text); font-size: 0.8rem;">
                    ${escapeHtml(c.flightRange)}
                  </td>
                  <td style="padding: 12px; text-align: center; font-weight: 700;">
                    ${c.deliveredRuns} / ${c.scheduledRuns}
                  </td>
                  <td style="padding: 12px;">
                    <span class="vmn-badge ${
                      c.deliveryState === "RELEASED"
                        ? "badge-success"
                        : c.deliveryState === "IN_PROGRESS"
                        ? "badge-info"
                        : c.deliveryState === "MAKE_GOOD_REQUIRED"
                        ? "badge-warning"
                        : "badge-neutral"
                    }">
                      ${escapeHtml(c.deliveryState)}
                    </span>
                  </td>
                  <td style="padding: 12px;">
                    ${
                      c.proofCertificateId
                        ? `
                      <a href="#proof-${escapeHtml(c.proofCertificateId)}" style="color: var(--vmn-color-primary); font-family: monospace; font-size: 0.8rem; font-weight: 600;">
                        ${escapeHtml(c.proofCertificateId)}
                      </a>
                    `
                        : `<span style="color: var(--vmn-color-text-muted); font-size: 0.8rem;">Pending Broadcast</span>`
                    }
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Released Proof Reports Viewer (UX-POR-002) -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px; margin-bottom: 24px;" id="proof-viewer">
        <span class="vmn-badge badge-success" style="margin-bottom: 4px; font-weight: 700;">PROOF OF AIR &bull; UX-POR-002</span>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 16px 0;">
          Released Playout Proof &amp; Transmission Certificates
        </h2>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${project.releasedProofs
            .map(
              (p) => `
            <div id="proof-${escapeHtml(p.certificateNumber)}" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 16px; background: var(--vmn-color-background);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 800; color: var(--vmn-color-primary-text); font-size: 0.95rem;">${escapeHtml(p.spotTitle)}</span>
                    <span class="vmn-badge badge-success">${renderIcon("check", { size: 12 })} VERIFIED AIRPLAY</span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">
                    Certificate ID: <strong style="font-family: monospace;">${escapeHtml(p.certificateNumber)}</strong> &bull; Carrier: ${escapeHtml(p.carrier)}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--vmn-color-primary-text);">
                    Airtime: ${escapeHtml(new Date(p.asRunTimestamp).toUTCString())}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--vmn-color-text-muted);">Duration: ${p.durationSeconds}s &bull; Channel: ${escapeHtml(p.channel)}</div>
                </div>
              </div>
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed var(--vmn-color-border); font-size: 0.75rem; font-family: monospace; color: var(--vmn-color-secondary-text); word-break: break-all;">
                Cryptographic Playout Hash: ${escapeHtml(p.complianceSignature)}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Question / Dispute Submission Form -->
      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 24px;">
        <span class="vmn-badge badge-neutral" style="margin-bottom: 4px; font-weight: 700;">COUNTERPARTY SUPPORT</span>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">
          Submit Inquiry or Discrepancy Notice
        </h2>
        <p style="color: var(--vmn-color-secondary-text); font-size: 0.9rem; margin: 0 0 20px 0;">
          Direct communication with the Voice of Nigeria Commercial Traffic Desk and Transmission Officers.
        </p>

        <form method="POST" action="/api/v1/client/projects/${escapeHtml(project.id)}/questions" style="display: flex; flex-direction: column; gap: 16px;">
          <input type="hidden" name="orgId" value="${escapeHtml(project.orgId)}" />

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            <div class="vmn-form-field">
              <label for="q-topic" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Inquiry Category <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <select
                id="q-topic"
                name="topic"
                required
                class="vmn-input"
                style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              >
                <option value="PROOF_VERIFICATION">Proof-of-Air Verification Query</option>
                <option value="MAKE_GOOD_DISCREPANCY">Discrepancy / Make-Good Scheduling</option>
                <option value="DAYPART_TIMING">Daypart / Broadcast Timing Question</option>
                <option value="BILLING_LEDGER">Billing &amp; Commercial Invoicing</option>
                <option value="OTHER">General Commercial Inquiries</option>
              </select>
            </div>

            <div class="vmn-form-field">
              <label for="q-priority" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Urgency Level <span style="color: #DC2626;" aria-hidden="true">*</span>
              </label>
              <select
                id="q-priority"
                name="priority"
                required
                class="vmn-input"
                style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
              >
                <option value="NORMAL">Standard Review (Within 24 Hours)</option>
                <option value="URGENT">High Priority (Active Flight Issue)</option>
                <option value="CRITICAL">Critical Pre-Broadcast Blocker</option>
              </select>
            </div>
          </div>

          <div class="vmn-form-field">
            <label for="q-email" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Contact Email for Response <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="q-email"
              name="contactEmail"
              type="email"
              required
              placeholder="e.g. media-audit@dangote.com"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="q-message" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Message / Discrepancy Details <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <textarea
              id="q-message"
              name="message"
              required
              rows="4"
              placeholder="Reference the certificate number, airtime stamp, or make-good spot requirement..."
              class="vmn-input"
              style="width: 100%; padding: 10px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="min-height: 46px; font-weight: 700; width: fit-content; padding: 0 24px; cursor: pointer;">
            Transmit Inquiry to Commercial Traffic
          </button>
        </form>
      </div>
    </div>
  `;
}
