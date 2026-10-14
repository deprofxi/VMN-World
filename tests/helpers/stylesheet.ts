/**
 * Resolves a rendered HTML fragment against the shipped stylesheet so
 * accessibility assertions can target the mechanism that actually delivers a
 * rule (generated utility classes) instead of a retired delivery mechanism
 * (inline style attributes). DT-202 / AUD-20 / TSK-04; DT id authority: docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference).
 *
 * Assertions must go through here rather than matching a literal string in the
 * markup: the rule is only honoured if it exists in the CSS the browser gets.
 */

import { CANONICAL_STYLESHEET } from "../../src/web/styles/index.js";

export interface ParsedRule {
  /**
   * One entry per comma-separated selector group; each entry lists the classes
   * that must ALL be present (`.a.b` is one group of two, `.a, .b` is two
   * groups of one).
   */
  groups: string[][];
  declarations: Record<string, string>;
}

/**
 * Parse top-level and nested (e.g. @media) class rules in source order.
 * Later rules win, matching the CSS cascade for equal specificity.
 */
export function parseStylesheet(css: string = CANONICAL_STYLESHEET): ParsedRule[] {
  const rules: ParsedRule[] = [];
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRe.exec(withoutComments)) !== null) {
    const selectorText = match[1].trim();
    const body = match[2];
    if (selectorText.startsWith("@") || /^\d/.test(selectorText)) continue;
    const declarations: Record<string, string> = {};
    for (const decl of body.split(";")) {
      const idx = decl.indexOf(":");
      if (idx === -1) continue;
      const prop = decl.slice(0, idx).trim();
      const value = decl.slice(idx + 1).trim();
      if (prop && value) declarations[prop] = value;
    }
    const groups: string[][] = [];
    for (const group of selectorText.split(",")) {
      const classes = new Set<string>();
      const classRe = /\.([A-Za-z_][\w-]*)/g;
      let cm: RegExpExecArray | null;
      while ((cm = classRe.exec(group)) !== null) classes.add(`.${cm[1]}`);
      if (classes.size > 0) groups.push([...classes]);
    }
    if (groups.length > 0 && Object.keys(declarations).length > 0) {
      rules.push({ groups, declarations });
    }
  }
  return rules;
}

function applies(rule: ParsedRule, classes: string[]): boolean {
  return rule.groups.some((group) => group.every((c) => classes.includes(c)));
}

function firstTag(html: string): string {
  const open = html.match(/<\w[^>]*>/);
  return open ? open[0] : "";
}

function attribute(tag: string, name: string): string | null {
  const attr = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return attr ? attr[1] : null;
}

function elementClasses(html: string): string[] {
  const cls = attribute(firstTag(html), "class");
  return cls ? cls.split(/\s+/).filter(Boolean).map((c) => `.${c}`) : [];
}

/**
 * The winning value for `prop` across the element's class list (stylesheet
 * cascade order) and any inline style, which outranks both.
 */
export function effectiveDeclaration(
  html: string,
  prop: string,
  rules: ParsedRule[] = parseStylesheet(),
): string | null {
  const classes = elementClasses(html);
  if (classes.length === 0) return null;
  let resolved: string | null = null;
  for (const rule of rules) {
    if (!applies(rule, classes)) continue;
    const value = rule.declarations[prop];
    if (value !== undefined) resolved = value;
  }
  const inline = attribute(firstTag(html), "style");
  if (inline) {
    for (const decl of inline.split(";")) {
      const idx = decl.indexOf(":");
      if (idx === -1) continue;
      if (decl.slice(0, idx).trim() === prop) return decl.slice(idx + 1).trim();
    }
  }
  return resolved;
}

/** Pixel magnitude of a declaration, or null when it is not a length. */
export function declarationPx(value: string | null): number | null {
  if (!value) return null;
  const px = value.match(/(-?[\d.]+)px/);
  if (px) return Number.parseFloat(px[1]);
  const rem = value.match(/(-?[\d.]+)rem/);
  if (rem) return Number.parseFloat(rem[1]) * 16;
  return null;
}

/**
 * Smallest effective touch target dimension the stylesheet actually delivers
 * for this fragment. Returns null when neither axis is expressed as a length.
 */
export function effectiveTouchTargetPx(
  html: string,
  rules: ParsedRule[] = parseStylesheet(),
): { minWidth: number | null; minHeight: number | null } {
  return {
    minWidth: declarationPx(effectiveDeclaration(html, "min-width", rules)),
    minHeight: declarationPx(effectiveDeclaration(html, "min-height", rules)),
  };
}
