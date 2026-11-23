/**
 * VMN World IA R1.1 — CIRC journey (J12): ONE CIRCLE.
 *
 * ONE CIRCLE is where an employee reads what is true and acts on their own
 * work. Three sources in this deployment are real — the work aggregator, the
 * in-app inbox and the notification preferences — so three surfaces show
 * records. Every other surface states that its register is not connected and
 * shows no count, date or status (plan decision D2).
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import {
  getNotificationPreferences,
  listInAppNotifications,
} from "../../core/auth/sessions.js";
import { aggregateMyWork, type WorkTask } from "../../core/work/index.js";
import { html, type SafeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";
import {
  circleNav,
  formatInstant,
  gatedHeader,
  pendingTable,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import type { IAScreen } from "./types.js";

const CRUMB = [{ label: "ONE CIRCLE", href: "/circle" }];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function taskTable(tasks: readonly WorkTask[], caption: string): SafeHtml {
  if (tasks.length === 0) {
    return html`<div class="provenance-notice" role="status">
        <strong>No task is assigned to this account.</strong>
        Seven sources register with the work aggregator — approvals, admissions, enquiries,
        content, cases, rights and finance — and none returned a task scoped to this session.
        An empty list is a state, not a measurement: it says nothing about the work that exists
        in the company, only that none of it is yours here.
        <a href="/workspace/my-work">The operator work queue</a> applies the same scoping.
      </div>`;
  }

  const rows = tasks.map(
    (task) => html`<tr>
          <td>${String(task.priority)}</td>
          <th scope="row">${task.title}</th>
          <td>${task.domain}</td>
          <td>${task.state}</td>
          <td>${task.reasonActionNeeded}</td>
          <td>${task.dueAt ? formatInstant(task.dueAt) : "No due date recorded"}</td>
          <td><a href="${task.route}">Open</a></td>
        </tr>`
  );

  return html`<div class="table-scroll">
      <table>
        <caption>${caption}</caption>
        <thead>
          <tr>
            <th scope="col">Priority</th><th scope="col">Task</th><th scope="col">Domain</th>
            <th scope="col">State</th><th scope="col">Why it needs you</th>
            <th scope="col">Due</th><th scope="col">Record</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/** The seven gates a `W1`/`W2` reader is told about, resolved from the registry. */
const ENTRY_SCREENS: readonly string[] = [
  "CIRC-005",
  "CIRC-008",
  "CIRC-009",
  "CIRC-023",
  "CIRC-025",
  "MISS-001",
  "CAP-001",
];

function entryPoints(screen: IAScreen): SafeHtml {
  const links = ENTRY_SCREENS.filter((id) => id !== screen.id).flatMap((id) => {
    const target = getIAScreen(id);
    if (!target) return [];
    return [
      html`<li><a href="${target.route}">${target.screenName}</a> — ${target.primaryAction}</li>`,
    ];
  });
  return html`<ul>${links}</ul>`;
}

function home(screen: IAScreen, ctx: IAGatedPageContext): string {
  const tasks = aggregateMyWork(ctx.user.userId, ctx.user.roles);
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "circle-work",
      "Your work, from the sources that are connected",
      taskTable(tasks, `Tasks aggregated for ${ctx.user.email}`)
    ),
    section("circle-entries", "Where ONE CIRCLE goes", entryPoints(screen)),
    section(
      "circle-read-only",
      "What this home can and cannot tell you",
      html`${sourceNotConnected(
        "Company notices, SOP activation, the knowledge library and the capability directory have no register in this environment, so their tiles are entry points rather than summaries. Nothing on this page is a company-wide figure."
      )}
      <p>The work list above is real: it is the same access-scoped aggregation the operator queue reads, de-duplicated by task ID and ordered blockers → decisions → due.</p>`
    ),
  ]
    .filter((part) => String(part).length > 0)
    .join("\n");
}

/**
 * The three work overviews are `W2` rows scoped by archetype — builder, problem
 * solver, coach. This deployment's task domains are business domains, and no
 * authority maps one to the other, so the overview shows the operator's real
 * scoped work and says plainly that the archetype filter is not applied rather
 * than inventing a mapping (canonical law 13; plan §2.1).
 */
