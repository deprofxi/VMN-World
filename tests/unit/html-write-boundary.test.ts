/**
 * The write boundary itself: `html` in `src/web/components/escape.ts`.
 *
 * DEBT-009's ceiling is at zero, but the mechanism behind it was still a call the
 * author had to remember (`escapeHtml(...)`, 871 sites). `html` moves that
 * obligation into the tag: anything interpolated is escaped unless it is already
 * markup, so a renderer written with it has no escaping call to forget. This file
 * is the contract for that primitive, tested on its own rather than through a
 * page, so a regression here is reported as a broken boundary instead of a diff
 * in some screen's markup.
 *
 * The instruments that police the rest of the tree
 * (`tests/unit/html-escape-census.test.ts`, `tests/unit/html-escape-taint.test.ts`)
 * treat the tag as an escape, so the rules below are what those instruments are
 * trusting: one interpolation, one escape, and `SafeHtml` passed through as
 * markup. If this file fails, their verdicts are not meaningful.
 */

import { describe, expect, it } from "vitest";

import { escapeHtml, html, isSafeHtml } from "../../src/web/components/escape.js";

const TAG = `"><script>alert(1)</script>`;
const ATTR = `" onmouseover="steal()`;
/** What the boundary produces for {@link TAG} — quoted, so `"><` never survives. */
const TAG_ESCAPED = `&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;`;

describe("html: escaping at the write boundary", () => {
  it("escapes every interpolation without an escaping call at the site", () => {
    const rendered = String(html`<p title="${ATTR}">${TAG}</p>`);
    expect(rendered).not.toContain(TAG);
    expect(rendered).not.toContain(ATTR);
    expect(rendered).toContain(TAG_ESCAPED);
    // The attribute break is neutralised inside the attribute, not just in text.
    expect(rendered).toContain("&quot; onmouseover=&quot;steal()");
  });

  it("returns markup, not text — so a composed page keeps its tags", () => {
    const fragment = html`<td>${TAG}</td>`;
    expect(isSafeHtml(fragment)).toBe(true);
    const page = String(html`<table><tbody>${fragment}</tbody></table>`);
    // The fragment's own tags pass through; only its value was escaped.
    expect(page).toContain(`<table><tbody><td>${TAG_ESCAPED}</td></tbody></table>`);
    expect(page).toContain("</td></tbody></table>");
    // Escaping twice would print the tags to the reader — the defect the
    // SafeHtml brand exists to prevent.
    expect(page).not.toContain("&lt;td&gt;");
  });

  it("composes a row list as an array, without a join that would erase the markup", () => {
    const rows = [TAG, "safe"].map((value) => html`<tr><td>${value}</td></tr>`);
    const table = String(html`<tbody>${rows}</tbody>`);
    expect(table).toContain(`<tr><td>${TAG_ESCAPED}</td></tr>`);
    expect(table).toContain("<tr><td>safe</td></tr>");
    expect(table).not.toContain("&lt;tr&gt;");
  });

  it("prints 0 and drops null/undefined", () => {
    // A count of zero is a value the reader must see; `undefined` must not print
    // the word.
    expect(String(html`<span>${0}</span>`)).toBe("<span>0</span>");
    expect(String(html`<span>${null}</span>`)).toBe("<span></span>");
    expect(String(html`<span>${undefined}</span>`)).toBe("<span></span>");
  });

  it("escapes a plain object rather than trusting its toString", () => {
    // A record handed to a template is text, never markup — and a hostile
    // `toString` is text too.
    const hostile = { toString: () => TAG };
    expect(String(html`<p>${hostile}</p>`)).toContain("&lt;script&gt;");
    expect(String(html`<p>${hostile}</p>`)).not.toContain("<script>");
  });

  it("recognises SafeHtml from another copy of the module", () => {
    // Two bundles (or a test importing through a different specifier) must agree,
    // or the second copy escapes the first copy's markup. The brand is
    // `Symbol.for`, so a hand-built object with that key is markup.
    const foreign = { value: "<b>x</b>", toString: () => "<b>x</b>", [Symbol.for("vmnl.safe-html")]: true };
    expect(isSafeHtml(foreign)).toBe(true);
    expect(String(html`<div>${foreign}</div>`)).toBe("<div><b>x</b></div>");
    // A plain string is never markup, however it was produced.
    expect(isSafeHtml("<b>x</b>")).toBe(false);
  });

  it("leaves escapeHtml as the single-escape call for strings built outside a template", () => {
    // The legacy form is unchanged: same output, `0` included.
    expect(escapeHtml(TAG)).toBe("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escapeHtml(0)).toBe("0");
    expect(escapeHtml(null)).toBe("");
  });
});
