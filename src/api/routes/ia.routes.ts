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
 * The LEAD wizards add the plan's one sanctioned mutation path: an HTML form
 * submission recorded through the existing commercial-enquiry contract, which
 * 303-redirects to the receipt page. The request is recorded; no decision is
 * made by the UI (canonical law 13).
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 */

import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { SessionUser } from "../../core/auth/index.js";
import { issueCsrfToken, csrfCookieHeader } from "../../core/websecurity/index.js";
import { submitCommercialEnquiry } from "../../modules/hub/enquiry/index.js";
import { escapeHtml } from "../../web/components/index.js";
import { getIAScreen, resolveIARoute, getIAScreenRequiredRule, type IARouteMatch } from "../../web/ia/index.js";
import { canPerform, accessContextFor, type AccessContext } from "../../core/rbac/index.js";
import { recordAuditLog } from "../../core/audit/index.js";
import { renderIAProvenance } from "../../web/ia/render.js";
import { renderIAPublicBodyFor } from "../../web/ia/public-bodies.js";
import { renderIAGatedBodyFor } from "../../web/ia/gated-bodies.js";
import { renderWizardBody, getWizardIntent, type IAWizardFormValues } from "../../web/ia/journey-lead.js";
import { renderIAAgeRestrictedDenial, renderIADenialScreen } from "../../web/ia/render.js";
import { renderIAEdgeState } from "../../web/ia/edge-states.js";
import { declaredOperatingState } from "../../web/ia/operating-states.js";
import type { IAScreen } from "../../web/ia/types.js";
import { renderMasterLayout } from "../../web/public/dashboard.js";
import { readFormBodyStash, sendHtml } from "../router.js";
import { flushDurableJournal } from "../../core/database/durable-journal.js";
import { RepositoryUnavailableError } from "../../core/database/repository-mode.js";
import type { RouteContext } from "./types.js";

/**
 * Paths the existing platform chain owns. `/sign-in` also appears in the
 * inventory (AUTH journey); the identity shell, MFA challenge and session
 * handling must keep serving it, so IA never shadows it.
 */
export const IA_PLATFORM_OWNED_ROUTES: ReadonlySet<string> = new Set(["/sign-in", "/login"]);

/** The one IA-owned form endpoint (not itself a registry route). */
const IA_WIZARD_SUBMIT_PATH = "/work-with-vmn/submit";

export type IAAccess = "PUBLIC" | "AUTHENTICATED" | "SESSION_REQUIRED" | "FORBIDDEN";

/** The gate the inventory declares, evaluated against the request's session and Wave 1 role mapping. */
export function evaluateIAAccess(
  screen: IAScreen,
  user: SessionUser | null,
  context?: AccessContext
): IAAccess {
  if (screen.gate === "W0") return "PUBLIC";
  if (!user) return "SESSION_REQUIRED";

  const rule = getIAScreenRequiredRule(screen.id);
  if (rule) {
    if (!canPerform(user, rule.action, rule.resource, context)) {
      return "FORBIDDEN";
    }
  }

  return "AUTHENTICATED";
}

/**
 * True when the path resolves to an inventory screen whose gate is W0. The
 * operator-desk default-deny consults this so a public inventory route under
 * `/workspace` (LEARN-001) is served as the authority declares instead of
 * being redirected to sign-in.
 */
export function isPublicIARoute(pathname: string): boolean {
  const match = resolveIARoute(pathname);
  return match !== undefined && match.screen.gate === "W0";
}

