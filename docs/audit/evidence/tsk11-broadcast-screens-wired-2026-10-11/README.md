# TSK-11 — the 33 broadcast operational screens read the engine, or say they cannot

2026-10-11 · **6 of 7 boxes closed** · baseline `ce098f8` + the dirty working set (194 `git status
--porcelain` entries / 284 files) · nothing committed, no remote configured — commit series is TSK-09.

Inherits `TODO-BCST-01` (`tasks.md` §1.4, still **REOPENED**: box 6 is open). Gate **DG-RL1-06** is
OPEN, owner Broadcast Director, expiry 2026-10-31 (`docs/audit/design-gate-closure-records.md:14`).

## What was served before

`src/web/broadcast/index.ts` was a wall of invented operational fact:

- **33** single-line `kpis: [...]` literals — `["Carriage Uptime", "99.98%"]`, `["Daily Yield", "₦18.4M"]`,
  `["Prime Fill Rate", "98.2%"]`, `["Transponder", "Eutelsat 16A @ 16°E"]`, `["Frequency", "11,554 MHz"]`,
  `["Primary PID", "0x1021"]`, `["DTT Multiplex", "Channel 142"]`, plus a generic fallback
  (`SLA Compliance 100% / Gate Cleared / Telemetry Connected`);
- the SHA-256 **of the empty string** (`e3b0c442…`) printed as a "Cryptographic Playlist Hash", with four
  invented playlist rows and a `Gate BG6 Cleared` badge;
- a live-looking playout monitor (`TRANSMITTING ON AIR`, `Super Xtreme Rap Battle S3 - Ep 04`,
  `TC 17:45:38:12`, `AUTO-STANDBY ARMED`, an actionable "Force Emergency Filler");
- an as-run reconciliation diff of eight real advertisers (Zenith Bank, MTN, GTBank, Airtel, Nestlé,
  Unilever, Coca-Cola, Dangote) with fabricated spot ids, times and `11,554 MHz StarTimes` carrier
  readings, headed "264 Total Spots Ingested";
- a revenue panel asserting `₦19,240,000.00` gross daily yield, `94.2%` fill, `₦245,000.00` average spot
  rate and four daypart bars no engine produced;
- `StarTimes Syndication Endpoint: api.startimes.com/v2/epg/vmn` — an invented production URL;
- a shared "Active Operational Records" table on every standard desk with three invented records
  (`REC-…-01/02/03`, `CLEARED (GATE BG)`, `VERIFIED`).

