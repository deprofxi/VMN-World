/**
 * Shared HTML escaping for all web renderers (AUD-18).
 *
 * Two ways to write markup, in order of preference:
 *
 *   - `html` — a tagged template that escapes every interpolation *at the write
 *     boundary*. `${userInput}` is escaped by construction, so the author cannot
 *     forget the call, and a nested `html` fragment is inserted as markup without
 *     a second escape. This is the form new renderers should use.
 *   - `escapeHtml(value)` — the explicit call the sweep wrapped 1,012 sites in. It
 *     stays because most of the tree is written that way, and because a value that
 *     is assembled outside a template (an attribute string, a URL path) still has
 *     to be escaped by hand.
 *
 * The escaping order escapes `&` first, then the attribute-sensitive quote
 * characters, making the output safe for both element content and
 * double/single-quoted attribute contexts.
 */
export function escapeHtml(str?: string | number | null): string {
  // Explicit null/undefined test, not a truthiness check: a count of `0` is a
  // value the reader must see (`0 slots`, not ` slots`), and widening the
  // parameter to numbers made the old `if (!str)` return "" for it.
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Compile-time brand for markup this module produced. Declared rather than
 * exported: no caller can mint a `SafeHtml` by hand, and a plain `string` — a
 * request field, a record's title — does not satisfy it. The runtime test is the
 * `Symbol.for` key below, so a `SafeHtml` from another copy of this module (or a
 * second bundle) is still recognised as markup rather than escaped a second time.
 */
declare const safeHtmlBrand: unique symbol;

/** Markup that is already escaped. Interpolate it into an `html` template as-is. */
export interface SafeHtml {
  readonly [safeHtmlBrand]: true;
  readonly value: string;
  toString(): string;
}

/** One key per realm: `Symbol.for` so a second module instance answers correctly. */
const SAFE_HTML = Symbol.for("vmnl.safe-html");

export function isSafeHtml(value: unknown): value is SafeHtml {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<symbol, unknown>)[SAFE_HTML] === true
  );
}

/**
 * One interpolation of an `html` template.
 *
 * Markup passes through, everything else is escaped as text — that single rule is
 * the write boundary. Arrays are interpolated element by element, which is how a
 * `.map(…)` row list composes without `.join("")` (joining first would produce a
 * plain string, and interpolating that would escape the tags the rows just built).
 * `null`/`undefined` render as nothing so an optional branch does not print
 * "undefined"; a number prints itself, `0` included.
 */
function interpolate(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (isSafeHtml(value)) return value.value;
  if (Array.isArray(value)) return value.map(interpolate).join("");
  return escapeHtml(typeof value === "number" ? value : String(value));
}

/**
 * Tagged template for markup. Every `${…}` is escaped unless it is itself
 * `SafeHtml`, so an unescaped interpolation is not something the author can write.
 *
 * The result is a value, not a string: `SafeHtml.toString()` returns the markup,
 * so a plain template (`${html`…`}`) or `res.end(body)` still works, while
 * `escapeHtml(safeValue)` is a type error — escaping twice prints `&lt;tr&gt;` to
 * the reader, which is the defect this type exists to prevent.
 */
export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): SafeHtml {
  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i += 1) {
    out += interpolate(values[i]);
    out += strings[i + 1] ?? "";
  }
  // The computed key is the `Symbol.for` brand checked by `isSafeHtml`; the cast
  // is the one place the compile-time brand and the runtime key are tied together.
  return { value: out, toString: () => out, [SAFE_HTML]: true } as unknown as SafeHtml;
}
