/**
 * Shared HTML escaping for all web renderers (AUD-18).
 *
 * Every interpolation of request-derived or externally sourced text into
 * markup (titles, IDs, names, breadcrumbs) must pass through this helper.
 * The escaping order escapes `&` first, then the attribute-sensitive quote
 * characters, making the output safe for both element content and
 * double/single-quoted attribute contexts.
 */
export function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
