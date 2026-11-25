/**
 * Deployment-artifact parity — PR-19, PR-20, PR-21, PR-23.
 *
 * Authority: `VMNL-AZP-VMN-CCPP-001` §21 (deployment) / §19 (observability);
 * evidence and required fixes: `docs/audit/production-readiness-deepcheck-2026-10-16.md`.
 *
 * These artifacts cannot be *executed* on a developer host without Docker, so
 * each assertion below states a property the pre-fix files demonstrably failed:
 *
 * - PR-19 — no `prisma generate`, `pnpm-lock.yaml*` glob, prod-only install with
 *   no generated client carried into the runtime stage, healthcheck on
 *   `/healthz`.
 * - PR-20 — no `cap_drop`/`no-new-privileges`/resource limits anywhere, and
 *   MinIO credentials as literal fallbacks while their siblings were `:?`.
 * - PR-21 — `prometheus.yml` declared no `rule_files`, so no rule was ever
 *   evaluated; and it labelled the sandbox `environment: "production"`.
 * - PR-23 — no `engines`, no `.nvmrc`, and CI pinned `node-version: 22` by
 *   literal while the image said `node:22-alpine`.
 *
 * Source-scan assertions are chosen deliberately: the container/compose/rules
 * files are configuration, so the failing property is a property of the file.
 * What this file cannot prove is that the result *runs* — that is recorded as
 * still open on a Docker host, not claimed here.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (relative: string): string => readFileSync(path.join(ROOT, relative), "utf8");

/**
 * The artifact without its prose. The remediation comments in these files name
 * the defects they fix (a removed glob, a removed literal, a removed literal
 * version), and those mentions must not register as the defect itself — the
 * assertion is about what the file instructs, not about what it explains.
 */
const stripComments = (text: string): string =>
  text
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .map((line) => line.replace(/\s+#.*$/, ""))
    .join("\n");

function walkSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) walkSources(p, out);
    else if (entry.endsWith(".ts")) out.push(p);
  }
  return out;
}

/** Metric names recorded anywhere in `src/` via `recordMetric("name", …)`. */
function publishedMetricNames(): Set<string> {
  const names = new Set<string>();
  for (const file of walkSources(path.join(ROOT, "src"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/recordMetric\(\s*"([a-z0-9_]+)"/g)) names.add(match[1]);
  }
  return names;
}

/** Identifiers that are not PromQL functions, aggregators or keywords. */
const PROMQL_NON_METRICS = new Set([
  "delta", "increase", "rate", "irate", "idelta", "sum", "avg", "max", "min", "count",
  "abs", "ceil", "floor", "round", "by", "without", "on", "ignoring", "group_left",
  "group_right", "bool", "offset", "and", "or", "unless",
  // Non-metric identifiers this rules file legitimately names in annotations.
  "severity", "summary", "runbook", "critical", "warning",
]);

/**
 * The metric names an expression reads. Durations (`[15m]`) and label selectors
 * (`{job="x"}`) are stripped first, so what remains is the function/identifier
 * vocabulary of the expression.
 */
function metricNamesIn(expression: string): string[] {
  const stripped = expression.replace(/\[[^\]]*\]/g, "").replace(/\{[^}]*\}/g, "");
  const tokens = stripped.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  return tokens.filter((token) => !PROMQL_NON_METRICS.has(token));
}

interface ServiceBlock {
  name: string;
  body: string;
}

/** The service bodies of docker-compose.yml, keyed by service name. */
function composeServices(): ServiceBlock[] {
  const lines = read("docker-compose.yml").split("\n");
  const blocks: ServiceBlock[] = [];
  let inServices = false;
  let current: ServiceBlock | null = null;
  for (const line of lines) {
    if (/^services:\s*$/.test(line)) {
      inServices = true;
      continue;
    }
    if (/^[A-Za-z]/.test(line) && /\S/.test(line)) {
      inServices = false;
      continue;
    }
    if (!inServices) continue;
    const header = /^ {2}([a-z0-9-]+):\s*$/.exec(line);
    if (header) {
      current = { name: header[1], body: "" };
      blocks.push(current);
      continue;
    }
    if (current) current.body += `${line}\n`;
  }
  return blocks;
}