export interface IARenderedResponse {
  status: 200 | 401 | 403;
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
    csrfToken?: string;
    context?: AccessContext;
  }
): IARenderedResponse {
  const { screen } = match;
  const access = evaluateIAAccess(screen, options.user, options.context);
  const title = `${screen.screenName} | VMNL`;

  // EDGE-031: whether the corporate brand may present itself publicly is a
  // deployment declaration, not something a page can infer. Until the operator
  // declares the launch, the corporate home states that instead of making a
  // claim the company has not made. (PUB-001 is the one screen the inventory
  // names as the corporate brand's own surface.)
  if (screen.id === "PUB-001" && !declaredOperatingState().corporateLaunched) {
    return {
      status: 200,
      title,
      screen,
      html: renderMasterLayout(
        title,
        [
          renderIAEdgeState("EDGE-031"),
          `<section class="container"><div class="card">
      <h2>What is published meanwhile</h2>
      <p>The inventory of this site is readable even while the brand state is withheld.</p>
      <a class="btn btn-outline" href="/sitemap">What is published</a>
    </div></section>`,
        ].join("\n"),
        options.pathname,
        { sessionUser: options.user }
      ),
    };
  }

  if (access === "SESSION_REQUIRED") {
    // EDGE-029: restricted casting inventory is age-gated, so a denied request
    // is answered with that state instead of the generic session denial. The
    // gate's own outcome is unchanged — only the state the visitor is told.
    const denial =
      screen.dataClass === "RESTRICTED_CASTING"
        ? renderIAAgeRestrictedDenial(screen, options.pathname)
        : renderIADenialScreen(screen, options.pathname, 401);
    return {
      status: 401,
      title,
      screen,
      html: renderMasterLayout(title, denial, options.pathname, {
        shell: "identity",
        sessionUser: null,
      }),
    };
  }

  if (access === "FORBIDDEN") {
    const denial = renderIADenialScreen(screen, options.pathname, 403);
    return {
      status: 403,
      title,
      screen,
      html: renderMasterLayout(title, denial, options.pathname, {
        shell: "work",
        sessionUser: options.user,
      }),
    };
  }

  const body =
    access === "PUBLIC"
      ? renderIAPublicBodyFor(screen, {
          params: match.params,
          query: options.query,
          pathname: options.pathname,
          csrfToken: options.csrfToken,
        })
      : renderIAGatedBodyFor(screen, {
          // The session is known here: the gate above returned SESSION_REQUIRED
          // for every gated screen without one.
          user: options.user!,
          params: match.params,
          query: options.query,
          pathname: options.pathname,
        });

  return {
    status: 200,
    title,
    screen,
    html: renderMasterLayout(title, body, options.pathname, {
      sessionUser: options.user,
      description: screen.primaryAction,
      // A `W1`–`W4` screen is work, not marketing: it renders in the shell the
      // operator works in. The AUTH journey is the exception, because its
      // screens are the account's own identity surfaces (plan §4).
      shell: access === "PUBLIC" ? undefined : gatedShell(screen),
    }),
  };
}

/** The presentation shell a gated screen renders in. */
export function gatedShell(screen: IAScreen): "work" | "identity" {
  return screen.id.startsWith("AUTH-") ? "identity" : "work";
}

/* -------------------------------------------------------------------------
 * LEAD wizard submission — record the request, then show its receipt
 * ---------------------------------------------------------------------- */

interface IAWizardSubmitOutcome {
  status: 303 | 422;
  location?: string;
  html?: string;
}

/**
 * Validate the form the way the existing contract does (the same domain
 * service `POST /api/v1/enquiries` calls), record it, and redirect to the
 * receipt. A failed validation re-renders the wizard with the visitor's own
 * values preserved and a truthful "nothing was recorded" summary.
 */
export async function submitWizardForm(
  req: IncomingMessage,
  body: URLSearchParams
): Promise<IAWizardSubmitOutcome> {
  const screenId = String(body.get("wizardScreenId") || "");
  const screen = resolveIARoute(wizardRoute(screenId))?.screen;
  if (!screen || !getWizardIntent(screenId)) {
    return { status: 422, html: wizardErrorPage("Unknown enquiry intent", "The wizard that produced this submission is not one this site publishes.") };
  }

  const values: IAWizardFormValues = {
    fullName: str(body, "fullName"),
    email: str(body, "email"),
    phone: str(body, "phone"),
    organisationName: str(body, "organisationName"),
    message: str(body, "message"),
  };

  // Idempotency: identical content from the same intent deduplicates to the
  // same case reference, so an accidental double submit or a retry after a
  // network failure cannot create two requests for one intent.
  const idempotencyKey = createHash("sha256")
    .update(`${screenId}|${values.fullName}|${values.email}|${values.message}`)
    .digest("hex")
    .slice(0, 64);

  try {
    const result = await submitCommercialEnquiry(
      {
        fullName: values.fullName ?? "",
        email: values.email ?? "",
        phone: values.phone || undefined,
        organisationName: values.organisationName || undefined,
        vertical: getWizardIntent(screenId)!.vertical,
        message: messageWithIntent(screen, values.message ?? ""),
        ndprConsent: body.get("ndprConsent") === "true",
        idempotencyKey,
      },
      clientIpFrom(req)
    );
    return { status: 303, location: `/enquiries/${encodeURIComponent(result.enquiry.reference)}/receipt` };
  } catch (err) {
    const error = err as { field?: string; message?: string };
    const fieldErrors: Record<string, string> = {};
    if (error.field) fieldErrors[error.field] = error.message ?? "This field needs attention.";
    else fieldErrors.message = error.message ?? "The request could not be recorded.";
    const html = renderMasterLayout(
      `${screen.screenName} | VMNL`,
      [
        renderWizardBody(screen, {
          values,
          errors: {
            fullName: fieldErrors.fullName,
            email: fieldErrors.email,
            message: fieldErrors.message,
            ndprConsent: fieldErrors.ndprConsent,
          },
        }),
        '<div class="sr-only" aria-hidden="true">',
        renderIAProvenance(screen),
        "</div>",
      ].join("\n"),
      screen.route,
      { sessionUser: null }
    );
    return { status: 422, html };
  }
}

function str(body: URLSearchParams, name: string): string {
  return String(body.get(name) || "").trim();
}

