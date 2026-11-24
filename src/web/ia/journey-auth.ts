/**
 * VMN World IA R1.1 — AUTH journey (J11): identity, account and access.
 *
 * The identity shell already serves sign-in, MFA challenge, recovery,
 * invitation acceptance and workspace selection, and it owns those routes
 * (`IA_PLATFORM_OWNED_ROUTES`). This module therefore does two things rather
 * than duplicating them:
 *
 * 1. It serves the inventory's `/account*` reads from the records that are real
 *    — the session, its roles, its devices (`listSessions`) and the stored
 *    notification preferences.
 * 2. It states where a flow lives when the platform already serves it, and
 *    states the absence when nothing serves it. No credential field is rendered
 *    outside the platform's own challenge, so this journey cannot become a
 *    second, weaker way to authenticate.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { listSessions } from "../../core/auth/sessions.js";
import { html, type SafeHtml } from "../components/index.js";
import {
  formatInstant,
  gatedHeader,
  hostedStatesSection,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import { getIAScreen } from "./index.js";
import type { IAScreen } from "./types.js";

const CRUMB = [{ label: "Account", href: "/account" }];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function sessionFacts(ctx: IAGatedPageContext): SafeHtml {
  const roles =
    ctx.user.roles.length === 0
      ? [html`<li>No role is recorded on this session.</li>`]
      : ctx.user.roles.map((role) => html`<li>${role}</li>`);
  const tenant =
    ctx.user.tenantId === undefined
      ? "No tenant is bound to this session."
      : `Tenant: ${ctx.user.tenantId}`;
  return html`<dl>
      <dt>Signed in as</dt><dd><code>${ctx.user.email}</code></dd>
      <dt>Tenant</dt><dd>${tenant}</dd>
      <dt>Multi-factor authentication</dt><dd>${
        ctx.user.mfaEnabled ? "Enrolled on this session" : "Not recorded on this session"
      }</dd>
    </dl>
    <h3>Roles this session authorises</h3>
    <ul>${roles}</ul>`;
}

/** AUTH-007 — the account dashboard, on the session record. */
function accountHome(screen: IAScreen, ctx: IAGatedPageContext): string {
  const links: readonly { href: string; label: string; hint: string }[] = [
    { href: "/account/security", label: "Security devices and sessions", hint: "Every session on this account, from the session registry." },
    { href: "/account/privacy", label: "Privacy permissions centre", hint: "What this deployment can and cannot show about consent." },
    { href: "/account/sessions", label: "Manage devices (platform)", hint: "Revoke a session — the platform owns the mutation." },
    { href: "/account/notifications", label: "Notification preferences", hint: "Which categories are delivered." },
    { href: "/select-workspace", label: "Change relationship or workspace", hint: "Platform workspace selection." },
    { href: "/auth/switch-role", label: "Switch role", hint: "Platform role switching within this session." },
  ];
  const list = links.map(
    (link) => html`<li><a href="${link.href}">${link.label}</a> — ${link.hint}</li>`
  );

  return [
    gatedHeader(screen, CRUMB),
    section("account-identity", "This account", sessionFacts(ctx)),
    section(
      "account-links",
      "Where each account action lives",
      html`<ul>${list}</ul>
      <p class="text-muted">Signing out is a platform action too: the identity shell owns the
      session cookie, so this screen links to the flows rather than reimplementing them.</p>`
    ),
  ].join("\n");
}

