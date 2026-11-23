# Canonical event catalogue — as emitted by this codebase

**Register:** `tasks.md` TSK-21 *(CA-13, PRD §39, ADR-006)* · **Measure date:** 2026-10-14
**Method:** every `JobType`, every `registerHandler` call, every `enqueue` call site and every
`broadcast.*` string was grepped out of `src/` on the measure date; the counts are re-computed by
`tests/unit/event-catalogue.test.ts`, which fails if this document and the code disagree.

**Rule applied:** 0.4a — this describes what runs today, not what the architecture documents
intend. Where they differ, the difference is stated as a defect with an owner task, not smoothed over.

---

## 1. The substrate is an in-process worker, not a message bus

| claim | source | measured reality |
|:---|:---|:---|
| "Adopt Redis Streams with BullMQ for reliable, persistent asynchronous job processing… event broadcasting" | `docs/adrs/ADR-006-event-driven-architecture-and-message-bus.md` (Decision) | No Redis, no BullMQ, no stream. `src/core/queue/index.ts:63` holds `private jobs = new Map<string, QueueJob>()` in the process's own heap |
| "All events must follow a standardized envelope schema with unique event IDs, idempotency keys, source provenance and ISO-8601 timestamps" | ADR-006 (Decision) | The envelope that exists is `QueueJob` (`src/core/queue/index.ts:29-42`): `id`, `type`, `payload`, `status`, `priority`, `attempts`, `maxRetries`, `backoffDelayMs`, `nextAttemptAt`, `lastError`, `result`, `createdAt`, `updatedAt`, `processedAt`. It has **no idempotency key and no source-provenance field** |
| Reliability across restart | ADR-006 (Consequences: retries, DLQ, visibility) | **Jobs do not survive a restart.** Terminal jobs are additionally evicted after `terminalJobTtlMs` (default 1 h, `src/core/queue/index.ts:69-78`). The queue is **not** among the durable stores registered by TSK-17/TSK-18 — `registerDurableStore` has no queue key. Per canonical rule 0.4a this is sandbox state, not persistence |
| Retry / DLQ | ADR-006 | Present and exercised: statuses `QUEUED / PROCESSING / COMPLETED / FAILED / DEAD_LETTER` (`src/core/queue/index.ts:22-27`), exponential backoff fields, and a metrics block (`QueueMetrics`, `:52-58`) |

