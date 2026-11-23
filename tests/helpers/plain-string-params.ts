/**
 * Plain-string parameters, as evidence rather than as an assumption.
 *
 * The escape-taint instrument in `tests/unit/html-escape-taint.test.ts` used to
 * seed only *request-named* parameters (`req`, `query`, `params`, …). A renderer
 * that took `showcaseTitle: string` was therefore invisible to it, and the
 * register had to state that limitation in prose. This module closes that gap the
 * way the repository closes others: it treats every `string` parameter as
 * external, then proves the remaining sites safe **from their call sites** — and
 * writes that proof down, so the documentation cannot drift from the code.
 *
 * A site is safe only when every in-repository call passes, at that parameter's
 * position, a string literal, an escaped value, a module-level constant (or a
 * property of one, including one returned from a registry lookup), or when the
 * function has no call sites at all (unmounted).
 *
 * Two of those verdicts exist to keep the report free of hand-written
 * exceptions. `forwarded` is the false positive this instrument used to produce:
 * the caller passes its own string parameter along, so the immediate argument
 * says nothing, and the chain is followed to whatever actually reaches it
 * (`FORWARD_DEPTH` hops, cycle-guarded). `unmounted` is a renderer nothing in
 * this repository calls — a public entry point, not an unchecked one. Both are
 * recorded in the generated document with the evidence that produced them.
 *
 * `request-derived` and an unresolved `unknown` still fail the build: those are
 * callers that hand the parameter request data, or that this analysis cannot
 * account for, and neither may be silenced by editing a list.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { expressionEscapes, templateLiteralRanges } from "./escaped-markup.js";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));
export const DOC_PATH = path.join(ROOT, "docs", "security", "plain-string-parameters.md");

export interface ParameterFinding {
  readonly file: string;
  readonly line: number;
  readonly expr: string;
  readonly fn: string;
  readonly param: string;
}

export type Verdict =
  | "literal"
  | "escaped"
  | "module-constant"
  /** The caller passed its own string parameter along; the chain is resolved below. */
  | "forwarded"
  /** A forward chain that ends at a function nothing in this repository calls. */
  | "unmounted"
  | "request-derived"
  | "unknown";

export interface CallSite {
  readonly file: string;
  readonly line: number;
  readonly argument: string;
  readonly verdict: Verdict | "unmounted";
  /** For `forwarded`: where the chain ends, so the document records it. */
  readonly via?: readonly string[];
}

export interface SourceText {
  readonly path: string;
  readonly text: string;
}

