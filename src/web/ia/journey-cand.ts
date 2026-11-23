/**
 * VMN World IA R1.1 — CAND journey (J11): Candy Cast, Candy Plus & Restricted-Consent Boundaries.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - DEC-08: Approve separate Candy Cast and Candy Plus privacy, rights and content gates.
 * - Non-negotiable boundary: Cast consent != Plus consent; 18+ eligibility strictly enforced.
 */

import { html, type SafeHtml } from "../components/index.js";
import {
  gatedHeader,
  pendingTable,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import type { IAScreen } from "./types.js";

const CRUMB = [
  { label: "Talent & Casting", href: "/workspace" },
  { label: "Candy Cast Hub", href: "/workspace/candy/dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderCand001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "cand-dashboard-overview",
      "Candy Cast & Talent Engagement Portal",
      html`<div class="provenance-notice" role="note">
        <strong>Age Verification & Boundary Notice:</strong> Session active for <code>${ctx.user.email}</code>. Candy Cast operates under strict adult eligibility rules (18+ only) and DEC-08 privacy/consent segregation. Audition submissions and casting records are confidential and separated from commercial retail databases.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Eligibility Status</div>
          <div class="text-xl font-bold text-success mt-1">18+ Cleared</div>
          <p class="text-xs text-muted mt-1">Biometric/statutory age verification confirmed under encrypted escrow.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Active Auditions</div>
          <div class="text-xl font-bold mt-1">Review Queue</div>
          <p class="text-xs text-muted mt-1">Direct casting calls for scripted, lifestyle, and brand productions.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Consent Granularity</div>
          <div class="text-xl font-bold text-success mt-1">Isolated Ledgers</div>
          <p class="text-xs text-muted mt-1">Cast participation consent is decoupled from consumer promotional tracking.</p>
        </div>
      </div>
      ${pendingTable(
        "Submitted Casting Applications",
        ["Application ID", "Production Title", "Role Profile", "Review Stage", "Consent Record"],
        "Audition submissions are reviewed exclusively by authorized casting directors."
      )}`
    ),
  ].join("\n");
}

function renderCand002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "cand-audition-form",
      "Confidential Audition Submission & Scope Agreement",
      html`<div class="card mb-3">
        <p>Submit candidate self-tape and measurement profile. Performers retain ownership of audition materials until execution of an explicit production talent agreement.</p>
      </div>
      <form class="card p-4 space-y-3" method="POST" action="/api/v1/candy/audition">
        <div>
          <label class="block text-sm font-semibold mb-1" for="cast-role">Casting Call</label>
          <select class="input w-full" id="cast-role" name="roleId">
            <option value="ROLE-01">Nigezie Urban Sessions — Host / Presenter</option>
            <option value="ROLE-02">Candy Lifestyle Series — Featured Talent</option>
            <option value="ROLE-03">TEN Dramatic Universe — Supporting Cast</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1" for="self-tape-url">Secure Audition Reel URL</label>
          <input class="input w-full" id="self-tape-url" name="reelUrl" type="url" placeholder="https://secure.vmn.ng/storage/audition/..." required />
        </div>
        <div class="card p-3 bg-surface-sunken text-xs space-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" required />
            <span>I confirm I am at least 18 years of age and hold legal capacity to enter talent contracts.</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" required />
            <span>I acknowledge that audition submission does not grant automatic inclusion into Candy Plus consumer services.</span>
          </label>
        </div>
        <button type="submit" class="btn btn-primary">Submit Audition Package</button>
      </form>`
    ),
    sourceNotConnected(screen.sourceOffice || "Candy Cast source not connected in this environment."),
  ].join("\n");
}

function renderCandGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `cand-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J11 · Candy Cast & Restricted Consent</div>
        <p class="text-sm">Managing casting domain entity <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} Governance Records`,
        ["Entry ID", "Applicant Reference", "Scope & Media Rights", "Review Status", "Consent Ledger Hash"],
        "Enforcing DEC-08 casting boundary invariants and strict privacy segregation."
      )}`
    ),
  ].join("\n");
}

export function renderCandBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("CAND-")) return undefined;
  switch (screen.id) {
    case "CAND-001":
      return renderCand001(screen, ctx);
    case "CAND-002":
      return renderCand002(screen);
    default:
      return renderCandGeneric(screen, ctx);
  }
}
