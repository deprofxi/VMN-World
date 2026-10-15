/**
 * TSK-53 — the hygiene that `report.md` CA-29 found genuinely good is pinned so it cannot regress.
 *
 * These four properties were the only parts of the repository that needed no repair: `.env` is
 * untracked and ignored, `.env.example` ships no live credential, the fail-closed repository mode is
 * the default with the sandbox fallback a per-deployment decision that boot refuses in
 * production/staging, and `logStructured` actually emits. Verified good is still only good until
 * something enforces it — until now nothing did, so a future commit could regress any of the four
 * and CI would stay green. `tests/unit/audit-remediation-regressions.test.ts:228` already guards the
 * boot refusal and `tests/unit/audit-implementation-hardening.test.ts:71` the mode resolution; this
 * file covers the rest and re-asserts the mode default at the behaviour level.
 */

import { describe, it, expect, vi } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRepositoryMode } from "../../src/core/database/repository-mode.js";
import { TelemetryService } from "../../src/core/observability/index.js";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");

/**
 * A secret-named value is a placeholder only if it is empty, an interpolation, or one of the
 * documented dev/sandbox defaults. The pattern is deliberately narrow: a real credential —
 * `sk_live_…`, a JWT, an API key — matches none of it, which is the point of the guard.
 */
const PLACEHOLDER_VALUE =
  /^$|^\$\{|CHANGE_ME|sandbox_only|32chars|dev-seed|minioadmin|placeholder|example|^VMNL$|^vmnl_enterprise_hub$/;

function secretAssignments(text: string): Array<{ key: string; value: string; line: number }> {
  return text
    .split("\n")
    .map((line, i) => ({ match: /^(?:export )?([A-Z0-9_]+)=(.*)$/.exec(line), line: i + 1 }))
    .filter((r) => r.match !== null)
    .map((r) => ({ key: (r.match as RegExpExecArray)[1], value: (r.match as RegExpExecArray)[2].trim(), line: r.line }))
    .filter((r) => /SECRET|PASSWORD|KEY|TOKEN|HASH|CREDENTIAL/.test(r.key));
}

describe("TSK-53 preserved hygiene", () => {
  it("keeps .env untracked and gitignored", () => {
    const tracked = execFileSync("git", ["ls-files", "--", ".env"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
    expect(tracked, ".env must never be committed").toBe("");

    const ignored = execFileSync("git", ["check-ignore", "-q", "--", ".env"], { cwd: REPO_ROOT, encoding: "utf8" });
    expect(ignored, "git check-ignore exits non-zero when the path is not ignored").toBe("");
    expect(read(".gitignore").split("\n")).toContain(".env");
  });

  it("ships no live credential in .env.example", () => {
    const secrets = secretAssignments(read(".env.example"));
    const live = secrets.filter((s) => !PLACEHOLDER_VALUE.test(s.value));

    // The census is also lower-bounded: if someone deletes the secret lines instead of fixing them,
    // the guard must not silently pass on an empty set.
    expect(secrets.length, ".env.example should still declare the secret-named slots").toBeGreaterThanOrEqual(12);
    expect(live, `.env.example values that look like real credentials: ${JSON.stringify(live)}`).toEqual([]);
  });

  it("keeps the fail-closed switches off by default in the shipped example", () => {
    const example = read(".env.example");
    expect(example).toMatch(/^ALLOW_SANDBOX_FALLBACK=false$/m);
    expect(example).toMatch(/^ALLOW_MEMORY_KV_IN_PRODUCTION=false$/m);

    // Secret scanning is a CI step, not a convention.
    expect(read(".github/workflows/ci.yml")).toMatch(/gitleaks\/gitleaks-action@[0-9a-f]{40}/);
  });

  it("defaults the repository to fail_closed, never a silent fallback", () => {
    expect(process.env.ALLOW_SANDBOX_FALLBACK === "true").toBe(false);
    expect(getRepositoryMode()).toBe("fail_closed");
  });

  it("emits structured logs instead of building a line and discarding it", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const telemetry = new TelemetryService({});
      const serialized = telemetry.logStructured(
        "WARN",
        "hygiene guard emission check",
        { traceId: "TRACE-TSK53", spanId: "SPAN-TSK53", component: "guard" },
        { probe: true }
      );
      const emitted = spy.mock.calls.map((c) => String(c[0]));
      expect(emitted, "logStructured must write to stdout, not only return a string").toContain(serialized);
      expect(JSON.parse(serialized)).toMatchObject({
        level: "WARN",
        message: "hygiene guard emission check",
        traceId: "TRACE-TSK53",
        component: "guard",
        probe: true,
      });
    } finally {
      spy.mockRestore();
    }
  });
});
