import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = readFileSync(".env", "utf8");
const url = /DATABASE_URL=(.+)/.exec(env)[1].replaceAll('"', "").split("?")[0];
const pool = new pg.Pool({ connectionString: url, max: 2 });
pool.on("error", () => {});

const fk = await pool.query(
  `select conname from pg_constraint where conrelid = '"AuditLog"'::regclass and contype = 'f'`);
const cols = await pool.query(
  `select column_name, is_nullable from information_schema.columns
     where table_name = 'AuditLog' order by ordinal_position`);
const idx = await pool.query(
  `select indexname from pg_indexes where tablename = 'AuditLog' order by indexname`);
const counts = await pool.query(
  `select count(*)::int as total,
          count(*) filter (where "userId" is null)::int as actor_null,
          count(*) filter (where "tenantId" is not null)::int as scoped,
          count(*) filter (where "changesJson" ? 'auditHashPayload')::int as with_payload
     from "AuditLog"`);

// read createdAt as text so the driver's timezone coercion cannot distort it
const { rows } = await pool.query(
  `select id, "userId", "tenantId", action,
          to_char("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as created_utc,
          "changesJson"->>'auditHashPayload' as payload,
          "changesJson"->>'auditEntryHash' as hash,
          "changesJson"->>'auditTimestamp' as event_ts
     from "AuditLog" where "changesJson" ? 'auditHashPayload' order by "createdAt" asc`);

let recomputable = 0, eventTime = 0, nineComponents = 0, tenantComponent = 0;
for (const r of rows) {
  if (crypto.createHash("sha256").update(r.payload).digest("hex") === r.hash) recomputable++;
  if (r.event_ts && r.created_utc === new Date(r.event_ts).toISOString()) eventTime++;
  const parts = r.payload.split("|");
  if (parts.length === 9) nineComponents++;
  if ((r.tenantId || "") === parts[6]) tenantComponent++;
}
console.log(JSON.stringify({
  foreignKeysOnAuditLog: fk.rows.map((x) => x.conname),
  columns: cols.rows.map((x) => `${x.column_name}${x.is_nullable === "YES" ? "?" : ""}`).join(" "),
  indexes: idx.rows.map((x) => x.indexname),
  ...counts.rows[0],
  rowsWithStoredHashPayload: rows.length,
  recomputableFromOwnColumns: recomputable,
  createdAtEqualsEventTimestamp: eventTime,
  nineComponentPayloads: nineComponents,
  tenantColumnMatchesPayloadComponent6: tenantComponent,
  sample: rows.slice(-2).map((r) => ({ id: r.id.slice(0, 8), action: r.action, userId: r.userId, tenantId: r.tenantId, created_utc: r.created_utc, event_ts: r.event_ts })),
}, null, 2));
await pool.end();
