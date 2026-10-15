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
import { renderIcon, IconName } from "./icons.js";
import { escapeHtml } from "./escape.js";

export * from "./tokens.js";
export * from "./icons.js";
export { escapeHtml } from "./escape.js";
export * from "./episode-masters.js";

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
    const variants = ["primary", "secondary", "danger", "ghost", "outline"] as const;
    const states = ["default", "hover", "pressed", "focus-visible", "disabled", "loading", "error", "empty"] as const;
    const variant = variants.includes(props.variant as typeof variants[number]) ? props.variant as typeof variants[number] : "primary";
    const state = props.state && states.includes(props.state as typeof states[number]) ? props.state as typeof states[number] : "default";
    const isDisabled = state === "disabled" || state === "loading";
    const ariaDisabled = isDisabled ? ' aria-disabled="true"' : "";
    const ariaBusy = state === "loading" ? ' aria-busy="true"' : "";
    const ariaLabel = props.ariaLabel ? ` aria-label="${escapeHtml(props.ariaLabel)}"` : "";
    const actionAttr = props.onClickHandler ? ` data-action="${escapeHtml(props.onClickHandler)}"` : "";

    let content = escapeHtml(props.label);
    if (state === "loading") {
      content = `${renderIcon("spinner", { size: 16, className: "vmn-spinner-icon" })} Loading...`;
    }

    const classes = [
      "vmn-btn",
      `vmn-btn-${variant}`,
      `vmn-btn-state-${state}`,
    ].join(" ");

 return `<button type="button" class="${classes} s-uFwdajinpr" ${ariaDisabled}${ariaBusy}${ariaLabel}${actionAttr}>${content}</button>`;
  }

  /**
   * Renders accessible form input with paired label, state indicator, and aria-invalid.
   */
  public static renderInputField(props: InputFieldProps): string {
    const states = ["default", "hover", "pressed", "focus-visible", "disabled", "loading", "error", "empty"] as const;
    const state = props.state && states.includes(props.state as typeof states[number]) ? props.state as typeof states[number] : "default";
    const safeId = escapeHtml(props.id);
    const isInvalid = state === "error";
    const isDisabled = state === "disabled";

    const ariaInvalid = isInvalid ? ` aria-invalid="true" aria-describedby="${safeId}-error"` : "";
    const disabledAttr = isDisabled ? ' disabled aria-disabled="true"' : "";
    const requiredAttr = props.required ? ' required aria-required="true"' : "";

    const errorHtml =
      isInvalid && props.errorMessage
        ? `<div id="${safeId}-error" class="vmn-input-error-msg" role="alert">${renderIcon("alert", { size: 14 })} ${escapeHtml(props.errorMessage)}</div>`
        : "";

    return `
<div class="vmn-form-field vmn-field-state-${state}">
  <label for="${safeId}" class="vmn-label">${escapeHtml(props.label)}${props.required ? ' <span class="vmn-required" aria-hidden="true">*</span>' : ""}</label>
 <input id="${safeId}" name="${safeId}" type="text" class="vmn-input s-GP5FDgmEZf" value="${escapeHtml(props.value)}" placeholder="${escapeHtml(props.placeholder || "")}" ${ariaInvalid}${disabledAttr}${requiredAttr}/>
  ${errorHtml}
</div>`.trim();
  }

  /**
   * Renders StatusChip replacing raw badge-* styles (DT-204).
   * Verified WCAG 2.2 AA text contrast on tinted backgrounds.
   */
  public static renderStatusChip(props: StatusChipProps): string {
    const allowedTones = ["live", "success", "info", "warning", "neutral", "provisional"] as const;
    const tone = allowedTones.includes(props.tone as typeof allowedTones[number]) ? props.tone as typeof allowedTones[number] : "neutral";
    const pulseDot = props.pulsing ? `<span class="vmn-pulse-dot" aria-hidden="true"></span>` : "";
    let iconHtml = "";

    const iconNames: IconName[] = ["broadcast", "antenna", "lock", "folder", "document", "bolt", "alert", "warning", "inbox", "empty", "hourglass", "spinner", "check", "download", "info", "search", "chevronRight", "send", "calendar", "film", "shield", "play", "refresh", "clock", "chart", "xCircle", "tv", "sun", "moon", "menu", "x", "command", "user"];
    const safeIcon = typeof props.icon === "string" && iconNames.includes(props.icon as IconName) ? props.icon as IconName : undefined;
    if (safeIcon) {
      iconHtml = renderIcon(safeIcon, { size: 14 });
    } else if (tone === "live") {
      iconHtml = renderIcon("broadcast", { size: 14 });
    } else if (tone === "success") {
      iconHtml = renderIcon("check", { size: 14 });
    } else if (tone === "warning" || tone === "provisional") {
      iconHtml = renderIcon("alert", { size: 14 });
    } else if (tone === "info" || tone === "neutral") {
      iconHtml = renderIcon("info", { size: 14 });
    }

    return `<span class="status-chip status-chip-${tone}">${pulseDot}${iconHtml}<span>${escapeHtml(props.label)}</span></span>`;
  }

  /**
   * Renders ProvenanceNotice for unverified/provisional data (DT-203).
   */
  public static renderProvenanceNotice(props: ProvenanceNoticeProps): string {
    const disclaimer = props.disclaimer
 ? `<span class="provenance-disclaimer s-uYaziOvnwy" >(${escapeHtml(props.disclaimer)})</span>`
      : "";
    const sourceHtml = props.source
 ? ` <span class="provenance-source s-41KCHIiQy5" >[Source: ${escapeHtml(props.source)}]</span>`
      : "";

    return `
<div class="provenance-notice" role="note" aria-label="Data Provenance Notice">
  ${renderIcon("alert", { size: 16 })}
  <div>
    <strong>Provenance Notice:</strong> ${escapeHtml(props.message)}${sourceHtml} ${disclaimer}
  </div>
</div>`.trim();
  }

  /**
   * Renders accessible skeleton placeholder while asynchronous data is loading (DT-205).
   */
  public static renderLoadingSkeleton(props: LoadingSkeletonProps = {}): string {
    const lines = Number.isInteger(props.lines) ? Math.min(12, Math.max(1, props.lines!)) : 3;
    const height = Number.isInteger(props.heightPx) ? Math.min(400, Math.max(1, props.heightPx!)) : 16;
    const requestedWidth = props.width || "100%";
    const width = /^(100|[1-9]?\d)%$/.test(requestedWidth) || /^\d{1,4}(px|rem)$/.test(requestedWidth) ? requestedWidth : "100%";

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
 ? `<div class="vmn-empty-action s-0mWmubkRs3" >${ComponentRenderer.renderButton({ label: actionLabel, variant: "primary" })}</div>`
      : "";

    return `
<div class="vmn-empty-state s-gL5bnGjInx" role="status" aria-live="polite" >
 <div class="vmn-empty-icon s-f0udfBR-jp" aria-hidden="true" >${renderIcon("inbox", { size: 48 })}</div>
 <h3 class="vmn-empty-title s-mdl9T4T5FU" >${escapeHtml(title)}</h3>
 <p class="vmn-empty-description s-1OIeVVVuRI" >${escapeHtml(description)}</p>
  ${actionBtn}
</div>`.trim();
  }

  /**
   * Renders resilient error state with action affordance (DT-205).
   */
  public static renderErrorState(props: ErrorStateProps): string {
    const retryBtn = props.retryActionLabel
 ? `<div class="s-0mWmubkRs3">${ComponentRenderer.renderButton({ label: props.retryActionLabel, variant: "primary" })}</div>`
      : "";
    const codeTag = props.errorCode
 ? `<div class="s-OVCPXaGto7">Code: ${escapeHtml(props.errorCode)}</div>`
      : "";

    return `
<div class="vmn-error-state s-0X4cIIckia" role="alert" >
 <div class="s-STdn5Pyea8">
 <div class="s-BK3-_R3yB-">${renderIcon("alert", { size: 24 })}</div>
    <div>
 <h3 class="s-gZM3PnzqB8">${escapeHtml(props.title)}</h3>
 <p class="s-kzLLCipvLX">${escapeHtml(props.message)}</p>
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
 <div class="s-i9z1ngnRgk">
 <h1 class="s-wI1qW9LmYg">VMNL Living Design System & Styleguide</h1>
 <p class="s-TeKJLhWjrY">
      Canonical Component State Matrix & Token Specification. Accessibility characteristics require independent evaluation for each workflow and assistive technology.
    </p>
  </div>

  <!-- R1.1 Prototype Showcase Banner -->
 <div class="card s-f2qYLRTcZk" >
    <div>
 <span class="vmn-badge badge-ready s-T-7fjmEHMj" >VMN-UX-RL1 Prototype Architecture</span>
 <h3 class="s-ke5oDEmePG">Interactive Representative Prototypes</h3>
 <p class="s-4d76DPsh2d">
        Inspect all 8 first-release screens across desktop, tablet, and mobile viewports with simulated operational scenarios (Normal, Stale Data, Blocked, Recovery).
      </p>
    </div>
 <a href="/prototypes" class="btn btn-primary s-k8bh1Lt-AT" >
      Launch Prototypes Viewer &rarr;
    </a>
  </div>

  <!-- 1. Color Tokens Palette -->
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">1. Color Tokens (contrast values are design targets; verify in context)</h2>
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

 <section class="s-VH3WyOOC5H" aria-labelledby="styleguide-foundations-title">
 <h2 id="styleguide-foundations-title" class="s-Gq0p87FzNT">Design Foundations</h2>
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
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">Three Presentation Shells (Docx §2 &amp; §5)</h2>
 <div class="grid grid-3 s-8ZIgmkRZGT" >
 <div class="card s-iXOSygMEgb" >
 <span class="vmn-badge badge-info s-fzy69kMBd1" >S-PUBLIC</span>
 <h3 class="s-pmn1SFRFxA">Public Discovery Shell</h3>
 <p class="s-j8CUrUlyn5">
          Editorial layout for channel discovery, admissions, Azeebo+ gateway, and public enquiries.
        </p>
 <a href="/" class="btn btn-outline s-CA8Lk2-5Tg" >View Public Home &rarr;</a>
      </div>
 <div class="card s-87JfJJ5PuL" >
 <span class="vmn-badge badge-ready s-fzy69kMBd1" >S-WORK</span>
 <h3 class="s-pmn1SFRFxA">Workstation Shell</h3>
 <p class="s-j8CUrUlyn5">
          Operator workbench with 188px navigation rail, priority Blocker Tray, and 1.6:1 two-column split.
        </p>
 <a href="/workspace" class="btn btn-outline s-CA8Lk2-5Tg" >Open Workstation &rarr;</a>
      </div>
 <div class="card s-8YvkPKKI0f" >
 <span class="vmn-badge badge-warning s-fzy69kMBd1" >S-PORTAL</span>
 <h3 class="s-pmn1SFRFxA">Counterparty Portal Shell</h3>
 <p class="s-j8CUrUlyn5">
          Sponsor and talent portal with verified scope, draft vs released report stamps, and safe terms.
        </p>
 <a href="/prototypes?screen=client" class="btn btn-outline s-CA8Lk2-5Tg" >Inspect Client Portal &rarr;</a>
      </div>
    </div>
  </section>

  <!-- 2. Buttons State Matrix -->
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">2. Button State Matrix (44px Minimum Touch Targets)</h2>
    <div class="card">
 <div class="s-nYnSQCz6yS">
        ${ComponentRenderer.renderButton({ label: "Primary Default", variant: "primary", state: "default" })}
        ${ComponentRenderer.renderButton({ label: "Primary Hover", variant: "primary", state: "hover" })}
        ${ComponentRenderer.renderButton({ label: "Primary Active", variant: "primary", state: "pressed" })}
        ${ComponentRenderer.renderButton({ label: "Primary Focus", variant: "primary", state: "focus-visible" })}
        ${ComponentRenderer.renderButton({ label: "Primary Disabled", variant: "primary", state: "disabled" })}
        ${ComponentRenderer.renderButton({ label: "Primary Loading", variant: "primary", state: "loading" })}
      </div>
 <div class="s-t_fTx9c6se">
        ${ComponentRenderer.renderButton({ label: "Secondary Default", variant: "secondary" })}
        ${ComponentRenderer.renderButton({ label: "Outline Action", variant: "outline" })}
        ${ComponentRenderer.renderButton({ label: "Danger Action", variant: "danger" })}
      </div>
    </div>
  </section>

  <!-- 3. Status Chips -->
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">3. Status Chips (Non-Color Status Encoding)</h2>
 <div class="card s-t_fTx9c6se" >
      ${ComponentRenderer.renderStatusChip({ label: "ON AIR LIVE", tone: "live", pulsing: true })}
      ${ComponentRenderer.renderStatusChip({ label: "SYNCHRONIZED", tone: "success" })}
      ${ComponentRenderer.renderStatusChip({ label: "SYSTEM INFO", tone: "info" })}
      ${ComponentRenderer.renderStatusChip({ label: "RATE WARNING", tone: "warning" })}
      ${ComponentRenderer.renderStatusChip({ label: "PROVISIONAL CARRIAGE", tone: "provisional" })}
      ${ComponentRenderer.renderStatusChip({ label: "OFFLINE NEUTRAL", tone: "neutral" })}
    </div>
  </section>

  <!-- 4. Provenance Notices -->
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">4. Data Provenance & Verification Notice (DT-203)</h2>
    ${ComponentRenderer.renderProvenanceNotice({
      message: "StarTimes linear carriage telemetry is currently operating under provisional verification.",
      source: "StarTimes Telemetry Bridge",
      disclaimer: "Subject to monthly manual log reconciliation",
    })}
  </section>

  <!-- 5. Form Fields Matrix -->
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">5. Form Fields State Matrix</h2>
 <div class="card grid grid-2 s-EJ3KpNnbe_" >
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
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">6. Resilient Empty & Error States (DT-205)</h2>
 <div class="grid grid-2 s-EJ3KpNnbe_" >
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
 <section class="s-VH3WyOOC5H">
 <h2 class="s-Gq0p87FzNT">7. Accessible Loading Skeletons</h2>
    <div class="card">
      ${ComponentRenderer.renderLoadingSkeleton({ lines: 4, heightPx: 18 })}
    </div>
  </section>
</div>
  `.trim();
}
