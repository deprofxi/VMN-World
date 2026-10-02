/**
 * Broadcast Screen Data Service — honest data layer for the 33 operational
 * screens (todo.md TODO-BCST-01).
 * Authority: UIUX-001 §4.3 — "UX-BR-001 initially presents verified source
 * status and actionable exceptions. It must not display invented audience,
 * revenue or uptime figures."
 *
 * Every KPI carries an explicit provenance: either a real domain source, or an
 * UNAVAILABLE/NOT_CONNECTED state. Fabricated numbers are structurally
 * impossible here: a value is either sourced or it is absent.
 */

export type Provenance = "DOMAIN_ENGINE" | "NOT_CONNECTED" | "PROVISIONAL";

export interface SourcedKpi {
  label: string;
  /** Present only when a real source exists. */
  value?: string;
  provenance: Provenance;
  sourceRef?: string;
  note?: string;
}

export interface ScreenDataContext {
  channels: Array<{ code: string; name: string; isProvisional: boolean }>;
  carriageVerified: boolean;
  approvedScheduleConnected: boolean;
  /** Optional live engines, present when wired by the caller. */
  engines?: {
    billingTotals?: { campaignCode: string; totalValueNgn: number }[];
    asRunSummary?: { totalPlannedSpots: number; totalAiredSpots: number; matchedSpots: number; discrepancyCount: number } | null;
    playoutStatus?: { onAir: boolean; lockedPlaylist: boolean } | null;
    sponsorshipAudit?: { entitlementId: string; fulfillmentPercent: number }[] | null;
  };
}

export interface ScreenDataResult {
  screenId: string;
  kpis: SourcedKpi[];
  /** True when every KPI is sourced from a domain engine. */
  fullySourced: boolean;
}

function unavailable(label: string, note: string): SourcedKpi {
  return { label, provenance: "NOT_CONNECTED", note };
}

/**
 * Returns the honest KPI set for a screen. Never fabricates values.
 */
export function getScreenData(screenId: string, ctx: ScreenDataContext): ScreenDataResult {
  const kpis: SourcedKpi[] = [];

  switch (screenId) {
    case "SCR-BCST-01": {
      kpis.push(
        ctx.approvedScheduleConnected
          ? { label: "Schedule Source", value: "CONNECTED", provenance: "DOMAIN_ENGINE", sourceRef: "scheduling" }
          : unavailable("Schedule Source", "No approved schedule source connected; EPG export is gated (APPROVED_SCHEDULE_UNAVAILABLE)."),
        { label: "Carriage Status", value: ctx.carriageVerified ? "VERIFIED" : "PROVISIONAL — BG6 NOT_TESTED", provenance: ctx.carriageVerified ? "DOMAIN_ENGINE" : "PROVISIONAL", sourceRef: "release-manifest BG6_CARRIAGE" },
        ctx.engines?.asRunSummary
          ? { label: "As-Run Match Rate", value: `${Math.round((ctx.engines.asRunSummary.matchedSpots / Math.max(1, ctx.engines.asRunSummary.totalAiredSpots)) * 100)}%`, provenance: "DOMAIN_ENGINE", sourceRef: "asrun" }
          : unavailable("As-Run Match Rate", "No as-run ingested for the selected date."),
      );
      break;
    }
    case "SCR-BCST-02": {
      kpis.push({
        label: "Channels in Portfolio",
        value: String(ctx.channels.length),
        provenance: "DOMAIN_ENGINE",
        sourceRef: "channel registry",
      });
      for (const ch of ctx.channels) {
        kpis.push({
          label: ch.name,
          value: ch.isProvisional ? "PROVISIONAL" : "ACTIVE",
          provenance: ch.isProvisional ? "PROVISIONAL" : "DOMAIN_ENGINE",
          sourceRef: "channel registry",
        });
      }
      break;
    }
    case "SCR-BCST-14": {
      kpis.push(
        ctx.approvedScheduleConnected
          ? { label: "EPG Feed State", value: "APPROVED SCHEDULE", provenance: "DOMAIN_ENGINE", sourceRef: "epg" }
          : unavailable("EPG Feed State", "XMLTV not published: no approved schedule source (honesty gate)."),
        unavailable("StarTimes Push", "Machine-to-machine EPG push is NOT_CONNECTED pending BG6 carriage interface."),
      );
      break;
    }
    case "SCR-BCST-20": {
      if (ctx.engines?.sponsorshipAudit && ctx.engines.sponsorshipAudit.length > 0) {
        for (const ent of ctx.engines.sponsorshipAudit) {
          kpis.push({ label: `Entitlement ${ent.entitlementId}`, value: `${ent.fulfillmentPercent}%`, provenance: "DOMAIN_ENGINE", sourceRef: "sponsorship" });
        }
      } else {
        kpis.push(unavailable("Sponsorship Fulfillment", "No entitlements registered in the sponsorship engine."));
      }
      break;
    }
    case "SCR-BCST-21":
    case "SCR-BCST-31": {
      if (ctx.engines?.billingTotals && ctx.engines.billingTotals.length > 0) {
        const total = ctx.engines.billingTotals.reduce((sum, t) => sum + t.totalValueNgn, 0);
        kpis.push({ label: "Contracted Value (Engine Totals)", value: `₦${total.toLocaleString("en-NG")}`, provenance: "DOMAIN_ENGINE", sourceRef: "billing engine" });
      } else {
        kpis.push(unavailable("Booked Revenue", "No commercial billing schedules created in the billing engine. Invented revenue figures are prohibited."));
      }
      kpis.push(unavailable("Fill Rate", "Requires as-run + inventory integration (NOT_CONNECTED)."));
      break;
    }
    case "SCR-BCST-23": {
      kpis.push(
        ctx.engines?.playoutStatus
          ? { label: "Playout", value: ctx.engines.playoutStatus.onAir ? "ON AIR (ENGINE)" : "OFF AIR (ENGINE)", provenance: "DOMAIN_ENGINE", sourceRef: "playout" }
          : unavailable("Playout State", "No live playout machine interface (BG6/NOT_CONNECTED)."),
      );
      break;
    }
    case "SCR-BCST-32": {
      kpis.push(unavailable("Audience Ratings", "No audience measurement integration. Invented ratings/share figures are prohibited (UIUX-001 §4.3)."));
      break;
    }
    case "SCR-BCST-33": {
      kpis.push(
        ctx.carriageVerified
          ? { label: "Azeebo+ Attribution", value: "LINKED", provenance: "DOMAIN_ENGINE", sourceRef: "attribution" }
          : unavailable("Azeebo+ Conversion", "Attribution requires on-air campaign telemetry (NOT_CONNECTED)."),
      );
      break;
    }
    default: {
      kpis.push(unavailable("Operational Metrics", "Screen data source integration pending; no figures are fabricated."));
      break;
    }
  }

  return {
    screenId,
    kpis,
    fullySourced: kpis.every((k) => k.provenance === "DOMAIN_ENGINE"),
  };
}

