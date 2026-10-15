/**
 * Release Availability Configuration Console (UX-ADM-004)
 * Authority: VMNL-AZP-VMN-UIUX-001 §5.7 / tasks.md §2, §3.21
 *
 * Implements the administrative control center for:
 * - Dynamic runtime feature flag inspection and toggling
 * - Un-deferred operational capabilities monitoring
 * - Safe kill-switch invocation (<500ms latency)
 * - Accessibility-minded markup; full WCAG 2.2 AA conformance is not verified here
 */

import { getAllFeatureFlags } from "../../core/feature-flags/index.js";

export function renderAdminFeatureFlagsHtml(filterDomain?: string): string {
  const allFlags = Object.values(getAllFeatureFlags());
  const domains = Array.from(new Set(allFlags.map((f) => f.domain))).sort();

  const filtered = filterDomain
    ? allFlags.filter((f) => f.domain.toLowerCase() === filterDomain.toLowerCase())
    : allFlags;

  const totalCount = allFlags.length;
  const activeCount = allFlags.filter((f) => f.enabled).length;
  const undeferredCount = allFlags.filter((f) => f.isUndeferred).length;

  const domainFilterButtons = [
 `<a href="/admin/feature-flags" class="btn s--wJWanX93Y ${!filterDomain ? "btn-primary" : "btn-outline"}" >All (${totalCount})</a>`,
    ...domains.map((dom) => {
      const count = allFlags.filter((f) => f.domain === dom).length;
      const isSelected = filterDomain?.toLowerCase() === dom.toLowerCase();
 return `<a href="/admin/feature-flags?domain=${encodeURIComponent(dom)}" class="btn s--wJWanX93Y ${isSelected ? "btn-primary" : "btn-outline"}" >${dom} (${count})</a>`;
    }),
  ].join("\n");

  const cardsHtml = filtered
    .map((f) => {
      const isEnabled = f.enabled;
      const statusBadge = isEnabled
 ? `<span class="s-qA0xoKLTeO">ACTIVE (ENABLED)</span>`
 : `<span class="s-QIk7ov4x3S">INACTIVE (DISABLED)</span>`;

      const undeferredBadge = f.isUndeferred
 ? `<span class="s-GKQ3TuEbjX">UN-DEFERRED</span>`
        : "";

 const sourceBadge = `<span class="s-X260Zgjd7H">SOURCE: ${f.source}</span>`;

      return `
 <article class="card flag-card" style="display:flex; flex-direction:column; justify-content:space-between; border-left: 4px solid ${isEnabled ? "#10B981" : "#EF4444"}; padding: var(--vmn-space-6); background: var(--vmn-surface-card); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div>
 <div class="s-f6KsCxtDCT">
            <div>
 <span class="s-uviTeNx8lj">${f.key}</span>
              ${undeferredBadge}
            </div>
            <div>
              ${statusBadge}
            </div>
          </div>
 <h3 class="s-Bj2mxlMnFu">
 ${f.domain} &mdash; <span class="s-Pq9NylktB7">${f.targetScreens}</span>
          </h3>
 <p class="s-nXHzvt9vO4">
            ${f.description}
          </p>
 <div class="s-RM2bHg2o5a">
 <div class="s--MU1SKnBqO">Kill-Switch & Fallback Policy</div>
 <div class="s-9Md5lCyriM">${f.killSwitchPolicy}</div>
          </div>
        </div>

 <div class="s-vek8O9ioPs">
          <div>${sourceBadge}</div>
 <form method="POST" action="/api/v1/feature-flags/${f.key}/toggle" class="s-Han6y01weT">
            <input type="hidden" name="enabled" value="${isEnabled ? "false" : "true"}" />
            <input type="hidden" name="redirect" value="/admin/feature-flags${filterDomain ? `?domain=${encodeURIComponent(filterDomain)}` : ""}" />
 <button type="submit" class="btn s-KVW2aekM_D ${isEnabled ? "btn-secondary button button--secondary" : "btn-primary button button--primary"}" >
              ${isEnabled ? "Disable (Kill Switch)" : "Enable Feature"}
            </button>
          </form>
        </div>
      </article>
      `;
    })
    .join("\n");

  return `
 <div class="container s-bJt7BJCshA" >
 <header class="s-8KqcJvoCxL">
 <div class="s-n4vSWy6lTS">
 <span class="s-VlHOXqFjVb">UX-ADM-004</span>
 <span class="s-2-oQGPaezd">Enterprise Governance & Administration</span>
        </div>
 <h1 class="s-GOhckqDSDP">
          Release Availability & Feature Flag Console
        </h1>
 <p class="s-kXc3Wrk_-x">
          Zero-Deferral Execution Control Hub. All 225 screens and 10 domain operational workflows are active in code and gated via runtime evaluation.
        </p>

 <div class="s-5WiPFCGzxg">
 <div class="card s-0NKVVV4K-j" >
 <div class="s-YYDY41b3FZ">Total Registered Flags</div>
 <div class="s-0RS6BY6Y_w">${totalCount}</div>
          </div>
 <div class="card s-rw39Qa-Zj7" >
 <div class="s-YYDY41b3FZ">Currently Active (Enabled)</div>
 <div class="s-pVX5qU5GSi">${activeCount}</div>
          </div>
 <div class="card s-Du059TkFFH" >
 <div class="s-YYDY41b3FZ">Un-Deferred Capabilities</div>
 <div class="s-cadi_EoZ4m">${undeferredCount}</div>
          </div>
        </div>
      </header>

 <section class="s-MCZWkljUQG">
 <h2 class="s-XIGijOmzMk">Filter by Operational Domain</h2>
 <div class="s-1ZI_XSBQyN">
          ${domainFilterButtons}
        </div>
      </section>

 <section class="s-OCPuZDD8yF">
        ${cardsHtml}
      </section>
    </div>
  `;
}
