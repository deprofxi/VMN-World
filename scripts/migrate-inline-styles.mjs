#!/usr/bin/env node
/**
 * AUD-20 / TSK-48: inline-style → generated-utility-class migration (codemod).
 *
 * Migrates STATIC inline `style="…"` attributes to deterministic utility classes
 * (`.s-<hash>`), emits the CSS into src/web/styles/generated-utilities.ts, and
 * reports what is left. Dynamic styles (containing `${…}` or a backtick) are
 * skipped and reported — they must be converted by hand to whitelisted variant
 * classes; `style-src 'unsafe-inline'` can only be dropped once no `style="`
 * remains anywhere.
 *
 * CA-30 fix: the previous version worked line-by-line and emitted a second
 * `class="…"` whenever the tag's real class attribute lived on another line,
 * producing invalid markup (`<button class="a" class="s-x">`). This version
 * walks whole tags, merges into the existing class attribute, and refuses to
 * write anything if any duplicate attribute would survive — validation happens
 * across every input file before the first write.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DEFAULT_ROOTS = ["src/web", "src/api"];
const DEFAULT_STYLES_OUT = "src/web/styles/generated-utilities.ts";

/** Whole-tag match: tag name plus attributes, with quoted values (which may contain `>`). */
const TAG_RE = /<[a-zA-Z][a-zA-Z0-9-]*(?:"[^"]*"|'[^']*'|[^>"'`])*>/g;
const STYLE_ATTR_RE = /\s+style="([^"]*)"/g;
const CLASS_ATTR_RE = /\s+class="([^"]*)"/;
const ATTR_RE = /([a-zA-Z_:@][\w:.-]*)\s*=\s*(?:"[^"]*"|'[^']*')|([a-zA-Z_:@][\w:.-]*)/g;

export function classNameFor(decl, classByDecl = new Map()) {
  const key = decl.trim().replace(/;+\s*$/, "");
  if (!classByDecl.has(key)) {
    const hash = createHash("sha1").update(key).digest("base64url").slice(0, 10);
    classByDecl.set(key, `s-${hash}`);
  }
  return classByDecl.get(key);
}

/** Attribute names repeated inside a single tag — the invalid-markup signature. */
export function duplicateAttributes(html) {
  const found = [];
  for (const tag of html.match(TAG_RE) ?? []) {
    const seen = new Map();
    const body = tag.replace(/^<[a-zA-Z][a-zA-Z0-9-]*/, "");
    for (const match of body.matchAll(ATTR_RE)) {
      const name = (match[1] ?? match[2]).toLowerCase();
      seen.set(name, (seen.get(name) ?? 0) + 1);
    }
    for (const [name, count] of seen) {
      if (count > 1) found.push({ tag: tag.slice(0, 120), name, count });
    }
  }
  return found;
}

function migrateTag(tag, stats, classByDecl) {
  // Only markup tags carrying a style attribute are of interest: the same regex
  // also matches TypeScript generic parameter lists, which must never be touched.
  if (!tag.includes("style=")) return tag;
  // A match that swallows a second element start is a runaway, not a tag.
  const unquoted = tag.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
  if (unquoted.slice(1).includes("<")) {
    throw new Error(`Refusing to migrate a runaway tag match: ${tag.slice(0, 120)}`);
  }
  // Templated tags are never touched: their class/style values are runtime data.
  if (tag.includes("${") || tag.includes("`")) return tag;

  const classes = [];
  let cursor = 0;
  let output = "";
  let matched = false;
  for (const match of tag.matchAll(STYLE_ATTR_RE)) {
    matched = true;
    const decl = match[1].trim();
    if (decl) {
      classes.push(classNameFor(decl, classByDecl));
      stats.migrated++;
    }
    output += tag.slice(cursor, match.index);
    cursor = match.index + match[0].length;
  }
  if (!matched) return tag;
  output += tag.slice(cursor);

  if (!classes.length) return output;

  const classMatch = CLASS_ATTR_RE.exec(output);
  if (classMatch) {
    const existing = classMatch[1].trim();
    const merged = [...new Set([...(existing ? existing.split(/\s+/) : []), ...classes])].join(" ");
    output =
      output.slice(0, classMatch.index) +
      ` class="${merged}"` +
      output.slice(classMatch.index + classMatch[0].length);
  } else {
    const open = /^<[a-zA-Z][a-zA-Z0-9-]*/.exec(output)[0];
    const insertion = ` class="${[...new Set(classes)].join(" ")}"`;
    output = output.slice(0, open.length) + insertion + output.slice(open.length);
  }
  const migrated = output.replace(/\s{2,}(?=[^<]*>)/g, " ").replace(/\s+>/g, ">");
  const duplicates = duplicateAttributes(migrated);
  if (duplicates.length) {
    throw new Error(
      `Aborting: transform would emit ${duplicates[0].name} x${duplicates[0].count} in ${migrated.slice(0, 120)}`
    );
  }
  return migrated;
}

