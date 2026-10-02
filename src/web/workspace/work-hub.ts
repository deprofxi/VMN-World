/**
 * Shared Work Navigation (My Work / Search) — TODO-SCR-09 / TODO-SCR-11
 * Authority: UIUX-001 §8.5 (ordering: blockers → decisions → due → returned →
 * followed; per-row fields; filter scoping; no duplicate tasks across queues).
 *
 * Server-rendered surfaces over the core work graph:
 *   UX-HUB-001 My Work          → aggregateMyWork(userId, roles)
 *   UX-HUB-002 Authorised Search → authorisedSearch (role+tenant scoped)
 */

import { escapeHtml } from "../components/escape.js";
import { WorkTask, SearchRecord } from "../../core/work/index.js";

const PRIORITY_LABEL: Record<1 | 2 | 3, string> = {
  1: "BLOCKER",
  2: "DECISION",
  3: "TASK",
};

const PRIORITY_CLASS: Record<1 | 2 | 3, string> = {
  1: "badge-live",
  2: "badge-warning",
  3: "badge-neutral",
};

export function renderMyWorkHtml(user: { email: string; roles: string[] }, tasks: WorkTask[]): string {
  const blockers = tasks.filter((t) => t.priority === 1).length;
  const rows =
    tasks.length === 0
      ? `<tr><td colspan="5" style="padding: 28px 14px; text-align: center; color: var(--vmn-color-secondary-text);">
            Nothing needs your attention right now. Counts shown reflect only records your roles are allowed to see.
          </td></tr>`
      : tasks
          .map(
            (t) => `
      <tr style="border-bottom: 1px solid var(--vmn-color-border);">
        <td style="padding: 10px 12px;"><span class="vmn-badge ${PRIORITY_CLASS[t.priority]}" title="Priority ${t.priority}">${PRIORITY_LABEL[t.priority]}</span></td>
        <td style="padding: 10px 12px; font-weight: 700;">${escapeHtml(t.title)}<div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${escapeHtml(t.context)}</div></td>
        <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">${escapeHtml(t.domain)}</span></td>
        <td style="padding: 10px 12px; font-size: 0.85rem; color: var(--vmn-color-secondary-text);">${escapeHtml(t.reasonActionNeeded)}</td>
        <td style="padding: 10px 12px; text-align: right;"><a href="${escapeHtml(t.route)}" class="btn btn-outline" style="min-height: 36px; padding: 0 14px; font-size: 0.8rem;">Open</a></td>
      </tr>`
          )
          .join("");

  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">WORK &bull; UX-HUB-001</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">My Work</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Aggregated from real domain queues for <strong>${escapeHtml(user.email)}</strong>. Blockers first (${blockers}), then decisions and dated work. The same task never appears twice across queues.
        </p>
      </div>
      <form method="GET" action="/workspace/search" style="display: flex; gap: 8px; margin-bottom: 20px;">
        <input type="search" name="q" placeholder="Search records you are authorised to see (UX-HUB-002)" aria-label="Authorised search query"
          style="flex: 1; min-height: 44px; padding: 0 14px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);" />
        <button type="submit" class="btn btn-primary" style="min-height: 44px; padding: 0 20px; font-weight: 700;">Search</button>
      </form>
      <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px;">Priority</th>
              <th style="padding: 12px 14px;">Task</th>
              <th style="padding: 12px 14px;">Domain</th>
              <th style="padding: 12px 14px;">Why it needs you</th>
              <th style="padding: 12px 14px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderSearchResultsHtml(
  user: { email: string; roles: string[] },
  query: string,
  results: Array<SearchRecord & { score: number }>
): string {
  const rows =
    results.length === 0
      ? `<tr><td colspan="4" style="padding: 28px 14px; text-align: center; color: var(--vmn-color-secondary-text);">
            No results for “${escapeHtml(query)}” within your access scope. Results never include records outside your roles or tenant.
          </td></tr>`
      : results
          .map(
            (r) => `
      <tr style="border-bottom: 1px solid var(--vmn-color-border);">
        <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">${escapeHtml(r.kind)}</span></td>
        <td style="padding: 10px 12px; font-weight: 700;">${escapeHtml(r.title)}<div style="font-size: 0.75rem; color: var(--vmn-color-secondary-text);">${escapeHtml(r.snippet)}</div></td>
        <td style="padding: 10px 12px; font-size: 0.8rem; font-family: monospace; color: var(--vmn-color-secondary-text);">${escapeHtml(r.id)}</td>
        <td style="padding: 10px 12px; text-align: right;"><a href="${escapeHtml(r.route)}" class="btn btn-outline" style="min-height: 36px; padding: 0 14px; font-size: 0.8rem;">Open</a></td>
      </tr>`
          )
          .join("");

  return `
    <div style="max-width: 1100px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">SEARCH &bull; UX-HUB-002</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">Authorised Search</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          ${results.length} result(s) for <strong>“${escapeHtml(query)}”</strong> — scoped to ${escapeHtml(user.email)}'s roles${user.roles.length ? ` (${escapeHtml(user.roles.join(", "))})` : ""} and tenant. Snippets respect field scope (CCPP §5.2).
        </p>
      </div>
      <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: var(--vmn-color-background); border-bottom: 2px solid var(--vmn-color-border); text-align: left;">
              <th style="padding: 12px 14px;">Kind</th>
              <th style="padding: 12px 14px;">Record</th>
              <th style="padding: 12px 14px;">Reference</th>
              <th style="padding: 12px 14px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * UX-HUB-003: Notifications inbox (in-app). Backed by the per-user
 * notification records; preferences (UX-SYS-012) suppress opted-out channels.
 */
export interface InboxNotification {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt: Date;
  readAt?: Date | null;
  route?: string;
}

export function renderNotificationsHtml(
  user: { email: string },
  notifications: InboxNotification[]
): string {
  const unread = notifications.filter((n) => !n.readAt).length;
  const rows =
    notifications.length === 0
      ? `<tr><td colspan="3" style="padding: 28px 14px; text-align: center; color: var(--vmn-color-secondary-text);">No notifications. Delivery respects your UX-SYS-012 preferences.</td></tr>`
      : notifications
          .map(
            (n) => `
      <tr style="border-bottom: 1px solid var(--vmn-color-border); ${n.readAt ? "opacity: 0.65;" : ""}">
        <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">${escapeHtml(n.category)}</span>${n.readAt ? "" : ` <span class="vmn-badge badge-live">NEW</span>`}</td>
        <td style="padding: 10px 12px; font-weight: 700;">${escapeHtml(n.title)}<div style="font-size: 0.8rem; color: var(--vmn-color-secondary-text);">${escapeHtml(n.body)}</div></td>
        <td style="padding: 10px 12px; text-align: right; font-size: 0.8rem; color: var(--vmn-color-secondary-text);">${escapeHtml(n.createdAt.toISOString().substring(0, 16).replace("T", " "))} UTC</td>
      </tr>`
          )
          .join("");

  return `
    <div style="max-width: 900px; margin: 32px auto; padding: 0 16px;">
      <div style="margin-bottom: 24px;">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">INBOX &bull; UX-HUB-003</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 8px 0;">Notifications</h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">${unread} unread for ${escapeHtml(user.email)}. <a href="/account/notifications">Manage preferences</a>.</p>
      </div>
      <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}
