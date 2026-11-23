/**
 * VMN World IA R1.1 — SYS journey (J22): AI, Cr8Tech, System Integrations, Product Operations & Security.
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-CCPP-001 §8, §13, §14
 * - S-IT-01: Technology and security / agent OS
 * - Invariant: A0–A5 tool execution must not escalate permissions; emergency rollback kill-switch operational.
 */

import { html, type SafeHtml } from "../components/index.js";
import {
  gatedHeader,
  pendingTable,
  sourceNotConnected,
  type IAGatedPageContext,
} from "./gated-parts.js";
import type { IAScreen } from "./types.js";

const CRUMB = [
  { label: "Systems & Security", href: "/workspace" },
  { label: "Cr8Tech Platform Operations", href: "/workspace/systems/sys-dashboard" },
];

function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

function renderSys001(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "sys-dashboard-overview",
      "Cr8Tech Platform Operations & AI Agent Governance",
      html`<div class="provenance-notice" role="note">
        <strong>Technology & Security Architecture:</strong> Session active for <code>${ctx.user.email}</code>. System integrations, Agent OS runtime boundaries (A0–A5), API throttling, and emergency rollback kill-switches are governed under S-IT-01 specifications.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Agent OS Runtimes</div>
          <div class="text-xl font-bold text-success mt-1">A0–A5 Enforced</div>
          <p class="text-xs text-muted mt-1">Tool execution bounds, token budgets, and human-in-the-loop gates.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Infrastructure Status</div>
          <div class="text-xl font-bold text-success mt-1">Cluster Healthy</div>
          <p class="text-xs text-muted mt-1">Zero downtime deployment pipeline, canary metrics, and audit logs.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Security & WAF</div>
          <div class="text-xl font-bold text-success mt-1">0 Active Threats</div>
          <p class="text-xs text-muted mt-1">Rate limit quotas, CSRF defenses, and prompt-injection mitigations.</p>
        </div>
      </div>
      ${pendingTable(
        "Active System Integrations & Microservice Connectors",
        ["Service Connector", "Protocol / Endpoint", "Latency (P99)", "Security Sandbox Mode", "Health Status"],
        "External integrations fail-closed upon signature or authentication anomalies."
      )}`
    ),
  ].join("\n");
}

function renderSys002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "sys-kill-switch",
      "Emergency Rollback & Feature Kill-Switch Controls",
      html`<div class="card mb-3">
        <p>Operational circuit breakers for instant containment. Disabling a feature flag immediately halts outbound requests and reverts user traffic to safe static fallbacks.</p>
      </div>
      ${pendingTable(
        "Emergency Circuit Breakers & Kill-Switches",
        ["Flag / Subsystem", "Current State", "Impacted User Realm", "Last Trip Trigger", "Action"],
        "Activating a kill-switch sends automated pager alerts to on-call security and engineering leads."
      )}`
    ),
    sourceNotConnected(screen.sourceOffice || "System operations source not connected in this environment."),
  ].join("\n");
}

function renderSysGeneric(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      `sys-${screen.id.toLowerCase()}`,
      screen.screenName,
      html`<div class="card p-4 mb-3">
        <div class="text-sm font-semibold text-muted mb-1">Journey: J22 · AI, Cr8Tech & System Operations</div>
        <p class="text-sm">Managing platform infrastructure record <code>${screen.id}</code> under <strong>${screen.gate}</strong> gate constraints for user <code>${ctx.user.email}</code>.</p>
      </div>
      ${pendingTable(
        `${screen.screenName} System Telemetry`,
        ["Metric ID", "Subsystem Component", "Observed Telemetry", "Security Classification", "Status"],
        "All platform telemetry adheres to zero-trust architecture and encrypted transit."
      )}`
    ),
  ].join("\n");
}

export function renderSysBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  if (!screen.id.startsWith("SYS-")) return undefined;
  switch (screen.id) {
    case "SYS-001":
      return renderSys001(screen, ctx);
    case "SYS-002":
      return renderSys002(screen);
    default:
      return renderSysGeneric(screen, ctx);
  }
}