describe("PR-21: the shipped alert rules are real, mounted and readable", () => {
  const rules = read("prometheus.rules.yml");
  const prometheus = read("prometheus.yml");
  const runbook = read("docs/runbooks/observability.md");

  const alertNames = [...rules.matchAll(/^\s*-\s*alert:\s*([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
  const exprs = [...rules.matchAll(/^\s*expr:\s*(.+)$/gm)].map((m) => m[1].trim());

  it("is loaded and mounted rather than documented", () => {
    // Anchored: the 2026-10-18 mutation probe commented `rule_files:` out and
    // the previous unanchored `/rule_files:/` still matched the commented
    // literal, so a disabled rule mount passed this gate. A key that YAML would
    // not read must not satisfy an assertion about what YAML reads.
    expect(prometheus).toMatch(/^rule_files:/m);
    expect(prometheus).toMatch(/^\s*-\s*\/etc\/prometheus\/prometheus\.rules\.yml/m);
    const prometheusService = composeServices().find((s) => s.name === "prometheus");
    expect(prometheusService, "the prometheus service must exist in compose").toBeDefined();
    const usesBindMount = /\.\/prometheus\.rules\.yml:\/etc\/prometheus\/prometheus\.rules\.yml:ro/.test(
      prometheusService?.body ?? "",
    );
    const usesImageBuild =
      /docker\/prometheus\/Dockerfile/.test(prometheusService?.body ?? "") &&
      /COPY\s+prometheus\.rules\.yml\s+\/etc\/prometheus\/prometheus\.rules\.yml/.test(
        read("docker/prometheus/Dockerfile"),
      );
    expect(usesBindMount || usesImageBuild, "prometheus must include /etc/prometheus/prometheus.rules.yml").toBe(true);
  });

  it("does not label the local sandbox stack as production", () => {
    // A label that lies makes every environment-filtered dashboard and alert
    // silent or wrong. The compose stack is the sandbox; production labels come
    // from the deployment's own scrape config.
    expect(prometheus).not.toMatch(/environment:\s*"production"/);
    expect(prometheus).toMatch(/environment:\s*"sandbox"/);
  });

  it("names no metric the application does not publish", () => {
    const published = publishedMetricNames();
    expect(published.size).toBeGreaterThan(10); // anti-vacuity on the scan itself

    const unknown: string[] = [];
    for (const expr of exprs) {
      for (const metric of metricNamesIn(expr)) {
        if (!published.has(metric)) unknown.push(`${metric} — in expr: ${expr}`);
      }
    }
    // A rule for a series nothing emits can never fire. Shipping one is the
    // PR-14 failure mode (a switch nothing reads) in the monitoring layer.
    expect(unknown, `rules reference metrics this codebase never records:\n${unknown.join("\n")}`).toEqual([]);
  });

  it("keeps the runbook and the shipped file from drifting apart", () => {
    expect(alertNames.length).toBeGreaterThan(0);
    const undocumented = alertNames.filter((name) => !new RegExp(`\\\`${name}\\\``).test(runbook));
    expect(undocumented, `alerts shipped but absent from docs/runbooks/observability.md:\n${undocumented.join("\n")}`).toEqual([]);
  });
});

describe("PR-20: compose applies a hardening baseline to every service", () => {
  const services = composeServices();

  it("parses every expected service (anti-vacuity for the scans below)", () => {
    // A new service must be added here deliberately, which is the point: the
    // finding was that hardening was applied nowhere, service by service.
    expect(services.map((s) => s.name).sort()).toEqual([
      "app",
      "minio",
      "postgres",
      "postgres-backup",
      "prometheus",
      "redis",
    ]);
    expect(read("docker-compose.yml")).toMatch(/x-hardening-full: &hardening-full/);
    expect(read("docker-compose.yml")).toMatch(/x-hardening-init: &hardening-init/);
  });

  it("merges a hardening anchor into every service", () => {
    const unhardened = services.filter((s) => !/<<: \*hardening-(full|init)/.test(s.body)).map((s) => s.name);
    expect(unhardened, `services with no hardening anchor: ${unhardened.join(", ")}`).toEqual([]);
  });

  it("drops all capabilities where the image needs none", () => {
    for (const name of ["app", "prometheus"]) {
      const service = services.find((s) => s.name === name)!;
      expect(service.body, `${name} must drop all capabilities`).toMatch(/<<: \*hardening-full/);
    }
    const compose = read("docker-compose.yml");
    expect(compose).toMatch(/cap_drop:\s*\n\s*- ALL/);
    expect(compose).toMatch(/no-new-privileges:true/);
  });

  it("gives every service a CPU and memory limit", () => {
    const unlimited = services
      .filter((s) => !/\n {4}deploy:\n {6}resources:\n {8}limits:\n {10}cpus:/.test(s.body) || !/memory:/.test(s.body))
      .map((s) => s.name);
    expect(unlimited, `services with no resource limits: ${unlimited.join(", ")}`).toEqual([]);
  });

  it("holds no literal object-store credential", () => {
    const compose = stripComments(read("docker-compose.yml"));
    // The pre-fix file had `MINIO_ROOT_USER=minioadmin` and
    // `STORAGE_SECRET_KEY:?` siblings defaulting to `minioadmin_secure_key`,
    // while .env.example shipped `minioadmin` — three sources, two answers.
    expect(compose).not.toMatch(/minioadmin/);
    expect(compose).toMatch(/MINIO_ROOT_USER=\$\{(?:STORAGE_ACCESS_KEY:\?|SERVICE_USER_MINIO)/);
    expect(compose).toMatch(/MINIO_ROOT_PASSWORD=\$\{(?:STORAGE_SECRET_KEY:\?|SERVICE_PASSWORD_MINIO)/);
    expect(compose).toMatch(/STORAGE_SECRET_KEY=\$\{(?:STORAGE_SECRET_KEY:\?|SERVICE_PASSWORD_MINIO)/);
  });

  it("keeps the sandbox credentials documented in .env.example", () => {
    // Required variables are only usable if the example file defines them.
    const example = read(".env.example");
    expect(example).toMatch(/^STORAGE_ACCESS_KEY=/m);
    expect(example).toMatch(/^STORAGE_SECRET_KEY=/m);
  });
});

describe("PR-19: the image is reproducible and answers readiness", () => {
  const dockerfile = stripComments(read("Dockerfile"));

  it("generates the Prisma client during the build", () => {
    expect(dockerfile).toMatch(/pnpm exec prisma generate/);
  });

  it("installs from a hard lockfile copy, never a glob", () => {
    expect(dockerfile).not.toMatch(/pnpm-lock\.yaml\*/);
    expect(dockerfile).toMatch(/^COPY package\.json pnpm-lock\.yaml /m);
  });

  it("carries the generated client into the runtime stage", () => {
    // The runner installs prod-only, so it cannot regenerate the client itself.
    expect(dockerfile).toMatch(/COPY --from=builder \/app\/node_modules\/\.prisma/);
  });

  it("probes readiness, not liveness", () => {
    expect(dockerfile).toMatch(/HEALTHCHECK[\s\S]*\/readyz/);
    expect(dockerfile).not.toMatch(/HEALTHCHECK[\s\S]*\/healthz/);
  });
});

describe("PR-23: one runtime version across local, CI and the image", () => {
  const nvmrc = read(".nvmrc").trim();
  const pkg = JSON.parse(read("package.json")) as { engines?: { node?: string } };
  const dockerfile = stripComments(read("Dockerfile"));
  const ci = stripComments(read(".github/workflows/ci.yml"));

  it("pins the same major in all four places", () => {
    expect(nvmrc).toMatch(/^\d+$/);
    expect(pkg.engines?.node, "package.json must declare engines.node").toMatch(new RegExp(`>=${nvmrc}`));
    const fromLines = [...dockerfile.matchAll(/^FROM node:(\d+)/gm)].map((m) => m[1]);
    expect(fromLines.length).toBeGreaterThan(0);
    expect(new Set(fromLines)).toEqual(new Set([nvmrc]));
    expect(ci).toMatch(/node-version-file:\s*\.nvmrc/);
    expect(ci, "CI must not restate the version as a literal").not.toMatch(/node-version:\s*\d+/);
  });
});
