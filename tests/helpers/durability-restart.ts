/**
 * The "restart the process" half of a durability claim, shared by the suites
 * that measure it.
 *
 * The writer lives in the Vitest process; `tests/helpers/durable-restart-reader.mjs`
 * runs in a *different* OS process that has never seen the record — its only
 * knowledge comes from the hydrated index, i.e. from Postgres. Two rules make
 * that honest, and they live here so a second suite cannot quietly weaken them:
 *
 *  - the child reads the compiled `dist/` artifact, so this module rebuilds it
 *    whenever `src/` is newer; otherwise a suite would certify a stale build;
 *  - a child that cannot reach Postgres reports `database: false`, and
 *    `restartRead()` fails on that rather than reporting an empty result as a
 *    passing measurement (Rule 0.4a).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { flushDurableJournal } from "../../src/core/database/durable-journal.js";

export const REPO_ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const RESTART_READER = path.join(REPO_ROOT, "tests/helpers/durable-restart-reader.mjs");
const DIST_STAMP = path.join(REPO_ROOT, "dist/src/core/database/durable-journal.js");
const TSC_BIN = path.join(REPO_ROOT, "node_modules/typescript/bin/tsc");

export interface RestartRead {
  ok: boolean;
  entity?: string;
  key?: string;
  /** false = no reachable Postgres: the measurement was impossible, not empty. */
  database: boolean | null;
  hydrated?: unknown;
  record?: unknown;
  reason?: string;
}

/** Newest mtime of any TypeScript source the restart child is built from. */
function newestSourceMtime(dir = path.join(REPO_ROOT, "src")): number {
  let newest = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSourceMtime(abs));
    else if (entry.name.endsWith(".ts")) newest = Math.max(newest, fs.statSync(abs).mtimeMs);
  }
  return newest;
}

/** Rebuild `dist/` when the sources are newer than the artifact the child reads. */
export function ensureCompiledArtifact(): void {
  const distMtime = fs.existsSync(DIST_STAMP) ? fs.statSync(DIST_STAMP).mtimeMs : 0;
  if (distMtime >= newestSourceMtime()) return;
  execFileSync(process.execPath, [TSC_BIN], {
    cwd: REPO_ROOT,
    stdio: "ignore",
    timeout: 600_000,
    maxBuffer: 8 * 1024 * 1024,
  });
}

/** Spawn the reader. Throws when the child produced no verdict at all. */
export function readAfterRestart(entity: string, key: string): RestartRead {
  const stdout = execFileSync(process.execPath, [RESTART_READER, entity, key], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 120_000,
  });
  const line = stdout.trim().split("\n").at(-1) ?? "";
  if (!line) throw new Error(`[durability] restart reader produced no output for '${entity}'`);
  return JSON.parse(line) as RestartRead;
}

/**
 * Drain this process's staged rows, then read the record from a process that has
 * never seen it. Fails loudly when the child had no database to read: an
 * unmeasurable claim is not a passing one.
 */
export async function restartRead(entity: string, key: string): Promise<Record<string, unknown>> {
  await flushDurableJournal();
  const result = readAfterRestart(entity, key);
  if (!result.ok) {
    throw new Error(`[durability] restart read failed for '${entity}' ${key}: ${result.reason}`);
  }
  if (result.database !== true) {
    throw new Error(
      `[durability] restart child could not reach Postgres for '${entity}' ${key}; durability is NOT verified`
    );
  }
  if (result.record === null || result.record === undefined) {
    throw new Error(`[durability] '${entity}' ${key} did not survive a process restart`);
  }
  return result.record as Record<string, unknown>;
}
