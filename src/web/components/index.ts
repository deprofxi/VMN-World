/**
 * VMN UI/UX Component System
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / AGENTS.md UI/UX Rules / docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) WS-2
 *
 * Implements full state matrix for UI controls:
 * default, hover, active, focus-visible, disabled, loading, error, empty.
 */

import {
  ButtonProps,
  InputFieldProps,
  StatusChipProps,
  ProvenanceNoticeProps,
} from "./tokens.js";
import { renderIcon } from "./icons.js";

export * from "./tokens.js";
export * from "./icons.js";
export { escapeHtml } from "./escape.js";

export interface LoadingSkeletonProps {
  lines?: number;
  heightPx?: number;
  width?: string;
}

export interface ErrorStateProps {
  title: string;
  message: string;
  retryActionLabel?: string;
  errorCode?: string;
}

export class ComponentRenderer {
  /**
   * Renders semantic, accessible HTML for buttons supporting the full state matrix.
   */
  public static renderButton(props: ButtonProps): string {
    const state = props.state || "default";
    const isDisabled = state === "disabled" || state === "loading";
    const ariaDisabled = isDisabled ? ' aria-disabled="true"' : "";
    const ariaBusy = state === "loading" ? ' aria-busy="true"' : "";
    const ariaLabel = props.ariaLabel ? ` aria-label="${props.ariaLabel}"` : "";
    const onClick = props.onClickHandler ? ` onclick="${props.onClickHandler}"` : "";

    let content = props.label;
    if (state === "loading") {
      content = `${renderIcon("spinner", { size: 16, className: "vmn-spinner-icon" })} Loading...`;
    }

    const classes = [
      "vmn-btn",
      `vmn-btn-${props.variant}`,
      `vmn-btn-state-${state}`,
    ].join(" ");

    return `<button type="button" class="${classes}" style="min-width: 44px; min-height: 44px;"${ariaDisabled}${ariaBusy}${ariaLabel}${onClick}>${content}</button>`;
  }

  /**
   * Renders accessible form input with paired label, state indicator, and aria-invalid.
   */
  public static renderInputField(props: InputFieldProps): string {
    const state = props.state || "default";
    const isInvalid = state === "error";
    const isDisabled = state === "disabled";

    const ariaInvalid = isInvalid ? ` aria-invalid="true" aria-describedby="${props.id}-error"` : "";
    const disabledAttr = isDisabled ? ' disabled aria-disabled="true"' : "";
    const requiredAttr = props.required ? ' required aria-required="true"' : "";

    const errorHtml =
      isInvalid && props.errorMessage
        ? `<div id="${props.id}-error" class="vmn-input-error-msg" role="alert">${renderIcon("alert", { size: 14 })} ${props.errorMessage}</div>`
        : "";

    return `
<div class="vmn-form-field vmn-field-state-${state}">
  <label for="${props.id}" class="vmn-label">${props.label}${props.required ? ' <span class="vmn-required" aria-hidden="true">*</span>' : ""}</label>
  <input id="${props.id}" name="${props.id}" type="text" class="vmn-input" value="${props.value}" placeholder="${props.placeholder || ""}" style="min-height: 44px;"${ariaInvalid}${disabledAttr}${requiredAttr}/>
  ${errorHtml}
</div>`.trim();
  }

  /**
   * Renders StatusChip replacing raw badge-* styles (DT-204).
   * Verified WCAG 2.2 AA text contrast on tinted backgrounds.
   */
  public static renderStatusChip(props: StatusChipProps): string {
    const tone = props.tone || "neutral";
    const pulseDot = props.pulsing ? `<span class="vmn-pulse-dot" aria-hidden="true"></span>` : "";
    let iconHtml = "";

    if (props.icon) {
      iconHtml = renderIcon(props.icon as any, { size: 14 });
    } else if (tone === "live") {
      iconHtml = renderIcon("broadcast", { size: 14 });
    } else if (tone === "success") {
      iconHtml = renderIcon("check", { size: 14 });
    } else if (tone === "warning" || tone === "provisional") {
      iconHtml = renderIcon("alert", { size: 14 });
    } else if (tone === "info" || tone === "neutral") {
      iconHtml = renderIcon("info", { size: 14 });
    }

    return `<span class="status-chip status-chip-${tone}">${pulseDot}${iconHtml}<span>${props.label}</span></span>`;
  }