/** AUTH-009 — security devices and sessions, from the session registry. */
function security(screen: IAScreen, ctx: IAGatedPageContext): string {
  const sessions = listSessions(ctx.user.userId);
  const active = sessions.filter((record) => record.revokedAt === undefined);  const rows = sessions.map(
    (record) => html`<tr>
        <th scope="row">${record.deviceLabel}</th>
        <td>${record.ipAddress}</td>
        <td>${formatInstant(record.createdAt)}</td>
        <td>${formatInstant(record.lastSeenAt)}</td>
        <td>${record.revokedAt ? "Revoked" : "Active"}</td>
      </tr>`
  );

  const table =
    sessions.length === 0
      ? html`<div class="provenance-notice" role="status">
          <strong>No session record is held for this account.</strong>
          The registry records a session when a token is issued; an empty register here means this
          process has not observed one, so it is not evidence that no device is signed in.
        </div>`
      : html`<div class="table-scroll">
          <table>
            <caption>Sessions recorded for ${ctx.user.email}</caption>
            <thead><tr>
              <th scope="col">Device</th><th scope="col">Address</th><th scope="col">Signed in</th>
              <th scope="col">Last seen</th><th scope="col">State</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;

  return [
    gatedHeader(screen, CRUMB),
    section(
      "security-sessions",
      "Devices and sessions",
      html`${table}
      <p>${
        `Active sessions recorded for this account: ${active.length}`
      }</p>
      <p><a class="btn btn-outline" href="/account/sessions">Revoke a session</a>
      <a class="btn btn-outline" href="/account/sessions">Revoke all sessions</a></p>
      <p class="text-muted">Revocation is a platform mutation with its own confirmation and audit
      entry. This read surface does not revoke: a link is used so the action keeps one
      implementation.</p>`
    ),
    section(
      "security-mfa",
      "Multi-factor state",
      html`${sourceNotConnected(
        "Enrolment and recovery-code registration have no page in this deployment; step-up verification is served by the identity shell. Nothing on this screen enrols a factor."
      )}
      <p><a class="btn btn-outline" href="/auth/mfa">Step-up verification (identity shell)</a></p>`
    ),
  ].join("\n");
}

/** AUTH-008 — the privacy permissions centre. */
function privacy(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "privacy-centre",
      "What this centre can show",
      html`${sourceNotConnected(
        "There is no consent register or permission ledger to read, so no grant, withdrawal or date is shown. Consent captured with an enquiry is recorded on that enquiry, not as a standing permission, and is not read here."
      )}
      <p>Working paths today:</p>
      <ul>
        <li><a href="/privacy">Privacy notice and data-subject rights</a></li>
        <li>Data privacy export workflow — schedules formal statutory data-subject archives.</li>
      </ul>
      <p class="text-muted">A high-risk processing permission is granted by the accountable privacy role,
      never by the data subject's own screen and never by this page.</p>`
    ),
  ].join("\n");
}

/** AUTH-004 — the challenge lives in the identity shell. */
function mfaChallenge(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "mfa-shell",
      "This challenge is served by the identity shell",
      html`${sourceNotConnected(
        "The inventory names the challenge at this address; the platform serves it at /auth/mfa with a signed single-use challenge, CSRF protection and attempt limits. A second credential field here would be a second, weaker way to authenticate, so this page does not offer one."
      )}
      <p><a class="btn btn-primary" href="/auth/mfa">Continue to the challenge</a></p>`
    ),
  ].join("\n");
}

/** AUTH-012 — recovery lives in the identity shell. */
function recovery(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "recovery-shell",
      "Credential recovery is served by the identity shell",
      html`${sourceNotConnected(
        "This page does not accept an address. The platform's recovery form answers the same regardless of whether an account exists, which is the property that makes it safe to expose; reproducing it here would lose that property."
      )}
      <p><a class="btn btn-primary" href="/auth/recovery">Open account recovery</a></p>
      <p class="text-muted">An operator whose device is lost has a second route: the MFA step-up page links the MCR supervisor.</p>`
    ),
  ].join("\n");
}

/** AUTH-021 — MFA enrolment and recovery setup. */
function mfaEnrolment(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "mfa-enrolment",
      "Enrolment is not connected",
      html`${sourceNotConnected(
        "Step-up verification exists in the identity shell, but there is no enrolment page, no recovery-code issue or reset, and no authenticator registration in this environment. The form is omitted rather than disabled: an enrolment form must verify the factor it registers, and nothing here can."
      )}
      <p><a class="btn btn-outline" href="/auth/mfa">Step-up verification (identity shell)</a>
      <a class="btn btn-outline" href="/support">Ask support to enrol a factor</a></p>`
    ),
  ].join("\n");
}

