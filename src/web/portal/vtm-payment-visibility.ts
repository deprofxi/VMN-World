/**
 * VTM Deployment Readiness & Payment Visibility — TODO-SCR-20 (UX-VTM-010/011)
 *
 * UX-VTM-011 (Payment Visibility): projects the canonical VirtualTalentManagementEngine
 * contract state with money labelled per the 7-way financial separation (canonical
 * law 7: internal allocations never inflate consolidated external revenue; §18
 * escrow held as restricted funds until dual-control release).
 *
 * UX-VTM-010 (Deployment Readiness): a readiness checklist projection per
 * contract — contract execution (dual signature), identity verification,
 * escrow protection, and rights clearance. Rights clearance is deliberately
 * reported as REVIEW_REQUIRED from this surface: VTM holds no rights truth
 * (canonical law 4 — one rights truth; law 8 — no clearance, no exploitation),
 * so the operator is directed to the canonical rights register.
 */

import { escapeHtml } from "../components/escape.js";
import { VirtualTalentManagementEngine, VtmContract, EscrowStatus } from "../../modules/hub/vtm/index.js";
import { SessionUser } from "../../core/auth/index.js";

export interface VtmMilestonePaymentView {
  id: string;
  title: string;
  amountNgn: number;
  escrowStatus: EscrowStatus;
  escrowDepositedAt?: string;
  talentDisbursedAmountNgn: number;
  platformCommissionNgn: number;
}

export interface VtmContractPaymentView {
  contractId: string;
  contractNumber: string;
  talentId: string;
  clientId: string;
  totalValueNgn: number;
  isFullySigned: boolean;
  identityVerified: boolean;
  gates: Array<{ gate: string; status: "SATISFIED" | "OPEN" | "REVIEW_REQUIRED"; note: string }>;
  readinessState: "DEPLOYABLE" | "BLOCKED" | "REVIEW_REQUIRED";
  escrowHeldNgn: number;
  escrowReleasedNgn: number;
  awaitingEscrowNgn: number;
  talentDisbursedNgn: number;
  platformCommissionNgn: number;
  milestones: VtmMilestonePaymentView[];
}

export interface VtmPaymentVisibilityProjection {
  contracts: VtmContractPaymentView[];
  summary: {
    contracts: number;
    deployable: number;
    blocked: number;
    reviewRequired: number;
    escrowHeldNgn: number;
    talentDisbursedNgn: number;
    platformCommissionNgn: number;
  };
}

const ESCROW_HELD_STATUSES: EscrowStatus[] = ["FUNDS_ESCROWED", "MILESTONE_SUBMITTED", "DISPUTED"];

