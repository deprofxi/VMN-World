/**
 * VMN World IA R1.1 — the J23 states a *deployment* declares.
 *
 * Of the eleven public edge states, only EDGE-001 was produced by a handler when
 * this module was written (the final 404), and the Azeebo+ gateway states its
 * unverified destination through its own screen (STW-011) rather than EDGE-028's
 * row. The rest are owned by a decision software cannot infer — whether a page
 * has been permanently withdrawn, whether the public surface is closed, whether
 * the corporate brand has launched — or by a stored record's own state
 * (`QUARANTINED`), or by the inventory's data class (age-restricted casting).
 *
 * This module is the single place those declarations live, so one configured
 * fact drives both the HTTP status and the rendered contract:
 *
 *   EDGE-002  410  `PUBLIC_WITHDRAWN_PATHS=/old-page,/another`
 *   EDGE-003  503  `FF_PUBLIC_SURFACE_ENABLED=false` — the flag's own documented
 *                  kill-switch policy: "Displays maintenance notice; cached
 *                  portfolio remains accessible."
 *   EDGE-005  200  `/offline` — the document clients fall back to. The state
 *                  itself is client-side; this tree ships no service worker, so
 *                  the page states the guidance and claims no offline caching.
 *   EDGE-023  201  media-asset registration whose scan failed; the asset stays
 *                  `QUARANTINED` and the response carries the contract.
 *   EDGE-029  401  the age gate on `RESTRICTED_CASTING` inventory.
 *   EDGE-031  200  `PUBLIC_CORPORATE_LAUNCHED=false` on the corporate home.
 *
 * Nothing here invents authority: every state, contract and acceptance ID is
 * read from the inventory, and an operator has to declare the state before it
 * is reachable. An undeclared state stays unreachable rather than guessed.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { isFeatureEnabled } from "../../core/feature-flags/index.js";
import { escapeHtml } from "../components/index.js";
import { getIAScreen } from "./index.js";
import { renderIAEdgeState } from "./edge-states.js";

/** The inventory contract a state's handlers and clients quote. */
export interface PublicEdgeContract {
  id: string;
  acceptanceId: string;
  title: string;
  /** What the platform may say happened, in the inventory's own words. */
  message: string;
  recoveryRoute: string;
}

/**
 * Paths that stay up while the public surface is closed. Operators have to be
 * able to sign in, read readiness, and open their desks; assets and APIs keep
 * serving so the notice itself renders and the platform's own clients work.
 */
const SURFACE_EXEMPT_PATHS: ReadonlySet<string> = new Set([
  "/offline",
  "/healthz",
  "/readyz",
  "/sign-in",
  "/login",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/robots.txt",
]);

const SURFACE_EXEMPT_PREFIXES: readonly string[] = [
  "/assets/",
  "/api/",
  "/workspace",
  "/admin",
  "/account",
  "/portal/",
  "/broadcast",
];

export interface DeclaredOperatingState {
  /** The public surface is closed (EDGE-003). */
  readonly maintenance: boolean;
  /** Paths declared permanently withdrawn (EDGE-002), normalised. */
  readonly withdrawnPaths: ReadonlySet<string>;
  /** The corporate brand may present itself publicly (EDGE-031 when false). */
  readonly corporateLaunched: boolean;
}

function normalisePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return "";
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
}

/**
 * Read the deployment's declared state. Configuration only — no request data,
 * no record, no inference.
 */
export function declaredOperatingState(env: NodeJS.ProcessEnv = process.env): DeclaredOperatingState {
  const withdrawnPaths = new Set<string>();
  for (const entry of String(env.PUBLIC_WITHDRAWN_PATHS ?? "").split(",")) {
    const path = normalisePath(entry);
    if (path) withdrawnPaths.add(path);
  }
  return {
    maintenance: !isFeatureEnabled("FF_PUBLIC_SURFACE_ENABLED"),
    withdrawnPaths,
    corporateLaunched: String(env.PUBLIC_CORPORATE_LAUNCHED ?? "true").trim().toLowerCase() !== "false",
  };
}

