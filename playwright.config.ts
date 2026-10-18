/**
 * Real-browser verification — PR-26 / TSK-45 (`HD-10`).
 *
 * Until this file existed the accessibility claim rested entirely on HTML-string
 * assertions: `@playwright/test` and `@axe-core/playwright` were installed and
 * both binaries were present in `node_modules/.bin`, but the repository held zero
 * `*.spec.ts` files and no Playwright config, so no browser had ever run in this
 * suite's history (`docs/audit/production-readiness-deepcheck-2026-10-16.md`
 * PR-26). `pnpm test:a11y` still runs the Vitest HTML-shape suites, which measure
 * bytes, not rendering.
 *
 * This config drives the **built** server (`dist/src/index.js`) rather than an
 * in-test fixture, because three of the defects this suite found are invisible to
 * markup inspection and depend on the real interface:
 *
 *   - `color-contrast` needs a real stylesheet, a real viewport and a real
 *     computed background;
 *   - `target-size` needs layout;
 *   - a missing or unserved `/assets/styles.css` silently degrades every page to
 *     unstyled HTML, which makes an accessibility run pass for the wrong reason.
 *     `tests/browser/rendering.spec.ts` guards exactly that.
 *
 * `reuseExistingServer: false` is deliberate: an earlier probe run measured a
 * *stale* server still holding the port and reported the old markup. A suite that
 * can bind to an unknown process is not evidence.
 */

import { defineConfig } from "@playwright/test";

/** Not the application default (3000/5599): a suite must not silently attach to a dev server. */
const PORT = Number(process.env.VMNL_BROWSER_PORT ?? 5611);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "coverage/browser-report" }]]
    : [["list"]],
  outputDir: "coverage/browser-artifacts",
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "node dist/src/index.js",
    url: `${BASE_URL}/healthz`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // test mode keeps the sandbox-safe defaults (no production secrets needed)
      // while still serving the real master layout, stylesheet and client bundle.
      NODE_ENV: "test",
      PORT: String(PORT),
    },
  },
});