function workOverview(screen: IAScreen, ctx: IAGatedPageContext): string {
  const tasks = aggregateMyWork(ctx.user.userId, ctx.user.roles);
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      `overview-${screen.id}`,
      "Your work in this view",
      html`${taskTable(tasks, `Tasks in ${screen.screenName}`)}
      <p class="text-muted">
        This view is scoped to the archetype named in the inventory row. No authority maps that
        archetype onto this deployment's task domains, so the list is every task scoped to your
        session rather than a filtered subset — a filter invented here would be a business
        decision, not a requirement.
      </p>`
    ),
  ].join("\n");
}

function askVmn(screen: IAScreen): string {
  const knowledge = getIAScreen("CIRC-008");
  const knowledgeBlock = knowledge
    ? html`<p><a class="btn btn-outline" href="${knowledge.route}">${knowledge.screenName}</a></p>`
    : null;
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "ask-unavailable",
      "Ask VMN is not connected",
      html`${sourceNotConnected(
        "There is no knowledge model, index or answer store in this environment, so no question can be answered. The form is present and disabled rather than absent, so the surface states what it will do without accepting an input nothing would receive."
      )}
      <fieldset disabled aria-describedby="ask-disabled-reason">
        <legend>Ask a question about company knowledge</legend>
        <p id="ask-disabled-reason" class="text-muted">
          Unavailable until a knowledge source is connected. Disabled controls cannot be submitted.
        </p>
        <label for="ask-question">Your question</label>
        <input id="ask-question" name="question" type="text" autocomplete="off" />
        <button type="submit" class="btn btn-primary">Ask</button>
      </fieldset>`
    ),
    section(
      "ask-contract",
      "What an answer will carry when it exists",
      html`<ul>
        <li>A citation to the policy or SOP revision it rests on, not a claim without a source.</li>
        <li>An explicit <em>not found</em> state when the library does not cover the question.</li>
        <li>A route to report an incorrect or conflicting answer (CIRC-007), recorded as a request.</li>
        <li>No answer that decides a rights, finance, safeguarding or employment question — those stay with the accountable role.</li>
      </ul>
      <h3>Meanwhile</h3>
      ${knowledgeBlock}`
    ),
  ].join("\n");
}

function knowledgeLibrary(screen: IAScreen): string {
  const sops = getIAScreen("CIRC-009");
  const sopLink = sops
    ? html`<p><a class="btn btn-outline" href="${sops.route}">${sops.screenName}</a></p>`
    : null;
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "knowledge-registers",
      "Registers this library would draw on",
      html`${sourceNotConnected(
        "No policy register, version store or publication log is connected, so no document, revision or effective date can be shown."
      )}
      ${pendingTable(
        "Company knowledge and policy library",
        ["Document", "Revision", "Owner", "Effective from", "Supersedes", "Publication evidence"],
        "No connected register. Rows appear here when a policy source is connected."
      )}
      ${sopLink}`
    ),
  ].join("\n");
}

function sopCatalogue(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "sop-register",
      "The catalogue",
      html`${sourceNotConnected(
        "The inventory names this catalogue, but no SOP register is connected, so no identifier, title, owner or activation date is listed. The 161 identifiers are a property of the authority, not a list this environment can produce."
      )}
      ${pendingTable(
        "SOP catalogue",
        ["SOP identifier", "Procedure", "Owner", "Status", "Effective from", "Last activation"],
        "No connected SOP register. Rows appear here when one is connected."
      )}`
    ),
    section(
      "sop-states",
      "What the catalogue will refuse to do",
      html`<p>The inventory's own adverse states apply before any procedure is read: not adopted, test not run, withdrawn, superseded, or ownership unclear. Each of those is a state the catalogue must show instead of a procedure, and each keeps its row on this screen.</p>`
    ),
  ].join("\n");
}

function sopDetail(screen: IAScreen, ctx: IAGatedPageContext): string {
  const requested = ctx.params["sop-id"] ?? "";
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "sop-requested",
      "Requested procedure",
      html`${sourceNotConnected(
        "No SOP register is connected, so this identifier cannot be resolved to a procedure. The identifier below is what the address asked for, not a record that exists."
      )}
      <p>Requested identifier: <code>${requested}</code></p>
      <p class="text-muted">A resolved procedure would show its owner, revision, activation evidence and the states that block it. None of those exist here, so none are shown.</p>`
    ),
  ].join("\n");
}

