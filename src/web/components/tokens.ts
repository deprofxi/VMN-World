/**
 * VMN UI/UX Design System Tokens & Foundation
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference) §3.1 / WCAG 2.2 Level AA Minimum
 *
 * Core Specifications:
 * - 4px/8px Grid Scale
 * - WCAG 2.2 Level AA Contrast Ratios (Normal Text >= 4.5:1, Large Text / Graphical >= 3:1)
 * - Minimum Touch Targets >= 44x44px (48px for operator consoles)
 * - Complete State Matrix: default, hover, pressed, focus-visible, disabled, loading, error, empty
 * - Single canonical palette resolving DS-07, DS-08, DS-09, DS-10
 */

export const DESIGN_TOKENS = {
  // 4px / 8px Spacing Grid
  spacing: {
    none: "0px",
    xs: "4px",   // --vmn-space-1
    sm: "8px",   // --vmn-space-2
    md: "16px",  // --vmn-space-4
    lg: "24px",  // --vmn-space-6
    xl: "32px",  // --vmn-space-7
    "2xl": "48px", // --vmn-space-8
    "3xl": "64px", // --vmn-space-9
    panelPadding: "22px",
    panelPaddingCompact: "18px",
    contentPadding: "28px",
    contentPaddingCompact: "20px 16px",
    sidebarWidth: "188px",
    twoColumnRatio: "1.6 / 1",
  },

  // Typography Scales (Docx Section 7.2)
  typography: {
    fontFamily: {
      sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      display: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
    },
    fontSize: {
      metadata: "13px",
      xs: "12px",
      sm: "14px",
      base: "16px",
      sectionHeading: "21px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      pageTitleCompact: "26px",
      pageTitle: "30px",
      heroCompact: "32px",
      "3xl": "30px",
      "4xl": "36px",
      hero: "46px",
    },
    lineHeight: {
      tight: 1.25,
      heading: 1.35,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Radii Tokens (Docx Section 7.2: 8px control, 10px panel)
  radii: {
    sm: "4px",
    control: "8px",
    panel: "10px",
    full: "9999px",
  },

  // §3.1 / §7.1 Canonical Reconciled Palette (High Contrast, WCAG 2.2 AA/AAA Verified)
  colors: {
    // Primary & Brand Controls (Restrained Forest Green & Slate Baseline)
    primary: "#174C3C",         // 9.83:1 on white (WCAG AAA Pass)
    primaryHover: "#0E2B20",    // 15.69:1 on white
    secondary: "#172434",       // 15.69:1 on white (Dark Slate)
    brand: "#E50914",           // VMN Red (4.79:1 on white, brand accents / large text)
    accent: "#FFB800",          // Gold graphical fill (non-text fills & rules)

    // Linear Channel Brand Tokens
    channels: {
      nxtr: "#E50914",
      oris: "#FFB800",
      imbd: "#0369A1",
    },

    // Semantic Status Tokens (Foreground + Background + Border)
    success: {
      text: "#166534",          // 6.19:1 on success bg (>= 4.5:1 AA pass)
      bg: "#DCFCE7",
      border: "#86EFAC",
    },
    live: {
      text: "#991B1B",          // 7.51:1 on live bg (>= 4.5:1 AA pass)
      bg: "#FFF0F0",
      border: "#FCA5A5",
    },
    info: {
      text: "#075985",          // 6.58:1 on info bg (>= 4.5:1 AA pass)
      bg: "#E0F2FE",
      border: "#BAE6FD",
    },
    warning: {
      text: "#8A3410",          // 7.50:1 on warning bg (>= 4.5:1 AA pass)
      bg: "#FFF4E6",
      border: "#FDE68A",
    },
    neutral: {
      text: "#334155",          // 9.61:1 on neutral bg (>= 4.5:1 AA pass)
      bg: "#F1F5F9",
      border: "#CBD5E1",
    },

    // Boundaries & Controls (Docx §7.1 / DT-104)
    border: "#D8DEE6",          // Decorative separator (#D8DEE6 in Light)
    controlBorder: "#718096",   // Form input/select/button borders: 4.02:1 on white (>= 3:1 AA pass)

    // Surfaces & Text (Docx §7.1)
    canvas: "#F3F5F7",          // Application canvas background
    surface: "#FFFFFF",         // Content card surface
    surfaceAlt: "#EAF4EF",      // Supporting accent surface / soft emphasis
    surfaceDark: "#172434",     // Content surface in dark mode / MCR
    textMain: "#172434",        // 15.69:1 on white (Primary text)
    textMuted: "#475569",       // 7.58:1 on white (Secondary / Muted text)
    textSubtle: "#64748B",      // 4.77:1 on white (>= 14px text)
    focus: "#1655BC",           // High-contrast focus indicator (6.86:1 on white)

    // Dark Mode Palette (Docx §7.1)
    dark: {
      canvas: "#101922",
      surface: "#172434",
      textMain: "#F1F5F9",
      textMuted: "#C2CBD6",
      primary: "#A5E8CD",
      textOnPrimary: "#0E2B20",
      accentSurface: "#193D32",
      border: "#46576B",
      controlBorder: "#A1B0C1",
      warningText: "#FFCC9B",
      warningSurface: "#38241E",
      errorText: "#FFC2C2",
      errorSurface: "#3B2025",
      focus: "#9AC3FF",
    },
  },

  // Target and Elevation
  accessibility: {
    minTouchTargetPx: 44,
    operatorMinTouchTargetPx: 48,
    focusRingWidth: "3px",
    focusRingColor: "#1655BC",
    focusRingOffset: "2px",
  },
} as const;

export type ComponentState =
  | "default"
  | "hover"
  | "pressed"
  | "focus-visible"
  | "disabled"
  | "loading"
  | "error"
  | "empty";

export interface ButtonProps {
  label: string;
  variant: "primary" | "secondary" | "danger" | "ghost" | "outline";
  state?: ComponentState;
  ariaLabel?: string;
  onClickHandler?: string;
}

export interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  state?: ComponentState;
  errorMessage?: string;
  required?: boolean;
}

export interface StatusChipProps {
  label: string;
  tone: "live" | "success" | "info" | "warning" | "neutral" | "provisional";
  icon?: string;
  pulsing?: boolean;
}

export interface ProvenanceNoticeProps {
  message: string;
  source?: string;
  disclaimer?: string;
}

/**
 * Converts 3 or 6 digit hex colour code to [R, G, B] values in 0..255.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();
  const fullHex = cleanHex.length === 3
    ? cleanHex.split("").map((c) => c + c).join("")
    : cleanHex;
  const num = parseInt(fullHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates standard WCAG 2.1 / 2.2 Relative Luminance for an sRGB hex code.
 */
export function calculateRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio between two hex colors according to WCAG 2.2 specifications.
 * Result ranges from 1.0 to 21.0.
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = calculateRelativeLuminance(fgHex);
  const l2 = calculateRelativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Canonical Token Contrast Specification & Evidence Ladder
 * Used by automated CI tests (DT-103) to ensure no contrast regressions occur.
 */
export const TOKEN_CONTRAST_SPEC = [
  { name: "--vmn-color-primary", fg: DESIGN_TOKENS.colors.primary, bg: "#FFFFFF", requiredRatio: 4.5, description: "Primary action button and active link text on white" },
  { name: "--vmn-color-primary-hover", fg: DESIGN_TOKENS.colors.primaryHover, bg: "#FFFFFF", requiredRatio: 4.5, description: "Primary hover state text on white" },
  { name: "--vmn-color-secondary", fg: DESIGN_TOKENS.colors.secondary, bg: "#FFFFFF", requiredRatio: 4.5, description: "Dark headings & text on white" },
  { name: "--vmn-color-brand", fg: DESIGN_TOKENS.colors.brand, bg: "#FFFFFF", requiredRatio: 3.0, description: "VMN brand mark / large heading accent" },
  { name: "--vmn-color-success-text", fg: DESIGN_TOKENS.colors.success.text, bg: DESIGN_TOKENS.colors.success.bg, requiredRatio: 4.5, description: "Success status text on tinted chip" },
  { name: "--vmn-color-live-text", fg: DESIGN_TOKENS.colors.live.text, bg: DESIGN_TOKENS.colors.live.bg, requiredRatio: 4.5, description: "Live broadcast / error text on tinted chip" },
  { name: "--vmn-color-info-text", fg: DESIGN_TOKENS.colors.info.text, bg: DESIGN_TOKENS.colors.info.bg, requiredRatio: 4.5, description: "Informational badge text on tinted chip" },
  { name: "--vmn-color-warning-text", fg: DESIGN_TOKENS.colors.warning.text, bg: DESIGN_TOKENS.colors.warning.bg, requiredRatio: 4.5, description: "Warning status text on tinted chip" },
  { name: "--vmn-color-text-main", fg: DESIGN_TOKENS.colors.textMain, bg: "#FFFFFF", requiredRatio: 4.5, description: "Main body text on white" },
  { name: "--vmn-color-text-muted", fg: DESIGN_TOKENS.colors.textMuted, bg: "#FFFFFF", requiredRatio: 4.5, description: "Secondary text on white" },
  { name: "--vmn-color-text-subtle", fg: DESIGN_TOKENS.colors.textSubtle, bg: "#FFFFFF", requiredRatio: 4.5, description: "Subtle metadata (>= 14px) on white" },
  { name: "--vmn-color-control-border", fg: DESIGN_TOKENS.colors.controlBorder, bg: "#FFFFFF", requiredRatio: 3.0, description: "Control boundaries on white (WCAG 1.4.11 non-text contrast)" },
  { name: "--vmn-color-focus", fg: DESIGN_TOKENS.colors.focus, bg: "#FFFFFF", requiredRatio: 3.0, description: "Focus indicator ring against surface" },
] as const;

/**
 * Validates WCAG 2.2 AA standards for interactive controls.
 */
export function validateControlAccessibility(control: {
  widthPx: number;
  heightPx: number;
  hasAccessibleLabel: boolean;
  hasAriaState: boolean;
}): { compliant: boolean; errors: string[] } {
  const errors: string[] = [];

  if (control.widthPx < DESIGN_TOKENS.accessibility.minTouchTargetPx) {
    errors.push(
      `[A11Y-01] Touch target width (${control.widthPx}px) is below minimum ${DESIGN_TOKENS.accessibility.minTouchTargetPx}px.`
    );
  }

  if (control.heightPx < DESIGN_TOKENS.accessibility.minTouchTargetPx) {
    errors.push(
      `[A11Y-02] Touch target height (${control.heightPx}px) is below minimum ${DESIGN_TOKENS.accessibility.minTouchTargetPx}px.`
    );
  }

  if (!control.hasAccessibleLabel) {
    errors.push("[A11Y-03] Interactive control lacks an accessible name or aria-label.");
  }

  return {
    compliant: errors.length === 0,
    errors,
  };
}
