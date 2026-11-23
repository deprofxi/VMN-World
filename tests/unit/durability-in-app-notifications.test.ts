/**
 * UX-HUB-003 / UX-SYS-012 — the in-app inbox and the preference gate that
 * decides whether anything is delivered survive a restart.
 *
 * The defect this file pins: both stores were process `Map`s. A restart emptied
 * an inbox that still held unread items, and — the part that is not cosmetic —
 * reset every opt-out to the defaults, so `deliverInAppNotification` went back to
 * delivering categories the user had switched off. Persisting only the inbox
 * would have fixed the first half and left the second, which is why this suite
 * asserts dispatch *and* storage.
 *
 * Three layers, because they fail differently:
 *  1. the migration is read as text — the tables, the columns the repository
 *     writes, and the fact that it is additive (no ALTER/DROP/backfill);
 *  2. dispatch is asserted in-process — the preference check is the first thing
 *     the dispatcher does, and a suppressed category writes no record at all;
 *  3. a second OS process reads back what the rows alone can reconstruct, and
 *     attempts one suppressed delivery to prove the restored gate still refuses.
 *
 * Postgres absence is reported, never smoothed over (Rule 0.4a): the DB-backed
 * cases are skipped with a loud reason, and `restartRead()` fails rather than
 * returning an empty record as a passing measurement.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";
import { createApiServer } from "../../src/api/server.js";
import { signSessionToken } from "../../src/core/auth/index.js";
import { _resetDurableJournalForTesting } from "../../src/core/database/durable-journal.js";
import {
  _resetInboxForTesting,
  _resetPreferencesForTesting,
  deliverInAppNotification,
  getNotificationPreferences,
  listInAppNotifications,
  markInAppNotificationsRead,
  saveNotificationPreferences,
} from "../../src/core/auth/sessions.js";
import { REPO_ROOT, ensureCompiledArtifact, restartRead } from "../helpers/durability-restart.js";

const MIGRATION =
  "prisma/migrations/20261119120000_add_durable_notification_inbox/migration.sql";
const SCHEMA = "prisma/schema.prisma";

/** One id namespace per run, so rows never collide with a previous run's. */
const RUN = `t${Date.now().toString(36)}`;
const USER = `usr-notif-${RUN}`;
/** The account the HTTP half signs in as — a row written by a process that died. */
const HTTP_USER = `${USER}-http`;
const HTTP_PORT = 54100 + Math.floor(Math.random() * 400);

const read = (rel: string): string => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");

/** Columns the repository writes; the migration must create every one. */
const INBOX_COLUMNS = ["id", "userId", "category", "title", "body", "route", "createdAt", "readAt"];
const PREFERENCE_COLUMNS = [
  "userId",
  "email",
  "sms",
  "inApp",
  "playoutDisruption",
  "rightsBlocks",
  "financeApprovals",
  "admissionsDecisions",
  "updatedAt",
];