function formatNgn(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function projectVtmPaymentVisibility(engine: VirtualTalentManagementEngine): VtmPaymentVisibilityProjection {
  const contracts: VtmContractPaymentView[] = engine.listContracts().map((c: VtmContract) => {
    const milestones: VtmMilestonePaymentView[] = c.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      amountNgn: m.amountNgn,
      escrowStatus: m.status,
      escrowDepositedAt: m.escrowDepositedAt?.toISOString(),
      talentDisbursedAmountNgn: m.talentDisbursedAmountNgn ?? 0,
      platformCommissionNgn: m.platformCommissionNgn ?? 0,
    }));

    const escrowHeldNgn = c.milestones
      .filter((m) => ESCROW_HELD_STATUSES.includes(m.status))
      .reduce((s, m) => s + m.amountNgn, 0);
    const escrowReleasedNgn = c.milestones
      .filter((m) => m.status === "APPROVED_RELEASED")
      .reduce((s, m) => s + m.amountNgn, 0);
    const awaitingEscrowNgn = c.milestones
      .filter((m) => m.status === "PENDING_DEPOSIT")
      .reduce((s, m) => s + m.amountNgn, 0);
    const talentDisbursedNgn = c.milestones.reduce((s, m) => s + (m.talentDisbursedAmountNgn ?? 0), 0);
    const platformCommissionNgn = c.milestones.reduce((s, m) => s + (m.platformCommissionNgn ?? 0), 0);
    const identityVerified = Boolean(engine.getRateCard(c.talentId)?.isVerified);

    const gates: VtmContractPaymentView["gates"] = [
      {
        gate: "CONTRACT_EXECUTION",
        status: c.isFullySigned ? "SATISFIED" : "OPEN",
        note: c.isFullySigned ? "Talent and client signatures recorded (UX-VTM-010 seal)." : "Awaiting dual signature — escrow deposit is blocked until fully signed.",
      },
      {
        gate: "IDENTITY_VERIFICATION",
        status: identityVerified ? "SATISFIED" : "OPEN",
        note: identityVerified ? "Talent rate card verified." : "Talent not verified in the VTM registry — deployment blocked.",
      },
      {
        gate: "ESCROW_PROTECTION",
        status: c.milestones.length === 0 || awaitingEscrowNgn > 0 ? "OPEN" : "SATISFIED",
        note:
          c.milestones.length === 0
            ? "No milestones defined — define milestone schedule before deployment."
            : awaitingEscrowNgn > 0
              ? `${formatNgn(awaitingEscrowNgn)} of milestone value is not yet escrowed (no payment protection — canonical law 9).`
              : "All milestone value held or released through escrow.",
      },
      {
        gate: "RIGHTS_CLEARANCE",
        status: "REVIEW_REQUIRED",
        note: "VTM holds no rights truth. Confirm the rights register clearance for the engagement window/territory before any exploitation (canonical laws 4 & 8).",
      },
    ];

    const readinessState: VtmContractPaymentView["readinessState"] = gates.some((g) => g.status === "OPEN")
      ? "BLOCKED"
      : gates.some((g) => g.status === "REVIEW_REQUIRED")
        ? "REVIEW_REQUIRED"
        : "DEPLOYABLE";

    return {
      contractId: c.id,
      contractNumber: c.contractNumber,
      talentId: c.talentId,
      clientId: c.clientId,
      totalValueNgn: c.totalValueNgn,
      isFullySigned: c.isFullySigned,
      identityVerified,
      gates,
      readinessState,
      escrowHeldNgn,
      escrowReleasedNgn,
      awaitingEscrowNgn,
      talentDisbursedNgn,
      platformCommissionNgn,
      milestones,
    };
  });

  return {
    contracts,
    summary: {
      contracts: contracts.length,
      deployable: contracts.filter((c) => c.readinessState === "DEPLOYABLE").length,
      blocked: contracts.filter((c) => c.readinessState === "BLOCKED").length,
      reviewRequired: contracts.filter((c) => c.readinessState === "REVIEW_REQUIRED").length,
      escrowHeldNgn: contracts.reduce((s, c) => s + c.escrowHeldNgn, 0),
      talentDisbursedNgn: contracts.reduce((s, c) => s + c.talentDisbursedNgn, 0),
      platformCommissionNgn: contracts.reduce((s, c) => s + c.platformCommissionNgn, 0),
    },
  };
}

function escrowStatusBadge(status: EscrowStatus): string {
  const cls =
    status === "APPROVED_RELEASED"
      ? "badge-ready"
      : status === "PENDING_DEPOSIT"
        ? "badge-warning"
        : status === "DISPUTED"
          ? "badge-danger"
          : "badge-neutral";
  return `<span class="vmn-badge ${cls}">${escapeHtml(status.replace(/_/g, " "))}</span>`;
}