const REQUEST_SHAPED =
  /searchParams|\breq\.|\brequest\.|\bctx\.|urlObj|pathname|decodeURIComponent|JSON\.parse|readFormBody|\.headers\[|\bparams\[|process\.env/;
const ESCAPE_CALL = /^(?:escapeHtml|esc|encodeURIComponent|sanitize[A-Za-z]*)\s*\(/;

/** Every TypeScript module the call graph may pass a value through. */
export function allSourceFiles(): SourceText[] {
  const out: SourceText[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const abs = path.join(dir, entry);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (abs.endsWith(".ts")) {
        out.push({ path: path.relative(ROOT, abs).split(path.sep).join("/"), text: readFileSync(abs, "utf8") });
      }
    }
  };
  walk(path.join(ROOT, "src"));
  return out;
}

/**
 * Index of the delimiter closing the one at `open`, skipping strings and
 * comments. A `}` inside a CSS template literal would otherwise end a function
 * body early, which silently moves a site out of its own scope.
 */
export function matchingDelimiter(text: string, open: number): number {
  const opener = text[open];
  const closer = opener === "(" ? ")" : opener === "{" ? "}" : opener === "[" ? "]" : "";
  if (closer === "") return -1;
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < text.length; i += 1) {
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
    if (char === opener) depth += 1;
    else if (char === closer) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Splits an argument list at its top-level commas.
 *
 * A template literal is consumed whole: its markup can contain an unbalanced `<`
 * or `>` (`<br>` beside a stray comparison), and counting brackets through it
 * mis-split the list — which silently handed a caller's argument to the wrong
 * parameter and filed a proved site as `unknown`.
 */
export function splitArguments(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < list.length; i += 1) {
    const char = list[i];
    if (char === "`") {
      const [range] = templateLiteralRanges(list.slice(i));
      const end = range === undefined ? list.length - 1 : i + range.end;
      current += list.slice(i, end + 1);
      i = end;
      continue;
    }
    if ("([{<".includes(char)) depth += 1;
    if (")]}>".includes(char)) depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  if (current.trim().length > 0) parts.push(current);
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
}

interface FunctionSpan {
  readonly name: string;
  readonly params: readonly string[];
  readonly start: number;
  readonly end: number;
}

/**
 * Function spans per file, computed once. Only call sites that already look
 * unprovable pay for this, but the scan is memoised so a wide burn-down stays
 * linear in file size rather than quadratic in call sites.
 */
const SPANS = new WeakMap<SourceText, readonly FunctionSpan[]>();

function functionSpans(source: SourceText): readonly FunctionSpan[] {
  const cached = SPANS.get(source);
  if (cached) return cached;
  const spans: FunctionSpan[] = [];
  for (const match of source.text.matchAll(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    const open = source.text.indexOf("(", match.index ?? 0);
    const close = matchingDelimiter(source.text, open);
    if (open === -1 || close === -1) continue;
    const bodyOpen = source.text.indexOf("{", close);
    if (bodyOpen === -1) continue;
    const bodyClose = matchingDelimiter(source.text, bodyOpen);
    if (bodyClose === -1) continue;
    const params = splitArguments(source.text.slice(open + 1, close)).map((part) =>
      part.replace(/[:=?].*$/, "").trim()
    );
    spans.push({
      name: match[1],
      params: params.filter((name) => /^[A-Za-z_$][\w$]*$/.test(name)),
      start: source.text.slice(0, match.index).split("\n").length,
      end: source.text.slice(0, bodyClose).split("\n").length,
    });
  }
  SPANS.set(source, spans);
  return spans;
}

/** The innermost function whose body contains `line`, for following a forward. */
export function enclosingFunction(source: SourceText, line: number): FunctionSpan | undefined {
  return functionSpans(source)
    .filter((span) => span.start <= line && line <= span.end)
    .sort((a, b) => b.start - a.start || a.end - b.end)[0];
}

/** True when `source` declares `fn` (as a function, not an import). */
function declaresFunction(source: SourceText, fn: string): boolean {
  return new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${fn}\\s*\\(`).test(source.text);
}

/** Module specifiers through which `source` imports `fn` by name. */
function importSpecifiersFor(source: SourceText, fn: string): string[] {
  const specifiers: string[] = [];
  for (const match of source.text.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const names = match[1]
      .split(",")
      .map((part) => part.replace(/\btype\b/, "").trim().split(/\s+as\s+/).pop()?.trim() ?? "");
    if (names.includes(fn)) specifiers.push(match[2]);
  }
  return specifiers;
}

/** True when `source` imports `fn` by name, from anywhere. */
function importsFunction(source: SourceText, fn: string): boolean {
  return importSpecifiersFor(source, fn).length > 0;
}

/**
 * A module path without its extension. Both spellings occur in this repository:
 * the imported specifier is `../components/index.js` (ESM style, as TypeScript
 * requires for a Node ESM build) while the file on disk is `.ts`. Stripping only
 * `.ts` left the specifier unresolved, which silently dropped cross-file call
 * sites — and a dropped call site reads as `unmounted`, i.e. as *proved safe*.
 */
const modulePath = (file: string): string => file.replace(/\.(?:ts|js|mjs|cjs)$/, "");

/** A relative specifier resolved to a module path, or undefined for a package. */
function resolveSpecifier(fromPath: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  return modulePath(path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), specifier)));
}

/**
 * True when the module at `homeModule` reachable as `target` exports `fn`,
 * following barrel re-exports. Without this a caller importing `renderThing`
 * from a directory `index.ts` would look like it never called the function it
 * calls.
 *
 * The chain must end at `homeModule` — the file that declares *this* definition —
 * not merely at some module that exports a function of the same name. Without
 * that constraint three workspaces' `renderEmptyRecords` (and any other
 * same-named pair) would prove each other's callers, and a taint edge would run
 * to a function that was never called.
 */
function exportsDefinition(
  fn: string,
  target: string,
  homeModule: string,
  sources: readonly SourceText[],
  seen: ReadonlySet<string> = new Set()
): boolean {
  if (seen.has(target)) return false;
  if (target === homeModule) return true;
  const source = sources.find((candidate) => modulePath(candidate.path) === target);
  if (!source) return false;
  const next = new Set(seen).add(target);
  for (const match of source.text.matchAll(/export\s+(?:\*\s*|\{([^}]*)\}\s*)from\s*["']([^"']+)["']/g)) {
    const names = match[1]
      ? match[1]
          .split(",")
          .map((part) => part.replace(/\btype\b/, "").trim().split(/\s+as\s+/).pop()?.trim() ?? "")
      : undefined;
    if (names && !names.includes(fn)) continue;
    const resolved = resolveSpecifier(source.path, match[2]);
    if (resolved && exportsDefinition(fn, resolved, homeModule, sources, next)) return true;
  }
  return false;
}

/**
 * True when a call of `fn` in `source` can reach the definition in `home`.
 * Name alone is not enough — three workspaces each declare a local
 * `renderEmptyRecords` — so a foreign file must import the name from a module
 * that actually exports *this* definition. An unresolvable specifier (a path
 * alias) is accepted rather than dropped: the document prints every call site,
 * so an over-inclusion is visible while a silent omission would not be.
 */
export function reachesDefinition(
  source: SourceText,
  fn: string,
  home: string,
  sources: readonly SourceText[]
): boolean {
  if (source.path === home) return true;
  return importSpecifiersFor(source, fn).some((specifier) =>
    reachesDefinitionThrough(specifier, fn, source.path, home, sources)
  );
}

/**
 * The same question asked of a *named module* rather than a named import:
 * `import * as renderers from "./render.js"` then `renderers.renderItem(...)`
 * binds the callee through a namespace, so there is no import specifier carrying
 * the function's name to look up. The module is the edge, and it must reach the
 * definition's home module rather than merely export a same-named function.
 */
export function reachesDefinitionThrough(
  specifier: string,
  fn: string,
  fromPath: string,
  home: string,
  sources: readonly SourceText[]
): boolean {
  const resolved = resolveSpecifier(fromPath, specifier);
  if (resolved === undefined) return true;
  return exportsDefinition(fn, resolved, modulePath(home), sources);
}

/** Position of `param` in the declaration of `fn` in one file, or -1. */
export function parameterIndexIn(fn: string, param: string, source: SourceText): number {
  const at = source.text.search(new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${fn}\\s*\\(`));
  if (at === -1) return -1;
  const open = source.text.indexOf("(", at);
  const close = matchingDelimiter(source.text, open);
  if (close === -1) return -1;
  const declaration = splitArguments(
    source.text
      .slice(open + 1, close)
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
  );
  return declaration.findIndex((part) => new RegExp(`^${param}\\s*\\??\\s*:`).test(part) || part.replace(/[:=].*/, "").trim() === param);
}

/** Position of `param` in the first declaration of `fn` found, or -1. */
export function parameterIndex(fn: string, param: string, sources: readonly SourceText[]): number {
  for (const source of sources) {
    const index = parameterIndexIn(fn, param, source);
    if (index >= 0) return index;
  }
  return -1;
}

/** Names bound at module scope in a file (const/let/var/function), for constant checks. */
function moduleBindings(source: SourceText): Set<string> {
  const names = new Set<string>();
  for (const match of source.text.matchAll(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1]);
  }
  return names;
}

/** True when `fn` is a registry/service accessor that returns a module-constant lookup. */
function serviceReturnsModuleConstant(fnName: string, sources: readonly SourceText[]): boolean {
  for (const source of sources) {
    const at = source.text.search(new RegExp(`(?:export\\s+)?function\\s+${fnName}\\s*\\(`));
    if (at === -1) continue;
    const body = source.text.slice(at, at + 900);
    const lookup = /return\s+([A-Z][A-Z0-9_]*)\s*[[.]/.exec(body);
    return lookup !== null && moduleBindings(source).has(lookup[1]);
  }
  return false;
}

/**
 * A template literal whose every interpolation is escaped, numeric or a literal:
 * the caller composed the string, so the only way text enters it is through a
 * boundary this repository already trusts.
 */
function escapedTemplate(trimmed: string): boolean {
  if (!trimmed.startsWith("`") || !trimmed.endsWith("`")) return false;
  const interpolations = [...trimmed.matchAll(/\$\{([^{}]*)\}/g)].map((match) => match[1].trim());
  if (interpolations.length === 0) return false;
  return interpolations.every(
    (expression) => ESCAPE_CALL.test(expression) || /^-?\d+(?:\.\d+)?$/.test(expression)
  );
}

const SAFE: ReadonlySet<Verdict | "unmounted"> = new Set<Verdict | "unmounted">([
  "literal",
  "escaped",
  "module-constant",
  "forwarded",
  "unmounted",
]);

/** How far a forward chain may run before it is reported rather than followed. */
const FORWARD_DEPTH = 4;

/**
 * Resolve an argument that is the caller's own string parameter by asking what
 * *that* function's callers pass, up to `FORWARD_DEPTH`. Returns the verdict
 * that should stand, plus the chain for the evidence document.
 *
 * This is the false-positive filter: `renderPage(title)` called from
 * `renderSection(heading: string)` which is itself only called with literals is
 * not a hole, and needs no hand-written exception list to say so.
 */
function resolveForward(
  root: string,
  caller: SourceText,
  atLine: number,
  sources: readonly SourceText[],
  depth: number,
  visiting: ReadonlySet<string>
): { verdict: Verdict; via: string[] } | undefined {
  if (depth >= FORWARD_DEPTH) return undefined;
  const enclosing = enclosingFunction(caller, atLine);
  if (!enclosing || !enclosing.params.includes(root)) return undefined;
  const key = `${caller.path}::${enclosing.name}::${root}`;
  if (visiting.has(key)) return undefined;

  // The enclosing function is declared in `caller`, so that file is its home.
  const downstream = callSites(
    enclosing.name,
    root,
    sources,
    depth + 1,
    new Set(visiting).add(key),
    caller.path
  );
  if (downstream.length === 0) return { verdict: "unmounted", via: [] };
  if (downstream.some((site) => site.verdict === "request-derived")) {
    return { verdict: "request-derived", via: [] };
  }
  if (downstream.every((site) => SAFE.has(site.verdict))) {
    const via = downstream.flatMap((site) => [`${site.file}:${site.line}`, ...(site.via ?? [])]);
    return { verdict: "forwarded", via: [...new Set(via)] };
  }
  return undefined;
}

/** What a caller actually handed the parameter. */
export function classifyArgument(
  argument: string,
  caller: SourceText,
  sources: readonly SourceText[],
  atLine?: number,
  depth = 0,
  visiting: ReadonlySet<string> = new Set()
): Verdict {
  const trimmed = argument.trim();
  if (trimmed === "") return "unknown";
  if (/^(?:"[^"]*"|'[^']*'|`[^`$]*`)$/.test(trimmed)) return "literal";
  if (/^(?:true|false|null|undefined)$/.test(trimmed)) return "literal";
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return "literal";
  if (ESCAPE_CALL.test(trimmed)) return "escaped";
  if (escapedTemplate(trimmed)) return "escaped";
  // The census's value-level rule, applied to the argument: a template whose
  // interpolations all prove escaped (a renderer's markup plus literal prose), a
  // call to a renderer that escapes its own leaves, or a module constant. This
  // is what makes `section("…", "…", `${pendingTable(…)}<p>…</p>`)` a value the
  // caller has escaped, rather than an argument this analysis cannot account for.
  if (expressionEscapes(trimmed, { sources, text: caller.text })) return "escaped";
  if (REQUEST_SHAPED.test(trimmed)) return "request-derived";

  const root = /^[A-Za-z_$][\w$]*/.exec(trimmed)?.[0];
  if (root) {
    // A module-level constant, or a property of one.
    if (moduleBindings(caller).has(root) && (trimmed !== root || /^[A-Z]/.test(root))) return "module-constant";
    // A local assigned from a registry lookup whose method returns a constant table.
    const assigned = new RegExp(`(?:const|let|var)\\s+${root}\\s*(?::[^=]+)?=\\s*([A-Za-z_$][\\w$]*)\\.`).exec(caller.text);
    if (assigned && serviceReturnsModuleConstant(assigned[1], sources)) return "module-constant";
    // A local assigned from an escaping call.
    const escaped = new RegExp(`(?:const|let|var)\\s+${root}\\s*(?::[^=]+)?=\\s*${ESCAPE_CALL.source}`).test(caller.text);
    if (escaped) return "escaped";
    // …or from a template that escapes every interpolation.
    const composed = new RegExp(`(?:const|let|var)\\s+${root}\\s*(?::[^=]+)?=\\s*(\`[^\n]*\`)`).exec(caller.text);
    if (composed && escapedTemplate(composed[1])) return "escaped";
    // The caller may be handing along its own parameter — follow it rather than
    // guessing, and let `via` record where the chain landed.
    if (atLine !== undefined) {
      const forwarded = resolveForward(root, caller, atLine, sources, depth, visiting);
      if (forwarded) return forwarded.verdict;
    }
  }
  return "unknown";
}

/** Every in-repository call of `fn`, with the argument at `param`'s position. */
export function callSites(
  fn: string,
  param: string,
  sources: readonly SourceText[],
  depth = 0,
  visiting: ReadonlySet<string> = new Set(),
  /** The file defining the `fn` whose calls these are. */
  home?: string
): CallSite[] {
  const sites: CallSite[] = [];
  const homeFile = home ? sources.find((candidate) => candidate.path === home) : undefined;
  const sharedIndex = homeFile ? parameterIndexIn(fn, param, homeFile) : parameterIndex(fn, param, sources);
  for (const source of sources) {
    // A call of `renderEmpty(note, …)` only belongs to *this* `renderEmpty` when
    // the file can reach its definition. Three workspaces each have a local
    // `renderEmptyRecords`, and reading one as the other's caller is how
    // literal-only parameters were filed as `unknown` in the first place.
    if (home) {
      if (!reachesDefinition(source, fn, home, sources)) continue;
    } else if (!declaresFunction(source, fn) && !importsFunction(source, fn)) continue;
    const local = parameterIndexIn(fn, param, source);
    const index = local >= 0 ? local : sharedIndex;
    const pattern = new RegExp(`(^|[^.\\w$])${fn}\\s*\\(`, "g");
    for (const match of source.text.matchAll(pattern)) {
      // The declaration is not a call: `function renderEmpty(note: string)` must
      // not be read as a caller handing `note: string` to itself.
      const nameAt = (match.index ?? 0) + (match[1] ? match[1].length : 0);
      if (/(?:export\s+)?(?:async\s+)?function\s+$/.test(source.text.slice(0, nameAt))) continue;
      const parenAt = source.text.indexOf("(", nameAt);
      if (parenAt === -1) continue;
      const start = parenAt + 1;
      const closeAt = matchingDelimiter(source.text, start - 1);
      const args = splitArguments(source.text.slice(start, closeAt === -1 ? source.text.length : closeAt));
      const argument = index >= 0 ? args[index] ?? "" : args[0] ?? "";
      const line = source.text.slice(0, match.index).split("\n").length;
      const verdict = classifyArgument(argument, source, sources, line, depth, visiting);
      const via =
        verdict === "forwarded"
          ? resolveForward(
              /^[A-Za-z_$][\w$]*/.exec(argument.trim())?.[0] ?? "",
              source,
              line,
              sources,
              depth,
              visiting
            )?.via
          : undefined;
      sites.push({
        file: source.path,
        line,
        argument: argument.replace(/\s+/g, " ").slice(0, 120),
        verdict,
        ...(via && via.length > 0 ? { via } : {}),
      });
    }
  }
  return sites;
}


export interface AnalysedSite extends ParameterFinding {
  readonly callSites: readonly CallSite[];
  readonly safe: boolean;
}

export function analyse(findings: readonly ParameterFinding[], sources = allSourceFiles()): AnalysedSite[] {
  return findings.map((finding) => {
    const sites = callSites(finding.fn, finding.param, sources, 0, new Set(), finding.file);
    const callSitesWithVerdict = sites.length === 0 ? ([{ file: "—", line: 0, argument: "no in-repository caller", verdict: "unmounted" as const }]) : sites;
    return {
      ...finding,
      callSites: callSitesWithVerdict,
      safe: callSitesWithVerdict.every((site) => SAFE.has(site.verdict)),
    };
  });
}

/**
 * The checked-in evidence document. Deterministic: sites sorted by file and line,
 * call sites sorted by file and line, no timestamps — so a stale document is a
 * byte difference, not a judgement call.
 */
export function renderEvidenceDocument(analysed: readonly AnalysedSite[]): string {
  const total = analysed.length;
  const unsafe = analysed.filter((site) => !site.safe);
  const escapeByCallSite = analysed.filter((site) => site.callSites.some((call) => call.verdict === "module-constant")).length;
  const forwarded = analysed.filter((site) => site.callSites.some((call) => call.verdict === "forwarded")).length;
  const unmounted = analysed.filter((site) => site.callSites.some((call) => call.verdict === "unmounted")).length;

  const rows = [...analysed]
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .map((site) => {
      const calls = [...site.callSites]
        .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
        .map(
          (call) =>
            `  - \`${call.file}:${call.line}\` — \`${call.argument || "(no argument)"}\` → **${call.verdict}**${
              call.via && call.via.length > 0 ? ` (reaches \`${call.via.join("` → `")}\`)` : ""
            }`
        )
        .join("\n");
      return [
        `### \`${site.file}:${site.line}\` — \`\${${site.param}}\` in \`${site.fn}\``,
        "",
        `Interpolated as \`${site.expr}\` on a line with markup and no escaping call.`,
        "",
        "Call sites:",
        "",
        calls,
        "",
      ].join("\n");
    })
    .join("\n");

  return [
    "# Plain-string parameters reaching markup unescaped",
    "",
    "**Generated file — do not edit.** Regenerate with:",
    "",
    "```",
    "UPDATE_TAINT_DOC=1 npx vitest run tests/unit/html-escape-taint.test.ts",
    "```",
    "",
    "## What this records",
    "",
    "The escape-taint instrument treats every `string` parameter of a renderer as",
    "external — the same assumption it already makes for `req`/`query`/`params` — and",
    "then asks what each caller actually passes. A site is safe when every",
    "in-repository call hands that parameter a string literal, an escaped value, a",
    "module-level constant (including a property of one, and a value returned from a",
    "registry accessor that returns such a table), a parameter the next function up",
    "also only receives safe values for (`forwarded` — followed up to four hops, with",
    "the chain printed below), or when the renderer has no caller at all.",
    "",
    "The seeding is by **type**, not by name: `title: string` and",
    "`title: string | undefined` are both external, and the name is looked for",
    "anywhere in the interpolation, so `${flag ? title : \"\"}` and",
    "`${\"prefix \" + title}` are listed as well as `${title}`. A fragment builder",
    "that escapes *every* interpolation in its statement is not itself tainted",
    "(`rows = sessions.map(r => `<td>${escapeHtml(r.name)}</td>`)`), so the evidence",
    "stays about parameters rather than about pre-escaped table markup.",
    "",
    "A parameter that is *not* typed `string` is judged by the taint pass instead:",
    "a value handed to it across a file boundary (`renderX(item: SomeRecord)` fed by",
    "a repository read) makes the site a finding rather than a proved exception, and",
    "the finding prints the call site that carried the value. That edge is followed",
    "through every spelling it can take — a renamed import (`{ renderX as paint }`),",
    "a namespace import (`renderers.renderX(…)`), an arrow-bound export, or a",
    "shorthand object argument (`{ title }`) — so nothing in this document excuses a",
    "site because the call wrote a different name than the declaration.",
    "",
    "One limit of this document is the instrument's, not the parameters': markup is",
    "judged **per line**, as in the census, so an interpolation on a tag-less line of",
    "a markup template is not listed here. `docs/design-debt-register.md` (DEBT-009)",
    "names the sites that class hid when it was probed.",
    "",
    "Only `request-derived` and an unresolved `unknown` fail",
    "`tests/unit/html-escape-taint.test.ts`. Every verdict here is generated from the",
    "call graph, so the honest false positives — a caller forwarding a parameter that",
    "is a literal one level up, a renderer reached from outside this repository — are",
    "documented rather than excused in a hand-written list. There is deliberately",
    "nowhere to add such an exception by hand.",
    "",
    `Sites found: **${total}**. Safe by call site: **${total - unsafe.length}**.`,
    `Failing: **${unsafe.length}**. Provided by a module constant: **${escapeByCallSite}**.`,
    `Resolved through forwarding: **${forwarded}**. Public entry points (no in-repository caller): **${unmounted}**.`,
    "",
    "The census in DEBT-009 counts every unescaped interpolation; this document",
    "records the subset the taint pass reaches through a parameter, and why each one",
    "is not a hole *today*. It is evidence about callers, not a claim that the",
    "renderer is safe if a new caller appears: a new call site changes this file, and",
    "a request-derived argument fails the build.",
    "",
    "## Sites",
    "",
    rows,
  ].join("\n");
}

export function writeEvidenceDocument(document: string): void {
  writeFileSync(DOC_PATH, document, "utf8");
}

export function readEvidenceDocument(): string {
  return readFileSync(DOC_PATH, "utf8");
}