Meanwhile `getScreenData` / `renderScreenKpis` (`src/modules/broadcast/screens/data.ts:51`, `:150`) —
the layer that returns `DOMAIN_ENGINE | PROVISIONAL | NOT_CONNECTED` and refuses to fabricate — had
**zero** production callers (TSK-25's measurement).

## What it serves now

| Where | Before | Now |
|:---|:---|:---|
| KPI strip, all 33 screens | per-screen literal table | `getScreenData` + `renderScreenKpis` (`src/web/broadcast/index.ts:839`, `:840`); the label table at `:301` carries a decision sentence and an action label only |
| Schedule grid `:524` | 12 invented slots + daypart rate bars | `approvedScheduleEntries()` (`:87`) — approved revisions from the schedule store, with per-entry rights authority; NOT_CONNECTED when no approved day exists |
| Playout monitor `:578` | fake ON AIR state | engine `playoutStatus` when a caller supplies it, else NOT_CONNECTED with the controls omitted |
| Playlist lock `:613` | empty-string hash + fake rows | `createHash("sha256")` over the frozen approved revision (`:631`), one row per channel-day, or NOT_CONNECTED |
| As-run diff `:689` | 8 invented advertisers | supplied as-run summary or NOT_CONNECTED; Leg 3 labelled NOT CONNECTED because no carrier feed exists |
| EPG inspector `:716` | invented endpoint + sample XMLTV | real feed state from the strip, "no syndication endpoint is configured", plus the real episode→DAM linkage table |
| Yield panel `:752` | invented ₦ revenue and fill rates | a supplied billing snapshot in kobo-exact sums, or NOT_CONNECTED |
| Carrier bar `:1073` | `11,554 MHz StarTimes` / `PID 0x1021` | the channel registry, printing `CARRIAGE UNVERIFIED` because `starTimesCarriage.isProvisional` is true and the fields are unset (CLAUDE.md `<broadcast>` law, AUD-09) |
| Standard desk table | 3 invented records | real approved entries, or an explicit no-records row |
| Provenance banner | unconditional | conditional on the same `fullySourced` census (`:844-846`) — a fully engine-sourced screen drops the demonstration label instead of keeping a false one |

## Instruments

- `tests/unit/broadcast-provenance-coverage.test.ts` — **31 tests**. Renders all 33 screens × 4 states
  and fails on any of **25** named fabricated literals, on any `^\s*kpis: [` returning to the renderer,
  on `SCREEN_DECISIONS` existing in `src/`, and on the wiring being lost (`getScreenData(screen.screenId,
  buildScreenDataContext(engines))` and `renderScreenKpis(screenData, esc)` must both be present in the
  renderer source).
- `tests/unit/broadcast-screens.test.ts` — **16 tests** (was 11). Six assertions that previously
  *enforced* the fabricated content were moved to the corrected contract, each asserting the honest
  text **and** the absence of the invention (Rule 0.3 — nothing was deleted or relaxed). Two of them
  seed a real approved day through the production lifecycle (`registerFixtureRights` → `registerVersion`
  → `markReadyForAir` → `upsertDraftSchedule` → `approvePreAirChain`) and assert the grid renders that
  entry and that the published digest equals the SHA-256 the test recomputes over the same frozen
  revision.
- `docs/decisions/screen-register.json` entry `UX-BR-001..033` keeps `status: MOCK`; its evidence string
  was false about the code ("sample decision/KPI constants retained") and now states what is true,
  including why the status has not moved.

## Gates, one tree, serial, output to files

| Command | Exit | Result |
|:---|:---|:---|
| `pnpm typecheck` | 0 | `gates.txt` |
| `pnpm lint` (`--max-warnings 0`) | 0 | `gates.txt` |
| `pnpm test` | 0 | `full-suite.txt` — **67 files / 798 tests**, 0 failed, 0 skipped |
| `pnpm test:coverage` | **1** | `coverage.txt` — **67 files / 798 tests passed** and the floors cleared (**78.93 / 70.34 / 82.64 / 80.22** vs 73/62/77/72), but the run exited 1 on one vitest worker teardown error (`EnvironmentTeardownError: Closing rpc while "onUserConsoleLog" was pending`, attributed to `tests/unit/admissions.test.ts`). Two attempts are retained: `coverage.txt` (18 min, load average ≳200) and `coverage-attempt-contended.txt` (37 min). No assertion, threshold or config was changed to obtain this result, and it is **not** claimed as a clean exit-0 coverage run — see *Residual* below. |
| `pnpm build` | 0 | `gates.txt` |
| focused instruments | 0 | `focused-run.txt` — 5 files / **62 tests** (broadcast screens, provenance coverage, screen-register verification, desk census, rendered-HTML invariants) |

All 26 published `file:line` anchors re-opened in `measurements.txt` (0 mismatches).

## Limits this closure states rather than hides

1. **Box 6 is not closed and the register is not promoted.** Measured: 33/33 screens still render at
   least one `NOT_CONNECTED`/`PROVISIONAL` badge. `IMPLEMENTED` would be the same overstatement CA-08
   was. The true state needs a vocabulary the register does not have — that is **TSK-60 box 4**.
2. **No caller supplies engine snapshots yet.** `src/api/router.ts:3516` renders with three arguments,
   so the live-state branches (`playoutStatus`, `asRunSummary`, `billingTotals`, `sponsorshipAudit`) are
   exercised only by tests. Making them real changes what operators see on served screens and is
   recorded as the follow-up rather than bundled into a de-fabrication change.
3. **Comments still name the deleted literals** (`:295-296`, `:717`, `:753-754`) — they record what was
   removed. None is emitted; the render-level guard proves it.
4. `SCREEN_GATES` labels (`:254`) and the per-screen `decision` sentences remain editorial content, and
   the `?state=empty|error|loading` templates remain demonstration affordances (DT-404), not engine states.
5. Carriage remains unverified by design: the registry keeps `dttChannelNumber` / `dthChannelNumber` /
   `servicePid` unset until StarTimes/NBC confirm them, so `CARRIAGE UNVERIFIED` is the honest output
   and no code path here can override it.