/** True for the paths the maintenance window must leave serving. */
export function isSurfaceExempt(pathname: string): boolean {
  if (SURFACE_EXEMPT_PATHS.has(pathname)) return true;
  return SURFACE_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)
  );
}

/** The registry's contract for one edge state, or undefined if it is not an EDGE row. */
export function publicEdgeContract(edgeId: string): PublicEdgeContract | undefined {
  const state = getIAScreen(edgeId);
  if (!state || state.journeyCode !== "EDGE") return undefined;
  return {
    id: state.id,
    acceptanceId: state.acceptanceId,
    title: state.screenName,
    message: state.entryTrigger,
    recoveryRoute: state.recoveryRoute,
  };
}

export type PublicOperatingStateReason = "WITHDRAWN" | "MAINTENANCE";

export interface PublicOperatingState {
  reason: PublicOperatingStateReason;
  status: 410 | 503;
  contract: PublicEdgeContract;
  /** Response headers this state requires beyond the HTML choke point's own. */
  headers: Record<string, string>;
}

/**
 * The transport-level public state for a path, if the deployment declares one.
 * `undefined` means the path is served normally.
 */
export function publicOperatingStateFor(
  pathname: string,
  env: NodeJS.ProcessEnv = process.env
): PublicOperatingState | undefined {
  if (isSurfaceExempt(pathname)) return undefined;
  const state = declaredOperatingState(env);
  const path = normalisePath(pathname) || "/";

  // The most specific true statement wins: a withdrawn page stays withdrawn.
  if (state.withdrawnPaths.has(path)) {
    const contract = publicEdgeContract("EDGE-002");
    if (contract) {
      return {
        reason: "WITHDRAWN",
        status: 410,
        contract,
        headers: {},
      };
    }
  }

  if (state.maintenance) {
    const contract = publicEdgeContract("EDGE-003");
    if (contract) {
      const retrySeconds = Number(String(env.PUBLIC_MAINTENANCE_RETRY_SECONDS ?? "").trim());
      return {
        reason: "MAINTENANCE",
        status: 503,
        contract,
        headers: {
          // 503 is explicitly retryable; say when, instead of leaving clients
          // to poll blindly.
          "Retry-After": String(Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : 600),
        },
      };
    }
  }

  return undefined;
}

/**
 * The `/offline` document (EDGE-005). The page is cacheable and reachable while
 * the public surface is closed, so a disconnected visitor who can still load it
 * reads the truthful state: nothing is being submitted, and no offline caching
 * is claimed by this deployment.
 */
export function renderOfflineBody(): string {
  return [
    renderIAEdgeState("EDGE-005"),
    `<section class="container">
    <div class="card">
      <h2>While this page is shown</h2>
      <p>Nothing you type is sent. Keep any work in a local document, reconnect, then submit it once
      the connection answers.</p>
      <p>
        <a class="btn btn-primary" href="/">Corporate home</a>
        <a class="btn btn-outline" href="/sitemap">What is published</a>
      </p>
    </div>
  </section>`,
  ].join("\n");
}
export function renderOperatingStateBody(state: PublicOperatingState, pathname: string): string {
  const actionHref = state.reason === "MAINTENANCE" ? pathname : "/";
  const actionLabel = state.reason === "MAINTENANCE" ? "Try again" : "Corporate home";
  const secondaryHref = state.reason === "MAINTENANCE" ? "/offline" : "/sitemap";
  const secondaryLabel = state.reason === "MAINTENANCE" ? "Save what you are doing" : "What is published";

  return [
    renderIAEdgeState(state.contract.id),
    `<section class="container">
    <div class="card">
      <h2>What to do now</h2>
      <p>${escapeHtml(state.contract.recoveryRoute)}</p>
      <p>
        <a class="btn btn-primary" href="${escapeHtml(actionHref)}">${actionLabel}</a>
        <a class="btn btn-outline" href="${secondaryHref}">${secondaryLabel}</a>
      </p>
    </div>
  </section>`,
  ].join("\n");
}
