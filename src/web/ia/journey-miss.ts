/**
 * VMN World IA R1.1 — MISS journey: missions.
 *
 * Missions are the one journey with no domain behind them in this deployment:
 * the schema has no Mission, MissionApproval, WorkEvidence or Handoff model,
 * and the approval register's categories contain none that a mission approval
 * could be filed under. Phase 4 therefore builds these as **work surfaces**:
 * each states what it records, what would receive it, and why nothing does
 * (approved scope: contract-grade for MISS/CAP).
 *
 * Where a screen needs no more than its contract, this provider declines and
 * the contract renderer serves it — one honest renderer, not two.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { html, type SafeHtml } from "../components/index.js";
import {
  circleNav,
  gatedHeader,
  pendingTable,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import type { IAScreen } from "./types.js";

const CRUMB = [
  { label: "ONE CIRCLE", href: "/circle" },
  { label: "Missions", href: "/circle/missions" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** The absence every mission surface shares, stated once with its evidence. */
const NO_MISSION_MODEL = `There is no Mission record in this deployment's schema, and no Mission
  Owner, approval, evidence or handoff attached to one. Nothing on this board is a mission, and no
  count of missions is shown, because a board that drew an empty column set would read as "no
  missions exist" rather than "missions cannot be read here".`;

function portfolioBoard(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "mission-board",
      "Mission portfolio",
      html`${sourceNotConnected(NO_MISSION_MODEL)}
      ${pendingTable(
        "Mission portfolio board",
        ["Mission", "Accountable owner", "Stage", "Hard gates", "Deadline", "Blockers", "Source coverage"],
        "No connected mission register. Rows appear here when one is connected."
      )}
      <p class="text-muted">
        Each row would carry its own gate state, because a mission blocked on rights, funds or safety
        must be visible as blocked rather than merely late. Those states are named on the mission
        workspace (MISS-004) and are not collapsed into a single status here.
      </p>`
    ),
  ].join("\n");
}

function playbooks(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "playbook-selector",
      "Mission templates",
      html`${sourceNotConnected(
        "The authority names the playbook set; it does not enumerate the playbooks, and there is no template store in this deployment. Listing names here would invent the operating scenarios an owner is supposed to choose between — the one thing this screen exists to get right."
      )}
      ${pendingTable(
        "Mission template selector",
        ["Playbook", "Applies when", "SOP references", "Accountable owner required", "Authority prerequisite"],
        "No connected template register. Rows appear here when one is connected."
      )}
      <p class="text-muted">A playbook is chosen by the accountable owner, not assigned by a page.</p>`
    ),
  ].join("\n");
}

function createWizard(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "mission-create",
      "What a draft mission would record",
      html`${sourceNotConnected(
        "A draft mission has nowhere to be recorded, so no form is offered. A form here would accept a business need, a brand, an accountable owner, an outcome, a budget and a rights position, and then discard all six."
      )}
      <p>The inventory's own field set, for reference:</p>
      <ul>
        <li>Business need and the decision it serves</li>
        <li>Brand, client or property it concerns</li>
        <li>Accountable Mission Owner — a named person, not a team</li>
        <li>Intended outcome and how acceptance is judged</li>
        <li>Budget and rights position, which are the two hard gates</li>
      </ul>
      <p class="text-muted">
        Two of those fields are decisions the page may never make: a budget is Finance's, and a
        rights position is the rights register's. The wizard would record the owner's claim; it would
        not clear either gate.
      </p>`
    ),
    section(
      "mission-create-owner",
      "Assigning the accountable owner",
      html`<p>MISS-006 is the inventory's owner-assignment dialog, hosted on this wizard. It is recorded
      below with its own acceptance criterion rather than as an inline control, because there is no
      draft to attach an owner to.</p>`
    ),
  ].join("\n");
}

function missionWorkspace(screen: IAScreen, ctx: IAGatedPageContext): string {
  const requested = ctx.params["mission-id"] ?? "";
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "mission-requested",
      "Requested mission",
      html`${sourceNotConnected(
        "No mission register is connected, so this identifier cannot be resolved. The value below is what the address asked for, not a mission that exists."
      )}
      <p>Requested identifier: <code>${requested}</code></p>
      <p class="text-muted">
        A resolved workspace would show its task list, timeline, source and contract, deliverables,
        approvals and accepted handoffs. None of those records exist for this identifier, so the
        tabs hosted on this screen are described below instead of being drawn empty.
      </p>`
    ),
  ].join("\n");
}

function approvalsAndGates(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "mission-approvals",
      "Why no approval request is offered",
      html`${sourceNotConnected(
        "The approval register exists and enforces separation of duties, four eyes and revision checks — but its categories are rate-card override, AFCA milestone, contract signature, schedule override, financial adjustment and rights exception. None is a mission approval, so there is nothing to file a mission gate request under."
      )}
      <p class="text-muted">
        Adding a mission category would change the approval domain's authority, which is a business
        decision rather than an implementation detail. The gates themselves are real: rights, funds
        and safety are decided by the roles that own them, never by the mission owner.
      </p>
      ${pendingTable(
        "Mission approvals and hard gates",
        ["Gate", "Mission", "Accountable decider", "Blocked since", "Evidence", "Outcome"],
        "No connected approval source for missions. Rows appear here when one is connected."
      )}`
    ),
  ].join("\n");
}

function unknownOutcomeQueue(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "external-outcomes",
      "External actions with unknown outcomes",
      html`${sourceNotConnected(
        "This queue is where an outbound action whose result was never confirmed would surface. There is no mission action ledger, so there is nothing to reconcile — and nothing is inferred from the Azeebo+ federation gateway, whose delivery records belong to federation rather than to a mission."
      )}
      ${pendingTable(
        "External action reconciliation and unknown-outcome queue",
        ["Action", "Mission", "Destination", "Attempted", "Confirmation", "Reconciled by"],
        "No connected action ledger. Rows appear here when one is connected."
      )}
      <p class="text-muted">
        An unconfirmed action is treated as not done. Marking it otherwise needs evidence from the
        destination, which is what this queue would collect.
      </p>`
    ),
  ].join("\n");
}

export function renderMissBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("MISS-")) return undefined;
  switch (screen.id) {
    case "MISS-001":
      return portfolioBoard(screen);
    case "MISS-002":
      return playbooks(screen);
    case "MISS-003":
      return createWizard(screen);
    case "MISS-004":
      return missionWorkspace(screen, ctx);
    case "MISS-016":
      return approvalsAndGates(screen);
    case "MISS-030":
      return unknownOutcomeQueue(screen);
    default:
      return undefined;
  }
}
