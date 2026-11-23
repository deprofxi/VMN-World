/**
 * TSK-42 (report.md §6): "the extent of unescaped interpolation into rendered
 * HTML", measured as a test instead of argued as an opinion.
 *
 * This instrument used to carry a **ceiling**: the count of bare expressions
 * interpolated into markup on a line that did not call `escapeHtml(`, pinned at
 * 251 so it could only shrink. The burn-down is finished, so the ceiling is gone
 * and the rule is now the stronger one:
 *
 *   An interpolation into markup is unescaped when **neither** the line escapes it
 *   nor the value's own definition proves it escaped.
 *
 * The second half matters because escaping twice is not more secure, it is
 * wrong — `escapeHtml(escapeHtml("O'Brien"))` prints `O&amp;#039;Brien` to the
 * reader. The proof is shared with the taint instrument
 * (`tests/helpers/escaped-markup.ts`): an assignment from `escapeHtml(...)`/`esc(...)`/
 * `sanitize*`/`encodeURIComponent`, or from a statement builder that escapes
 * *every* interpolation it composes, is escaped at its definition. A partial
 * fragment — one unescaped interpolation in the same statement — is not.
 *
 * The remaining tests settle three things the sweep cannot state by itself: that
 * the escape helper actually neutralises the characters that break text,
 * attribute and URL contexts, that the rule is capable of failing, and that an
 * `html` template is recognised as the boundary at all. A sweep that returned
 * zero because the scanner broke — or because it stopped following the tag —
 * would be the worst possible result, so the rule is fed synthetic files that
 * must produce exactly one finding each, and a tag probe that must produce none.
 *
 * The tag is the write-boundary form: `${value}` inside `html`…`` is escaped by
 * the tag unless the value is `SafeHtml`, so a renderer written that way has no
 * escaping call to forget. `tests/unit/html-write-boundary.test.ts` holds the
 * primitive; this file holds the rule that reads it. A property named `html`
 * (`templates.html`…``) is not the tag and is still judged as plain markup.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { escapeHtml } from "../../src/web/components/escape.js";
import {
  unescapedInterpolations,
  type EscapedFragment,
  type MarkupSource,
} from "../helpers/escaped-markup.js";

/**
 * Variables that hold escaped *markup*, not text. Escaping one again would print
 * its tags to the reader, so the sweep accepts them and the proof below keeps each
 * entry honest.
 *
 * This is the only hand-written knowledge in the sweep: a fragment assembled in
 * several statements, or by a helper that escapes its own leaves, cannot be proved
 * from one assignment. Each entry names the escaping that makes it markup, so a
 * reviewer can check the claim instead of trusting the list.
 */