export function renderVtmPaymentVisibilityHtml(projection: VtmPaymentVisibilityProjection, user?: SessionUser): string {
  const summaryCards = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
        <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Contracts</div>
        <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${projection.summary.contracts}</div>
        <div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${projection.summary.deployable} deployable · ${projection.summary.blocked} blocked · ${projection.summary.reviewRequired} review</div>
      </div>
      <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
        <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Escrow Held (restricted)</div>
        <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${formatNgn(projection.summary.escrowHeldNgn)}</div>
      </div>
      <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
        <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Talent Payable (disbursed)</div>
        <div style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-color-ready); margin-top: 4px;">${formatNgn(projection.summary.talentDisbursedNgn)}</div>
      </div>
      <div class="vmn-card" style="padding: 16px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);">
        <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); font-weight: 600;">Platform Commission</div>
        <div style="font-size: 1.5rem; font-weight: 800; margin-top: 4px;">${formatNgn(projection.summary.platformCommissionNgn)}</div>
      </div>
    </div>`;

  const contractSections =
    projection.contracts.length === 0
      ? `<div class="vmn-card" style="padding: 24px;"><p style="color: var(--vmn-color-secondary-text); margin: 0;">No VTM contracts exist yet. Payment visibility projects the canonical contract engine — create a contract through the VTM workbench.</p></div>`
      : projection.contracts
          .map(
            (c) => `
      <div class="vmn-card" style="padding: 24px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; align-items: baseline;">
          <h2 style="font-size: 1.05rem; font-weight: 800; margin: 0;">${escapeHtml(c.contractNumber)} — Talent ${escapeHtml(c.talentId)} / Client ${escapeHtml(c.clientId)}</h2>
          <span class="vmn-badge ${c.readinessState === "DEPLOYABLE" ? "badge-ready" : c.readinessState === "BLOCKED" ? "badge-danger" : "badge-warning"}">READINESS: ${c.readinessState}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text); margin: 6px 0 14px 0;">
          Contract value ${formatNgn(c.totalValueNgn)} · Escrow held ${formatNgn(c.escrowHeldNgn)} · Talent payable ${formatNgn(c.talentDisbursedNgn)} · Platform commission ${formatNgn(c.platformCommissionNgn)} — measures are distinct per 7-way separation and never aggregate into a single "revenue" figure.
        </div>

        <h3 style="font-size: 0.9rem; font-weight: 700; margin: 0 0 8px 0;">Deployment Readiness Gates</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-bottom: 18px;">
          ${c.gates
            .map(
              (g) => `
          <div style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md); padding: 10px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 0.8rem;">${escapeHtml(g.gate.replace(/_/g, " "))}</span>
              <span class="vmn-badge ${g.status === "SATISFIED" ? "badge-ready" : g.status === "OPEN" ? "badge-danger" : "badge-warning"}">${g.status}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--vmn-color-secondary-text); margin-top: 4px;">${escapeHtml(g.note)}</div>
          </div>`
            )
            .join("")}
        </div>

        <h3 style="font-size: 0.9rem; font-weight: 700; margin: 0 0 8px 0;">Milestone Escrow & Payment Status</h3>
        <div class="table-container" style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--vmn-color-border); color: var(--vmn-color-secondary-text);">
                <th style="padding: 8px 10px;">Milestone</th>
                <th style="padding: 8px 10px;">Value</th>
                <th style="padding: 8px 10px;">Escrow Status</th>
                <th style="padding: 8px 10px;">Talent Payable</th>
                <th style="padding: 8px 10px;">Platform Commission</th>
                <th style="padding: 8px 10px;">Escrowed Since</th>
              </tr>
            </thead>
            <tbody>
              ${c.milestones
                .map(
                  (m) => `
              <tr style="border-bottom: 1px solid var(--vmn-color-border);">
                <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(m.title)}</td>
                <td style="padding: 8px 10px;">${formatNgn(m.amountNgn)}</td>
                <td style="padding: 8px 10px;">${escrowStatusBadge(m.escrowStatus)}</td>
                <td style="padding: 8px 10px;">${m.talentDisbursedAmountNgn > 0 ? formatNgn(m.talentDisbursedAmountNgn) : "—"}</td>
                <td style="padding: 8px 10px;">${m.platformCommissionNgn > 0 ? formatNgn(m.platformCommissionNgn) : "—"}</td>
                <td style="padding: 8px 10px; font-family: monospace; font-size: 0.72rem;">${m.escrowDepositedAt ? escapeHtml(m.escrowDepositedAt.substring(0, 10)) : "—"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`
          )
          .join("");

  return `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-ready" style="margin-bottom: 8px; font-weight: 700;">VTM &bull; UX-VTM-010 / UX-VTM-011</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 8px 0 6px 0;">Deployment Readiness &amp; Payment Visibility</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
          Projects the canonical VTM contract engine: readiness gates (execution, identity verification, escrow protection, rights clearance) and per-milestone escrow/payment state labelled per the 7-way financial separation. No amount on this page is consolidated revenue.
        </p>
      </div>
      ${summaryCards}
      ${contractSections}
    </div>
  `;
}
