/**
 * The census's blind spot, closed by a second instrument.
 *
 * `html-escape-census.test.ts` counts one shape — a bare identifier or dotted
 * path, `${x}` / `${a.b}`, on a line with no `escapeHtml(`. That was deliberate:
 * shapes it could not classify by eye were left out rather than guessed at. The
 * cost is a hole, and it is the dangerous one — `${renderX(record.title)}`,
 * `${a ?? b}` and `${req.query.name}` are all invisible to it. The first two
 * *may* be safe; the third never is.
 *
 * This instrument asks a different question, so it can see all three. For each
 * rendered line it asks whether the interpolated value is derived from the
 * request, the database or the environment, and if so whether the line escapes
 * it. Derivation is computed per file by propagation (a local assigned from a
 * tainted expression is tainted), not by reading the expression's shape.
 *
 * Two carve-outs are rules about *types*, not about appearances:
 *   - `.length` is a number whatever the collection holds;
 *   - a value used only as the subject of a comparison to a literal, in a
 *     ternary whose branches are literals, is never emitted.
 * Both are stated in code below, so a reader can attack them.
 *
 * The remaining sites are documented with a reason and a proof: the proof is a
 * pattern that must still match the file, so an allowlist entry cannot survive
 * its own justification being deleted. Every entry this pass can prove instead —
 * by following the value to an escaping call or a caller's literal — has been
 * removed from that list rather than kept "for safety".
 *
 * **Plain `string` parameters are external.** A renderer that takes
 * `showcaseTitle: string` is seeded exactly as if it took `req`: the instrument
 * assumes the text came from outside and then asks whether *this* code escapes
 * it. The seeded name is looked for anywhere in the expression, so
 * `${flag ? title : ""}` and `${"prefix " + title}` count as well as `${title}`.
 * What makes that practical is that the assumption does not have to be argued
 * away by hand — every such site is proved from its callers, and a caller that
 * passes its own parameter along (`forwarded`) is followed, so the honest false
 * positives document themselves in
 * `docs/security/plain-string-parameters.md` instead of needing an allowlist.
 *
 * **A fragment builder that escapes every interpolation is escaped.** `rows =
 * sessions.map(r => `<td>${escapeHtml(r.name)}</td>`)` is handed tainted rows and
 * returns no tainted text, so it is not itself tainted. The rule is stated over
 * the whole statement, and it is all-or-nothing: one unescaped interpolation in
 * the same statement keeps the local tainted. This is what stops the wider
 * identifier scan from reporting the repository's pre-escaped table fragments.
 *
 * **A value that leaves the file is followed across the export/import edge.**
 * `taintedParameters` walks every in-repository call whose argument is tainted in
 * the caller — a tainted local, another tainted parameter of the same function,
 * or a request/database/environment read written in the argument — and taints the
 * callee's parameter at that position, to a fixed point. That is how
 * `renderX(item: SomeRecord)` receiving a repository read is caught: it is neither
 * a plain `string` (so the caller proof does not judge it) nor a request-shaped
 * name (so the local pass never seeds it), and it used to be the class this file
 * could not see. Resolution runs through the import graph, so a same-named local
 * renderer in another file is never a callee. Each finding prints the call site
 * that carried the value (`via`), which makes the chain auditable rather than a
 * verdict with no trail.
 *
 * **Every spelling of the edge is followed, not only the plain one.** The caller
 * may rename the callee on import (`{ renderItem as paint }`), reach it through a
 * namespace (`* as renderers` then `renderers.renderItem(…)`), or the callee may
 * be an arrow bound with `const` rather than a `function` statement — three ways
 * the same laundry hides behind a name no seed matches. Any of them resolves to
 * the definition the module graph actually reaches. The argument carrying the
 * value is read as a whole, too: `renderItem({ title })`, `{ ...record }` and
 * `{ title: escapeHtml(title) }` do not begin with the tainted name, so a
 * root-only test read `{` and moved on.
 *
 * **A `.map()`/`.forEach()` row is followed, and it is a region, not a name.**
 * The row of `rows.map((r) => `<td>${r.title}</td>`)` is the collection's element,
 * so it is tainted wherever the collection is: by a local
 * (`const rows = listSessions()`), by a read written in the receiver
 * (`listSessions().map(…)`), or by an enclosing row
 * (`rows.map((r) => r.items.map(…)`). It is tainted only between the call's `.`
 * and its closing `)` — a second function's `r` is a different row — which is why
 * this is tracked as a region rather than seeded as a name. The row also carries
 * the value out of the callback: `rows.map((row) => renderCell(row))` and
 * `rows.map(renderCell)` both taint `renderCell`'s first parameter, the second
 * being the same call with the arrow left out. Measured 2026-11-19: **12 rows
 * across 7 files**, one of them the reference form, which moved taint into
 * `instanceFromScreen` — and one row argument into `formatInstant`. That rule was
 * the last shape
 * DEBT-009 recorded as residual; it found two live sites on the first run
 * (`governance-and-operations.ts` printed formatted money columns inside
 * `.map(...)` callbacks), now escaped.
 *
 * **Scope, stated so the claim is not read as wider than it is.** Propagation is
 * seeded from any parameter declared `string`, a *request-shaped parameter name*
 * (`req`, `query`, `params`, …), an expression that reads the request, the
 * environment or a repository accessor, a local assigned from either, a
 * `.map()`/`.forEach()` row whose collection is tainted, and a parameter some
 * in-repository caller hands tainted text — including a plain `string` parameter
 * forwarded into a domain-typed one, which no caller proof could have judged.
 * One limit is deliberately still outside it: markup is judged **per line**, the
 * rule the census uses too, so an interpolation on a tag-less line of a markup
 * template is invisible to both instruments. That is stated in DEBT-009
 * (`docs/design-debt-register.md`) rather than papered over.
 *
 * This file is a report and a ratchet. It does not claim a clean scan proves the
 * absence of XSS — it proves that no value traced from the request, the database
 * or the environment reaches markup on a line that does not escape it, under the
 * propagation stated here.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  ESCAPE_EXPRESSION,
  HTML_TEMPLATE,
  escapesEveryInterpolation,
  expressionEscapes,
  htmlTemplateRanges,
  insideAnyRange,
  markupTemplateRanges,
  statementText,
} from "../helpers/escaped-markup.js";
import {
  analyse,
  callSites,
  classifyArgument,
  matchingDelimiter,
  readEvidenceDocument,
  reachesDefinition,
  reachesDefinitionThrough,
  renderEvidenceDocument,
  splitArguments,
  writeEvidenceDocument,
  type ParameterFinding,
  type SourceText,
} from "../helpers/plain-string-params.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WEB_SRC = path.join(ROOT, "src", "web");

export interface SourceFile {
  /** Path as the failure message should name it: relative, POSIX separators. */
  path: string;
  text: string;
}

export interface TaintedSite {
  file: string;
  line: number;
  expr: string;
  /** Set when the taint is a `.map()`/`.forEach()` row, and where that row came from. */
  row?: string;
  /** Set when the taint entered through a plain `string` parameter of this function. */
  fn?: string;
  param?: string;
  /**
   * Set when the taint entered through a parameter of *this* function whose
   * callers pass tainted text — the cross-file case. Names the call site the
   * value came from and, where it was itself forwarded, the chain behind it.
   */
  via?: string;
}

export interface FunctionScope {
  readonly name: string;
  readonly start: number;
  readonly end: number;
  /** Parameters that carry a request or its parsed parts. */
  readonly requestParams: ReadonlySet<string>;
  /** Parameters declared `string` — external by assumption, proved safe by their callers. */
  readonly stringParams: ReadonlySet<string>;
  readonly params: readonly string[];
}

/**
 * Function spans and parameter types, read with a balanced scan so a multi-line
 * signature or a default value cannot end the declaration early.
 *
 * Two declaration shapes are indexed, because both are export/import edges: a
 * `function` statement and an arrow bound with `const` (`export const renderX =
 * (item: Item) => …`). The second is how a renderer can be exported and still be
 * invisible to a scanner that only looks for the `function` keyword.
 */
