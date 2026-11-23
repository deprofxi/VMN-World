/**
 * "Is this value already escaped?" — one rule, shared by both instruments.
 *
 * The census (`tests/unit/html-escape-census.test.ts`) and the taint pass
 * (`tests/unit/html-escape-taint.test.ts`) used to answer this question
 * differently: the census judged a line by whether it contained `escapeHtml(`,
 * and the taint pass judged a *value* by whether it was escaped where it was
 * assigned. That split is why a value escaped exactly once at its definition
 * still counted against the census ceiling, and why the only way to clear it was
 * to escape it a second time — which prints `&amp;#039;` to the reader instead of
 * an apostrophe.
 *
 * This module states the value-level rule in one place so both instruments can
 * rely on it:
 *
 *   - an assignment from an escaping call (`escapeHtml(...)`, the broadcast
 *     surfaces' `esc(...)`, `sanitize*`, `encodeURIComponent`) is escaped;
 *   - an assignment whose statement escapes *every* interpolation it composes is
 *     escaped (a fragment builder such as `rows = sessions.map(r =>
 *     `<td>${escapeHtml(r.name)}</td>`)`).
 *
 * The fragment rule is all-or-nothing on purpose: one unescaped interpolation in
 * the same statement keeps the local unescaped, because a partial fragment is
 * exactly what a caller must not interpolate raw.
 *
 * The rule proves *escaping*, not non-exploitability: a value that is escaped
 * here is safe to interpolate without a second call, and nothing more.
 */