describe("UX-HUB-003 / UX-SYS-012: the durable notification migration", () => {
  it("creates both tables and every column the repository writes", () => {
    const sql = read(MIGRATION);

    expect(sql).toMatch(/CREATE TABLE "InAppNotificationRecord"/);
    expect(sql).toMatch(/CREATE TABLE "NotificationPreferenceRecord"/);
    for (const column of INBOX_COLUMNS) {
      expect(sql, `InAppNotificationRecord.${column} must be created`).toMatch(
        new RegExp(`"${column}" (TEXT|TIMESTAMP\\(3\\))`)
      );
    }
    for (const column of PREFERENCE_COLUMNS) {
      expect(sql, `NotificationPreferenceRecord.${column} must be created`).toMatch(
        new RegExp(`"${column}" (TEXT|BOOLEAN|TIMESTAMP\\(3\\))`)
      );
    }
  });

  it("is additive: no ALTER, no DROP, no destructive backfill", () => {
    // Judge statements, not prose: the file's own header says "no DROP" and a
    // regex over the whole text would fail on that comment, not on SQL.
    const statements = read(MIGRATION)
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    expect(statements).not.toMatch(/\bALTER TABLE\b/i);
    expect(statements).not.toMatch(/\bDROP\b/i);
    expect(statements).not.toMatch(/\bDELETE FROM\b/i);
    expect(statements).not.toMatch(/\bUPDATE\b/i);
  });

  it("declares the models the migration creates, and nothing else", () => {
    const schema = read(SCHEMA);
    expect(schema).toMatch(/^model InAppNotificationRecord \{/m);
    expect(schema).toMatch(/^model NotificationPreferenceRecord \{/m);
    // The row key is the minted notification id: a derived key would let a
    // hydration renumber a delivery.
    const inbox = schema.split("model InAppNotificationRecord {")[1].split("\n}")[0];
    expect(inbox).toMatch(/id\s+String\s+@id/);
  });
});

describe("UX-HUB-003: dispatch honours the stored gate (in-process)", () => {
  beforeEach(() => {
    _resetPreferencesForTesting();
    _resetInboxForTesting();
    _resetDurableJournalForTesting();
  });

  it("suppresses a category the user switched off, and writes no record", () => {
    saveNotificationPreferences(USER, {
      categories: {
        playoutDisruption: true,
        rightsBlocks: false,
        financeApprovals: true,
        admissionsDecisions: false,
      },
    });

    const delivered = deliverInAppNotification({
      userId: USER,
      category: "RIGHTS_BLOCK",
      title: "Licence window closes in 48h",
      body: "The rights gate would have notified this desk.",
    });

    expect(delivered, "an opted-out category must not be delivered").toBeNull();
    expect(listInAppNotifications(USER), "a suppressed delivery leaves no hidden record").toEqual([]);
  });

  it("delivers an allowed category, newest first, and marks it read", () => {
    saveNotificationPreferences(USER, {
      categories: {
        playoutDisruption: true,
        rightsBlocks: true,
        financeApprovals: true,
        admissionsDecisions: false,
      },
    });

    const first = deliverInAppNotification({
      userId: USER,
      category: "PLAYOUT_DISRUPTION",
      title: "Primary playout path interrupted",
      body: "Failover engaged on the secondary encoder.",
      route: "/broadcast/screens/BC-01",
    });
    const second = deliverInAppNotification({
      userId: USER,
      category: "PLAYOUT_DISRUPTION",
      title: "Failover confirmed",
      body: "Timecode and as-run continuity verified.",
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(listInAppNotifications(USER).map((n) => n.title)).toEqual([
      "Failover confirmed",
      "Primary playout path interrupted",
    ]);

    expect(markInAppNotificationsRead(USER)).toBe(2);
    expect(listInAppNotifications(USER).every((n) => n.readAt)).toBe(true);
  });

  it("still delivers SYSTEM notifications regardless of category preference", () => {
    saveNotificationPreferences(USER, {
      categories: {
        playoutDisruption: false,
        rightsBlocks: false,
        financeApprovals: false,
        admissionsDecisions: false,
      },
    });

    expect(
      deliverInAppNotification({
        userId: USER,
        category: "SYSTEM",
        title: "Session policy updated",
        body: "System notices are not opt-outable.",
      })
    ).not.toBeNull();
    expect(getNotificationPreferences(USER).categories.playoutDisruption).toBe(false);
  });
});

const connection = await checkDatabaseConnection(true);
const DURABLE = connection.connected;
if (!DURABLE) {
  console.warn(
    `[UX-HUB-003] SKIP: no reachable Postgres (${connection.error}). ` +
      "Restart durability and the applied migration are NOT verified in this run."
  );
}

/** Child processes carry a real Prisma cold start (~8s each) on this machine. */
function restartIt(name: string, fn: () => Promise<void> | void): void {
  it(name, fn, 180_000);
}

/** One GET against the real router, carrying the session cookie a browser would. */
function getFromServer(pathname: string, cookie: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: HTTP_PORT, path: pathname, method: "GET", headers: { Accept: "text/html", Cookie: cookie } },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, body }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

describe.skipIf(!DURABLE)("UX-HUB-003 / UX-SYS-012: survive a restart", () => {
  beforeAll(() => {
    // The child reads `dist/`; never certify an artifact older than `src/`.
    ensureCompiledArtifact();
  }, 600_000);

  beforeEach(async () => {
    _resetPreferencesForTesting();
    _resetInboxForTesting();
    _resetDurableJournalForTesting();
    // Each case starts from a clean account, so a count means what it says.
    await getPrismaClient().inAppNotificationRecord.deleteMany({ where: { userId: { in: [USER, HTTP_USER] } } });
    await getPrismaClient().notificationPreferenceRecord.deleteMany({ where: { userId: { in: [USER, HTTP_USER] } } });
  });

  afterAll(async () => {
    await getPrismaClient().inAppNotificationRecord.deleteMany({ where: { userId: { in: [USER, HTTP_USER] } } });
    await getPrismaClient().notificationPreferenceRecord.deleteMany({ where: { userId: { in: [USER, HTTP_USER] } } });
  });

  restartIt("applied the migration: both tables and their columns exist in the schema", async () => {
    const columns = async (table: string): Promise<string[]> => {
      const rows = await getPrismaClient().$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = ${table}
      `;
      return rows.map((row) => row.column_name).sort();
    };

    expect(await columns("InAppNotificationRecord")).toEqual([...INBOX_COLUMNS].sort());
    expect(await columns("NotificationPreferenceRecord")).toEqual([...PREFERENCE_COLUMNS].sort());
  });

  restartIt("keeps the delivered notification, its read stamp and the opt-out across a restart", async () => {
    // A preference save and a delivery in one request: they must land together.
    saveNotificationPreferences(USER, {
      inApp: false,
      sms: true,
      categories: {
        playoutDisruption: true,
        rightsBlocks: false,
        financeApprovals: true,
        admissionsDecisions: false,
      },
    });
    const delivered = deliverInAppNotification({
      userId: USER,
      category: "PLAYOUT_DISRUPTION",
      title: "Encoder failover engaged",
      body: "The primary playout path lost signal at 21:04.",
      route: "/broadcast/screens/BC-03",
    });
    expect(delivered).not.toBeNull();

    const suppressed = deliverInAppNotification({
      userId: USER,
      category: "RIGHTS_BLOCK",
      title: "Licence expired",
      body: "This delivery is opted out and must leave no row.",
    });
    expect(suppressed).toBeNull();

    expect(markInAppNotificationsRead(USER)).toBe(1);

    // A process that has never seen these records reads them back.
    const inbox = (await restartRead("inAppNotification", USER)) as unknown as Array<
      Record<string, unknown>
    >;
    expect(inbox, "exactly the delivered notification, never the suppressed one").toHaveLength(1);
    const record = inbox[0];
    expect(record.id).toBe((delivered as { id: string }).id);
    expect(record.title).toBe("Encoder failover engaged");
    expect(record.category).toBe("PLAYOUT_DISRUPTION");
    expect(record.route).toBe("/broadcast/screens/BC-03");
    expect(new Date(record.createdAt as string).getTime()).toBe(
      new Date((delivered as { createdAt: Date }).createdAt).getTime()
    );
    // Read state is stored, not re-derived: an item opened before the restart
    // must not come back unread.
    expect(record.readAt).not.toBeNull();

    const preferences = (await restartRead("notificationPreference", USER)) as unknown as {
      inApp: boolean;
      sms: boolean;
      categories: Record<string, boolean>;
      updatedAt: string;
    };
    expect(preferences.inApp).toBe(false);
    expect(preferences.sms).toBe(true);
    expect(preferences.categories.rightsBlocks, "the opt-out must survive the restart").toBe(false);
    expect(preferences.categories.playoutDisruption).toBe(true);
    // Not the module defaults: those are minted when the child loads.
    expect(new Date(preferences.updatedAt).getTime()).toBe(
      getNotificationPreferences(USER).updatedAt.getTime()
    );
  });

  restartIt("refuses a suppressed category after the restart, from the restored gate", async () => {
    saveNotificationPreferences(USER, {
      categories: {
        playoutDisruption: true,
        rightsBlocks: true,
        financeApprovals: false,
        admissionsDecisions: false,
      },
    });
    // Drain the preference row, then let a fresh process attempt the delivery.
    await restartRead("notificationPreference", USER);

    // Read through the shared restart harness, so the drill census sees this
    // domain restarted rather than merely probed.
    const verdict = (await restartRead(
      "inAppDispatchAfterRestart",
      `${USER}:FINANCE_APPROVAL`
    )) as unknown as { delivered: boolean };
    expect(
      verdict.delivered,
      "a restarted process must not deliver a category the user switched off"
    ).toBe(false);

    // The child staged its attempt in its own journal and exited without
    // flushing, so nothing may have landed.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const rows = await getPrismaClient().inAppNotificationRecord.count({ where: { userId: USER } });
    expect(rows, "the refused delivery must not have written a row").toBe(0);
  });

  // The half above proves the store; this proves the page an operator actually
  // opens. The rows are written *before* the server starts, exactly as a process
  // that has since exited would have left them, and the assertion is against the
  // real route and the real session cookie — not against `listInAppNotifications`.
  restartIt("serves the hydrated inbox on /workspace/notifications and stamps it read", async () => {
    const id = `ntf-${RUN}-http`;
    await getPrismaClient().inAppNotificationRecord.create({
      data: {
        id,
        userId: HTTP_USER,
        category: "PLAYOUT_DISRUPTION",
        title: "Encoder failover engaged",
        body: "The primary playout path lost signal at 21:04.",
        route: "/broadcast/screens/BC-03",
        createdAt: new Date("2026-11-19T09:00:00.000Z"),
        readAt: null,
      },
    });
    await getPrismaClient().notificationPreferenceRecord.create({
      data: {
        userId: HTTP_USER,
        email: true,
        sms: false,
        inApp: true,
        playoutDisruption: true,
        rightsBlocks: false,
        financeApprovals: true,
        admissionsDecisions: false,
        updatedAt: new Date("2026-11-19T09:00:00.000Z"),
      },
    });

    const server = createApiServer(HTTP_PORT);
    try {
      await server.start();
      const token = signSessionToken({
        userId: HTTP_USER,
        personId: `per-${RUN}`,
        email: `inbox+${RUN}@vmnl.ng`,
        roles: ["OperationsManager"],
      });
      const page = await getFromServer(
        "/workspace/notifications",
        `vmnl_session=${token.accessToken}`
      );

      expect(page.statusCode, "an authenticated operator must get the inbox, not a redirect").toBe(200);
      expect(page.body, "the row a previous process wrote must be on the page").toContain(
        "Encoder failover engaged"
      );
      expect(page.body).toContain("1 unread");
      expect(page.body, "the route the notification points at").not.toContain("No notifications");

      // Opening the page is a write: the read stamp must have drained, so a
      // restart cannot bring the item back as new.
      const stored = await getPrismaClient().inAppNotificationRecord.findUnique({ where: { id } });
      expect(stored?.readAt, "the read stamp must be durable, not page-local").not.toBeNull();
    } finally {
      await server.stop();
    }
  });
});
