/**
 * VMN UI/UX Component System
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / AGENTS.md UI/UX Rules
 *
 * Implements full state matrix for UI controls:
 * default, hover, active, focus-visible, disabled, loading, error, empty.
 */

import { ButtonProps, InputFieldProps, ComponentState, DESIGN_TOKENS } from "./tokens.js";

export * from "./tokens.js";

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

    let content = props.label;
    if (state === "loading") {
      content = `<span class="vmn-spinner" aria-hidden="true"></span> Loading...`;
    }

    const classes = [
      "vmn-btn",
      `vmn-btn-${props.variant}`,
      `vmn-btn-state-${state}`,
    ].join(" ");

    return `<button type="button" class="${classes}" style="min-width: 44px; min-height: 44px;"${ariaDisabled}${ariaBusy}${ariaLabel}>${content}</button>`;
  }

  /**
   * Renders accessible form input with paired label, state indicator, and aria-invalid.
   */
  public static renderInputField(props: InputFieldProps): string {
    const state = props.state || "default";
    const isInvalid = state === "error";
    const isDisabled = state === "disabled";

    const ariaInvalid = isInvalid ? ' aria-invalid="true" aria-describedby="${props.id}-error"' : "";
    const disabledAttr = isDisabled ? ' disabled aria-disabled="true"' : "";
    const requiredAttr = props.required ? ' required aria-required="true"' : "";

    const errorHtml =
      isInvalid && props.errorMessage
        ? `<div id="${props.id}-error" class="vmn-input-error-msg" role="alert"><span aria-hidden="true">⚠️</span> ${props.errorMessage}</div>`
        : "";

    return `
<div class="vmn-form-field vmn-field-state-${state}">
  <label for="${props.id}" class="vmn-label">${props.label}${props.required ? ' <span class="vmn-required" aria-hidden="true">*</span>' : ""}</label>
  <input id="${props.id}" name="${props.id}" type="text" class="vmn-input" value="${props.value}" placeholder="${props.placeholder || ""}" style="min-height: 44px;"${ariaInvalid}${disabledAttr}${requiredAttr}/>
  ${errorHtml}
</div>`.trim();
  }

  /**
   * Renders empty state placeholder with actionable guidance.
   */
  public static renderEmptyState(title: string, description: string, actionLabel?: string): string {
    const actionBtn = actionLabel
      ? `<div class="vmn-empty-action">${ComponentRenderer.renderButton({ label: actionLabel, variant: "primary" })}</div>`
      : "";

    return `
<div class="vmn-empty-state" role="status" aria-live="polite">
  <div class="vmn-empty-icon" aria-hidden="true">📂</div>
  <h3 class="vmn-empty-title">${title}</h3>
  <p class="vmn-empty-description">${description}</p>
  ${actionBtn}
</div>`.trim();
  }
}
