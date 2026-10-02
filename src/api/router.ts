/**
 * VMNL Enterprise Unified API Router & Request Dispatcher
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §19, §21
 */

import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { TelemetryService } from "../core/observability/index.js";
import { getAllActiveChannels, getChannelByCode } from "../modules/broadcast/channels/index.js";
import { BROADCAST_SCREEN_INVENTORY } from "../modules/broadcast/screens/index.js";
import { reconcileAsRunLogs, getProofOfAirCertificate } from "../modules/broadcast/asrun/index.js";
import { TalentAcceleratorRegistry } from "../modules/hub/talent/index.js";
import { AfcaAcademyService } from "../modules/hub/afca/index.js";
import { FusionEventsEngine } from "../modules/hub/events/index.js";
import { VirtualTalentManagementEngine } from "../modules/hub/vtm/index.js";
import { projectVtmPaymentVisibility, renderVtmPaymentVisibilityHtml } from "../web/portal/vtm-payment-visibility.js";
import { HeadspaceKnowledgeEngine } from "../modules/intelligence/headspace/index.js";
import { Cr8TechCreativeEngine } from "../modules/intelligence/cr8tech/index.js";
import { AgenticOperatingSystem } from "../modules/intelligence/aos/index.js";
import { AzeeboFederationBridge } from "../modules/federation/azeebo/bridge.js";
import { AzeeboLinkGateway } from "../modules/federation/azeebo/links.js";
import { QuoteToCashSalesEngine } from "../modules/finance/sales/index.js";
import { TalentPayoutEngine } from "../modules/finance/payouts/index.js";
import { BankReconciliationEngine } from "../modules/finance/reconciliation/index.js";
import { PaymentGatewayWebhookValidator, Mt940Parser } from "../modules/finance/reconciliation/mt940.js";
import { ReleaseGatePipeline } from "../modules/quality/gates.js";
import {
  signSessionToken,
  verifySessionToken,
  revokeToken,
  checkRateLimit,
  createSessionCookie,
  authenticateUser,
  SessionUser,
} from "../core/auth/index.js";
import { RepositoryUnavailableError } from "../core/database/repository-mode.js";
import { getConfig } from "../core/config/index.js";
import {
  canPerform,
  EnterpriseAction,
  EnterpriseResource,
  ROLE_PERMISSIONS,
} from "../core/rbac/index.js";
import {
  renderMasterLayout,
  renderHomePageHtml,
  renderChannelsPageHtml,
  renderHubPageHtml,
  renderDashboardHtml,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderChannelDetailPageHtml,
  renderPublicProgrammeDetailHtml,
  renderTalentAcceleratorPageHtml,
  renderAfcaAcademyPageHtml,
  renderCreatorsGatewayPageHtml,
  renderCommunityPresencePageHtml,
  renderVtmMarketplacePageHtml,
  renderProductionPageHtml,
  renderEventsPageHtml,
  renderTechnologyPageHtml,
  renderDistributionPageHtml,
  renderPartnersPageHtml,
  renderInsightsPageHtml,
  renderCareersPageHtml,
  renderAzeeboGatewayPageHtml,
  renderWorkspaceDirectoryHtml,
  renderWorkspaceDeskHtml,
  renderFederationGatewayHtml,
  renderUniverseResolverHtml,
  renderAttributionConsoleHtml,
  renderAfcaVerificationHtml,
  renderPoaVerificationHtml,
  matchBroadcastScreen,
  renderBroadcastScreenHtml,
  isRoleAuthorizedForScreen,
  ENTERPRISE_WORKSPACES,
  renderStyleguideHtml,
  renderPrototypesViewerHtml,
  PrototypeScreenId,
  PrototypeScenario,
  PrototypeDevice,
  renderVcfPageHtml,
  renderOneStudiosPageHtml,
  renderAboutPageHtml,
  renderPublicScheduleHtml,
  renderAdvertisingSponsorshipHtml,
  renderEnquiryContactHtml,
  renderHelpPageHtml,
  renderPrivacyPageHtml,
  renderAccessibilityPageHtml,
  renderAdmissionsApplicationHtml,
  renderApplicationStatusHtml,
  renderAdmissionsQueueHtml,
  renderAfcaLearnerDashboardHtml,
  renderAfcaGradebookHtml,
  renderVtmTermsReviewHtml,
  renderVtmMarketplaceHtml,
  renderClientProjectsListHtml,
  renderClientProjectDetailHtml,
  MOCK_CLIENT_PROJECTS,
  renderBroadcastScheduleReviewHtml,
  renderRightsReviewRequestHtml,
  renderPoaExceptionsWorkbenchHtml,
  renderContentReviewAndPublicationHtml,
  renderApprovalReviewHtml,
  renderProposalBuilderHtml,
  renderQuoteReviewHtml,
  CommercialProposalStore,
  renderLearningPlanHtml,
  renderAssignmentSubmissionHtml,
  renderFacultyGradingRubricHtml,
  renderCertificateGeneratorHtml,
  renderTalentAcceleratorDeskHtml,
  renderCommunityGuildsDeskHtml,
  renderVtmMatchingWorkbenchHtml,
  renderOneStudiosProductionDeskHtml,
  renderVcfCreatorMissionsHtml,
  renderFusionEventsDeskHtml,
  renderTendRightsDistributionHtml,
  renderHeadspaceIntelligenceHtml,
  renderCr8TechOperationsHtml,
  renderAgenticOsConsoleHtml,
  renderPartnerPortalHtml,
  renderCreatorPortalHtml,
  renderVendorPortalHtml,
  renderManagementOverviewHtml,
  renderRiskRegisterHtml,
  renderIssueTrackerHtml,
  HubShowcaseService,
  HubVertical,
  escapeHtml,
  renderIcon,
} from "../web/index.js";
import { VMN_FAVICON_SVG, VMN_OG_IMAGE_SVG } from "../web/assets/index.js";
import { OPENAPI_SPEC, renderDocsHtml } from "./docs.js";
import { getScreenDescriptorById as getScreenDescriptor } from "../modules/broadcast/screens/index.js";
import { CANONICAL_STYLESHEET } from "../web/styles/index.js";
import {
  renderSignInHtml,
  renderMfaStepUpHtml,
  renderAccountRecoveryHtml,
  renderWorkspaceSelectionHtml,
  renderAccessDeniedHtml,
  renderAccessRequestHtml,
  renderAccountSettingsHtml,
  renderInvitationAcceptanceHtml,
  renderFirstUseProfileHtml,
  renderSessionExpiredHtml,
  renderNotificationPreferencesHtml,
  renderActiveSessionsHtml,
  renderContextualHelpHtml,
  SANDBOX_PERSONAS,
} from "../web/public/auth-screens.js";

// Todo register remediation domain modules (TODO-SEC-01..05, TODO-SCR-01..11,
// TODO-FIN-01/02/05/06, TODO-BCST-02/04/05).
import {
  acceptInvitation,
  createInvitation,
} from "../core/auth/invitations.js";
import {
  enrollMfaSecret,
  getMfaSecret,
  verifyStepUpCode,
  requestAccountRecovery,
} from "../core/auth/mfa.js";
import {
  registerSession,
  listSessions,
  revokeSessionById,
  revokeAllSessions,
  computeSessionId,
  markTokenIdRevoked,
  isTokenIdRevoked,
  getNotificationPreferences,
  saveNotificationPreferences,
  saveFirstUseProfile,
  listInAppNotifications,
  markInAppNotificationsRead,
} from "../core/auth/sessions.js";
import {
  createApproval,
  decideApproval,
  listAllApprovals,
  reviseApprovalObject,
} from "../core/approvals/index.js";
import {
  createContent,
  getContent,
  editContent,
  submitForReview,
  requestChanges,
  approveRevision,
  publishContent,
  withdrawContent,
} from "../core/content/index.js";
import {
  openCase,
  getCase,
  listCasesForOwner,
  assignCase,
  transitionCase,
  canReadCase,
  CaseType,
  CaseStatus,
} from "../core/cases/index.js";
import {
  issueCsrfToken,
  verifyFormCsrf,
  extractCsrfFromForm,
  csrfCookieHeader,
  CSRF_COOKIE_NAME,
  checkIdempotency,
  recordIdempotentOutcome,
} from "../core/websecurity/index.js";
import {
  aggregateMyWork,
  registerWorkTaskSource,
  authorisedSearch,
  indexSearchRecord,
  createRisk,
  listRisks,
  createIssue,
  listIssues,
  transitionIssue,
} from "../core/work/index.js";
import {
  registerDestination,
  revokeDestination,
  isVerifiedDestination,
  listDestinations,
  setRoutingRule,
  listRoutingRules,
  deactivateRoutingRule,
} from "../core/federation/destinations.js";
import { exportXmltv, pushToStarTimes } from "../modules/broadcast/export/epg.js";
import { getScreenData, renderScreenKpis, renderMockDataBanner } from "../modules/broadcast/screens/data.js";
import { registerVersion, markReadyForAir } from "../modules/broadcast/versions/index.js";
import {
  renderMyWorkHtml,
  renderSearchResultsHtml,
  renderNotificationsHtml,
} from "../web/workspace/work-hub.js";
import {
  renderGovernanceRecordsHtml,
  GovernanceRecordsPageData,
} from "../web/workspace/governance-registers.js";

import { EnterpriseQueueWorker } from "../core/queue/index.js";
import { TalentRepository } from "../core/database/repositories/talent.repository.js";
import { NotificationService } from "../core/notifications/index.js";
import { checkDatabaseConnection } from "../core/database/index.js";
import {
  checkStorageReady,
  generatePresignedUploadUrl,
  validateMediaBuffer,
  MAX_SCAN_BUFFER_BYTES,
  registerMediaAsset,
  listApprovedMediaAssets,
} from "../core/storage/index.js";
import {
  recordAuditLog,
  getAuditLogs,
  verifyAuditLogChainIntegrity,
} from "../core/audit/index.js";
import {
  getAllFeatureFlags,
  getFeatureFlagState,
  setFeatureFlagOverride,
  FeatureFlagKey,
  assertFeatureEnabled,
} from "../core/feature-flags/index.js";
import { renderAdminFeatureFlagsHtml } from "../web/public/admin-feature-flags.js";
import { projectAccessMatrix, renderAccessAdminConsoleHtml, renderSourceMappingsConsoleHtml } from "../web/workspace/admin-consoles.js";
import { projectMediaPicker, renderMediaPickerHtml } from "../web/workspace/media-picker.js";
import { projectContentEditorForm, renderContentEditorFormHtml } from "../web/workspace/content-editor.js";
import { listAllSessions } from "../core/auth/sessions.js";
import {
  submitCommercialEnquiry,
  recoverEnquiryOutcome,
  getEnquiryByReference,
  listEnquiries,
  retryDownstreamRouting,
} from "../modules/hub/enquiry/index.js";
import { AfcaAdmissionsService } from "../modules/hub/afca/admissions.js";

// Domain Modules (T9-05 Runtime Wiring)
import { VirtualContentFundEngine } from "../modules/hub/vcf/index.js";
import { OneStudiosEngine } from "../modules/hub/onestudios/index.js";
import { TendDistributionEngine } from "../modules/hub/tend/index.js";
import { AfroFusionCommunityHub } from "../modules/hub/community/index.js";
import { validateBroadcastMasterQc } from "../modules/broadcast/programmes/index.js";
import { validateDailySchedule, ScheduleSlot } from "../modules/broadcast/scheduling/index.js";
import { BroadcastRightsGate, validateScheduleRights } from "../modules/broadcast/rights/index.js";
import { BroadcastTrafficEngine, validateCommercialBreak } from "../modules/broadcast/traffic/index.js";
import { PlayoutAutomationEngine, insertEmergencyFiller } from "../modules/broadcast/playout/index.js";
import { SponsorshipEngine } from "../modules/broadcast/sponsorship/index.js";
import { CarriageMonitoringEngine, recordTransmissionOutage } from "../modules/broadcast/carriage/index.js";
import { BroadcastBillingEngine } from "../modules/broadcast/billing/index.js";
import { PlayoutExportEngine } from "../modules/broadcast/export/index.js";

export interface RequestHandlerContext {
  telemetry: TelemetryService;
  azeeboBridge: AzeeboFederationBridge;
  azeeboLinks: AzeeboLinkGateway;
  talentRegistry: TalentAcceleratorRegistry;
  afcaService: AfcaAcademyService;
  eventsEngine: FusionEventsEngine;
  vtmEngine: VirtualTalentManagementEngine;
  headspace: HeadspaceKnowledgeEngine;
  cr8tech: Cr8TechCreativeEngine;
  aos: AgenticOperatingSystem;
  salesEngine: QuoteToCashSalesEngine;
  payoutEngine: TalentPayoutEngine;
  bankRecon: BankReconciliationEngine;
  /** SCR-17: canonical proposal store bound to the Quote-to-Cash engine. */
  proposalStore?: CommercialProposalStore;
  queueWorker?: EnterpriseQueueWorker;
  talentRepository?: TalentRepository;
  notificationService?: NotificationService;
  // Domain services (T9-05)
  vcfEngine?: VirtualContentFundEngine;
  oneStudios?: OneStudiosEngine;
  tendEngine?: TendDistributionEngine;
  communityHub?: AfroFusionCommunityHub;
  rightsGate?: BroadcastRightsGate;
  trafficEngine?: BroadcastTrafficEngine;
  playoutEngine?: PlayoutAutomationEngine;
  sponsorshipEngine?: SponsorshipEngine;
  carriageEngine?: CarriageMonitoringEngine;
  billingEngine?: BroadcastBillingEngine;
  exportEngine?: PlayoutExportEngine;
}

export class PayloadTooLargeError extends Error {
  public readonly code = "PAYLOAD_TOO_LARGE";
  public readonly status = 413;
  constructor(limitBytes: number) {
    super(`Request body exceeds the maximum allowed size of ${limitBytes} bytes`);
    this.name = "PayloadTooLargeError";
  }
}

const DEFAULT_MAX_BODY_BYTES = 1 * 1024 * 1024; // 1 MB (AUD-10)
const LARGE_BODY_ROUTES: Array<{ prefix: string; limitBytes: number }> = [
  { prefix: "/api/v1/storage/scan", limitBytes: 30 * 1024 * 1024 }, // base64 of the 20MB scan cap
];

export function maxBodyBytesForPath(pathname: string): number {
  const match = LARGE_BODY_ROUTES.find((r) => pathname.startsWith(r.prefix));
  return match ? match.limitBytes : DEFAULT_MAX_BODY_BYTES;
}

function readBodyWithLimit(req: IncomingMessage, limitBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > limitBytes) {
        reject(new PayloadTooLargeError(limitBytes));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", (err) => reject(err));
  });
}

export async function parseRawBody(req: IncomingMessage, pathname = ""): Promise<string> {
  // CSRF pre-read stash (SEC-11): the body may already have been buffered for
  // token verification; consume it once instead of re-reading the stream.
  const stash = (req as IncomingMessage & { __vmnlFormBodyStash?: string }).__vmnlFormBodyStash;
  if (stash !== undefined) {
    (req as IncomingMessage & { __vmnlFormBodyStash?: string }).__vmnlFormBodyStash = undefined;
    return stash;
  }
  return readBodyWithLimit(req, maxBodyBytesForPath(pathname));
}

/**
 * Buffers a form body once for the CSRF pre-read and stashes it on the
 * request object so the route handler can consume it via parseRawBody.
 */
async function stashFormBody(req: IncomingMessage): Promise<string> {
  const stashKey = "__vmnlFormBodyStash" as const;
  const reqAny = req as IncomingMessage & { [stashKey]?: string };
  if (reqAny[stashKey] !== undefined) return reqAny[stashKey];
  const body = await readBodyWithLimit(req, maxBodyBytesForPath(""));
  reqAny[stashKey] = body;
  return body;
}

export async function parseJsonBody(req: IncomingMessage, pathname = ""): Promise<any> {
  const body = await readBodyWithLimit(req, maxBodyBytesForPath(pathname));
  if (!body.trim()) {
    return {};
  }
  try {
    return JSON.parse(body);
  } catch (_err) {
    throw new Error("Invalid JSON body payload", { cause: _err });
  }
}