**Consequence for release gating:** a queued job is a best-effort in-process side effect. Any business
promise that "the EPG push / notification / reconciliation will eventually happen" is false across a
deploy or crash. This is the honest statement of CA-13's second half; the fix is a durable queue
backend (ADR-006's own decision) and is not part of TSK-21's two boxes.

## 2. The four job types the worker knows

`JobType` union: `src/core/queue/index.ts:16-19`. Handlers are registered once, at boot, in
`src/api/server.ts`. Producers were counted by grepping `enqueue(` across `src/`.

| JobType | handler | producers in `src/` | what the handler actually does |
|:---|:---|:---|:---|
| `EPG_GENERATION` | `src/api/server.ts:199-215` | **2** — boot-time enqueue `src/api/server.ts:410-417`; recurring `configureRollingEpgScheduler` (`src/core/queue/index.ts:301-314`, 24 h interval, wired at `src/api/server.ts:409`) | Builds 7-day rolling feeds for the three provisioned channels and returns `{channelsProcessed, totalSlots, xmltvTotalLength, generatedAt}` plus a `epg_syndication_generation_total` metric. **It does not publish an EPG anywhere** — there is no syndication endpoint in code, and inventing one is prohibited (`tasks.md` TSK-15/TSK-35 constraints) |
| `NOTIFICATION_DELIVERY` | `src/api/server.ts:217-223` | **1** — `src/web/public/hub.ts:209` (public enquiry capture) | Routes to `notificationService.sendSms` when `payload.channel === "SMS"`, else `sendEmail`. Delivery transport is environment-configured; unset credentials produce a logged failure, not a silent success |
| `WEBHOOK_DISPATCH` | `src/api/server.ts:225-233` | **0** | Records `webhook_dispatch_total` and returns `{dispatched: true, endpoint, timestamp}`. **Nothing is dispatched** — the handler performs no network I/O. It is a metrics stub with a success-shaped return value |
| `RECONCILIATION_RUN` | `src/api/server.ts:235-244` | **0** | Calls `bankRecon.reconcileAgainstInvoices(payload.invoices ?? [])`. With no producer in `src/`, the only way this runs is a test or a hand-driven enqueue |

**Two of four job types are dead handlers** (`WEBHOOK_DISPATCH`, `RECONCILIATION_RUN`): registered,
never enqueued. `tests/unit/event-catalogue.test.ts` pins that count so a new producer cannot appear
without this table being updated — and so a handler cannot be quietly deleted to make the census tidy.

The *real* outbound webhook path is not the queue. It is `AzeeboBridge.dispatchWebhook`
(`src/modules/federation/azeebo/bridge.ts:100`), called from the federation route at
`src/api/router.ts:7006`.

## 3. Outbound federation events (the only externally-visible events)

| fact | value | source |
|:---|:---|:---|
| event type | caller-supplied `body.eventType`, defaulting to `CONTENT_SYNDICATED` | `src/api/router.ts:7007-7009` |
| typed kinds elsewhere in the same module | `CONTENT_PUBLISHED`, `CONTENT_UPDATED`, `CONTENT_UNPUBLISHED`, `RIGHTS_EXPIRED` | `src/modules/federation/azeebo/metadata.ts:34` |
| signature | HMAC-SHA256 over the payload with an ISO timestamp header | `src/modules/federation/azeebo/bridge.ts:107-109` (`signPayload`) |
| target | configured `AZEEBO_API_BASE_URL` + `/webhooks`, or an explicit `targetEndpoint`; **503 `FED_ENDPOINT_NOT_CONFIGURED` when neither exists** | `src/api/router.ts:6993-7005` — no endpoint is invented (TSK-35) |
| circuit breaker | `OPEN` ⇒ webhook goes straight to the dead-letter queue with `lastError` naming the breaker | `src/modules/federation/azeebo/bridge.ts:122-128` |
| **delivery defect, recorded not fixed** | `const success = mockTransport ? mockTransport(webhook) : true;` — with no transport injected the webhook is marked delivered **without any HTTP call** | `src/modules/federation/azeebo/bridge.ts:134` |

The last row is the most important sentence in this document. A production caller that does not pass a
`mockTransport` receives `200 {status: "DELIVERED"}` for an event that never left the process. Fixing
it belongs to the federation track (TSK-35's registry and TSK-36/TSK-57's production wiring), not to
TSK-21's two boxes, and this catalogue records it rather than describing the happy path only.

## 4. PRD §39's sixteen canonical candidates, assessed

PRD §39 is titled **"CANONICAL BROADCAST EVENT CANDIDATES"**
(`docs/authorities/VMNL-AZP-VMN-BRD-PRD-001-R1.2A.md:1458`) and its own preamble says "The event
catalogue must assess:" (`:1460`), one section after the standing warning that "The interface list is
a requirement inventory, not evidence of live endpoints" (`:1453`). Assessing them is therefore what
closing TSK-21 means; emitting all sixteen is a feature programme, not a doc fix.

Measured: **none of the sixteen names is emitted anywhere in `src/`.** `grep -rn` for each string in
`src` returns zero. Three near-miss strings exist and are *not* events — they are a provenance field
id (`broadcast.schedule_state`, `src/core/config/source-mappings.ts:68`) and two audit-log action
labels (`broadcast.epg.push_attempted`, `src/api/router.ts:5994`; `broadcast.version.rfa`,
`src/api/router.ts:7520`).

| candidate (PRD §39, line) | status | nearest mechanism that does exist |
|:---|:---|:---|
| `broadcast.channel.created` (`:1462`) | NOT_EMITTED | channel data is the provisioned three-channel registry; no creation path emits |
| `broadcast.programme.ingested` (`:1464`) | NOT_EMITTED | DAM/episode-master registration (`src/modules/broadcast/episode-masters.ts`) — write-through repository, no event |
| `broadcast.asset.qc_passed` (`:1466`) | NOT_EMITTED | review-queue state on the media asset store |
| `broadcast.schedule.drafted` (`:1468`) | NOT_EMITTED | schedule state machine `DRAFT` (`docs/domain/state-machines.md`) |
| `broadcast.schedule.approved` (`:1470`) | NOT_EMITTED | schedule state machine `APPROVED` + approval durable store (TSK-17) |
| `broadcast.epg.published` (`:1472`) | NOT_EMITTED | `EPG_GENERATION` job result (§2) — generation only, no publication target |
| `broadcast.inventory.booked` (`:1474`) | NOT_EMITTED | campaign/deal writes (TSK-60's portfolio store) |
| `broadcast.adspot.approved` (`:1476`) | NOT_EMITTED | traffic/sponsorship binding writes (TSK-16 pair) |
| `broadcast.playlist.generated` (`:1478`) | NOT_EMITTED | playlist surfaces render `NOT CONNECTED` without an automation adapter |
| `broadcast.programme.aired` (`:1480`) | NOT_EMITTED | as-run log is absent by design (TSK-15/StarTimes constraint) |
| `broadcast.adspot.aired` (`:1482`) | NOT_EMITTED | as-run + billing snapshot absent; screens show honest empty states |
| `broadcast.asrun.reconciled` (`:1484`) | NOT_EMITTED | `RECONCILIATION_RUN` handler exists but has no producer (§2) |
| `broadcast.transmission.incident` (`:1486`) | NOT_EMITTED | incident/case stores (TSK-17 domains), no event fan-out |
| `broadcast.carriage.renewal_due` (`:1488`) | NOT_EMITTED | carriage entities are `PROVISIONAL` and must never be rendered authoritative (TSK-15) |
| `broadcast.rights.expiring` (`:1490`) | NOT_EMITTED | rights window data drives the gate (TSK-10); expiry is queried, never pushed |
| `broadcast.azeebo_cta.triggered` (`:1492`) | NOT_EMITTED | federation links + webhook dispatch (§3) are the closest real path |

**ADR-006 is therefore not implemented in RL1, and no document here claims it is.** The recorded
options are the register's own two branches: implement the bus, or supersede. TSK-21 closes on the
first branch as written — "the catalogue is implemented (event names as emitted by the queue)" — which
is §1–§3 above. §39's candidate list is assessed, not adopted. If the owner decides RL1 does not need
a message bus at all, that decision still needs a dated record naming its approver; this document does
not manufacture one.

## 5. What this document does not claim

- That the queue will ever be durable. It is in-process and restart-lossy (§1).
- That federation webhooks reach a partner. Without an injected transport they do not (§3, last row).
- That the sixteen candidates are unneeded. They are unimplemented; whether RL1 needs them is a
  business decision that `DEC-RL1-SCOPE-001` (still `PENDING_SIGNATURE`) has not made.
- That this file is self-maintaining. It is: `tests/unit/event-catalogue.test.ts` re-derives the
  `JobType` union, the handler count, the producer counts, the sixteen §39 names straight from the PRD,
  and the zero-emission claim on every `pnpm test` run.
