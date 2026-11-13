/**
 * VMN World IA R1.1 — route resolution and gate enforcement.
 *
 * The inventory's route patterns are canonical (plan decision D1). Resolution
 * happens after the security headers, session resolution and mutation guards,
 * and before the page handlers, so an IA route cannot bypass authorization.
 *
 * Gate semantics implemented here (plan decision D3):
 *   W0        anonymous read.
 *   W1–W4, G  authenticated read. An anonymous request receives 401 with a safe
 *             denial page; the surface itself still renders no record, because
 *             the inventories' role IDs have no authoritative mapping onto this
 *             deployment's EnterpriseRole set yet. Inventing that mapping would
 *             be a business decision, so role-scoped 403 is not claimed here.
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import type { SessionUser } from "../../core/auth/index.js";
import { resolveIARoute, type IARouteMatch } from "../../web/ia/index.js";
import { renderIAPublicPage } from "../../web/ia/journey-pub.js";
import { renderIAContractScreen, renderIADenialScreen } from "../../web/ia/render.js";
import type { IAScreen } from "../../web/ia/types.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { sendHtml } from "../router.js";
import type { RouteContext } from "./types.js";

/**
 * Paths the existing platform chain owns. `/sign-in` also appears in the
 * inventory (AUTH journey); the identity shell, MFA challenge and session
 * handling must keep serving it, so IA never shadows it.
 */
export const IA_PLATFORM_OWNED_ROUTES: ReadonlySet<string> = new Set(["/sign-in", "/login"]);

export type IAAccess = "PUBLIC" | "AUTHENTICATED" | "SESSION_REQUIRED";

/** The gate the inventory declares, evaluated against the request's session. */
export function evaluateIAAccess(screen: IAScreen, user: SessionUser | null): IAAccess {
  if (screen.gate === "W0") return "PUBLIC";
  return user ? "AUTHENTICATED" : "SESSION_REQUIRED";
}

export interface IARenderedResponse {
  status: 200 | 401;
  title: string;
  screen: IAScreen;
  html: string;
}

/**
 * Render an IA screen for a resolved request. Pure apart from layout rendering,
 * so the gate matrix and the rendered contracts are testable without HTTP.
 */
export function renderIAResponse(
  match: IARouteMatch,
  options: {
    pathname: string;
    user: SessionUser | null;
    query: URLSearchParams;
  }
): IARenderedResponse {
  const { screen } = match;
  const access = evaluateIAAccess(screen, options.user);
  const title = `${screen.screenName} | VMNL`;

  if (access === "SESSION_REQUIRED") {
    return {
      status: 401,
      title,
      screen,
      html: renderMasterLayout(title, renderIADenialScreen(screen, options.pathname, 401), options.pathname, {
        shell: "identity",
        sessionUser: null,
      }),
    };
  }

  const body =
    access === "PUBLIC"
      ? renderIAPublicPage(screen, {
          params: match.params,
          query: options.query,
          pathname: options.pathname,
        })
      : renderIAContractScreen(screen);

  return {
    status: 200,
    title,
    screen,
    html: renderMasterLayout(title, body, options.pathname, {
      sessionUser: options.user,
      description: screen.primaryAction,
    }),
  };
}

/**
 * Resolve and serve an IA route. Returns true when the request was answered.
 * Unknown paths return false so the existing 404 chain stays in charge.
 */
export async function dispatchIARoute(ctx: RouteContext): Promise<boolean> {
  if (ctx.method !== "GET") return false;
  if (IA_PLATFORM_OWNED_ROUTES.has(ctx.pathname)) return false;

  const match = resolveIARoute(ctx.pathname);
  if (!match) return false;

  const rendered = renderIAResponse(match, {
    pathname: ctx.pathname,
    user: ctx.user,
    query: ctx.parsedUrl.searchParams,
  });

  await sendHtml(ctx.res, rendered.status, rendered.html, {
    // AUD-19: a response rendered for a session is private even on a public
    // screen, because the shell personalises navigation for that session.
    private: Boolean(ctx.user) || rendered.status !== 200 || rendered.screen.gate !== "W0",
  });
  return true;
}
