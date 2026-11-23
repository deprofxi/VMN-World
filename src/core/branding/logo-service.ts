/**
 * VMN Brand Identity & Logo Configuration Service
 * Authority: PRD R1.3C, Design System Standards
 *
 * Provides dynamic brand customization, logo upload management, and persistence
 * across all public and enterprise interfaces.
 */

export interface BrandConfig {
  logoUrl: string | null;
  brandName: string;
  brandShort: string;
  tagline: string;
  updatedAt: string;
}

const DEFAULT_BRAND_CONFIG: BrandConfig = {
  logoUrl: null,
  brandName: "Virtual Media Network Limited",
  brandShort: "VMNL",
  tagline: "Enterprise Linear Playout & Creative Economy Hubs",
  updatedAt: new Date().toISOString(),
};

let currentBrandConfig: BrandConfig = { ...DEFAULT_BRAND_CONFIG };

/**
 * Returns current brand identity and logo configuration.
 */
export function getBrandConfig(): BrandConfig {
  return { ...currentBrandConfig };
}

/**
 * Updates the network logo (data URL or hosted asset URL).
 */
export function updateBrandLogo(params: {
  logoDataUrl: string;
  brandName?: string;
  brandShort?: string;
  tagline?: string;
}): { success: boolean; config: BrandConfig } {
  if (!params.logoDataUrl || typeof params.logoDataUrl !== "string") {
    throw new Error("[BRAND-001] Valid logo data URL or image path is required.");
  }

  const trimmed = params.logoDataUrl.trim();
  const isValidFormat =
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/assets/") ||
    trimmed.startsWith("/uploads/");

  if (!isValidFormat) {
    throw new Error("[BRAND-002] Logo must be a valid image data URL (SVG, PNG, WebP) or URL path.");
  }

  // Enforce a sensible 2MB ceiling on inline data URIs
  if (trimmed.length > 2_500_000) {
    throw new Error("[BRAND-003] Logo image payload exceeds maximum allowed size (2MB).");
  }

  currentBrandConfig = {
    logoUrl: trimmed,
    brandName: params.brandName?.trim() || currentBrandConfig.brandName,
    brandShort: params.brandShort?.trim() || currentBrandConfig.brandShort,
    tagline: params.tagline?.trim() || currentBrandConfig.tagline,
    updatedAt: new Date().toISOString(),
  };

  return { success: true, config: { ...currentBrandConfig } };
}

/**
 * Resets the network logo and branding to factory default.
 */
export function resetBrandLogo(): BrandConfig {
  currentBrandConfig = {
    ...DEFAULT_BRAND_CONFIG,
    updatedAt: new Date().toISOString(),
  };
  return { ...currentBrandConfig };
}