export function functionScopes(text: string): FunctionScope[] {
  const scopes: FunctionScope[] = [];
  const declaration =
    /(?:export\s+)?(?:default\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*\(/g;
  for (const match of text.matchAll(declaration)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    const close = matchingDelimiter(text, open);
    if (close === -1) continue;
    const name = match[1] ?? match[2];
    const isArrow = match[1] === undefined;
    const params = splitArguments(
      text
        .slice(open + 1, close)
        .replace(/\/\*\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
    ).map((part) => part.replace(/[:=?].*$/, "").trim()).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));

    const rawParams = splitArguments(
      text
        .slice(open + 1, close)
        .replace(/\/\*\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "")
    );
    const requestParams = new Set(params.filter((name) => REQUEST_PARAMS.has(name)));
    const stringParams = new Set<string>();
    for (const part of rawParams) {
      // `title: string`, `title?: string`, `title: string | undefined` and a
      // defaulted parameter are all plain-string parameters: the value is text
      // this file did not compose, whatever the parameter's name says.
      const typed = /^([A-Za-z_$][\w$]*)\s*\??\s*:\s*string(?:\s*\|\s*(?:undefined|null))*(?:\s*=[\s\S]*)?$/.exec(
        part.trim()
      );
      if (typed) stringParams.add(typed[1]);
    }

    let endIndex: number;
    if (isArrow) {
      // `= (` is only a parameter list when an arrow follows it; a plain
      // assignment of a call is not a declaration and must not become a scope.
      const arrowAt = text.indexOf("=>", close);
      if (arrowAt === -1 || text.slice(close + 1, arrowAt).trim() !== "") continue;
      const bodyAt = arrowAt + 2;
      if (text.slice(bodyAt).trimStart().startsWith("{")) {
        const blockOpen = text.indexOf("{", bodyAt);
        const blockClose = matchingDelimiter(text, blockOpen);
        if (blockOpen === -1 || blockClose === -1) continue;
        endIndex = blockClose;
      } else {
        // An expression body ends at its statement's `;`, so a one-line renderer
        // is a scope exactly as a block-bodied one is.
        endIndex = bodyAt + statementText(text, bodyAt).length;
      }
    } else {
      const bodyOpen = text.indexOf("{", close);
      if (bodyOpen === -1) continue;
      // String-aware: a CSS brace inside a template literal must not end the body.
      const bodyClose = matchingDelimiter(text, bodyOpen);
      if (bodyClose === -1) continue;
      endIndex = bodyClose;
    }
    scopes.push({
      name,
      start: text.slice(0, match.index).split("\n").length,
      end: text.slice(0, endIndex).split("\n").length,
      requestParams,
      stringParams,
      params,
    });
  }
  return scopes;
}

/** The innermost function whose body contains `line` (1-based). */
function innermostScope(scopes: readonly FunctionScope[], line: number): FunctionScope | undefined {
  return scopes
    .filter((scope) => scope.start <= line && line <= scope.end)
    .sort((a, b) => b.start - a.start || a.end - b.end)[0];
}

// ---------------------------------------------------------------------------
// Callback rows
// ---------------------------------------------------------------------------

/**
 * A row bound by a `.map()`/`.forEach()` callback.
 *
 * `rows.map((r) => `<td>${r.title}</td>`)` puts the collection's element into
 * `r`, and the element came from wherever the collection did. Until this pass, a
 * callback parameter was not a function parameter, so `r` was in no seeded set: a
 * tainted list could be printed row by row and the instrument saw nothing. The
 * row is therefore tracked as a *region* — the name is tainted only between the
 * callback's `.` and its closing `)`, not file-wide, because `r` in another
 * function is a different row.
 */
export interface CallbackRow {
  /** The identifier bound to the row, or undefined for `.map(handler)`. */
  readonly name?: string;
  /** The bare function reference `.map(handler)` passes each row to. */
  readonly reference?: string;
  /** Character offset of the `.` that opens the call. */
  readonly start: number;
  /** Character offset of the call's closing `)`. */
  readonly end: number;
  /** Character offset of the `.` — where the receiver expression ends. */
  readonly dotAt: number;
  /** The receiver expression as written: `sessions`, `listSessions()`, `r.items`. */
  readonly collection: string;
  /** 1-based line of the call, named in the report. */
  readonly line: number;
}

const CALLBACK_CALL = /\.\s*(?:map|forEach)\s*\(/g;

/**
 * The opener that matches a closer, scanning backwards. Used only to delimit a
 * receiver expression (`listSessions().map(…)`); an unbalanced scan answers -1 and
 * the caller then treats the receiver as starting at the expression boundary.
 */
function matchingOpenerBackward(text: string, closeAt: number): number {
  const openerFor: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [text[closeAt]];
  for (let i = closeAt - 1; i >= 0; i -= 1) {
    const char = text[i];
    if (char === ")" || char === "]" || char === "}") stack.push(char);
    else if (char === "(" || char === "[" || char === "{") {
      const top = stack.pop();
      if (top === undefined || openerFor[top] !== char) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

/**
 * Where the expression ending at `dotAt` begins, by walking its postfix shape
 * backwards (`identifier`, `a.b`, `a.b()`, `a[i]`, `f(x).g`). Scanning back to the
 * nearest operator would read `const rows = sessions` as the receiver for
 * `sessions.map(…)`; scanning this way reads `sessions` itself.
 */
function expressionStartBefore(text: string, dotAt: number): number {
  let i = dotAt;
  for (;;) {
    while (i > 0 && /\s/.test(text[i - 1])) i -= 1;
    if (i === 0) return 0;
    const char = text[i - 1];
    if (char === ")" || char === "]") {
      const open = matchingOpenerBackward(text, i - 1);
      if (open === -1) return i;
      i = open;
      continue;
    }
    if (/[\w$]/.test(char)) {
      while (i > 0 && /[\w$]/.test(text[i - 1])) i -= 1;
      while (i > 0 && /\s/.test(text[i - 1])) i -= 1;
      if (i >= 3 && text.slice(i - 3, i) === "?.") {
        i -= 2;
        continue;
      }
      if (i >= 1 && text[i - 1] === "." && text[i - 2] !== ".") {
        i -= 1;
        continue;
      }
      return i;
    }
    return i;
  }
}

/**
 * The callback argument's own `=>` and the offset where the call's argument
 * ends. Delimiting the call with `matchingDelimiter` from its `(` does not work
 * for `(r) => …`: the parameter list closes first, so the scan would stop at the
 * `)` of `(r)` and read `r` as a function reference. Here the parameter list is
 * consumed as depth and the arrow is looked for after it.
 */
function callbackArgumentSpan(
  text: string,
  open: number
): { readonly arrow: number; readonly end: number } | undefined {
  let depth = 0;
  let quote: string | null = null;
  let arrow = -1;
  for (let i = open + 1; i < text.length; i += 1) {
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
    if ("([{".includes(char)) {
      depth += 1;
      continue;
    }
    if (")]}".includes(char)) {
      if (depth === 0) return arrow === -1 ? undefined : { arrow, end: i };
      depth -= 1;
      continue;
    }
    if (depth === 0 && char === "=" && text[i + 1] === ">") {
      arrow = i;
      i += 1;
      continue;
    }
    if (depth === 0 && char === ",") return arrow === -1 ? undefined : { arrow, end: i };
  }
  return undefined;
}

/**
 * Every `.map()`/`.forEach()` call with a callback this pass can name: an arrow
 * whose first parameter is an identifier (`(r) => …`, `r => …`), or a bare
 * function reference (`.map(renderRow)`), which passes the row to that function's
 * first parameter exactly as the arrow would.
 *
 * Structural only — whether the *collection* is tainted is decided in `fileTaint`,
 * because that answer depends on this file's locals and on the rows already in
 * scope (a nested `.map` over `r.items`).
 */
function callbackRows(text: string): CallbackRow[] {
  const rows: CallbackRow[] = [];
  for (const match of text.matchAll(CALLBACK_CALL)) {
    const dotAt = match.index ?? 0;
    const open = dotAt + match[0].length - 1;
    const span = callbackArgumentSpan(text, open);
    const close = span?.end ?? matchingDelimiter(text, open);
    if (close === -1) continue;
    const argument = text.slice(open + 1, close);
    const line = text.slice(0, dotAt).split("\n").length;
    const collection = text.slice(expressionStartBefore(text, dotAt), dotAt).trim();

    if (span === undefined) {
      const bare = /^([A-Za-z_$][\w$]*)\s*$/.exec(argument);
      if (bare) rows.push({ reference: bare[1], start: dotAt, end: close, dotAt, collection, line });
      continue;
    }

    const paramsText = text.slice(open + 1, span.arrow).trim().replace(/^async\s+/, "");
    const unwrapped = paramsText.startsWith("(")
      ? paramsText.slice(1, paramsText.lastIndexOf(")"))
      : paramsText;
    const first = splitArguments(unwrapped)[0]?.replace(/[:=?].*$/, "").trim() ?? "";
    if (!/^[A-Za-z_$][\w$]*$/.test(first)) continue;
    rows.push({ name: first, start: dotAt, end: close, dotAt, collection, line });
  }
  return rows;
}

/** Character offset of each 1-based line start. */
function lineOffsets(text: string): number[] {
  const offsets: number[] = [];
  let running = 0;
  for (const line of text.split("\n")) {
    offsets.push(running);
    running += line.length + 1;
  }
  return offsets;
}

/** Row names in scope at `offset` — the regions whose call contains it. */
function rowNamesAt(rows: readonly CallbackRow[], offset: number): string[] {
  return rows
    .filter((row) => row.start <= offset && offset <= row.end && row.name !== undefined)
    .map((row) => row.name as string);
}

/**
 * Row names in scope on a *line* — the regions the line overlaps. A rendered
 * line begins before the `.map(` it contains, so a point test at the line start
 * would miss the row that is printed on it.
 */
function rowNamesOverlapping(rows: readonly CallbackRow[], from: number, to: number): string[] {
  return rows
    .filter((row) => row.start <= to && from <= row.end && row.name !== undefined)
    .map((row) => row.name as string);
}

/** The row a name is bound by, at a given offset — for the report's provenance. */
function rowBindingAt(rows: readonly CallbackRow[], name: string, offset: number): CallbackRow | undefined {
  return rows.find((row) => row.name === name && row.start <= offset && offset <= row.end);
}

export interface FileTaint {
  /** Locals and request-shaped parameters, tainted file-wide. */
  readonly names: ReadonlySet<string>;
  /** Callback rows whose collection is tainted, tainted inside their call only. */
  readonly rows: readonly CallbackRow[];
}

const FILE_TAINT = new WeakMap<SourceFile, FileTaint>();

/**
 * This file's taint, to a fixed point: request-shaped parameters seed it, a local
 * assigned from a tainted expression joins it, and a callback row joins it when
 * its receiver is tainted *at the call* — by a tainted local, by a read written in
 * the receiver (`listSessions().map(…)`), or by an enclosing row
 * (`rows.map((r) => r.items.map(…)`).
 *
 * The row is a region, not a name: `r` is tainted from the call's `.` to its
 * closing `)`, which is what stops a second function's `r` from inheriting it.
 */
export function fileTaint(file: SourceFile): FileTaint {
  const cached = FILE_TAINT.get(file);
  if (cached) return cached;

  const raw = callbackRows(file.text);
  const lines = file.text.split("\n");
  const offsets = lineOffsets(file.text);
  const names = new Set<string>();

  // Seeding every request-shaped parameter of every function is deliberately
  // blunt: a renderer that takes `params` is assumed to receive request data,
  // and the propagation below decides what happens to it.
  for (const scope of functionScopes(file.text)) {
    for (const name of scope.requestParams) names.add(name);
  }

  let rows: CallbackRow[] = [];
  for (let pass = 0; pass < 12; pass += 1) {
    let changed = false;

    const nextRows: CallbackRow[] = [];
    for (const row of raw) {
      if (rows.includes(row)) {
        nextRows.push(row);
        continue;
      }
      const taintedHere = new Set([...names, ...rowNamesAt(rows, row.dotAt)]);
      const direct = TAINT_SOURCES.some((pattern) => pattern.test(row.collection));
      const indirect = identifiersRead(row.collection).some((name) => taintedHere.has(name));
      if (direct || indirect) nextRows.push(row);
    }
    if (nextRows.length !== rows.length) changed = true;
    rows = nextRows;

    for (const [index, line] of lines.entries()) {
      const assignment = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(.*)$/.exec(
        line.trim()
      );
      if (!assignment) continue;
      const [, name, expression] = assignment;
      if (names.has(name)) continue;
      // A local that is escaped where it is defined is not tainted at the point it
      // is printed: `const safeTitle = escapeHtml(title)` makes `${safeTitle}` safe.
      // An `html` template is escaped at the write boundary, so its result is
      // markup too — interpolating it into a plain template is correct.
      if (ESCAPES_ON_LINE.test(expression) || HTML_TEMPLATE.test(expression)) continue;
      // …nor is a fragment builder that escapes every interpolation it composes,
      // however many lines that statement runs over.
      if (escapesEveryInterpolation(statementText(lines.slice(index).join("\n"), 0))) continue;
      // A statement that overlaps a callback may read that callback's row: on a
      // one-line renderer the `const` comes before the `.map(`, so a point test at
      // the line start would miss the row entirely.
      const here = new Set([
        ...names,
        ...rowNamesOverlapping(rows, offsets[index], offsets[index] + line.length),
      ]);
      const direct = TAINT_SOURCES.some((pattern) => pattern.test(expression));
      const indirect = [...here].some((local) => new RegExp(`\\b${local}\\b`).test(expression));
      if (direct || indirect) {
        names.add(name);
        changed = true;
      }
    }

    if (!changed) break;
  }

  const flow: FileTaint = { names, rows };
  FILE_TAINT.set(file, flow);
  return flow;
}

/** Expressions that put attacker-influenced text into a template. */
const TAINT_SOURCES: readonly RegExp[] = [
  /\breq\./,
  /\brequest\./,
  /searchParams/,
  /parsedUrl/,
  /\bctx\./,
  /\.headers\[/,
  /process\.env/,
  /\bprisma\./,
  /getPrismaClient/,
  /decodeURIComponent/,
  /JSON\.parse/,
  /readFormBody/,
  /params\[/,
  /String\(req/,
  /\burlObj\b/,
  // Repository and registry reads: a stored record's text is stored text, not
  // this file's own literal, so it is tainted like a request field.
  /\b(?:load|list|find|read|loadAll|select)[A-Z]\w*\(/,
];

/** Parameter names that carry a request or its parsed parts. */
const REQUEST_PARAMS = new Set([
  "req",
  "request",
  "ctx",
  "url",
  "query",
  "pathname",
  "params",
  "raw",
  "input",
  "payload",
  "form",
  "body",
  "urlObj",
]);

const INTERPOLATION = /\$\{([^{}]*)\}/g;
const IDENTIFIER_AT_START = /^[A-Za-z_$][\w$]*/;

/**
 * The escaping this instrument accepts as a boundary on the rendered line.
 * `esc(` is the alias the broadcast surfaces import (`esc = escapeHtml`); leaving
 * it out would report correctly-escaped output as a finding.
 */
const ESCAPES_ON_LINE = /escapeHtml\(|\besc\(|sanitize[A-Za-z]*\(|encodeURIComponent\(/;

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) tsFiles(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

function readSources(): SourceFile[] {
  return tsFiles(WEB_SRC).map((abs) => ({
    path: path.relative(ROOT, abs).split(path.sep).join("/"),
    text: readFileSync(abs, "utf8"),
  }));
}

/** Tainted local names in one file (the file-wide half of `fileTaint`). */
export function taintedLocals(file: SourceFile): Set<string> {
  return new Set(fileTaint(file).names);
}

export interface CrossFileTaint {
  /** `file::function` → parameters whose in-repository callers pass tainted text. */
  readonly params: ReadonlyMap<string, ReadonlySet<string>>;
  /** `file::function::param` → the call site that tainted it, and what it came from. */
  readonly via: ReadonlyMap<string, string>;
}

const FLOWS = new WeakMap<readonly SourceFile[], CrossFileTaint>();

interface Definition {
  readonly file: SourceFile;
  /** The name the file *declares*, which the callee's `params` key is built from. */
  readonly name: string;
  readonly params: readonly string[];
}

function definitionsOf(sources: readonly SourceFile[]): Map<string, Definition[]> {
  const index = new Map<string, Definition[]>();
  for (const file of sources) {
    for (const scope of functionScopes(file.text)) {
      const list = index.get(scope.name) ?? [];
      list.push({ file, name: scope.name, params: scope.params });
      index.set(scope.name, list);
    }
  }
  return index;
}

/**
 * What a file's `import` statements renamed, in both directions that matter:
 * `{ renderItem as paint }` means the call site says `paint` while the callee is
 * declared `renderItem`, and `* as renderers` means a call can be written
 * `renderers.renderItem(...)`. Both are export/import edges; reading a call only
 * by the identifier in front of the `(` would run the edge to nothing.
 */
interface ImportBindings {
  /** local name → the name and module the file imported it from. */
  readonly names: ReadonlyMap<string, { readonly imported: string; readonly specifier: string }>;
  /** namespace alias → its module specifier. */
  readonly namespaces: ReadonlyMap<string, string>;
}

const BINDINGS = new WeakMap<SourceFile, ImportBindings>();

function importBindings(file: SourceFile): ImportBindings {
  const cached = BINDINGS.get(file);
  if (cached) return cached;
  const names = new Map<string, { imported: string; specifier: string }>();
  const namespaces = new Map<string, string>();
  for (const match of file.text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    for (const part of match[1].split(",")) {
      const cleaned = part.replace(/\btype\b/, "").trim();
      if (cleaned === "") continue;
      const [imported, local] = cleaned.split(/\s+as\s+/).map((piece) => piece.trim());
      names.set(local ?? imported, { imported, specifier: match[2] });
    }
  }
  for (const match of file.text.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s*["']([^"']+)["']/g)) {
    namespaces.set(match[1], match[2]);
  }
  const bindings: ImportBindings = { names, namespaces };
  BINDINGS.set(file, bindings);
  return bindings;
}

/**
 * A name in an argument that is tainted, ignoring occurrences inside an escaping
 * call. An argument can carry taint without *starting* with it — `{ title }`,
 * `{ ...record }` and `{ title: escapeHtml(title) }` all sit where a root-only test
 * reads `{` and gives up, which is how a shorthand object laundered a request
 * value into a domain-typed parameter unseen.
 */
function taintedNameIn(argument: string, names: ReadonlySet<string>): string | undefined {
  const withoutEscapes = argument.replace(
    /(?:escapeHtml|esc|sanitize[A-Za-z]*|encodeURIComponent)\s*\([^()]*\)/g,
    ""
  );
  return identifiersRead(withoutEscapes).find((name) => names.has(name));
}

/**
 * Taint that crosses a file boundary.
 *
 * The per-file pass can only see a value until it is handed to another
 * renderer, which is where the repository's own shape puts its most awkward
 * case: `renderX(item: ItemRecord)` is neither a plain `string` (so the caller
 * proof does not judge it) nor a request-shaped name (so the local pass never
 * seeds it). A repository read handed into such a parameter is exactly the
 * laundry the register admitted was invisible: the value leaves the file that
 * read it, arrives under a new name, and is printed somewhere neither instrument
 * was looking.
 *
 * This computes the missing edges: for every in-repository call whose argument is
 * tainted in the caller (a tainted local, another tainted parameter of the same
 * function, or a request/database/environment read written in the argument
 * itself), the callee's parameter at that position is tainted — to a fixed point,
 * so a two-hop laundered value arrives tainted at the renderer. Resolution uses
 * the import graph (`reachesDefinition`), not the function's name alone: three
 * workspaces each declare `renderEmptyRecords`, and reading one as another's
 * callee would move taint along an edge that does not exist.
 *
 * Escaping at the call is a boundary (`renderInner(escapeHtml(title))` passes
 * text this repository escaped), and a literal argument is a boundary too. An
 * unresolvable import specifier (a path alias) is treated as reachable, which can
 * only over-report — the report names the call site it followed, so an
 * over-inclusion is visible.
 */
export function taintedParameters(sources: readonly SourceFile[]): CrossFileTaint {
  const cached = FLOWS.get(sources);
  if (cached) return cached;

  const definitions = definitionsOf(sources);
  const params = new Map<string, Set<string>>();
  const via = new Map<string, string>();
  const scopesByFile = new Map<string, readonly FunctionScope[]>();
  const localsByFile = new Map<string, Set<string>>();
  const rowsByFile = new Map<string, readonly CallbackRow[]>();
  for (const file of sources) {
    const taint = fileTaint(file);
    scopesByFile.set(file.path, functionScopes(file.text));
    localsByFile.set(file.path, new Set(taint.names));
    rowsByFile.set(file.path, taint.rows);
  }

  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    for (const file of sources) {
      const locals = localsByFile.get(file.path) ?? new Set<string>();
      const scopes = scopesByFile.get(file.path) ?? [];
      const { names: bindings, namespaces } = importBindings(file);
      const rows = rowsByFile.get(file.path) ?? [];
      // A namespace call (`renderers.renderItem(…)`) is matched by the member,
      // a plain call by the identifier in front of the paren.
      for (const match of file.text.matchAll(
        /(^|[^.\w$])(?:([A-Za-z_$][\w$]*)\.)?([A-Za-z_$][\w$]*)\s*\(/g
      )) {
        const namespace = match[2];
        const local = match[3];
        const namespaceSpecifier = namespace ? namespaces.get(namespace) : undefined;
        if (namespace !== undefined && namespaceSpecifier === undefined) continue;
        // `{ renderItem as paint }` means the callee is declared under another
        // name than the one the call site writes.
        const declared = namespace !== undefined ? local : bindings.get(local)?.imported ?? local;
        const candidates = definitions.get(declared);
        if (candidates === undefined) continue;
        const nameAt = (match.index ?? 0) + (match[1] ? match[1].length : 0) + (namespace ? namespace.length + 1 : 0);
        // The declaration is not a call.
        if (/(?:export\s+)?(?:async\s+)?function\s+$/.test(file.text.slice(0, nameAt))) continue;
        const parenAt = file.text.indexOf("(", nameAt);
        if (parenAt === -1) continue;
        const closeAt = matchingDelimiter(file.text, parenAt);
        if (closeAt === -1) continue;
        const line = file.text.slice(0, match.index).split("\n").length;
        const caller = scopes
          .filter((scope) => scope.start <= line && line <= scope.end)
          .sort((a, b) => b.start - a.start || a.end - b.end)[0];
        const inherited = caller ? params.get(`${file.path}::${caller.name}`) : undefined;
        // A row of a tainted `.map()`/`.forEach()` is tainted at the call, exactly
        // as a local is: `items.map((row) => renderItem(row))` hands the element
        // to a renderer under a name no seed would have matched.
        const callAt = match.index ?? 0;
        const rowsHere = rowNamesAt(rows, callAt);
        // A plain `string` parameter is external by assumption, so forwarding it
        // into a domain-typed parameter is the same laundry as forwarding a
        // request read: the callee is judged by taint, and no caller proof
        // reaches a parameter that is not typed `string`.
        const seeds = new Set<string>([
          ...locals,
          ...(inherited ?? []),
          ...(caller?.stringParams ?? []),
          ...rowsHere,
        ]);

        splitArguments(file.text.slice(parenAt + 1, closeAt)).forEach((argument, index) => {
          const trimmed = argument.trim();
          if (trimmed === "") return;
          // Escaped or literal at the call: the callee is handed nothing raw.
          if (ESCAPE_EXPRESSION.test(trimmed)) return;
          if (/^(?:"[^"]*"|'[^']*'|`[^`$]*`|-?\d+(?:\.\d+)?|true|false|null|undefined)$/.test(trimmed)) return;
          // A renderer whose own body escapes every interpolation it composes is
          // a boundary: whatever text it is handed, its output carries none of it
          // raw. `renderSearchForm(query)` is the shape this closes, and a
          // template that composes such calls (`${taskTable(tasks)}` plus literal
          // prose) is judged by the same value-level rule the census uses.
          if (expressionEscapes(trimmed, { sources })) return;

          let from: string | undefined;
          if (TAINT_SOURCES.some((pattern) => pattern.test(trimmed))) {
            from = "a request, database or environment read";
          } else {
            const read = taintedNameIn(trimmed, seeds);
            if (read !== undefined) {
              const row = rowsHere.includes(read) ? rowBindingAt(rows, read, callAt) : undefined;
              if (row !== undefined) from = `a row of a tainted collection (\`${row.collection}\`)`;
              else if (locals.has(read)) from = `a tainted local of the caller (\`${read}\`)`;
              else if (inherited?.has(read)) {
                from = via.get(`${file.path}::${caller?.name}::${read}`) ?? "a tainted parameter of the caller";
              } else from = `a plain-string parameter of the caller (\`${read}\`)`;
            }
          }
          if (from === undefined) return;

          for (const definition of candidates) {
            const reaches =
              namespaceSpecifier === undefined
                ? reachesDefinition(file, local, definition.file.path, sources)
                : reachesDefinitionThrough(namespaceSpecifier, declared, file.path, definition.file.path, sources);
            if (!reaches) continue;
            const parameter = definition.params[index];
            if (parameter === undefined) continue;
            const key = `${definition.file.path}::${definition.name}`;
            const set = params.get(key) ?? new Set<string>();
            if (set.has(parameter)) continue;
            set.add(parameter);
            params.set(key, set);
            via.set(`${key}::${parameter}`, `${file.path}:${line} passes it from ${from}`);
            changed = true;
          }
        });
      }

      // `.map(renderItem)` is the same edge written as a reference: each row is
      // the function's first argument, so the parameter that receives it is
      // tainted exactly as `.map((row) => renderItem(row))` would taint it.
      for (const row of rows) {
        if (row.reference === undefined) continue;
        const declaredReference = bindings.get(row.reference)?.imported ?? row.reference;
        const referenceCandidates = definitions.get(declaredReference);
        if (referenceCandidates === undefined) continue;
        for (const definition of referenceCandidates) {
          if (!reachesDefinition(file, row.reference, definition.file.path, sources)) continue;
          const parameter = definition.params[0];
          if (parameter === undefined) continue;
          const key = `${definition.file.path}::${definition.name}`;
          const set = params.get(key) ?? new Set<string>();
          if (set.has(parameter)) continue;
          set.add(parameter);
          params.set(key, set);
          via.set(
            `${key}::${parameter}`,
            `${file.path}:${row.line} passes each row of \`${row.collection}\` to it`
          );
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  const flow: CrossFileTaint = { params, via };
  FLOWS.set(sources, flow);
  return flow;
}

/** True when every use of a tainted name in the expression is a comparison subject. */
function comparisonOnly(expression: string, tainted: Set<string>): boolean {
  let remainder = expression;
  for (const local of tainted) {
    const compared = new RegExp(
      `\\b${local}\\b(?:\\.[\\w$]+)*\\s*[!=]==?\\s*(?:"[^"]*"|'[^']*'|-?\\d+(?:\\.\\d+)?)`,
      "g"
    );
    remainder = remainder.replace(compared, "COMPARISON");
  }
  return ![...tainted].some((local) => new RegExp(`\\b${local}\\b`).test(remainder));
}

/** True when the expression yields a number whatever the collection holds. */
function numericByType(expression: string): boolean {
  return /^[A-Za-z_$][\w$.]*\.length$/.test(expression.trim());
}

/**
 * Every interpolation into a rendered line whose value derives from the
 * request, the database or the environment, on a line that does not escape it.
 */
/**
 * Identifiers an expression reads, excluding property names (`x.role` reads `x`).
 * This is what lets the pass see a seeded name in *any* position, not only at the
 * start: `${flag ? title : ""}` and `${"prefix " + title}` carry `title` through a
 * ternary or a concatenation, which a root-identifier test misses entirely.
 */
function identifiersRead(expression: string): string[] {
  const names: string[] = [];
  for (const match of expression.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)) names.push(match[1]);
  return names;
}

/**
 * True when an expression's *emitted value* cannot contain a tainted name: a
 * ternary whose branches are literals, whatever its condition reads. The narrower
 * `comparisonOnly` carve-out covers `x === "lit"`; this covers `x === other ?
 * "a" : "b"`, where the name decides the value but never appears in it.
 */
function emitsOnlyLiterals(expression: string, names: ReadonlySet<string>): boolean {
  const question = expression.indexOf("?");
  if (question === -1) return false;
  let depth = 0;
  let nestedTernaries = 0;
  for (let i = question + 1; i < expression.length; i += 1) {
    const char = expression[i];
    if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === "?" && depth === 0) nestedTernaries += 1;
    else if (char === ":" && depth === 0) {
      if (nestedTernaries === 0) {
        const branches = [expression.slice(question + 1, i), expression.slice(i + 1)];
        return branches.every(
          (branch) => ![...names].some((name) => new RegExp(`\\b${name}\\b`).test(branch))
        );
      }
      nestedTernaries -= 1;
    }
  }
  return false;
}

export function findTaintedMarkupInterpolations(
  sources: SourceFile[],
  flow: CrossFileTaint = taintedParameters(sources)
): TaintedSite[] {
  const findings: TaintedSite[] = [];

  for (const file of sources) {
    const { names: tainted, rows } = fileTaint(file);
    const scopes = functionScopes(file.text);
    const seededByParameter = scopes.some((scope) => scope.stringParams.size > 0);
    // A file whose only taint arrives through a domain-typed parameter has no
    // local and no `string` parameter — skipping it here would make the
    // export/import edge invisible in exactly the files it exists to reach.
    const seededAcrossFiles = scopes.some(
      (scope) => (flow.params.get(`${file.path}::${scope.name}`) ?? new Set()).size > 0
    );
    if (tainted.size === 0 && !seededByParameter && rows.length === 0 && !seededAcrossFiles) continue;
    const offsets = lineOffsets(file.text);
    // Interpolations inside an `html` template are escaped by the tag.
    const escapedRanges = htmlTemplateRanges(file.text);
    // Markup is a region, not a line: a tag-less line inside a markup template
    // (`<td>` on one line, `${cell}` on the next) is measured too.
    const markupRanges = markupTemplateRanges(file.text);

    file.text.split("\n").forEach((line, index) => {
      if (!/[<>][a-zA-Z]/.test(line) && !insideAnyRange(markupRanges, offsets[index])) return;

      const scope = innermostScope(scopes, index + 1);
      // Parameters tainted across a file boundary are in scope exactly as a local is.
      const foreign = scope ? flow.params.get(`${file.path}::${scope.name}`) : undefined;
      // A callback row is in scope only inside its own `.map()`/`.forEach()`.
      const idsFromRows = rowNamesOverlapping(rows, offsets[index], offsets[index] + line.length);
      const names = new Set([
        ...tainted,
        ...(scope ? scope.stringParams : []),
        ...(foreign ?? []),
        ...idsFromRows,
      ]);

      for (const match of line.matchAll(INTERPOLATION)) {
        const expression = match[1].trim();
        // Escaped at the write boundary: the `html` tag escapes this value.
        if (insideAnyRange(escapedRanges, offsets[index] + (match.index ?? 0))) continue;
        // Escaping is judged per interpolation, not per line: a second
        // interpolation on a line that happens to contain `escapeHtml(` is not
        // escaped by its neighbour's call.
        // One definition of "escaped" for both instruments: the census's
        // value-level rule — an escaping call, an `html` template, a number, a
        // conditional whose every branch proves, a call to a renderer that
        // escapes its own leaves, or a value proved escaped where it was
        // assigned. Judged per interpolation, not per line.
        if (expressionEscapes(expression, { sources, text: file.text })) continue;
        if (numericByType(expression)) continue;
        if (comparisonOnly(expression, names)) continue;
        if (emitsOnlyLiterals(expression, names)) continue;

        // The seeded name may appear anywhere in the expression, not just at its
        // start: a ternary or a concatenation emits it just as directly.
        const read = identifiersRead(expression);
        const taintedName = read.find((name) => tainted.has(name));
        const paramName = read.find((name) => !tainted.has(name) && scope?.stringParams.has(name));
        const taintedLocally = taintedName !== undefined;
        const fromStringParam = paramName !== undefined && scope !== undefined;
        const foreignName = read.find((name) => foreign?.has(name));
        const rowName = read.find((name) => idsFromRows.includes(name));
        // Overlap, not a point at the line start: a line begins before the
        // `.map(` whose row it prints.
        const rowBinding =
          rowName === undefined
            ? undefined
            : rows.find(
                (row) =>
                  row.name === rowName &&
                  row.start <= offsets[index] + line.length &&
                  offsets[index] <= row.end
              );

        // A call can carry taint without exposing it in its own name:
        // `${renderX(record.title)}` is exactly the shape the census cannot see.
        const callCarriesTaint = [...expression.matchAll(/([A-Za-z_$][\w$]*)\(([^()]*)\)/g)]
          .flatMap((call) => call[2].split(","))
          .some((argument) => {
            const argumentRoot = IDENTIFIER_AT_START.exec(argument.trim())?.[0];
            return argumentRoot !== undefined && names.has(argumentRoot);
          });

        if (
          taintedLocally ||
          fromStringParam ||
          callCarriesTaint ||
          foreignName !== undefined ||
          rowName !== undefined
        ) {
          findings.push({
            file: file.path,
            line: index + 1,
            expr: `\${${expression}}`,
            ...(fromStringParam ? { fn: scope!.name, param: paramName! } : {}),
            ...(foreignName !== undefined
              ? { via: flow.via.get(`${file.path}::${scope?.name}::${foreignName}`) ?? foreignName }
              : {}),
            ...(rowBinding === undefined
              ? {}
              : {
                  row:
                    rowBinding.name === undefined
                      ? `a row of \`${rowBinding.collection}\` (${rowBinding.line})`
                      : `a row \`${rowBinding.name}\` of \`${rowBinding.collection}\` (${rowBinding.line})`,
                }),
          });
        }
      }
    });
  }

  return findings;
}

/** Findings that entered through a plain `string` parameter, with their callers' evidence. */
export function parameterFindings(sources: SourceFile[]): ParameterFinding[] {
  return findTaintedMarkupInterpolations(sources)
    .filter((site): site is TaintedSite & { fn: string; param: string } => site.fn !== undefined && site.param !== undefined)
    .map((site) => ({ file: site.file, line: site.line, expr: site.expr, fn: site.fn, param: site.param }));
}

const key = (site: Pick<TaintedSite, "file" | "expr">): string => `${site.file}::${site.expr}`;

describe("escape taint: no request-derived value reaches markup unescaped", () => {
  const sources = readSources();

  /**
   * Parameter sites are documented by evidence, not by a hand-written list: a
   * site is accepted when every in-repository caller hands that parameter a
   * literal, an escaped value or a module constant. The evidence itself is the
   * checked-in document generated below, so this set cannot drift from it.
   */
  function parameterSites(): ReturnType<typeof analyse> {
    return analyse(parameterFindings(sources));
  }

  it("finds no undocumented tainted interpolation in src/web", () => {
    // The hand-written exception list this test used to consult is empty and
    // deleted: the burn-down escaped every site, so nothing needs excusing. A
    // future site is a finding, not an entry to add.
    const documented = new Set(
      parameterSites().filter((site) => site.safe).map((site) => `${site.file}::${site.expr}`)
    );
    const undocumented = findTaintedMarkupInterpolations(sources)
      .filter((site) => !documented.has(key(site)))
      .map(
        (site) =>
          `${site.file}:${site.line}  ${site.expr}${site.via ? `  ← ${site.via}` : ""}`
      );

    expect(
      undocumented,
      `request/database-derived values interpolated into markup without an escaping call on the line:\n${undocumented.join("\n")}`
    ).toEqual([]);
  });

  it("treats a plain string parameter as external, whatever its name says", () => {
    const probe: SourceFile[] = [
      {
        path: "probe.ts",
        text: [
          "export function renderPanel(title: string) {",
          "  return `<h2>${title}</h2>`;",
          "}",
        ].join("\n"),
      },
    ];
    const found = parameterFindings(probe);
    expect(found.map((site) => ({ fn: site.fn, param: site.param, expr: site.expr }))).toEqual([
      { fn: "renderPanel", param: "title", expr: "${title}" },
    ]);

    // The seed is the *type*, not the name: `req`-style seeding would never see it.
    expect(REQUEST_PARAMS.has("title")).toBe(false);
  });

  /**
   * The name is looked for anywhere in the expression, so the shapes that carry a
   * parameter through a ternary or a concatenation — the last hole the register
   * named — are measured too.
   */
  it("sees a plain string parameter carried through a ternary, a concatenation or an optional type", () => {
    const probe = (body: string, signature = "export function renderPanel(title?: string, flag?: boolean) {"): SourceFile[] => [
      { path: "probe.ts", text: [signature, body, "}"].join("\n") },
    ];

    expect(
      findTaintedMarkupInterpolations(probe('  return `<p>${flag ? title : ""}</p>`;')).map((site) => site.expr)
    ).toEqual(['${flag ? title : ""}']);
    expect(
      findTaintedMarkupInterpolations(probe('  return `<p>${"prefix " + title}</p>`;')).map((site) => site.expr)
    ).toEqual(['${"prefix " + title}']);
    // `title: string | undefined` is still a plain-string parameter.
    expect(
      findTaintedMarkupInterpolations(probe('  return `<p>${title ?? ""}</p>`;', "export function renderPanel(title: string | undefined) {"))
    ).not.toEqual([]);
    // …and an escaped one is still a boundary, wherever it appears.
    expect(findTaintedMarkupInterpolations(probe('  return `<p>${flag ? escapeHtml(title) : ""}</p>`;'))).toEqual(
      []
    );

    // A fragment builder that escapes every interpolation composes no tainted
    // text, even though its input rows are tainted; one raw interpolation in the
    // same statement means it does, and the rule is deliberately all-or-nothing.
    const builder = (row: string): SourceFile[] => [
      {
        path: "probe.ts",
        text: [
          "function listSessions(): { name: string; note: string }[] {",
          "  return [];",
          "}",
          "export function renderPanel() {",
          "  const rows = listSessions()",
          "    .map((record) => `<tr><td>" + row + "</td></tr>`)",
          '    .join("");',
          "  return `<table>${rows}</table>`;",
          "}",
        ].join("\n"),
      },
    ];
    expect(findTaintedMarkupInterpolations(builder("${escapeHtml(record.name)}"))).toEqual([]);
    // One raw cell taints the builder *and* is a finding in its own right: the
    // row comes from `listSessions()`, so `${record.note}` is the callback-row
    // case this instrument used to be blind to, and both are reported.
    expect(findTaintedMarkupInterpolations(builder("${record.note}")).map((site) => site.expr)).toEqual([
      "${record.note}",
      "${rows}",
    ]);
  });

  /**
   * The false positives this pass used to produce, and the reason it no longer
   * needs a hand-written exception for either: a forwarded parameter is followed
   * to the value that actually reaches it, and a declaration is not a call.
   */
  it("follows a forwarded parameter to its source, and still fails a request-derived one", () => {
    const sources: SourceText[] = [
      {
        path: "forwarded.ts",
        text: [
          "export function renderInner(label: string) {",
          "  return `<b>${label}</b>`;",
          "}",
          "export function renderMiddle(heading: string) {",
          "  return renderInner(heading);",
          "}",
          "export function renderOuter(title: string) {",
          "  return renderMiddle(title);",
          "}",
          'renderOuter("A literal heading");',
        ].join("\n"),
      },
      {
        // Two renderers of the same name in different files: the other
        // *declaration* must not be read as a caller passing `note: string`.
        path: "sibling.ts",
        text: ["function renderInner(note: string) {", "  return `<p>${note}</p>`;", "}"].join("\n"),
      },
    ];

    const analysed = analyse(parameterFindings(sources), sources);
    const inner = analysed.find((site) => site.file === "forwarded.ts" && site.fn === "renderInner");
    expect(inner?.safe, JSON.stringify(inner?.callSites)).toBe(true);
    expect(inner?.callSites[0]?.verdict).toBe("forwarded");
    // The chain names where the value actually came from, so the document is
    // evidence rather than a verdict with no audit trail.
    expect(inner?.callSites[0]?.via?.length, "the forward chain is recorded").toBeGreaterThan(0);
    expect(inner?.callSites[0]?.via?.join(" ")).toContain("forwarded.ts:9");

    const sibling = analysed.find((site) => site.file === "sibling.ts");
    expect(sibling?.callSites.map((site) => site.verdict), "a declaration is not a call site").toEqual([
      "unmounted",
    ]);

    // The carve-out stops at the request: no amount of forwarding makes this safe.
    const hostile: SourceText[] = [
      {
        path: "hostile.ts",
        text: [
          "export function renderInner(label: string) {",
          "  return `<b>${label}</b>`;",
          "}",
          "export function renderOuter(req: { query: Record<string, string> }) {",
          "  return renderInner(req.query.label);",
          "}",
        ].join("\n"),
      },
    ];
    expect(classifyArgument("req.query.label", hostile[0], hostile, 5)).toBe("request-derived");
    expect(callSites("renderInner", "label", hostile)[0]?.verdict).toBe("request-derived");
    expect(analyse(parameterFindings(hostile), hostile).every((site) => !site.safe)).toBe(true);
  });

  /**
   * The last laundering route: a value read in one file, handed to a renderer in
   * another under a domain-typed name, printed there. `renderItem(item: Item)` is
   * neither a plain `string` (so the caller proof does not judge it) nor a
   * request-shaped name (so the local pass never seeds it) — it is the case the
   * register called invisible, and the one the export/import edges close.
   */
  it("follows a request value across a file boundary through a domain-typed parameter", () => {
    const sources: SourceFile[] = [
      {
        path: "fixture/render/item.ts",
        text: [
          "export function renderItem(item: { title: string }) {",
          "  return `<h2>${item.title}</h2>`;",
          "}",
          "export function renderConstant(item: { title: string }) {",
          "  return `<h2>${item.title}</h2>`;",
          "}",
          "export function renderSafeItem(title: string) {",
          "  return `<h2>${title}</h2>`;",
          "}",
        ].join("\n"),
      },
      {
        // The caller reads a record and passes it under a new name.
        path: "fixture/caller/page.ts",
        text: [
          'import { renderItem, renderConstant, renderSafeItem } from "../render/item.js";',
          "const SAMPLE_ITEM = { title: \"Fixed heading\" };",
          "function loadItem(id: string) {",
          "  return { title: id };",
          "}",
          "export function page(id: string) {",
          "  return renderItem(loadItem(id));",
          "}",
          "export function constantPage() {",
          "  return renderConstant(SAMPLE_ITEM);",
          "}",
          "export function escapedPage(id: string) {",
          "  return renderSafeItem(escapeHtml(id));",
          "}",
        ].join("\n"),
      },
      {
        // Two hops: read → middle parameter → renderer parameter.
        path: "fixture/caller/deep.ts",
        text: [
          'import { renderItem } from "../render/item.js";',
          "function loadItem(id: string) {",
          "  return { title: id };",
          "}",
          "function middle(item: { title: string }) {",
          "  return renderItem(item);",
          "}",
          "export function deep(id: string) {",
          "  return middle(loadItem(id));",
          "}",
        ].join("\n"),
      },
      {
        // A same-named renderer nobody imports: no edge runs to it.
        path: "fixture/other/local.ts",
        text: [
          "export function renderItem(item: { title: string }) {",
          "  return `<h2>${item.title}</h2>`;",
          "}",
        ].join("\n"),
      },
    ];

    const flow = taintedParameters(sources);
    expect([...(flow.params.get("fixture/render/item.ts::renderItem") ?? [])], "the read reaches the renderer")
      .toEqual(["item"]);
    // …and it is recorded as a chain, so the report names the call site.
    const via = flow.via.get("fixture/render/item.ts::renderItem::item") ?? "";
    expect(via).toContain("fixture/caller/");

    // Boundaries: a module constant and an escaping call taint nothing.
    expect(flow.params.get("fixture/render/item.ts::renderConstant")).toBeUndefined();
    expect(flow.params.get("fixture/render/item.ts::renderSafeItem")).toBeUndefined();
    // Name alone never creates an edge.
    expect(flow.params.get("fixture/other/local.ts::renderItem"), "a same-named local renderer").toBeUndefined();

    const findings = findTaintedMarkupInterpolations(sources, flow);
    const itemTitle = findings.find((site) => site.file === "fixture/render/item.ts" && site.line === 2);
    expect(itemTitle?.expr).toBe("${item.title}");
    expect(itemTitle?.via, "the laundering call site is printed with the finding").toContain("fixture/caller/");

    // The unimported `renderItem` in another file is not reported through the edge.
    expect(
      findings.filter((site) => site.file === "fixture/other/local.ts"),
      "a same-named local renderer is not a callee"
    ).toEqual([]);
    // The escaped call keeps its string parameter provable.
    const safe = analyse(parameterFindings(sources), sources).find((site) => site.fn === "renderSafeItem");
    expect(safe?.safe, JSON.stringify(safe?.callSites)).toBe(true);
    expect(safe?.callSites.map((site) => site.verdict)).toEqual(["escaped"]);
  });

  /**
   * The same laundry, spelled differently. A rename on import, a namespace
   * import, an arrow-bound export and a shorthand object argument all put the
   * value in front of a domain-typed parameter while changing the name the call
   * site writes — which is why the edge is resolved through the module graph
   * rather than by matching an identifier's spelling.
   */
  it("follows a request value through an aliased import, a namespace and an arrow-bound renderer", () => {
    const renderer = (name: string, form: "function" | "arrow") =>
      form === "function"
        ? [
            `export function ${name}(item: { title: string }) {`,
            "  return `<h2>${item.title}</h2>`;",
            "}",
          ].join("\n")
        : [
            `export const ${name} = (item: { title: string }) => {`,
            "  return `<h2>${item.title}</h2>`;",
            "};",
          ].join("\n");

    const cases: { label: string; file: string; body: string[]; key: string; fn: string }[] = [
      {
        label: "an import renamed with `as`",
        file: "fixture/caller/alias.ts",
        body: [
          'import { renderItem as paint } from "../render/item.js";',
          'import { loadItem } from "../data/items.js";',
          "export function aliasPage(id: string) {",
          "  return paint(loadItem(id));",
          "}",
        ],
        key: "fixture/render/item.ts::renderItem",
        fn: "renderItem",
      },
      {
        label: "a namespace import",
        file: "fixture/caller/namespace.ts",
        body: [
          'import * as renderers from "../render/item.js";',
          'import { loadItem } from "../data/items.js";',
          "export function namespacePage(id: string) {",
          "  return renderers.renderItem(loadItem(id));",
          "}",
        ],
        key: "fixture/render/item.ts::renderItem",
        fn: "renderItem",
      },
      {
        label: "an arrow-bound export",
        file: "fixture/caller/arrow.ts",
        body: [
          'import { renderArrow } from "../render/arrow.js";',
          'import { loadItem } from "../data/items.js";',
          "export function arrowPage(id: string) {",
          "  return renderArrow(loadItem(id));",
          "}",
        ],
        key: "fixture/render/arrow.ts::renderArrow",
        fn: "renderArrow",
      },
      {
        label: "a shorthand object built from a request value",
        file: "fixture/caller/shorthand.ts",
        body: [
          'import { renderItem } from "../render/item.js";',
          "export function shorthandPage(req: { query: Record<string, string> }) {",
          "  const title = req.query.title;",
          "  return renderItem({ title });",
          "}",
        ],
        key: "fixture/render/item.ts::renderItem",
        fn: "renderItem",
      },
      {
        label: "a plain string parameter forwarded into a domain-typed one",
        file: "fixture/caller/forwarded.ts",
        body: [
          'import { renderItem } from "../render/item.js";',
          "export function forwardedPage(heading: string) {",
          "  return renderItem({ title: heading });",
          "}",
        ],
        key: "fixture/render/item.ts::renderItem",
        fn: "renderItem",
      },
    ];

    for (const testCase of cases) {
      const sources: SourceFile[] = [
        { path: "fixture/render/item.ts", text: renderer("renderItem", "function") },
        { path: "fixture/render/arrow.ts", text: renderer("renderArrow", "arrow") },
        {
          path: "fixture/data/items.ts",
          text: ["export function loadItem(id: string) {", "  return { title: id };", "}"].join("\n"),
        },
        { path: testCase.file, text: testCase.body.join("\n") },
      ];
      const flow = taintedParameters(sources);
      expect([...(flow.params.get(testCase.key) ?? [])], `${testCase.label} must move taint`).toEqual([
        "item",
      ]);
      expect(flow.via.get(`${testCase.key}::item`), `${testCase.label} must name the call site`).toContain(
        testCase.file
      );
    }

    // An arrow renderer that is never called is still a definition, not an edge.
    const unused = taintedParameters([
      { path: "fixture/render/arrow.ts", text: renderer("renderArrow", "arrow") },
    ]);
    expect(unused.params.size, "a declaration alone taints nothing").toBe(0);
  });

  /**
   * The census the closure is measured with, printed rather than remembered: a
   * rule that ends up finding nothing because it never fires is indistinguishable
   * from a clean repository, so the number of rows it *does* follow is reported
   * here and the probes above prove it can fail.
   */
  it("reports the callback rows it follows, so a zero-finding scan is not vacuous", () => {
    const rowsByFile = sources
      .map((file) => ({ file: file.path, rows: fileTaint(file).rows }))
      .filter((entry) => entry.rows.length > 0);
    const rows = rowsByFile.reduce((sum, entry) => sum + entry.rows.length, 0);
    const references = rowsByFile.reduce(
      (sum, entry) => sum + entry.rows.filter((row) => row.reference !== undefined).length,
      0
    );
    const flow = taintedParameters(sources);
    const functions = flow.params.size;
    const edges = [...flow.params.values()].reduce((sum, set) => sum + set.size, 0);
    const crossFile = [...flow.via.entries()].filter(
      ([key, via]) => !via.startsWith(`${key.split("::")[0]}:`)
    ).length;
    console.log(
      `[escape-taint] tainted callback rows in src/web: ${rows} across ${rowsByFile.length} files ` +
        `(${references} passed as function references) · tainted parameters: ${edges} across ${functions} functions ` +
        `(${crossFile} by a call or row in another file)`
    );
    for (const entry of rowsByFile) {
      console.log(
        `  ${entry.file}: ` +
          entry.rows
            .map((row) => `${row.line}${row.reference ? ` .map(${row.reference})` : ` (${row.name})`}`)
            .join(", ")
      );
    }

    // The rows exist, so the rule was exercised on this repository and not only
    // on the probes; and a reference form is among them, which is the spelling
    // that has no callback body at all.
    expect(rows, "no tainted .map()/.forEach() row was followed anywhere in src/web").toBeGreaterThan(0);
    expect(references, "the reference form (.map(renderRow)) was never followed").toBeGreaterThan(0);
  });

  it("has no plain-string parameter site left to prove, and documents that fact", () => {
    const analysed = parameterSites();
    // The burn-down escaped every remaining interpolation, so the parameter
    // evidence list is empty: there is no site whose safety rests on its callers.
    // That is the conclusion, not a hole — the probes above still show the seed
    // and the proof working, and `finds no undocumented tainted interpolation`
    // fails the build if a raw parameter interpolation reappears.
    expect(
      analysed,
      `no plain-string parameter should reach markup unescaped; found:\n${analysed
        .map((site) => `${site.file}:${site.line} ${site.expr} in ${site.fn}()`)
        .join("\n")}`
    ).toEqual([]);

    // Call-site evidence is generated from the same computation that judges it, so
    // the checked-in document cannot be a stale hand-edited copy.
    const generated = renderEvidenceDocument(analysed);
    if (process.env.UPDATE_TAINT_DOC === "1") {
      writeEvidenceDocument(generated);
      return;
    }
    expect(
      generated,
      "docs/security/plain-string-parameters.md is stale — regenerate it with UPDATE_TAINT_DOC=1"
    ).toBe(readEvidenceDocument());
  });

  it("sees the shapes the count-based census cannot, so a clean scan is not a vacuous one", () => {
    const probe = (body: string): SourceFile[] => [
      {
        path: "probe.ts",
        text: [
          "export function renderPanel(req: { query: Record<string, string> }) {",
          "  const name = req.query.name;",
          "  const alias = name;",
          "  const count = req.query.items.length;",
          body,
          "}",
        ].join("\n"),
      },
    ];

    // Direct: a bare identifier — the shape the census already counts.
    expect(findTaintedMarkupInterpolations(probe('  return `<p>${name}</p>`;')).map((s) => s.expr)).toEqual([
      "${name}",
    ]);
    // Indirect through a local: the census cannot follow this.
    expect(findTaintedMarkupInterpolations(probe('  return `<p>${alias}</p>`;')).map((s) => s.expr)).toEqual([
      "${alias}",
    ]);
    // Call-shaped: the census's published blind spot.
    expect(
      findTaintedMarkupInterpolations(probe('  return `<p>${renderLabel(name)}</p>`;')).map((s) => s.expr)
    ).toEqual(["${renderLabel(name)}"]);
    // Escaped on the rendered line is a boundary.
    expect(findTaintedMarkupInterpolations(probe('  return `<p>${escapeHtml(name)}</p>`;'))).toEqual([]);
    // A number is a number whatever the request sent — but only `.length` is
    // provable from the expression; a numeric local is a documented exception,
    // not a guess (see `openShortfallSeconds` below).
    expect(
      findTaintedMarkupInterpolations(probe('  return `<p>${req.query.items.length}</p>`;'))
    ).toEqual([]);
    // A comparison that emits only a literal.
    expect(
      findTaintedMarkupInterpolations(probe('  return `<option ${name === "x" ? "selected" : ""}>`;'))
    ).toEqual([]);
  });

  /**
   * The write boundary: `html` escapes every interpolation it composes, so a
   * tainted value inside one is not a finding, and the `SafeHtml` it returns may
   * be interpolated into a plain template without being escaped again. The same
   * value outside the tag is still a finding — the exemption belongs to the tag.
   */
  it("treats an html template as the write boundary, and only inside the tag", () => {
    const probe = (body: string[]): SourceFile[] => [
      {
        path: "probe.ts",
        text: [
          "export function renderPanel(req: { query: Record<string, string> }) {",
          "  const name = req.query.name;",
          ...body,
          "}",
        ].join("\n"),
      },
    ];
    const found = (body: string[]) => findTaintedMarkupInterpolations(probe(body));

    expect(found(['  return html`<p>${name}</p>`;'])).toEqual([]);
    expect(
      found(["  const safe = html`<p>${name}</p>`;", "  return `<div>${safe}</div>`;"]) ,
      "a SafeHtml local is markup, not text"
    ).toEqual([]);
    // Composed rows: the array of fragments is interpolated as-is.
    expect(
      found([
        "  const rows = [name].map((n) => html`<td>${n}</td>`);",
        '  return `<table>${rows}</table>`;',
      ])
    ).toEqual([]);
    // Outside the tag, the same value is still reported.
    expect(found(['  return `<p>${name}</p>`;']).map((site) => site.expr)).toEqual(["${name}"]);
    // A property named html is not the tag, so its interpolation is still judged.
    expect(found(['  return templates.html`<p>${name}</p>`;']).map((site) => site.expr)).toEqual([
      "${name}",
    ]);
  });

  /**
   * The row of a `.map()`/`.forEach()` is tainted when its collection is, and
   * only inside that call. This is the shape DEBT-009 recorded as residual: a
   * callback parameter is not a function parameter, so `rows.map((r) =>
   * `<td>${r.title}</td>`)` used to print a stored value with nothing watching.
   */
  it("follows taint into a .map()/.forEach() row, and only within its call", () => {
    const probe = (body: string): SourceFile[] => [
      {
        path: "probe.ts",
        text: [
          "function loadRows() {",
          '  return [{ title: "A" }];',
          "}",
          "export function renderPanel() {",
          "  const rows = loadRows();",
          body,
          "}",
        ].join("\n"),
      },
    ];

    // The row is printed raw inside the callback: a finding, and it names the
    // collection the row came from.
    const found = findTaintedMarkupInterpolations(
      probe('  return `<table>${rows.map((r) => `<tr><td>${r.title}</td></tr>`).join("")}</table>`;')
    );
    expect(found.map((site) => site.expr)).toEqual(["${r.title}"]);
    expect(found[0]?.row, "the row's provenance is printed with the finding").toContain("rows");

    // Escaped in the callback is the ordinary boundary.
    expect(
      findTaintedMarkupInterpolations(
        probe('  return `${rows.map((r) => `<td>${escapeHtml(r.title)}</td>`).join("")}`;')
      )
    ).toEqual([]);

    // `.forEach` binds the same row.
    expect(
      findTaintedMarkupInterpolations(
        probe(
          [
            "  const cells: string[] = [];",
            '  rows.forEach((r) => { cells.push(`<td>${r.title}</td>`); });',
            '  return `<tr>${cells.join("")}</tr>`;',
          ].join("\n")
        )
      ).map((site) => site.expr)
    ).toEqual(["${r.title}"]);

    // A literal collection has no tainted row to leak.
    expect(
      findTaintedMarkupInterpolations(
        probe('  return `${["A", "B"].map((r) => `<td>${r}</td>`).join("")}`;')
      )
    ).toEqual([]);

    // The row is a region, not a name: another function's `r` is a different row.
    expect(
      findTaintedMarkupInterpolations(
        probe(
          [
            '  const cells = rows.map((r) => `<td>${escapeHtml(r.title)}</td>`);',
            '  const heading = (r: { title: string }) => `<b>${r.title}</b>`;',
            '  return `<tr>${cells.join("")}</tr>${heading({ title: "literal" })}`;',
          ].join("\n")
        )
      )
    ).toEqual([]);
  });

  /**
   * The row handed to a renderer is the value the export/import edge was missing:
   * `items.map((row) => renderCell(row))` used to be two separate facts — a read
   * that stayed in its file and a renderer nobody could tie to it. The reference
   * form `.map(renderCell)` is the same call with the arrow left out.
   */
  it("follows a tainted row into the renderer it is handed to, arrow or reference", () => {
    const renderer: SourceFile = {
      path: "fixture/render/cell.ts",
      text: [
        "export function renderCell(cell: { title: string }) {",
        "  return `<td>${cell.title}</td>`;",
        "}",
      ].join("\n"),
    };
    const page = (body: string): SourceFile => ({
      path: "fixture/caller/page.ts",
      text: [
        'import { renderCell } from "../render/cell.js";',
        "function loadRows() {",
        '  return [{ title: "A" }];',
        "}",
        "export function page() {",
        "  const rows = loadRows();",
        body,
        "}",
      ].join("\n"),
    });

    const cases: { label: string; body: string }[] = [
      { label: "an arrow callback", body: '  return `<tr>${rows.map((row) => renderCell(row)).join("")}</tr>`;' },
      { label: "a bare function reference", body: '  return `<tr>${rows.map(renderCell).join("")}</tr>`;' },
    ];

    for (const testCase of cases) {
      const sources = [renderer, page(testCase.body)];
      const flow = taintedParameters(sources);
      expect(
        [...(flow.params.get("fixture/render/cell.ts::renderCell") ?? [])],
        `${testCase.label} must move taint into the renderer`
      ).toEqual(["cell"]);
      expect(flow.via.get("fixture/render/cell.ts::renderCell::cell"), `${testCase.label} names its call site`).toContain(
        "fixture/caller/page.ts"
      );

      const findings = findTaintedMarkupInterpolations(sources, flow);
      const cell = findings.find((site) => site.file === "fixture/render/cell.ts");
      expect(cell?.expr, `${testCase.label} prints the row it was handed`).toBe("${cell.title}");
      expect(cell?.via, `${testCase.label} prints the laundering call site`).toContain("fixture/caller/page.ts");
    }

    // A row from a literal collection is not tainted — no edge runs.
    const literal = [
      renderer,
      {
        path: "fixture/caller/page.ts",
        text: [
          'import { renderCell } from "../render/cell.js";',
          "export function page() {",
          '  return `<tr>${[{ title: "A" }].map((row) => renderCell(row)).join("")}</tr>`;',
          "}",
        ].join("\n"),
      },
    ];
    expect(taintedParameters(literal).params.get("fixture/render/cell.ts::renderCell")).toBeUndefined();
  });
});