/**
 * Renders the KPI strip HTML for a screen with explicit provenance badges.
 */
export function renderScreenKpis(result: ScreenDataResult, escapeHtml: (s: string) => string): string {
  const badge = (k: SourcedKpi): string => {
    if (k.provenance === "DOMAIN_ENGINE") {
      return `<span class="vmn-badge badge-ready" title="Sourced from ${escapeHtml(k.sourceRef || "domain engine")}">SOURCE: ${escapeHtml(k.sourceRef || "ENGINE")}</span>`;
    }
    if (k.provenance === "PROVISIONAL") {
      return `<span class="vmn-badge badge-warning" title="Provisional value pending verification">PROVISIONAL</span>`;
    }
    return `<span class="vmn-badge badge-neutral" title="Not connected — no data fabricated">NOT CONNECTED</span>`;
  };

  return `
    <div class="vmn-kpi-strip" role="list" aria-label="Screen Key Metrics with Data Provenance">
      ${result.kpis
        .map(
          (k) => `
        <div role="listitem" style="min-height:44px; padding:10px 12px; border:1px solid var(--vmn-color-border); border-radius:8px; margin-bottom:8px;">
          <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--vmn-color-secondary-text);">${escapeHtml(k.label)}</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--vmn-color-primary-text);">${k.value ? escapeHtml(k.value) : `<span style="font-weight:600;">UNAVAILABLE</span>`}</div>
          ${k.note ? `<div style="font-size:0.75rem; color:var(--vmn-color-secondary-text);">${escapeHtml(k.note)}</div>` : ""}
          ${badge(k)}
        </div>`
        )
        .join("")}
    </div>
    ${
      result.fullySourced
        ? ""
        : `<p class="vmn-provenance-note" style="font-size:0.75rem; color:var(--vmn-color-secondary-text);">Data provenance: figures marked NOT CONNECTED have no verified source and are intentionally not fabricated (R1.2A §46 / UIUX-001 §4.3).</p>`
    }
  `;
}

/**
 * Renders the required provenance banner for mock/synthetic screens
 * (DEC-RL1-SCOPE-001 condition C-4; CCPP §1.5 no-silent-substitution).
 */
export function renderMockDataBanner(escapeHtml: (s: string) => string, screenLabel: string): string {
  return `
    <div class="vmn-provenance-banner" role="note" aria-label="Demonstration data notice" style="border:1px solid #B45309; background:#FFFBEB; color:#92400E; padding:10px 14px; border-radius:8px; margin-bottom:16px; font-size:0.85rem;">
      <strong>Demonstration data.</strong> ${escapeHtml(screenLabel)} currently renders illustrative sample records pending its
      accountable owner&#39;s data-source integration (DEC-RL1-SCOPE-001 D-07). Actions on this surface record audit intent only and do
      not mutate canonical records. This surface does not represent live operational capability.
    </div>
  `;
}