/** Migrate every static inline style in a TS source string; returns the new source. */
export function migrateSource(source, classByDecl = new Map(), stats = { migrated: 0 }) {
  return source.replace(TAG_RE, (tag) => migrateTag(tag, stats, classByDecl));
}

function collectTsFiles(dir, exclude) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...collectTsFiles(full, exclude));
    else if (full.endsWith(".ts") && !exclude.has(resolve(full))) files.push(full);
  }
  return files;
}

function generatedCss(classByDecl) {
  const css = [...classByDecl.entries()]
    .map(([decl, cls]) => `.${cls} { ${decl.endsWith(";") ? decl : `${decl};`} }`)
    .join("\n");
  return `/**
 * AUD-20: generated utility classes — one class per migrated static inline
 * style declaration. DO NOT EDIT BY HAND; produced by
 * scripts/migrate-inline-styles.mjs. Dynamic styles must be converted to
 * whitelisted variant classes by hand; this file is removed once none remain.
 */
export const GENERATED_UTILITY_CSS = \`
${css}
\`;
`;
}

export function run({ roots = DEFAULT_ROOTS, stylesOut = DEFAULT_STYLES_OUT, dryRun = false } = {}) {
  const stylesPath = resolve(stylesOut);
  const classByDecl = new Map();
  const stats = { migrated: 0 };
  const existingCss = readExistingClasses(stylesPath);
  if (existingCss) {
    for (const [decl, cls] of existingCss) classByDecl.set(decl, cls);
  }

  const results = [];
  let remainingInline = 0;
  for (const root of roots) {
    for (const file of collectTsFiles(root, new Set([stylesPath]))) {
      const original = readFileSync(file, "utf8");
      const next = migrateSource(original, classByDecl, stats);
      remainingInline += (next.match(/style="/g) ?? []).length;
      if (next !== original) results.push({ file, next });
    }
  }

  // All files validated before the first write: a mid-run abort leaves no partial migration.
  if (!dryRun) {
    for (const { file, next } of results) writeFileSync(file, next);
    const dir = dirname(stylesPath);
    mkdirSync(dir, { recursive: true });
    const body = generatedCss(classByDecl);
    if (readFileSyncSafe(stylesPath) !== body) writeFileSync(stylesPath, body);
  }

  console.log(`[inline-styles] files changed: ${dryRun ? results.length : `${results.length} (written)`}`);
  console.log(`[inline-styles] migrated static attributes: ${stats.migrated}`);
  console.log(`[inline-styles] utility classes in the sheet: ${classByDecl.size}`);
  console.log(`[inline-styles] inline style attributes remaining: ${remainingInline}`);
  return { changed: results.length, migrated: stats.migrated, classes: classByDecl.size, remaining: remainingInline };
}

function readFileSyncSafe(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

function readExistingClasses(path) {
  const body = readFileSyncSafe(path);
  if (!body) return undefined;
  const map = new Map();
  for (const match of body.matchAll(/\.s-([A-Za-z0-9_-]+) \{([^}]*)\}/g)) {
    map.set(match[2].trim().replace(/;$/, ""), `s-${match[1]}`);
  }
  return map;
}

const isMain = process.argv[1]?.endsWith("migrate-inline-styles.mjs");
if (isMain) {
  const argv = process.argv.slice(2);
  const roots = [];
  let stylesOut = DEFAULT_STYLES_OUT;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root") roots.push(argv[++i]);
    else if (argv[i] === "--styles-out") stylesOut = argv[++i];
    else if (argv[i] === "--dry-run") dryRun = true;
    else {
      console.error("usage: migrate-inline-styles.mjs [--root <dir>]... [--styles-out <file>] [--dry-run]");
      process.exit(2);
    }
  }
  const result = run({ roots: roots.length ? roots : DEFAULT_ROOTS, stylesOut, dryRun });
  if (dryRun && result.changed > 0) console.log("[inline-styles] dry run: nothing was written");
}