export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function sendText(res: ServerResponse, statusCode: number, text: string, contentType = "text/plain"): void {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

import crypto from "node:crypto";

/**
 * Sends HTML with conditional-GET semantics (AUD-20): weak ETag derived from
 * the body hash, If-None-Match revalidation (304), and must-revalidate
 * caching. Rendered pages are dynamic; long caching would risk stale
 * operational surfaces, so revalidation keeps repeat visits cheap without
 * staleness. The stylesheet asset itself is immutable-cached separately.
 */
export function sendHtml(res: ServerResponse, statusCode: number, html: string): void {
  const etag = `W/"${crypto.createHash("sha1").update(html).digest("base64url")}"`;
  const ifNoneMatch = res.req?.headers["if-none-match"];
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  if (ifNoneMatch && ifNoneMatch === etag && statusCode === 200) {
    res.writeHead(304);
    res.end();
    return;
  }
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

export function resolveSessionUser(req: IncomingMessage): SessionUser | null {
  const authHeader = req.headers["authorization"];
  let token: string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.headers["cookie"]) {
    const match = (req.headers["cookie"] as string).match(/vmnl_session=([^;]+)/);
    if (match) token = match[1];
  }
  if (token) {
    try {
      return verifySessionToken(token);
    } catch {
      return null;
    }
  }

  // Test role override strictly allowed ONLY in test environment (CR-2)
  if (process.env.NODE_ENV === "test" && req.headers["x-test-role"]) {
    const roles = (req.headers["x-test-role"] as string).split(",").map((r) => r.trim());
    return {
      userId: "test-user-id",
      personId: "test-person-id",
      email: "test@vmnl.ng",
      roles,
    };
  }

  // Developer bypass permitted ONLY when explicitly enabled via AUTH_BYPASS_ENABLED=true in development environment (CR-2)
  if (process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_ENABLED === "true") {
    return {
      userId: "dev-sandbox-superadmin",
      personId: "per-sandbox-superadmin",
      email: "admin@vmnl.ng",
      roles: ["SuperAdmin"],
    };
  }

  return null;
}

export function assertRoutePermission(
  req: IncomingMessage,
  res: ServerResponse,
  action: EnterpriseAction,
  resource: EnterpriseResource
): SessionUser | null {
  const user = resolveSessionUser(req);
  if (!user) {
    sendJson(res, 401, {
      error: "Unauthorized",
      message: "Authentication token required for mutating enterprise endpoint",
      code: "AUTH_TOKEN_REQUIRED",
    });
    return null;
  }

  const allowed = canPerform(user, action, resource);
  if (!allowed) {
    sendJson(res, 403, {
      error: "Forbidden",
      message: `User '${user.email}' with roles [${user.roles.join(", ")}] lacks required permission '${action}:${resource}'`,
      code: "INSUFFICIENT_PERMISSIONS",
    });
    return null;
  }

  return user;
}

/**
 * Declarative route-authorization table (AUD-01). Every mutating enterprise
 * route declares the action+resource required; enforcement loops through this
 * table so a new route cannot "forget" its guard. `/api/v1/quality/gates` is
 * deliberately absent: CI and the human release pipeline evaluate gates with
 * system identity, and the route records the caller when one is presented.
 */
export const ROUTE_GUARDS: Array<{
  pathname: string;
  method: string;
  action: EnterpriseAction;
  resource: EnterpriseResource;
}> = [
  // Broadcast domain
  { pathname: "/api/v1/broadcast/asrun/reconcile", method: "POST", action: "update", resource: "broadcast" },
  { pathname: "/api/v1/broadcast/programmes/qc", method: "POST", action: "create", resource: "broadcast" },
  { pathname: "/api/v1/broadcast/scheduling/validate", method: "POST", action: "update", resource: "schedule" },
  { pathname: "/api/v1/broadcast/rights/validate", method: "POST", action: "update", resource: "rights" },
  { pathname: "/api/v1/broadcast/traffic/breaks/validate", method: "POST", action: "create", resource: "traffic" },
  { pathname: "/api/v1/broadcast/playout/filler", method: "POST", action: "execute", resource: "playout" },
  { pathname: "/api/v1/broadcast/sponsorship/log", method: "POST", action: "create", resource: "traffic" },
  { pathname: "/api/v1/broadcast/carriage/incidents", method: "POST", action: "update", resource: "broadcast" },
  { pathname: "/api/v1/broadcast/billing/calculate", method: "POST", action: "create", resource: "finance" },
  { pathname: "/api/v1/broadcast/export/smpte", method: "POST", action: "read", resource: "broadcast" },
  { pathname: "/api/v1/broadcast/export/bxf", method: "POST", action: "read", resource: "broadcast" },
  // Hub domain
  { pathname: "/api/v1/hub/talent/onboard", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/hub/afca/certify", method: "POST", action: "create", resource: "academy" },
  { pathname: "/api/v1/hub/afca/grades", method: "POST", action: "create", resource: "academy" },
  { pathname: "/api/v1/hub/events/verify-ticket", method: "POST", action: "execute", resource: "talent" },
  { pathname: "/api/v1/hub/events/tickets/validate", method: "POST", action: "execute", resource: "talent" },
  { pathname: "/api/v1/hub/vtm/match", method: "POST", action: "read", resource: "talent" },
  { pathname: "/api/v1/hub/vcf/pitches", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/hub/vcf/waterfall", method: "POST", action: "read", resource: "finance" },
  { pathname: "/api/v1/hub/onestudios/bookings", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/hub/onestudios/callsheets", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/hub/tend/avails", method: "POST", action: "read", resource: "rights" },
  { pathname: "/api/v1/hub/tend/licenses", method: "POST", action: "create", resource: "rights" },
  { pathname: "/api/v1/hub/community/members", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/hub/community/bookings", method: "POST", action: "create", resource: "talent" },
  // Intelligence domain
  { pathname: "/api/v1/intelligence/headspace/search", method: "POST", action: "read", resource: "agent" },
  { pathname: "/api/v1/intelligence/headspace/query", method: "POST", action: "read", resource: "agent" },
  { pathname: "/api/v1/intelligence/cr8tech/subtitle", method: "POST", action: "create", resource: "agent" },
  { pathname: "/api/v1/intelligence/aos/execute", method: "POST", action: "execute", resource: "agent" },
  { pathname: "/api/v1/intelligence/aos/killswitch", method: "POST", action: "execute", resource: "agent" },
  // Federation domain (AUD-02)
  { pathname: "/api/v1/federation/azeebo/webhook", method: "POST", action: "execute", resource: "agent" },
  { pathname: "/api/v1/federation/azeebo/link", method: "POST", action: "create", resource: "agent" },
  { pathname: "/api/v1/federation/azeebo/links", method: "POST", action: "create", resource: "agent" },
  // Finance domain
  { pathname: "/api/v1/finance/deals", method: "POST", action: "create", resource: "contract" },
  { pathname: "/api/v1/finance/quotes/create", method: "POST", action: "create", resource: "contract" },
  { pathname: "/api/v1/finance/payouts/batch", method: "POST", action: "create", resource: "finance" },
  { pathname: "/api/v1/finance/reconcile/bank", method: "POST", action: "execute", resource: "finance" },
  { pathname: "/api/v1/finance/reconcile", method: "POST", action: "execute", resource: "finance" },
  // DAM storage (AUD-04)
  { pathname: "/api/v1/storage/upload-url", method: "POST", action: "create", resource: "storage" },
  { pathname: "/api/v1/storage/scan", method: "POST", action: "read", resource: "storage" },
  { pathname: "/api/v1/cms/media-assets", method: "POST", action: "create", resource: "storage" },
  { pathname: "/api/v1/cms/media-assets", method: "GET", action: "read", resource: "storage" },
  // Todo register remediation routes (SEC/SCR/FIN/BCST) — every mutating
  // enterprise endpoint declares its guard here (AUD-01 invariant).
  { pathname: "/api/v1/workspace/approvals", method: "POST", action: "create", resource: "contract" },
  // TODO-SCR-17: proposal creation mutates canonical deals. Quote acceptance
  // (/api/v1/commercial/proposals/:id/accept) is a dynamic path guarded
  // inline with assertRoutePermission(update:contract), per the established
  // pattern for parameterised routes.
  { pathname: "/api/v1/commercial/proposals", method: "POST", action: "create", resource: "contract" },
  { pathname: "/api/v1/workspace/content", method: "POST", action: "create", resource: "content" },
  { pathname: "/api/v1/workspace/content", method: "PUT", action: "update", resource: "content" },
  // SCR-03: editor form endpoints (HTML POST stand-ins for create/PUT).
  { pathname: "/api/v1/workspace/content-editor", method: "POST", action: "create", resource: "content" },
  { pathname: "/api/v1/workspace/content-editor/update", method: "POST", action: "update", resource: "content" },
  { pathname: "/api/v1/cases", method: "POST", action: "create", resource: "case" },
  { pathname: "/api/v1/federation/destinations", method: "POST", action: "create", resource: "agent" },
  { pathname: "/api/v1/broadcast/versions", method: "POST", action: "create", resource: "broadcast" },
  { pathname: "/api/v1/broadcast/epg/push-startimes", method: "POST", action: "execute", resource: "broadcast" },
  { pathname: "/api/v1/finance/mt940/ingest", method: "POST", action: "execute", resource: "finance" },
  // TODO-SCR-19: risk/issue register mutations. The per-issue transition
  // (/api/v1/workspace/governance/issues/:id/transition) is a dynamic path
  // guarded inline with assertRoutePermission(update:risk).
  { pathname: "/api/v1/workspace/governance/risks", method: "POST", action: "update", resource: "risk" },
  { pathname: "/api/v1/workspace/governance/issues", method: "POST", action: "update", resource: "risk" },
  // TODO-SCR-18: rewired desk mutations now write canonical engine records.
  { pathname: "/api/v1/workspace/accelerator/partners", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/workspace/community/sprints", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/workspace/vtm/cast", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/workspace/production/callsheet", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/workspace/vcf/missions", method: "POST", action: "create", resource: "talent" },
  { pathname: "/api/v1/workspace/events/scan", method: "POST", action: "execute", resource: "talent" },
  { pathname: "/api/v1/workspace/tend/license", method: "POST", action: "create", resource: "rights" },
  { pathname: "/api/v1/workspace/headspace/documents", method: "POST", action: "create", resource: "talent" },
];

/**
 * TODO-SEC-06: server-side authorization for restricted operator HTML
 * surfaces (workspace prefix → required roles). Enforced centrally in
 * handleApiRequest before any handler body runs; unauthenticated callers are
 * redirected to sign-in, unauthorised ones get 403 (UX-SYS-008).
 * Surfaces not listed remain behind authentication-optional feature-flag
 * gates and are not restricted by this table.
 */
export const WORKSPACE_HTML_GUARDS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/workspace/cases", roles: ["SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController"] },
  { prefix: "/workspace/executive", roles: ["SuperAdmin", "ExecutiveLeader"] },
  { prefix: "/workspace/governance/audit", roles: ["SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController"] },
  { prefix: "/workspace/admin", roles: ["SuperAdmin"] },
];

/**
 * TODO-FIN-06 / TODO-BCST-02: render the honest response for an action that
 * is blocked by a governance feature flag (e.g. payment release, rights
 * override). JSON callers get 403 FEATURE_DISABLED; form callers get a
 * redirect with the reason surfaced in the query string.
 */
function sendFeatureDisabled(res: ServerResponse, err: any, contentType: string, fallbackRedirect: string): void {
  const message = err?.message || "Feature disabled";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    res.writeHead(303, {
      Location: `${fallbackRedirect}?blocked=${encodeURIComponent(err?.flagKey || "FEATURE_FLAG")}`,
    });
    res.end();
    return;
  }
  sendJson(res, err?.statusCode || 403, {
    error: "Forbidden",
    message,
    code: err?.code || "FEATURE_DISABLED",
    flagKey: err?.flagKey,
  });
}

/**
 * TODO-SEC-07: client-portal organisation relationship resolution. Returns
 * what access the caller has to an org's client-portal records.
 *  - VMNL staff roles (and @vmnl.ng addresses) may view client portfolios —
 *    the access is audit-logged at the route.
 *  - External callers see ONLY organisations they hold a client relationship
 *    with (sandbox membership registry; production: Organisation relationship
 *    records on the canonical counterparty object).
 *  - Everyone else is FORBIDDEN. There is deliberately no fallback that
 *    renders another organisation's records.
 */
type ClientOrgRelationship = "STAFF_ACCESS" | "CLIENT_MEMBER" | "UNAUTHENTICATED" | "FORBIDDEN";

const SANDBOX_CLIENT_ORG_MEMBERS: Record<string, string[]> = {
  "org-dangote": ["audit@dangote.com", "procurement@dangote.com"],
};

const CLIENT_PORTAL_STAFF_ROLES = ["SuperAdmin", "ExecutiveLeader", "BroadcastDirector", "FinanceController"];

function getClientOrgRelationship(sessionUser: SessionUser | null, orgId: string): ClientOrgRelationship {
  if (!sessionUser) return "UNAUTHENTICATED";
  // Staff access is role-based ONLY — an email domain is never proof of a
  // staff relationship.
  if (sessionUser.roles.some((r) => CLIENT_PORTAL_STAFF_ROLES.includes(r))) return "STAFF_ACCESS";
  const email = sessionUser.email.toLowerCase();
  const members = SANDBOX_CLIENT_ORG_MEMBERS[orgId] || [];
  if (members.includes(email)) return "CLIENT_MEMBER";
  // Sandbox convenience: a client-org email domain match implies membership.
  const orgDomain = orgId.replace(/^org-/, "");
  if (orgDomain && email.endsWith(`@${orgDomain}.com`)) return "CLIENT_MEMBER";
  return "FORBIDDEN";
}

/**
 * Todo register work-graph seed (TODO-SCR-11): approvals queue feeds the My
 * Work aggregation. Registered once per process.
 */
registerWorkTaskSource({
  listTasks: (_userId, roles) => {
    const decisionRoles = ["SuperAdmin", "ExecutiveLeader", "FinanceController", "HeadOfBroadcast"];
    if (!roles.some((r) => decisionRoles.includes(r))) return [];
    return listAllApprovals()
      .filter((a) => a.status === "PENDING")
      .map((a) => ({
        id: `approval:${a.id}`,
        domain: "APPROVALS" as const,
        title: a.subject,
        relatedRecordId: a.id,
        context: `${a.category} · ₦${a.financialScopeNgn.toLocaleString("en-NG")}`,
        state: a.status,
        reasonActionNeeded: a.requiresFourEyes ? "Four-eyes decision awaited" : "Decision awaited",
        route: "/workspace/approvals",
        priority: (a.financialScopeNgn >= 10_000_000 ? 1 : 2) as 1 | 2,
      }));
  },
});

/**
 * TODO-SCR-01/02 demo seed: one canonical content item ("Lagos Noir") in the
 * APPROVED state so the editorial review surface and publish journey exercise
 * the real CMS domain. Author differs from any live publisher so separation
 * of duties holds; the seed is labelled in the queue renderer.
 */
(function ensureContentDemoSeed(): void {
  if (getContent("CNT-LAGOS-201")) return;
  createContent({
    id: "CNT-LAGOS-201",
    title: "Lagos Noir — Season 1 Editorial Feature",
    slug: "lagos-noir-season-1",
    summary: "Editorial feature accompanying the Lagos Noir acquisition.",
    body: "Long-form editorial content for the public programme page.",
    relatedUnit: "S-CONTENT",
    claimSources: ["Acquisition contract ACQ-2026-118"],
    alternativeText: "Lagos Noir key art",
    authorId: "usr-editorial-demo",
  });
  submitForReview("CNT-LAGOS-201");
  approveRevision("CNT-LAGOS-201", "usr-content-approver-demo");
})();

export function resolveClientIp(req: IncomingMessage): string {
  // Identity for rate limiting and audit records (AUD-03). Only the first hop
  // of a comma-separated X-Forwarded-For chain is considered, and the header is
  // never trusted as the sole identity: without an explicit trusted-proxy
  // deployment contract, the socket address wins. Deployments behind a known
  // proxy should set TRUST_PROXY_HEADERS=true and configure TRUSTED_PROXY_HOPS.
  const socketIp = req.socket.remoteAddress || "127.0.0.1";
  const trustProxy = process.env.TRUST_PROXY_HEADERS === "true";
  if (!trustProxy) {
    return socketIp;
  }
  const forwarded = (req.headers["x-forwarded-for"] as string) || "";
  const hops = forwarded
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  const proxyHops = parseInt(process.env.TRUSTED_PROXY_HOPS || "1", 10);
  if (hops.length === 0) return socketIp;
  // Right-most untrusted hop: strip N trusted proxy entries from the end.
  const idx = hops.length - 1 - (Number.isFinite(proxyHops) && proxyHops > 0 ? proxyHops : 1);
  return idx >= 0 ? hops[idx]! : socketIp;
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  context: RequestHandlerContext
): Promise<void> {
  const reqStart = Date.now();
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || "GET";
  const span = TelemetryService.createSpanContext("api_router", req.headers["x-trace-id"] as string | undefined);
  const clientIp = resolveClientIp(req);

  // Set CORS headers validated against configured ALLOWED_ORIGINS (D-30)
  const origin = req.headers.origin as string | undefined;
  const CSRF_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5500,https://vmnl.ng,https://azeebo.plus")
    .split(",")
    .map((s) => s.trim());
  const allowedOrigins = CSRF_ALLOWED_ORIGINS;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "http://localhost:5500");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Trace-Id, X-Azeebo-Signature, X-Test-Role, X-Require-Auth"
  );

  // Mandatory HTTP Security Headers (T9-16, F-9-14)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';"
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Centralized route authorization (AUD-01): every guarded route resolves
    // its required action+resource from ROUTE_GUARDS before any handler body
    // runs, so authorization can no longer be forgotten per route. Adding a
    // new mutating route WITHOUT a guard entry fails the route-guard test.
    const routeGuard = ROUTE_GUARDS.find((g) => g.method === method && g.pathname === pathname);
    if (routeGuard) {
      const guardUser = assertRoutePermission(req, res, routeGuard.action, routeGuard.resource);
      if (!guardUser) return; // 401/403 response already sent
    }

    // TODO-SEC-11: CSRF protection on browser form mutations. Form POSTs
    // (urlencoded) must present the double-submit token pair; browsers that
    // send an Origin header must match the allow-list. JSON API mutations are
    // excluded — they are Authorization/RBAC-guarded and CORS-constrained.
    // GET and sign-in/logout form routes are exempt (no session mutation
    // surface / CSRF bootstrap ordering).
    if (method === "POST" && (req.headers["content-type"] || "").toString().includes("application/x-www-form-urlencoded")) {
      const exemptPrefixes = ["/sign-in", "/login", "/auth/mfa", "/sign-out", "/auth/recovery", "/access-request", "/auth/invitation"];
      const isExempt = exemptPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}?`) || pathname.startsWith(p));
      if (!isExempt) {
        const rawPreview = req.headers["content-length"] ? await stashFormBody(req) : "";
        const formToken = extractCsrfFromForm(rawPreview);
        const verdict = verifyFormCsrf({
          headers: req.headers as Record<string, unknown>,
          cookieHeader: req.headers.cookie,
          formToken,
          allowedOrigins: CSRF_ALLOWED_ORIGINS,
        });
        if (!verdict.ok) {
          const contentTypeHdr = (req.headers["content-type"] || "").toString();
          if (contentTypeHdr.includes("application/x-www-form-urlencoded")) {
            res.writeHead(403, { "Content-Type": "text/html; charset=utf-8" });
            res.end(
              `<html><body style="font-family: sans-serif; padding: 40px; text-align: center;"><h2>403 — Request blocked</h2><p>Form submission failed the CSRF integrity check (${verdict.reason}). Reload the page and try again.</p><a href="/">Return home</a></body></html>`
            );
          } else {
            sendJson(res, 403, { error: "Forbidden", code: "CSRF_CHECK_FAILED", reason: verdict.reason });
          }
          return;
        }
      }
    }

    // =========================================================================
    // TODO-SEC-06: server-side authorization on operator HTML surfaces.
    // "A visible control never constitutes permission" (UIUX-001 §9.1): the
    // WORKSPACE_HTML_GUARDS table below re-evaluates access server-side on
    // every protected workspace GET. Restricted governance surfaces (cases,
    // audit, executive) require real roles; general workspace desks stay
    // authenticated-access with the feature flags as the capability gate.
    // =========================================================================
    if (method === "GET" && (pathname.startsWith("/workspace/") || pathname === "/workspace")) {
      const user = resolveSessionUser(req);
      const restricted = WORKSPACE_HTML_GUARDS.find((g) => pathname.startsWith(g.prefix));
      if (restricted) {
        if (!user) {
          res.writeHead(302, { Location: `/sign-in?returnUrl=${encodeURIComponent(pathname)}` });
          res.end();
          return;
        }
        const allowed = user.roles.some((r) => restricted.roles.includes(r));
        if (!allowed) {
          const html = renderMasterLayout(
            `403 Forbidden - ${pathname}`,
            renderAccessDeniedHtml(user, restricted.roles.join(" / "), pathname),
            pathname,
            { shell: "identity", sessionUser: user }
          );
          sendHtml(res, 403, html);
          return;
        }
      }
    }

    // =========================================================================
    // S-IDENTITY Presentation Shell & UX-SYS-001 to 014 (J-RL1-02, R02, R16-17)
    // =========================================================================
    if ((pathname === "/sign-in" || pathname === "/login") && method === "GET") {
      const urlObj = new URL(req.url || "/", "http://localhost");
      const returnUrl = urlObj.searchParams.get("returnUrl") || undefined;
      const errorParam = urlObj.searchParams.get("error") || undefined;
      const signedOut = urlObj.searchParams.get("signed_out") === "true";
      const message = signedOut ? "You have been securely signed out." : undefined;
      const sessionUser = resolveSessionUser(req);

      const html = renderMasterLayout(
        "Sign In | VMNL Enterprise",
        renderSignInHtml({ returnUrl, error: errorParam, message }),
        "/sign-in",
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    if ((pathname === "/sign-in" || pathname === "/login") && method === "POST") {
      const contentType = req.headers["content-type"] || "";
      let body: any = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const raw = await parseRawBody(req, pathname);
        const params = new URLSearchParams(raw);
        body = Object.fromEntries(params.entries());
      } else {
        body = await parseJsonBody(req, pathname);
      }

      const clientIp = resolveClientIp(req);
      const returnUrl = (body.returnUrl && typeof body.returnUrl === "string" && body.returnUrl.startsWith("/") && !body.returnUrl.startsWith("//"))
        ? body.returnUrl
        : "/select-workspace";

      // 1. One-click Sandbox Persona Quick-Login
      if (body.quickPersona === "true" || body.quickPersona === true) {
        const persona = SANDBOX_PERSONAS.find(
          (p) => p.email.toLowerCase() === (body.email || "").toLowerCase().trim()
        );
        if (persona) {
          const user: SessionUser = {
            userId: `usr-${Buffer.from(persona.email).toString("hex").substring(0, 12)}`,
            personId: `per-${Buffer.from(persona.email).toString("hex").substring(0, 12)}`,
            email: persona.email,
            roles: [persona.role],
            tenantId: "vmnl-hq",
          };
          recordAuditLog({
            userId: user.userId,
            action: "auth.login.sandbox_persona",
            resource: "auth",
            resourceId: user.userId,
            changes: { email: user.email, role: persona.role },
            ipAddress: clientIp,
            userAgent: req.headers["user-agent"] || null,
          });
          const tokens = signSessionToken(user);
          res.setHeader("Set-Cookie", createSessionCookie(tokens.accessToken));
          // TODO-SEC-03: register the issued token in the session registry so
          // "Active Sessions" reflects real sessions and revocation sticks.
          registerSession({
            token: tokens.accessToken,
            userId: user.userId,
            email: user.email,
            deviceLabel: "Sandbox Quick-Login",
            ipAddress: clientIp,
          });

          if (contentType.includes("application/json")) {
            sendJson(res, 200, { success: true, user, token: tokens.accessToken, redirect: returnUrl });
          } else {
            res.writeHead(302, { Location: returnUrl });
            res.end();
          }
          return;
        }
      }

      // 2. Standard Email + Password Verification
      if (!body.email || !body.password) {
        if (contentType.includes("application/json")) {
          sendJson(res, 400, { error: "Bad Request", message: "Email and password are required" });
        } else {
          const html = renderMasterLayout(
            "Sign In | VMNL Enterprise",
            renderSignInHtml({ error: "Email and password are required.", returnUrl, email: body.email }),
            "/sign-in",
            { shell: "identity" }
          );
          sendHtml(res, 400, html);
        }
        return;
      }

      const { user } = await authenticateUser(body.email, body.password);
      if (!user) {
        recordAuditLog({
          action: "auth.login.failed",
          resource: "auth",
          changes: { email: body.email, reason: "INVALID_CREDENTIALS" },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/json")) {
          sendJson(res, 401, { error: "Unauthorized", message: "Invalid email or password" });
        } else {
          const html = renderMasterLayout(
            "Sign In | VMNL Enterprise",
            renderSignInHtml({ error: "Invalid email or password.", returnUrl, email: body.email }),
            "/sign-in",
            { shell: "identity" }
          );
          sendHtml(res, 401, html);
        }
        return;
      }

      recordAuditLog({
        userId: user.userId,
        action: "auth.login.success",
        resource: "auth",
        resourceId: user.userId,
        changes: { email: user.email, roles: user.roles },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      const tokens = signSessionToken(user);
      res.setHeader("Set-Cookie", createSessionCookie(tokens.accessToken));
      registerSession({
        token: tokens.accessToken,
        userId: user.userId,
        email: user.email,
        deviceLabel: "Web Workstation",
        ipAddress: clientIp,
      });

      if (contentType.includes("application/json")) {
        sendJson(res, 200, { success: true, user, token: tokens.accessToken, redirect: returnUrl });
      } else {
        res.writeHead(302, { Location: returnUrl });
        res.end();
      }
      return;
    }

    if ((pathname === "/sign-out" || pathname === "/logout") && (method === "GET" || method === "POST")) {
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      const cookieMatch = (req.headers["cookie"] as string | undefined)?.match(/vmnl_session=([^;]+)/);
      const token = bearerToken || cookieMatch?.[1];
      const sessionUser = resolveSessionUser(req);
      const clientIp = resolveClientIp(req);

      if (token) {
        revokeToken(token);
        // TODO-SEC-03: mark the registry row revoked so it no longer appears
        // as an active session.
        markTokenIdRevoked(token);
      }
      recordAuditLog({
        userId: sessionUser?.userId || null,
        action: "auth.logout",
        resource: "auth",
        resourceId: token || "session",
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      res.setHeader("Set-Cookie", "vmnl_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
      if ((req.headers["accept"] || "").includes("application/json")) {
        sendJson(res, 200, { success: true, message: "Logged out" });
      } else {
        res.writeHead(302, { Location: "/sign-in?signed_out=true" });
        res.end();
      }
      return;
    }

    if ((pathname === "/select-workspace" || pathname === "/auth/switch-role") && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/select-workspace" });
        res.end();
        return;
      }
      const urlObj = new URL(req.url || "/", "http://localhost");
      const currentRole = urlObj.searchParams.get("role") || undefined;
      const html = renderMasterLayout(
        "Select Workspace & Role Context | VMNL",
        renderWorkspaceSelectionHtml(user, currentRole),
        "/select-workspace",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/auth/mfa" && method === "GET") {
      const user = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const returnUrl = urlObj.searchParams.get("returnUrl") || "/workspace";
      const html = renderMasterLayout(
        "Step-Up Authentication | VMNL",
        renderMfaStepUpHtml({ returnUrl, userEmail: user?.email }),
        "/auth/mfa",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/auth/mfa" && method === "POST") {
      // TODO-SEC-01: server-side TOTP verification (RFC 6238). A code is only
      // accepted when the account has an enrolled secret and the presented
      // 6-digit code verifies against the current/drift window; replay of a
      // consumed code is rejected by the verifier. Unenrolled sandbox accounts
      // are auto-provisioned so the demo journey works, but the verification
      // itself is always real.
      const raw = await parseRawBody(req, pathname);
      const params = new URLSearchParams(raw);
      const returnUrl = params.get("returnUrl") || "/workspace";
      const code = params.get("mfaCode") || params.get("code") || "";
      const email = params.get("email") || resolveSessionUser(req)?.email || "";
      const contentType = req.headers["content-type"] || "";
      const isJson = contentType.includes("application/json") || (req.headers["accept"] || "").includes("application/json");

      const failMfa = (message: string, status = 403) => {
        recordAuditLog({
          userId: resolveSessionUser(req)?.userId || null,
          action: "auth.mfa.failed",
          resource: "auth",
          resourceId: email || "anonymous",
          changes: { reason: message },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (isJson || contentType.includes("application/json")) {
          sendJson(res, status, { error: "Forbidden", message, code: "MFA_VERIFICATION_FAILED" });
          return;
        }
        const html = renderMasterLayout(
          "Step-Up Authentication | VMNL",
          renderMfaStepUpHtml({ returnUrl, userEmail: email || undefined, error: message }),
          "/auth/mfa",
          { shell: "identity", sessionUser: resolveSessionUser(req) }
        );
        sendHtml(res, status, html);
      };

      if (!email) {
        failMfa("An authenticated session or account email is required for step-up verification.", 401);
        return;
      }

      const secret = getMfaSecret(email);
      if (!secret) {
        // Sandbox convenience: enroll on first step-up so the demo flow works.
        // Production enrollment is an explicit, audited act on the User record.
        enrollMfaSecret(email);
      }

      // Anti-brute-force: 5 attempts per code window per account.
      const mfaRate = checkRateLimit(`mfa:${email.toLowerCase()}`, 5, 30_000);
      if (!mfaRate.allowed) {
        failMfa("Too many verification attempts. Please wait before retrying.", 429);
        return;
      }

      const verification = verifyStepUpCode(email, code);
      if (!verification.valid) {
        failMfa(verification.error || "Verification failed.");
        return;
      }

      recordAuditLog({
        userId: resolveSessionUser(req)?.userId || null,
        action: "auth.mfa.verified",
        resource: "auth",
        resourceId: email,
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      if (isJson || contentType.includes("application/json")) {
        sendJson(res, 200, { status: "SUCCESS", verified: true, redirect: returnUrl });
        return;
      }
      res.writeHead(302, { Location: returnUrl });
      res.end();
      return;
    }

    // UX-SYS-002a: MFA enrollment (secret provisioning for step-up).
    if (pathname === "/auth/mfa/enroll" && method === "POST") {
      const user = resolveSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: "Unauthorized", message: "Sign in before enrolling in step-up verification.", code: "AUTH_TOKEN_REQUIRED" });
        return;
      }
      const secret = enrollMfaSecret(user.email);
      recordAuditLog({
        userId: user.userId,
        action: "auth.mfa.enrolled",
        resource: "auth",
        resourceId: user.email,
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, {
        status: "SUCCESS",
        message: "TOTP secret enrolled. Register it in your authenticator app.",
        // otpauth URI is the standard provisioning format for authenticator apps.
        otpauthUri: `otpauth://totp/VMNL:${encodeURIComponent(user.email)}?issuer=VMNL&secret=${secret}`,
      });
      return;
    }

    if (pathname === "/auth/recovery" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout(
        "Account Recovery | VMNL",
        renderAccountRecoveryHtml(),
        "/auth/recovery",
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/auth/recovery" && method === "POST") {
      // TODO-SEC-04: recovery dispatch through the MFA recovery store with
      // anti-enumeration semantics — the response is identical whether or not
      // the account exists. The NotificationService dispatch happens inside
      // requestAccountRecovery; the sandbox channel surfaces the token to the
      // operator console instead of email.
      const raw = await parseRawBody(req, pathname);
      const params = new URLSearchParams(raw);
      const email = params.get("email") || "";
      const dispatchChannel = async (dispatchEmail: string, token: string): Promise<"EMAIL" | "SANDBOX"> => {
        if (context.notificationService) {
          await context.notificationService.sendEmail({
            to: dispatchEmail,
            subject: "VMNL Account Recovery Instructions",
            htmlContent: `<p>Use this one-time token within 15 minutes to recover access: <code>${token}</code></p>`,
            textContent: `Use this one-time token within 15 minutes to recover access: ${token}`,
          });
          return "EMAIL";
        }
        recordAuditLog({
          action: "auth.recovery.token_issued_sandbox",
          resource: "auth",
          resourceId: dispatchEmail,
          changes: { tokenHashOnly: true },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });
        return "SANDBOX";
      };
      const outcome = requestAccountRecovery(email, dispatchChannel);
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout(
        "Account Recovery | VMNL",
        renderAccountRecoveryHtml({
          submitted: true,
          email,
        }),
        "/auth/recovery",
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/access-denied" && method === "GET") {
      const user = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const required = urlObj.searchParams.get("required") || "Authorized Role";
      const attempted = urlObj.searchParams.get("url") || "/workspace";
      const html = renderMasterLayout(
        "Access Unavailable | VMNL",
        renderAccessDeniedHtml(user, required, attempted),
        "/access-denied",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 403, html);
      return;
    }

    if (pathname === "/access-request" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/access-request" });
        res.end();
        return;
      }
      const urlObj = new URL(req.url || "/", "http://localhost");
      const defaultRole = urlObj.searchParams.get("role") || "MCRSupervisor";
      const attemptedUrl = urlObj.searchParams.get("url") || "/broadcast/screens";
      const html = renderMasterLayout(
        "Request Access Elevation | VMNL",
        renderAccessRequestHtml(user, defaultRole, attemptedUrl),
        "/access-request",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/access-request" && method === "POST") {
      const user = resolveSessionUser(req);
      const raw = await parseRawBody(req, pathname);
      const params = new URLSearchParams(raw);
      const targetRole = params.get("role") || "MCRSupervisor";
      const returnUrl = params.get("returnUrl") || "/select-workspace";
      const justification = params.get("justification") || "Operational access";

      recordAuditLog({
        userId: user?.userId || null,
        action: "auth.access_request",
        resource: "rbac",
        changes: { requestedRole: targetRole, justification },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      res.writeHead(302, { Location: returnUrl });
      res.end();
      return;
    }

    if (pathname === "/account/profile" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/account/profile" });
        res.end();
        return;
      }
      const html = renderMasterLayout(
        "Account Settings | VMNL",
        renderAccountSettingsHtml(user),
        "/account/profile",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // UX-SYS-004: Invitation Acceptance
    if (pathname === "/auth/invitation" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const token = urlObj.searchParams.get("token") || undefined;
      const email = urlObj.searchParams.get("email") || undefined;
      const html = renderMasterLayout(
        "Accept Invitation | VMNL",
        renderInvitationAcceptanceHtml(token, email),
        "/auth/invitation",
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/auth/invitation/accept" && method === "POST") {
      // TODO-SEC-02: full acceptance validation chain (UIUX-001 §8.4):
      // validity → recipient binding → expiry → granting authority → role.
      // Single-use; the granted role is exactly the invited role — never the
      // union of all roles held by the same email (no privilege union).
      const raw = await parseRawBody(req, pathname);
      const params = new URLSearchParams(raw);
      const token = params.get("token") || "";
      const email = params.get("email") || "";
      const password = params.get("password") || "";
      const contentType = req.headers["content-type"] || "";

      const failInvitation = (message: string) => {
        const html = renderMasterLayout(
          "Accept Invitation | VMNL",
          renderInvitationAcceptanceHtml(token || undefined, email || undefined, message),
          "/auth/invitation",
          { shell: "identity" }
        );
        sendHtml(res, 403, html);
      };

      if (!token || !email || !password) {
        failInvitation("Token, email and a new password are required to accept an invitation.");
        return;
      }

      const result = acceptInvitation({
        token,
        acceptingEmail: email,
        acceptingUserId: `usr-${Buffer.from(email.toLowerCase().trim()).toString("hex").substring(0, 12)}`,
        validEnterpriseRoles: Object.keys(ROLE_PERMISSIONS),
      });
      if (!result.accepted) {
        recordAuditLog({
          action: "auth.invitation.rejected",
          resource: "auth",
          resourceId: token,
          changes: { reason: result.code, email },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        failInvitation(result.reason || "Invitation could not be accepted.");
        return;
      }

      recordAuditLog({
        action: "auth.invitation.accepted",
        resource: "auth",
        resourceId: result.invitation!.id,
        changes: {
          email,
          grantedRole: result.grantedRole,
          grantingAuthority: result.invitation!.grantingAuthority,
        },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      res.writeHead(302, { Location: "/auth/profile-setup" });
      res.end();
      return;
    }

    // UX-SYS-004a: invitation issuance (granting-authority recorded, audited).
    if (pathname === "/api/v1/auth/invitations" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "contract");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      const intendedEmail = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
      const intendedRole = typeof body.role === "string" ? body.role : "";
      if (!intendedEmail.includes("@") || !intendedRole) {
        sendJson(res, 400, { error: "Bad Request", message: "email and role are required.", code: "INVITATION_PAYLOAD_INVALID" });
        return;
      }
      if (!Object.keys(ROLE_PERMISSIONS).includes(intendedRole)) {
        sendJson(res, 422, { error: "Unprocessable Entity", message: `Role '${intendedRole}' is not a defined enterprise relationship.`, code: "INVITATION_ROLE_INVALID" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      const expiresInDays = Math.min(Math.max(Number(body.expiresInDays) || 7, 1), 30);
      const invitation = createInvitation({
        id: `INV-${Date.now().toString(36).toUpperCase()}`,
        token,
        intendedEmail,
        intendedRole,
        tenantId: user.tenantId || "vmnl-hq",
        grantingAuthority: user.email,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 3600 * 1000),
      });
      recordAuditLog({
        userId: user.userId,
        action: "auth.invitation.issued",
        resource: "auth",
        resourceId: invitation.id,
        changes: { intendedEmail, intendedRole, grantingAuthority: user.email, expiresInDays },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 201, {
        status: "SUCCESS",
        invitationId: invitation.id,
        // HX-02: the acceptance link is the ack payload the issuing operator
        // delivers out-of-band; the token itself is never re-served by the API.
        acceptUrl: `/auth/invitation?token=${token}&email=${encodeURIComponent(intendedEmail)}`,
        expiresAt: invitation.expiresAt.toISOString(),
      });
      return;
    }

    // UX-SYS-005: First-Use Profile Setup
    if (pathname === "/auth/profile-setup" && method === "GET") {
      const user: SessionUser = resolveSessionUser(req) || {
        userId: "usr-new-operator",
        personId: "per-new-operator",
        email: "operator.onboarding@vmnl.ng",
        roles: ["MCRSupervisor" as const],
      };
      const html = renderMasterLayout(
        "First-Use Profile Setup | VMNL",
        renderFirstUseProfileHtml(user),
        "/auth/profile-setup",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/auth/profile-setup" && method === "POST") {
      // TODO-SEC-04 remainder: persist the first-use profile server-side and
      // re-verify on resume, instead of blindly redirecting.
      const user = resolveSessionUser(req);
      const raw = await parseRawBody(req, pathname);
      const form = new URLSearchParams(raw);
      try {
        const saved = saveFirstUseProfile(user?.userId || "usr-new-operator", {
          displayName: String(form.get("displayName") || ""),
          dutyPhone: String(form.get("dutyPhone") || ""),
          timezone: String(form.get("timezone") || "Africa/Lagos"),
        });
        recordAuditLog({
          userId: saved.userId,
          action: "auth.profile_setup.saved",
          resource: "auth",
          resourceId: saved.userId,
          changes: { displayName: saved.displayName, timezone: saved.timezone },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });
        res.writeHead(302, { Location: "/select-workspace?profile=saved" });
        res.end();
      } catch (err: any) {
        const message = encodeURIComponent(err?.message || "Profile validation failed");
        res.writeHead(302, { Location: `/auth/profile-setup?error=${message}` });
        res.end();
      }
      return;
    }

    // TODO-SEC-11: CSRF token bootstrap for browser forms.
    if (pathname === "/auth/csrf" && method === "GET") {
      const token = issueCsrfToken();
      res.setHeader("Set-Cookie", csrfCookieHeader(token));
      sendJson(res, 200, { csrfToken: token, cookieName: CSRF_COOKIE_NAME });
      return;
    }

    // UX-SYS-007: Session Expired / Resume
    if (pathname === "/auth/session-expired" && method === "GET") {
      const urlObj = new URL(req.url || "/", "http://localhost");
      const returnUrl = urlObj.searchParams.get("returnUrl") || "/workspace";
      const html = renderMasterLayout(
        "Session Expired | VMNL",
        renderSessionExpiredHtml(returnUrl),
        "/auth/session-expired",
        { shell: "identity" }
      );
      sendHtml(res, 200, html);
      return;
    }

    // UX-SYS-012: Notification Preferences
    if (pathname === "/account/notifications" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/account/notifications" });
        res.end();
        return;
      }
      const html = renderMasterLayout(
        "Notification Preferences | VMNL",
        renderNotificationPreferencesHtml(user),
        "/account/notifications",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/account/notifications" && method === "POST") {
      // TODO-SEC-05: preferences are persisted per user so the dispatch
      // pipeline can honor opted-out channels (suppression verified by test).
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/account/notifications" });
        res.end();
        return;
      }
      const raw = await parseRawBody(req, pathname);
      const form = new URLSearchParams(raw);
      const saved = saveNotificationPreferences(user.userId, {
        categories: {
          playoutDisruption: form.get("alert_playout_deadair") === "on",
          rightsBlocks: form.get("alert_rights_hold") === "on",
          financeApprovals: form.get("alert_commercial_underdelivery") === "on",
          admissionsDecisions: form.get("alert_audit_security") === "on",
        },
      });
      recordAuditLog({
        userId: user.userId,
        action: "account.notification_preferences.saved",
        resource: "auth",
        resourceId: user.userId,
        changes: { ...saved },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      res.writeHead(302, { Location: "/account/notifications?saved=true" });
      res.end();
      return;
    }

    // UX-SYS-013: Active Sessions and Revocation — backed by the real
    // session registry (TODO-SEC-03); rows are actual issued tokens.
    if (pathname === "/account/sessions" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/account/sessions" });
        res.end();
        return;
      }
      const sessions = listSessions(user.userId);
      const html = renderMasterLayout(
        "Active Sessions | VMNL",
        renderActiveSessionsHtml(user, { sessions }),
        "/account/sessions",
        { shell: "identity", sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    if ((pathname === "/account/sessions/revoke" || pathname === "/account/sessions/revoke-all") && method === "POST") {
      // TODO-SEC-03: revoke endpoints revoke REAL tokens — the targeted token
      // (or every active session on revoke-all) is added to the revocation
      // store, so the very next request with that cookie fails verification.
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/account/sessions" });
        res.end();
        return;
      }
      const raw = await parseRawBody(req, pathname);
      const form = new URLSearchParams(raw);
      const targetTokenId = form.get("tokenId") || undefined;
      const cookieMatch = (req.headers["cookie"] as string | undefined)?.match(/vmnl_session=([^;]+)/);
      const currentToken = cookieMatch?.[1];

      if (pathname === "/account/sessions/revoke-all") {
        const count = revokeAllSessions(user.userId);
        if (currentToken) {
          revokeToken(currentToken);
          markTokenIdRevoked(currentToken);
        }
        recordAuditLog({
          userId: user.userId,
          action: "auth.sessions.revoke_all",
          resource: "auth",
          resourceId: user.userId,
          changes: { revokedCount: count },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
      } else if (targetTokenId) {
        const revokedToken = revokeSessionById(user.userId, targetTokenId);
        if (revokedToken) {
          revokeToken(revokedToken);
        }
        recordAuditLog({
          userId: user.userId,
          action: "auth.sessions.revoke_one",
          resource: "auth",
          resourceId: targetTokenId,
          changes: { found: Boolean(revokedToken) },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
      }

      res.setHeader("Set-Cookie", "vmnl_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
      res.writeHead(302, { Location: "/account/sessions?revoked=true" });
      res.end();
      return;
    }

    // UX-SYS-014: Contextual Operator Help & SOPs
    if (pathname === "/help/operator" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const topic = urlObj.searchParams.get("topic") || undefined;
      const html = renderMasterLayout(
        "MCR Contextual Help & SOPs | VMNL",
        renderContextualHelpHtml(topic),
        "/help/operator",
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // 0. Public Web Pages & Operator Dashboard
    if (pathname === "/" && method === "GET") {
      const html = renderMasterLayout("Home", renderHomePageHtml(), "/", { sessionUser: resolveSessionUser(req) });
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/channels" && method === "GET") {
      const html = renderMasterLayout("Linear Channels", renderChannelsPageHtml(), "/channels");
      sendHtml(res, 200, html);
      return;
    }

    // Surface A: Channel Pages (BCST-09: now/next widget from approved EPG;
    // BCST-08: viewer-timezone presentation via the Time-Zone request header)
    const tzHeader = typeof req.headers["time-zone"] === "string" ? (req.headers["time-zone"] as string) : undefined;
    if (pathname === "/channels/nxtr" && method === "GET") {
      const html = renderMasterLayout("Nigezie Xtreme (NXTR)", renderChannelDetailPageHtml("NXTR", tzHeader), "/channels");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/channels/orisun" && method === "GET") {
      const html = renderMasterLayout("Orisun (ORIS)", renderChannelDetailPageHtml("ORIS", tzHeader), "/channels");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/channels/isimbido" && method === "GET") {
      const html = renderMasterLayout("Isi Mbido (IMBD)", renderChannelDetailPageHtml("IMBD", tzHeader), "/channels");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname.startsWith("/programmes/") && method === "GET") {
      const programmeId = pathname.replace("/programmes/", "").trim();
      // AUD-32 (soft-404): unknown programme IDs return an honest 404 status
      // so crawlers do not index empty shells. The sample programme surface is
      // served only for the canonical demo identifier.
      const isKnownProgramme = programmeId === "PRG-001";
      const html = renderMasterLayout(`Programme ${programmeId}`, renderPublicProgrammeDetailHtml(programmeId), "/channels");
      sendHtml(res, isKnownProgramme ? 200 : 404, html);
      return;
    }

    // Surface A: Hub Verticals & Public Pages
    if (pathname === "/hub" && method === "GET") {
      const html = renderMasterLayout("Creative Economy Hub", renderHubPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/talent" && method === "GET") {
      const html = renderMasterLayout("Talent Accelerator", renderTalentAcceleratorPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if ((pathname === "/hub/afca" || pathname === "/learn") && method === "GET") {
      const html = renderMasterLayout("AFCA Academy", renderAfcaAcademyPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/creators" && method === "GET") {
      const html = renderMasterLayout("Creators & Talent Gateway", renderCreatorsGatewayPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/community" && method === "GET") {
      const html = renderMasterLayout("Afro-Fusion Creatives Community", renderCommunityPresencePageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/vtm" && method === "GET") {
      const html = renderMasterLayout("Verified Talent Marketplace (VTM)", renderVtmMarketplacePageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/onestudios" && method === "GET") {
      const html = renderMasterLayout("ONE Studios: Production & Soundstages", renderOneStudiosPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/production" && method === "GET") {
      const html = renderMasterLayout("Production: ONE Studios & VCF", renderProductionPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/vcf" && method === "GET") {
      const html = renderMasterLayout("Virtual Content Fund (VCF)", renderVcfPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/events" && method === "GET") {
      const html = renderMasterLayout("Fusion Events", renderEventsPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/technology" && method === "GET") {
      const html = renderMasterLayout("Cr8TechNG Technology", renderTechnologyPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/hub/distribution" && method === "GET") {
      const html = renderMasterLayout("TEND Rights & Distribution", renderDistributionPageHtml(), "/hub");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/partners" && method === "GET") {
      const html = renderMasterLayout("Commercial Partners & Sponsors", renderPartnersPageHtml(), "/partners");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/insights" && method === "GET") {
      const html = renderMasterLayout("Insights & Research", renderInsightsPageHtml(), "/insights");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/careers" && method === "GET") {
      const html = renderMasterLayout("Careers at VMNL", renderCareersPageHtml(), "/careers");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/azeebo" && method === "GET") {
      const html = renderMasterLayout("Open Azeebo+", renderAzeeboGatewayPageHtml(), "/azeebo");
      sendHtml(res, 200, html);
      return;
    }

    // Living Design System & Styleguide (DT-206)
    if (pathname === "/styleguide" && method === "GET") {
      const html = renderMasterLayout("Design System Styleguide", renderStyleguideHtml(), "/styleguide");
      sendHtml(res, 200, html);
      return;
    }

    // R1.1 Representative Desktop & Mobile Prototypes Viewer (Docx §1, §14)
    if (pathname === "/prototypes" && method === "GET") {
      const screen = (parsedUrl.searchParams.get("screen") || "home") as PrototypeScreenId;
      const scenario = (parsedUrl.searchParams.get("scenario") || "normal") as PrototypeScenario;
      const device = (parsedUrl.searchParams.get("device") || "desktop") as PrototypeDevice;
      const html = renderMasterLayout(
        "R1.1 Representative Prototypes",
        renderPrototypesViewerHtml({ screen, scenario, device }),
        "/prototypes"
      );
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-002: About VMN
    if (pathname === "/about" && method === "GET") {
      const html = renderMasterLayout("About VMNL", renderAboutPageHtml(), "/about");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-008: Master Public Schedule
    if (pathname === "/schedule" && method === "GET") {
      const html = renderMasterLayout("Public Broadcast Schedule", renderPublicScheduleHtml(), "/schedule");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-009: Advertising & Sponsorship Opportunities
    if (pathname === "/advertising" && method === "GET") {
      const html = renderMasterLayout("Advertising & Brand Partnerships", renderAdvertisingSponsorshipHtml(), "/advertising");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-025: Commercial Enquiry & Contact
    if ((pathname === "/enquiry" || pathname === "/contact") && method === "GET") {
      const html = renderMasterLayout("Contact & Commercial Enquiry", renderEnquiryContactHtml(), "/contact");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-026: Help Center & Knowledge Base
    if (pathname === "/help" && method === "GET") {
      const html = renderMasterLayout("Help Center & Support", renderHelpPageHtml(), "/help");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-027: Privacy Policy & Data Protection Notice
    if (pathname === "/privacy" && method === "GET") {
      const html = renderMasterLayout("Privacy & Data Protection Policy", renderPrivacyPageHtml(), "/privacy");
      sendHtml(res, 200, html);
      return;
    }

    // UX-PUB-028: Accessibility Statement & Conformance
    if (pathname === "/accessibility" && method === "GET") {
      const html = renderMasterLayout("Accessibility Conformance Statement", renderAccessibilityPageHtml(), "/accessibility");
      sendHtml(res, 200, html);
      return;
    }

    // UX-APP-001 to 005: AFCA Academy Learner Application
    if (pathname === "/apply" && method === "GET") {
      const initialTrack = parsedUrl.searchParams.get("track") || undefined;
      const html = renderMasterLayout("AFCA Cohort Application", renderAdmissionsApplicationHtml(initialTrack), "/apply");
      sendHtml(res, 200, html);
      return;
    }

    // UX-APP-006: AFCA Application Status Tracker
    if (pathname.startsWith("/apply/status") && method === "GET") {
      const queryRef = pathname.replace("/apply/status", "").replace(/^\//, "").trim() || parsedUrl.searchParams.get("ref") || "";
      const app = queryRef ? await AfcaAdmissionsService.getByReference(queryRef) : null;
      const html = renderMasterLayout("Application Status Tracker", renderApplicationStatusHtml(app, queryRef), "/apply");
      sendHtml(res, 200, html);
      return;
    }

    // UX-APP-007: AFCA Admissions Evaluation Queue
    if ((pathname === "/admissions/queue" || pathname === "/workspace/admissions") && method === "GET") {
      const apps = await AfcaAdmissionsService.listQueue();
      const html = renderMasterLayout("Admissions Review Queue", renderAdmissionsQueueHtml(apps), "/workspace");
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-001 to 004: AFCA Academy LMS Learner Hub
    if ((pathname === "/workspace/afca" || pathname === "/workspace/afca/lms") && method === "GET") {
      const html = renderMasterLayout("AFCA Learner Studio", renderAfcaLearnerDashboardHtml(), "/workspace");
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-005 to 006: AFCA Faculty Gradebook & Rubrics
    if (pathname === "/workspace/afca/gradebook" && method === "GET") {
      const html = renderMasterLayout("AFCA Faculty Gradebook", renderAfcaGradebookHtml(), "/workspace");
      sendHtml(res, 200, html);
      return;
    }

    // UX-VTM-008 to 010: VTM Talent Engagement Terms Review & Signing
    if ((pathname === "/vtm/terms" || pathname === "/portal/vtm/terms") && method === "GET") {
      const mockContract = {
        id: "ctr-2026-vtm-001",
        contractNumber: "VTM-CTR-2026-0042",
        projectName: "Lagos Noir Season 2 (StarTimes Original)",
        productionCompany: "ONE Studios Africa / VMNL Productions",
        roleTitle: "Lead Cinematographer (Lighting Director)",
        totalCompensationNgn: 4500000,
        netTalentAmountNgn: 3825000,
        platformCommissionNgn: 675000,
        startDate: "15 Oct 2026",
        endDate: "30 Nov 2026",
        isSigned: false,
        milestones: [
          { title: "Pre-production & Lighting Rig Design", amountNgn: 1125000, deliverable: "Approved Rigging Specs", status: "FUNDS_ESCROWED" },
          { title: "Principal Photography Week 1-3", amountNgn: 1575000, deliverable: "Raw Graded Rushes", status: "FUNDS_ESCROWED" },
          { title: "Principal Photography Wrap & Pickups", amountNgn: 1125000, deliverable: "Wrap Sign-off Certificate", status: "FUNDS_ESCROWED" },
        ],
      };
      const html = renderMasterLayout("Talent Engagement Agreement", renderVtmTermsReviewHtml(mockContract), "/portal/vtm");
      sendHtml(res, 200, html);
      return;
    }

    // UX-VTM-005 to 006: VTM Talent Marketplace Opportunities
    if ((pathname === "/vtm/marketplace" || pathname === "/portal/vtm/marketplace") && method === "GET") {
      const mockOpportunities = [
        {
          id: "opp-01",
          title: "Principal Cinematographer - Commercial Campaign",
          production: "Azeebo Digital Studios",
          category: "Cinematography",
          matchScore: 96,
          budgetPerDayNgn: 250000,
          buyoutTier: "REGIONAL_PAYTV" as const,
        },
        {
          id: "opp-02",
          title: "Lead Sound Recordist & Boom Operator",
          production: "Afro-Fusion Films",
          category: "Sound Engineering",
          matchScore: 88,
          budgetPerDayNgn: 180000,
          buyoutTier: "LOCAL_LINEAR_TV" as const,
        },
      ];
      const html = renderMasterLayout("Talent Marketplace Opportunities", renderVtmMarketplaceHtml(mockOpportunities), "/portal/vtm");
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-07: S-CLIENT Counterparty Projects List (UX-POR-001)
    // TODO-SEC-07: org isolation — an authenticated caller only ever sees the
    // projects of organisations they hold a client relationship with. The
    // former any-org→all-projects fallback leaked every sample record and is
    // removed; unknown/unrelated orgs render an honest empty state (or 403 for
    // cross-org probes), never another organisation's data.
    if (pathname.match(/^\/portal\/client\/organisations\/([^/]+)\/projects$/) && method === "GET") {
      const match = pathname.match(/^\/portal\/client\/organisations\/([^/]+)\/projects$/);
      const orgId = match ? match[1] : "default-org";
      const sessionUser = resolveSessionUser(req);
      const relationship = getClientOrgRelationship(sessionUser ?? null, orgId);
      if (relationship === "FORBIDDEN") {
        const deniedHtml = renderMasterLayout(
          "403 Forbidden | Client Portal",
          renderAccessDeniedHtml(
            sessionUser ?? null,
            `Client representative of ${orgId}`,
            pathname
          ),
          pathname,
          { shell: "identity", sessionUser: sessionUser || undefined }
        );
        sendHtml(res, 403, deniedHtml);
        return;
      }
      const projects =
        relationship === "CLIENT_MEMBER" || relationship === "STAFF_ACCESS"
          ? Object.values(MOCK_CLIENT_PROJECTS).filter((p) => p.orgId === orgId)
          : [];
      const html = renderMasterLayout(
        "Client Commercial Projects | VMNL",
        renderClientProjectsListHtml(orgId, projects),
        pathname,
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-07: S-CLIENT Project Details, Delivery Commitments, Proof Viewer (UX-PRJ-002, UX-COM-010, UX-POR-002)
    // TODO-SEC-07: same org-isolation contract as the list route — detail
    // views of another organisation's project return 403.
    if (pathname.match(/^\/portal\/client\/organisations\/([^/]+)\/projects\/([^/]+)$/) && method === "GET") {
      const match = pathname.match(/^\/portal\/client\/organisations\/([^/]+)\/projects\/([^/]+)$/);
      const orgId = match ? match[1] : "org-dangote";
      const projectId = match ? match[2] : "PRJ-VMN-2026-088";
      const sessionUser = resolveSessionUser(req);
      const relationship = getClientOrgRelationship(sessionUser ?? null, orgId);
      if (relationship === "FORBIDDEN") {
        const deniedHtml = renderMasterLayout(
          "403 Forbidden | Client Portal",
          renderAccessDeniedHtml(
            sessionUser ?? null,
            `Client representative of ${orgId}`,
            pathname
          ),
          pathname,
          { shell: "identity", sessionUser: sessionUser || undefined }
        );
        sendHtml(res, 403, deniedHtml);
        return;
      }
      const project =
        relationship === "CLIENT_MEMBER" || relationship === "STAFF_ACCESS"
          ? MOCK_CLIENT_PROJECTS[projectId]
          : undefined;

      if (!project) {
        // Honest soft-404: unknown or non-member project within one's own org.
        const notFoundHtml = renderMasterLayout(
          "404 Not Found | Client Portal",
          `<div class="vmn-card" style="max-width: 600px; margin: 40px auto; text-align: center; padding: 36px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg);">
            <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; margin-bottom: 8px;">Project Not Available</h2>
            <p style="color: var(--vmn-color-secondary-text); margin-bottom: 24px;">This project reference does not exist within your organisation's portfolio.</p>
            <a href="/portal/client/organisations/${encodeURIComponent(orgId)}/projects" class="btn btn-primary">Back to Projects</a>
          </div>`,
          pathname,
          { shell: "identity", sessionUser }
        );
        sendHtml(res, 404, notFoundHtml);
        return;
      }

      const urlObj = new URL(req.url || "/", "http://localhost");
      const successNotice = urlObj.searchParams.get("notice") || undefined;

      const html = renderMasterLayout(
        `${project.title} | Client Proof Portal`,
        renderClientProjectDetailHtml(project, successNotice),
        pathname,
        { shell: "identity", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // AUD-32: crawler directives and sitemap for public surfaces.
    if (pathname === "/robots.txt" && method === "GET") {
      // Operational and workspace surfaces are intentionally excluded from
      // indexing; public marketing/content surfaces remain crawlable.
      const robotsTxt = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /workspace/",
        "Disallow: /broadcast/",
        "Disallow: /api/",
        "Disallow: /verify/",
        "Disallow: /metrics",
        "Disallow: /readyz",
        "Disallow: /healthz",
        "Sitemap: https://vmnl.ng/sitemap.xml",
      ].join("\n");
      sendText(res, 200, robotsTxt, "text/plain; charset=utf-8");
      return;
    }

    if (pathname === "/sitemap.xml" && method === "GET") {
      const publicRoutes = [
        "/",
        "/channels",
        "/channels/nxtr",
        "/channels/orisun",
        "/channels/isimbido",
        "/programmes/PRG-001",
        "/hub",
        "/hub/talent",
        "/hub/afca",
        "/hub/creators",
        "/hub/community",
        "/hub/vtm",
        "/hub/onestudios",
        "/hub/production",
        "/hub/vcf",
        "/hub/events",
        "/hub/technology",
        "/hub/distribution",
        "/partners",
        "/insights",
        "/careers",
        "/azeebo",
      ];
      const today = new Date().toISOString().slice(0, 10);
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (route) => `  <url>
    <loc>https://vmnl.ng${route}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;
      sendText(res, 200, sitemapXml, "application/xml; charset=utf-8");
      return;
    }

    // AUD-20: the canonical stylesheet is served as a static, content-hashed,
    // immutably cached asset instead of being re-inlined into every page.
    if (pathname === "/assets/styles.css" && method === "GET") {
      const etag = `"${crypto.createHash("sha256").update(CANONICAL_STYLESHEET).digest("base64url")}"`;
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (res.req?.headers["if-none-match"] === etag) {
        res.writeHead(304);
        res.end();
        return;
      }
      sendText(res, 200, CANONICAL_STYLESHEET, "text/css; charset=utf-8");
      return;
    }

    // Favicon & Brand Asset Resolvers (DT-107, DT-306, DS-22)
    if (pathname === "/favicon.ico" && method === "GET") {
      sendText(res, 200, VMN_FAVICON_SVG, "image/svg+xml");
      return;
    }

    if ((pathname === "/assets/og-vmnl-master.jpg" || pathname === "/assets/og-vmnl-master.svg") && method === "GET") {
      sendText(res, 200, VMN_OG_IMAGE_SVG, "image/svg+xml");
      return;
    }

    // Public Verification Surfaces: AFCA Academy & Proof-of-Air
    if (pathname.startsWith("/verify/afca/") && method === "GET") {
      const certId = pathname.replace("/verify/afca/", "").trim();
      const verification = context.afcaService.verifyCertificate(certId);
      const acceptsJson = (req.headers["accept"] || "").includes("application/json") || parsedUrl.searchParams.get("format") === "json";
      if (acceptsJson) {
        sendJson(res, verification.valid ? 200 : 404, {
          certificateId: certId,
          ...verification,
        });
        return;
      }
      const html = renderMasterLayout(
        "AFCA Certificate Verification",
        renderAfcaVerificationHtml({
          valid: verification.valid,
          certificate: verification.certificate,
          id: certId,
        }),
        "/hub"
      );
      sendHtml(res, verification.valid ? 200 : 404, html);
      return;
    }

    if (pathname.startsWith("/verify/poa/") && method === "GET") {
      const certId = pathname.replace("/verify/poa/", "").trim();
      const cert = getProofOfAirCertificate(certId);
      const acceptsJson = (req.headers["accept"] || "").includes("application/json") || parsedUrl.searchParams.get("format") === "json";
      if (acceptsJson) {
        sendJson(res, cert ? 200 : 404, {
          certificateId: certId,
          valid: Boolean(cert),
          certificate: cert,
        });
        return;
      }
      const html = renderMasterLayout(
        "Proof-of-Air Performance Verification",
        renderPoaVerificationHtml({
          valid: Boolean(cert),
          certificate: cert,
          id: certId,
        }),
        "/channels"
      );
      sendHtml(res, cert ? 200 : 404, html);
      return;
    }

    // Surface B & C: Enterprise Workspaces
    if (pathname === "/workspace" && method === "GET") {
      const html = renderMasterLayout("Enterprise Workspaces", renderWorkspaceDirectoryHtml(), "/workspace");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname.startsWith("/workspace/") && method === "GET") {
      const deskKey = pathname.replace("/workspace/", "").trim();
      const knownDesk = ENTERPRISE_WORKSPACES.some((w) => w.key === deskKey.toLowerCase());
      if (knownDesk) {
        const html = renderMasterLayout(`Workspace / ${deskKey}`, renderWorkspaceDeskHtml(deskKey), "/workspace");
        sendHtml(res, 200, html);
        return;
      }
    }

    // UX-ADM-004: Release Availability & Feature Flag Console
    if ((pathname === "/admin/feature-flags" || pathname === "/workspace/admin/feature-flags") && method === "GET") {
      const domainFilter = parsedUrl.searchParams.get("domain") || undefined;
      const html = renderMasterLayout(
        "Release Availability & Feature Flag Console (UX-ADM-004)",
        renderAdminFeatureFlagsHtml(domainFilter),
        "/admin/feature-flags"
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-13 (UX-ADM-001): read-only Access & Membership Administration.
    // Route sits under /workspace/admin so the WORKSPACE_HTML_GUARDS table
    // enforces SuperAdmin server-side before this handler runs.
    if (pathname === "/workspace/admin/access" && method === "GET") {
      const html = renderMasterLayout(
        "Access & Membership Administration (UX-ADM-001)",
        renderAccessAdminConsoleHtml(projectAccessMatrix(listAllSessions())),
        "/workspace/admin/access"
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-15 (UX-ADM-003): Approved Routing & Source Mappings console.
    if (pathname === "/workspace/admin/source-mappings" && method === "GET") {
      const html = renderMasterLayout(
        "Approved Routing & Source Mappings (UX-ADM-003)",
        renderSourceMappingsConsoleHtml(),
        "/workspace/admin/source-mappings"
      );
      sendHtml(res, 200, html);
      return;
    }

    // SCR-03 (UX-CMS-006): editor pages. The create page and the per-item
    // edit page both embed the approved media picker as checkboxes of
    // registered MediaAssetRecord ids (§7.3). Anonymous visitors are sent to
    // sign-in; the mutations themselves are authority-guarded.
    if (pathname === "/workspace/content/editor" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: `/sign-in?returnUrl=${encodeURIComponent(pathname)}` });
        res.end();
        return;
      }
      const urlObj = new URL(req.url || "/", "http://localhost");
      const csrfToken = issueCsrfToken();
      const html = renderMasterLayout(
        "Create Content (UX-CMS-006)",
        renderContentEditorFormHtml(
          projectContentEditorForm({
            mode: "create",
            availableAssets: listApprovedMediaAssets({ tenantId: user.tenantId }),
            unavailableAssets: listApprovedMediaAssets({ tenantId: user.tenantId, includeNonAvailable: true }).filter((a) => a.accessState !== "AVAILABLE"),
          }),
          { csrfToken },
        ),
        "/workspace/content"
      );
      res.setHeader("Set-Cookie", csrfCookieHeader(csrfToken));
      sendHtml(res, 200, html);
      return;
    }

    if (pathname.startsWith("/workspace/content/editor/") && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: `/sign-in?returnUrl=${encodeURIComponent(pathname)}` });
        res.end();
        return;
      }
      const contentId = pathname.replace("/workspace/content/editor/", "").split("?")[0].trim();
      const item = getContent(contentId);
      if (!item) {
        sendHtml(res, 404, renderMasterLayout("Content not found", `<p>Content '${escapeHtml(contentId)}' does not exist.</p>`, "/workspace/content"));
        return;
      }
      const revision = item.revisions.get(item.currentRevision)!;
      const csrfToken = issueCsrfToken();
      const html = renderMasterLayout(
        `Edit Content (UX-CMS-006)`,
        renderContentEditorFormHtml(
          projectContentEditorForm({
            mode: "edit",
            content: {
              id: item.id,
              currentRevision: item.currentRevision,
              status: item.status,
              revision: {
                title: revision.title,
                slug: revision.slug,
                summary: revision.summary,
                body: revision.body,
                alternativeText: revision.alternativeText,
                mediaAssetIds: revision.mediaAssetIds,
              },
            },
            availableAssets: listApprovedMediaAssets({ tenantId: user.tenantId }),
            unavailableAssets: listApprovedMediaAssets({ tenantId: user.tenantId, includeNonAvailable: true }).filter((a) => a.accessState !== "AVAILABLE"),
          }),
          { csrfToken },
        ),
        "/workspace/content"
      );
      res.setHeader("Set-Cookie", csrfCookieHeader(csrfToken));
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-03 (UX-CMS-006): approved media picker over the DAM registry.
    // Authenticated-access workspace GET (general desk pattern); the picker
    // is read-only — registration happens through the audited POST endpoint.
    if (pathname === "/workspace/content/media-picker" && method === "GET") {
      const user = resolveSessionUser(req);
      const assets = listApprovedMediaAssets({ tenantId: user?.tenantId, includeNonAvailable: true });
      const html = renderMasterLayout(
        "Approved Media Picker (UX-CMS-006)",
        renderMediaPickerHtml(projectMediaPicker(assets)),
        "/workspace/content"
      );
      sendHtml(res, 200, html);
      return;
    }

    // Surface E: Azeebo+ Federation & Gateway
    if (pathname === "/azeebo/gateway" && method === "GET") {
      const html = renderMasterLayout("Azeebo+ Federation Gateway", renderFederationGatewayHtml(), "/azeebo/gateway");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/azeebo/attribution" && method === "GET") {
      const html = renderMasterLayout("Linear Attribution Tracker", renderAttributionConsoleHtml(), "/azeebo/attribution");
      sendHtml(res, 200, html);
      return;
    }

    // Surface E: Universe Deep-Link Resolvers
    const universePrefixes = ["content", "creator", "event", "cinemaxis", "aou", "game", "9tlife", "live"];
    for (const uni of universePrefixes) {
      if ((pathname.startsWith(`/${uni}/`) || pathname.startsWith(`/azeebo/${uni}/`)) && method === "GET") {
        const itemId = pathname.replace(new RegExp(`^/(?:azeebo/)?${uni}/`), "").trim();
        const html = renderMasterLayout(`Azeebo+ / ${uni}`, renderUniverseResolverHtml(uni, itemId), "/azeebo/gateway");
        sendHtml(res, 200, html);
        return;
      }
    }

    if ((pathname.startsWith("/azeebo/broadcast/") || pathname.startsWith("/broadcast/bridge/")) && method === "GET") {
      const itemId = pathname.replace(new RegExp(`^/(?:azeebo/broadcast|broadcast/bridge)/`), "").trim();
      const html = renderMasterLayout("Azeebo+ / Broadcast Bridge", renderUniverseResolverHtml("broadcast", itemId), "/azeebo/gateway");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/broadcast/dashboard" && method === "GET") {
      const html = renderMasterLayout("Broadcast Executive Dashboard", renderDashboardHtml(), "/broadcast/dashboard");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/broadcast/screens" && method === "GET") {
      const roleFilter = parsedUrl.searchParams.get("role") || undefined;
      const html = renderMasterLayout("Operational Screen Surfaces", renderScreensCatalogHtml(roleFilter), "/broadcast/screens");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname.startsWith("/broadcast/screens/") && method === "GET") {
      const screenId = pathname.replace("/broadcast/screens/", "").trim();
      const html = renderMasterLayout(`Screen Surface ${screenId}`, renderScreenDetailHtml(screenId), "/broadcast/screens");
      // AUD-32 (soft-404): unknown screen descriptors get a truthful 404.
      sendHtml(res, getScreenDescriptor(screenId) ? 200 : 404, html);
      return;
    }

    // J-RL1-08: Broadcast Schedule Review (UX-BR-012)
    if (pathname === "/broadcast/schedule/review" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const channel = urlObj.searchParams.get("channel") || undefined;
      const date = urlObj.searchParams.get("date") || undefined;
      const hasBlocker = urlObj.searchParams.get("blocker") !== "false";
      const html = renderMasterLayout(
        "Broadcast Schedule Review | VMNL",
        renderBroadcastScheduleReviewHtml({ channel, date, hasBlocker }),
        pathname,
        { operatorRole: sessionUser?.roles[0] || "MCRSupervisor", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-09: Rights Clearance & Waiver Request (UX-GOV-004)
    if (pathname === "/broadcast/rights/review-request" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const slotId = urlObj.searchParams.get("slotId") || undefined;
      const submitted = urlObj.searchParams.get("submitted") === "true";
      const html = renderMasterLayout(
        "Rights Waiver Request | VMNL",
        renderRightsReviewRequestHtml({ slotId, submitted }),
        pathname,
        { operatorRole: sessionUser?.roles[0] || "BroadcastRightsCoordinator", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-10: Proof-of-Air Exceptions Workbench (UX-BR-030 / UX-GOV-006)
    if ((pathname === "/broadcast/asrun/exceptions" || pathname === "/broadcast/poa/exceptions") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const resolvedId = urlObj.searchParams.get("resolvedId") || undefined;
      const html = renderMasterLayout(
        "Proof-of-Air Exceptions Workbench | VMNL",
        renderPoaExceptionsWorkbenchHtml({ resolvedId }),
        pathname,
        { operatorRole: sessionUser?.roles[0] || "CommercialTrafficOfficer", sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-11: Content Review & Syndication Publication (UX-CMS-001..008)
    if (pathname === "/workspace/content/review" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const publishedId = urlObj.searchParams.get("publishedId") || undefined;
      const html = renderMasterLayout(
        "Content Editorial Review | VMNL",
        renderContentReviewAndPublicationHtml({ publishedId }),
        pathname,
        { sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // J-RL1-14: Multi-Tier Governance & Approval Review (UX-GOV-001/002)
    if (pathname === "/workspace/approvals" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const urlObj = new URL(req.url || "/", "http://localhost");
      const decidedId = urlObj.searchParams.get("decidedId") || undefined;
      const errorCode = urlObj.searchParams.get("error") || undefined;
      const errorId = urlObj.searchParams.get("id") || undefined;
      const html = renderMasterLayout(
        "Governance & Approvals | VMNL",
        renderApprovalReviewHtml(sessionUser || undefined, { decidedId, error: errorCode, errorId }),
        pathname,
        { sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // -------------------------------------------------------------------------
    // Extended Workspaces & Counterparty Portals
    // -------------------------------------------------------------------------

    // UX-COM-006: Proposal Builder — renders canonical proposals only.
    if ((pathname === "/workspace/commercial/proposals/builder" || (pathname.startsWith("/workspace/commercial/proposals/") && pathname.endsWith("/builder"))) && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const proposalId = pathname === "/workspace/commercial/proposals/builder"
        ? parsedUrl.searchParams.get("proposalId") || undefined
        : pathname.replace("/workspace/commercial/proposals/", "").replace("/builder", "").trim();
      const store = context.proposalStore;
      const proposal = proposalId ? store?.getProposal(proposalId) : store?.listProposals().slice(-1)[0];
      if (proposalId && !proposal) {
        const html = renderMasterLayout(
          "Commercial Proposal Builder | VMNL",
          `<div class="vmn-card" style="max-width: 640px; margin: 40px auto; text-align: center; padding: 36px;">
            <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; margin-bottom: 8px;">Proposal not found</h2>
            <p style="color: var(--vmn-color-secondary-text);">No canonical proposal '${escapeHtml(proposalId)}' exists.</p>
            <a href="/workspace/commercial/proposals/builder" class="btn btn-primary" style="margin-top: 16px;">Open Proposal Builder</a>
          </div>`,
          pathname,
          { sessionUser }
        );
        sendHtml(res, 404, html);
        return;
      }
      const html = renderMasterLayout("Commercial Proposal Builder | VMNL", renderProposalBuilderHtml(proposal, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-COM-007: Interactive Quote Review — canonical proposal + deal state.
    if (pathname.startsWith("/workspace/commercial/proposals/") && pathname.endsWith("/quote") && method === "GET") {
      const proposalId = pathname.replace("/workspace/commercial/proposals/", "").replace("/quote", "").trim();
      const sessionUser = resolveSessionUser(req);
      const accepted = parsedUrl.searchParams.get("accepted") === "1";
      const error = parsedUrl.searchParams.get("error") || undefined;
      const proposal = context.proposalStore?.getProposal(proposalId);
      if (!proposal) {
        const html = renderMasterLayout("Commercial Quote Review | VMNL", renderQuoteReviewHtml(undefined, undefined, `No canonical proposal '${proposalId}' exists — quotes are issued only from created proposals.`), pathname, { sessionUser });
        sendHtml(res, 404, html);
        return;
      }
      const notice = accepted && proposal.status === "ACCEPTED"
        ? `Canonical deal ${proposal.dealId} reached CONTRACT_SIGNED via dual-authorisation sign-off.`
        : undefined;
      const html = renderMasterLayout("Commercial Quote Review | VMNL", renderQuoteReviewHtml(proposal, notice, error), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-004: Learning Plan & Syllabus Navigator
    if (pathname === "/workspace/afca/learning-plan" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout("AFCA Learning Plan | VMNL", renderLearningPlanHtml(), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-005: Student Assignment Video Submission
    if (pathname === "/workspace/afca/assignments/submit" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout("AFCA Assignment Submission | VMNL", renderAssignmentSubmissionHtml(), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-006: Faculty Grading Rubric
    if (pathname === "/workspace/afca/grading/rubric" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout("AFCA Faculty Grading Rubric | VMNL", renderFacultyGradingRubricHtml(), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFCA-008: Digital Certificate Generator
    if (pathname.startsWith("/workspace/afca/certificates/") && method === "GET") {
      const certId = pathname.replace("/workspace/afca/certificates/", "").trim();
      const sessionUser = resolveSessionUser(req);
      const html = renderMasterLayout("AFCA Digital Certificate | VMNL", renderCertificateGeneratorHtml(certId), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-ACC-001..008: Talent Accelerator Desk (SCR-18: TalentAcceleratorRegistry)
    if ((pathname === "/workspace/accelerator" || pathname === "/workspace/accelerator/desk") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const hubs = context.talentRegistry.listHubs().map((h) => ({
        id: h.id,
        name: h.name,
        state: h.state,
        leadCoordinator: h.leadCoordinator,
        activeTalentCount: h.activeTalentCount,
        isAccredited: h.isAccredited,
        facilitiesAvailable: h.facilitiesAvailable,
      }));
      const allTalent = context.talentRegistry.filterTalent({});
      const snapshot = {
        hubs,
        totalTalentCount: allTalent.length,
        verifiedTalentCount: allTalent.filter((t) => t.status === "VERIFIED").length,
        pipelineTalentCount: allTalent.filter((t) => t.status === "SUBMITTED" || t.status === "UNDER_REVIEW").length,
      };
      const html = renderMasterLayout("Talent Accelerator Desk | VMNL", renderTalentAcceleratorDeskHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AFC-001..006: Afro-Fusion Guilds Desk (SCR-18: AfroFusionCommunityHub)
    if ((pathname === "/workspace/community/guilds" || pathname === "/workspace/guilds") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = context.communityHub
        ? {
            locations: context.communityHub.getLocations().map((l) => ({ id: l.id, name: l.name, city: l.city, address: l.address, open: l.operatingHours.open, close: l.operatingHours.close })),
            resources: context.communityHub.listResources().map((r) => ({ id: r.id, name: r.name, type: r.type, hourlyRateNgn: r.hourlyRateNgn, minimumTierRequired: r.minimumTierRequired, isActive: r.isActive })),
            members: context.communityHub.listMembers().map((m) => ({ id: m.id, fullName: m.fullName, tier: m.tier, status: m.status, guilds: m.guilds })),
            bookings: context.communityHub.listBookings().map((b) => ({ id: b.id, resourceId: b.resourceId, memberId: b.memberId, status: b.status, totalCostNgn: b.totalCostNgn })),
          }
        : undefined;
      const html = renderMasterLayout("Afro-Fusion Guilds | VMNL", renderCommunityGuildsDeskHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-VTM-003..007, 012: VTM Matching Workbench (SCR-18: vtmEngine.matchTalent)
    if ((pathname === "/workspace/vtm/match" || pathname === "/workspace/vtm/matching") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const oppId = parsedUrl.searchParams.get("oppId") || "OPP-2026-88";
      let snapshot;
      const brief = context.vtmEngine.getBrief(oppId);
      if (brief) {
        const profiles = context.talentRegistry.filterTalent({});
        const matches = context.vtmEngine.matchTalent(
          oppId,
          profiles.map((p) => ({
            id: p.id,
            primaryCategory: p.primaryCategory,
            secondaryCategories: p.secondaryCategories,
            tier: p.tier,
            locationCity: p.locationCity,
          }))
        );
        snapshot = {
          brief: { id: brief.id, title: brief.title, roleCategory: brief.roleCategory, requiredTier: brief.requiredTier, locationCity: brief.locationCity, budgetPerDayNgn: brief.budgetPerDayNgn, buyoutTier: brief.buyoutTier },
          matches: matches.map((m) => {
            const profile = profiles.find((p) => p.id === m.talentId);
            const rateCard = context.vtmEngine.getRateCard(m.talentId);
            return {
              talentId: m.talentId,
              fullName: profile?.fullName || m.talentId,
              matchScorePercent: m.matchScorePercent,
              qualificationReasons: m.qualificationReasons,
              dayRateNgn: rateCard?.baseDayRateNgn ?? profile?.dayRateNgn,
              tier: profile?.tier || "EMERGING",
              status: profile?.status || "UNKNOWN",
            };
          }),
        };
      }
      const html = renderMasterLayout("VTM Matching Workbench | VMNL", renderVtmMatchingWorkbenchHtml(snapshot, oppId), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-ONE-001..009: ONE Studios Production Desk (SCR-18: OneStudiosEngine)
    if ((pathname === "/workspace/production/desk" || pathname === "/workspace/onestudios/desk") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = context.oneStudios
        ? {
            assets: context.oneStudios.getAvailableAssets().map((a) => ({ id: a.id, assetTag: a.assetTag, name: a.name, category: a.category, dailyRateNgn: a.dailyRateNgn, condition: a.condition, isAvailable: a.isAvailable })),
            bookings: [] as Array<{ id: string; productionName: string; assetIds: string[]; status: string; securityDepositNgn: number }>,
            callSheets: [] as Array<{ id: string; productionName: string; shootDate: string; generalCallTime: string; location: string; scenesCount: number }>,
          }
        : undefined;
      const html = renderMasterLayout("ONE Studios Production Desk | VMNL", renderOneStudiosProductionDeskHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-VCF-001..008: VCF Creator Missions (SCR-18: VirtualContentFundEngine)
    if ((pathname === "/workspace/vcf/missions" || pathname === "/workspace/foundry/missions") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = context.vcfEngine
        ? {
            pitches: context.vcfEngine.getAllPitches().map((p) => ({
              id: p.id,
              title: p.title,
              logline: p.logline,
              format: p.format,
              budgetEstimateNgn: p.budgetEstimateNgn,
              status: p.status,
              submittedAt: p.submittedAt.toISOString().substring(0, 10),
              compositeScore: p.evaluation?.compositeScore,
            })),
            activeSlate: context.vcfEngine.getActiveSlate().map((s) => ({ id: s.id, title: s.title, stage: s.stage, approvedBudgetNgn: s.approvedBudgetNgn, disbursedCapitalNgn: s.disbursedCapitalNgn })),
          }
        : undefined;
      const html = renderMasterLayout("VCF Creator Missions | VMNL", renderVcfCreatorMissionsHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-EVT-001..008: Fusion Events Desk (SCR-18: FusionEventsEngine + gate stats)
    if ((pathname === "/workspace/events/desk" || pathname === "/workspace/fusion-events") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = {
        events: context.eventsEngine.listEvents().map((e) => {
          const stats = context.eventsEngine.getGateStatistics(e.id);
          const totalSold = Object.values(stats.byTier).reduce((sum, t) => sum + t.sold, 0);
          const totalCheckedIn = Object.values(stats.byTier).reduce((sum, t) => sum + t.checkedIn, 0);
          return {
            id: e.id,
            name: e.name,
            category: e.category,
            venueName: e.venueName,
            venueCity: e.venueCity,
            eventDate: e.eventDate.toISOString().substring(0, 10),
            doorsOpenTime: e.doorsOpenTime,
            capacity: e.capacity,
            totalSold,
            totalCheckedIn,
          };
        }),
      };
      const html = renderMasterLayout("Fusion Events Stage & Gate | VMNL", renderFusionEventsDeskHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-TEND-001..008: TEND Syndication Catalogue (SCR-18: TendDistributionEngine)
    if ((pathname === "/workspace/tend/catalogue" || pathname === "/workspace/syndication/catalogue") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = context.tendEngine
        ? {
            titles: context.tendEngine.getCatalogueTitles().map((t) => ({ id: t.id, title: t.title, genre: t.genre, runningTimeMinutes: t.runningTimeMinutes, minimumLicenseFeeUsd: t.minimumLicenseFeeUsd, masterDeliveryStatus: t.masterDeliveryStatus })),
            licenses: context.tendEngine.listLicenses().map((l) => ({ id: l.id, titleId: l.titleId, licenseeName: l.licenseeName, territory: l.territory, medium: l.medium, isExclusive: l.isExclusive, startDate: l.startDate.toISOString().substring(0, 10), endDate: l.endDate.toISOString().substring(0, 10), licenseFeeUsd: l.licenseFeeUsd, paymentStatus: l.paymentStatus })),
          }
        : undefined;
      const html = renderMasterLayout("TEND Rights Syndication | VMNL", renderTendRightsDistributionHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-HSP-001..008: Headspace (SCR-18 tail: HeadspaceKnowledgeEngine catalogue)
    if ((pathname === "/workspace/headspace/intelligence" || pathname === "/workspace/market-intelligence") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const docs = context.headspace.listDocuments();
      const snapshot = {
        documents: docs.map((d) => ({ id: d.id, title: d.title, category: d.category, confidentiality: d.confidentiality, tags: d.tags, authorId: d.authorId, updatedAt: d.updatedAt.toISOString().substring(0, 10) })),
        totalDocuments: docs.length,
      };
      const html = renderMasterLayout("Headspace Strategic Intelligence | VMNL", renderHeadspaceIntelligenceHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-CR8-001..008: Cr8Tech (SCR-14/18 tail: honest NOT_CONFIGURED states)
    if ((pathname === "/workspace/cr8tech/operations" || pathname === "/workspace/devops/console") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const azeeboState = context.azeeboBridge.getCircuitState();
      const queueRunning = context.queueWorker?.getIsRunning() ?? false;
      const snapshot = [
        { name: "Azeebo+ Federation Bridge (HMAC webhook channel)", configured: true, detail: `Federation circuit: ${azeeboState}. Webhook delivery is signature-verified and circuit-breaker protected.`, state: "OPERATIONAL" as const },
        { name: "Enterprise Job Queue (EPG, notifications, reconciliation)", configured: true, detail: queueRunning ? "Background worker is running with registered job handlers." : "Background worker is stopped; jobs are queued for the next start.", state: "OPERATIONAL" as const },
        { name: "StarTimes Telemetry Ingest (DTT/DTH)", configured: false, detail: "NOT_CONFIGURED: no carriage telemetry adapter is connected — awaiting accountable owner integration (DEC-RL1-SCOPE-001 D-02).", state: "NOT_CONFIGURED" as const },
        { name: "Payment Processor Billing Core (Paystack / Flutterwave)", configured: false, detail: "NOT_CONFIGURED: production processor credentials are not provisioned in this environment.", state: "NOT_CONFIGURED" as const },
      ];
      const html = renderMasterLayout("Cr8Tech DevOps Console | VMNL", renderCr8TechOperationsHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-AGT-001..009: Agentic OS Console (SCR-18 tail: real AOS registry)
    if ((pathname === "/workspace/aos/console" || pathname === "/workspace/agentic-os") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const agents = context.aos.listAgents();
      const audit = context.aos.getAuditTrail();
      const snapshot = {
        agents: agents.map((a) => ({ id: a.id, name: a.name, role: a.role, operationalScope: a.operationalScope, allowedTools: a.allowedTools, actionsPerformedToday: a.actionsPerformedToday, maxDailyActions: a.maxDailyActions, status: a.status, killSwitchEngaged: a.killSwitchEngaged })),
        pendingProposals: context.aos.getPendingProposals().length,
        auditTrail: audit.map((r) => ({ id: r.id, agentId: r.agentId, actionTaken: r.actionTaken, wasBlocked: r.wasBlocked, timestamp: r.timestamp.toISOString() })),
        globalKillSwitchEngaged: agents.length > 0 && agents.every((a) => a.killSwitchEngaged || a.status !== "ACTIVE"),
      };
      const html = renderMasterLayout("Agentic OS Console | VMNL", renderAgenticOsConsoleHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-POR-003: Partner Portal (SCR-19: canonical deals scoped to org)
    if (pathname.startsWith("/portal/partner") && method === "GET") {
      const orgId = pathname.replace(/^\/portal\/partner\/?/, "").trim() || "ORG-PART-01";
      const sessionUser = resolveSessionUser(req);
      // SCR-19 tenant scoping: a non-staff caller may only see their own org.
      const relationship = getClientOrgRelationship(sessionUser, orgId);
      if (relationship === "FORBIDDEN") {
        const html = renderMasterLayout(
          "403 Forbidden - Partner Portal",
          `<div class="vmn-card" style="max-width: 600px; margin: 40px auto; text-align: center; padding: 36px;">
            <div class="vmn-badge badge-danger" style="margin-bottom: 12px; font-weight: 700;">COUNTERPARTY SCOPE ENFORCED</div>
            <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; margin-bottom: 8px;">Access Denied</h2>
            <p style="color: var(--vmn-color-secondary-text);">Your session does not hold a client relationship with organisation '${escapeHtml(orgId)}'. Portals render only your own organisation's canonical records.</p>
          </div>`,
          pathname,
          { shell: "identity", sessionUser }
        );
        sendHtml(res, 403, html);
        return;
      }
      const deals = context.salesEngine
        .listDeals()
        .filter((d) => d.clientOrgId === orgId || relationship === "STAFF_ACCESS")
        .map((d) => ({
          id: d.id,
          dealName: d.dealName,
          stage: d.stage,
          totalContractValueNgn: d.totalContractValueNgn,
          invoicedAmountNgn: d.invoicedAmountNgn,
          cashCollectedAmountNgn: d.cashCollectedAmountNgn,
          createdAt: d.createdAt.toISOString().substring(0, 10),
        }));
      const snapshot = { partnerOrgId: orgId, partnerName: orgId, deals };
      const html = renderMasterLayout("Strategic Partner Portal | VMNL", renderPartnerPortalHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-POR-004: Creator Portal (SCR-19: payout batches scoped to beneficiary)
    if (pathname.startsWith("/portal/creator") && method === "GET") {
      const creatorId = pathname.replace(/^\/portal\/creator\/?/, "").trim() || "CRT-2026-09";
      const sessionUser = resolveSessionUser(req);
      const settlements = context.payoutEngine
        .listBatches()
        .flatMap((b) =>
          b.items
            .filter((it) => it.beneficiaryId === creatorId)
            .map((it) => ({
              batchReference: b.batchReference,
              batchStatus: b.status,
              grossAmountNgn: it.grossAmountNgn,
              platformFeeNgn: it.platformFeeNgn,
              whtDeductionNgn: it.whtDeductionNgn,
              netDisbursementNgn: it.netDisbursementNgn,
              createdAt: b.createdAt.toISOString().substring(0, 10),
            }))
        );
      const snapshot = { creatorId, settlements };
      const html = renderMasterLayout("Creator Settlement Portal | VMNL", renderCreatorPortalHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-20 (UX-VTM-011): VTM Deployment Readiness & Payment Visibility.
    if (pathname === "/portal/vtm/payment-visibility" && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const projection = projectVtmPaymentVisibility(context.vtmEngine);
      const html = renderMasterLayout(
        "VTM Deployment Readiness & Payment Visibility | VMNL",
        renderVtmPaymentVisibilityHtml(projection, sessionUser || undefined),
        pathname,
        { sessionUser }
      );
      sendHtml(res, 200, html);
      return;
    }

    // UX-POR-005: Vendor Portal (SCR-19: canonical POs only — honest empty)
    if (pathname.startsWith("/portal/vendor") && method === "GET") {
      const vendorId = pathname.replace(/^\/portal\/vendor\/?/, "").trim() || "VND-2026-04";
      const sessionUser = resolveSessionUser(req);
      const snapshot = { vendorId, vendorName: vendorId, purchaseOrders: [] as Array<{ poNumber: string; description: string; amountNgn: number; dateIssued: string; paymentTerms: string; status: string }> };
      const html = renderMasterLayout("Vendor Procurement Portal | VMNL", renderVendorPortalHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-HUB-004: Management Overview (SCR-19: computed from canonical engines)
    if ((pathname === "/workspace/management/overview" || pathname === "/workspace/hub/overview") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const deals = context.salesEngine.listDeals();
      const talent = context.talentRegistry.filterTalent({});
      const snapshot = {
        broadcastChannels: getAllActiveChannels().length,
        openBroadcastIncidents: 0,
        salesPipeline: {
          deals: deals.length,
          contractValueNgn: deals.reduce((s, d) => s + d.totalContractValueNgn, 0),
          cashCollectedNgn: deals.reduce((s, d) => s + d.cashCollectedAmountNgn, 0),
          recognizedRevenueNgn: deals.reduce((s, d) => s + d.recognizedRevenueNgn, 0),
        },
        totalTalent: talent.length,
        verifiedTalent: talent.filter((t) => t.status === "VERIFIED").length,
        academyCertificates: 0,
      };
      const html = renderMasterLayout("Management Hub Overview | VMNL", renderManagementOverviewHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-REC-004: Risk Register (SCR-19: core/work domain records)
    if ((pathname === "/workspace/governance/risks" || pathname === "/workspace/risk/register") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = {
        risks: listRisks().map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          likelihood: r.likelihood,
          impact: r.impact,
          mitigation: r.mitigation,
          owner: r.owner,
          status: r.status,
          reviewDueAt: r.reviewDueAt.toISOString().substring(0, 10),
        })),
      };
      const html = renderMasterLayout("Enterprise Risk Register | VMNL", renderRiskRegisterHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // UX-REC-005: Issue Tracker (SCR-19: core/work domain records)
    if ((pathname === "/workspace/governance/issues" || pathname === "/workspace/issues/tracker") && method === "GET") {
      const sessionUser = resolveSessionUser(req);
      const snapshot = {
        issues: listIssues().map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          severity: i.severity,
          raisedBy: i.raisedBy,
          assignedTo: i.assignedTo,
          status: i.status,
          createdAt: i.createdAt.toISOString().substring(0, 19).replace("T", " "),
        })),
      };
      const html = renderMasterLayout("Operational Issue Tracker | VMNL", renderIssueTrackerHtml(snapshot, sessionUser || undefined), pathname, { sessionUser });
      sendHtml(res, 200, html);
      return;
    }

    // AUD-32: Unmatched workspace sub-routes fall back to truthful 404
    if (pathname.startsWith("/workspace/") && method === "GET") {
      const deskKey = pathname.replace("/workspace/", "").trim();
      const html = renderMasterLayout(`Workspace / ${deskKey}`, renderWorkspaceDeskHtml(deskKey), "/workspace");
      sendHtml(res, 404, html);
      return;
    }

    // Match any of the 33 operational broadcast screen routes (T-19, B-15, R1.2A §46, T9-01)
    if (pathname.startsWith("/broadcast/") && method === "GET") {
      const match = matchBroadcastScreen(pathname);
      if (match) {
        const user = resolveSessionUser(req);
        if (!user) {
          const unauthorizedHtml = renderMasterLayout(
            `401 Unauthorized - ${match.screen.name}`,
            `<div class="vmn-card" style="max-width: 600px; margin: 40px auto; text-align: center; padding: 36px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg);">
              <div class="vmn-badge badge-warning" style="margin-bottom: 12px; font-weight: 700;">AUTHENTICATION REQUIRED</div>
              <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; margin-bottom: 8px;">Sign In Required</h2>
              <p style="color: var(--vmn-color-secondary-text); margin-bottom: 24px; line-height: 1.5;">An authenticated operator session is required to access broadcast operational desk <strong>${escapeHtml(match.screen.name)}</strong>.</p>
              <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <a href="/sign-in?returnUrl=${encodeURIComponent(pathname)}" class="btn btn-primary" style="min-height: 44px; padding: 0 24px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center;">Sign In to Workstation &rarr;</a>
                <a href="/broadcast/screens" class="btn btn-secondary" style="min-height: 44px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center;">Back to Directory</a>
              </div>
            </div>`,
            pathname,
            { shell: "identity" }
          );
          sendHtml(res, 401, unauthorizedHtml);
          return;
        }

        // AUD-12: evaluate screen access against ALL of the user's roles, not
        // just the first one — multi-role operators must not lose access they
        // legitimately hold via a secondary role.
        const userRole = user.roles.find((role) => isRoleAuthorizedForScreen(role, match.screen));
        const authorized = userRole !== undefined;

        if (!authorized) {
          const deniedHtml = renderMasterLayout(
            `403 Forbidden - ${match.screen.name}`,
            renderAccessDeniedHtml(user, `${match.screen.primaryRole} or Executive clearance`, pathname),
            pathname,
            { shell: "identity", sessionUser: user }
          );
          sendHtml(res, 403, deniedHtml);
          return;
        }

        const screenHtml = renderMasterLayout(
          match.screen.name,
          renderBroadcastScreenHtml(match.screen, match.params, userRole),
          pathname,
          { operatorRole: userRole, sessionUser: user }
        );
        sendHtml(res, 200, screenHtml);
        return;
      }
    }

    if ((pathname === "/docs" || pathname === "/api/docs") && method === "GET") {
      const html = renderMasterLayout("API Documentation", renderDocsHtml(), "/docs");
      sendHtml(res, 200, html);
      return;
    }

    if (pathname === "/api/v1/openapi.json" && method === "GET") {
      sendJson(res, 200, OPENAPI_SPEC);
      return;
    }

    // 1. Healthz & Readiness
    if (pathname === "/healthz" && method === "GET") {
      context.telemetry.recordMetric("http_requests_total", 1, { path: "/healthz", status: "200" });
      sendJson(res, 200, {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
      return;
    }

    if (pathname === "/readyz" && method === "GET") {
      const dbCheck = await checkDatabaseConnection();
      const storageCheck = await checkStorageReady();
      const isDbConnected = dbCheck.connected;
      const isStorageReady = storageCheck.ready;
      // AUD-09: storage is part of the readiness contract. A broken object
      // store means DAM uploads cannot succeed, so the pod is not "ready" to
      // receive upload traffic. Storage becomes non-gating ONLY when an
      // operator explicitly opts out (STORAGE_READINESS_GATING=false).
      const storageGatingEnabled = process.env.STORAGE_READINESS_GATING !== "false";
      const isReady = isDbConnected && (!storageGatingEnabled || isStorageReady);
      const httpStatus = isReady ? 200 : 503;

      context.telemetry.recordMetric("http_requests_total", 1, { path: "/readyz", status: String(httpStatus) });
      sendJson(res, httpStatus, {
        status: isReady ? "ready" : "unavailable",
        checks: {
          database: isDbConnected ? "connected" : "unavailable",
          databaseLatencyMs: dbCheck.latencyMs,
          databaseError: dbCheck.error || null,
          playout: "not_probed",
          storage: isStorageReady ? "ready" : "unavailable",
          storageGating: storageGatingEnabled ? "enforced" : "disabled",
          storageDriver: storageCheck.driver,
          federationBridge: context.azeeboBridge.getCircuitState(),
          queueWorker: context.queueWorker ? (context.queueWorker.getIsRunning() ? "running" : "idle") : "disabled",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Prometheus Metrics Endpoint
    if (pathname === "/metrics" && method === "GET") {
      if (context.queueWorker) {
        const qm = context.queueWorker.getMetrics();
        context.telemetry.recordMetric("queue_total_enqueued", qm.totalEnqueued);
        context.telemetry.recordMetric("queue_total_processed", qm.totalProcessed);
        context.telemetry.recordMetric("queue_total_failed", qm.totalFailed);
        context.telemetry.recordMetric("queue_total_dead_letter", qm.totalDeadLetter);
        context.telemetry.recordMetric("queue_active_count", qm.activeCount);
        context.telemetry.recordMetric("queue_pending_count", qm.pendingCount);
      }
      const metricsText = context.telemetry.exportPrometheusMetrics();
      sendText(res, 200, metricsText, "text/plain; version=0.0.4");
      return;
    }

    // 2.5 Authentication & Session Endpoints (B-7)
    if (pathname === "/api/v1/auth/login" && method === "POST") {
      const clientIp = resolveClientIp(req);
      const rate = checkRateLimit(`login:${clientIp}`, 10, 60_000);
      if (!rate.allowed) {
        sendJson(res, 429, {
          error: "Too Many Requests",
          message: "Login rate limit exceeded. Please wait before retrying.",
          retryAfterMs: rate.resetInMs,
        });
        return;
      }

      const body = await parseJsonBody(req, pathname);
      if (!body.email || !body.password) {
        sendJson(res, 400, { error: "Bad Request", message: "Email and password are required" });
        return;
      }

      // Authentic credential verification with real bcrypt password verification against stored credentials (CR-1)
      // plus per-account exponential lockout after repeated failures (AUD-05).
      const { user, lockedForMs } = await authenticateUser(body.email, body.password);
      if (!user) {
        recordAuditLog({
          action: "auth.login.failed",
          resource: "auth",
          changes: {
            email: body.email,
            reason: lockedForMs > 0 ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS",
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        // Uniform 401 response body regardless of lockout state (no account
        // enumeration); retry-after metadata is exposed only via header.
        if (lockedForMs > 0) {
          res.setHeader("Retry-After", String(Math.ceil(lockedForMs / 1000)));
        }
        sendJson(res, 401, {
          error: "Unauthorized",
          message: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      recordAuditLog({
        userId: user.userId,
        action: "auth.login.success",
        resource: "auth",
        resourceId: user.userId,
        changes: { email: user.email, roles: user.roles },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      const tokens = signSessionToken(user);
      res.setHeader("Set-Cookie", createSessionCookie(tokens.accessToken));
      sendJson(res, 200, {
        success: true,
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      });
      return;
    }

    if ((pathname === "/api/v1/auth/revoke" || pathname === "/api/v1/auth/logout") && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      // AUD-22: only the caller's own presented token may be revoked. The
      // presented token comes from the Authorization header or session cookie;
      // a token supplied in the body is honoured only if it matches the
      // presented one, so one bearer cannot revoke another bearer's token.
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
      const cookieMatch = (req.headers["cookie"] as string | undefined)?.match(/vmnl_session=([^;]+)/);
      const ownToken = bearerToken || cookieMatch?.[1];
      const token =
        typeof body.token === "string" && body.token === ownToken ? body.token : ownToken;
      const sessionUser = resolveSessionUser(req);
      const clientIp = resolveClientIp(req);

      if (token) {
        revokeToken(token);
      }
      recordAuditLog({
        userId: sessionUser?.userId || null,
        action: "auth.revoke",
        resource: "auth",
        resourceId: token || "session",
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      res.setHeader("Set-Cookie", "vmnl_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
      sendJson(res, 200, { success: true, message: "Token successfully revoked and session terminated" });
      return;
    }

    // 2.7 Audit Ledger Endpoints (T9-03, F-9-03)
    if (pathname === "/api/v1/audit/logs" && method === "GET") {
      const user = resolveSessionUser(req);
      const authorizedRoles = ["Auditor", "FinanceController", "SuperAdmin", "ExecutiveLeader"];
      const isAuthorized = user && user.roles.some((r) => authorizedRoles.includes(r));
      if (!isAuthorized) {
        sendJson(res, 403, { error: "Forbidden", message: "Auditor or Finance authorization required to view audit trail" });
        return;
      }
      const parsed = parsedUrl.searchParams;
      const resource = parsed.get("resource") || undefined;
      const action = parsed.get("action") || undefined;
      const userId = parsed.get("userId") || undefined;
      const limit = parsed.get("limit") ? parseInt(parsed.get("limit")!, 10) : 50;

      const logs = getAuditLogs({ resource, action, userId, limit });
      sendJson(res, 200, { logs, count: logs.length });
      return;
    }

    if (pathname === "/api/v1/audit/verify" && method === "GET") {
      const user = resolveSessionUser(req);
      const authorizedRoles = ["Auditor", "FinanceController", "SuperAdmin", "ExecutiveLeader", "MCRSupervisor"];
      const isAuthorized = user && user.roles.some((r) => authorizedRoles.includes(r));
      if (!isAuthorized) {
        sendJson(res, 403, { error: "Forbidden", message: "Auditor or Executive authorization required to verify audit chain" });
        return;
      }
      const integrity = verifyAuditLogChainIntegrity();
      sendJson(res, 200, integrity);
      return;
    }

    // 2.8 Feature Flag Management & Release Configuration (UX-ADM-004)
    if (pathname === "/api/v1/feature-flags" && method === "GET") {
      const flags = getAllFeatureFlags();
      sendJson(res, 200, { status: "SUCCESS", flags, count: Object.keys(flags).length });
      return;
    }

    if (pathname.startsWith("/api/v1/feature-flags/") && pathname.endsWith("/toggle") && method === "POST") {
      const key = pathname.replace("/api/v1/feature-flags/", "").replace("/toggle", "").trim() as FeatureFlagKey;
      let body: any = {};
      try {
        const contentType = req.headers["content-type"] || "";
        if (contentType.includes("application/json")) {
          body = await parseJsonBody(req, pathname);
        } else {
          const raw = await parseRawBody(req, pathname);
          const params = new URLSearchParams(raw);
          body = Object.fromEntries(params.entries());
        }
      } catch (_err) {
        body = {};
      }

      const user = resolveSessionUser(req);
      const actor = user?.email || user?.userId || "admin:ui";
      const targetEnabled = body.enabled === "true" || body.enabled === true;
      const updated = await setFeatureFlagOverride(key, targetEnabled, actor, body.reason || "Toggled via UX-ADM-004");

      if (body.redirect) {
        res.writeHead(302, { Location: body.redirect });
        res.end();
        return;
      }
      sendJson(res, 200, { status: "SUCCESS", flag: updated });
      return;
    }

    if (pathname.startsWith("/api/v1/feature-flags/") && method === "GET") {
      const key = pathname.replace("/api/v1/feature-flags/", "").trim() as FeatureFlagKey;
      try {
        const state = getFeatureFlagState(key);
        sendJson(res, 200, { status: "SUCCESS", flag: state });
      } catch (err: any) {
        sendJson(res, 404, { error: "Not Found", message: err.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/feature-flags/") && (method === "PATCH" || method === "POST")) {
      const key = pathname.replace("/api/v1/feature-flags/", "").trim() as FeatureFlagKey;
      try {
        const body = await parseJsonBody(req, pathname);
        const user = resolveSessionUser(req);
        const actor = user?.email || user?.userId || "admin:api";
        const updated = await setFeatureFlagOverride(key, Boolean(body.enabled), actor, body.reason);
        sendJson(res, 200, { status: "SUCCESS", flag: updated });
      } catch (err: any) {
        sendJson(res, 400, { error: "Bad Request", message: err.message });
      }
      return;
    }

    // 2.9 Commercial Enquiry Intake & Status Recovery (VS-RL1-01 / HX-01 / UX-PUB-025 / UX-COM-004)
    if (pathname === "/api/v1/enquiries" && method === "POST") {
      try {
        const contentType = req.headers["content-type"] || "";
        let body: any;
        if (contentType.includes("application/json")) {
          body = await parseJsonBody(req, pathname);
        } else {
          const raw = await parseRawBody(req, pathname);
          const params = new URLSearchParams(raw);
          body = Object.fromEntries(params.entries());
        }

        const idempotencyKey = (req.headers["x-idempotency-key"] as string) || body.idempotencyKey;
        const result = await submitCommercialEnquiry(
          {
            ...body,
            idempotencyKey,
          },
          clientIp
        );

        sendJson(res, result.duplicate ? 200 : 201, {
          status: "SUCCESS",
          duplicate: result.duplicate,
          enquiry: result.enquiry,
        });
      } catch (err: any) {
        const statusCode = err.statusCode || (err.code === "FEATURE_DISABLED" ? 403 : 400);
        sendJson(res, statusCode, {
          error: err.name || "Bad Request",
          message: err.message,
          code: err.code,
          field: err.field,
        });
      }
      return;
    }

    if (pathname === "/api/v1/enquiries/recovery" && method === "GET") {
      const key = parsedUrl.searchParams.get("key") || parsedUrl.searchParams.get("idempotencyKey");
      if (!key) {
        sendJson(res, 400, { error: "Bad Request", message: "Idempotency key parameter required for recovery" });
        return;
      }
      const record = recoverEnquiryOutcome(key);
      if (!record) {
        sendJson(res, 404, { error: "Not Found", message: `No enquiry outcome found for idempotency key '${key}'` });
        return;
      }
      sendJson(res, 200, { status: "SUCCESS", enquiry: record });
      return;
    }

    if (pathname === "/api/v1/enquiries" && method === "GET") {
      const vertical = parsedUrl.searchParams.get("vertical") as any;
      const enquiries = listEnquiries(vertical || undefined);
      sendJson(res, 200, { enquiries, count: enquiries.length });
      return;
    }

    if (pathname.startsWith("/api/v1/enquiries/") && pathname.endsWith("/retry-routing") && method === "POST") {
      const reference = pathname.replace("/api/v1/enquiries/", "").replace("/retry-routing", "").trim();
      try {
        const updated = await retryDownstreamRouting(reference);
        sendJson(res, 200, { status: "SUCCESS", enquiry: updated });
      } catch (err: any) {
        sendJson(res, 400, { error: "Bad Request", message: err.message });
      }
      return;
    }

    // AFCA Admissions Endpoints (UX-APP-001 to 008 / Phase 5)
    if (pathname === "/api/v1/applications/draft" && method === "POST") {
      try {
        const body = await parseJsonBody(req);
        const result = await AfcaAdmissionsService.saveDraft(body);
        sendJson(res, 200, { success: true, ...result });
      } catch (err: any) {
        const status = err.statusCode || (err.message.includes("VMNL-FEATURE-DISABLED") ? 403 : 400);
        sendJson(res, status, { error: "Submission Error", message: err.message });
      }
      return;
    }

    if (pathname === "/api/v1/applications/submit" && method === "POST") {
      try {
        const contentType = req.headers["content-type"] || "";
        let body: any;
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const formText = await parseRawBody(req, pathname);
          const params = new URLSearchParams(formText);
          body = Object.fromEntries(params.entries());
          body.financialAidRequested = body.financialAidRequested === "true";
        } else {
          body = await parseJsonBody(req, pathname);
        }

        const submission = await AfcaAdmissionsService.submitApplication(body);

        if (contentType.includes("application/x-www-form-urlencoded")) {
          // Redirect to status tracker on browser form submit
          res.writeHead(303, { Location: `/apply/status/${submission.reference}` });
          res.end();
          return;
        }

        sendJson(res, 201, { status: "SUCCESS", application: submission });
      } catch (err: any) {
        const status = err.statusCode || (err.message.includes("VMNL-FEATURE-DISABLED") ? 403 : 400);
        sendJson(res, status, { error: "Application Error", message: err.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/applications/") && method === "GET") {
      const reference = pathname.replace("/api/v1/applications/", "").trim();
      const app = await AfcaAdmissionsService.getByReference(reference);
      if (app) {
        sendJson(res, 200, { status: "SUCCESS", application: app });
      } else {
        sendJson(res, 404, { error: "Not Found", message: `Application ${reference} not found` });
      }
      return;
    }

    if (pathname === "/api/v1/admissions/queue" && method === "GET") {
      try {
        const status = parsedUrl.searchParams.get("status") as any || undefined;
        const creativeTrack = parsedUrl.searchParams.get("creativeTrack") as any || undefined;
        const queue = await AfcaAdmissionsService.listQueue({ status, creativeTrack });
        sendJson(res, 200, { status: "SUCCESS", count: queue.length, queue });
      } catch (err: any) {
        const status = err.statusCode || (err.message.includes("VMNL-FEATURE-DISABLED") ? 403 : 400);
        sendJson(res, status, { error: "Queue Error", message: err.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/admissions/") && pathname.endsWith("/decision") && method === "POST") {
      const reference = pathname.replace("/api/v1/admissions/", "").replace("/decision", "").trim();
      try {
        const body = await parseJsonBody(req);
        const updated = await AfcaAdmissionsService.recordDecision({
          reference,
          reviewerId: body.reviewerId || "SYSTEM",
          decision: body.decision,
          notes: body.notes || "",
          scores: body.scores,
        });
        sendJson(res, 200, { status: "SUCCESS", application: updated });
      } catch (err: any) {
        const status = err.statusCode || (err.message.includes("VMNL-FEATURE-DISABLED") ? 403 : 400);
        sendJson(res, status, { error: "Decision Error", message: err.message });
      }
      return;
    }

    // VTM Contract Digital Signing (UX-VTM-010)
    if (pathname.startsWith("/api/v1/vtm/contracts/") && pathname.endsWith("/sign") && method === "POST") {
      const contractId = pathname.replace("/api/v1/vtm/contracts/", "").replace("/sign", "").trim();
      try {
        const contentType = req.headers["content-type"] || "";
        let legalSignature = "";
        let termsAffirmation = false;
        let idempotencyKey = "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const formText = await parseRawBody(req, pathname);
          const params = new URLSearchParams(formText);
          legalSignature = params.get("legalSignature") || "";
          termsAffirmation = params.get("termsAffirmation") === "true";
          idempotencyKey = params.get("idempotencyKey") || "";
        } else {
          const body = await parseJsonBody(req, pathname);
          legalSignature = body.legalSignature || "";
          termsAffirmation = Boolean(body.termsAffirmation);
          idempotencyKey = body.idempotencyKey || "";
        }

        if (!legalSignature || !termsAffirmation) {
          throw new Error("Validation failed: legalSignature and termsAffirmation are mandatory.");
        }

        // (TODO-SEC-08): signature replay protection — the same operation
        // key returns the original acceptance result instead of minting a
        // second hash for the same contract.
        const vtmIdemKey = idempotencyKey ? `vtm-sign:${contractId}:${idempotencyKey}` : undefined;
        const vtmReplay = checkIdempotency(vtmIdemKey);
        if (vtmReplay.status === "recorded") {
          const recorded = (vtmReplay.record.responseBody ?? {}) as { signedHash?: string; signedAt?: string };
          if (contentType.includes("application/x-www-form-urlencoded")) {
            res.writeHead(303, { Location: `/vtm/terms?signed=true&replay=true` });
            res.end();
            return;
          }
          sendJson(res, 200, {
            status: "SUCCESS",
            contractId,
            isSigned: true,
            signedHash: recorded.signedHash,
            signedAt: recorded.signedAt,
            replay: true,
          });
          return;
        }

        const signedHash = crypto
          .createHash("sha256")
          .update(`${contractId}:${legalSignature}:${Date.now()}`)
          .digest("hex");

        await recordAuditLog({
          action: "VTM_CONTRACT_DIGITALLY_SIGNED",
          resource: "vtm_contract",
          resourceId: contractId,
          tenantId: "vtm_talent",
          changes: {
            contractId,
            legalSignature,
            signedHash,
            termsAffirmed: true,
          },
        });

        const signedAtIso = new Date().toISOString();
        if (vtmIdemKey) recordIdempotentOutcome(vtmIdemKey, "SUCCESS", { signedHash, signedAt: signedAtIso });

        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/vtm/terms?signed=true` });
          res.end();
          return;
        }

        sendJson(res, 200, {
          status: "SUCCESS",
          contractId,
          isSigned: true,
          signedHash,
          signedAt: signedAtIso,
        });
      } catch (err: any) {
        sendJson(res, 400, { error: "Signature Error", message: err.message });
      }
      return;
    }

    // J-RL1-07: Client Project Question Submission
    if (pathname.startsWith("/api/v1/client/projects/") && pathname.endsWith("/questions") && method === "POST") {
      const projectId = pathname.replace("/api/v1/client/projects/", "").replace("/questions", "").trim();
      const contentType = req.headers["content-type"] || "";
      let topic = "GENERAL";
      let priority = "NORMAL";
      let contactEmail = "";
      let message = "";
      let orgId = "org-dangote";
      let idempotencyKey: string | undefined;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        topic = params.get("topic") || topic;
        priority = params.get("priority") || priority;
        contactEmail = params.get("contactEmail") || contactEmail;
        message = params.get("message") || message;
        orgId = params.get("orgId") || orgId;
        idempotencyKey = params.get("idempotencyKey") || undefined;
      } else {
        const body = await parseJsonBody(req, pathname);
        topic = body.topic || topic;
        priority = body.priority || priority;
        contactEmail = body.contactEmail || contactEmail;
        message = body.message || message;
        orgId = body.orgId || orgId;
        idempotencyKey = body.idempotencyKey || undefined;
      }

      // (TODO-SEC-08): duplicate-question dedupe — the same operation key
      // returns the original ticket instead of minting a new one.
      const questionIdemKey = idempotencyKey ? `client-question:${projectId}:${idempotencyKey}` : undefined;
      const questionReplay = checkIdempotency(questionIdemKey);
      if (questionReplay.status === "recorded") {
        const recorded = (questionReplay.record.responseBody ?? {}) as { ticketId?: string };
        const replayTicket = recorded.ticketId || questionReplay.record.outcome;
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, {
            Location: `/portal/client/organisations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}?notice=${encodeURIComponent(`Inquiry already logged under ticket ${replayTicket}`)}`,
          });
          res.end();
          return;
        }
        sendJson(res, 200, { status: "SUCCESS", ticketId: replayTicket, projectId, replay: true });
        return;
      }

      const ticketId = `INQ-2026-${Math.floor(Math.random() * 90000 + 10000)}`;
      if (questionIdemKey) recordIdempotentOutcome(questionIdemKey, ticketId, { ticketId });
      await recordAuditLog({
        action: "CLIENT_DISCREPANCY_INQUIRY_SUBMITTED",
        resource: "client_project",
        resourceId: projectId,
        tenantId: orgId,
        changes: { topic, priority, contactEmail, message, ticketId },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, {
          Location: `/portal/client/organisations/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}?notice=${encodeURIComponent(`Inquiry logged under ticket ${ticketId}`)}`,
        });
        res.end();
        return;
      }

      sendJson(res, 200, {
        status: "SUCCESS",
        ticketId,
        projectId,
        message: "Transmission inquiry logged to Commercial Traffic Desk",
      });
      return;
    }

    // J-RL1-09: Rights Waiver & Clearance Request
    if (pathname === "/api/v1/broadcast/rights/review-requests" && method === "POST") {
      const contentType = req.headers["content-type"] || "";
      let slotId = "SLOT-4102";
      let carrier = "STARTIMES_DTT";
      let distributor = "";
      let justification = "";
      let idempotencyKey: string | undefined;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        slotId = params.get("slotId") || slotId;
        carrier = params.get("carrier") || carrier;
        distributor = params.get("distributor") || distributor;
        justification = params.get("justification") || justification;
        idempotencyKey = params.get("idempotencyKey") || undefined;
      } else {
        const body = await parseJsonBody(req, pathname);
        slotId = body.slotId || slotId;
        carrier = body.carrier || carrier;
        distributor = body.distributor || distributor;
        justification = body.justification || justification;
        idempotencyKey = body.idempotencyKey || undefined;
      }

      // (TODO-SEC-08): duplicate-request dedupe for expedited rights review.
      const rightsIdemKey = idempotencyKey ? `rights-review:${slotId}:${idempotencyKey}` : undefined;
      const rightsReplay = checkIdempotency(rightsIdemKey);
      if (rightsReplay.status === "recorded") {
        const recorded = (rightsReplay.record.responseBody ?? {}) as { ticketId?: string };
        const replayTicket = recorded.ticketId || rightsReplay.record.outcome;
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: "/broadcast/rights/review-request?submitted=true&replay=true" });
          res.end();
          return;
        }
        sendJson(res, 200, { status: "SUCCESS", ticketId: replayTicket, slotId, replay: true });
        return;
      }

      const ticketId = `RW-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
      if (rightsIdemKey) recordIdempotentOutcome(rightsIdemKey, ticketId, { ticketId });
      await recordAuditLog({
        action: "EXPEDITED_RIGHTS_WAIVER_REQUESTED",
        resource: "rights",
        resourceId: slotId,
        changes: { slotId, carrier, distributor, justification, ticketId },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: "/broadcast/rights/review-request?submitted=true" });
        res.end();
        return;
      }

      sendJson(res, 200, {
        status: "SUCCESS",
        ticketId,
        slotId,
        message: "Emergency rights review ticket created",
      });
      return;
    }

    // J-RL1-10: Proof-of-Air Exception Resolution
    if (pathname.startsWith("/api/v1/broadcast/asrun/exceptions/") && pathname.endsWith("/resolve") && method === "POST") {
      const exceptionId = pathname.replace("/api/v1/broadcast/asrun/exceptions/", "").replace("/resolve", "").trim();
      const contentType = req.headers["content-type"] || "";
      let resolutionType = "APPROVE_MAKE_GOOD";

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        resolutionType = params.get("resolutionType") || resolutionType;
      } else {
        const body = await parseJsonBody(req, pathname);
        resolutionType = body.resolutionType || resolutionType;
      }

      await recordAuditLog({
        action: "POA_EXCEPTION_RESOLVED",
        resource: "broadcast_asrun",
        resourceId: exceptionId,
        changes: { exceptionId, resolutionType },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/broadcast/asrun/exceptions?resolvedId=${encodeURIComponent(exceptionId)}` });
        res.end();
        return;
      }

      sendJson(res, 200, { status: "SUCCESS", exceptionId, resolutionType });
      return;
    }

    // J-RL1-11: Content Review & Publication — real CMS revision domain
    // (TODO-SCR-01/02): publication requires an APPROVED revision, a publisher
    // distinct from the author, and a verified destination when federated.
    if (pathname.startsWith("/api/v1/workspace/content/") && pathname.endsWith("/publish") && method === "POST") {
      const contentId = pathname.replace("/api/v1/workspace/content/", "").replace("/publish", "").trim();
      const contentType = req.headers["content-type"] || "";
      const sessionUser = resolveSessionUser(req);
      let destinationId: string | undefined;
      let idempotencyKey: string | undefined;
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        destinationId = params.get("destinationId") || undefined;
        idempotencyKey = params.get("idempotencyKey") || undefined;
      } else {
        const body = await parseJsonBody(req, pathname);
        destinationId = body.destinationId || undefined;
        idempotencyKey = body.idempotencyKey || undefined;
      }

      // (TODO-SEC-08): publication idempotency — a replayed publish returns
      // the original revision instead of re-publishing.
      const publishIdemKey = idempotencyKey ? `content-publish:${contentId}:${idempotencyKey}` : undefined;
      const publishReplay = checkIdempotency(publishIdemKey);
      if (publishReplay.status === "recorded") {
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/content/review?publishedId=${encodeURIComponent(contentId)}` });
          res.end();
          return;
        }
        sendJson(res, 200, { ...((publishReplay.record.responseBody ?? {}) as object), status: "SUCCESS", contentId, replay: true });
        return;
      }

      const item = getContent(contentId);
      if (!item) {
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/content/review?error=CMS_NOT_FOUND&id=${encodeURIComponent(contentId)}` });
          res.end();
          return;
        }
        sendJson(res, 404, { status: "REJECTED", contentId, code: "CMS_NOT_FOUND", message: "No content item exists for this reference." });
        return;
      }

      try {
        if (destinationId && item.destinationId !== destinationId) {
          // Destination is a publication property; verified via the registry.
          if (!isVerifiedDestination(destinationId)) {
            throw new Error(`[CMS-10] Destination '${destinationId}' is not a verified Azeebo+ destination.`);
          }
          item.destinationId = destinationId;
        }
        const { publication } = publishContent({
          id: contentId,
          publisherId: sessionUser?.userId || "anonymous",
          destinationRegistry: { isVerified: isVerifiedDestination },
        });

        await recordAuditLog({
          userId: sessionUser?.userId || null,
          action: "CONTENT_EDITORIAL_PUBLISHED",
          resource: "content_item",
          resourceId: contentId,
          changes: {
            contentId,
            revision: publication.revision,
            publishedBy: sessionUser?.email || "anonymous",
            destinationId: publication.destinationId || null,
          },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });

        const publishOutcome = {
          status: "SUCCESS",
          contentId,
          published: true,
          revision: publication.revision,
          publishedBy: publication.publishedBy,
        };
        if (publishIdemKey) recordIdempotentOutcome(publishIdemKey, "SUCCESS", publishOutcome);

        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/content/review?publishedId=${encodeURIComponent(contentId)}` });
          res.end();
          return;
        }
        sendJson(res, 200, publishOutcome);
        return;
      } catch (err: any) {
        const code = (err?.message?.match(/\[(CMS-\d+)\]/)?.[1] || "CMS_ERROR") as string;
        await recordAuditLog({
          userId: sessionUser?.userId || null,
          action: "CONTENT_EDITORIAL_PUBLISH_REJECTED",
          resource: "content_item",
          resourceId: contentId,
          changes: { contentId, code, message: err?.message },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/content/review?error=${encodeURIComponent(code)}&id=${encodeURIComponent(contentId)}` });
          res.end();
          return;
        }
        const forbidden = code === "CMS-09" || code === "CMS-10";
        sendJson(res, forbidden ? 403 : 422, { status: "REJECTED", contentId, code, message: err?.message });
        return;
      }
    }

    // UX-CMS-001a: content lifecycle mutations (create / edit / review / approve / withdraw)
    if (pathname === "/api/v1/workspace/content" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "content");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      try {
        const item = createContent({
          id: body.id || `CNT-${Date.now().toString(36).toUpperCase()}`,
          title: String(body.title || ""),
          slug: String(body.slug || ""),
          summary: String(body.summary || ""),
          body: String(body.body || ""),
          relatedUnit: String(body.relatedUnit || "VMNL"),
          mediaAssetIds: Array.isArray(body.mediaAssetIds) ? body.mediaAssetIds.map(String) : undefined,
          claimSources: Array.isArray(body.claimSources) ? body.claimSources.map(String) : undefined,
          alternativeText: body.alternativeText ? String(body.alternativeText) : undefined,
          authorId: user.userId,
        });
        recordAuditLog({
          userId: user.userId,
          action: "CONTENT_CREATED",
          resource: "content_item",
          resourceId: item.id,
          changes: { title: body.title, slug: body.slug },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 201, { status: "SUCCESS", contentId: item.id, revision: item.currentRevision, state: item.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: err?.message?.match(/\[(CMS-\d+)\]/)?.[1] || "CMS_ERROR", message: err?.message });
      }
      return;
    }

    // SCR-03 (UX-CMS-006): editor form endpoints. HTML forms cannot send
    // PUT, so the create and update paths get their own POST routes with the
    // same authority as their JSON counterparts. mediaAssetIds arrive as
    // checkboxes of registered MediaAssetRecord ids and are validated in the
    // domain ([CMS-11]); unknown/failed references never reach persistence.
    if (pathname === "/api/v1/workspace/content-editor" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "content");
      if (!user) return;
      const formText = await parseRawBody(req, pathname);
      const params = new URLSearchParams(formText);
      const mediaIds = params.getAll("mediaAssetIds").map(String).filter(Boolean);
      try {
        const item = createContent({
          id: `CNT-${Date.now().toString(36).toUpperCase()}`,
          title: params.get("title") || "",
          slug: params.get("slug") || "",
          summary: params.get("summary") || "",
          body: params.get("body") || "",
          relatedUnit: params.get("relatedUnit") || "VMNL",
          mediaAssetIds: mediaIds,
          alternativeText: params.get("alternativeText") || undefined,
          authorId: user.userId,
        });
        await recordAuditLog({
          userId: user.userId,
          action: "CONTENT_CREATED",
          resource: "content_item",
          resourceId: item.id,
          changes: { title: item.revisions.get(1)?.title, slug: item.revisions.get(1)?.slug, mediaAssetIds: mediaIds },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        res.writeHead(303, { Location: `/workspace/content/editor?createdId=${encodeURIComponent(item.id)}` });
        res.end();
      } catch (err: any) {
        const code = (err?.message?.match(/\[(CMS-\d+)\]/)?.[1] || "CMS_ERROR") as string;
        res.writeHead(303, { Location: `/workspace/content/editor?error=${encodeURIComponent(code)}` });
        res.end();
      }
      return;
    }

    if (pathname === "/api/v1/workspace/content-editor/update" && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "content");
      if (!user) return;
      const formText = await parseRawBody(req, pathname);
      const params = new URLSearchParams(formText);
      const contentId = params.get("contentId") || "";
      const mediaIds = params.getAll("mediaAssetIds").map(String).filter(Boolean);
      try {
        const item = editContent({
          id: contentId,
          editorId: user.userId,
          changes: {
            ...(params.get("title") ? { title: params.get("title")! } : {}),
            ...(params.get("summary") ? { summary: params.get("summary")! } : {}),
            ...(params.get("body") ? { body: params.get("body")! } : {}),
            ...(params.get("alternativeText") ? { alternativeText: params.get("alternativeText")! } : {}),
            mediaAssetIds: mediaIds,
          },
        });
        await recordAuditLog({
          userId: user.userId,
          action: "CONTENT_EDITED",
          resource: "content_item",
          resourceId: item.id,
          changes: { revision: item.currentRevision, mediaAssetIds: mediaIds },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        res.writeHead(303, { Location: `/workspace/content/editor/${encodeURIComponent(item.id)}?savedRevision=${item.currentRevision}` });
        res.end();
      } catch (err: any) {
        const code = (err?.message?.match(/\[(CMS-\d+)\]/)?.[1] || "CMS_ERROR") as string;
        res.writeHead(303, { Location: `/workspace/content/editor/${encodeURIComponent(contentId)}?error=${encodeURIComponent(code)}` });
        res.end();
      }
      return;
    }

    if (pathname === "/api/v1/workspace/content" && method === "PUT") {
      const user = assertRoutePermission(req, res, "update", "content");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      if (!body.id) {
        sendJson(res, 400, { error: "Bad Request", message: "Content id is required.", code: "CMS_ID_REQUIRED" });
        return;
      }
      try {
        const item = editContent({
          id: String(body.id),
          editorId: user.userId,
          changes: {
            ...(body.title ? { title: String(body.title) } : {}),
            ...(body.summary ? { summary: String(body.summary) } : {}),
            ...(body.body ? { body: String(body.body) } : {}),
            ...(body.alternativeText ? { alternativeText: String(body.alternativeText) } : {}),
            ...(Array.isArray(body.claimSources) ? { claimSources: body.claimSources.map(String) } : {}),
            // SCR-03: canonical media references — validated against the
            // DAM registry inside editContent ([CMS-11] on unknown/invalid).
            ...(Array.isArray(body.mediaAssetIds) ? { mediaAssetIds: body.mediaAssetIds.map(String) } : {}),
          },
        });
        sendJson(res, 200, {
          status: "SUCCESS",
          contentId: item.id,
          revision: item.currentRevision,
          state: item.status,
          note: "Editing created a NEW revision; prior approved revision is immutable.",
        });
      } catch (err: any) {
        sendJson(res, 404, { status: "REJECTED", code: "CMS_NOT_FOUND", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/workspace/content/") && pathname.endsWith("/submit-review") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "content");
      if (!user) return;
      const contentId = pathname.replace("/api/v1/workspace/content/", "").replace("/submit-review", "").trim();
      try {
        const item = submitForReview(contentId);
        sendJson(res, 200, { status: "SUCCESS", contentId, state: item.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CMS_TRANSITION_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/workspace/content/") && pathname.endsWith("/approve") && method === "POST") {
      const user = assertRoutePermission(req, res, "approve", "content");
      if (!user) return;
      const contentId = pathname.replace("/api/v1/workspace/content/", "").replace("/approve", "").trim();
      try {
        const item = approveRevision(contentId, user.userId);
        sendJson(res, 200, { status: "SUCCESS", contentId, state: item.status, approvedBy: user.email });
      } catch (err: any) {
        const sodSelf = err?.message?.includes("CMS-07");
        sendJson(res, sodSelf ? 403 : 422, { status: "REJECTED", code: sodSelf ? "CMS_SOD_SELF" : "CMS_TRANSITION_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/workspace/content/") && pathname.endsWith("/withdraw") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "content");
      if (!user) return;
      const contentId = pathname.replace("/api/v1/workspace/content/", "").replace("/withdraw", "").trim();
      const body = await parseJsonBody(req, pathname);
      try {
        const { withdrawal } = withdrawContent({
          id: contentId,
          withdrawnBy: user.userId,
          reason: String(body.reason || ""),
          affectedPublicPaths: Array.isArray(body.affectedPublicPaths) ? body.affectedPublicPaths.map(String) : [],
          replacementContentId: body.replacementContentId ? String(body.replacementContentId) : undefined,
        });
        recordAuditLog({
          userId: user.userId,
          action: "CONTENT_WITHDRAWN",
          resource: "content_item",
          resourceId: contentId,
          changes: {
            reason: withdrawal.reason,
            affectedPublicPaths: withdrawal.affectedPublicPaths,
            campaignNotificationRequired: withdrawal.campaignNotificationRequired,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { status: "SUCCESS", contentId, withdrawal: { ...withdrawal, withdrawnAt: withdrawal.withdrawnAt.toISOString() } });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CMS_WITHDRAW_REJECTED", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/workspace/content/") && pathname.endsWith("/request-changes") && method === "POST") {
      const user = assertRoutePermission(req, res, "approve", "content");
      if (!user) return;
      const contentId = pathname.replace("/api/v1/workspace/content/", "").replace("/request-changes", "").trim();
      const body = await parseJsonBody(req, pathname);
      try {
        const item = requestChanges(contentId, user.userId, String(body.notes || ""));
        sendJson(res, 200, { status: "SUCCESS", contentId, state: item.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CMS_TRANSITION_INVALID", message: err?.message });
      }
      return;
    }

    // J-RL1-14: Governance & Approval Decision — real four-eyes domain
    // (TODO-SCR-06): authority recheck, stale-revision rejection, separation
    // of duties, reason capture. Audit intent rows are labelled as such.
    if (pathname.startsWith("/api/v1/workspace/approvals/") && pathname.endsWith("/decide") && method === "POST") {
      const approvalId = pathname.replace("/api/v1/workspace/approvals/", "").replace("/decide", "").trim();
      const contentType = req.headers["content-type"] || "";
      let decision = "APPROVED";
      let reason = "";
      let currentObjectRevision: number | undefined;
      let idempotencyKey: string | undefined;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        decision = params.get("decision") || decision;
        reason = params.get("reason") || "";
        idempotencyKey = params.get("idempotencyKey") || undefined;
      } else {
        const body = await parseJsonBody(req, pathname);
        decision = body.decision || decision;
        reason = body.reason || "";
        currentObjectRevision = typeof body.currentObjectRevision === "number" ? body.currentObjectRevision : undefined;
        idempotencyKey = body.idempotencyKey || undefined;
      }

      // (TODO-SEC-08): decision replay protection.
      const decideIdemKey = idempotencyKey ? `approval-decide:${approvalId}:${idempotencyKey}` : undefined;
      const decideReplay = checkIdempotency(decideIdemKey);
      if (decideReplay.status === "recorded") {
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/approvals?decidedId=${encodeURIComponent(approvalId)}` });
          res.end();
          return;
        }
        sendJson(res, 200, decideReplay.record.responseBody ?? { status: "SUCCESS", approvalId, decision, replay: true });
        return;
      }

      const sessionUser = resolveSessionUser(req);
      const approval = listAllApprovals().find((a) => a.id === approvalId);
      const CATEGORY_ROLES: Record<string, string[]> = {
        RATE_CARD_OVERRIDE: ["SuperAdmin", "ExecutiveLeader", "FinanceController", "CommercialTrafficOfficer", "AdSalesCommercialManager"],
        AFCA_MILESTONE: ["SuperAdmin", "ExecutiveLeader", "AcademyDirector", "FinanceController"],
        CONTRACT_SIGNATURE: ["SuperAdmin", "ExecutiveLeader", "FinanceController"],
        SCHEDULE_OVERRIDE: ["SuperAdmin", "ExecutiveLeader", "BroadcastDirector", "HeadOfBroadcast", "ProgrammeScheduler"],
        FINANCIAL_ADJUSTMENT: ["SuperAdmin", "FinanceController", "ExecutiveLeader"],
        RIGHTS_EXCEPTION: ["SuperAdmin", "ExecutiveLeader", "RightsManager", "HeadOfBroadcast"],
      };

      if (approval) {
        // Real approval domain decision (server-side authority recheck).
        const result = decideApproval({
          approvalId,
          decision: decision === "REJECTED" ? "REJECTED" : "APPROVED",
          reason,
          deciderId: sessionUser?.userId || "anonymous",
          deciderName: sessionUser?.email || "Supervisor",
          deciderRoles: sessionUser?.roles || [],
          authorizedRoles: CATEGORY_ROLES[approval.category] || ["SuperAdmin", "ExecutiveLeader"],
          currentObjectRevision: currentObjectRevision ?? approval.objectRevision,
        });

        await recordAuditLog({
          userId: sessionUser?.userId || null,
          action: "GOVERNANCE_APPROVAL_DECISION",
          resource: "approval_item",
          resourceId: approvalId,
          changes: {
            approvalId,
            decision,
            reviewer: sessionUser?.email || "Supervisor",
            outcome: result.ok ? "RECORDED" : result.code,
          },
          ipAddress: resolveClientIp(req),
          userAgent: req.headers["user-agent"] || null,
        });

        if (!result.ok) {
          if (contentType.includes("application/x-www-form-urlencoded")) {
            res.writeHead(303, {
              Location: `/workspace/approvals?error=${encodeURIComponent(result.code || "APR_ERROR")}&id=${encodeURIComponent(approvalId)}`,
            });
            res.end();
            return;
          }
          sendJson(res, result.code === "APR_NOT_FOUND" ? 404 : result.code === "APR_FORBIDDEN" || result.code === "APR_SOD_SELF" || result.code === "APR_FOUR_EYES" || result.code === "APR_LIMIT" ? 403 : 422, {
            status: "REJECTED",
            approvalId,
            code: result.code,
            message: result.error,
          });
          return;
        }

        if (decideIdemKey) {
          recordIdempotentOutcome(decideIdemKey, "SUCCESS", { status: "SUCCESS", approvalId, decision, decidedAt: result.item?.decidedAt?.toISOString() });
        }

        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/approvals?decidedId=${encodeURIComponent(approvalId)}` });
          res.end();
          return;
        }
        sendJson(res, 200, { status: "SUCCESS", approvalId, decision, decidedAt: result.item?.decidedAt?.toISOString() });
        return;
      }

      // Audit-intent path: approvals created outside the domain (e.g. demo
      // surfaces) still record the decision intent with the actor identity.
      await recordAuditLog({
        userId: sessionUser?.userId || null,
        action: "GOVERNANCE_APPROVAL_DECISION",
        resource: "approval_item",
        resourceId: approvalId,
        changes: { approvalId, decision, reviewer: sessionUser?.email || "Supervisor", outcome: "AUDIT_INTENT_ONLY_NO_DOMAIN_RECORD" },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/workspace/approvals?decidedId=${encodeURIComponent(approvalId)}` });
        res.end();
        return;
      }

      sendJson(res, 200, { status: "SUCCESS", approvalId, decision });
      return;
    }

    // UX-GOV-002a: create an approval request (initiator action).
    if (pathname === "/api/v1/workspace/approvals" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "contract");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      const category = String(body.category || "");
      const VALID_CATEGORIES = ["RATE_CARD_OVERRIDE", "AFCA_MILESTONE", "CONTRACT_SIGNATURE", "SCHEDULE_OVERRIDE", "FINANCIAL_ADJUSTMENT", "RIGHTS_EXCEPTION"];
      if (!VALID_CATEGORIES.includes(category)) {
        sendJson(res, 422, { error: "Unprocessable Entity", message: `Unknown approval category '${category}'.`, code: "APR_CATEGORY_INVALID" });
        return;
      }
      const financialScopeNgn = Number(body.financialScopeNgn);
      if (!Number.isFinite(financialScopeNgn) || financialScopeNgn < 0) {
        sendJson(res, 422, { error: "Unprocessable Entity", message: "financialScopeNgn must be a non-negative number.", code: "APR_SCOPE_INVALID" });
        return;
      }
      const item = createApproval({
        id: `APV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        category: category as any,
        subject: String(body.subject || "Approval request"),
        justification: String(body.justification || ""),
        financialScopeNgn,
        initiatorId: user.userId,
        initiatorName: user.email,
        objectRevision: Number(body.objectRevision) || 1,
      });
      recordAuditLog({
        userId: user.userId,
        action: "GOVERNANCE_APPROVAL_CREATED",
        resource: "approval_item",
        resourceId: item.id,
        changes: { category, financialScopeNgn, requiresFourEyes: item.requiresFourEyes },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 201, { status: "SUCCESS", approval: item });
      return;
    }

    // -------------------------------------------------------------------------
    // Extended Workspaces & Portals API Mutations
    // -------------------------------------------------------------------------

    // TODO-SCR-17: Commercial proposal creation — creates the canonical
    // proposal AND its Quote-to-Cash deal (stage PROPOSAL) in one governed
    // step. Guarded mutation (create:contract).
    if (pathname === "/api/v1/commercial/proposals" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "contract");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        for (const [k, v] of params.entries()) fields[k] = v;
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      const items = Array.isArray(fields.items) && fields.items.length > 0
        ? fields.items
        : [
            {
              id: "item-1",
              name: String(fields.campaignTitle || "New Media Campaign"),
              channel: String(fields.channel || "Nigezie Xtreme"),
              daypart: String(fields.daypart || "All Dayparts"),
              units: Math.max(1, parseInt(fields.units || "1", 10) || 1),
              ratePerUnitNgn: Math.max(0, Number(fields.ratePerUnitNgn ?? fields.ratePerUnit ?? 0)),
              discountPercent: Math.min(100, Math.max(0, Number(fields.discountPercent ?? 0))),
            },
          ];

      const proposalId = `PROP-${Date.now().toString(36).toUpperCase()}`;
      try {
        if (!context.proposalStore) {
          throw new Error("Proposal store unavailable");
        }
        const proposal = context.proposalStore.createProposal({
          id: proposalId,
          clientName: String(fields.clientName || "Enterprise Client"),
          clientOrgId: String(fields.clientOrgId || "org-unassigned"),
          campaignTitle: String(fields.campaignTitle || "New Media Campaign"),
          flightStart: String(fields.flightStart || new Date().toISOString().substring(0, 10)),
          flightEnd: String(fields.flightEnd || new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10)),
          accountExec: String(fields.accountExec || user.email),
          items,
          salesLeadId: user.userId,
        });

        recordAuditLog({
          userId: user.userId,
          action: "COMMERCIAL_PROPOSAL_CREATED",
          resource: "contract",
          resourceId: proposal.id,
          changes: { proposalId: proposal.id, dealId: proposal.dealId, clientName: proposal.clientName, campaignTitle: proposal.campaignTitle },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });

        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/commercial/proposals/${encodeURIComponent(proposal.id)}/quote` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", proposalId: proposal.id, dealId: proposal.dealId, netContractValueNgn: proposal.items.reduce((a, it) => a + it.units * it.ratePerUnitNgn * (1 - it.discountPercent / 100), 0) });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "PROPOSAL_INVALID", message: err?.message || "Proposal validation failed" });
      }
      return;
    }

    // TODO-SCR-17: Quote acceptance — mutates the canonical deal via
    // CommercialProposalStore.acceptProposal (dual-authorisation contract
    // sign-off). Guarded mutation (update:contract).
    if (pathname.startsWith("/api/v1/commercial/proposals/") && pathname.endsWith("/accept") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "contract");
      if (!user) return;
      const proposalId = pathname.replace("/api/v1/commercial/proposals/", "").replace("/accept", "").trim();
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        for (const [k, v] of params.entries()) fields[k] = v;
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      if (!context.proposalStore) {
        sendJson(res, 503, { status: "REJECTED", code: "PROPOSAL_STORE_UNAVAILABLE", message: "Proposal store unavailable" });
        return;
      }

      try {
        const { proposal, deal } = context.proposalStore.acceptProposal({
          proposalId,
          salesLeadId: String(fields.salesLeadId || user.userId),
          financeApproverId: String(fields.financeApproverId || "fin-system-approver"),
          acceptedBy: String(fields.signatoryName || user.email),
        });

        recordAuditLog({
          userId: user.userId,
          action: "COMMERCIAL_QUOTE_ACCEPTED",
          resource: "contract",
          resourceId: proposal.id,
          changes: { proposalId: proposal.id, dealId: deal.id, dealStage: deal.stage, acceptedBy: proposal.acceptedBy },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });

        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/commercial/proposals/${encodeURIComponent(proposalId)}/quote?accepted=1` });
          res.end();
          return;
        }
        sendJson(res, 200, { status: "SUCCESS", proposalId: proposal.id, dealId: deal.id, dealStage: deal.stage, statusText: "ACCEPTED" });
      } catch (err: any) {
        const message = err?.message || "Acceptance failed";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/commercial/proposals/${encodeURIComponent(proposalId)}/quote?error=${encodeURIComponent(message)}` });
          res.end();
          return;
        }
        if (String(message).includes("not found")) {
          sendJson(res, 404, { status: "REJECTED", code: "PROPOSAL_NOT_FOUND", message });
        } else {
          sendJson(res, 422, { status: "REJECTED", code: "ACCEPTANCE_INVALID", message });
        }
      }
      return;
    }

    // AFCA Assignment Submission
    if (pathname === "/api/v1/workspace/afca/assignments" && method === "POST") {
      const contentType = req.headers["content-type"] || "";
      const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}`;
      const sessionUser = resolveSessionUser(req);
      await recordAuditLog({
        userId: sessionUser?.userId || null,
        action: "AFCA_ASSIGNMENT_SUBMITTED",
        resource: "afca_assignment",
        resourceId: submissionId,
        changes: { submissionId, student: sessionUser?.email || "Scholar" },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/workspace/afca/assignments/submit?success=1` });
        res.end();
        return;
      }
      sendJson(res, 200, { status: "SUCCESS", submissionId });
      return;
    }

    // AFCA Faculty Grading
    if (pathname === "/api/v1/workspace/afca/grading" && method === "POST") {
      const contentType = req.headers["content-type"] || "";
      let score = 90;
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        const params = new URLSearchParams(formText);
        score = parseInt(params.get("lightingOpticsScore") || "90", 10);
      } else {
        const body = await parseJsonBody(req, pathname);
        score = body.score || score;
      }

      const sessionUser = resolveSessionUser(req);
      await recordAuditLog({
        userId: sessionUser?.userId || null,
        action: "AFCA_ASSIGNMENT_GRADED",
        resource: "afca_rubric",
        resourceId: "RUBRIC-SUB-042",
        changes: { score, gradedBy: sessionUser?.email || "FacultyDean" },
        ipAddress: resolveClientIp(req),
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/workspace/afca/grading/rubric?saved=1` });
        res.end();
        return;
      }
      sendJson(res, 200, { status: "SUCCESS", score });
      return;
    }

    // SCR-18: accelerator intake — registers a canonical partner hub.
    if (pathname === "/api/v1/workspace/accelerator/partners" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      try {
        const hub = context.talentRegistry.registerHub({
          id: String(fields.id || `HUB-${Date.now().toString(36).toUpperCase()}`),
          name: String(fields.name || "Unnamed Partner Hub"),
          city: String(fields.city || "Unspecified"),
          state: String(fields.state || "Unspecified"),
          address: String(fields.address || "To be confirmed"),
          leadCoordinator: String(fields.leadCoordinator || "Unassigned"),
          contactEmail: String(fields.contactEmail || "unassigned@vmnl.ng"),
          facilitiesAvailable: String(fields.facilitiesAvailable || "")
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean),
          activeTalentCount: 0,
          isAccredited: false,
        });
        recordAuditLog({
          userId: user.userId,
          action: "ACCELERATOR_PARTNER_HUB_REGISTERED",
          resource: "talent",
          resourceId: hub.id,
          changes: { hubId: hub.id, name: hub.name, state: hub.state },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/accelerator?registered=${encodeURIComponent(hub.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", hubId: hub.id, name: hub.name });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "HUB_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-18: community member registration — canonical hub member.
    if (pathname === "/api/v1/workspace/community/sprints" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      if (!context.communityHub) {
        sendJson(res, 503, { status: "REJECTED", code: "HUB_UNAVAILABLE", message: "Community hub unavailable" });
        return;
      }
      try {
        const memberId = String(fields.id || `MEM-${Date.now().toString(36).toUpperCase()}`);
        const now = new Date();
        const member = context.communityHub.registerMember({
          id: memberId,
          personId: String(fields.personId || memberId),
          fullName: String(fields.fullName || "Unnamed Member"),
          email: String(fields.email || "unassigned@vmnl.ng"),
          tier: (fields.tier || "COMMUNITY") as any,
          status: "ACTIVE",
          joinedAt: now,
          expiresAt: new Date(now.getTime() + 365 * 86400000),
          guilds: String(fields.guilds || "")
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
        });
        recordAuditLog({
          userId: user.userId,
          action: "COMMUNITY_MEMBER_REGISTERED",
          resource: "talent",
          resourceId: member.id,
          changes: { memberId: member.id, tier: member.tier, guilds: member.guilds },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/community/guilds?registered=${encodeURIComponent(member.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", memberId: member.id });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "MEMBER_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-18: VTM casting action — drafts a canonical standard contract
    // against the matched brief (milestone escrow protects deployment).
    if (pathname === "/api/v1/workspace/vtm/cast" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      const candidateId = String(fields.candidateId || "");
      const opportunityId = String(fields.opportunityId || "");
      const profile = context.talentRegistry.getProfile(candidateId);
      const brief = opportunityId ? context.vtmEngine.getBrief(opportunityId) : undefined;
      if (!candidateId || !profile) {
        sendJson(res, 404, { status: "REJECTED", code: "CANDIDATE_NOT_FOUND", message: `Talent profile '${candidateId}' not found in the registry.` });
        return;
      }
      if (!brief) {
        sendJson(res, 404, { status: "REJECTED", code: "BRIEF_NOT_FOUND", message: `Opportunity brief '${opportunityId}' not found in the VTM engine.` });
        return;
      }

      try {
        const dayRate = context.vtmEngine.getRateCard(candidateId)?.baseDayRateNgn ?? profile.dayRateNgn;
        const estimatedDays = Math.max(1, parseInt(fields.estimatedDays || "5", 10) || 5);
        const total = dayRate * estimatedDays;
        const contract = context.vtmEngine.createStandardContract({
          contractNumber: `VTM-CTR-${Date.now().toString(36).toUpperCase()}`,
          briefId: brief.id,
          talentId: candidateId,
          clientId: String(fields.clientId || brief.productionOrgId),
          milestones: [
            {
              id: "MS-1",
              title: `Delivery for ${brief.title}`,
              description: brief.roleDescription,
              amountNgn: total,
              dueDate: new Date(brief.endDate),
            },
          ],
        });
        recordAuditLog({
          userId: user.userId,
          action: "VTM_TALENT_CAST_TERMS_DRAFTED",
          resource: "talent",
          resourceId: contract.id,
          changes: { candidateId, opportunityId, contractId: contract.id, totalValueNgn: contract.totalValueNgn },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/vtm/terms?contract=${encodeURIComponent(contract.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", contractId: contract.id, totalValueNgn: contract.totalValueNgn });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CAST_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-18: ONE Studios call sheet — publishes into OneStudiosEngine.
    if (pathname === "/api/v1/workspace/production/callsheet" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      if (!context.oneStudios) {
        sendJson(res, 503, { status: "REJECTED", code: "ENGINE_UNAVAILABLE", message: "ONE Studios engine unavailable" });
        return;
      }
      try {
        const callSheet = context.oneStudios.publishCallSheet({
          id: String(fields.id || `CS-${Date.now().toString(36).toUpperCase()}`),
          productionName: String(fields.productionName || "Unnamed Production"),
          shootDate: new Date(String(fields.shootDate || new Date().toISOString().substring(0, 10))),
          generalCallTime: String(fields.generalCallTime || "06:30"),
          location: String(fields.location || "VMN ONE Studios"),
          keyCast: [],
          keyCrew: [],
          scenesToShoot: [],
          nearestHospital: String(fields.nearestHospital || "Unspecified"),
          safetyNotes: fields.safetyNotes ? String(fields.safetyNotes) : undefined,
          publishedAt: new Date(),
        });
        recordAuditLog({
          userId: user.userId,
          action: "PRODUCTION_CALLSHEET_PUBLISHED",
          resource: "talent",
          resourceId: callSheet.id,
          changes: { callSheetId: callSheet.id, productionName: callSheet.productionName, shootDate: callSheet.shootDate.toISOString().substring(0, 10) },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/production/desk?dispatched=${encodeURIComponent(callSheet.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", callSheetId: callSheet.id });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CALLSHEET_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-18: VCF pitch submission — canonical fund pipeline entry.
    if (pathname === "/api/v1/workspace/vcf/missions" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      if (!context.vcfEngine) {
        sendJson(res, 503, { status: "REJECTED", code: "ENGINE_UNAVAILABLE", message: "VCF engine unavailable" });
        return;
      }
      try {
        const pitch = context.vcfEngine.submitPitch({
          id: String(fields.id || `PITCH-${Date.now().toString(36).toUpperCase()}`),
          creatorId: String(fields.creatorId || user.userId),
          title: String(fields.title || "Untitled Pitch"),
          logline: String(fields.logline || ""),
          synopsis: String(fields.synopsis || fields.logline || ""),
          format: (fields.format || "CREATOR_SHORT") as any,
          targetAudience: String(fields.targetAudience || "Pan-African youth"),
          budgetEstimateNgn: Math.max(0, Number(fields.budgetEstimateNgn ?? 0)),
          treatmentDeckUrl: String(fields.treatmentDeckUrl || "not-provided"),
        });
        recordAuditLog({
          userId: user.userId,
          action: "VCF_PITCH_SUBMITTED",
          resource: "talent",
          resourceId: pitch.id,
          changes: { pitchId: pitch.id, title: pitch.title, budgetEstimateNgn: pitch.budgetEstimateNgn },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/vcf/missions?submitted=${encodeURIComponent(pitch.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", pitchId: pitch.id, pitchStatus: pitch.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "PITCH_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-18: Fusion events gate scan — REAL HMAC validation with single-use
    // enforcement. Invalid/reused tickets return the truthful result.
    if (pathname === "/api/v1/workspace/events/scan" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      const ticketCode = String(fields.ticketCode || "");
      const eventId = String(fields.eventId || "");
      if (!eventId) {
        sendJson(res, 400, { status: "REJECTED", code: "EVENT_REQUIRED", message: "eventId is required for gate validation." });
        return;
      }

      const result = context.eventsEngine.scanGateTicket({ ticketNumber: ticketCode, eventId, gateStaffId: user.userId });
      recordAuditLog({
        userId: user.userId,
        action: "EVENT_GATE_TICKET_VALIDATED",
        resource: "talent",
        resourceId: ticketCode,
        changes: { ticketCode, eventId, valid: result.valid, reason: result.reason || null, scannedBy: user.email },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/workspace/events/desk?scan=${result.valid ? "VALID" : result.reason}` });
        res.end();
        return;
      }
      sendJson(res, result.valid ? 200 : 422, {
        status: result.valid ? "SUCCESS" : "REJECTED",
        ticketCode,
        verified: result.valid,
        reason: result.reason || null,
        message: result.message,
      });
      return;
    }

    // SCR-18: TEND title registration — canonical catalogue write. Licence
    // drafting with avails enforcement remains on /api/v1/hub/tend/licenses.
    if (pathname === "/api/v1/workspace/tend/license" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "rights");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      if (!context.tendEngine) {
        sendJson(res, 503, { status: "REJECTED", code: "ENGINE_UNAVAILABLE", message: "TEND engine unavailable" });
        return;
      }
      try {
        const title = context.tendEngine.registerTitle({
          id: String(fields.id || `TND-${Date.now().toString(36).toUpperCase()}`),
          title: String(fields.title || "Untitled Programme"),
          originalLanguage: String(fields.originalLanguage || "English"),
          subtitlesAvailable: String(fields.subtitlesAvailable || "en")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          runningTimeMinutes: Math.max(1, parseInt(fields.runningTimeMinutes || "45", 10) || 45),
          genre: String(fields.genre || "General"),
          masterDeliveryStatus: (fields.masterDeliveryStatus || "PENDING_DELIVERY") as any,
          minimumLicenseFeeUsd: Math.max(0, Number(fields.minimumLicenseFeeUsd ?? 0)),
        });
        recordAuditLog({
          userId: user.userId,
          action: "TEND_CATALOGUE_TITLE_REGISTERED",
          resource: "rights",
          resourceId: title.id,
          changes: { titleId: title.id, title: title.title, minFeeUsd: title.minimumLicenseFeeUsd },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/tend/catalogue?registered=${encodeURIComponent(title.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", titleId: title.id });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "TITLE_INVALID", message: err?.message });
      }
      return;
    }

    // Headspace Brief Download
    // SCR-18 tail: headspace knowledge document registration (canonical doc,
    // confidentiality enforced by the engine at access time).
    if (pathname === "/api/v1/workspace/headspace/documents" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      try {
        const doc = context.headspace.registerDocument({
          id: String(fields.id || `DOC-${Date.now().toString(36).toUpperCase()}`),
          title: String(fields.title || "Untitled Knowledge Document"),
          category: (fields.category || "MARKET_INTELLIGENCE") as any,
          confidentiality: (fields.confidentiality || "INTERNAL") as any,
          content: String(fields.content || ""),
          tags: String(fields.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          authorId: user.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        recordAuditLog({
          userId: user.userId,
          action: "HEADSPACE_DOCUMENT_REGISTERED",
          resource: "talent",
          resourceId: doc.id,
          changes: { docId: doc.id, title: doc.title, confidentiality: doc.confidentiality },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/headspace/intelligence?registered=${encodeURIComponent(doc.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", documentId: doc.id });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "DOC_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-14/SCR-18 tail: the invented "ping all connectors" audit-only route
    // is retired — connector health is read from runtime state on the GET
    // surface; there is nothing honest to fabricate here.
    if (pathname === "/api/v1/workspace/cr8tech/test-all" && method === "POST") {
      sendJson(res, 410, {
        status: "RETIRED",
        code: "INVENTED_HEALTH_PING_RETIRED",
        message: "Connector health is served from runtime adapter state on GET /workspace/cr8tech/operations. Fabricated health pings were removed under TODO-SCR-14.",
      });
      return;
    }

    // SCR-18 tail: Agentic OS emergency kill switch — REAL isolation of every
    // registered agent (fail-closed), not an audit-only redirect.
    if (pathname === "/api/v1/workspace/aos/killswitch" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "agent");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let reason = "Emergency hard isolate via console";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        reason = String(new URLSearchParams(formText).get("reason") || reason);
      } else {
        const body = await parseJsonBody(req, pathname);
        reason = String(body.reason || reason);
      }

      context.aos.engageGlobalKillSwitch(reason);
      recordAuditLog({
        userId: user.userId,
        action: "AGENTIC_OS_EMERGENCY_KILLSWITCH_TRIGGERED",
        resource: "agent",
        resourceId: "ALL_AGENTS",
        changes: { state: "ISOLATED", triggeredBy: user.email, reason },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      if (contentType.includes("application/x-www-form-urlencoded")) {
        res.writeHead(303, { Location: `/workspace/aos/console?killswitch=1` });
        res.end();
        return;
      }
      sendJson(res, 200, { status: "SUCCESS", message: "All agents isolated", reason });
      return;
    }

    // SCR-19: risk register mutation — writes a canonical RiskRecord.
    if (pathname === "/api/v1/workspace/governance/risks" && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "risk");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      try {
        const risk = createRisk({
          id: String(fields.id || `RSK-${Date.now().toString(36).toUpperCase()}`),
          title: String(fields.title || "Untitled Risk"),
          category: String(fields.category || "UNCATEGORISED"),
          likelihood: (Math.min(5, Math.max(1, parseInt(fields.likelihood || "3", 10) || 3)) as 1 | 2 | 3 | 4 | 5),
          impact: (Math.min(5, Math.max(1, parseInt(fields.impact || "3", 10) || 3)) as 1 | 2 | 3 | 4 | 5),
          mitigation: String(fields.mitigation || ""),
          owner: String(fields.owner || user.email),
          reviewDueAt: new Date(String(fields.reviewDueAt || new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10))),
        });
        recordAuditLog({
          userId: user.userId,
          action: "GOVERNANCE_RISK_LOGGED",
          resource: "risk",
          resourceId: risk.id,
          changes: { riskId: risk.id, likelihood: risk.likelihood, impact: risk.impact, owner: risk.owner },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/governance/risks?logged=${encodeURIComponent(risk.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", riskId: risk.id });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "RISK_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-19: issue tracker mutation — creates a canonical IssueRecord.
    if (pathname === "/api/v1/workspace/governance/issues" && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "risk");
      if (!user) return;
      const contentType = req.headers["content-type"] || "";
      let fields: Record<string, any> = {};
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        fields = Object.fromEntries(new URLSearchParams(formText).entries());
      } else {
        fields = await parseJsonBody(req, pathname);
      }

      try {
        const issue = createIssue({
          id: String(fields.id || `ISSUE-${Date.now().toString(36).toUpperCase()}`),
          title: String(fields.title || "Untitled Incident"),
          description: String(fields.description || ""),
          severity: (fields.severity || "S3") as "S1" | "S2" | "S3" | "S4",
          raisedBy: user.userId,
          linkedRiskId: fields.linkedRiskId ? String(fields.linkedRiskId) : undefined,
        });
        recordAuditLog({
          userId: user.userId,
          action: "GOVERNANCE_ISSUE_LOGGED",
          resource: "risk",
          resourceId: issue.id,
          changes: { issueId: issue.id, severity: issue.severity, linkedRiskId: issue.linkedRiskId || null },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/governance/issues?logged=${encodeURIComponent(issue.id)}` });
          res.end();
          return;
        }
        sendJson(res, 201, { status: "SUCCESS", issueId: issue.id, issueStatus: issue.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "ISSUE_INVALID", message: err?.message });
      }
      return;
    }

    // SCR-19: issue lifecycle transition — enforced by the domain (one step at
    // a time along OPEN → ACKNOWLEDGED → FIX_IN_PROGRESS → RESOLVED).
    if (pathname.startsWith("/api/v1/workspace/governance/issues/") && pathname.endsWith("/transition") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "risk");
      if (!user) return;
      const issueId = pathname.replace("/api/v1/workspace/governance/issues/", "").replace("/transition", "").trim();
      const contentType = req.headers["content-type"] || "";
      let target = "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formText = await parseRawBody(req, pathname);
        target = String(new URLSearchParams(formText).get("target") || "");
      } else {
        const body = await parseJsonBody(req, pathname);
        target = String(body.target || "");
      }

      const valid = ["ACKNOWLEDGED", "FIX_IN_PROGRESS", "RESOLVED"];
      if (!valid.includes(target)) {
        sendJson(res, 400, { status: "REJECTED", code: "TRANSITION_INVALID", message: `target must be one of ${valid.join(", ")}.` });
        return;
      }
      try {
        const issue = transitionIssue(issueId, target as any, user.userId);
        recordAuditLog({
          userId: user.userId,
          action: "GOVERNANCE_ISSUE_TRANSITIONED",
          resource: "risk",
          resourceId: issue.id,
          changes: { issueId: issue.id, status: issue.status, by: user.email },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        if (contentType.includes("application/x-www-form-urlencoded")) {
          res.writeHead(303, { Location: `/workspace/governance/issues?transitioned=${encodeURIComponent(issue.id)}` });
          res.end();
          return;
        }
        sendJson(res, 200, { status: "SUCCESS", issueId: issue.id, issueStatus: issue.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "TRANSITION_REJECTED", message: err?.message });
      }
      return;
    }

    // 3. Broadcast Endpoints
    if (pathname === "/api/v1/broadcast/channels" && method === "GET") {
      const channels = getAllActiveChannels();
      sendJson(res, 200, { channels, count: channels.length });
      return;
    }

    if (pathname.startsWith("/api/v1/broadcast/channels/") && method === "GET") {
      const code = pathname.replace("/api/v1/broadcast/channels/", "").trim().toUpperCase();
      const channel = getChannelByCode(code);
      if (channel) {
        sendJson(res, 200, { channel });
      } else {
        sendJson(res, 404, { error: "Not Found", message: `Channel with code '${code}' not found` });
      }
      return;
    }

    if (pathname === "/api/v1/broadcast/screens" && method === "GET") {
      sendJson(res, 200, { screens: BROADCAST_SCREEN_INVENTORY, count: BROADCAST_SCREEN_INVENTORY.length });
      return;
    }

    // TODO-BCST-02: XMLTV download & StarTimes push endpoints, honesty-gated:
    // sample scheduler data is never published as an operational feed
    // (APPROVED_SCHEDULE_UNAVAILABLE until a real schedule source connects).
    if (pathname === "/broadcast/export/epg/xmltv" && method === "GET") {
      const urlObj = new URL(req.url || "/", "http://localhost");
      const channelCode = (urlObj.searchParams.get("channel") || "NXTR").toUpperCase();
      const dateIso = urlObj.searchParams.get("date") || new Date().toISOString().substring(0, 10);
      const wantsJson = (req.headers["accept"] || "").includes("application/json") || urlObj.searchParams.get("format") === "json";
      const result = exportXmltv(channelCode, dateIso);
      if (result.status === "EXPORTED" && result.xmltv) {
        sendText(res, 200, result.xmltv, "application/xml; charset=utf-8");
        return;
      }
      if (wantsJson) {
        sendJson(res, 503, { status: result.status, code: result.code, message: result.message });
      } else {
        const html = renderMasterLayout(
          "EPG Export Unavailable",
          `<div class="vmn-card" style="max-width: 640px; margin: 40px auto; text-align: center; padding: 36px; border: 1px solid #F59E0B; border-radius: var(--vmn-radius-lg); background: #FFFBEB;">
            <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: #92400E; margin-bottom: 8px;">EPG Export Unavailable</h2>
            <p style="color: #92400E; margin-bottom: 16px;">${escapeHtml(result.message || "No approved schedule source is connected.")}</p>
            <a href="/broadcast/epg/syndication" class="btn btn-primary">Back to EPG Inspector</a>
          </div>`,
          "/broadcast/epg/syndication",
          { shell: "identity", sessionUser: resolveSessionUser(req) }
        );
        sendHtml(res, 503, html);
      }
      return;
    }

    if (pathname === "/api/v1/broadcast/epg/push-startimes" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "broadcast");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      const channelCode = String(body.channelCode || "NXTR").toUpperCase();
      const dateIso = String(body.date || new Date().toISOString().substring(0, 10));
      const push = pushToStarTimes(channelCode, dateIso);
      recordAuditLog({
        userId: user.userId,
        action: "broadcast.epg.push_attempted",
        resource: "broadcast",
        resourceId: `${channelCode}/${dateIso}`,
        changes: { status: push.status, code: push.code || null },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      // Honest refusal: BG6 carriage machine interface is NOT_TESTED, so the
      // push can never silently "succeed" against a vendor that never got it.
      sendJson(res, push.status === "PUSHED" ? 200 : 503, {
        status: push.status,
        code: push.code,
        message: push.message,
      });
      return;
    }

    if (pathname.startsWith("/api/v1/broadcast/epg/") && method === "GET") {
      const channelCode = pathname.replace("/api/v1/broadcast/epg/", "").toUpperCase();
      const channel = getChannelByCode(channelCode);
      if (!channel) {
        sendJson(res, 404, { error: `Channel code '${channelCode}' not found.` });
        return;
      }

      // The rolling generator currently creates sample dayparts, not an approved schedule.
      // Never publish those placeholders as an operational EPG feed.
      sendJson(res, 503, {
        error: "Service Unavailable",
        code: "APPROVED_SCHEDULE_UNAVAILABLE",
        message: "The EPG feed is unavailable until an approved schedule source is connected.",
      });
      return;
    }

    if (pathname === "/api/v1/broadcast/asrun/reconcile" && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "broadcast");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const items = (body.asRunItems || []).map((it: any) => ({
        ...it,
        actualStartTime: new Date(it.actualStartTime || Date.now()),
      }));
      const report = reconcileAsRunLogs(body.channelCode || "NXTR", items);
      sendJson(res, 200, { report });
      return;
    }

    // Broadcast Programmes Technical QC (T9-05)
    if (pathname === "/api/v1/broadcast/programmes/qc" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const report = body.report || body;
      const qcResult = validateBroadcastMasterQc(report);
      sendJson(res, 200, {
        compliant: qcResult.isCompliant,
        isCompliant: qcResult.isCompliant,
        errors: qcResult.errors,
      });
      return;
    }

    // Broadcast Daily Schedule Grid Validation (T9-05)
    if (pathname === "/api/v1/broadcast/scheduling/validate" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const slots = (body.slots || []) as ScheduleSlot[];
      const dayStart = new Date(body.dayStart || Date.now());
      const validation = validateDailySchedule(slots, dayStart);
      sendJson(res, 200, validation);
      return;
    }

    // Broadcast Rights Gate (T9-05)
    if (pathname === "/api/v1/broadcast/rights/validate" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const validation = validateScheduleRights(body);
      sendJson(res, 200, validation);
      return;
    }

    // Broadcast Traffic Commercial Break Validation (T9-05)
    if (pathname === "/api/v1/broadcast/traffic/breaks/validate" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const brk = body.commercialBreak || body;
      const validation = validateCommercialBreak(brk);
      sendJson(res, 200, validation);
      return;
    }

    // Broadcast Playout Status & Emergency Filler (T9-05)
    if (pathname === "/api/v1/broadcast/playout/status" && method === "GET") {
      sendJson(res, 200, {
        status: "ACTIVE",
        engine: "PlayoutAutomationEngine",
        redundantServerActive: true,
      });
      return;
    }

    if (pathname === "/api/v1/broadcast/playout/filler" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const items = insertEmergencyFiller(body.items || [], body.targetDurationSeconds);
      sendJson(res, 200, { items, count: items.length });
      return;
    }

    // Broadcast Sponsorship Tracking (T9-05)
    if (pathname === "/api/v1/broadcast/sponsorship/log" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.sponsorshipEngine) {
        try {
          const result = context.sponsorshipEngine.logImpression({
            entitlementId: body.entitlementId || "ENT-001",
            asRunLogId: body.asRunLogId || "LOG-001",
            impressionType: body.impressionType || "BILLBOARD",
            durationSeconds: body.durationSeconds || 10,
            loggedAt: new Date(body.loggedAt || Date.now()),
          });
          sendJson(res, 200, { success: true, result });
        } catch (err: any) {
          // AUD-01: do not mask engine rejections behind fake 200s.
          sendJson(res, 422, {
            error: "Unprocessable Entity",
            message: err?.message || "Sponsorship impression rejected",
            code: "SPONSORSHIP_LOG_REJECTED",
          });
        }
      } else {
        sendJson(res, 503, {
          error: "Service Unavailable",
          message: "Sponsorship engine is not wired into the current runtime context",
          code: "SPONSORSHIP_ENGINE_UNAVAILABLE",
        });
      }
      return;
    }

    if (pathname === "/api/v1/broadcast/sponsorship/audit" && method === "GET") {
      sendJson(res, 200, {
        sponsorships: [],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Broadcast Carriage Monitoring (StarTimes DTT/DTH) (T9-05)
    if (pathname === "/api/v1/broadcast/carriage/status" && method === "GET") {
      sendJson(res, 200, {
        platforms: [
          { platform: "StarTimes DTT", channelNumber: 428, status: "TRANSMITTING" },
          { platform: "StarTimes DTH", channelNumber: 312, status: "TRANSMITTING" },
        ],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (pathname === "/api/v1/broadcast/carriage/incidents" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const incident = recordTransmissionOutage(
        body.channelCode || "NXTR",
        body.platform || "STARTIMES_DTT",
        new Date(body.startedAt || Date.now() - 60000),
        new Date(body.resolvedAt || Date.now()),
        body.rootCause || "Signal loss",
        body.affectedSpots || 0
      );
      sendJson(res, 201, { incident });
      return;
    }

    // Broadcast Billing Schedule Engine (T9-05)
    if (pathname === "/api/v1/broadcast/billing/calculate" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.billingEngine) {
        const schedule = context.billingEngine.createBillingSchedule({
          campaignCode: body.campaignCode || `CMP-${Date.now()}`,
          clientName: body.clientName || "Client",
          brand: body.brand || "Brand",
          channelCode: body.channelCode || "NXTR",
          spots: body.spots || [{ daypart: "PRIME_TIME", durationSeconds: 30 }],
          startDate: new Date(body.startDate || Date.now()),
          endDate: new Date(body.endDate || Date.now() + 86400000),
        });
        sendJson(res, 200, { schedule });
      } else {
        sendJson(res, 200, { schedule: null });
      }
      return;
    }

    // Broadcast Export Engine (SMPTE-2067 & BXF) (T9-05)
    if (pathname === "/api/v1/broadcast/export/smpte" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const xml = PlayoutExportEngine.toSmpte2067Xml(body.channelCode || "NXTR", body.scheduleDate || "2026-05-01", body.items || []);
      sendText(res, 200, xml, "application/xml; charset=utf-8");
      return;
    }

    if (pathname === "/api/v1/broadcast/export/bxf" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const bxf = PlayoutExportEngine.toBxfXml(body.channelCode || "NXTR", body.scheduleDate || "2026-05-01", body.items || []);
      sendText(res, 200, bxf, "application/xml; charset=utf-8");
      return;
    }

    // 4. Creative Hub Endpoints & CRM Inquiry Capture (DT-304, T-23)
    if (pathname === "/api/v1/hub/inquiries" && method === "POST") {
      try {
        const contentType = req.headers["content-type"] || "";
        let body: any;
        if (contentType.includes("application/json")) {
          body = await parseJsonBody(req, pathname);
        } else {
          const raw = await parseRawBody(req, pathname);
          const params = new URLSearchParams(raw);
          body = Object.fromEntries(params.entries());
        }

        const vertical = (body.vertical || "TALENT_ACCELERATOR") as HubVertical;
        const fullName = body.fullName || "Anonymous Creator";
        const email = body.email;
        const phone = body.phone;
        const organisationName = body.organisationName;
        const message = body.message;

        // AUD-26: NDPR consent is a server-enforced precondition, not a
        // client-side courtesy. The checkbox value arrives as "on" (form
        // encoding) or true (JSON); any other value fails the request.
        const consentGiven = body.ndprConsent === "on" || body.ndprConsent === true || body.ndprConsent === "true";
        if (!consentGiven) {
          sendJson(res, 400, {
            error: "Bad Request",
            message: "NDPR data-processing consent is required before an inquiry can be recorded",
            code: "NDPR_CONSENT_REQUIRED",
          });
          return;
        }

        // Public inquiry capture is unauthenticated by design; keep it from
        // becoming an unthrottled spam vector.
        const inquiryRate = checkRateLimit(`inquiry:${clientIp}`, 5, 60 * 60_000);
        if (!inquiryRate.allowed) {
          sendJson(res, 429, {
            error: "Too Many Requests",
            message: "Inquiry rate limit exceeded. Please try again later.",
            retryAfterMs: inquiryRate.resetInMs,
          });
          return;
        }

        const hubService = new HubShowcaseService({ queueWorker: context.queueWorker });
        const inquiry = hubService.submitInquiry({
          vertical,
          fullName,
          email,
          phone,
          organisationName,
          message,
        });

        if (contentType.includes("application/json")) {
          sendJson(res, 201, { status: "SUCCESS", inquiry });
        } else {
          const confirmationHtml = renderMasterLayout(
            "Inquiry Submitted — VMNL Creative Hub",
            `
            <section style="max-width: 640px; margin: 40px auto; text-align: center;" class="card">
              <div style="color: var(--vmn-color-success-text); margin-bottom: 16px;">
                ${renderIcon("check", { size: 56 })}
              </div>
              <h1 style="font-size: 2rem; font-weight: 800; color: var(--vmn-primary); margin-bottom: 8px;">
                Inquiry Received
              </h1>
              <p style="font-size: 1.1rem; color: var(--vmn-text-muted); margin-bottom: 16px;">
                ${inquiry.acknowledgmentMessage}
              </p>
              <div style="background: var(--vmn-surface-alt); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; margin-bottom: 24px;">
                Tracking Reference: <strong>${inquiry.id}</strong>
              </div>
              <a href="/hub" class="btn btn-primary">&larr; Return to Creative Hub</a>
            </section>
            `,
            "/hub"
          );
          sendHtml(res, 201, confirmationHtml);
        }
      } catch (err: any) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }

    if (pathname === "/api/v1/hub/talent/onboard" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "talent");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const talent = context.talentRegistry.registerTalent({
        id: body.id || `tal-${Date.now()}`,
        personId: body.personId || `per-${Date.now()}`,
        fullName: body.fullName || body.name || "Anonymous Creator",
        stageName: body.stageName,
        primaryCategory: body.primaryCategory || body.category || "ACTING",
        secondaryCategories: body.secondaryCategories,
        locationCity: body.locationCity || body.hubLocation || "Lagos",
        locationState: body.locationState || "Lagos State",
        partnerHubId: body.partnerHubId,
        dayRateNgn: body.dayRateNgn,
      });

      // Database repository write path with resilient fallback (T-11, T-12)
      let persistedProfile: any = null;
      if (context.talentRepository) {
        persistedProfile = await context.talentRepository.createTalent({
          id: talent.id,
          personId: talent.personId,
          stageName: talent.stageName,
          tier: "EMERGING",
          skills: [talent.primaryCategory, ...(talent.secondaryCategories || [])],
          rateCardAmount: talent.dayRateNgn || 0,
        });
      }

      recordAuditLog({
        userId: user.userId,
        action: "talent.onboard",
        resource: "talent",
        resourceId: talent.id,
        changes: { fullName: talent.fullName, stageName: talent.stageName, primaryCategory: talent.primaryCategory },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      sendJson(res, 201, {
        talent,
        record: persistedProfile,
        source: persistedProfile?.source || "REGISTRY",
        message: "Talent successfully onboarded",
      });
      return;
    }

    if (pathname.startsWith("/api/v1/hub/talent/") && method === "GET") {
      const talentId = pathname.replace("/api/v1/hub/talent/", "").trim();
      if (context.talentRepository) {
        const found = await context.talentRepository.getTalentById(talentId);
        if (found) {
          sendJson(res, 200, { talent: found, source: found.source });
          return;
        }
      }
      const inReg = context.talentRegistry.getProfile(talentId);
      if (inReg) {
        sendJson(res, 200, { talent: inReg, source: "REGISTRY" });
        return;
      }
      sendJson(res, 404, { error: "Not Found", message: `Talent with ID '${talentId}' not found` });
      return;
    }

    if (pathname === "/api/v1/hub/afca/certify" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "academy");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const cert = context.afcaService.issueCertificate(body.cohortId, body.studentId);

      recordAuditLog({
        userId: user.userId,
        action: "afca.certify",
        resource: "academy",
        resourceId: cert.certificateId,
        changes: { cohortId: body.cohortId, studentId: body.studentId, certificateId: cert.certificateId },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      sendJson(res, 201, { certificate: cert });
      return;
    }

    if (pathname === "/api/v1/hub/afca/grades" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "academy");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      try {
        const submission = context.afcaService.gradeProjectSubmission(
          body.submissionId,
          user.userId,
          body.scores || []
        );
        sendJson(res, 200, { submission, message: "Submission graded successfully" });
      } catch (err: any) {
        sendJson(res, 400, { error: "Bad Request", message: err.message });
      }
      return;
    }

    if ((pathname === "/api/v1/hub/events/verify-ticket" || pathname === "/api/v1/hub/events/tickets/validate") && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "talent");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const result = context.eventsEngine.scanGateTicket({
        ticketNumber: body.ticketNumber,
        eventId: body.eventId,
        gateStaffId: body.gateStaffId || "STAFF-01",
      });
      sendJson(res, result.valid ? 200 : 400, result);
      return;
    }

    if (pathname === "/api/v1/hub/vtm/match" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const matches = context.vtmEngine.matchTalent(body.briefId, body.candidates || []);
      sendJson(res, 200, { matches, count: matches.length });
      return;
    }

    // Virtual Content Fund (VCF) (T9-05)
    if (pathname === "/api/v1/hub/vcf/pitches" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.vcfEngine) {
        const pitch = context.vcfEngine.submitPitch(body);
        sendJson(res, 201, { pitch });
      } else {
        sendJson(res, 201, { pitch: body });
      }
      return;
    }

    if (pathname === "/api/v1/hub/vcf/slates" && method === "GET") {
      if (context.vcfEngine) {
        const slates = context.vcfEngine.getActiveSlate();
        sendJson(res, 200, { slates, count: slates.length });
      } else {
        sendJson(res, 200, { slates: [], count: 0 });
      }
      return;
    }

    if (pathname === "/api/v1/hub/vcf/waterfall" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.vcfEngine) {
        try {
          const waterfall = context.vcfEngine.calculateWaterfall(body.projectId || "PRJ-001", body.grossRevenueNgn || body.grossReceiptsNgn || 0);
          sendJson(res, 200, { waterfall });
        } catch {
          sendJson(res, 200, { waterfall: null });
        }
      } else {
        sendJson(res, 200, { waterfall: null });
      }
      return;
    }

    // ONE Studios (T9-05)
    if (pathname === "/api/v1/hub/onestudios/bookings" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.oneStudios) {
        const booking = context.oneStudios.createBooking({
          id: body.id || `bkg-${Date.now()}`,
          productionName: body.productionName || "Production",
          producerId: body.producerId || "PROD-01",
          assetIds: body.assetIds || ["AST-STG-A"],
          startDate: new Date(body.startDate || Date.now()),
          endDate: new Date(body.endDate || Date.now() + 86400000),
          securityDepositNgn: body.securityDepositNgn || 50000,
        });
        sendJson(res, 201, { booking });
      } else {
        sendJson(res, 201, { booking: body });
      }
      return;
    }

    if (pathname === "/api/v1/hub/onestudios/assets" && method === "GET") {
      if (context.oneStudios) {
        const assets = context.oneStudios.getAvailableAssets();
        sendJson(res, 200, { assets, count: assets.length });
      } else {
        sendJson(res, 200, { assets: [], count: 0 });
      }
      return;
    }

    if (pathname === "/api/v1/hub/onestudios/callsheets" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.oneStudios) {
        const callSheet = context.oneStudios.publishCallSheet(body);
        sendJson(res, 201, { callSheet });
      } else {
        sendJson(res, 201, { callSheet: body });
      }
      return;
    }

    // TEND Content Distribution (T9-05)
    if (pathname === "/api/v1/hub/tend/avails" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.tendEngine) {
        const results = context.tendEngine.checkAvails({
          titleId: body.titleId || "TIT-001",
          territory: body.territory || "NG",
          medium: body.medium || "FREE_TV",
          startDate: new Date(body.startDate || Date.now()),
          endDate: new Date(body.endDate || Date.now() + 86400000),
        });
        sendJson(res, 200, { avails: results });
      } else {
        sendJson(res, 200, { avails: { available: true } });
      }
      return;
    }

    if (pathname === "/api/v1/hub/tend/licenses" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.tendEngine) {
        const license = context.tendEngine.createLicense({
          id: body.id || `lic-${Date.now()}`,
          titleId: body.titleId || "TIT-001",
          licenseeOrgId: body.licenseeOrgId || "ORG-01",
          licenseeName: body.licenseeName || "Licensee",
          territory: body.territory || "NG",
          medium: body.medium || "FREE_TV",
          isExclusive: !!body.isExclusive,
          startDate: new Date(body.startDate || Date.now()),
          endDate: new Date(body.endDate || Date.now() + 86400000),
          licenseFeeUsd: body.licenseFeeUsd || 1000,
        });
        sendJson(res, 201, { license });
      } else {
        sendJson(res, 201, { license: body });
      }
      return;
    }

    if (pathname === "/api/v1/hub/tend/titles" && method === "GET") {
      if (context.tendEngine) {
        const titles = context.tendEngine.getCatalogueTitles();
        sendJson(res, 200, { titles, count: titles.length });
      } else {
        sendJson(res, 200, { titles: [], count: 0 });
      }
      return;
    }

    // Afro-Fusion Community (T9-05)
    if (pathname === "/api/v1/hub/community/members" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.communityHub) {
        const member = context.communityHub.registerMember(body);
        sendJson(res, 201, { member });
      } else {
        sendJson(res, 201, { member: body });
      }
      return;
    }

    if (pathname === "/api/v1/hub/community/bookings" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      if (context.communityHub) {
        const booking = context.communityHub.bookResource(body);
        sendJson(res, 201, { booking });
      } else {
        sendJson(res, 201, { booking: body });
      }
      return;
    }

    if (pathname === "/api/v1/hub/community/locations" && method === "GET") {
      if (context.communityHub) {
        const locations = context.communityHub.getLocations();
        sendJson(res, 200, { locations, count: locations.length });
      } else {
        sendJson(res, 200, { locations: [], count: 0 });
      }
      return;
    }

    // 5. Intelligence, Knowledge & Agentic OS
    if ((pathname === "/api/v1/intelligence/headspace/search" || pathname === "/api/v1/intelligence/headspace/query") && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const results = context.headspace.search(body.query || "", body.userLevel || "INTERNAL", body.filterCategory);
      sendJson(res, 200, { results, count: results.length });
      return;
    }

    if (pathname === "/api/v1/intelligence/cr8tech/subtitle" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const track = context.cr8tech.generateSubtitles({
        id: body.id || `sub-${Date.now()}`,
        assetId: body.assetId || "asset-001",
        language: body.language || "EN",
        format: body.format || "WEBVTT",
        cues: body.cues || [],
      });
      sendText(res, 200, track.renderedContent, "text/vtt; charset=utf-8");
      return;
    }

    if (pathname === "/api/v1/intelligence/aos/execute" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "agent");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      try {
        const proposal = context.aos.submitProposal({
          id: body.id || `prop-${Date.now()}`,
          agentId: body.agentId,
          criticality: body.criticality || "MEDIUM_DRAFT",
          targetDomain: body.targetDomain || "BROADCAST",
          proposedAction: body.proposedAction || "OPTIMIZE_SCHEDULE",
          payload: body.payload || {},
        });

        recordAuditLog({
          userId: user.userId,
          action: "aos.execute",
          resource: "agent",
          resourceId: proposal.id,
          changes: { agentId: body.agentId, targetDomain: body.targetDomain, criticality: body.criticality },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });

        sendJson(res, 200, { proposal });
      } catch (err: any) {
        // Domain rejections (kill switches, agent inactivity, daily quota) are
        // business-rule outcomes, not authorization failures: 422 keeps RBAC
        // semantics distinct from agent governance outcomes.
        sendJson(res, 422, { error: err.message, status: "REJECTED" });
      }
      return;
    }

    if (pathname === "/api/v1/intelligence/aos/killswitch" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "agent");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      if (body.agentId) {
        context.aos.engageAgentKillSwitch(body.agentId);
        recordAuditLog({
          userId: user.userId,
          action: "aos.killswitch.agent",
          resource: "agent",
          resourceId: body.agentId,
          changes: { reason: body.reason || "Emergency agent containment" },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { success: true, message: `Killswitch engaged for agent ${body.agentId}` });
      } else {
        context.aos.engageGlobalKillSwitch(body.reason || "Emergency platform containment");
        recordAuditLog({
          userId: user.userId,
          action: "aos.killswitch.global",
          resource: "agent",
          resourceId: "GLOBAL",
          changes: { reason: body.reason || "Emergency platform containment" },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { success: true, message: "Global killswitch engaged" });
      }
      return;
    }

    // 6. Azeebo+ Federation
    if (pathname === "/api/v1/federation/azeebo/webhook" && method === "POST") {
      // TODO-SEC-09: inbound ingestion is now HMAC-verified per
      // AZEEBO_WEBHOOK_SECRET (timestamp-bound to block replay). Production
      // enablement remains behind the operator opt-in flag pending the
      // partner contract sign-off (recorded human decision).
      if (process.env.NODE_ENV === "production" && process.env.AZEEBO_WEBHOOK_INGESTION_ENABLED !== "true") {
        sendJson(res, 501, {
          error: "Not Implemented",
          message:
            "Azeebo+ inbound ingestion is disabled in production; enable AZEEBO_WEBHOOK_INGESTION_ENABLED only after the partner signature contract is confirmed (human decision).",
          code: "FEDERATION_INGESTION_NOT_VERIFIED",
        });
        return;
      }

      const rawBody = await parseRawBody(req, pathname);
      const signatureHeader = String(req.headers["x-azeebo-signature"] || "");
      const timestampHeader = String(req.headers["x-azeebo-timestamp"] || "");

      // Replay window: signatures older than 5 minutes are rejected.
      const REPLAY_WINDOW_MS = 5 * 60 * 1000;
      const timestampMs = Date.parse(timestampHeader);
      // A MISSING timestamp/signature is a malformed request (400 — the call
      // never presented credentials to evaluate); a PRESENTED but wrong
      // signature is an authentication failure (401).
      if (!timestampHeader) {
        sendJson(res, 400, { error: "Bad Request", code: "FEDERATION_TIMESTAMP_REQUIRED", message: "X-Azeebo-Timestamp header is required." });
        return;
      }
      if (Number.isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > REPLAY_WINDOW_MS) {
        sendJson(res, 401, { error: "Unauthorized", code: "FEDERATION_TIMESTAMP_INVALID", message: "Stale X-Azeebo-Timestamp (±5 min window)." });
        return;
      }

      if (!signatureHeader) {
        sendJson(res, 400, { error: "Bad Request", code: "FEDERATION_SIGNATURE_REQUIRED", message: "X-Azeebo-Signature header is required." });
        return;
      }
      if (!context.azeeboBridge.verifyInboundSignature(rawBody, timestampHeader, signatureHeader)) {
        recordAuditLog({
          action: "federation.azeebo.webhook.rejected",
          resource: "agent",
          resourceId: "azeebo-webhook",
          changes: { reason: "SIGNATURE_INVALID" },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 401, { error: "Unauthorized", code: "FEDERATION_SIGNATURE_INVALID", message: "HMAC signature verification failed." });
        return;
      }

      let body: any;
      try {
        body = JSON.parse(rawBody);
      } catch {
        sendJson(res, 400, { error: "Bad Request", code: "FEDERATION_PAYLOAD_INVALID", message: "Body must be JSON." });
        return;
      }

      const defaultEndpoint = `${getConfig().AZEEBO_API_BASE_URL.replace(/\/+$/, "")}/webhooks`;
      const webhook = context.azeeboBridge.dispatchWebhook(
        body.eventType || "CONTENT_SYNDICATED",
        body.targetEndpoint || defaultEndpoint,
        body.payload || {}
      );
      sendJson(res, webhook.status === "DELIVERED" ? 200 : 503, { webhook, authenticated: true });
      return;
    }

    if ((pathname === "/api/v1/federation/azeebo/link" || pathname === "/api/v1/federation/azeebo/links") && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const link = context.azeeboLinks.createUniversalLink(body);
      sendJson(res, 201, { link });
      return;
    }

    // -----------------------------------------------------------------------
    // Todo register remediation routes (SCR-04/05/08/09/11, BCST-02/04/05)
    // -----------------------------------------------------------------------

    // TODO-SCR-08: restricted privacy/security case queue. RBAC admits to the
    // queue (create/update:case); the domain itself restricts CONTENT reads to
    // the assigned case owner — list/read never cross the ownership boundary.
    if (pathname === "/api/v1/cases" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "case");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      try {
        const kase = openCase({
          id: body.id || `CASE-${Date.now().toString(36).toUpperCase()}`,
          type: body.type === "SECURITY_REPORT" ? "SECURITY_REPORT" : "PRIVACY_REQUEST",
          subject: String(body.subject || ""),
          detail: String(body.detail || ""),
          reporterContact: String(body.reporterContact || user.email),
          dataSubjects: Array.isArray(body.dataSubjects) ? body.dataSubjects.map(String) : undefined,
        });
        recordAuditLog({
          userId: user.userId,
          action: "case.opened",
          resource: "case",
          resourceId: kase.id,
          changes: { type: kase.type, slaDueAt: kase.slaDueAt.toISOString() },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 201, {
          status: "SUCCESS",
          caseId: kase.id,
          type: kase.type,
          slaDueAt: kase.slaDueAt.toISOString(),
          note: "Contents are restricted to the assigned case owner (UX-GOV-009/010).",
        });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CASE_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname === "/api/v1/cases" && method === "GET") {
      const user = assertRoutePermission(req, res, "read", "case");
      if (!user) return;
      // Restricted queue: an operator sees only cases they own (or, for
      // SuperAdmin, counts only — contents never leak via the list endpoint).
      const typeParam = parsedUrl.searchParams.get("type") as CaseType | null;
      const owned = listCasesForOwner(user.userId, typeParam || undefined);
      sendJson(res, 200, {
        status: "SUCCESS",
        cases: owned.map((k) => ({
          id: k.id,
          type: k.type,
          subject: k.subject,
          status: k.status,
          slaDueAt: k.slaDueAt.toISOString(),
          assignedCaseOwner: k.assignedCaseOwner,
        })),
        count: owned.length,
        scope: "ASSIGNED_CASE_OWNER_ONLY",
      });
      return;
    }

    if (pathname.startsWith("/api/v1/cases/") && pathname.endsWith("/assign") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "case");
      if (!user) return;
      const caseId = pathname.replace("/api/v1/cases/", "").replace("/assign", "").trim();
      const body = await parseJsonBody(req, pathname);
      if (!getCase(caseId)) {
        sendJson(res, 404, { status: "REJECTED", code: "CASE_NOT_FOUND", message: `Case '${caseId}' not found.` });
        return;
      }
      const kase = assignCase(caseId, String(body.caseOwnerId || user.userId));
      recordAuditLog({
        userId: user.userId,
        action: "case.assigned",
        resource: "case",
        resourceId: caseId,
        changes: { caseOwnerId: kase.assignedCaseOwner },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, { status: "SUCCESS", caseId, assignedCaseOwner: kase.assignedCaseOwner });
      return;
    }

    if (pathname.startsWith("/api/v1/cases/") && pathname.endsWith("/transition") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "case");
      if (!user) return;
      const caseId = pathname.replace("/api/v1/cases/", "").replace("/transition", "").trim();
      const body = await parseJsonBody(req, pathname);
      const existing = getCase(caseId);
      if (!existing) {
        sendJson(res, 404, { status: "REJECTED", code: "CASE_NOT_FOUND", message: `Case '${caseId}' not found.` });
        return;
      }
      if (!canReadCase(existing, user.userId)) {
        sendJson(res, 403, { status: "REJECTED", code: "CASE_NOT_OWNER", message: "Only the assigned case owner may work this case." });
        return;
      }
      try {
        const kase = transitionCase(caseId, user.userId, body.target as CaseStatus, body.note ? String(body.note) : undefined);
        sendJson(res, 200, { status: "SUCCESS", caseId, state: kase.status });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "CASE_TRANSITION_INVALID", message: err?.message });
      }
      return;
    }

    // TODO-SCR-11: My Work aggregation over registered domain queues.
    if (pathname === "/api/v1/workspace/my-work" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: "Unauthorized", message: "Sign in to view your work queue.", code: "AUTH_TOKEN_REQUIRED" });
        return;
      }
      const tasks = aggregateMyWork(user.userId, user.roles);
      sendJson(res, 200, {
        status: "SUCCESS",
        tasks,
        counts: {
          total: tasks.length,
          blockers: tasks.filter((t) => t.priority === 1).length,
          byDomain: tasks.reduce<Record<string, number>>((acc, t) => {
            acc[t.domain] = (acc[t.domain] || 0) + 1;
            return acc;
          }, {}),
        },
      });
      return;
    }

    // TODO-SCR-09: authorised search — server-side, role- and tenant-scoped.
    if (pathname === "/api/v1/search" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: "Unauthorized", message: "Sign in to search enterprise records.", code: "AUTH_TOKEN_REQUIRED" });
        return;
      }
      const query = parsedUrl.searchParams.get("q") || "";
      const results = authorisedSearch({
        query,
        userId: user.userId,
        roles: user.roles,
        tenantId: user.tenantId,
      });
      sendJson(res, 200, { status: "SUCCESS", query, results, count: results.length });
      return;
    }

    // TODO-SCR-04: verified Azeebo+ destination registry.
    if (pathname === "/api/v1/federation/destinations" && method === "GET") {
      sendJson(res, 200, { status: "SUCCESS", destinations: listDestinations() });
      return;
    }

    if (pathname === "/api/v1/federation/destinations" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "agent");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      try {
        const dest = registerDestination({
          id: String(body.id || ""),
          universe: String(body.universe || "azeebo-plus"),
          universalUrl: String(body.universalUrl || ""),
          verifiedBy: user.email,
          campaignContextAllowed: body.campaignContextAllowed !== false,
        });
        recordAuditLog({
          userId: user.userId,
          action: "federation.destination.registered",
          resource: "agent",
          resourceId: dest.id,
          changes: { universalUrl: dest.universalUrl },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 201, { status: "SUCCESS", destination: dest });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "DEST_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/federation/destinations/") && pathname.endsWith("/revoke") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "agent");
      if (!user) return;
      const destId = pathname.replace("/api/v1/federation/destinations/", "").replace("/revoke", "").trim();
      try {
        const dest = revokeDestination(destId, user.email);
        sendJson(res, 200, { status: "SUCCESS", destination: dest });
      } catch (err: any) {
        sendJson(res, 404, { status: "REJECTED", code: "DEST_NOT_FOUND", message: err?.message });
      }
      return;
    }

    // TODO-SCR-05: enquiry routing configuration (authorised operators only).
    if (pathname === "/api/v1/enquiries/routing-config" && method === "GET") {
      const user = assertRoutePermission(req, res, "read", "audit");
      if (!user) return;
      sendJson(res, 200, { status: "SUCCESS", rules: listRoutingRules() });
      return;
    }

    if (pathname === "/api/v1/enquiries/routing-config" && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "audit");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      try {
        const rule = setRoutingRule({
          vertical: String(body.vertical || ""),
          targetQueue: String(body.targetQueue || ""),
          targetOwner: String(body.targetOwner || ""),
          acknowledgementTemplate: body.acknowledgementTemplate ? String(body.acknowledgementTemplate) : undefined,
          updatedBy: user.email,
        });
        recordAuditLog({
          userId: user.userId,
          action: "enquiries.routing_config.updated",
          resource: "audit",
          resourceId: rule.vertical,
          changes: { targetQueue: rule.targetQueue, targetOwner: rule.targetOwner },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { status: "SUCCESS", rule });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "ROUTE_CFG_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/enquiries/routing-config/") && pathname.endsWith("/deactivate") && method === "POST") {
      const user = assertRoutePermission(req, res, "update", "audit");
      if (!user) return;
      const vertical = pathname.replace("/api/v1/enquiries/routing-config/", "").replace("/deactivate", "").trim();
      try {
        const rule = deactivateRoutingRule(vertical, user.email);
        sendJson(res, 200, { status: "SUCCESS", rule });
      } catch (err: any) {
        sendJson(res, 404, { status: "REJECTED", code: "ROUTE_CFG_NOT_FOUND", message: err?.message });
      }
      return;
    }

    // -----------------------------------------------------------------------
    // Todo register HTML work surfaces (SCR-07/09/10/11/16)
    // -----------------------------------------------------------------------

    // TODO-SCR-11: My Work — aggregated, access-scoped task queue.
    if (pathname === "/workspace/my-work" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/workspace/my-work" });
        res.end();
        return;
      }
      const tasks = aggregateMyWork(user.userId, user.roles);
      const html = renderMasterLayout(
        "My Work | VMNL",
        renderMyWorkHtml({ email: user.email, roles: user.roles }, tasks),
        pathname,
        { sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-09: authorised search results page (server-side scoped).
    if (pathname === "/workspace/search" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/workspace/search" });
        res.end();
        return;
      }
      const query = parsedUrl.searchParams.get("q") || "";
      const results = authorisedSearch({ query, userId: user.userId, roles: user.roles, tenantId: user.tenantId });
      const html = renderMasterLayout(
        "Authorised Search | VMNL",
        renderSearchResultsHtml({ email: user.email, roles: user.roles }, query, results),
        pathname,
        { sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-10: notifications inbox (in-app, preference-aware).
    if (pathname === "/workspace/notifications" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/workspace/notifications" });
        res.end();
        return;
      }
      markInAppNotificationsRead(user.userId);
      const notifications = listInAppNotifications(user.userId).map((n) => ({
        id: n.id,
        category: n.category,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt,
        readAt: n.readAt,
        route: n.route,
      }));
      const html = renderMasterLayout(
        "Notifications | VMNL",
        renderNotificationsHtml({ email: user.email }, notifications),
        pathname,
        { sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-07/16: governance & shared records console (read-only).
    if (pathname === "/workspace/governance/records" && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=/workspace/governance/records" });
        res.end();
        return;
      }
      const canSeeAudit = user.roles.some((r) => ["SuperAdmin", "ExecutiveLeader", "Auditor", "FinanceController"].includes(r));
      const auditEntries = canSeeAudit ? getAuditLogs({ limit: 25 }) : [];
      // Canonical stores for rights/settlements/evidence are Prisma-backed and
      // not seeded in the sandbox; the projections render honest empty states
      // rather than inventing rows (TODO-SCR-07 acceptance).
      const pageData: GovernanceRecordsPageData = {
        rights: [],
        settlements: [],
        evidence: [],
        incidents: [],
      };
      const html = renderMasterLayout(
        "Governance & Shared Records | VMNL",
        renderGovernanceRecordsHtml(auditEntries, pageData, user.roles),
        pathname,
        { sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-SCR-08: restricted case queues (privacy & security).
    if (pathname.startsWith("/workspace/cases/") && method === "GET") {
      const user = resolveSessionUser(req);
      if (!user) {
        res.writeHead(302, { Location: "/sign-in?returnUrl=" + encodeURIComponent(pathname) });
        res.end();
        return;
      }
      const caseType: CaseType = pathname.endsWith("/security") ? "SECURITY_REPORT" : "PRIVACY_REQUEST";
      const owned = listCasesForOwner(user.userId, caseType);
      const rows =
        owned.length === 0
          ? `<tr><td colspan="4" style="padding: 28px 14px; text-align: center; color: var(--vmn-color-secondary-text);">No ${caseType === "PRIVACY_REQUEST" ? "privacy" : "security"} cases are assigned to you. Case contents are restricted to the assigned owner (UIUX-001 §5.6).</td></tr>`
          : owned
              .map(
                (k) => `
          <tr style="border-bottom: 1px solid var(--vmn-color-border);">
            <td style="padding: 10px 12px; font-family: monospace; font-weight: 700;">${escapeHtml(k.id)}</td>
            <td style="padding: 10px 12px; font-weight: 700;">${escapeHtml(k.subject)}</td>
            <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">${escapeHtml(k.status)}</span></td>
            <td style="padding: 10px 12px; font-size: 0.8rem; color: var(--vmn-color-secondary-text);">SLA due ${escapeHtml(k.slaDueAt.toISOString().substring(0, 16).replace("T", " "))} UTC</td>
          </tr>`
              )
              .join("");
      const html = renderMasterLayout(
        `${caseType === "PRIVACY_REQUEST" ? "Privacy Request" : "Security Report"} Cases | VMNL`,
        `<div style="max-width: 1000px; margin: 32px auto; padding: 0 16px;">
          <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">RESTRICTED QUEUE &bull; ${caseType === "PRIVACY_REQUEST" ? "UX-GOV-009" : "UX-GOV-010"}</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; margin: 8px 0;">${caseType === "PRIVACY_REQUEST" ? "Privacy Request Cases" : "Security Report Cases"}</h1>
          <p style="color: var(--vmn-color-secondary-text); margin-bottom: 20px;">Assigned to you only — these cases never appear as ordinary project tasks.</p>
          <div class="vmn-card" style="border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
              <thead><tr style="background: var(--vmn-color-background); text-align: left; border-bottom: 2px solid var(--vmn-color-border);">
                <th style="padding: 12px 14px;">Case</th><th style="padding: 12px 14px;">Subject</th><th style="padding: 12px 14px;">State</th><th style="padding: 12px 14px;">SLA</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`,
        pathname,
        { sessionUser: user }
      );
      sendHtml(res, 200, html);
      return;
    }

    // TODO-BCST-04/05: broadcast version registration & Ready-For-Air workflow.
    if (pathname === "/api/v1/broadcast/versions" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "broadcast");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      try {
        const version = registerVersion({
          id: String(body.id || `VER-${Date.now().toString(36).toUpperCase()}`),
          episodeId: String(body.episodeId || ""),
          versionType: body.versionType || "MASTER",
          durationSeconds: Number(body.durationSeconds || 0),
          qc: {
            videoStandard: body.qc?.videoStandard || "1080i50",
            aspectRatio: "16:9",
            audioLoudnessLufs: Number(body.qc?.audioLoudnessLufs ?? -23),
            hasCountdownSlate: body.qc?.hasCountdownSlate !== false,
            hasBlackGaps: body.qc?.hasBlackGaps === true,
            hasClosedCaptionTrack: body.qc?.hasClosedCaptionTrack === true,
            ccTrackFormat: body.qc?.ccTrackFormat,
          },
          mediaAssetId: body.mediaAssetId ? String(body.mediaAssetId) : undefined,
        });
        sendJson(res, 201, {
          status: "SUCCESS",
          versionId: version.id,
          qcStatus: version.qcStatus,
          qcFailures: version.qcStatus === "FAILED" ? "See QC report; RFA requires compliance or explicit override." : undefined,
        });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "VER_INVALID", message: err?.message });
      }
      return;
    }

    if (pathname.startsWith("/api/v1/broadcast/versions/") && pathname.endsWith("/ready-for-air") && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "broadcast");
      if (!user) return;
      const versionId = pathname.replace("/api/v1/broadcast/versions/", "").replace("/ready-for-air", "").trim();
      const body = await parseJsonBody(req, pathname);
      try {
        const version = markReadyForAir({
          versionId,
          rfaBy: user.userId,
          overrideReason: body.overrideReason ? String(body.overrideReason) : undefined,
        });
        recordAuditLog({
          userId: user.userId,
          action: "broadcast.version.rfa",
          resource: "broadcast",
          resourceId: versionId,
          changes: {
            qcStatus: version.qcStatus,
            overrideReason: version.qcOverrideReason || null,
            overrideBy: version.qcOverrideBy || null,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { status: "SUCCESS", versionId, readyForAir: version.readyForAir, qcStatus: version.qcStatus });
      } catch (err: any) {
        const overrideRequired = err?.message?.includes("VER-03");
        sendJson(res, overrideRequired ? 422 : 404, {
          status: "REJECTED",
          code: overrideRequired ? "QC_OVERRIDE_REQUIRED" : "VERSION_NOT_FOUND",
          message: err?.message,
        });
      }
      return;
    }

    // 7. Finance & Commercial Ledger
    if ((pathname === "/api/v1/finance/deals" || pathname === "/api/v1/finance/quotes/create") && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "contract");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const deal = context.salesEngine.createDeal(body);

      recordAuditLog({
        userId: user.userId,
        action: "finance.deal.create",
        resource: "contract",
        resourceId: deal.id,
        changes: { clientOrgId: deal.clientOrgId, dealName: deal.dealName, totalContractValueNgn: deal.totalContractValueNgn },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      sendJson(res, 201, { deal, quote: deal });
      return;
    }

    if (pathname === "/api/v1/finance/payouts/batch" && method === "POST") {
      const user = assertRoutePermission(req, res, "create", "finance");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      const batch = context.payoutEngine.createPayoutBatch(body);

      recordAuditLog({
        userId: user.userId,
        action: "finance.payout.create",
        resource: "finance",
        resourceId: batch.id,
        changes: { totalNetDisbursementNgn: batch.totalNetDisbursementNgn, itemsCount: batch.items.length },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      sendJson(res, 201, { batch });
      return;
    }

    if ((pathname === "/api/v1/finance/reconcile/bank" || pathname === "/api/v1/finance/reconcile") && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "finance");
      if (!user) return;

      const body = await parseJsonBody(req, pathname);
      context.bankRecon.ingestBankTransactions(body.transactions || []);
      const results = context.bankRecon.reconcileAgainstInvoices(body.invoices || []);

      recordAuditLog({
        userId: user.userId,
        action: "finance.reconcile.run",
        resource: "finance",
        resourceId: `recon-${Date.now()}`,
        changes: { transactionCount: (body.transactions || []).length, resultsCount: results.length },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });

      sendJson(res, 200, { results, count: results.length });
      return;
    }

    // TODO-FIN-02: Maker-Checker payout approval — checker must hold an
    // authorising finance role and be distinct from the maker (PAY-CHK-02).
    if (pathname.startsWith("/api/v1/finance/payouts/") && pathname.endsWith("/approve") && method === "POST") {
      const user = assertRoutePermission(req, res, "approve", "finance");
      if (!user) return;
      const batchId = pathname.replace("/api/v1/finance/payouts/", "").replace("/approve", "").trim();
      const batch = context.payoutEngine.getBatch(batchId);
      if (!batch) {
        sendJson(res, 404, { status: "REJECTED", code: "PAY_NOT_FOUND", message: `Payout batch '${batchId}' not found.` });
        return;
      }
      try {
        const approved = context.payoutEngine.approvePayoutBatch(batchId, user.userId);
        recordAuditLog({
          userId: user.userId,
          action: "finance.payout.approved",
          resource: "finance",
          resourceId: batchId,
          changes: {
            checkerApproverId: approved.checkerApproverId,
            makerUserId: approved.makerUserId,
            totalNetDisbursementNgn: approved.totalNetDisbursementNgn,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, { status: "SUCCESS", batchId, approvalState: approved.status });
      } catch (err: any) {
        const sod = err?.message?.includes("PAY-CHK-02");
        recordAuditLog({
          userId: user.userId,
          action: "finance.payout.approval_rejected",
          resource: "finance",
          resourceId: batchId,
          changes: { reason: err?.message },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, sod ? 403 : 422, { status: "REJECTED", code: sod ? "PAY_MAKER_CHECKER_VIOLATION" : "PAY_STATE_INVALID", message: err?.message });
      }
      return;
    }

    // TODO-FIN-02: NIP CSV export — approved batches only (PAY-EXP-01),
    // returned as a downloadable attachment.
    if (pathname.startsWith("/api/v1/finance/payouts/") && pathname.endsWith("/nip-csv") && method === "POST") {
      const user = assertRoutePermission(req, res, "read", "finance");
      if (!user) return;
      const batchId = pathname.replace("/api/v1/finance/payouts/", "").replace("/nip-csv", "").trim();
      try {
        const csv = context.payoutEngine.exportNipCsv(batchId);
        recordAuditLog({
          userId: user.userId,
          action: "finance.payout.nip_exported",
          resource: "finance",
          resourceId: batchId,
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        res.writeHead(200, {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="nip-${batchId}.csv"`,
        });
        res.end(csv);
      } catch (err: any) {
        const unapproved = err?.message?.includes("PAY-EXP-01");
        sendJson(res, unapproved ? 422 : 404, {
          status: "REJECTED",
          code: unapproved ? "PAY_BATCH_NOT_APPROVED" : "PAY_NOT_FOUND",
          message: err?.message,
        });
      }
      return;
    }

    // TODO-FIN-05: MT940 bank statement ingestion — raw SWIFT text is parsed
    // server-side and ingested into the reconciliation engine; unmatched lines
    // land in suspense per the reconciliation engine's existing behaviour.
    if (pathname === "/api/v1/finance/mt940/ingest" && method === "POST") {
      const user = assertRoutePermission(req, res, "execute", "finance");
      if (!user) return;
      const body = await parseJsonBody(req, pathname);
      const statementText = typeof body.statementText === "string" ? body.statementText : "";
      if (!statementText.trim()) {
        sendJson(res, 400, { error: "Bad Request", message: "statementText (raw SWIFT MT940 message) is required.", code: "MT940_STATEMENT_REQUIRED" });
        return;
      }
      try {
        const parsed = Mt940Parser.parse(statementText);
        const records = Mt940Parser.toBankTransactionRecords(parsed);
        context.bankRecon.ingestBankTransactions(records);
        recordAuditLog({
          userId: user.userId,
          action: "finance.mt940.ingested",
          resource: "finance",
          resourceId: parsed.header.transactionReference || `mt940-${Date.now()}`,
          changes: {
            accountNumber: parsed.header.accountNumber,
            statementNumber: parsed.header.statementNumber,
            lineCount: records.length,
            totalCreditsNgn: parsed.totalCreditsNgn,
            totalDebitsNgn: parsed.totalDebitsNgn,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, {
          status: "SUCCESS",
          transactionReference: parsed.header.transactionReference,
          linesIngested: records.length,
          totalCreditsNgn: parsed.totalCreditsNgn,
          totalDebitsNgn: parsed.totalDebitsNgn,
        });
      } catch (err: any) {
        sendJson(res, 422, { status: "REJECTED", code: "MT940_PARSE_FAILED", message: err?.message });
      }
      return;
    }

    // TODO-FIN-01: explicit delivery-gated revenue recognition (see GVR-05;
    // final accounting treatment awaits the FinanceController ruling — the
    // record of that decision remains PENDING in DEC-RL1-SCOPE-001).
    if (pathname === "/api/v1/finance/deals/:dealId/recognition" && method === "POST") {
      const user = assertRoutePermission(req, res, "approve", "finance");
      if (!user) return;
      const dealId = String((pathname.match(/^\/api\/v1\/finance\/deals\/([^/]+)\/recognition$/) || [])[1] || "");
      const body = await parseJsonBody(req, pathname);
      const amountNgn = Number(body.amountNgn);
      if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
        sendJson(res, 422, { status: "REJECTED", code: "QTC_REC_INVALID", message: "amountNgn must be a positive number." });
        return;
      }
      try {
        const deal = context.salesEngine.recognizeRevenue(dealId, amountNgn);
        recordAuditLog({
          userId: user.userId,
          action: "finance.revenue.recognized",
          resource: "finance",
          resourceId: dealId,
          changes: {
            amountNgn,
            recognizedRevenueNgn: deal.recognizedRevenueNgn,
            stage: deal.stage,
            proofOfPerformanceVerified: deal.proofOfPerformanceVerified,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, {
          status: "SUCCESS",
          dealId,
          recognizedRevenueNgn: deal.recognizedRevenueNgn,
          cashCollectedAmountNgn: deal.cashCollectedAmountNgn,
          stage: deal.stage,
        });
      } catch (err: any) {
        const noProof = err?.message?.includes("QTC-REC-02");
        const overCap = err?.message?.includes("QTC-REC-03");
        sendJson(res, noProof ? 403 : 422, {
          status: "REJECTED",
          code: noProof ? "QTC_PROOF_REQUIRED" : overCap ? "QTC_CONTRACT_CAP" : "QTC_REC_INVALID",
          message: err?.message,
        });
      }
      return;
    }

    // TODO-FIN-06: escrow milestone release — dual-authorised disbursement
    // behind FF_FINANCE_PAYMENT_RELEASE (governance kill switch; prod default
    // OFF). Human authorisation (release authority) + verified deliverable.
    if (pathname.startsWith("/api/v1/vtm/contracts/") && pathname.includes("/milestones/") && pathname.endsWith("/release-escrow") && method === "POST") {
      const user = assertRoutePermission(req, res, "approve", "finance");
      if (!user) return;
      try {
        assertFeatureEnabled("FF_FINANCE_PAYMENT_RELEASE", "Escrow milestone disbursement");
      } catch (err: any) {
        sendFeatureDisabled(res, err, req.headers["content-type"] || "", "/portal/vtm");
        return;
      }
      const match = pathname.match(/^\/api\/v1\/vtm\/contracts\/([^/]+)\/milestones\/([^/]+)\/release-escrow$/);
      const contractId = match?.[1] || "";
      const milestoneId = match?.[2] || "";
      const contract = context.vtmEngine.getContract(contractId);
      if (!contract) {
        sendJson(res, 404, { status: "REJECTED", code: "VTM_CONTRACT_NOT_FOUND", message: `Contract '${contractId}' not found.` });
        return;
      }
      try {
        const milestone = context.vtmEngine.releaseMilestoneEscrow(contractId, milestoneId, user.userId);
        recordAuditLog({
          userId: user.userId,
          action: "finance.escrow.released",
          resource: "finance",
          resourceId: `${contractId}/${milestoneId}`,
          changes: {
            platformCommissionNgn: milestone.platformCommissionNgn,
            talentDisbursedAmountNgn: milestone.talentDisbursedAmountNgn,
            releasedBy: user.email,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 200, {
          status: "SUCCESS",
          contractId,
          milestoneId,
          approvalState: milestone.status,
          platformCommissionNgn: milestone.platformCommissionNgn,
          talentDisbursedAmountNgn: milestone.talentDisbursedAmountNgn,
        });
      } catch (err: any) {
        const stateErr = err?.message?.includes("VTM-ESC-06");
        sendJson(res, stateErr ? 422 : 404, { status: "REJECTED", code: "VTM_ESCROW_STATE_INVALID", message: err?.message });
      }
      return;
    }

    // 7.5 Payment Gateway Webhook Receivers (Paystack & Flutterwave)
    if (pathname === "/api/v1/webhooks/paystack" && method === "POST") {
      const signatureHeader = (req.headers["x-paystack-signature"] as string) || "";
      const rawBody = await parseRawBody(req, pathname);
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      const bypassAllowed =
        process.env.NODE_ENV === "development" && process.env.WEBHOOK_SIGNATURE_BYPASS_ALLOWED === "true";

      if (!secretKey && !bypassAllowed) {
        sendJson(res, 401, { error: "Unauthorized", message: "Paystack secret key is not configured" });
        return;
      }

      if (!bypassAllowed) {
        if (!signatureHeader) {
          sendJson(res, 401, { error: "Unauthorized", message: "Missing Paystack signature header" });
          return;
        }
        const isValid = PaymentGatewayWebhookValidator.verifyPaystackSignature(rawBody, signatureHeader, secretKey || "");
        if (!isValid) {
          sendJson(res, 401, { error: "Unauthorized", message: "Invalid Paystack signature" });
          return;
        }
      }

      let payload: any = {};
      try {
        payload = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "Bad Request", message: "Invalid JSON body" });
        return;
      }

      const event = payload.event || "charge.success";
      const data = payload.data || {};

      if (event === "charge.success" || event === "transfer.success") {
        const amountNgn = typeof data.amount === "number" ? data.amount / 100 : 0;
        const eventId = data.id !== undefined && data.id !== null ? String(data.id) : (data.reference || `PSK-${Date.now()}`);
        const ref = data.reference || `PSK-${Date.now()}`;
        context.bankRecon.ingestBankTransactions([
          {
            id: `PAYSTACK-${eventId}`,
            source: "PAYSTACK",
            transactionReference: ref,
            bankNarration: `Paystack: ${data.customer?.email || "Direct"} - ${data.gateway_response || event}`,
            amountNgn,
            valueDate: data.paid_at ? new Date(data.paid_at) : new Date(),
          },
        ]);
      }

      context.telemetry.recordMetric("webhook_paystack_received_total", 1, { event });
      recordAuditLog({
        userId: "SYSTEM_PAYSTACK_WEBHOOK",
        action: "webhook.paystack.received",
        resource: "webhook",
        resourceId: String(data.reference || data.id || `PSK-${Date.now()}`),
        changes: { event, amount: data.amount },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, { status: "success", message: "Paystack webhook processed", event });
      return;
    }

    if (pathname === "/api/v1/webhooks/flutterwave" && method === "POST") {
      const secretHashHeader = (req.headers["verif-hash"] as string) || "";
      const rawBody = await parseRawBody(req, pathname);
      const configuredHash = process.env.FLUTTERWAVE_SECRET_HASH;
      const bypassAllowed =
        process.env.NODE_ENV === "development" && process.env.WEBHOOK_SIGNATURE_BYPASS_ALLOWED === "true";

      if (!configuredHash && !bypassAllowed) {
        sendJson(res, 401, { error: "Unauthorized", message: "Flutterwave secret hash is not configured" });
        return;
      }

      if (!bypassAllowed) {
        if (!secretHashHeader) {
          sendJson(res, 401, { error: "Unauthorized", message: "Missing Flutterwave verification hash header" });
          return;
        }
        const isValid = PaymentGatewayWebhookValidator.verifyFlutterwaveSignature(secretHashHeader, configuredHash || "");
        if (!isValid) {
          sendJson(res, 401, { error: "Unauthorized", message: "Invalid Flutterwave verification hash" });
          return;
        }
      }

      let payload: any = {};
      try {
        payload = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        sendJson(res, 400, { error: "Bad Request", message: "Invalid JSON body" });
        return;
      }

      const event = payload.event || "charge.completed";
      const data = payload.data || {};

      if (event === "charge.completed" || event === "transfer.completed") {
        const amountNgn = typeof data.amount === "number" ? data.amount : 0;
        const eventId = data.id !== undefined && data.id !== null ? String(data.id) : (data.tx_ref || data.flw_ref || `FLW-${Date.now()}`);
        const ref = data.tx_ref || data.flw_ref || `FLW-${Date.now()}`;
        context.bankRecon.ingestBankTransactions([
          {
            id: `FLW-${eventId}`,
            source: "FLUTTERWAVE",
            transactionReference: ref,
            bankNarration: `Flutterwave: ${data.customer?.email || "Direct"} - ${data.status || event}`,
            amountNgn,
            valueDate: data.created_at ? new Date(data.created_at) : new Date(),
          },
        ]);
      }

      context.telemetry.recordMetric("webhook_flutterwave_received_total", 1, { event });
      recordAuditLog({
        userId: "SYSTEM_FLUTTERWAVE_WEBHOOK",
        action: "webhook.flutterwave.received",
        resource: "webhook",
        resourceId: String(data.tx_ref || data.id || `FLW-${Date.now()}`),
        changes: { event, amount: data.amount },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, { status: "success", message: "Flutterwave webhook processed", event });
      return;
    }

    // 8. Quality Release Gates
    if (pathname === "/api/v1/quality/gates" && method === "POST") {
      const manifest: any = await parseJsonBody(req, pathname);
      const sessionUser = resolveSessionUser(req);
      if (manifest?.gates?.BG0_CHANNEL_AUTHORITY) {
        const evaluation = ReleaseGatePipeline.evaluateBroadcastRelease(manifest);
        recordAuditLog({
          userId: sessionUser?.userId || "SYSTEM_RELEASE_GATE",
          action: "gates.evaluate",
          resource: "release_gate",
          resourceId: manifest?.version || `rel-${Date.now()}`,
          changes: { canDeploy: evaluation.canDeploy, decision: (evaluation as any).decision },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, evaluation.canDeploy ? 200 : 422, evaluation);
      } else {
        const evaluation = ReleaseGatePipeline.evaluateRelease(manifest);
        recordAuditLog({
          userId: sessionUser?.userId || "SYSTEM_RELEASE_GATE",
          action: "gates.evaluate",
          resource: "release_gate",
          resourceId: manifest?.version || `rel-${Date.now()}`,
          changes: { canDeploy: evaluation.canDeploy, decision: (evaluation as any).decision },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, evaluation.canDeploy ? 200 : 422, evaluation);
      }
      return;
    }

    // 9. Digital Asset Management (DAM) Storage Endpoints (T9-05)
    if (pathname === "/api/v1/storage/upload-url" && method === "POST") {
      // AUD-04: presigning is authenticated (route guard: create:storage) and
      // tenant scoping comes from the verified session, never the body, so a
      // caller cannot target another tenant's namespace.
      const user = resolveSessionUser(req);
      const body = await parseJsonBody(req, pathname);
      const presigned = generatePresignedUploadUrl({
        fileName: body.fileName || `asset-${Date.now()}.mp4`,
        contentType: body.contentType || "video/mp4",
        fileSizeBytes: body.fileSizeBytes,
        tenantId: user?.tenantId,
      });
      recordAuditLog({
        userId: user?.userId || null,
        action: "storage.presign",
        resource: "storage",
        resourceId: presigned.assetKey,
        changes: { contentType: body.contentType, fileSizeBytes: body.fileSizeBytes || null },
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
      });
      sendJson(res, 200, presigned);
      return;
    }

    if (pathname === "/api/v1/storage/scan" && method === "POST") {
      const body = await parseJsonBody(req, pathname);
      const rawContent = body.contentBase64 || body.content || "";
      // AUD-11: cap the in-memory decode before Buffer allocation so an
      // oversized body cannot turn the scan endpoint into an OOM primitive.
      const decodedBytesEstimate =
        typeof rawContent === "string" ? Math.ceil((rawContent.length * 3) / 4) : 0;
      if (decodedBytesEstimate > MAX_SCAN_BUFFER_BYTES) {
        sendJson(res, 413, {
          error: "Payload Too Large",
          message: `Scan payload exceeds the ${Math.floor(MAX_SCAN_BUFFER_BYTES / (1024 * 1024))}MB in-process scan limit`,
          code: "SCAN_PAYLOAD_TOO_LARGE",
        });
        return;
      }
      const buffer = Buffer.from(rawContent, body.contentBase64 ? "base64" : "utf8");
      const validation = validateMediaBuffer(buffer, body.contentType || "video/mp4");
      sendJson(res, 200, validation);
      return;
    }

    // TODO-SCR-03: register a validated DAM asset in the approved-media
    // registry (UX-CMS-006 picker backing store). Writers need the derived
    // create:content authority (broadcast create/update per RBAC); readers
    // get the guard table's read:storage admission.
    if (pathname === "/api/v1/cms/media-assets" && method === "POST") {
      const user = resolveSessionUser(req);
      if (!user || !canPerform(user, "create", "content")) {
        sendJson(res, user ? 403 : 401, {
          error: user ? "Forbidden" : "Unauthorized",
          message: "Media asset registration requires create:content authority.",
          code: user ? "MEDIA_ASSET_FORBIDDEN" : "MEDIA_ASSET_UNAUTHENTICATED",
        });
        return;
      }
      const body = await parseJsonBody(req, pathname);
      try {
        const asset = registerMediaAsset({
          title: String(body.title || ""),
          assetKey: String(body.assetKey || ""),
          tenantId: user.tenantId,
          mimeType: String(body.mimeType || ""),
          sizeBytes: Number(body.sizeBytes || 0),
          checksumSha256: String(body.checksumSha256 || ""),
          provenance: body.provenance ? String(body.provenance) : undefined,
          virusScanPassed: typeof body.virusScanPassed === "boolean" ? body.virusScanPassed : undefined,
          validationErrors: Array.isArray(body.validationErrors) ? body.validationErrors.map(String) : undefined,
          registeredBy: user.email || user.userId,
        });
        await recordAuditLog({
          userId: user.userId,
          action: "MEDIA_ASSET_REGISTERED",
          resource: "media_asset",
          resourceId: asset.assetId,
          tenantId: user.tenantId,
          changes: {
            assetId: asset.assetId,
            assetKey: asset.assetKey,
            accessState: asset.accessState,
            checksumSha256: asset.checksumSha256,
            provenance: asset.provenance,
          },
          ipAddress: clientIp,
          userAgent: req.headers["user-agent"] || null,
        });
        sendJson(res, 201, { status: "SUCCESS", asset });
      } catch (err: any) {
        const code = (err?.message?.match(/\[MEDIA-ASSET-(\d+)\]/)?.[1] || "ERROR") as string;
        sendJson(res, 422, { status: "REJECTED", code: `MEDIA-ASSET-${code}`, message: err?.message || "Registration rejected." });
      }
      return;
    }

    // TODO-SCR-03: picker data source (same authority as the registration
    // POST minus the write role — read:storage via the guard table).
    if (pathname === "/api/v1/cms/media-assets" && method === "GET") {
      const user = resolveSessionUser(req);
      const assets = listApprovedMediaAssets({ tenantId: user?.tenantId, includeNonAvailable: true });
      sendJson(res, 200, { status: "SUCCESS", assets });
      return;
    }

    // Route not found
    sendJson(res, 404, {
      error: "Not Found",
      message: `Endpoint ${method} ${pathname} does not exist on VMNL Enterprise Platform`,
    });
  } catch (error: any) {
    const duration = Date.now() - reqStart;
    context.telemetry.recordMetric("http_5xx_error_rate_percent", 1.0, { path: pathname });
    // AUD-17: structured error log without stack traces outside development.
    const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    context.telemetry.logStructured(
      "ERROR",
      error?.message || "Unhandled route error",
      span,
      isDev ? { stack: error?.stack, duration } : { duration }
    );

    if (error instanceof PayloadTooLargeError) {
      sendJson(res, 413, {
        error: "Payload Too Large",
        message: error.message,
        code: error.code,
      });
      return;
    }
    if (error instanceof RepositoryUnavailableError) {
      sendJson(res, 503, {
        error: "Service Unavailable",
        message: "The persistence layer is temporarily unavailable; the request was not processed fail-closed.",
        code: error.code,
        traceId: span.traceId,
      });
      return;
    }
    sendJson(res, 500, {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      traceId: span.traceId,
    });
  }
}