function capabilityDirectory(screen: IAScreen): string {
  const cap = getIAScreen("CAP-001");
  const capLink = cap
    ? html`<p><a class="btn btn-outline" href="${cap.route}">${cap.screenName}</a></p>`
    : null;
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "capability-directory",
      "Capability directory",
      html`${sourceNotConnected(
        "There is no capability, skill or role-coverage model in this deployment's schema, so no person, team, skill or availability can be listed. The public capability directory describes what VMN does as a company; it is not this internal directory and is not substituted for it."
      )}
      ${pendingTable(
        "Company capability directory",
        ["Capability", "Team", "Named owner", "Coverage", "Evidence"],
        "No connected capability register. Rows appear here when one is connected."
      )}
      ${capLink}`
    ),
  ].join("\n");
}

/**
 * The one CIRC surface whose record is the session itself: the operator's own
 * roles and contact identity. The capability half of the row has no model, so
 * it is declared absent rather than inferred from a role name.
 */
function capabilityProfile(screen: IAScreen, ctx: IAGatedPageContext): string {
  const roles =
    ctx.user.roles.length === 0
      ? [html`<li>No role is recorded on this session.</li>`]
      : ctx.user.roles.map((role) => html`<li>${role}</li>`);
  const tenant =
    ctx.user.tenantId === undefined
      ? html`<p>No tenant is bound to this session.</p>`
      : html`<p>Tenant: <code>${ctx.user.tenantId}</code></p>`;
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "profile-identity",
      "Your identity as this session records it",
      html`<p>Contact address: <code>${ctx.user.email}</code></p>
      ${tenant}
      <p>Multi-factor authentication on this session: ${
        ctx.user.mfaEnabled ? "enrolled" : "not recorded"
      }</p>
      <h3>Roles recorded on this session</h3>
      <ul>${roles}</ul>
      <p class="text-muted">These are the roles the server authorises against, not a display choice.</p>`
    ),
    section(
      "profile-capability",
      "The capability half of this profile",
      html`${sourceNotConnected(
        "Skills, professional scopes, supervision and capability review have no model in this deployment, so the profile stops at identity and role. Roles are not converted into skills, because a role name is not evidence of a professional scope."
      )}`
    ),
  ].join("\n");
}

function decisionsAndNotices(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "notices",
      "Current decisions and notices",
      html`${sourceNotConnected(
        "No notice register is connected, so no decision, notice or acknowledgement date is shown. Mandatory acknowledgement (CIRC-024) is hosted on this screen and states its own contract below."
      )}
      ${pendingTable(
        "Current company decisions and notices",
        ["Notice", "Decision owner", "Issued", "Effective from", "Applies to", "Acknowledgement required"],
        "No connected notice register. Rows appear here when one is connected."
      )}`
    ),
  ].join("\n");
}

/**
 * The inbox is real: `listInAppNotifications` returns what
 * `deliverInAppNotification` stored, and the preference record is the one the
 * dispatcher actually honours. Both are durable (`InAppNotificationRecord`,
 * `NotificationPreferenceRecord`) and hydrated at boot, so the empty state means
 * nothing was delivered to this account — not that a restart forgot it, and not
 * that an opt-out silently reverted.
 */
function inbox(screen: IAScreen, ctx: IAGatedPageContext): string {
  const records = listInAppNotifications(ctx.user.userId);
  const items =
    records.length === 0
      ? html`<div class="provenance-notice" role="status">
          <strong>No notification is held for this account.</strong>
          Deliveries and their read state are stored rows, so this is the empty state rather than a
          restart artefact. The workspace inbox applies the same preferences and marks items read.
        </div>`
      : html`<ul class="card-list">${records.map(
          (record) => html`<li>
              <strong>${record.title}</strong>
              <span class="status-chip badge-neutral">${record.category}</span>
              <span class="status-chip ${record.readAt ? "badge-neutral" : "badge-info"}">${record.readAt ? "Read" : "Unread"}</span>
              <p>${record.body}</p>
              <p class="text-muted">Delivered ${formatInstant(record.createdAt)}</p>
              ${record.route ? html`<a href="${record.route}">Open the record</a>` : null}
            </li>`
        )}</ul>`;

  const prefs = getNotificationPreferences(ctx.user.userId);
  const onOff = (value: boolean): string => (value ? "On" : "Off");

  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section("inbox-records", "Delivered to you", html`${items}
      <p><a class="btn btn-outline" href="/workspace/notifications">Open the workspace inbox (marks items read)</a></p>`),
    section(
      "inbox-preferences",
      "Notification preferences these deliveries obey",
      html`<p>These are the stored preferences the dispatcher consults before delivering: a category set to Off suppresses the notification instead of queueing it.</p>
      <dl>
        <dt>Email</dt><dd>${onOff(prefs.email)}</dd>
        <dt>SMS</dt><dd>${onOff(prefs.sms)}</dd>
        <dt>In-app</dt><dd>${onOff(prefs.inApp)}</dd>
        <dt>Playout disruption</dt><dd>${onOff(prefs.categories.playoutDisruption)}</dd>
        <dt>Rights blocks</dt><dd>${onOff(prefs.categories.rightsBlocks)}</dd>
        <dt>Finance approvals</dt><dd>${onOff(prefs.categories.financeApprovals)}</dd>
        <dt>Admissions decisions</dt><dd>${onOff(prefs.categories.admissionsDecisions)}</dd>
      </dl>
      <p class="text-muted">System notifications are delivered regardless of category preference. Change these on the <a href="/account/notifications">notification preference screen</a>.</p>`
    ),
  ].join("\n");
}