export const ESCAPED_FRAGMENTS: readonly EscapedFragment[] = [
  {
    site: "src/web/components/index.ts::ariaLabel",
    reason: "An attribute string whose value is escaped where the attribute is composed.",
    proof: /ariaLabel[\s\S]{0,90}escapeHtml\(props\.ariaLabel\)/,
  },
  {
    site: "src/web/components/index.ts::actionAttr",
    reason: "An attribute string whose value is escaped where the attribute is composed.",
    proof: /actionAttr[\s\S]{0,90}escapeHtml\(props\.onClickHandler\)/,
  },
  {
    site: "src/web/components/index.ts::ariaInvalid",
    reason:
      "An attribute string composed from `safeId`, which is itself `escapeHtml(props.id)` one line above.",
    proof: /const safeId = escapeHtml\(props\.id\)[\s\S]{0,160}aria-describedby="\$\{safeId\}-error"/,
  },
  {
    site: "src/web/components/index.ts::ariaDisabled",
    reason: "A fixed attribute string (`aria-disabled=\"true\"`), empty when not disabled — literals only.",
    proof: /ariaDisabled = isDisabled \? ' aria-disabled="true"' : "";/,
  },
  {
    site: "src/web/components/index.ts::ariaBusy",
    reason: "A fixed attribute string (`aria-busy=\"true\"`), empty when not loading — literals only.",
    proof: /ariaBusy = state === "loading" \? ' aria-busy="true"' : "";/,
  },
  {
    site: "src/web/components/index.ts::disabledAttr",
    reason: "A fixed attribute string (`disabled aria-disabled=\"true\"`), empty when enabled — literals only.",
    proof: /disabledAttr = isDisabled \? ' disabled aria-disabled="true"' : "";/,
  },
  {
    site: "src/web/components/index.ts::requiredAttr",
    reason: "A fixed attribute string (`required aria-required=\"true\"`), empty when optional — literals only.",
    proof: /requiredAttr = props\.required \? ' required aria-required="true"' : "";/,
  },
  {
    site: "src/web/workspace/governance-and-operations.ts::fourEyesTag",
    reason:
      "A literal `<span>` badge (\"FOUR-EYES\") with no interpolated value, empty when the approval does not need a second approver.",
    proof: /fourEyesTag =[\s\S]{0,220}>FOUR-EYES<\/span>/,
  },
  {
    site: "src/web/components/index.ts::content",
    reason:
      "Button content: the label branch escapes with `escapeHtml`, the loading branch is icon markup from `renderIcon` plus literal text.",
    proof: /let content = escapeHtml\(props\.label\)[\s\S]{0,200}renderIcon\('spinner'|let content = escapeHtml\(props\.label\)[\s\S]{0,200}renderIcon\("spinner"/,
  },
  {
    site: "src/web/components/index.ts::pulseDot",
    reason: "Status-chip decoration: a fixed `<span>` built by the component, no reader-supplied text.",
    proof: /pulseDot[\s\S]{0,140}<span/,
  },
  {
    site: "src/web/components/index.ts::iconHtml",
    reason: "Icon markup returned by `renderIcon`, whose own label is escaped before interpolation.",
    proof: /iconHtml = renderIcon\(/,
  },
  {
    site: "src/web/components/index.ts::sourceHtml",
    reason: "Provenance source badge: escaped where the badge is composed, empty when absent.",
    proof: /sourceHtml[\s\S]{0,140}escapeHtml\(props\.source\)/,
  },
  {
    site: "src/web/components/index.ts::disclaimer",
    reason: "Provenance disclaimer: escaped where the disclaimer is composed, empty when absent.",
    proof: /disclaimer[\s\S]{0,140}escapeHtml\(props\.disclaimer\)/,
  },
  {
    site: "src/web/ia/gated-parts.ts::trail",
    reason: "Breadcrumb: every crumb's href and label escaped inside the builder before the join.",
    proof: /trail = breadcrumb[\s\S]{0,200}escapeHtml\(crumb\.label\)/,
  },
  {
    site: "src/web/workspace/media-picker.ts::selector",
    reason: "Selection control: the radio value and title are escaped inside the fragment, which is markup either way.",
    proof: /selector = a\.selectable[\s\S]{0,220}escapeHtml\(a\.title\)/,
  },
  {
    site: "src/web/workspace/media-picker.ts::stateBadge",
    reason: "Access-state badge: the fallback state is escaped, the available state is a literal.",
    proof: /stateBadge =[\s\S]{0,200}escapeHtml\(a\.accessState\)/,
  },
  {
    site: "src/web/workspace/media-picker.ts::notes",
    reason: "Access-notes block: the note text is escaped where the block is composed.",
    proof: /notes = a\.accessNotes[\s\S]{0,120}escapeHtml\(a\.accessNotes\)/,
  },
  // ---------------------------------------------------------------------------
  // Found by the region scan (2026-11-19). These interpolations sat on tag-less
  // lines of a markup template, so the line-based sweep could not see them; each
  // one is markup a helper composed, not text, so escaping it at the
  // interpolation would print the tags. Every entry names why it is markup, and
  // the proof has to keep matching the file.
  // ---------------------------------------------------------------------------
  {
    site: "src/web/broadcast/index.ts::dutyStationsHtml",
    reason:
      "Duty-station rail: each station's screen id and active class are escaped in the row builder, and the icon comes from `renderIcon`, whose body escapes its own leaves.",
    proof: /const dutyStationsHtml = DUTY_STATIONS\.map\(/,
  },
  {
    site: "src/web/broadcast/index.ts::provenanceHtml",
    reason:
      "Provenance banner: both branches are markup templates composed here, with no interpolated value at all.",
    proof: /const provenanceHtml = screenData\.fullySourced/,
  },
  {
    site: "src/web/broadcast/index.ts::kpiStripHtml",
    reason:
      "KPI strip: `renderScreenKpis(screenData, esc)` receives the escaping helper and applies it to every figure it prints.",
    proof: /const kpiStripHtml = renderScreenKpis\(screenData, esc\)/,
  },
  {
    site: "src/web/broadcast/index.ts::panelContent",
    reason:
      "Screen panel body: assigned only from the empty-state and error-state templates in this function, each composed with escaped values.",
    proof: /let panelContent: string/,
  },
  {
    site: "src/web/components/index.ts::actionBtn",
    reason:
      "Empty-state action: the button markup is returned by `ComponentRenderer.renderButton`, which escapes its label.",
    proof: /const actionBtn = actionLabel/,
  },
  {
    site: "src/web/components/index.ts::retryBtn",
    reason:
      "Error-state retry action: the button markup is returned by `ComponentRenderer.renderButton`, which escapes its label.",
    proof: /const retryBtn = props\.retryActionLabel/,
  },
  {
    site: "src/web/ia/gated-parts.ts::list",
    reason:
      "Adverse-state list: the literal branch is author markup, and the list branch escapes each state before interpolating it.",
    proof: /const list =/,
  },
  {
    site: "src/web/ia/journey-lead.ts::input",
    reason:
      "Field group: the arrow builder composes the label, input and error markup, escaping each value it prints.",
    proof: /input: string,/,
  },
  {
    site: "src/web/ia/journey-pub.ts::hostedTotal",
    reason:
      "Hosted-state count: a `.length` accumulator summed over the journey groups, so the value printed is a number.",
    proof: /const hostedTotal = groups\.reduce\(/,
  },
  {
    site: "src/web/portal/vtm-portal.ts::cards",
    reason:
      "Opportunity cards: the row builder escapes each opportunity's title, category and buyout tier before composing the card.",
    proof: /const cards = opportunities\s*\.map\(/,
  },
  {
    site: "src/web/public/auth-screens.ts::rows",
    reason:
      "Session rows: the row builder escapes each device, location and timestamp it prints, and the revoked badge is author markup.",
    proof: /const rows = sessions\.length/,
  },
  {
    site: "src/web/public/dashboard.ts::bodyContent",
    reason:
      "Master-layout body: the parameter is the page's already-rendered markup (`string | SafeHtml`), interpolated into the shell rather than into text.",
    proof: /bodyContent: string \| SafeHtml/,
  },
  {
    site: "src/web/public/dashboard.ts::shellContent",
    reason:
      "Shell wrapper: each branch is markup composed here; its only interpolation is the `bodyContent` markup documented above.",
    proof: /let shellContent: string;/,
  },
  {
    site: "src/web/public/dashboard.ts::jsonLdScripts",
    reason:
      "JSON-LD blocks: the payload is `serializeJsonLd` output inside a `<script type=\"application/ld+json\">` element, where HTML escaping would corrupt the JSON.",
    proof: /const jsonLdScripts = structuredDataList\s*\.map\(/,
  },
  {
    site: "src/web/public/prototypes.ts::screenNavHtml",
    reason:
      "Prototype nav: each link's href comes from `prototypeHref`, which encodes the closed-union parameters with `URLSearchParams`, and the active class is a literal.",
    proof: /const screenNavHtml = screens\s*\.map\(/,
  },
  {
    site: "src/web/public/prototypes.ts::scenarioNavHtml",
    reason:
      "Prototype nav: each link's href comes from `prototypeHref`, which encodes the closed-union parameters with `URLSearchParams`.",
    proof: /const scenarioNavHtml = scenarios\s*\.map\(/,
  },
  {
    site: "src/web/public/prototypes.ts::deviceNavHtml",
    reason:
      "Prototype nav: each link's href comes from `prototypeHref`, which encodes the closed-union parameters with `URLSearchParams`.",
    proof: /const deviceNavHtml = devices\s*\.map\(/,
  },
  {
    site: "src/web/public/prototypes.ts::screenContentHtml",
    reason:
      "Prototype body: the markup is returned by `renderScreenContent`, which composes the chosen screen's own escaped template.",
    proof: /const screenContentHtml = renderScreenContent\(/,
  },
  {
    site: "src/web/public/pub-screens.ts::channelBlocks",
    reason:
      "Channel cards: the card builder escapes the channel name and carriage text, and the provisional note is a literal branch.",
    proof: /const channelBlocks = channels\s*\.map\(/,
  },
  {
    site: "src/web/public/screens-view.ts::cardsHtml",
    reason:
      "Screen cards: each card escapes its id, name, description and role before composing the card, and the actions list is escaped at the leaf.",
    proof: /const cardsHtml = filtered\s*\.map\(/,
  },
  {
    site: "src/web/workspace/media-picker.ts::rows",
    reason:
      "Asset rows: each row escapes its state badge, notes and selector, and the size column is `formatBytes` output, which prints digits and a unit only.",
    proof: /const rows = assets\s*\.map\(/,
  },
];

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WEB_SRC = path.join(ROOT, "src", "web");

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) tsFiles(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

function sources(): MarkupSource[] {
  return tsFiles(WEB_SRC).map((abs) => ({
    path: path.relative(ROOT, abs).split(path.sep).join("/"),
    text: readFileSync(abs, "utf8"),
  }));
}

/** Kept as a named export: the site count is the census's published figure. */
export function countUnescapedInterpolationSites(): {
  total: number;
  byFile: Record<string, number>;
} {
  const sites = unescapedInterpolations(sources(), ESCAPED_FRAGMENTS);
  const byFile: Record<string, number> = {};
  for (const site of sites) byFile[site.path] = (byFile[site.path] ?? 0) + 1;
  return { total: sites.length, byFile };
}

describe("TSK-42: unescaped interpolation into rendered HTML", () => {
  it("finds no unescaped interpolation in src/web — the ceiling is zero", () => {
    const sites = unescapedInterpolations(sources(), ESCAPED_FRAGMENTS);
    const listed = sites.map((site) => `${site.path}:${site.line}  ${site.expression}`);
    expect(
      listed,
      `interpolated into markup with no escaping call on the line and no proof at the value's definition:\n${listed.join("\n")}`
    ).toEqual([]);
  });

  it("keeps every escaped-fragment claim true, and its proof present", () => {
    const files = sources();
    for (const fragment of ESCAPED_FRAGMENTS) {
      const [file] = fragment.site.split("::");
      const source = files.find((candidate) => candidate.path === file);
      expect(source, `${file} must exist`).toBeDefined();
      expect(fragment.proof.test(source!.text), `proof ${fragment.proof} must still match ${file}`).toBe(true);
      expect(fragment.reason.length, `${fragment.site} must state why it is markup`).toBeGreaterThan(40);
    }
  });

  /**
   * The rule must be able to fail. Each probe is a complete one-function file, so
   * the finding (or its absence) is the rule's, not the repository's.
   */
  it("can still fail, so a clean sweep is not a broken sweep", () => {
    const probe = (body: string[]): MarkupSource[] => [
      { path: "probe.ts", text: ["export function render(count: number) {", ...body, "}"].join("\n") },
    ];
    const count = (body: string[]) => unescapedInterpolations(probe(body)).length;

    // A raw local is a finding.
    expect(count(['  const name = String(count);', "  return `<p>${name}</p>`;"])).toBe(1);
    // A line-level escape is not.
    expect(count(['  const name = String(count);', "  return `<p>${escapeHtml(name)}</p>`;"])).toBe(0);
    // A value escaped where it is defined is not either — the burn-down's whole
    // point, since escaping it again would print `&amp;#039;`.
    expect(count(["  const safe = escapeHtml(`O'Brien`);", "  return `<p>${safe}</p>`;"])).toBe(0);
    // A fragment builder that escapes every interpolation it composes is escaped.
    expect(
      count([
        "  const rows = [1].map((n) => `<td>${escapeHtml(n)}</td>`).join(\"\");",
        "  return `<table><tbody>${rows}</tbody></table>`;",
      ])
    ).toBe(0);
    // …but not when one interpolation in the same statement stays raw. Two
    // findings, not one: the raw `${n}` *and* the fragment `${rows}` that carries
    // it. The earlier line-based rule could only see the second.
    expect(
      count([
        "  const rows = [1].map((n) => `<td>${escapeHtml(n)}</td><td>${n}</td>`).join(\"\");",
        "  return `<table><tbody>${rows}</tbody></table>`;",
      ])
    ).toBe(2);
    // A count is still an interpolation, even a numeric one: it is escaped as a
    // value, not assumed safe from its type.
    expect(count(["  return `<p>${count} slots</p>`;"])).toBe(1);
  });

  /**
   * The write boundary: inside an `html` tagged template the tag escapes every
   * interpolation, so a raw `${name}` there is the mechanism, not a hole. The same
   * value in a plain template is still a finding — the rule follows the tag, not
   * the author's intent.
   */
  it("treats an html template as the escaping boundary, and nothing else", () => {
    const probe = (body: string[]): MarkupSource[] => [
      { path: "probe.ts", text: ["export function render(name: string) {", ...body, "}"].join("\n") },
    ];
    const count = (body: string[]) => unescapedInterpolations(probe(body)).length;

    expect(count(["  return html`<p>${name}</p>`;"])).toBe(0);
    // Composed markup: the html result is interpolated into a plain template.
    expect(count(["  const safe = html`<p>${name}</p>`;", "  return `<div>${safe}</div>`;"])).toBe(0);
    // A row list of html fragments, interpolated as an array.
    expect(
      count([
        "  const rows = [name].map((n) => html`<td>${n}</td>`);",
        "  return `<table><tbody>${rows}</tbody></table>`;",
      ])
    ).toBe(0);
    // The same value outside the tag is still counted.
    expect(count(["  return `<p>${name}</p>`;"])).toBe(1);
    // A property that happens to be named html is not this boundary: the rule
    // follows the identifier, not the spelling.
    expect(count(["  return templates.html`<p>${name}</p>`;"])).toBe(1);
  });

  it("neutralises the characters that break text, attribute and URL contexts", () => {
    const hostile = `</span><script>alert(1)</script>`;
    const quoted = `" onmouseover="steal()`;
    const ampersand = `a&b`;

    expect(escapeHtml(hostile)).not.toContain("<script>");
    expect(escapeHtml(hostile)).toContain("&lt;script&gt;");
    expect(escapeHtml(quoted)).not.toContain(`"`);
    expect(escapeHtml(ampersand)).toContain("&amp;");
  });

  it("escapes a number as its digits, and an absent value as nothing", () => {
    // The burn-down escapes counts and percentages, so the helper accepts them.
    // `0` must print — a truthiness check would have printed an empty cell.
    expect(escapeHtml(0)).toBe("0");
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("keeps the convention legible: escaping is once, at one boundary", () => {
    // A renderer that escapes at the write boundary and again at the template
    // would print "&amp;amp;" to operators; the proof-at-definition rule exists
    // so the second call is never needed.
    expect(escapeHtml(escapeHtml("A & B"))).toBe("A &amp;amp; B");
  });
});
