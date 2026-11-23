/**
 * Shared readers for the legacy-route retirement guard.
 *
 * The router owns the retirement table (decision D1). These helpers read it
 * rather than restating it: a hand-copied list of retired paths is exactly the
 * kind of second truth that lets a guard keep passing after the router changes.
 * The table is parsed out of the router source because it lives inside the
 * request handler, where it is consulted on every request.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const ROUTER_SOURCE = fileURLToPath(new URL("../../src/api/router.ts", import.meta.url));

export interface LegacyRedirect {
  /** The retired path, exactly as the router matches it (no query string). */
  readonly from: string;
  /** The IA successor the router sends the visitor to. */
  readonly to: string;
}

/**
 * Parse `LEGACY_REDIRECTS` out of the router. Throws rather than returning an
 * empty set when the declaration moves or changes shape: a guard that silently
 * grades nothing is worse than no guard.
 */
export function parseLegacyRedirects(source: string = readFileSync(ROUTER_SOURCE, "utf8")): LegacyRedirect[] {
  const block = /const LEGACY_REDIRECTS: ReadonlyMap<string, string> = new Map\(\[([\s\S]*?)\]\);/.exec(source);
  if (!block) {
    throw new Error(
      "LEGACY_REDIRECTS is no longer declared as a `new Map([[from, to], ...])` in src/api/router.ts — update tests/helpers/retired-routes.ts"
    );
  }

  const body = block[1].replace(/\/\/[^\n]*/g, "");
  const pairs = [...body.matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)].map((match) => ({
    from: match[1],
    to: match[2],
  }));

  const leftover = body.replace(/\[\s*"[^"]+"\s*,\s*"[^"]+"\s*\]/g, "").replace(/[\s,]/g, "");
  if (leftover !== "") {
    throw new Error(`LEGACY_REDIRECTS carries an entry this parser cannot read: ${leftover}`);
  }
  if (pairs.length === 0) {
    throw new Error("LEGACY_REDIRECTS parsed empty — the retirement guard would pass without checking anything");
  }
  return pairs;
}

/** The retired paths as a set, for exact-match lookups. */
export function retiredPathSet(redirects: readonly LegacyRedirect[] = parseLegacyRedirects()): ReadonlySet<string> {
  return new Set(redirects.map((redirect) => redirect.from));
}

/** `/a/b?q=1#x` → `/a/b`. Anything that does not start with `/` is not a site path. */
export function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

export interface SourceLink {
  readonly file: string;
  readonly line: number;
  /** The literal as written, e.g. `"/channels?page=2"`. */
  readonly literal: string;
}

/**
 * Every site-relative path literal in a TypeScript module: string literals and
 * template heads, from the compiler's own AST, so comments and quoted prose in
 * them are not mistaken for links.
 */
export function pathLiterals(file: string, source: string): SourceLink[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const found: SourceLink[] = [];
  const record = (text: string, node: ts.Node) => {
    if (!text.startsWith("/") || text.startsWith("//")) return;
    found.push({
      file,
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
      literal: text,
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      record(node.text, node);
    } else if (ts.isTemplateExpression(node)) {
      // `/prototypes?screen=${id}` is a path prefix plus a runtime value; only the
      // head is known statically, and it is what the guard can judge.
      record(node.head.text, node.head);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

/** Internal `href`/`action` targets in rendered HTML, with entities left as-is. */
export function internalLinkTargets(html: string): string[] {
  return [...html.matchAll(/(?:href|action)="([^"]*)"/gi)]
    .map((match) => match[1].trim())
    .filter((target) => target.startsWith("/") && !target.startsWith("//"));
}
