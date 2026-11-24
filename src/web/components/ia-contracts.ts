/**
 * VMN World IA R1.1 — Reusable Component Contracts (CMP-011 to CMP-048)
 * Authority: VMNL-AZP-VMN-IA-001 — R1.1 / docs/authorities/ia/VMN_World_IA_R1.1_Complete_Screen_Architecture.md
 */

import { html, type SafeHtml } from "./escape.js";

/** CMP-011: Privacy and consent ledger panel */
export function privacyConsentLedger(props: {
  subjectId: string;
  purposes: Array<{
    purpose: string;
    basis: "CONSENT" | "CONTRACT" | "LEGAL_OBLIGATION" | "LEGITIMATE_INTEREST";
    granted: boolean;
    effectiveDate: string;
    retentionDays: number;
  }>;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-011">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-bold">Privacy & Consent Ledger</h3>
      <span class="badge badge-info text-xs">Subject: <code>${props.subjectId}</code></span>
    </div>
    <p class="text-xs text-muted mb-3">Governs explicit processing consent and lawful bases under NDPR / GDPR. Cast consent and Plus consent are held strictly separate.</p>
    <div class="table-responsive">
      <table class="table w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left py-2">Processing Purpose</th>
            <th class="text-left py-2">Lawful Basis</th>
            <th class="text-left py-2">Status</th>
            <th class="text-left py-2">Effective Date</th>
            <th class="text-right py-2">Retention</th>
          </tr>
        </thead>
        <tbody>
          ${props.purposes.map(
            (p) => html`<tr class="border-b border-border">
              <td class="py-2"><strong>${p.purpose}</strong></td>
              <td class="py-2"><span class="badge text-xs">${p.basis}</span></td>
              <td class="py-2">
                <span class="badge ${p.granted ? "badge-success" : "badge-neutral"} text-xs">
                  ${p.granted ? "GRANTED" : "WITHDRAWN"}
                </span>
              </td>
              <td class="py-2 text-xs text-muted">${p.effectiveDate}</td>
              <td class="py-2 text-right text-xs">${p.retentionDays} days</td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  </div>`;
}

/** CMP-014: Grounded Ask VMN answer panel */
export function groundedAskVmnAnswer(props: {
  query: string;
  answer: string;
  sources: Array<{ documentId: string; title: string; section: string }>;
  confidenceScore: number;
  abstained?: boolean;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-014">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="font-bold text-base">Ask VMN Grounded Response</span>
        ${props.abstained
          ? html`<span class="badge badge-warning text-xs">ABSTAINED: INSUFFICIENT EVIDENCE</span>`
          : html`<span class="badge badge-success text-xs">CONFIDENCE: ${(props.confidenceScore * 100).toFixed(0)}%</span>`}
      </div>
      <span class="text-xs text-muted">A0 Grounded Retriever</span>
    </div>
    <div class="text-xs text-muted mb-2">Query: <em>"${props.query}"</em></div>
    <div class="card p-3 mb-3 bg-surface-sunken">
      <p class="text-sm">${props.answer}</p>
    </div>
    <div class="text-xs font-semibold mb-1">Authoritative Citations:</div>
    <ul class="text-xs text-muted list-disc pl-5">
      ${props.sources.map(
        (s) => html`<li><code>${s.documentId}</code> — <strong>${s.title}</strong> (${s.section})</li>`
      )}
    </ul>
  </div>`;
}

/** CMP-015: Multi-source governance conflict resolver */
export function sourceConflictResolver(props: {
  conflictId: string;
  topic: string;
  primaryAuthority: { id: string; claim: string };
  secondaryAuthority: { id: string; claim: string };
  competentOwner: string;
}): SafeHtml {
  return html`<div class="card p-4 mb-4 border border-warning" data-component="CMP-015">
    <div class="flex items-center gap-2 mb-2">
      <span class="badge badge-warning">GOVERNANCE CONFLICT: ${props.conflictId}</span>
      <h3 class="font-bold text-base">${props.topic}</h3>
    </div>
    <p class="text-xs text-muted mb-3">Model-as-final-judge is strictly prohibited by Canonical Law 13. Resolution routed to competent human authority: <strong>${props.competentOwner}</strong>.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
      <div class="card p-3">
        <div class="text-xs font-bold text-muted">${props.primaryAuthority.id}</div>
        <p class="text-sm mt-1">${props.primaryAuthority.claim}</p>
      </div>
      <div class="card p-3">
        <div class="text-xs font-bold text-muted">${props.secondaryAuthority.id}</div>
        <p class="text-sm mt-1">${props.secondaryAuthority.claim}</p>
      </div>
    </div>
  </div>`;
}

/** CMP-019: Protected staff assignment selector */
export function protectedStaffAssignmentSelector(props: {
  roleNeeded: string;
  candidates: Array<{ id: string; codeName: string; availableHours: number; cleared: boolean }>;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-019">
    <h3 class="text-base font-bold mb-2">Protected Staff Assignment — ${props.roleNeeded}</h3>
    <p class="text-xs text-muted mb-3">Personal health, salary, and welfare data are strictly shielded under S-PPL-01 isolation.</p>
    <div class="table-responsive">
      <table class="table w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left py-2">Anonymized Identifier</th>
            <th class="text-left py-2">Capacity (Hrs/Wk)</th>
            <th class="text-left py-2">Security Clearance</th>
            <th class="text-right py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          ${props.candidates.map(
            (c) => html`<tr class="border-b border-border">
              <td class="py-2"><code>${c.codeName}</code></td>
              <td class="py-2">${c.availableHours}h</td>
              <td class="py-2">
                <span class="badge ${c.cleared ? "badge-success" : "badge-neutral"} text-xs">
                  ${c.cleared ? "VERIFIED" : "PENDING"}
                </span>
              </td>
              <td class="py-2 text-right">
                <button type="button" class="btn btn-sm btn-outline" ${c.cleared ? "" : "disabled"}>Assign</button>
              </td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  </div>`;
}

/** CMP-020: Rights usage matrix widget */
export function rightsUsageMatrix(props: {
  assetId: string;
  title: string;
  windows: Array<{
    territory: string;
    media: string;
    validFrom: string;
    validTo: string;
    status: "CLEARED" | "HOLD" | "EXPIRED";
  }>;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-020">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Rights Usage Matrix — ${props.title}</h3>
      <span class="badge text-xs">Asset: <code>${props.assetId}</code></span>
    </div>
    <div class="table-responsive">
      <table class="table w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th class="text-left py-2">Territory</th>
            <th class="text-left py-2">Media Window</th>
            <th class="text-left py-2">Valid Period</th>
            <th class="text-right py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          ${props.windows.map(
            (w) => html`<tr class="border-b border-border">
              <td class="py-2 font-semibold">${w.territory}</td>
              <td class="py-2">${w.media}</td>
              <td class="py-2 text-xs text-muted">${w.validFrom} to ${w.validTo}</td>
              <td class="py-2 text-right">
                <span class="badge ${w.status === "CLEARED" ? "badge-success" : w.status === "HOLD" ? "badge-warning" : "badge-neutral"} text-xs">
                  ${w.status}
                </span>
              </td>
            </tr>`
          )}
        </tbody>
      </table>
    </div>
  </div>`;
}

/** CMP-028: Talent booking agreement term builder */
export function talentBookingTermsBuilder(props: {
  creatorId: string;
  talentName: string;
  tier: string;
  deliverables: string[];
  totalFeeNgn: number;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-028">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">VTM Talent Booking Agreement Terms</h3>
      <span class="badge badge-info text-xs">${props.tier} Tier</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
      <div>
        <div class="text-xs text-muted">Talent Counterparty:</div>
        <div class="text-base font-bold">${props.talentName} (<code>${props.creatorId}</code>)</div>
      </div>
      <div>
        <div class="text-xs text-muted">Contracted Consideration:</div>
        <div class="text-base font-bold text-success">NGN ${(props.totalFeeNgn / 100).toLocaleString("en-NG")}</div>
      </div>
    </div>
    <div class="text-xs font-semibold mb-1">Contracted Deliverables:</div>
    <ul class="text-xs text-muted list-disc pl-5 mb-3">
      ${props.deliverables.map((d) => html`<li>${d}</li>`)}
    </ul>
    <p class="text-xs text-muted italic">Booking terms require separate counterparty signature and escrow funding before commencement.</p>
  </div>`;
}

/** CMP-029: Dual-assessor academic grading rubric */
export function dualAssessorGradingRubric(props: {
  studentId: string;
  courseCode: string;
  moduleName: string;
  assessor1Score?: number;
  assessor2Score?: number;
  reconciledGrade?: string;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-029">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">AFCA Dual-Assessor Evaluation Rubric</h3>
      <span class="badge text-xs">Course: <code>${props.courseCode}</code></span>
    </div>
    <p class="text-xs text-muted mb-3">Assessment integrity rule: academic scores are independently submitted by two assessors; sponsors and commercial partners cannot alter grades.</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
      <div class="card p-3">
        <div class="text-xs text-muted">Primary Assessor</div>
        <div class="text-xl font-bold mt-1">${props.assessor1Score !== undefined ? `${props.assessor1Score}/100` : "Pending"}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-muted">Moderator Assessor</div>
        <div class="text-xl font-bold mt-1">${props.assessor2Score !== undefined ? `${props.assessor2Score}/100` : "Pending"}</div>
      </div>
      <div class="card p-3">
        <div class="text-xs text-muted">Final Academic Standing</div>
        <div class="text-xl font-bold text-success mt-1">${props.reconciledGrade || "UNGRADED"}</div>
      </div>
    </div>
  </div>`;
}

/** CMP-030: Candy 18+ eligibility verification challenge */
export function candy18PlusEligibilityGate(props: {
  applicantId: string;
  verified: boolean;
  termsAccepted: boolean;
}): SafeHtml {
  return html`<div class="card p-4 mb-4 border border-info" data-component="CMP-030">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Candy Cast 18+ Adult Eligibility Challenge</h3>
      <span class="badge ${props.verified ? "badge-success" : "badge-warning"} text-xs">
        ${props.verified ? "AGE VERIFIED (18+)" : "VERIFICATION REQUIRED"}
      </span>
    </div>
    <p class="text-xs text-muted mb-3">Strict operational boundary: Candy Cast audition submission is completely separate from Candy Plus consumer subscriptions. Minors are unconditionally prohibited.</p>
    <div class="p-3 bg-surface-sunken card text-xs mb-3">
      <label class="flex items-center gap-2">
        <input type="checkbox" ${props.termsAccepted ? "checked" : ""} disabled />
        <span>Applicant confirms legal majority (18+ years) with biometric ID on file under encrypted retention.</span>
      </label>
    </div>
  </div>`;
}

/** CMP-034: AI Agent A0–A5 execution provenance card */
export function agentExecutionProvenanceCard(props: {
  agentId: string;
  capabilityLevel: "A0" | "A1" | "A2" | "A3" | "A4" | "A5";
  model: string;
  toolCallsExecuted: number;
  tokensConsumed: number;
  humanSignoffRequired: boolean;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-034">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Agent OS Execution Provenance</h3>
      <span class="badge badge-info text-xs">Level ${props.capabilityLevel}</span>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
      <div><span class="text-muted">Agent ID:</span> <code>${props.agentId}</code></div>
      <div><span class="text-muted">Model:</span> <strong>${props.model}</strong></div>
      <div><span class="text-muted">Tool Calls:</span> <strong>${props.toolCallsExecuted}</strong></div>
      <div><span class="text-muted">Tokens:</span> <strong>${props.tokensConsumed.toLocaleString()}</strong></div>
    </div>
    ${props.humanSignoffRequired
      ? html`<div class="p-2 bg-surface-sunken card text-xs text-warning">
          <strong>Authority Gate:</strong> Consequential writes at level ${props.capabilityLevel} require explicit human operator confirmation.
        </div>`
      : html``}
  </div>`;
}

/** CMP-041: Tax applicability decision widget */
export function taxApplicabilityDecisionWidget(props: {
  transactionId: string;
  entityName: string;
  vatRatePercent: number;
  whtRatePercent: number;
  statutoryBasis: string;
  reviewed: boolean;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-041">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Statutory Tax Treatment & Withholding</h3>
      <span class="badge ${props.reviewed ? "badge-success" : "badge-neutral"} text-xs">
        ${props.reviewed ? "TAX COMPLIANT" : "PENDING AUDIT"}
      </span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 text-sm">
      <div class="card p-2">VAT Rate: <strong>${props.vatRatePercent}%</strong></div>
      <div class="card p-2">WHT Rate: <strong>${props.whtRatePercent}%</strong></div>
      <div class="card p-2">Entity: <code>${props.entityName}</code></div>
    </div>
    <div class="text-xs text-muted">Statutory Justification: <em>${props.statutoryBasis}</em></div>
  </div>`;
}

/** CMP-043: Data-subject request (DSAR) tracker */
export function dataSubjectRequestTracker(props: {
  requestId: string;
  requestType: "ACCESS" | "ERASURE" | "RECTIFICATION" | "OBJECTION";
  subjectEmail: string;
  hasLitigationHold: boolean;
  status: "OPEN" | "HOLD" | "FULFILLED" | "REJECTED";
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-043">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Data-Subject Rights Request (DSAR)</h3>
      <span class="badge ${props.hasLitigationHold ? "badge-error" : "badge-info"} text-xs">
        ${props.hasLitigationHold ? "LITIGATION HOLD ACTIVE" : props.status}
      </span>
    </div>
    <div class="grid grid-cols-2 gap-3 text-xs mb-2">
      <div><span class="text-muted">Request Reference:</span> <code>${props.requestId}</code></div>
      <div><span class="text-muted">Type:</span> <strong>${props.requestType}</strong></div>
      <div><span class="text-muted">Subject:</span> <code>${props.subjectEmail}</code></div>
      <div><span class="text-muted">Preservation Override:</span> ${props.hasLitigationHold ? "Mandatory Legal Hold" : "Standard 30-Day Window"}</div>
    </div>
    ${props.hasLitigationHold
      ? html`<div class="text-xs text-error font-semibold mt-1">Erasure prohibited: records are currently subject to an active legal hold order.</div>`
      : html``}
  </div>`;
}

/** CMP-048: Event venue safety inspection and refund panel */
export function eventSafetyAndRefundPanel(props: {
  eventCode: string;
  venueName: string;
  capacityMax: number;
  safetyPermitApproved: boolean;
  emergencyRefundActive: boolean;
}): SafeHtml {
  return html`<div class="card p-4 mb-4" data-component="CMP-048">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-base font-bold">Event Safety & Operations Signoff</h3>
      <span class="badge ${props.safetyPermitApproved ? "badge-success" : "badge-error"} text-xs">
        ${props.safetyPermitApproved ? "SAFETY PERMIT APPROVED" : "UNPERMITTED / HOLD"}
      </span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 text-xs">
      <div><span class="text-muted">Event:</span> <strong>${props.eventCode}</strong></div>
      <div><span class="text-muted">Venue:</span> <strong>${props.venueName}</strong></div>
      <div><span class="text-muted">Max Capacity:</span> <strong>${props.capacityMax.toLocaleString()} attendees</strong></div>
    </div>
    ${props.emergencyRefundActive
      ? html`<div class="p-2 bg-surface-sunken card text-xs text-error font-semibold">
          EMERGENCY REFUND POLICY TRIGGERED: Ticket balances are queued for automated reverse payout.
        </div>`
      : html``}
  </div>`;
}