  /**
   * Renders ProvenanceNotice for unverified/provisional data (DT-203).
   */
  public static renderProvenanceNotice(props: ProvenanceNoticeProps): string {
    const disclaimer = props.disclaimer
      ? `<span class="provenance-disclaimer" style="opacity:0.85;">(${props.disclaimer})</span>`
      : "";
    const sourceHtml = props.source
      ? ` <span class="provenance-source" style="font-size:0.85em; opacity:0.9;">[Source: ${props.source}]</span>`
      : "";

    return `
<div class="provenance-notice" role="note" aria-label="Data Provenance Notice">
  ${renderIcon("alert", { size: 16 })}
  <div>
    <strong>Provenance Notice:</strong> ${props.message}${sourceHtml} ${disclaimer}
  </div>
</div>`.trim();
  }

  /**
   * Renders accessible skeleton placeholder while asynchronous data is loading (DT-205).
   */
  public static renderLoadingSkeleton(props: LoadingSkeletonProps = {}): string {
    const lines = props.lines || 3;
    const height = props.heightPx || 16;
    const width = props.width || "100%";

    const rows = Array.from({ length: lines })
      .map(
        (_, i) =>
          `<div class="vmn-skeleton-line" style="height:${height}px; width:${i === lines - 1 ? "75%" : width}; background: #E2E8F0; border-radius: 4px; margin-bottom: 8px; animation: pulse 1.5s infinite ease-in-out;"></div>`
      )
      .join("");

    return `
<div class="vmn-loading-skeleton" role="status" aria-busy="true" aria-label="Loading content...">
  ${rows}
</div>`.trim();
  }

  /**
   * Renders empty state placeholder with actionable guidance (DT-205, DS-21).
   */
  public static renderEmptyState(title: string, description: string, actionLabel?: string): string {
    const actionBtn = actionLabel
      ? `<div class="vmn-empty-action" style="margin-top: 16px;">${ComponentRenderer.renderButton({ label: actionLabel, variant: "primary" })}</div>`
      : "";

    return `
<div class="vmn-empty-state" role="status" aria-live="polite" style="text-align: center; padding: 48px 24px; border: 1px dashed var(--vmn-color-control-border); border-radius: var(--vmn-radius-md); background: var(--vmn-surface);">
  <div class="vmn-empty-icon" aria-hidden="true" style="margin-bottom: 16px; color: var(--vmn-color-text-muted);">${renderIcon("inbox", { size: 48 })}</div>
  <h3 class="vmn-empty-title" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">${title}</h3>
  <p class="vmn-empty-description" style="color: var(--vmn-color-text-muted); max-width: 480px; margin: 0 auto;">${description}</p>
  ${actionBtn}
</div>`.trim();
  }

  /**
   * Renders resilient error state with action affordance (DT-205).
   */
  public static renderErrorState(props: ErrorStateProps): string {
    const retryBtn = props.retryActionLabel
      ? `<div style="margin-top: 16px;">${ComponentRenderer.renderButton({ label: props.retryActionLabel, variant: "primary" })}</div>`
      : "";
    const codeTag = props.errorCode
      ? `<div style="font-family: var(--vmn-font-mono); font-size: 0.8rem; color: #991B1B; margin-top: 4px;">Code: ${props.errorCode}</div>`
      : "";

    return `
<div class="vmn-error-state" role="alert" style="padding: 24px; border: 1px solid #FCA5A5; background: #FEF2F2; border-radius: var(--vmn-radius-md); color: #991B1B;">
  <div style="display: flex; align-items: flex-start; gap: 12px;">
    <div style="flex-shrink: 0; margin-top: 2px;">${renderIcon("alert", { size: 24 })}</div>
    <div>
      <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 4px 0; color: #991B1B;">${props.title}</h3>
      <p style="margin: 0; font-size: 0.95rem; color: #7F1D1D;">${props.message}</p>
      ${codeTag}
      ${retryBtn}
    </div>
  </div>
</div>`.trim();
  }
}

/**
 * Living Styleguide Page Renderer (DT-202, DT-206)
 * Demonstrates full component state matrix and design token palette.
 */
