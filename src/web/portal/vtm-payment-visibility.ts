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

export function renderVtmPaymentVisibilityHtml(projection: VtmPaymentVisibilityProjection, _user?: SessionUser): string {
  const summaryCards = `
 <div class="s-sRpO5MaMLv">
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Contracts</div>
 <div class="s-vu7vwqr--r">${escapeHtml(projection.summary.contracts)}</div>
 <div class="s-wUMD0XWoZI">${escapeHtml(projection.summary.deployable)} deployable · ${escapeHtml(projection.summary.blocked)} blocked · ${escapeHtml(projection.summary.reviewRequired)} review</div>
      </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Escrow Held (restricted)</div>
 <div class="s-vu7vwqr--r">${formatNgn(projection.summary.escrowHeldNgn)}</div>
      </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Talent Payable (disbursed)</div>
 <div class="s-Am3eRxce65">${formatNgn(projection.summary.talentDisbursedNgn)}</div>
      </div>
 <div class="vmn-card s-Ur9k9UL2FN" >
 <div class="s-cU3Cr5m8eq">Platform Commission</div>
 <div class="s-vu7vwqr--r">${formatNgn(projection.summary.platformCommissionNgn)}</div>
      </div>
    </div>`;

  const contractSections =
    projection.contracts.length === 0
 ? `<div class="vmn-card s-Cs0JleIJbl" ><p class="s-74eGsJhV6B">No VTM contracts exist yet. Payment visibility projects the canonical contract engine — create a contract through the VTM workbench.</p></div>`
      : projection.contracts
          .map(
            (c) => `
 <div class="vmn-card s-QTA1yfp9QZ" >
 <div class="s-zw5ShTxO9V">
 <h2 class="s-2to96tsOZe">${escapeHtml(c.contractNumber)} — Talent ${escapeHtml(c.talentId)} / Client ${escapeHtml(c.clientId)}</h2>
          <span class="vmn-badge ${c.readinessState === "DEPLOYABLE" ? "badge-ready" : c.readinessState === "BLOCKED" ? "badge-danger" : "badge-warning"}">READINESS: ${escapeHtml(c.readinessState)}</span>
        </div>
 <div class="s-0B57PT0_Oz">
          Contract value ${formatNgn(c.totalValueNgn)} · Escrow held ${formatNgn(c.escrowHeldNgn)} · Talent payable ${formatNgn(c.talentDisbursedNgn)} · Platform commission ${formatNgn(c.platformCommissionNgn)} — measures are distinct per 7-way separation and never aggregate into a single "revenue" figure.
        </div>

 <h3 class="s-X2NvgWZrxX">Deployment Readiness Gates</h3>
 <div class="s-3qncqMwH8R">
          ${c.gates
            .map(
              (g) => `
 <div class="s-_z5x8vd6M8">
 <div class="s-wrzqCFgz1Y">
 <span class="s-OAVpd553dT">${escapeHtml(g.gate.replace(/_/g, " "))}</span>
              <span class="vmn-badge ${g.status === "SATISFIED" ? "badge-ready" : g.status === "OPEN" ? "badge-danger" : "badge-warning"}">${escapeHtml(g.status)}</span>
            </div>
 <div class="s--pYpvxyCah">${escapeHtml(g.note)}</div>
          </div>`
            )
            .join("")}
        </div>

 <h3 class="s-X2NvgWZrxX">Milestone Escrow & Payment Status</h3>
 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-yaXxTqlt-j">
            <thead>
 <tr class="s-UnSdr9bWTK">
 <th class="s-JKTsUAJmov">Milestone</th>
 <th class="s-JKTsUAJmov">Value</th>
 <th class="s-JKTsUAJmov">Escrow Status</th>
 <th class="s-JKTsUAJmov">Talent Payable</th>
 <th class="s-JKTsUAJmov">Platform Commission</th>
 <th class="s-JKTsUAJmov">Escrowed Since</th>
              </tr>
            </thead>
            <tbody>
              ${c.milestones
                .map(
                  (m) => `
 <tr class="s-EK6K8Vq5tY">
 <td class="s-sXJ_a8BSrJ">${escapeHtml(m.title)}</td>
 <td class="s-JKTsUAJmov">${formatNgn(m.amountNgn)}</td>
 <td class="s-JKTsUAJmov">${escrowStatusBadge(m.escrowStatus)}</td>
 <td class="s-JKTsUAJmov">${m.talentDisbursedAmountNgn > 0 ? formatNgn(m.talentDisbursedAmountNgn) : "—"}</td>
 <td class="s-JKTsUAJmov">${m.platformCommissionNgn > 0 ? formatNgn(m.platformCommissionNgn) : "—"}</td>
 <td class="s-vE8Thx0uW0">${m.escrowDepositedAt ? escapeHtml(m.escrowDepositedAt.substring(0, 10)) : "—"}</td>
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
 <div class="s-Llwj6EPzTQ">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-ready s-Dnmmv3HPR8" >Talent Contracts &amp; Payout Visibility <span class="sr-only">&bull; UX-VTM-010 / UX-VTM-011</span></span>
 <h1 class="s-Eg3nXwYpcj">Deployment Readiness &amp; Payment Visibility</h1>
 <p class="s-zrikAgYqXF">
          Projects the canonical VTM contract engine: readiness gates (execution, identity verification, escrow protection, rights clearance) and per-milestone escrow/payment state labelled per the 7-way financial separation. No amount on this page is consolidated revenue.
        </p>
      </div>
      ${summaryCards}
      ${contractSections}
    </div>
  `;
}