function supportAndHelp(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "support",
      "Support and process-help requests",
      html`${sourceNotConnected(
        "There is no support-request register in this environment, so no ticket, age or owner is shown. The public support and contact routes are the working paths today; a request filed there is recorded by that channel, not by this screen."
      )}
      <p><a class="btn btn-outline" href="/support">Support</a>
      <a class="btn btn-outline" href="/contact">Contact VMN</a></p>`
    ),
  ].join("\n");
}

function policyChangeRequest(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "policy-change",
      "Why no change form is offered",
      html`${sourceNotConnected(
        "A policy change request would need a document register to point at and an approval category to route to. Neither exists: there is no policy model, and the approval register has no category for policy or knowledge. A form here would collect a request and discard it."
      )}
      <p>The inventory's own route for a knowledge steward review is CIRC-018; both screens state the same absence.</p>`
    ),
  ].join("\n");
}

function stewardQueue(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "steward-queue",
      "Review queue",
      html`${sourceNotConnected(
        "No knowledge review queue is connected, so no item, owner or wait time is shown."
      )}
      ${pendingTable(
        "Knowledge steward review queue",
        ["Item", "Source conflict", "Raised by", "Raised", "Age", "Assigned steward"],
        "No connected review queue. Rows appear here when one is connected."
      )}`
    ),
  ].join("\n");
}

function sourceConflictCase(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "conflict-case",
      "Knowledge source conflict",
      html`${sourceNotConnected(
        "A source conflict case would be a case record naming two documents and their revisions. No document register exists to point at, so the case cannot be raised or read here."
      )}
      <p>Approving a source replacement (CIRC-020) is a controlled decision hosted on this screen and is never made by the requester.</p>`
    ),
  ].join("\n");
}

function correctionCase(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    circleNav(screen.id),
    section(
      "correction-case",
      "Knowledge answer correction",
      html`${sourceNotConnected(
        "A correction case needs an answer to correct. There is no answer store, and the case register's types do not include a knowledge correction, so this surface cannot name a case without inventing either the answer or the case type."
      )}
      <p>Reporting an incorrect answer (CIRC-007) is hosted on the Ask VMN screen, where the answer would have been read.</p>`
    ),
  ].join("\n");
}

/** The bespoke CIRC body, or undefined so the contract renderer takes the screen. */
export function renderCircBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("CIRC-")) return undefined;
  switch (screen.id) {
    case "CIRC-001":
      return home(screen, ctx);
    case "CIRC-002":
    case "CIRC-003":
    case "CIRC-004":
      return workOverview(screen, ctx);
    case "CIRC-005":
      return askVmn(screen);
    case "CIRC-008":
      return knowledgeLibrary(screen);
    case "CIRC-009":
      return sopCatalogue(screen);
    case "CIRC-010":
      return sopDetail(screen, ctx);
    case "CIRC-017":
      return policyChangeRequest(screen);
    case "CIRC-018":
      return stewardQueue(screen);
    case "CIRC-019":
      return sourceConflictCase(screen);
    case "CIRC-021":
      return capabilityDirectory(screen);
    case "CIRC-022":
      return capabilityProfile(screen, ctx);
    case "CIRC-023":
      return decisionsAndNotices(screen);
    case "CIRC-025":
      return inbox(screen, ctx);
    case "CIRC-027":
      return supportAndHelp(screen);
    case "CIRC-032":
      return correctionCase(screen);
    default:
      return undefined;
  }
}
