// TSK-42 / TSK-50 scratch measurement: production bundle, identity encoding, 3 samples.
// Mirrors docs/audit/performance-budgets.md procedure steps 1-2.
import http from "node:http";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";

// Run from the repository root after `pnpm build`; the compiled bundle is resolved from cwd.
const dist = (p) => pathToFileURL(`${process.cwd()}/${p}`).href;

const { createApiServer } = await import(dist("dist/src/api/server.js"));
const { signSessionToken } = await import(dist("dist/src/core/auth/index.js"));

const app = createApiServer(0);
await app.start();
const port = app.server.address().port;
const auth = {
  Authorization: `Bearer ${signSessionToken({
    userId: "usr-perf",
    personId: "per-perf",
    email: "perf@vmnl.ng",
    roles: ["SuperAdmin"],
  }).accessToken}`,
};

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const t0 = process.hrtime.bigint();
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: "GET", headers: { "Accept-Encoding": "identity", ...headers } },
      (res) => {
        const chunks = [];
        let ttfb = null;
        res.on("data", (c) => {
          if (ttfb === null) ttfb = Number(process.hrtime.bigint() - t0) / 1e6;
          chunks.push(c);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          resolve({ status: res.statusCode, bytes: body.length, ttfb, type: String(res.headers["content-type"] ?? ""), body });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error(`timeout ${path}`)));
    req.end();
  });
}

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

const SURFACES = [
  ["public shell /", "/", {}],
  ["public shell /channels/nxtr", "/channels/nxtr", {}],
  ["critical HTML SCR-BCST-01", "/broadcast/dashboard", auth],
  ["operational screen SCR-BCST-23 (403 as SuperAdmin)", "/broadcast/playout/live", auth],
  ["shipped stylesheet", "/assets/styles.css", {}],
];

for (const [label, path, headers] of SURFACES) {
  const runs = [];
  for (let i = 0; i < 3; i++) runs.push(await get(path, headers));
  const r = runs[0];
  console.log(
    label.padEnd(30),
    String(r.status).padStart(3),
    "bytes", String(median(runs.map((x) => x.bytes))).padStart(7),
    "gzip", String(zlib.gzipSync(r.body, { level: 9 }).length).padStart(6),
    "ttfb_ms", median(runs.map((x) => Math.round(x.ttfb))).toString().padStart(5),
    "|", r.type.slice(0, 30)
  );
}

// combined transfer for one operational screen view: HTML + stylesheet + app.js
const html = await get("/broadcast/dashboard", auth);
const css = await get("/assets/styles.css", {});
const js = await get("/assets/app.js", {});
console.log("operational screen view total (identity):", html.bytes + css.bytes + js.bytes, "bytes");
console.log("operational screen view total (gzip):", zlib.gzipSync(html.body, { level: 9 }).length + zlib.gzipSync(css.body, { level: 9 }).length + zlib.gzipSync(js.body, { level: 9 }).length, "bytes");

app.server.close();
process.exit(0);
