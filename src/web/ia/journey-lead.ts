/**
 * VMN World IA R1.1 — LEAD journey (J05): public enquiries, qualified intake
 * and application handoff.
 *
 * The nine routed rows are public (W0). The wizards share one shell and eight
 * intents (plan Phase 3); every submission is recorded through the existing
 * commercial-enquiry contract (`submitCommercialEnquiry`, the same domain
 * service `POST /api/v1/enquiries` enforces). The UI records the request; it
 * makes no decision about it (canonical law 13).
 *
 * The receipt page renders the case reference the submission itself returned.
 * It deliberately does not look up arbitrary references: an existence oracle
 * would disclose whether a case ID is live, the same reason the public
 * recovery endpoint returns 410.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { escapeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";
import type { IAScreen } from "./types.js";

export interface IAWizardIntent {
  screenId: string;
  /** The enquiry vertical this intent's intake routes to. */
  vertical:
    | "COMMERCIAL_ADVERTISING"
    | "SPONSORSHIP"
    | "PARTNERSHIP"
    | "AFCA_LEARNING"
    | "TALENT_ACCELERATOR"
    | "ONE_STUDIOS"
    | "GENERAL_ENQUIRY";
  /** One line telling the visitor what belongs in the message. */
  messagePrompt: string;
}

/**
 * Intent → vertical routing is intake classification only: it decides which
 * operator queue the request lands in, never any outcome. The visitor's own
 * words travel unchanged in the message body, prefixed by the wizard's
 * inventory intent so the intake can be audited back to its authority row.
 */
export const WIZARD_INTENTS: readonly IAWizardIntent[] = [
  {
    screenId: "LEAD-001",
    vertical: "GENERAL_ENQUIRY",
    messagePrompt:
      "Describe what you need and, if you know it, which part of VMN it concerns. The intake routes it for review.",
  },
  {
    screenId: "LEAD-002",
    vertical: "ONE_STUDIOS",
    messagePrompt:
      "Describe the creative services brief: what is to be made, for whom, and any dates or constraints you already know.",
  },
  {
    screenId: "LEAD-003",
    vertical: "COMMERCIAL_ADVERTISING",
    messagePrompt:
      "Describe the media or advertising enquiry: channels, formats, flight window or campaign goals.",
  },
  {
    screenId: "LEAD-004",
    vertical: "AFCA_LEARNING",
    messagePrompt:
      "Describe the programme or training enquiry: which capability area, how many participants, and any timing.",
  },
  {
    screenId: "LEAD-005",
    vertical: "TALENT_ACCELERATOR",
    messagePrompt:
      "Describe the creator or talent opportunity: your discipline, experience and what you are seeking.",
  },
  {
    screenId: "LEAD-006",
    vertical: "ONE_STUDIOS",
    messagePrompt:
      "Describe the production or studio work to be quoted: scope, facilities, crew and dates. A quote is issued by the studio office after review.",
  },
  {
    screenId: "LEAD-007",
    vertical: "SPONSORSHIP",
    messagePrompt:
      "Describe the event and what feasibility means for you: audience, dates, venue status and the outcome you need.",
  },
  {
    screenId: "LEAD-008",
    vertical: "PARTNERSHIP",
    messagePrompt:
      "Describe the rights or licensing position: the content or IP involved, the rights you hold or seek, and the territory and term.",
  },
];

export function getWizardIntent(screenId: string): IAWizardIntent | undefined {
  return WIZARD_INTENTS.find((intent) => intent.screenId === screenId);
}

/* -------------------------------------------------------------------------
 * LEAD-001 — /work-with-vmn hub
 * ---------------------------------------------------------------------- */

