/**
 * TSK-11 box 6 follow-up measurement: the SERVED broadcast screen census.
 *
 * `tests/unit/broadcast-provenance-coverage.test.ts` measures the renderer with
 * no engine snapshot; this measures what an operator actually receives once the
 * route injects `buildScreenEngineSnapshot(context)`. Run against the compiled
 * artifact (`pnpm build`) with DATABASE_URL in the environment, so the engines
 * hold whatever the durable stores hydrate at boot.
 *
 * Usage: node docs/audit/evidence/tsk11-served-screen-engine-snapshot-2026-10-12/measure-served-census.mjs
 * Prints one line per screen plus the two census totals. Nothing is asserted here
 * — the assertions live in the suite; this file produces the figures the register
 * quotes (Rule 0.2).
 */

// The `x-test-role` header is honoured only while NODE_ENV is `test`
// (src/api/router.ts:730), and the router reads it from the process at request
// time, so it has to be set here rather than passed to the factory.
process.env.NODE_ENV = "test";

const { createApiServer } = await import("../../../../dist/src/api/server.js");
const { BROADCAST_SCREEN_INVENTORY } = await import(
  "../../../../dist/src/modules/broadcast/screens/index.js"
);
const nodeHttp = await import("node:http");
const { Buffer } = await import("node:buffer");

const server = createApiServer(0);
await server.start();
const port = server.server.address().port;

function get(pathname, role) {
  return new Promise((resolve, reject) => {
    const req = nodeHttp.get(
      { host: "127.0.0.1", port, path: pathname, headers: { "x-test-role": role } },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") })
        );
      }
    );
    req.on("error", reject);
    req.end();
  });
}

let unsourced = 0;
let engineSourced = 0;
const rows = [];
for (const screen of BROADCAST_SCREEN_INVENTORY) {
  const pathname = screen.route.replace(":date", "2026-03-30").replace(":id", "PRG-001");
  const res = await get(pathname, screen.primaryRole);
  const hasBadge = /(NOT CONNECTED|PROVISIONAL)/.test(res.body);
  const hasSource = res.body.includes("SOURCE:");
  if (hasBadge) unsourced += 1;
  if (hasSource) engineSourced += 1;
  rows.push(
    `${screen.screenId} ${res.status} ${hasBadge ? "UNSOURCED-BADGE" : "no-unsourced-badge"}` +
      ` ${hasSource ? "DOMAIN_ENGINE" : "no-source-badge"}  ${screen.route}`
  );
}

console.log(rows.join("\n"));
console.log(`\nSERVED census over ${BROADCAST_SCREEN_INVENTORY.length} screens:`);
console.log(`  screens still showing a NOT_CONNECTED/PROVISIONAL badge : ${unsourced}`);
console.log(`  screens serving at least one DOMAIN_ENGINE SOURCE: badge : ${engineSourced}`);

try {
  await server.stop();
} catch (err) {
  console.error(`stop: ${err}`);
}
// The measurement is on stdout; the server's keep-alive handles would otherwise
// hold the process open after the census prints.
process.exit(0);
