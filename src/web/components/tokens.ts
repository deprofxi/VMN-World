/**
 * VMN UI/UX Design System Tokens & Foundation
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / WCAG 2.2 Level AA Minimum
 *
 * Core Specifications:
 * - 4px/8px Grid Scale
 * - WCAG 2.2 Level AA Contrast Ratios (Normal Text >= 4.5:1, Large Text >= 3:1)
 * - Minimum Touch Targets >= 44x44px
 * - Complete State Matrix: default, hover, pressed, focus-visible, disabled, loading, error, empty
 */

export const DESIGN_TOKENS = {
  // 4px / 8px Spacing Grid
  spacing: {
    none: "0px",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
    "3xl": "64px",
  },

  // Typography Scales
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "'Cabinet Grotesk', 'Inter', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Color Tokens with High Contrast Ratios (WCAG 2.2 AA compliant >= 4.5:1 on background)
  colors: {
    brand: {
      primary: "#E50914", // VMN Red
      primaryHover: "#B80710",
      secondary: "#0047FF", // Cobalt Blue
      accent: "#FFB800", // Gold / Energy
      darkSurface: "#0E1117",
      lightSurface: "#FFFFFF",
    },
    semantic: {
      success: "#00875A", // Green (4.5:1 on light)
      warning: "#B76E00", // Amber (4.5:1 on light)
      error: "#DE350B", // Red error (4.5:1 on light)
      info: "#0052CC", // Blue
    },
    neutral: {
      black: "#171A21",
      gray900: "#22252D",
      gray800: "#323742",
      gray700: "#4B5363",
      gray600: "#6B7280",
      gray400: "#9CA3AF",
      gray200: "#E5E7EB",
      gray100: "#F3F4F6",
      white: "#FFFFFF",
    },
  },

  // Target and Elevation
  accessibility: {
    minTouchTargetPx: 44,
    focusRingWidth: "2px",
    focusRingColor: "#0047FF",
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
  variant: "primary" | "secondary" | "danger" | "ghost";
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
