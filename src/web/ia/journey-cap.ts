/**
 * VMN World IA R1.1 — CAP journey: capability and resourcing.
 *
 * Like missions, resourcing has no domain in this deployment: there is no
 * CapabilityProfile, skill, allocation, facility, equipment or coaching record.
 * These surfaces therefore state what a capacity decision would rest on and
 * why the register is absent. A capacity decision is never made by a page —
 * allocating a person or a facility to work is a management decision with a
 * named accountable manager (canonical law 13).
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
  { label: "Capabilities", href: "/circle/capabilities/capability-leader-overview" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

const NO_CAPABILITY_MODEL = `There is no capability, skill, availability, allocation or facility
  record in this deployment's schema. Nothing here is a person, a team's utilisation or an available
  slot, and no count is shown, because zero people available and "cannot be read" are different
  facts and only one of them is true.`;

function leaderOverview(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "capability-overview",
      "Capacity this lead would see",
      html`${sourceNotConnected(NO_CAPABILITY_MODEL)}
      ${pendingTable(
        "Capability leader overview",
        ["Person", "Assigned work", "Utilisation", "Risk", "Key skills", "Outstanding requests"],
        "No connected capability register. Rows appear here when one is connected."
      )}
      <p class="text-muted">
        Approving or refusing an allocation, the double-booking state, asset checkout, coaching
        feedback, expired evidence and the no-authorised-manager state are all hosted on this
        screen; each is recorded below with its own acceptance criterion rather than as a live
        control.
      </p>`
    ),
    section(
      "capability-decisions",
      "Who decides what",
      html`<ul>
        <li>An allocation is approved or refused by the accountable capability lead — never by the person allocated.</li>
        <li>A double booking is a conflict to resolve, not a warning to dismiss; the person's workload safety is the binding constraint.</li>
        <li>A facility or asset is checked out against a named holder, so a lost asset has an accountable owner.</li>
        <li>Where no authorised capacity manager is available, the request waits. It does not auto-approve.</li>
      </ul>`
    ),
  ].join("\n");
}

function facilityRequest(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "facility-request",
      "Why no request form is offered",
      html`${sourceNotConnected(
        "A facility or equipment request needs an asset register to check availability against and a named holder to check the item out to. Neither exists here, so a submitted request could not be validated or recorded."
      )}
      <p class="text-muted">
        A request is not a booking. The accountable manager's approval is what creates the
        allocation, and this page would never be that approval.
      </p>`
    ),
  ].join("\n");
}

function workloadSafety(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "workload-case",
      "Workload safety and capacity overrun",
      html`${sourceNotConnected(
        "This is a specialist case surface. There is no capacity-overrun case type in the case register and no allocation record to measure an overrun against, so no case can be opened or read here."
      )}
      <p class="text-muted">
        Where a capacity overrun is suspected, the route is the accountable manager, then the
        workload safety owner — not this screen, which would only ever be a record of that decision.
      </p>`
    ),
  ].join("\n");
}

export function renderCapBody(screen: IAScreen, _ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("CAP-")) return undefined;
  switch (screen.id) {
    case "CAP-001":
      return leaderOverview(screen);
    case "CAP-007":
      return facilityRequest(screen);
    case "CAP-018":
      return workloadSafety(screen);
    default:
      return undefined;
  }
}
