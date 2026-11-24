/**
 * VMN World IA R1.1 — public body aggregation.
 *
 * Bespoke bodies exist where a page needs real content (J01, the brand
 * surfaces, capability profiles, enquiry wizards, the Azeebo+ gateway).
 * Everything else renders through the contract renderer: the plan's D2
 * decision — every registry entry can render a real, accessible page from its
 * contract, and no screen invents data its sources do not supply.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { renderIAContractScreen, renderIAProvenance } from "./render.js";
import type { IAScreen } from "./types.js";
import { renderIAPublicBody, renderIAHostedSurfaces, type IAPublicPageContext } from "./journey-pub.js";
import { renderBriBody, resolveBrandInstance } from "./journey-bri.js";
import { renderServBody } from "./journey-serv.js";
import { renderWorkWithVmnBody, renderWizardBody, renderReceiptBody } from "./journey-lead.js";
import { renderStwBody } from "./journey-stw.js";

type BodyRenderer = (screen: IAScreen, context: IAPublicPageContext) => string | undefined;

/** Ordered providers; the first bespoke body wins. */
const PROVIDERS: readonly BodyRenderer[] = [
  // J01 bespoke pages and their hosted states (the Phase 2 slice).
  (screen, context) => renderIAPublicBody(screen, context),
  // J02/J02a brand directory, family overviews and the 35-instance template.
  (screen, context) => renderBriBody(screen, context),
  // J04 capability, programme and showcase surfaces.
  (screen) => renderServBody(screen),
  // J03 storyworlds landing and the federated Azeebo+ gateway.
  (screen) => renderStwBody(screen),
  // J05 enquiry hub, wizard shell and receipt are split: the receipt needs the
  // route's {case-id} parameter, the rest are static bodies.
  (screen, context) => {
    switch (screen.id) {
      case "LEAD-001":
        return renderWorkWithVmnBody();
      case "LEAD-002":
      case "LEAD-003":
      case "LEAD-004":
      case "LEAD-005":
      case "LEAD-006":
      case "LEAD-007":
      case "LEAD-008":
        return renderWizardBody(screen, { csrfToken: context.csrfToken });
      default:
        return undefined;
    }
  },
];

function receiptBody(screen: IAScreen, context: IAPublicPageContext): string | undefined {
  if (screen.id !== "LEAD-009") return undefined;
  return renderReceiptBody(screen, context.params["case-id"] ?? "");
}

/**
 * The body for a public screen: the first bespoke provider that claims it, or
 * the contract renderer. Never a fabricated value.
 */
export function renderIAPublicBodyFor(screen: IAScreen, context: IAPublicPageContext): string {
  let body: string | undefined;
  for (const provider of PROVIDERS) {
    body = provider(screen, context);
    if (body !== undefined) break;
  }
  if (body === undefined) body = receiptBody(screen, context);
  if (body === undefined) body = renderIAContractScreen(screen);

  // A content instance rendered through its template is reviewed against its
  // own row: the brand template (BRD-006) carries the instance's provenance.
  const provenanceScreen =
    screen.id === "BRD-006"
      ? resolveBrandInstance(context.params["approved-brand-slug"] ?? "")?.screen ?? screen
      : screen;

  return [
    body,
    '<div class="sr-only" aria-hidden="true">',
    renderIAHostedSurfaces(screen),
    renderIAProvenance(provenanceScreen),
    "</div>",
  ]
    .filter((part) => part.length > 0)
    .join("\n")
    .trim();
}
