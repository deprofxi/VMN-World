/**
 * VMNL Enterprise OpenAPI 3.1.0 Specification & Interactive Documentation Surface
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §19, §21
 */

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Virtual Media Network Limited (VMNL) Enterprise API",
    version: "1.0.0",
    description:
      "Enterprise REST API runtime powering Broadcast Linear Television (NXTR, ORIS, IMBD on StarTimes DTT/DTH), the Creative Economy Hub, Headspace/Cr8Tech/Agentic OS, Azeebo+ Federation, Quote-to-Cash Ledger, and Quality Release Gates.",
    contact: {
      name: "VMNL Engineering Architecture Team",
      email: "architecture@vmnl.ng",
      url: "https://vmnl.ng",
    },
    license: {
      name: "Proprietary / All Rights Reserved",
      url: "https://vmnl.ng/terms",
    },
  },
  servers: [
    {
      url: "/",
      description: "Local & Staging Environment",
    },
    {
      url: "https://api.vmnl.ng",
      description: "Production Gateway (Canary / Blue-Green)",
    },
  ],
  tags: [
    { name: "System", description: "Health, readiness, and Prometheus telemetry endpoints" },
    { name: "Broadcast", description: "Linear channels, EPG syndication, As-Run reconciliation, and 33 screen surfaces" },
    { name: "Creative Economy Hub", description: "Talent Accelerator, AFCA Academy certification, and Fusion Events ticketing" },
    { name: "Intelligence & IP", description: "Headspace IP engine, Cr8Tech multilingual subtitling, and AOS kill switches" },
    { name: "Federation", description: "Azeebo+ deep linking, dynamic QR codes, and circuit breaker webhooks" },
    { name: "Finance & Commercial", description: "Quote-to-cash sales pipeline, talent payouts with WHT, and bank reconciliation" },
    { name: "Quality & Governance", description: "Governing Broadcast Release Gates (BG0 to BG9) evaluation and sign-offs" },
  ],
  paths: {
    "/api/v1/auth/login": {
      post: {
        tags: ["System"],
        summary: "User Authentication & Session Issuance",
        description: "Authenticates an enterprise operator or admin and returns a signed JWT session token with assigned RBAC roles.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Session authenticated, token issued." },
          "401": { description: "Invalid credentials." },
        },
      },
    },
    "/api/v1/auth/revoke": {
      post: {
        tags: ["System"],
        summary: "Revoke Active Session Token",
        description: "Explicitly terminates an active session and adds the token to the revocation blacklist.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Session revoked successfully." },
          "401": { description: "Unauthorized or missing token." },
        },
      },
    },
    "/healthz": {
      get: {
        tags: ["System"],
        summary: "Liveness Probe",
        description: "Returns process uptime, health state, and system version.",
        responses: {
          "200": {
            description: "Service is healthy and active.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "healthy" },
                    uptimeSeconds: { type: "integer", example: 1420 },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string", example: "1.0.0" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/readyz": {
      get: {
        tags: ["System"],
        summary: "Readiness Probe",
        description: "Evaluates readiness of database, playout, storage, and circuit breaker state.",
        responses: {
          "200": {
            description: "Service is ready to handle traffic.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ready" },
                    checks: {
                      type: "object",
                      properties: {
                        database: { type: "string", example: "connected" },
                        playout: { type: "string", example: "ready" },
                        storage: { type: "string", example: "ready" },
                        federationBridge: { type: "string", example: "CLOSED" },
                      },
                    },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/metrics": {
      get: {
        tags: ["System"],
        summary: "Prometheus Metrics Scrape Target",
        description: "Exports standard Prometheus text-format telemetry counters, histograms, and gauges.",
        responses: {
          "200": {
            description: "Prometheus metrics dump.",
            content: {
              "text/plain; version=0.0.4": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/api/v1/broadcast/channels": {
      get: {
        tags: ["Broadcast"],
        summary: "List Active Linear Channels",
        description: "Returns the 3 canonical broadcast channels: Nigezie Xtreme (NXTR), Orisun (ORIS), and Isi Mbido (IMBD).",
        responses: {
          "200": {
            description: "List of active linear channels.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    channels: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          code: { type: "string", enum: ["NXTR", "ORIS", "IMBD"] },
                          name: { type: "string" },
                          videoStandard: { type: "string", example: "1080i50" },
                          dttChannelNumber: { type: "integer", example: 428 },
                          dthChannelNumber: { type: "integer", example: 312 },
                          starTimesPid: { type: "integer", example: 1042 },
                          isActive: { type: "boolean" },
                        },
                      },
                    },
                    count: { type: "integer", example: 3 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/broadcast/channels/{code}": {
      get: {
        tags: ["Broadcast"],
        summary: "Get Channel Profile by Code",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            description: "Channel code (NXTR, ORIS, or IMBD)",
            schema: { type: "string", enum: ["NXTR", "ORIS", "IMBD"] },
          },
        ],
        responses: {
          "200": { description: "Channel details found." },
          "404": { description: "Channel not found." },
        },
      },
    },
    "/api/v1/broadcast/screens": {
      get: {
        tags: ["Broadcast"],
        summary: "Get 33 Broadcast Screen Surfaces Inventory",
        description: "Returns full metadata for the 33 operational screen surfaces mandated by R1.2A (§46).",
        responses: {
          "200": {
            description: "Screen inventory list.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    screens: { type: "array", items: { type: "object" } },
                    count: { type: "integer", example: 33 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/broadcast/epg/{channelCode}": {
      get: {
        tags: ["Broadcast"],
        summary: "Request XMLTV EPG Feed",
        description: "Returns the channel's XMLTV feed when an approved schedule source is connected; sample scheduler data is not published as an operational feed.",
        parameters: [
          {
            name: "channelCode",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["NXTR", "ORIS", "IMBD"] },
          },
        ],
        responses: {
          "200": {
            description: "XMLTV feed from the approved schedule source.",
            content: { "application/xml; charset=utf-8": { schema: { type: "string" } } },
          },
          "404": { description: "Channel not found." },
          "503": { description: "No approved schedule source is connected; no feed is published." },
        },
      },
    },
    "/api/v1/broadcast/asrun/reconcile": {
      post: {
        tags: ["Broadcast"],
        summary: "Reconcile As-Run Log & Issue Proof-of-Air Certificates",
        description: "Performs 3-way match across schedule, playout log, and generates SHA-256 signed Certificates of Airing.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["channelCode", "asRunItems"],
                properties: {
                  channelCode: { type: "string", example: "NXTR" },
                  asRunItems: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["spotId", "clientName", "campaignId", "actualStartTime", "actualDurationSeconds", "expectedDurationSeconds", "status"],
                      properties: {
                        spotId: { type: "string" },
                        clientName: { type: "string" },
                        campaignId: { type: "string" },
                        actualStartTime: { type: "string", format: "date-time" },
                        actualDurationSeconds: { type: "integer" },
                        expectedDurationSeconds: { type: "integer" },
                        status: { type: "string", enum: ["AIRED_FULL", "AIRED_PARTIAL", "TECHNICAL_OUTAGE", "MISSED"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reconciliation report with certificates." },
        },
      },
    },
    "/api/v1/hub/talent/onboard": {
      post: {
        tags: ["Creative Economy Hub"],
        summary: "Onboard & Assess Creative Talent",
        description: "Ingests talent applications, runs rubric tiering, and issues national partner hub assignments.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fullName", "primaryCategory"],
                properties: {
                  id: { type: "string" },
                  personId: { type: "string" },
                  fullName: { type: "string" },
                  primaryCategory: { type: "string", enum: ["ACTING", "DIRECTING", "CINEMATOGRAPHY", "EDITING", "SOUND_DESIGN", "MUSIC", "ANIMATION", "CREW"] },
                  locationCity: { type: "string" },
                  locationState: { type: "string" },
                  dayRateNgn: { type: "number" },
                  bio: { type: "string" },
                  skills: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Talent onboarded and tiered successfully." },
        },
      },
    },
    "/api/v1/hub/talent/{id}": {
      get: {
        tags: ["Creative Economy Hub"],
        summary: "Get Creative Talent Profile by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Talent profile details." },
          "404": { description: "Talent profile not found." },
        },
      },
    },
    "/api/v1/hub/vtm/match": {
      post: {
        tags: ["Creative Economy Hub"],
        summary: "Match Talent to Production Roles",
        description: "Executes rule-based and rubric matching between available talent profiles and open production character/crew briefs.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  skills: { type: "array", items: { type: "string" } },
                  location: { type: "string" },
                  maxDayRateNgn: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Ranked talent matching results." },
        },
      },
    },
    "/api/v1/hub/afca/grades": {
      post: {
        tags: ["Creative Economy Hub"],
        summary: "Submit Course Grades & Issue Verifiable Certificate",
        description: "Calculates weighted grade across attendance, coursework, project, and exam, issuing a digital certificate with QR verification.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId", "courseCode", "attendanceScore", "courseworkScore", "practicalProjectScore", "finalExamScore"],
                properties: {
                  studentId: { type: "string" },
                  courseCode: { type: "string" },
                  attendanceScore: { type: "number", minimum: 0, maximum: 100 },
                  courseworkScore: { type: "number", minimum: 0, maximum: 100 },
                  practicalProjectScore: { type: "number", minimum: 0, maximum: 100 },
                  finalExamScore: { type: "number", minimum: 0, maximum: 100 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Grade record and digital certificate issued." },
        },
      },
    },
    "/api/v1/hub/events/tickets/validate": {
      post: {
        tags: ["Creative Economy Hub"],
        summary: "Validate Single-Use Event Ticket",
        description: "Verifies HMAC-SHA256 barcode signature and prevents duplicate entry at turnstile gates.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ticketId", "gateId", "scannedHmac"],
                properties: {
                  ticketId: { type: "string" },
                  gateId: { type: "string" },
                  scannedHmac: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Ticket valid, entry granted." },
          "400": { description: "Ticket invalid, fraudulent or already used." },
        },
      },
    },
    "/api/v1/intelligence/headspace/query": {
      post: {
        tags: ["Intelligence & IP"],
        summary: "Query Headspace Knowledge & IP Repository",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["query"],
                properties: {
                  query: { type: "string" },
                  domain: { type: "string" },
                  maxResults: { type: "integer", default: 5 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Matching IP entries and guidelines." },
        },
      },
    },
    "/api/v1/intelligence/cr8tech/subtitle": {
      post: {
        tags: ["Intelligence & IP"],
        summary: "Generate Multilingual Broadcast Subtitles",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contentId", "sourceText", "targetLanguages"],
                properties: {
                  contentId: { type: "string" },
                  sourceText: { type: "string" },
                  targetLanguages: { type: "array", items: { type: "string", enum: ["en", "yo", "ig", "ha", "pcm"] } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "SRT/VTT subtitle tracks generated." },
        },
      },
    },
    "/api/v1/intelligence/aos/killswitch": {
      post: {
        tags: ["Intelligence & IP"],
        summary: "AOS Autonomous Agent Kill Switch",
        description: "Immediately pauses or isolates autonomous AI agent execution queues.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["agentId", "reason", "authorizedBy"],
                properties: {
                  agentId: { type: "string" },
                  reason: { type: "string" },
                  authorizedBy: { type: "string" },
                  action: { type: "string", enum: ["PAUSE", "KILL", "RESUME"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Kill switch command executed." },
        },
      },
    },
    "/api/v1/federation/azeebo/links": {
      post: {
        tags: ["Federation"],
        summary: "Generate 8-Universe Azeebo+ Deep Link & Dynamic QR",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["universe", "targetPath", "campaignSource"],
                properties: {
                  universe: { type: "string", enum: ["FILM_TV", "MUSIC", "CREATOR", "GAMING", "FASHION", "COMEDY", "LIVE_EVENTS", "LEARNING"] },
                  targetPath: { type: "string" },
                  campaignSource: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Federated link with QR payload and NDPR SHA-256 hash." },
        },
      },
    },
    "/api/v1/federation/azeebo/webhook": {
      post: {
        tags: ["Federation"],
        summary: "Ingest Azeebo+ Event Mesh Webhook",
        description: "Accepts a federation event for dispatch. The production partner signature, timestamp, and replay-protection contract is not yet verified; this route does not currently authenticate the advertised Azeebo+ signature header and must not be used as a production webhook receiver.",
        parameters: [
          {
            name: "X-Azeebo-Signature",
            in: "header",
            required: false,
            description: "Reserved pending verification of the partner signature contract; not validated by the current handler.",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": { description: "Event handled by the current prototype dispatch path; delivery is not verified." },
          "503": { description: "Federation dependency or circuit is unavailable." },
        },
      },
    },
    "/api/v1/finance/quotes/create": {
      post: {
        tags: ["Finance & Commercial"],
        summary: "Create Commercial Media Quote",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientName", "campaignName", "channelCode", "daypart", "spotCount", "ratePerSpotNgn"],
                properties: {
                  clientName: { type: "string" },
                  campaignName: { type: "string" },
                  channelCode: { type: "string", enum: ["NXTR", "ORIS", "IMBD"] },
                  daypart: { type: "string", enum: ["EARLY_MORNING", "DAYTIME", "PRIME_TIME", "LATE_NIGHT"] },
                  spotCount: { type: "integer" },
                  ratePerSpotNgn: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Commercial quote created in DRAFT status." },
        },
      },
    },
    "/api/v1/finance/payouts/batch": {
      post: {
        tags: ["Finance & Commercial"],
        summary: "Process Talent Payout Batch with Nigerian WHT",
        description: "Deducts 15% platform fee and applicable Nigerian Withholding Tax (5% Individual, 10% Corporate), exporting an NIP bank CSV.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["id", "batchReference", "makerUserId", "items"],
                properties: {
                  id: { type: "string" },
                  batchReference: { type: "string" },
                  makerUserId: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["beneficiaryId", "beneficiaryName", "beneficiaryTaxType", "bankName", "accountNumber", "grossAmountNgn"],
                      properties: {
                        beneficiaryId: { type: "string" },
                        beneficiaryName: { type: "string" },
                        beneficiaryTaxType: { type: "string", enum: ["INDIVIDUAL", "CORPORATE"] },
                        bankName: { type: "string" },
                        accountNumber: { type: "string" },
                        grossAmountNgn: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Batch computed with net disbursements and WHT." },
        },
      },
    },
    "/api/v1/finance/reconcile": {
      post: {
        tags: ["Finance & Commercial"],
        summary: "Execute MT940 / CSV Bank Reconciliation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bankStatementText", "format"],
                properties: {
                  bankStatementText: { type: "string" },
                  format: { type: "string", enum: ["MT940", "CSV"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reconciliation report with matched & variance entries." },
        },
      },
    },
    "/api/v1/webhooks/paystack": {
      post: {
        tags: ["Finance & Commercial"],
        summary: "Paystack Payment Webhook Ingestion",
        description: "Ingests payment notifications with HMAC-SHA512 signature validation.",
        security: [{ paystackSignature: [] }],
        parameters: [
          {
            name: "x-paystack-signature",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": { description: "Webhook accepted and processed." },
          "401": { description: "Invalid HMAC signature." },
        },
      },
    },
    "/api/v1/webhooks/flutterwave": {
      post: {
        tags: ["Finance & Commercial"],
        summary: "Flutterwave Payment Webhook Ingestion",
        description: "Ingests charge and transfer webhooks with verif-hash validation.",
        security: [{ flutterwaveSignature: [] }],
        parameters: [
          {
            name: "verif-hash",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": { description: "Webhook accepted and processed." },
          "401": { description: "Invalid verification hash." },
        },
      },
    },
    "/api/v1/audit/logs": {
      get: {
        tags: ["System"],
        summary: "Query Immutable Cryptographic Audit Ledger",
        description: "Returns tamper-evident audit log records filtered by resource, action, and actor. Gated behind Auditor/Finance RBAC.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "resource", in: "query", schema: { type: "string" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "userId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Audit trail entries." },
          "403": { description: "Auditor or Finance authorization required." },
        },
      },
    },
    "/api/v1/audit/verify": {
      get: {
        tags: ["System"],
        summary: "Verify Cryptographic Audit Hash-Chain Integrity",
        description: "Traverses all recorded audit log blocks and recalculates SHA-256 links to detect unauthorized payload mutations or record deletions.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Chain integrity validation results." },
          "403": { description: "Auditor or Executive authorization required." },
        },
      },
    },
    "/api/v1/quality/gates": {
      post: {
        tags: ["Quality & Governance"],
        summary: "Evaluate Broadcast Release Gates (BG0 to BG9)",
        description: "Validates pre-flight, catalogue, rights, schedule, traffic, playout, carriage, finance, Azeebo+, and continuity release gates (BG0–BG9) per R1.2A §67 with human release owner sign-off.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["version", "gitCommitSha", "gates", "humanReleaseOwner"],
                properties: {
                  version: { type: "string" },
                  gitCommitSha: { type: "string" },
                  environment: { type: "string", enum: ["SANDBOX_S2", "STAGING_S3", "PRODUCTION_S5"] },
                  humanReleaseOwner: {
                    type: "object",
                    required: ["name", "role", "employeeId", "signedAt"],
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      employeeId: { type: "string" },
                      signedAt: { type: "string", format: "date-time" },
                    },
                  },
                  decision: { type: "string", enum: ["GO", "GO_WITH_CONDITIONS", "HOLD", "NO_GO"] },
                  conditionsAcceptance: { type: "object" },
                  gates: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Release gates evaluation result." },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      paystackSignature: {
        type: "apiKey",
        in: "header",
        name: "x-paystack-signature",
      },
      flutterwaveSignature: {
        type: "apiKey",
        in: "header",
        name: "verif-hash",
      },
    },
  },
};

export function renderDocsHtml(): string {
  const tags = OPENAPI_SPEC.tags;
  const paths = OPENAPI_SPEC.paths;
  const totalEndpointCount = Object.values(paths).reduce(
    (acc, m) => acc + Object.keys(m).length,
    0
  );

  const endpointCards = tags
    .map((tag) => {
      const endpoints = Object.entries(paths).filter(([_, methods]) => {
        return Object.values(methods).some((m: any) => m.tags?.includes(tag.name));
      });

      if (endpoints.length === 0) return "";

      const methodsHtml = endpoints
        .map(([path, methods]) => {
          return Object.entries(methods)
            .map(([method, def]: [string, any]) => {
              const methodUpper = method.toUpperCase();
              const badgeColor =
                methodUpper === "GET"
                  ? { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" }
                  : methodUpper === "POST"
                  ? { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" }
                  : { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };

              return `
              <div style="background:var(--vmn-surface); border:1px solid var(--vmn-surface-border); border-radius:8px; padding:16px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="background:${badgeColor.bg}; color:${badgeColor.text}; border:1px solid ${badgeColor.border}; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px; font-family:monospace;">
                      ${methodUpper}
                    </span>
                    <code style="font-size:0.95rem; font-weight:700; color:var(--vmn-primary);">${path}</code>
                  </div>
                  <span style="font-size:0.85rem; font-weight:600; color:var(--vmn-text-muted);">${def.summary || ""}</span>
                </div>
                <p style="font-size:0.875rem; color:var(--vmn-text-muted); margin-bottom:10px;">${def.description || def.summary || ""}</p>
                <div style="display:flex; gap:8px; align-items:center;">
                  <a href="${methodUpper === "GET" ? path.replace(/\{.*\}/, "NXTR") : "/api/v1/openapi.json"}" target="_blank" class="btn btn-outline" style="min-height:36px; padding:4px 12px; font-size:0.8rem;">
                    ${methodUpper === "GET" ? "Test Query &rarr;" : "View Schema"}
                  </a>
                </div>
              </div>
              `;
            })
            .join("");
        })
        .join("");

      return `
      <section style="margin-bottom:32px;">
        <div style="border-bottom:2px solid var(--vmn-secondary); padding-bottom:8px; margin-bottom:16px;">
          <h2 style="font-size:1.4rem; font-weight:800; color:var(--vmn-primary);">${tag.name}</h2>
          <p style="color:var(--vmn-text-muted); font-size:0.9rem;">${tag.description}</p>
        </div>
        ${methodsHtml}
      </section>
      `;
    })
    .join("");

  return `
  <section style="display:flex; flex-direction:column; gap:24px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:var(--vmn-text-muted); margin-bottom:8px;">
          <a href="/" style="color:var(--vmn-secondary); text-decoration:none;">Home</a> &gt; 
          <span>API Documentation</span>
        </nav>
        <h1 style="font-size:2rem; font-weight:800; color:var(--vmn-primary);">VMNL Enterprise API Reference</h1>
        <p style="color:var(--vmn-text-muted); margin-top:4px;">
          Interactive OpenAPI 3.1 specification for broadcast, creative hub, intelligence, federation, and financial services.
        </p>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <a href="/api/v1/openapi.json" target="_blank" class="btn btn-outline">Raw OpenAPI 3.1 JSON &rarr;</a>
        <a href="/broadcast/screens" class="btn btn-primary">33 Screen Surfaces</a>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="grid-3" style="margin-top:0;">
      <div class="card stat-box">
        <span class="stat-val">${totalEndpointCount}</span>
        <span class="stat-lbl">Enterprise REST Endpoints</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">OpenAPI 3.1</span>
        <span class="stat-lbl">Schema Standard</span>
      </div>
      <div class="card stat-box">
        <span class="stat-val">BG0–BG9</span>
        <span class="stat-lbl">Broadcast Release Gates</span>
      </div>
    </div>

    <!-- Endpoint Sections -->
    ${endpointCards}
  </section>
  `;
}
