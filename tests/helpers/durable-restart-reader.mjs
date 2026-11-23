/**
 * TSK-17 restart probe (test helper, not a test).
 *
 * This is the "restart the process" half of the durability claim: the writer
 * lives in the Vitest process, and this file runs in a *different* OS process
 * that has never seen the record — its only knowledge comes from the hydrated
 * index, i.e. from Postgres. It reads the compiled output (`dist/`), the same
 * artifact `pnpm start` runs in production.
 *
 * Usage: node tests/helpers/durable-restart-reader.mjs <entity> <key>
 * Prints one JSON object on stdout:
 *   { ok, entity, key, database, hydrated, record }
 * `database: false` means no reachable Postgres — the caller must then report
 * the measurement as impossible, never as passed (Rule 0.4a).
 */

const DIST = new URL("../../dist/src/", import.meta.url);
const imp = (rel) => import(new URL(rel, DIST).href);

/**
 * Each reader returns `{ hydrated, record }` where `record` is what the durable
 * rows alone produced. Stores that keep their state behind a boot-hydration
 * function are read through it; stores whose truth lives in an instance the desk
 * constructs (ledger, sponsorship) are read through a fresh instance hydrated the
 * same way `server.start()` hydrates the production one.
 */
const READERS = {
  enquiry: async (key) => {
    const m = await imp("modules/hub/enquiry/index.js");
    return { hydrated: await m.refreshEnquiryIndex(), record: m.getEnquiryByReference(key) };
  },
  approval: async (key) => {
    const m = await imp("core/approvals/index.js");
    return { hydrated: await m.refreshApprovalIndex(), record: m.getApproval(key) };
  },
  case: async (key) => {
    const m = await imp("core/cases/index.js");
    return { hydrated: await m.refreshCaseIndex(), record: m.getCase(key) };
  },
  risk: async (key) => {
    const m = await imp("core/work/index.js");
    return { hydrated: await m.refreshRiskIssueIndex(), record: m.getRisk(key) };
  },
  issue: async (key) => {
    const m = await imp("core/work/index.js");
    return { hydrated: await m.refreshRiskIssueIndex(), record: m.listIssues().find((i) => i.id === key) };
  },
  destination: async (key) => {
    const m = await imp("core/federation/destinations.js");
    return { hydrated: await m.refreshDestinationIndex(), record: m.listDestinations().find((d) => d.id === key) };
  },
  mediaAsset: async (key) => {
    const m = await imp("core/storage/index.js");
    return { hydrated: await m.refreshMediaAssetIndex(), record: m.getMediaAsset(key) };
  },
  content: async (key) => {
    const m = await imp("core/content/index.js");
    const hydrated = await m.refreshContentIndex();
    const item = m.getContent(key);
    // `revisions` is a Map, which JSON would flatten to `{}`; the chain is
    // handed back as [revision, record] pairs so the caller can count it.
    return {
      hydrated,
      record: item ? { ...item, revisions: [...item.revisions.entries()] } : undefined,
    };
  },
  session: async (key) => {
    const m = await imp("core/auth/sessions.js");
    return {
      hydrated: await m.refreshSessionIndex(),
      record: m.listAllSessions().find((s) => s.tokenId === key),
    };
  },
  // UX-HUB-003 / UX-SYS-012: keyed by userId, because both stores are read per
  // account — the inbox list and the preference gate. The preference reader
  // returns the whole record, so a caller can prove the *stored* value came back
  // rather than the module defaults (`updatedAt` differs; defaults are minted at
  // module load in the child).
  inAppNotification: async (key) => {
    const m = await imp("core/auth/sessions.js");
    return {
      hydrated: await m.refreshInAppNotificationIndex(),
      record: m.listInAppNotifications(key),
    };
  },
  notificationPreference: async (key) => {
    const m = await imp("core/auth/sessions.js");
    const hydrated = await m.refreshNotificationPreferenceIndex();
    return { hydrated, record: m.getNotificationPreferences(key) };
  },
  // The dispatch gate itself, measured after a restart: the child hydrates, then
  // tries to deliver a suppressed category. `delivered: false` is the claim — a
  // restored opt-out still refuses, so the inbox cannot fill up with categories
  // the user switched off just because the process restarted. The child stages
  // the write in its own journal and exits without flushing, so nothing lands.
  inAppDispatchAfterRestart: async (key) => {
    const m = await imp("core/auth/sessions.js");
    const hydrated = await m.refreshNotificationPreferenceIndex();
    const separator = key.indexOf(":");
    const userId = key.slice(0, separator);
    const category = key.slice(separator + 1);
    const delivered = m.deliverInAppNotification({
      userId,
      category,
      title: "Restart dispatch probe",
      body: "This delivery attempt exists to prove the restored gate still refuses.",
    });
    return { hydrated, record: { delivered: delivered !== null } };
  },
  idempotency: async (key) => {
    const m = await imp("core/websecurity/index.js");
    const hydrated = await m.refreshIdempotencyIndex();
    const outcome = m.checkIdempotency(key);
    return { hydrated, record: outcome.status === "recorded" ? outcome.record : undefined };
  },
  journal: async (key) => {
    const ledger = await imp("modules/finance/ledger/index.js");
    const repo = await imp("core/database/repositories/release-critical.repository.js");
    const engine = new ledger.SevenWayLedgerEngine();
    const entries = await repo.loadJournalEntries();
    engine.hydrate(entries);
    return { hydrated: { entries: entries.length }, record: engine.getEntries().find((e) => e.id === key) };
  },
  // TSK-60 box 3: read the Quote-to-Cash portfolio the way `server.start()`
  // builds it — a fresh engine with no knowledge of the writer process, filled
  // only from the durable rows.
  salesDeal: async (key) => {
    const m = await imp("modules/finance/sales/index.js");
    const engine = new m.QuoteToCashSalesEngine();
    const hydrated = await m.hydrateSalesEngine(engine);
    return { hydrated, record: engine.getDeal(key) };
  },
  sponsorBinding: async (key) => {
    const m = await imp("modules/broadcast/sponsorship/index.js");
    const engine = new m.SponsorshipEngine();
    const hydrated = await m.hydrateSponsorshipEngine(engine);
    return { hydrated, record: engine.getBinding(key) };
  },
  sponsorFulfillment: async (key) => {
    const repo = await imp("core/database/repositories/release-critical.repository.js");
    const records = await repo.loadSponsorFulfillments();
    return {
      hydrated: { fulfillments: records.length },
      record: records.find((r) => `${r.bindingId}:${r.asRunLogId}` === key),
    };
  },
  // TSK-19: the provider-event claim is not a hydrated index — the row *is* the
  // guarantee. So the child does two things: reads the row Postgres holds, and
  // tries to claim the same event id itself. A process that never saw the
  // original delivery must be refused; if it were granted the claim, a Redis
  // loss plus a restart would let the provider's retry credit the payment twice.
  providerClaim: async (key) => {
    const repo = await imp("core/database/repositories/release-critical.repository.js");
    const db = await imp("core/database/index.js");
    const [provider, ...rest] = key.split(":");
    const eventId = rest.join(":");
    const row = await db
      .getPrismaClient()
      .providerEventClaim.findUnique({ where: { id: `${provider}:${eventId}` } });
    if (!row) return { hydrated: { rows: 0 }, record: null };
    const replayRefused = !(await repo.claimProviderEvent(provider, eventId));
    return {
      hydrated: { rows: 1 },
      record: {
        id: row.id,
        provider: row.provider,
        eventId: row.eventId,
        ingestedAt: row.ingestedAt ? String(row.ingestedAt.toISOString()) : null,
        replayRefused,
      },
    };
  },
  // TSK-18: the ledger is read out of the table by a process that never recorded
  // the entry, i.e. exactly the durability half of "the audit entry landed". The
  // key is `resource:resourceId`. `hashPayload` is the byte string that was
  // hashed, so the caller can recompute the entry's hash from the row alone.
  auditLedger: async (key) => {
    const repo = await imp("core/database/repositories/release-critical.repository.js");
    const [resource, ...rest] = key.split(":");
    const rows = await repo.loadAuditLogRows({ resource, resourceId: rest.join(":") });
    const row = rows[0];
    if (!row) return { hydrated: { rows: 0 }, record: null };
    const payload = row.changesJson ?? {};
    return {
      hydrated: { rows: rows.length },
      record: {
        id: row.id,
        action: row.action,
        resource: row.resource,
        resourceId: row.resourceId,
        userId: row.userId,
        tenantId: row.tenantId,
        createdAt: row.createdAt.toISOString(),
        entryHash: payload.auditEntryHash,
        previousHash: payload.auditPreviousHash,
        hashPayload: payload.auditHashPayload,
      },
    };
  },
};

const emit = (payload) => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
  process.exit(0);
};

const [entity, key] = process.argv.slice(2);
const reader = READERS[entity];
if (!reader || !key) {
  emit({ ok: false, reason: `unknown entity '${entity}'`, database: null });
}

try {
  const db = await imp("core/database/index.js");
  const status = await db.checkDatabaseConnection();
  if (!status.connected) {
    emit({ ok: false, entity, key, database: false, reason: status.error ?? "no database" });
  }

  const { hydrated, record } = await reader(key);
  emit({ ok: true, entity, key, database: true, hydrated, record: record ?? null });
} catch (err) {
  emit({ ok: false, entity, key, database: true, reason: err instanceof Error ? err.message : String(err) });
}