function messageWithIntent(screen: IAScreen, message: string): string {
  return `[Intent: ${screen.id} · ${screen.screenName}] ${message}`;
}

function wizardRoute(screenId: string): string {
  // The wizard screens' own routes are static; resolving through the registry
  // keeps the submit handler bound to the authority rather than to literals.
  return getIAScreen(screenId)?.route ?? "/work-with-vmn";
}

function clientIpFrom(req: IncomingMessage): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? undefined;
}

function wizardErrorPage(title: string, detail: string): string {
  return `
  <article class="container">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(detail)}</p>
    <a class="btn btn-primary" href="/work-with-vmn">Work with VMN</a>
  </article>`.trim();
}

/**
 * Resolve and serve an IA route. Returns true when the request was answered.
 * Unknown paths return false so the existing 404 chain stays in charge.
 */
export async function dispatchIARoute(ctx: RouteContext): Promise<boolean> {
  if (IA_PLATFORM_OWNED_ROUTES.has(ctx.pathname)) return false;

  // The sanctioned form endpoint. GETs to it are not an inventory route and
  // fall through to the 404 chain.
  if (ctx.method === "POST" && ctx.pathname === IA_WIZARD_SUBMIT_PATH) {
    return dispatchWizardSubmit(ctx);
  }
  if (ctx.method !== "GET") return false;

  const match = resolveIARoute(ctx.pathname);
  if (!match) return false;

  // A signed-in visitor submitting a wizard form needs a double-submit token;
  // anonymous visitors intentionally need none (platform CSRF rule).
  let csrfToken: string | undefined;
  if (ctx.user && isWizardScreen(match.screen)) {
    csrfToken = issueCsrfToken();
    ctx.res.setHeader("Set-Cookie", csrfCookieHeader(csrfToken));
  }

  const accessContext = ctx.user ? accessContextFor(ctx.user, ctx.req.headers) : undefined;

  const rendered = renderIAResponse(match, {
    pathname: ctx.pathname,
    user: ctx.user,
    query: ctx.parsedUrl.searchParams,
    csrfToken,
    context: accessContext,
  });

  if (rendered.status === 403 && ctx.user) {
    const rule = getIAScreenRequiredRule(match.screen.id);
    recordAuditLog({
      userId: ctx.user.userId,
      action: "access.rbac.denied",
      resource: rule ? rule.resource : "audit",
      resourceId: match.screen.id,
      changes: {
        screenId: match.screen.id,
        assertedRule: rule ? `${rule.action}:${rule.resource}` : undefined,
        userRoles: ctx.user.roles,
        pathname: ctx.pathname,
      },
    });
  }

  await sendHtml(ctx.res, rendered.status, rendered.html, {
    // AUD-19: a response rendered for a session is private even on a public
    // screen, because the shell personalises navigation for that session.
    private: Boolean(ctx.user) || rendered.status !== 200 || rendered.screen.gate !== "W0",
  });
  return true;
}

function isWizardScreen(screen: IAScreen): boolean {
  return getWizardIntent(screen.id) !== undefined;
}

async function dispatchWizardSubmit(ctx: RouteContext): Promise<boolean> {
  const contentType = String(ctx.req.headers["content-type"] || "");
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    await sendHtml(
      ctx.res,
      422,
      renderMasterLayout(
        "Unsupported submission | VMNL",
        wizardErrorPage("Unsupported submission", "This form accepts URL-encoded form submissions only."),
        ctx.pathname
      ),
      { private: true }
    );
    return true;
  }

  const raw = await readFormBodyStash(ctx.req);
  const outcome = await submitWizardForm(ctx.req, new URLSearchParams(raw));

  if (outcome.status === 303 && outcome.location) {
    // The 303 would otherwise be written with raw `writeHead`, bypassing the
    // `sendHtml` durability choke point: the receipt the visitor is redirected
    // to could name a case whose rows are still staged — or were just rolled
    // back. Drain here, before the first byte leaves, and fail closed: a
    // rejected drain answers a truthful 503 instead of a receipt for an
    // enquiry the database refused. (The server's `finally` backstop still
    // re-drains harmlessly; nothing is left staged after either outcome.)
    try {
      await flushDurableJournal();
    } catch (err) {
      if (err instanceof RepositoryUnavailableError) {
        await sendHtml(
          ctx.res,
          503,
          renderMasterLayout(
            "Submission not recorded | VMNL",
            wizardErrorPage(
              "Submission not recorded",
              "The persistence layer rejected this submission (fail-closed), so no enquiry was filed and no case reference exists. Nothing was recorded. Please try again shortly."
            ),
            ctx.pathname
          ),
          { private: true }
        );
        return true;
      }
      throw err;
    }
    ctx.res.writeHead(303, { Location: outcome.location });
    ctx.res.end();
    return true;
  }

  await sendHtml(ctx.res, outcome.status, outcome.html ?? "", { private: true });
  return true;
}