/** AUTH-002 / AUTH-006 — the two W3 requests with no receiving workflow. */
function requestNotConnected(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "request-path",
      "What would receive this request",
      html`${sourceNotConnected(
        "An account or membership request has to land on an approval workflow owned by a named administrator. No such workflow exists here: registrations arrive by invitation, and organisation membership is recorded as a role binding rather than requested through a form."
      )}
      <p>Working paths today:</p>
      <ul>
        <li><a href="/auth/invitation">Accept an invitation</a></li>
        <li><a href="/access-request">Request access</a></li>
      </ul>`
    ),
  ].join("\n");
}

/** AUTH-023 — membership administration, on the tenant binding that is real. */
function membershipAdmin(screen: IAScreen, ctx: IAGatedPageContext): string {
  const tenant =
    ctx.user.tenantId === undefined
      ? "No tenant is bound to this session, so no membership scope exists to administer."
      : `This session is bound to tenant ${ctx.user.tenantId}.`;
  return [
    gatedHeader(screen, CRUMB),
    section("membership-scope", "Your administrative scope", html`<p>${tenant}</p>`),
    section(
      "membership-register",
      "Members of the organisation",
      html`${sourceNotConnected(
        "Organisation and user-role records exist, but no register is exposed to read members, their invitations or their entitlements. The list is absent rather than empty, because an empty member list would be a claim about the organisation."
      )}
      <p>Revoking a tenant invitation or access (AUTH-024) is a controlled decision hosted on the
      sign-in screen's inventory row and is not offered here.</p>`
    ),
  ].join("\n");
}

/** AUTH-025 — access appeal. */
function appeal(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "appeal",
      "Account and identity access appeal",
      html`${sourceNotConnected(
        "An appeal has to be recorded against a decision that refused access, and read by someone who did not make it. No refusal register exists, so no appeal can reference one."
      )}
      <p>Working paths today:</p>
      <ul>
        <li><a href="/access-request">Request access</a></li>
        <li><a href="/support">Ask support to review a refusal</a></li>
      </ul>`
    ),
  ].join("\n");
}

/** AUTH-003 — contact verification. */
function verifyContact(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "verify",
      "Verification is not connected",
      html`${sourceNotConnected(
        "No verification token store or delivery record is connected, so no address can be verified or re-sent from this page. The form is omitted: a resend control with nothing behind it would confirm nothing."
      )}
      <p><a class="btn btn-outline" href="/support">Ask support to verify a contact method</a></p>`
    ),
  ].join("\n");
}

/**
 * The ten states the inventory hosts on the sign-in screen (AUTH-001). The
 * platform serves `/sign-in` and IA defers to it, so their host is that page —
 * rendered here as one block the platform page includes, rather than restated
 * on a different address.
 */
export function renderSignInHostedStates(): string {
  const host = getIAScreen("AUTH-001");
  if (!host) return "";
  return `<div class="container">${hostedStatesSection(host)}</div>`;
}

export function renderAuthBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("AUTH-")) return undefined;
  switch (screen.id) {
    case "AUTH-003":
      return verifyContact(screen);
    case "AUTH-004":
      return mfaChallenge(screen);
    case "AUTH-007":
      return accountHome(screen, ctx);
    case "AUTH-008":
      return privacy(screen);
    case "AUTH-009":
      return security(screen, ctx);
    case "AUTH-012":
      return recovery(screen);
    case "AUTH-021":
      return mfaEnrolment(screen);
    case "AUTH-002":
    case "AUTH-006":
      return requestNotConnected(screen);
    case "AUTH-023":
      return membershipAdmin(screen, ctx);
    case "AUTH-025":
      return appeal(screen);
    default:
      return undefined;
  }
}
