# Runbook — Release gate: evidence, freshness and artefact binding

**Authority:** `VMNL-AZP-VMN-BRD-PRD-001 — R1.2A` §67 (BG0–BG9 gates; NOT_TESTED is never PASS) ·
`VMNL-AZP-VMN-CCPP-001 — R1.1` §21 (release control) · `CLAUDE.md` `<agents>`, `<testing>`
**Findings closed by this runbook:** `PR-03`, `PR-04` (`docs/audit/production-readiness-deepcheck-2026-10-16.md`)
**Related:** [observability.md](observability.md) · [rollback-runbook.md](rollback-runbook.md) ·
[`docs/audit/evidence-register.md`](../audit/evidence-register.md)

---

## 1. What the gate used to be, and what it is now

Until 2026-10-17 `gates:check` was **self-attestation**. It read the manifest's own
`status: "PASS"` strings, never opened a cited `evidenceRef`, never freshness-checked
`evaluatedAt` (every gate carried the same `2026-09-28` date), and could not fail on a
manifest signed for a different commit — the divergence branch printed a `Notice` and
carried on, while `--allow-sha-drift` was computed and never read.

It now fails closed on four things:

| Control | Behaviour | Override |
|:---|:---|:---|
| Commit binding | Manifest `gitCommitSha` must match `HEAD` | `--allow-sha-drift` (loud, and pinned by a self-retiring test) |
| Evidence resolution | Every gate recorded as verified must cite an `evidenceRef` whose paths exist in the release tree | none |
| Evidence freshness | `evaluatedAt` must be inside the policy window (default 30 days) | `--max-evidence-age-days <n>` |
| Artefact binding | `PRODUCTION_S5` requires `artifactDigest` + a verified `ownerSignature` | none (production only) |

The command states plainly what it did **not** do:

```
[VMNL-CLI] Evidence paths resolved against the working tree; cited tests were NOT re-executed by this command.
```

That sentence is the honest limit of the gate. Resolving a path proves the evidence exists,
not that the named test ran in this build. Closing *that* gap is CI's job (see §4).

---

## 2. Running the gate

```bash
pnpm run build                                  # the digest is computed from dist/
node dist/src/cli/index.js gates:check          # refuses on SHA drift, stale or missing evidence
node dist/src/cli/index.js gates:check --allow-sha-drift   # explicit, announced override
node dist/src/cli/index.js gates:check --max-evidence-age-days 7
node dist/src/cli/index.js gates:check --artifact-digest <sha256>
```

Exit codes: `0` = the decision is cleared for the manifest's environment; `1` = refused.
A `1` always prints the reason on stderr, including one line per unresolved evidence finding:

```
[VMNL-CLI] EVIDENCE NOT RESOLVED (1):
  - [UNRESOLVED_EVIDENCE_PATH] BG2_RIGHTS: Cited evidence 'tests/unit/broadcast.test.ts' does not exist in the release tree.
```

(That is the real output shape with the cited path substituted for the one it names: the
sentence reports whichever `evidenceRef` no longer resolves — a test deleted, moved or
renamed since the gate was evaluated.)

### Finding codes

| Code | Meaning | Fix |
|:---|:---|:---|
| `MISSING_EVIDENCE` | A gate claims to be verified but cites nothing | Cite the file or test that proves it, or mark the gate `NOT_TESTED` |
| `UNRESOLVED_EVIDENCE_PATH` | A cited path does not exist | Correct the path, or restore the evidence; a deleted test must fail the gate |
| `PROSE_ONLY_EVIDENCE` | The citation is narrative (for example an agreement name), not a checkable artefact | Cite an artefact, or record the gate as `NOT_TESTED` with its reason |
| `STALE_EVIDENCE` | `evaluatedAt` is older than the policy window | Re-evaluate the gate and update the date — this is the control that stops a 2026-09-28 date from attesting a 2027 release |

A gate that is honestly `NOT_TESTED` or `BLOCKED` is **not** punished for lacking
resolvable evidence: it is making no claim. `BG6_CARRIAGE` is the live example — carriage
data is unverified, so it stays `NOT_TESTED` with a prose description and forces
`GO_WITH_CONDITIONS` rather than being dressed up as evidence.

---

## 3. Signing a release decision (`PRODUCTION_S5`)

The signature binds the owner to the **built artefact** and to every gate status, so
changing a gate after signing invalidates it. The key lives in the release owner's secure
environment as `RELEASE_SIGNING_KEY`; it is never committed, never logged, and never read
from the repository by any command.

```bash
# 1. Build the artefact that will ship.
pnpm run build

# 2. Produce the signature (prints only; it writes nothing).
RELEASE_SIGNING_KEY=... node dist/src/cli/index.js gates:sign --manifest release-manifest.json
# -> [VMNL-CLI] Artifact digest: <sha256>
# -> [VMNL-CLI] ownerSignature: <hmac>

# 3. Add both fields to release-manifest.json by hand, after review, and commit.
# 4. Verify.
RELEASE_SIGNING_KEY=... node dist/src/cli/index.js gates:check
```

Three refusals are deliberately distinguishable, because "could not check" must never be
mistaken for "checked and passed":

- `NO_SIGNATURE` — the manifest carries no `ownerSignature`;
- `NO_SIGNING_KEY` — `RELEASE_SIGNING_KEY` is not set, so the signature could not be checked;
- `SIGNATURE_INVALID` — the HMAC does not match the manifest (a gate was altered, or the
  digest differs from the one signed).

`PRODUCTION_S5` refuses to clear without a verified binding. `SANDBOX_S2` / `STAGING_S3`
report `Artefact binding NOT VERIFIED — …` and remain eligible for `GO_WITH_CONDITIONS`, so
a sandbox run is never mistaken for a production attestation.

---

## 4. What still sits outside the gate

| Gap | Where it is closed | Status |
|:---|:---|:---|
| The named tests are not re-executed by `gates:check` | The verification job runs the suite; the release job runs the gate *after* a green run on the same commit | open by design |
| The manifest is pinned one commit behind (a commit cannot contain its own SHA) | The release job re-pins `gitCommitSha` and a two-person review records it; the CI override is pinned by `tests/unit/release-gate-commit-binding.test.ts` so it cannot outlive the drift it exists for | `HD-01` / `TSK-37` |
| A release decision has never been attested by a real CI run | `PR-02` — the repository has no git remote | owner decision |

---

## 5. Browser verification (the other half of a release claim)

The accessibility and keyboard claims are verified in a real browser, not from HTML strings:

```bash
pnpm run build
pnpm exec playwright install --with-deps chromium   # once per machine
pnpm run test:browser
```

`playwright.config.ts` starts the **built server** on port 5611 with `reuseExistingServer:
false`, so the suite can never bind to a stale process and report old markup. The suite
covers: axe-core (WCAG 2.2 A/AA) across seven routes × the six target viewports, the
keyboard path (skip link, focus visibility), focus restoration and the focus trap in the
command palette, and the styled-rendering guard that makes an unstyled measurement
impossible to mistake for a pass.

`pnpm run test:a11y` remains the Vitest HTML-shape suite: it measures bytes and does not
replace this run. Manual WCAG §7.5 coverage stays **NOT_RUN** under `HD-09`; an automated
axe sweep is not a manual conformance review, and no document may present it as one.