export function renderStyleguideHtml(): string {
  return `
<div class="styleguide-container">
  <div style="margin-bottom: 32px; border-bottom: 1px solid var(--vmn-color-border); padding-bottom: 16px;">
    <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px;">VMNL Living Design System & Styleguide</h1>
    <p style="color: var(--vmn-color-text-muted); font-size: 1.05rem;">
      Canonical Component State Matrix & Token Specification. Engineered to WCAG 2.2 Level AA standards.
    </p>
  </div>

  <!-- R1.1 Prototype Showcase Banner -->
  <div class="card" style="background: var(--vmn-surface-accent); border: 1px solid #86EFAC; margin-bottom: 36px; padding: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-radius: var(--vmn-radius-panel);">
    <div>
      <span class="vmn-badge badge-ready" style="margin-bottom: 6px;">VMN-UX-RL1 Prototype Architecture</span>
      <h3 style="margin: 0 0 4px 0; font-size: 1.25rem;">Interactive Representative Prototypes</h3>
      <p style="margin: 0; font-size: 0.9rem; color: var(--vmn-color-text-main);">
        Inspect all 8 first-release screens across desktop, tablet, and mobile viewports with simulated operational scenarios (Normal, Stale Data, Blocked, Recovery).
      </p>
    </div>
    <a href="/prototypes" class="btn btn-primary" style="white-space: nowrap;">
      Launch Prototypes Viewer &rarr;
    </a>
  </div>

  <!-- 1. Color Tokens Palette -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">1. Color Tokens (WCAG 2.2 AA/AAA Verified)</h2>
    <div class="vmn-foundation-grid">
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Primary action · Forest</span>
        <p class="vmn-foundation-card-value">#174C3C</p>
        <p class="vmn-foundation-card-note">9.83:1 on white · WCAG AAA</p>
      </article>
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Structure · Slate</span>
        <p class="vmn-foundation-card-value">#172434</p>
        <p class="vmn-foundation-card-note">15.69:1 on white · WCAG AAA</p>
      </article>
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Brand accent · VMN Red</span>
        <p class="vmn-foundation-card-value">#E50914</p>
        <p class="vmn-foundation-card-note">Reserved for brand emphasis, not body text</p>
      </article>
    </div>
  </section>

  <section style="margin-bottom: 48px;" aria-labelledby="styleguide-foundations-title">
    <h2 id="styleguide-foundations-title" style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">Design Foundations</h2>
    <div class="vmn-foundation-grid">
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Layout rhythm</span>
        <p class="vmn-foundation-card-value">4 / 8 px grid</p>
        <p class="vmn-foundation-card-note">Consistent spacing for navigation, content, and dense operational screens.</p>
      </article>
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Type &amp; readability</span>
        <p class="vmn-foundation-card-value">Fluid, responsive</p>
        <p class="vmn-foundation-card-note">System-first typography scales smoothly across mobile and desktop without remote font dependencies.</p>
      </article>
      <article class="vmn-foundation-card">
        <span class="vmn-foundation-card-label">Accessibility baseline</span>
        <p class="vmn-foundation-card-value">AA · 44 px</p>
        <p class="vmn-foundation-card-note">Visible keyboard focus, reduced-motion support, and minimum touch targets are part of the system.</p>
      </article>
    </div>
  </section>

  <!-- Presentation Shells Overview (Docx §2, §5) -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">Three Presentation Shells (Docx §2 &amp; §5)</h2>
    <div class="grid grid-3" style="gap: 16px;">
      <div class="card" style="border-top: 4px solid var(--vmn-color-primary);">
        <span class="vmn-badge badge-info" style="margin-bottom: 8px;">S-PUBLIC</span>
        <h3 style="margin: 0 0 6px 0; font-size: 1.1rem;">Public Discovery Shell</h3>
        <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin: 0 0 12px 0;">
          Editorial layout for channel discovery, admissions, Azeebo+ gateway, and public enquiries.
        </p>
        <a href="/" class="btn btn-outline" style="font-size: 0.8rem; width: 100%;">View Public Home &rarr;</a>
      </div>
      <div class="card" style="border-top: 4px solid #1655BC;">
        <span class="vmn-badge badge-ready" style="margin-bottom: 8px;">S-WORK</span>
        <h3 style="margin: 0 0 6px 0; font-size: 1.1rem;">Workstation Shell</h3>
        <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin: 0 0 12px 0;">
          Operator workbench with 188px navigation rail, priority Blocker Tray, and 1.6:1 two-column split.
        </p>
        <a href="/workspace" class="btn btn-outline" style="font-size: 0.8rem; width: 100%;">Open Workstation &rarr;</a>
      </div>
      <div class="card" style="border-top: 4px solid #FFB800;">
        <span class="vmn-badge badge-warning" style="margin-bottom: 8px;">S-PORTAL</span>
        <h3 style="margin: 0 0 6px 0; font-size: 1.1rem;">Counterparty Portal Shell</h3>
        <p style="font-size: 0.85rem; color: var(--vmn-color-text-muted); margin: 0 0 12px 0;">
          Sponsor and talent portal with verified scope, draft vs released report stamps, and safe terms.
        </p>
        <a href="/prototypes?screen=client" class="btn btn-outline" style="font-size: 0.8rem; width: 100%;">Inspect Client Portal &rarr;</a>
      </div>
    </div>
  </section>

  <!-- 2. Buttons State Matrix -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">2. Button State Matrix (44px Minimum Touch Targets)</h2>
    <div class="card">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px;">
        ${ComponentRenderer.renderButton({ label: "Primary Default", variant: "primary", state: "default" })}
        ${ComponentRenderer.renderButton({ label: "Primary Hover", variant: "primary", state: "hover" })}
        ${ComponentRenderer.renderButton({ label: "Primary Active", variant: "primary", state: "pressed" })}
        ${ComponentRenderer.renderButton({ label: "Primary Focus", variant: "primary", state: "focus-visible" })}
        ${ComponentRenderer.renderButton({ label: "Primary Disabled", variant: "primary", state: "disabled" })}
        ${ComponentRenderer.renderButton({ label: "Primary Loading", variant: "primary", state: "loading" })}
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        ${ComponentRenderer.renderButton({ label: "Secondary Default", variant: "secondary" })}
        ${ComponentRenderer.renderButton({ label: "Outline Action", variant: "outline" })}
        ${ComponentRenderer.renderButton({ label: "Danger Action", variant: "danger" })}
      </div>
    </div>
  </section>

  <!-- 3. Status Chips -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">3. Status Chips (Non-Color Status Encoding)</h2>
    <div class="card" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
      ${ComponentRenderer.renderStatusChip({ label: "ON AIR LIVE", tone: "live", pulsing: true })}
      ${ComponentRenderer.renderStatusChip({ label: "SYNCHRONIZED", tone: "success" })}
      ${ComponentRenderer.renderStatusChip({ label: "SYSTEM INFO", tone: "info" })}
      ${ComponentRenderer.renderStatusChip({ label: "RATE WARNING", tone: "warning" })}
      ${ComponentRenderer.renderStatusChip({ label: "PROVISIONAL CARRIAGE", tone: "provisional" })}
      ${ComponentRenderer.renderStatusChip({ label: "OFFLINE NEUTRAL", tone: "neutral" })}
    </div>
  </section>

  <!-- 4. Provenance Notices -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">4. Data Provenance & Verification Notice (DT-203)</h2>
    ${ComponentRenderer.renderProvenanceNotice({
      message: "StarTimes linear carriage telemetry is currently operating under provisional verification.",
      source: "StarTimes Telemetry Bridge",
      disclaimer: "Subject to monthly manual log reconciliation",
    })}
  </section>

  <!-- 5. Form Fields Matrix -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">5. Form Fields State Matrix</h2>
    <div class="card grid grid-2" style="gap: 24px;">
      <div>
        ${ComponentRenderer.renderInputField({
          id: "styleguide-input-normal",
          label: "Channel Call Sign",
          value: "NXTR-247",
          placeholder: "e.g. NXTR-247",
          required: true,
          state: "default",
        })}
      </div>
      <div>
        ${ComponentRenderer.renderInputField({
          id: "styleguide-input-error",
          label: "Transmission Bitrate (Mbps)",
          value: "-1.5",
          state: "error",
          errorMessage: "Bitrate must be a positive decimal greater than 0.",
        })}
      </div>
    </div>
  </section>

  <!-- 6. Empty & Error States -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">6. Resilient Empty & Error States (DT-205)</h2>
    <div class="grid grid-2" style="gap: 24px;">
      <div>
        ${ComponentRenderer.renderEmptyState(
          "No Scheduled As-Run Logs Found",
          "There are no reconciled broadcast logs recorded for this selected station and daypart.",
          "Ingest New Telemetry Log"
        )}
      </div>
      <div>
        ${ComponentRenderer.renderErrorState({
          title: "Telemetry Stream Ingestion Interrupted",
          message: "Unable to establish handshake with the edge playout server. Check uplink firewall configurations.",
          errorCode: "BCST-ERR-4001",
          retryActionLabel: "Re-establish Uplink Handshake",
        })}
      </div>
    </div>
  </section>

  <!-- 7. Loading Skeletons -->
  <section style="margin-bottom: 48px;">
    <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 16px;">7. Accessible Loading Skeletons</h2>
    <div class="card">
      ${ComponentRenderer.renderLoadingSkeleton({ lines: 4, heightPx: 18 })}
    </div>
  </section>
</div>
  `.trim();
}
