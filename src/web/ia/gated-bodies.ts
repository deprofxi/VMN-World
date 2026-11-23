/**
 * VMN World IA R1.1 — gated body aggregation (`W1`–`W4`).
 *
 * The mirror of `public-bodies.ts` for the read and work gates: the first
 * journey provider that claims a screen wins, and everything else renders
 * through the contract renderer. A bespoke body is only ever written where it
 * adds truth — a real record, a real absence, a route parameter — because a
 * second renderer that repeats the contract would drift from the first.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { adverseStatesSection, hostedStatesSection, type IAGatedPageContext } from "./gated-parts.js";
import { renderCapBody } from "./journey-cap.js";
import { renderAuthBody } from "./journey-auth.js";
import { renderCircBody } from "./journey-circ.js";
import { renderMissBody } from "./journey-miss.js";
import { renderFinBody } from "./journey-fin.js";
import { renderBrcBody } from "./journey-brc.js";
import { renderCltBody } from "./journey-clt.js";
import { renderPartBody } from "./journey-part.js";
import { renderLearnBody } from "./journey-learn.js";
import { renderTalBody } from "./journey-tal.js";
import { renderCandBody } from "./journey-cand.js";
import { renderStudBody } from "./journey-stud.js";
import { renderEvntBody } from "./journey-evnt.js";
import { renderIprBody } from "./journey-ipr.js";
import { renderCmsBody } from "./journey-cms.js";
import { renderGovBody } from "./journey-gov.js";
import { renderSysBody } from "./journey-sys.js";
import { renderIAContractScreen, renderIAProvenance } from "./render.js";
import type { IAScreen } from "./types.js";

type GatedBodyRenderer = (screen: IAScreen, context: IAGatedPageContext) => string | undefined;

/** Ordered providers; the first bespoke body wins. */
const PROVIDERS: readonly GatedBodyRenderer[] = [
  renderCircBody,
  renderAuthBody,
  renderMissBody,
  renderCapBody,
  renderFinBody,
  renderBrcBody,
  renderCltBody,
  renderPartBody,
  renderLearnBody,
  renderTalBody,
  renderCandBody,
  renderStudBody,
  renderEvntBody,
  renderIprBody,
  renderCmsBody,
  renderGovBody,
  renderSysBody,
];

/**
 * The body for a gated screen. A bespoke body carries the hosted states that
 * belong on it, its own adverse states and its provenance; the contract
 * renderer already carries all three, so it is returned unwrapped.
 */
export function renderIAGatedBodyFor(screen: IAScreen, context: IAGatedPageContext): string {
  for (const provider of PROVIDERS) {
    const body = provider(screen, context);
    if (body === undefined) continue;
    return [
      body,
      '<div class="container">',
      hostedStatesSection(screen),
      adverseStatesSection(screen),
      renderIAProvenance(screen),
      "</div>",
    ]
      .filter((part) => String(part).length > 0)
      .join("\n")
      .trim();
  }
  return renderIAContractScreen(screen);
}
