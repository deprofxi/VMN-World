/**
 * Shared Work Navigation (My Work / Search) — TODO-SCR-09 / TODO-SCR-11
 * Authority: UIUX-001 §8.5 (ordering: blockers → decisions → due → returned →
 * followed; per-row fields; filter scoping; no duplicate tasks across queues).
 *
 * Server-rendered surfaces over the core work graph:
 *   UX-HUB-001 My Work          → aggregateMyWork(userId, roles)
 *   UX-HUB-002 Authorised Search → authorisedSearch (role+tenant scoped)
 *   UX-HUB-003 Notifications     → listInAppNotifications(userId)
 *
 * This module is the worked example of the write boundary (`html` in
 * `components/escape.ts`): every value is interpolated as `${value}` and escaped
 * by the tag, so there is no escaping call here to forget, and a row list is an
 * array of `SafeHtml` rather than a joined string — joining would turn markup back
 * into text and the next interpolation would escape it.
 */

import { html, type SafeHtml } from "../components/escape.js";
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

export function renderMyWorkHtml(
  user: { email: string; roles: string[] },
  tasks: WorkTask[]
): SafeHtml {
  const blockers = tasks.filter((t) => t.priority === 1).length;
  const rows: SafeHtml[] | SafeHtml =
    tasks.length === 0
      ? html`<tr>
          <td colspan="5" class="s-ZmQJhOQnpI">
            Nothing needs your attention right now. Counts shown reflect only records your roles are
            allowed to see.
          </td>
        </tr>`
      : tasks.map(
          (t) => html`
 <tr class="s-EK6K8Vq5tY">
 <td class="s-lr_pOFE4_J"><span class="vmn-badge ${PRIORITY_CLASS[t.priority]}" title="Priority ${t.priority}">${PRIORITY_LABEL[t.priority]}</span></td>
 <td class="s-Hwfj1V3-5C">${t.title}<div class="s-wUMD0XWoZI">${t.context}</div></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">${t.domain}</span></td>
 <td class="s-gi1uIt11_c">${t.reasonActionNeeded}</td>
 <td class="s-gY5FUZdHNU"><a href="${t.route}" class="btn btn-outline s-oEfWPObEZG" >Open</a></td>
      </tr>`
        );

  return html`
    <div class="s-dJGia7etx6">
      <div class="s-jXAzROAz5F">
        <span class="vmn-badge badge-info">OPERATIONAL QUEUE</span>
        <h1 class="s-4hDFIYz_z0">My Work</h1>
        <p class="s-74eGsJhV6B">
          Aggregated from real domain queues for <strong>${user.email}</strong>. Blockers first (${blockers}), then decisions and dated work. The same task never appears twice across queues.
        </p>
      </div>
      <form method="GET" action="/workspace/search" class="s-d4Wqw0sE5f">
        <input type="search" name="q" placeholder="Search assigned tasks, domain records, and decisions..." aria-label="Authorised search query"
          class="s-0uWoFb-c_S" />
        <button type="submit" class="btn btn-primary s-FVU9reuvoK">Search</button>
      </form>
 <div class="vmn-card s-bHj-dI3Drp" >
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-O6cnlXePf8">Priority</th>
 <th class="s-O6cnlXePf8">Task</th>
 <th class="s-O6cnlXePf8">Domain</th>
 <th class="s-O6cnlXePf8">Why it needs you</th>
 <th class="s-RhdStrjBOr">Action</th>
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
): SafeHtml {
  const rows: SafeHtml[] | SafeHtml =
    results.length === 0
      ? html`<tr>
          <td colspan="4" class="s-ZmQJhOQnpI">
            No results for “${query}” within your access scope. Results never include records outside
            your roles or tenant.
          </td>
        </tr>`
      : results.map(
          (r) => html`
 <tr class="s-EK6K8Vq5tY">
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">${r.kind}</span></td>
 <td class="s-Hwfj1V3-5C">${r.title}<div class="s-wUMD0XWoZI">${r.snippet}</div></td>
 <td class="s-CosVFRrD6g">${r.id}</td>
 <td class="s-gY5FUZdHNU"><a href="${r.route}" class="btn btn-outline s-oEfWPObEZG" >Open</a></td>
      </tr>`
        );

  return html`
 <div class="s-dJGia7etx6">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Universal Search <span class="sr-only">&bull; UX-HUB-002</span></span>
 <h1 class="s-4hDFIYz_z0">Authorised Search</h1>
 <p class="s-74eGsJhV6B">
          ${results.length} result(s) for <strong>“${query}”</strong> — scoped to ${user.email}'s roles${user.roles.length ? html` (${user.roles.join(", ")})` : ""} and tenant. Results respect role-based field visibility <span class="sr-only">(CCPP §5.2)</span>.
        </p>
      </div>
 <div class="vmn-card s-bHj-dI3Drp" >
 <table class="s-StXB6StjnQ">
          <thead>
 <tr class="s-vhJLkBexH-">
 <th class="s-O6cnlXePf8">Kind</th>
 <th class="s-O6cnlXePf8">Record</th>
 <th class="s-O6cnlXePf8">Reference</th>
 <th class="s-RhdStrjBOr">Action</th>
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
): SafeHtml {
  const unread = notifications.filter((n) => !n.readAt).length;
  const rows: SafeHtml[] | SafeHtml =
    notifications.length === 0
      ? html`<tr>
          <td colspan="3" class="s-ZmQJhOQnpI">
            No notifications. Delivery respects your UX-SYS-012 preferences.
          </td>
        </tr>`
      : notifications.map(
          (n) => html`
 <tr style="border-bottom: 1px solid var(--vmn-color-border); ${n.readAt ? "opacity: 0.65;" : ""}">
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">${n.category}</span>${n.readAt ? "" : html` <span class="vmn-badge badge-live">NEW</span>`}</td>
 <td class="s-Hwfj1V3-5C">${n.title}<div class="s-5lRpk1R_hM">${n.body}</div></td>
 <td class="s-NhmUJgQGFP">${n.createdAt.toISOString().substring(0, 16).replace("T", " ")} UTC</td>
      </tr>`
        );

  return html`
 <div class="s-6m0XILdru8">
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Unified Tasks &amp; Inbox <span class="sr-only">&bull; UX-HUB-003</span></span>
 <h1 class="s-4hDFIYz_z0">Notifications</h1>
 <p class="s-74eGsJhV6B">${unread} unread for ${user.email}. <a href="/account/notifications">Manage preferences</a>.</p>
      </div>
 <div class="vmn-card s-bHj-dI3Drp" >
 <table class="s-StXB6StjnQ">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}