export function renderWorkWithVmnBody(): string {
  const screen = getIAScreen("LEAD-001");
  const intents = WIZARD_INTENTS.filter((intent) => intent.screenId !== "LEAD-001").map((intent) => {
    const wizard = getIAScreen(intent.screenId);
    if (!wizard) return "";
    return `
      <li class="card mb-2">
        <a href="${escapeHtml(wizard.route)}"><strong>${escapeHtml(wizard.screenName)}</strong></a>
        <p class="text-muted">${escapeHtml(wizard.primaryAction)}</p>
      </li>`.trim();
  }).join("\n");

  return `
  <article class="container">
    <header>
      <h1>${escapeHtml(screen?.screenName ?? "Work with VMN")}</h1>
      <p>${escapeHtml(screen?.primaryAction ?? "")}</p>
    </header>
    <div class="provenance-notice" role="note">
      <strong>What a submission does.</strong>
      Each intent records a scoped request for the responsible office to review. It commits neither
      side to anything, and no wizard result — a quote, a booking, a licence, an admission — is
      produced here.
    </div>
    <ul class="list-unstyled">${intents}</ul>
    <section class="card mb-4">
      <h2>Not sure which intent?</h2>
      <p>Use the general enquiry below, or <a href="/contact">the contact centre</a> / <a href="/support">help and support</a>.</p>
    </section>
    ${renderWizardBody(getIAScreen("LEAD-001")!)}
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * LEAD-002..008 — one wizard shell, eight intents
 * ---------------------------------------------------------------------- */

export interface IAWizardFormValues {
  fullName?: string;
  email?: string;
  phone?: string;
  organisationName?: string;
  message?: string;
}

export interface IAWizardErrors {
  fullName?: string;
  email?: string;
  message?: string;
  ndprConsent?: string;
}

/**
 * Shared wizard body. `errors` re-renders with a truthful failure summary and
 * the visitor's own values preserved; it never pretends a submission happened.
 */
export function renderWizardBody(
  screen: IAScreen,
  options: {
    values?: IAWizardFormValues;
    errors?: IAWizardErrors;
    submitted?: boolean;
    /** Double-submit CSRF token, issued only when the requester has a session. */
    csrfToken?: string;
  } = {}
): string {
  const intent = getWizardIntent(screen.id);
  const values = options.values ?? {};
  const errors = options.errors ?? {};

  const field = (
    id: string,
    label: string,
    input: string,
    error?: string,
    optional = false
  ): string => `
        <div class="mb-3">
          <label for="${escapeHtml(id)}">${escapeHtml(label)}${optional ? "" : ' <span aria-hidden="true">*</span>'}</label>
          ${input}
          ${error ? `<p class="provenance-notice" role="alert">${escapeHtml(error)}</p>` : ""}
        </div>`.trim();

  const errorSummary =
    Object.keys(errors).length === 0
      ? ""
      : `<div class="provenance-notice" role="alert">
      <strong>The request was not recorded.</strong>
      ${escapeHtml(String(Object.values(errors).filter(Boolean).length))} field(s) need attention below.
      Nothing was submitted, so there is nothing to check the status of.
    </div>`;

  return `
  <article class="container">
    <nav aria-label="Breadcrumb">
      <a href="/work-with-vmn">Work with VMN</a> / <span aria-current="page">${escapeHtml(screen.screenName)}</span>
    </nav>
    <header>
      <h1>${escapeHtml(screen.screenName)}</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    ${errorSummary}
    <div class="provenance-notice" role="note">
      <strong>Before you submit.</strong>
      This form records a request through the commercial-enquiry intake. Please do not include
      sensitive personal information. Submission needs the acknowledgement below.
    </div>
    <form method="POST" action="/work-with-vmn/submit" class="card mb-4" novalidate>
      <input type="hidden" name="wizardScreenId" value="${escapeHtml(screen.id)}" />
      ${
        options.csrfToken
          ? `<input type="hidden" name="csrfToken" value="${escapeHtml(options.csrfToken)}" />`
          : ""
      }
      ${field(
        "fullName",
        "Full name",
        `<input class="vmn-input" type="text" id="fullName" name="fullName" value="${escapeHtml(values.fullName ?? "")}" autocomplete="name" />`,
        errors.fullName
      )}
      ${field(
        "email",
        "Email address",
        `<input class="vmn-input" type="email" id="email" name="email" value="${escapeHtml(values.email ?? "")}" autocomplete="email" />`,
        errors.email
      )}
      ${field(
        "phone",
        "Phone number (optional)",
        `<input class="vmn-input" type="tel" id="phone" name="phone" value="${escapeHtml(values.phone ?? "")}" autocomplete="tel" />`,
        undefined,
        true
      )}
      ${field(
        "organisationName",
        "Organisation (optional)",
        `<input class="vmn-input" type="text" id="organisationName" name="organisationName" value="${escapeHtml(values.organisationName ?? "")}" autocomplete="organization" />`,
        undefined,
        true
      )}
      ${field(
        "message",
        "Your request",
        `<textarea class="vmn-input" id="message" name="message" rows="6" placeholder="${escapeHtml(
          intent?.messagePrompt ?? "Describe your request."
        )}">${escapeHtml(values.message ?? "")}</textarea>`,
        errors.message
      )}
      <div class="mb-3">
        <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" />
        <label for="ndprConsent">
          <strong>Acknowledgement (required):</strong> I understand that the information I submit is
          provided to VMNL for this enquiry, and that this request is recorded for review.
          <span>It is not an acceptance, booking, quote or licence.</span>
        </label>
        ${errors.ndprConsent ? `<p class="provenance-notice" role="alert">${escapeHtml(errors.ndprConsent)}</p>` : ""}
      </div>
      <button class="btn btn-primary" type="submit">Submit request</button>
      <p class="text-muted mt-2">
        After submission you receive a case reference on the receipt page. Keep it: online status
        lookup is not offered, and the reference is what support asks for.
      </p>
    </form>
    <section class="card mb-4">
      <h2>If submission fails</h2>
      <p>${escapeHtml(screen.recoveryRoute)}</p>
    </section>
  </article>`.trim();
}

/* -------------------------------------------------------------------------
 * LEAD-009 — /enquiries/{case-id}/receipt
 * ---------------------------------------------------------------------- */

export function renderReceiptBody(screen: IAScreen, caseId: string): string {
  const hasReference = caseId.trim().length > 0;
  if (!hasReference) {
    return `
  <article class="container">
    <div class="flex flex-wrap gap-2 items-center mb-2">
      <span class="status-chip badge-neutral">No reference</span>
    </div>
    <h1>Receipt unavailable</h1>
    <p>
      This page shows the receipt of a request you submitted from this site. No case reference was
      provided, so there is nothing to display.
    </p>
    <a class="btn btn-primary" href="/work-with-vmn">Submit an enquiry</a>
    <a class="btn btn-outline" href="/support">Support</a>
  </article>`.trim();
  }

  return `
  <article class="container">
    <header>
      <div class="flex flex-wrap gap-2 items-center mb-2">
        <span class="status-chip badge-info">Request recorded</span>
        <span class="status-chip badge-provisional">${escapeHtml(screen.id)}</span>
      </div>
      <h1>Request receipt</h1>
      <p>${escapeHtml(screen.primaryAction)}</p>
    </header>
    <section class="card mb-4">
      <h2>Your case reference</h2>
      <p><strong><code>${escapeHtml(caseId)}</code></strong></p>
      <p class="text-muted">Keep this reference. It is how support and the responsible office find your request.</p>
    </section>
    <section class="card mb-4">
      <h2>What happens next</h2>
      <p>
        The request is queued for the responsible office. What it is <em>not</em>: an acceptance, a
        booking, a quotation, a licence or an admission. Any of those is a separate decision made by
        the accountable human authority after review.
      </p>
      <p class="text-muted">Evidence contract: ${escapeHtml(screen.evidenceContract)}</p>
    </section>
    <section class="card mb-4">
      <h2>Online status lookup</h2>
      <p>
        Status lookup for a reference is deliberately not offered on this page: confirming whether an
        arbitrary case ID exists would disclose information to anyone who types one in. If you need
        the status, use your reference with support.
      </p>
      <a class="btn btn-outline" href="/support">Contact support</a>
    </section>
  </article>`.trim();
}
