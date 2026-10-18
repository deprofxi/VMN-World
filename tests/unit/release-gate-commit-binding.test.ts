/**
 * PR-03: the release gate binds the signed decision to a commit.
 *
 * `docs/audit/production-readiness-deepcheck-2026-10-16.md` recorded the defect
 * as reproduced: `gates:check` printed `Notice: Manifest SHA (ca303f0) diverges
 * from current HEAD (37d0007)` and then answered `GO_WITH_CONDITIONS` with exit
 * 0, while `--allow-sha-drift` was computed and never read. A manifest signed
 * against one tree could therefore clear a different one, and there was no
 * invocation that could make the gate refuse.
 *
 * Authority: `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` §67 (an authorised human release
 * owner records the decision for a specific commit); `tasks.md` §8.
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCli } from "../../src/cli/index.js";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MANIFEST_PATH = path.join(REPO_ROOT, "release-manifest.json");
const CI_PATH = path.join(REPO_ROOT, ".github", "workflows", "ci.yml");

function headSha(): string | null {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** Writes a copy of the real manifest with an overridden commit binding. */
function manifestWith(sha: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vmnl-gate-"));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  manifest.gitCommitSha = sha;
  const target = path.join(dir, "release-manifest.json");
  fs.writeFileSync(target, JSON.stringify(manifest, null, 2));
  return target;
}

describe("PR-03: the release gate refuses a manifest signed for another commit", () => {
  it("fails when the manifest commit does not match HEAD", async () => {
    // 40 zeroes cannot match any real commit, so this is deterministic whatever
    // the repository is currently pinned to.
    const divergent = manifestWith("0".repeat(40));
    const exitCode = await runCli(["gates:check", "--manifest", divergent]);
    expect(exitCode).toBe(1);
  });

  it("passes the same manifest only once the override is explicit", async () => {
    const divergent = manifestWith("0".repeat(40));
    const exitCode = await runCli(["gates:check", "--manifest", divergent, "--allow-sha-drift"]);
    expect(exitCode).toBe(0);
  });

  it('treats the "HEAD" sentinel as an unbound manifest rather than a match', async () => {
    // The sentinel predates this check and is still honoured: a manifest that
    // does not claim a commit is not asserting one, so it is not refused.
    const unbound = manifestWith("HEAD");
    const exitCode = await runCli(["gates:check", "--manifest", unbound]);
    expect(exitCode).toBe(0);
  });

  it("keeps the CI override self-retiring: present only while the drift exists", () => {
    const head = headSha();
    if (head === null) return; // no git in this environment: nothing to bind to

    const manifestSha = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")).gitCommitSha as string;
    const driftExists = !head.startsWith(manifestSha) && !manifestSha.startsWith(head);
    const ciText = fs.readFileSync(CI_PATH, "utf8");
    const overridePresent = /gates:check --allow-sha-drift/.test(ciText);

    if (driftExists) {
      expect(
        overridePresent,
        "release-manifest.json is pinned to a commit that is not HEAD, so .github/workflows/ci.yml must pass --allow-sha-drift explicitly (and say why) rather than letting the gate refuse with no recorded remedy."
      ).toBe(true);
    } else {
      expect(
        overridePresent,
        "release-manifest.json now matches HEAD, so the --allow-sha-drift override in .github/workflows/ci.yml has outlived its reason: delete the flag so the gate attests the released commit again (tasks.md §8: no --allow-sha-drift once pinned)."
      ).toBe(false);
    }
  });
});