/** An interpolation that is a boundary in its own right. */
export const ESCAPE_EXPRESSION = /^(?:escapeHtml|esc|sanitize[A-Za-z]*|encodeURIComponent)\s*\(/;

/**
 * An `html` tagged template, where escaping happens at the write boundary
 * (`src/web/components/escape.ts`): every `${…}` inside the template is escaped
 * by the tag unless the value is itself `SafeHtml`, so a raw interpolation is not
 * a finding there — it is the mechanism.
 *
 * The tag must be the identifier `html`, not a property (`obj.html`) and not part
 * of a longer name.
 */
export const HTML_TEMPLATE = /^(?<![.\w$])html\s*`/;

/** A region of source text that lies inside an `html` tagged template. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

/** Closing backtick of the template that opens at `open`, or -1. */
function templateEnd(text: string, open: number): number {
  let i = open + 1;
  while (i < text.length) {
    const char = text[i];
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === "`") return i;
    if (char === "$" && text[i + 1] === "{") {
      const end = interpolationEnd(text, i + 2);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

/** Closing `}` of an interpolation whose body starts at `from`, or -1. */
function interpolationEnd(text: string, from: number): number {
  let depth = 1;
  let i = from;
  while (i < text.length) {
    const char = text[i];
    if (char === "'" || char === '"') {
      const end = quotedEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "`") {
      const end = templateEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/** Closing quote of the string that opens at `open`, or -1. */
function quotedEnd(text: string, open: number): number {
  for (let i = open + 1; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === text[open]) return i;
  }
  return -1;
}

/**
 * Every `html`…`` template in `text`, as character ranges. Both instruments use
 * these: an interpolation inside one is escaped at the boundary, so the census
 * does not count it and the taint pass does not report it.
 */
export function htmlTemplateRanges(text: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  for (const match of text.matchAll(/(?<![.\w$])html\s*`/g)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    const end = templateEnd(text, open);
    if (end !== -1) ranges.push({ start: open, end });
  }
  return ranges;
}

/** True when `offset` lies inside one of `ranges`. */
export function insideAnyRange(ranges: readonly SourceRange[], offset: number): boolean {
  return ranges.some((range) => range.start <= offset && offset <= range.end);
}

/**
 * Every template literal in `text`, as character ranges including the backticks.
 *
 * This is the region the instruments scan. They used to decide what counts as
 * markup **line by line** — a line was scanned when it contained a tag — so an
 * interpolation on a tag-less line of a template (`${cell}` on its own line, or
 * an attribute on the line after the tag) was invisible to both of them. The
 * template is the unit that is actually markup, so the scan follows it: a
 * template whose static text contains a tag is a markup region, and *every*
 * interpolation inside it is measured, whatever line it lands on.
 */
export function templateLiteralRanges(text: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    // A backtick inside a comment or a quoted string is not a template opener.
    if (char === "/" && text[i + 1] === "/") {
      const newline = text.indexOf("\n", i);
      i = newline === -1 ? text.length : newline;
      continue;
    }
    if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const end = quotedEnd(text, i);
      i = end === -1 ? text.length : end;
      continue;
    }
    if (char !== "`") continue;
    const end = templateEnd(text, i);
    if (end === -1) return ranges;
    ranges.push({ start: i, end });
    i = end;
  }
  return ranges;
}

/**
 * An opening or closing HTML tag in static template text. The lookahead keeps a
 * CSS `>` combinator or a comparison (`a < b`) from reading as markup: a tag is a
 * name followed by whitespace, `/` or `>`.
 */
const MARKUP_TAG = /<\/?[A-Za-z][\w:-]*(?=[\s/>])/;

/** The static text of a template: its interpolation bodies removed. */
function staticText(text: string, range: SourceRange): string {
  let out = "";
  for (let i = range.start + 1; i < range.end; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === "$" && text[i + 1] === "{") {
      const close = interpolationEnd(text, i + 2);
      if (close === -1) break;
      i = close;
      continue;
    }
    out += text[i];
  }
  return out;
}

/**
 * The template literals that are markup: those whose static text contains a tag.
 * A stylesheet template (`` `a{color:${tone}}` ``) is not one, so its
 * interpolations are not measured as HTML — a CSS value cannot be escaped as
 * text without changing the stylesheet.
 */
export function markupTemplateRanges(text: string): SourceRange[] {
  return templateLiteralRanges(text).filter((range) => MARKUP_TAG.test(staticText(text, range)));
}

/** One interpolation inside a markup template, with its absolute offset. */
export interface MarkupInterpolation {
  /** Offset of the `$`, so a caller can test it against a range. */
  readonly start: number;
  /** The expression between the braces, trimmed. */
  readonly expression: string;
}

/**
 * Every interpolation inside a markup template — the census's and the taint
 * pass's shared view of "what is interpolated into markup".
 *
 * The body is read with a balanced scan rather than `[^{}]*`, so `${fn({ a })}`
 * and an expression written across several lines are measured as one
 * interpolation instead of being missed. A template nested inside an
 * interpolation is not descended into: the outer expression is judged as a whole,
 * and an `html` template there is escaped by its own tag.
 */
export function markupInterpolations(text: string): MarkupInterpolation[] {
  return interpolationsIn(markupTemplateRanges(text), text);
}

/** Every interpolation in every template literal, markup or not. */
export function templateInterpolations(text: string): MarkupInterpolation[] {
  return interpolationsIn(templateLiteralRanges(text), text);
}

function interpolationsIn(ranges: readonly SourceRange[], text: string): MarkupInterpolation[] {
  const out: MarkupInterpolation[] = [];
  for (const range of ranges) {
    for (let i = range.start + 1; i < range.end; i += 1) {
      if (text[i] === "\\") {
        i += 1;
        continue;
      }
      if (text[i] !== "$" || text[i + 1] !== "{") continue;
      const close = interpolationEnd(text, i + 2);
      if (close === -1) break;
      out.push({ start: i, expression: text.slice(i + 2, close).trim() });
      i = close;
    }
  }
  return out;
}

/** 1-based line of `offset`, for a report that names a line. */
export function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i += 1) if (text[i] === "\n") line += 1;
  return line;
}

/**
 * The statement starting at `from`, ending at its top-level `;` (or a bounded
 * window, so an unterminated statement cannot scan the file). Escaping is judged
 * over a statement rather than a line because a fragment builder spans lines:
 * `const rows = sessions` / `.map((r) => `<td>${escapeHtml(r.x)}</td>`)`.
 */
export function statementText(text: string, from: number): string {
  const limit = Math.min(text.length, from + 4000);
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < limit; i += 1) {
    const char = text[i];
    if (quote !== null) {
      if (char === "\\") i += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === ";" && depth <= 0) return text.slice(from, i);
  }
  return text.slice(from, limit);
}

/**
 * A value that is a number by its own syntax, so escaping it would change nothing
 * it can print: a numeric literal, `.length` (a count whatever the collection
 * holds), or a locale-formatted number.
 *
 * `.toLocaleString(...)` is here because the money and count columns of the
 * repository's tables are written that way — `total.toLocaleString("en-NG")` —
 * and refusing it made every row builder around such a column unprovable, which
 * is how pre-escaped table fragments ended up in the finding list.
 */
export function numericExpression(expression: string): boolean {
  const trimmed = expression.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return true;
  if (/^[A-Za-z_$][\w$]*(?:\.[\w$]+)*\.length$/.test(trimmed)) return true;
  if (/^[A-Za-z_$][\w$]*(?:\.[\w$]+)*\.toLocaleString\s*\([^()]*\)$/.test(trimmed)) return true;
  // `Milestone ${idx + 1}`: an index offset by a literal.
  if (/^[A-Za-z_$][\w$]*(?:\.[\w$]+)*\s*[+\-*]\s*\d+$/.test(trimmed)) return true;
  // `BUYOUT_MULTIPLIERS[tier] || 1`: a numeric table lookup with a numeric floor.
  if (/^[A-Za-z_$][\w$]*(?:\.[\w$]+|\[[^\]]+\])*\s*\|\|\s*\d+$/.test(trimmed)) return true;
  // `String(n).padStart(2, "0")` — digits, padded to two.
  if (/^String\s*\(\s*[A-Za-z_$][\w$]*(?:\.[\w$]+)*\s*\)\.padStart\s*\(\s*\d+\s*,\s*"0"\s*\)$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * What a leaf may consult beyond its own text.
 *
 * A leaf written `safeId` or `renderIcon("alert")` says nothing by itself; the
 * answer is in the file that declared it (`safeId = escapeHtml(props.id)`) or in
 * the helper's body (`renderIcon` composes escaped markup). Carrying `sources`
 * down to the leaf is what lets the rule follow those, which is how a row builder
 * that prints an icon is proved instead of being recorded by hand.
 *
 * `depth` bounds the lookups: a variable defined in terms of itself would
 * otherwise recurse without end, and the honest answer for a cycle is "not
 * proved".
 */
export interface EscapeContext {
  readonly sources: readonly MarkupSource[];
  /** The file text the expression was written in, for definition lookups. */
  readonly text?: string;
  readonly depth: number;
}

const MAX_LOOKUP_DEPTH = 4;

/** The context one step deeper, or undefined once the lookups are exhausted. */
function deeper(ctx: EscapeContext | undefined): EscapeContext | undefined {
  if (ctx === undefined || ctx.depth >= MAX_LOOKUP_DEPTH) return undefined;
  return { ...ctx, depth: ctx.depth + 1 };
}

/**
 * True when every interpolation inside every template in `text` proves escaped.
 *
 * The interpolations are read with the balanced scanner, so a nested template
 * (`${blocked ? `<span>${x}</span>` : ""}`) and a call whose arguments contain
 * braces (`${renderIcon("alert", { size: 14 })}`) are judged as the one expression
 * they are instead of being skipped by a `[^{}]*` match. Every template counts,
 * not only markup ones: `` ` · master ${esc(code)}` `` is a text fragment inside a
 * row, and a fragment builder is only as escaped as its weakest leaf.
 */
function templateEscapes(
  text: string,
  depth: number,
  ctx?: EscapeContext
): { proves: boolean; seen: boolean } {
  const ranges = htmlTemplateRanges(text);
  let seen = false;
  let proves = true;
  for (const interpolation of templateInterpolations(text)) {
    seen = true;
    // Escaped at the write boundary: the `html` tag does the call.
    if (insideAnyRange(ranges, interpolation.start)) continue;
    if (!leafEscapes(interpolation.expression, depth, ctx)) proves = false;
  }
  return { proves, seen };
}

/**
 * True when a statement composes markup and escapes *every* interpolation in it.
 * All-or-nothing on purpose: a row fragment that escapes its title and prints its
 * body raw is not clearable by the same rule.
 */
export function escapesEveryInterpolation(statement: string, ctx?: EscapeContext): boolean {
  const { proves, seen } = templateEscapes(statement, 1, ctx);
  return seen && proves;
}

/**
 * One interpolation's value, judged without entering the fragment rule again.
 *
 * `depth` stops the mutual recursion: inside a fragment builder, an interpolation
 * is judged as a leaf (an escaping call, a nested markup template whose own
 * interpolations prove, a number, a conditional of those) rather than as another
 * builder, so a self-referential statement cannot loop.
 */
function leafEscapes(expression: string, depth: number, ctx?: EscapeContext): boolean {
  const trimmed = expression.trim();
  if (trimmed === "") return false;
  if (ESCAPE_EXPRESSION.test(trimmed)) return true;
  // An `html` template escapes every interpolation it composes.
  if (HTML_TEMPLATE.test(trimmed)) return true;
  if (isInert(trimmed)) return true;
  if (numericExpression(trimmed)) return true;
  // Inside a composed fragment, a plain string literal is part of the markup the
  // author wrote — `<span class="badge">NEW</span>` is not a value that arrived
  // from outside, so it needs no escape of its own. At the interpolation site
  // (`depth === 0`) the same literal is still required to be inert: there it is
  // the whole value, and a stray `<` would change the document's structure.
  if (depth > 0 && /^(?:"[^"\n]*"|'[^'\n]*'|`[^`$]*`)$/.test(trimmed)) return true;

  // A parenthesised expression is judged by its contents: `(bytes / 1024)`.
  if (trimmed.startsWith("(") && matchingParen(trimmed) === trimmed.length - 1) {
    return leafEscapes(trimmed.slice(1, -1), depth, ctx);
  }
  // Arithmetic on numbers prints a number: `bytes / 1024`, `total * 2`.
  const arithmetic = /^([\s\S]+?)\s*[+\-*/]\s*([\s\S]+)$/.exec(trimmed);
  if (
    arithmetic !== null &&
    ctx !== undefined &&
    numericOperand(arithmetic[1], ctx) &&
    numericOperand(arithmetic[2], ctx)
  ) {
    return true;
  }

  const branches = conditionalBranches(trimmed);
  if (branches !== undefined) {
    return branches.every((branch) => leafEscapes(branch, depth, ctx));
  }
  const fallback = topLevelSplit(trimmed, ["??", "||"]);
  if (fallback !== undefined) {
    return fallback.every((part) => leafEscapes(part, depth, ctx));
  }
  // A nested template literal: its own interpolations must prove. A template with
  // no interpolation carries nothing but the author's own characters, so it is
  // markup by construction — `<span class="badge">NEW</span>` is not a value.
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return templateEscapes(trimmed, depth + 1, ctx).proves;
  }
  // An array joined into one string: escaped exactly when every element is.
  // `["<tbody>", rows, "</tbody>"].join("")` is markup because its parts are.
  const joined = /^\[([\s\S]*)\]\s*\.\s*join\s*\(/.exec(trimmed);
  if (joined !== null) {
    const elements = splitTopLevel(joined[1]);
    if (elements.length > 0 && elements.every((element) => leafEscapes(element, depth, ctx))) return true;
  }
  // A helper this repository defines, whose own body escapes every interpolation
  // it composes: `renderIcon("alert", { size: 14 })`, `formatNgn(total)`.
  if (ctx !== undefined && /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\s*\(/.test(trimmed)) {
    const inner = deeper(ctx);
    if (inner !== undefined && callReturnsEscapedMarkup(trimmed, inner)) return true;
  }
  // `.map(fn).join("")` with the callback written as a function reference: each
  // row is that function's output, so the rows are escaped exactly when it is.
  const reference = /^[\s\S]*\.\s*map\s*\(\s*([A-Za-z_$][\w$]*)\s*\)[\s\S]*\.\s*join\s*\(/.exec(
    trimmed
  );
  if (ctx !== undefined && reference !== null) {
    const inner = deeper(ctx);
    if (inner !== undefined && callReturnsEscapedMarkup(`${reference[1]}()`, inner)) return true;
  }
  // A value proved escaped where it was defined: `const safeId = escapeHtml(id)`.
  const identifier = /^([A-Za-z_$][\w$]*)(?:\.[\w$]+)*(?:\[[^\]]+\])*$/.exec(trimmed);
  if (ctx !== undefined && ctx.text !== undefined && identifier !== null) {
    // A module-level constant table is code-owned text, the same classification
    // DEBT-009's triage used: `SVG_PATHS[name]`, `SCREEN_GATES[id]`,
    // `ENTERPRISE_WORKSPACES.find(…)` results and the icons built from them are
    // internal, and escaping them changes nothing.
    if (isModuleConstant(identifier[1], ctx.text)) return true;
    // A parameter declared `number` prints digits whatever is passed, and one
    // declared as a union of string literals can only take one of those.
    if (new RegExp(`[{,(]\\s*${identifier[1]}\\s*\\??\\s*:\\s*number(?![\\w$])`).test(ctx.text)) return true;
    if (closedUnionParameter(identifier[1], ctx.text)) return true;
    const inner = deeper(ctx);
    if (inner !== undefined && provesAtDefinition(ctx.text, identifier[1], inner)) return true;
  }
  // A string method on a proved value: `path.trim()`, `state.toUpperCase()`. The
  // transforms this accepts cannot introduce a `<`, a quote or a `&` that was not
  // already there (an escaped value stays escaped), and their arguments are
  // literals or proved values.
  const method = /^([\s\S]+?)\.\s*(trim|toUpperCase|toLowerCase|toString|toFixed|slice|substring|padStart|padEnd|replace)\s*\(([\s\S]*)\)$/.exec(
    trimmed
  );
  if (method !== null && leafEscapes(method[1], depth, ctx)) {
    const args = splitTopLevel(method[3]);
    if (args.every((arg) => leafEscapes(arg, depth, ctx))) return true;
  }
  // A fragment builder: a `.map`/`.join`/`.reduce` chain whose templates escape
  // every interpolation they compose. The chain guard matters — without it, any
  // expression that merely *contains* an escaped template would prove, including
  // one that concatenates raw text beside it. Each level reads a strictly smaller
  // slice of text, so a builder inside a builder terminates.
  if (/(?:\.map\(|\.join\(|\.filter\(|\.reduce\()/.test(trimmed)) {
    return escapesEveryInterpolation(trimmed, ctx);
  }
  return false;
}

/** Index of the `)` closing the `(` at the start of `text`, or -1. */
function matchingParen(text: string): number {
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === '"' || char === "'") {
      const end = quotedEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "`") {
      const end = templateEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/**
 * True when an operand of arithmetic is a number: a numeric literal, a `.length`
 * or `.toFixed(…)`-shaped value, or a parameter declared `number`.
 */
function numericOperand(operand: string, ctx: EscapeContext): boolean {
  const trimmed = operand.trim();
  if (trimmed.startsWith("(") && matchingParen(trimmed) === trimmed.length - 1) {
    return numericOperand(trimmed.slice(1, -1), ctx);
  }
  if (numericExpression(trimmed)) return true;
  if (!/^[A-Za-z_$][\w$]*$/.test(trimmed) || ctx.text === undefined) {
    // `1024 * 1024`: arithmetic whose every operand is a number is a number.
    const arithmetic = /^([\s\S]+?)\s*[+*/-]\s*([\s\S]+)$/.exec(trimmed);
    return arithmetic !== null && numericOperand(arithmetic[1], ctx) && numericOperand(arithmetic[2], ctx);
  }
  return new RegExp(`[{,(]\\s*${trimmed}\\s*\\??\\s*:\\s*number(?![\\w$])`).test(ctx.text);
}

/**
 * True when `name` is a parameter annotated with a type this file declares as a
 * union of string literals (`type IconName = "alert" | "lock"`).
 *
 * A closed union is a code-owned set: an icon name or a variant cannot become
 * reader-supplied text without editing the declaration, which is the same
 * assumption the sweep already makes for a closed union interpolated directly.
 */
function closedUnionParameter(name: string, text: string): boolean {
  const annotation = new RegExp(`[{,(]\\s*${name}\\s*\\??\\s*:\\s*([A-Za-z_$][\\w$]*)`).exec(text);
  if (annotation === null) return false;
  const union = new RegExp(`^(?:export\\s+)?type\\s+${annotation[1]}\\s*=([\\s\\S]{0,600}?);`, "m").exec(text);
  if (union === null) return false;
  // Members may be written with a leading `|` on the first line, as every union
  // in this repository is formatted.
  const members = union[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return /^\s*\|?\s*(?:"[^"\n]*"|'[^'\n]*')(?:\s*\|\s*(?:"[^"\n]*"|'[^'\n]*'))+\s*$/.test(members);
}

/**
 * True when `name` is declared at module scope as a `const` in `text`.
 *
 * Code-owned constants are not external text: the census has always treated a
 * literal or a module constant table as internal, and this is the derivable form
 * of that rule — the declaration has to sit at the start of a line, so a
 * function-local `const rows` is not covered.
 */
function isModuleConstant(name: string, text: string): boolean {
  return new RegExp(`^(?:export\\s+)?const\\s+${name}\\s*(?::[^=\\n]{1,200})?=`, "m").test(text);
}

/** Splits an array literal's contents at its top-level commas. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote !== null) {
      current += char;
      if (char === "\\") {
        current += text[i + 1] ?? "";
        i += 1;
      } else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

/**
 * True when `name` is assigned in `text` from an escaping call, or from a
 * statement that escapes every interpolation it composes.
 *
 * The assignment is located by name rather than by line so a builder split across
 * several lines is judged as the one statement it is.
 */
export function provesEscapedAtDefinition(
  text: string,
  name: string,
  sources: readonly MarkupSource[] = []
): boolean {
  return provesAtDefinition(text, name, { sources, text, depth: 0 });
}

/**
 * Definition verdicts, cached per source set.
 *
 * Every lookup scans a whole file for assignments, and a fragment builder asks
 * this question once per leaf: without the cache a template with twenty leaves
 * re-reads the file twenty times, and a helper reached from it twenty more.
 */
const DEFINITION_VERDICTS = new WeakMap<readonly MarkupSource[], Map<string, boolean>>();

/** The definition proof, carrying the lookup context so a leaf can consult it. */
function provesAtDefinition(text: string, name: string, ctx: EscapeContext): boolean {
  let cache = DEFINITION_VERDICTS.get(ctx.sources);
  if (cache === undefined) {
    cache = new Map();
    DEFINITION_VERDICTS.set(ctx.sources, cache);
  }
  const key = `${name}\u0000${text.length}\u0000${text.slice(0, 60)}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const verdict = provesAtDefinitionUncached(text, name, ctx);
  cache.set(key, verdict);
  return verdict;
}

function provesAtDefinitionUncached(text: string, name: string, ctx: EscapeContext): boolean {
  // Every assignment, declared or not: `let content = escapeHtml(label)` followed
  // by `content = `<icon> span`` later in the same function is *not* escaped at
  // the point the template reads it, and reading only declarations missed that.
  //
  // The type annotation is matched on one line only, and a reassignment must start
  // a statement. Otherwise a *parameter* named `caption` is "assigned" by the
  // declaration `caption: string, note: string): string {` followed by the next
  // line's `const head = …`, and a raw parameter is silently proved safe.
  const patterns = [
    new RegExp(`(?:const|let|var)\\s+${name}\\s*(?::[^=\\n]{1,200})?=`, "g"),
    new RegExp(`(?:^|[\\n;{}])\\s*${name}\\s*=(?![=>])`, "g"),
  ];
  const assignments = patterns.flatMap((pattern) => [...text.matchAll(pattern)]);
  if (assignments.length === 0) return false;
  // *Every* assignment must prove: a name escaped on line 3 and reassigned raw on
  // line 40 is not escaped at the point a later template reads it.
  return assignments.every((assignment) => {
    const equalAt = (assignment.index ?? 0) + assignment[0].length - 1;
    const statement = statementText(text, equalAt);
    const assigned = statement.slice(1);
    // Depth 1: an assignment that composes markup is a fragment, so its literal
    // branches are author markup rather than values interpolated at a call site.
    return leafEscapes(assigned, 1, { ...ctx, text });
  });
}

/**
 * A value that needs no escaping because escaping it would change nothing: a
 * literal with no character that breaks text, an attribute or a URL, or a number.
 * A literal that *does* contain `&`, `<`, `>`, a quote or an apostrophe is not safe
 * and must still be escaped.
 */
function isInert(expression: string): boolean {
  const trimmed = expression.trim();
  if (/^(?:true|false|null|undefined)$/.test(trimmed)) return true;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return true;
  // An empty collection is an empty fragment: the assignment `const rows = []`
  // that a builder declares before filling it carries no markup at all, and
  // refusing it made every later reassignment unprovable.
  if (/^(?:\[\]|new (?:Array|Set|Map)\(\))$/.test(trimmed)) return true;
  const literal = /^(?:"([^"]*)"|'([^']*)'|`([^`$]*)`)$/.exec(trimmed);
  if (literal === null) return false;
  const value = literal[1] ?? literal[2] ?? literal[3] ?? "";
  return !/[&<>"']/.test(value);
}

/**
 * True when *every* value this expression can take is escaped or inert.
 *
 * The shapes are the ones the repository actually writes a safe value in:
 *
 *   - an escaping call: `escapeHtml(userInput)`;
 *   - a fragment builder that escapes every interpolation: `` `<li>${escapeHtml(x)}</li>` ``;
 *   - a conditional in which every branch escapes or is a literal:
 *     `options?.returnUrl ? escapeHtml(options.returnUrl) : "/workspace"` —
 *     refusing this shape was what made a value escaped exactly once look
 *     unescaped, and the only cure the sweep offered was a second escape.
 *
 * A conditional is only accepted when *both* branches prove. That is the
 * all-or-nothing discipline of the fragment rule applied to the other common
 * shape, and it keeps `x ? escapeHtml(x) : rawOther` a finding.
 */
export function expressionEscapes(
  expression: string,
  ctx?: { readonly sources: readonly MarkupSource[]; readonly text?: string }
): boolean {
  return leafEscapes(expression, 0, ctx === undefined ? undefined : { ...ctx, depth: 0 });
}

/**
 * The two branches of a top-level conditional, or undefined when the expression is
 * not one. `?.` is skipped: `options?.returnUrl` is optional chaining, not a
 * ternary, and reading it as one would split a safe value in the wrong place.
 */
function conditionalBranches(expression: string): [string, string] | undefined {
  let depth = 0;
  let quote: string | null = null;
  let nested = 0;
  let firstQuestion = -1;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (quote !== null) {
      if (char === "\\") i += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    if (depth !== 0) continue;
    if (char === "?" && expression[i + 1] !== "." && expression[i + 1] !== "?") {
      if (nested === 0) firstQuestion = i;
      nested += 1;
      continue;
    }
    if (char === ":") {
      if (nested === 1) {
        return [expression.slice(firstQuestion + 1, i), expression.slice(i + 1)];
      }
      if (nested > 1) nested -= 1;
    }
  }
  return undefined;
}

/** Splits at a top-level `??` or `||`, returning every part, or undefined. */
function topLevelSplit(expression: string, operators: readonly string[]): string[] | undefined {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (quote !== null) {
      if (char === "\\") i += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    if (depth !== 0) continue;
    const operator = operators.find((candidate) => expression.startsWith(candidate, i));
    if (operator !== undefined) {
      return [expression.slice(0, i), expression.slice(i + operator.length)];
    }
  }
  return undefined;
}

export interface MarkupSource {
  readonly path: string;
  readonly text: string;
}

/** Index of the brace closing the one at `open`, skipping strings and templates. */
function matchingBrace(text: string, open: number): number {
  let depth = 0;
  let i = open;
  while (i < text.length) {
    const char = text[i];
    if (char === '"' || char === "'") {
      const end = quotedEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "`") {
      const end = templateEnd(text, i);
      if (end === -1) return -1;
      i = end + 1;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return -1;
}

/**
 * The body of `fn`, wherever this repository declares it, or undefined.
 *
 * Only used for the "a helper returns markup, and escapes every interpolation it
 * composes" rule below. Both declaration shapes are read — a `function`
 * statement and a `const`-bound arrow — and cached per source set, because the
 * census asks this question once per interpolated variable.
 */
const FUNCTION_BODIES = new WeakMap<
  readonly MarkupSource[],
  Map<string, { readonly text: string; readonly body: string } | null>
>();

function bodyOf(
  sources: readonly MarkupSource[],
  fn: string
): { readonly text: string; readonly body: string } | undefined {
  let cache = FUNCTION_BODIES.get(sources);
  if (cache === undefined) {
    cache = new Map();
    FUNCTION_BODIES.set(sources, cache);
  }
  const cached = cache.get(fn);
  if (cached !== undefined) return cached ?? undefined;

  const declaration = new RegExp(
    `(?:export\\s+)?(?:async\\s+)?function\\s+${fn}\\s*\\(|(?:export\\s+)?(?:const|let|var)\\s+${fn}\\s*(?::[^=]{1,200})?=\\s*(?:async\\s*)?\\([^)]*\\)\\s*(?::[^=]{1,200})?=>`
  );
  cache.set(fn, null);
  for (const source of sources) {
    const match = declaration.exec(source.text);
    if (match === null) continue;
    const at = (match.index ?? 0) + match[0].length - 1;
    let body: string | undefined;
    if (match[0].trimEnd().endsWith("=>")) {
      body = statementText(source.text, at + 1);
    } else {
      const open = source.text.indexOf("{", source.text.indexOf(")", at));
      if (open === -1) continue;
      const close = matchingBrace(source.text, open);
      if (close === -1) continue;
      body = source.text.slice(open, close + 1);
    }
    const found = { text: source.text, body };
    cache.set(fn, found);
    return found;
  }
  return undefined;
}

/**
 * True when `expression` is a call to a function **in this repository** whose body
 * composes markup and escapes every interpolation it composes.
 *
 * This is the derived form of what used to need a hand-written registry entry: a
 * renderer is only markup if the helper that produced it escaped its own leaves.
 * A helper that returns a raw value (no template, or a template with a raw
 * interpolation) does not prove, and one that returns a URL string has no markup
 * template to prove, so `href="${prototypeHref(…)}"` is still a finding.
 *
 * `visiting` stops a helper that calls itself from looping.
 */
export function callReturnsEscapedMarkup(expression: string, ctx: EscapeContext): boolean {
  const call = /^(?:([A-Za-z_$][\w$]*)\.)?([A-Za-z_$][\w$]*)\s*\(/.exec(expression.trim());
  if (call === null) return false;
  const found = bodyOf(ctx.sources, call[2]);
  if (found === undefined) return false;
  const inner = { ...ctx, text: found.text };
  // The *returned* values are what the caller prints, not every template in the
  // body: `sessionFacts` composes a raw `Tenant: ${id}` intermediate and escapes
  // it where it prints it, which is correct and would fail a body-wide rule.
  const returns = [...found.body.matchAll(/\breturn\b/g)];
  if (returns.length === 0) return false;
  return returns.every((match) => {
    const expression = statementText(found.body, (match.index ?? 0) + match[0].length).trim();
    if (expression === "") return false;
    // Depth 1: a returned template is markup the author wrote, exactly as a
    // fragment inside a builder is — not a value interpolated at a call site.
    return leafEscapes(expression, 1, inner);
  });
}

export interface UnescapedSite {
  readonly path: string;
  readonly line: number;
  /** The bare interpolation, `${expr}`. */
  readonly expression: string;
}

/**
 * A *bare* interpolation: `${name}` or `${a.b}` — no call, no operator, no
 * literal. Those shapes belong to the taint pass, which can decide what they
 * derive from; this rule counts only what it can classify by eye. Wrapped values
 * (`${escapeHtml(name)}`) and composed expressions are therefore not counted
 * here, and a bare one is counted wherever it sits, in an `html` template or a
 * plain one.
 */
const BARE_INTERPOLATION = /^([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)$/;

/**
 * A variable that holds escaped *markup*, not text: the output of a builder that
 * escapes every leaf it reads. Interpolating such a value is correct, and escaping
 * it again would print the tags as text.
 *
 * Each entry names the builder and carries a proof that must still match the file,
 * so an entry cannot outlive its justification. This is the one piece of knowledge
 * in the sweep that is not derivable from a single statement — the builders span
 * several, or call a helper that escapes — and it is written down rather than
 * inferred so a reviewer can check it.
 */
export interface EscapedFragment {
  /** `file::variable`. */
  readonly site: string;
  readonly reason: string;
  readonly proof: RegExp;
}

/**
 * Every bare interpolation into markup whose value is neither wrapped in an
 * escaping call nor proved escaped at its definition.
 *
 * "Into markup" means *inside a template literal whose static text contains a
 * tag* — a region, not a line. The earlier rule asked whether the line held a
 * tag, which made an interpolation on its own line inside a table template
 * (`<td>` on one line, `${cell}` on the next) invisible to the sweep.
 */
export function unescapedInterpolations(
  sources: readonly MarkupSource[],
  fragments: readonly EscapedFragment[] = []
): UnescapedSite[] {
  const proven = new Set(fragments.map((fragment) => fragment.site));
  const sites: UnescapedSite[] = [];
  for (const source of sources) {
    const escaped = htmlTemplateRanges(source.text);
    // Every interpolation in every markup template, tag line or not.
    for (const interpolation of markupInterpolations(source.text)) {
      const bare = BARE_INTERPOLATION.exec(interpolation.expression);
      if (bare === null) continue;
      // Inside an `html` template the tag escapes this interpolation; it is the
      // write boundary, not a hole.
      if (insideAnyRange(escaped, interpolation.start)) continue;
      const name = bare[1].split(".")[0];
      if (provesEscapedAtDefinition(source.text, name, sources)) continue;

      if (proven.has(`${source.path}::${name}`)) continue;
      sites.push({
        path: source.path,
        line: lineAt(source.text, interpolation.start),
        expression: `\${${bare[1]}}`,
      });
    }
  }
  return sites;
}
