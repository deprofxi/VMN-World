/**
 * VMN World IA R1.1 — LEARN journey (J09): AFCA Learning, Competency Progression & Creative Academy.
 *
 * Core Governing Authorities:
 * - VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §38, §41, §75
 * - VMNL-AZP-VMN-CCPP-001 §14, §16
 * - Page Plan §6: "Learner-first; no auto-admission. Portfolio grading requires verified instructor rubric."
 * - Canonical Law 13: "A work surface records a request; it never decides."
 *
 * Authority: docs/authorities/ia/VMN_World_IA_R1.1_Full_Engineering_Inventory.csv
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
  { label: "AFCA Academy", href: "/workspace" },
  { label: "Learning & Competencies", href: "/workspace/academy/learner-dashboard" },
];

/** A card. The body is markup assembled at the call site, so it is composed, not escaped a second time. */
function section(id: string, title: string, body: SafeHtml): SafeHtml {
  return html`<section class="card mb-4" aria-labelledby="${id}">
      <h2 id="${id}">${title}</h2>
      ${body}
    </section>`;
}

/** LEARN-001: Programme discovery for applicants (Public W0 surface) */
function renderLearn001(screen: IAScreen): string {
  return [
    gatedHeader(screen, [{ label: "AFCA Creative Academy", href: "/academy" }]),
    section(
      "learn-discovery-catalog",
      "African Creative Academy (AFCA) Professional Programmes",
      html`<div class="provenance-notice" role="note">
        <strong>Public Programme Registry:</strong> Professional creative industry pathways accredited for broadcast production, high-end visual storytelling, sound engineering, and creative enterprise management.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <span class="vmn-badge badge-info mb-2">CINEMATOGRAPHY & LIGHTING</span>
          <div class="text-lg font-bold mt-1">Advanced Digital Cinematography</div>
          <p class="text-xs text-muted mt-1">12-week intensive masterclass on ARRI/RED workflows, studio lighting, and optics.</p>
        </div>
        <div class="card p-3">
          <span class="vmn-badge badge-info mb-2">BROADCAST ENGINEERING</span>
          <div class="text-lg font-bold mt-1">Linear Playout & MCR Continuity</div>
          <p class="text-xs text-muted mt-1">Hands-on StarTimes DTT/DTH headend integration, SCTE-35 automation, and loudness standards.</p>
        </div>
        <div class="card p-3">
          <span class="vmn-badge badge-info mb-2">SCREENWRITING & IP</span>
          <div class="text-lg font-bold mt-1">Storyworld Architecture & Writers Room</div>
          <p class="text-xs text-muted mt-1">Multi-season episodic series development, character bibles, and IP protection.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/workspace/academy/programme-application-overview">Application Process</a>
        <a class="btn btn-outline" href="/workspace/academy/programme-application-wizard">Apply Now</a>
      </div>`
    ),
  ].join("\n");
}

/** LEARN-002: Programme application overview */
function renderLearn002(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-app-overview",
      "AFCA Academy Admission Criteria & Application Requirements",
      html`<div class="card mb-3">
        <h3>Admission Policy: Manual Faculty Review Required <span class="sr-only">Admission Invariant: No Auto-Admission</span></h3>
        <p>In accordance with Academic Board standards, admission to AFCA Academy is never automated. Every submission is evaluated against rigorous competency rubrics and blind-reviewed by senior industry faculty.</p>
      </div>
      ${pendingTable(
        "Application Intake Windows",
        ["Cohort Code", "Discipline Track", "Intake Capacity", "Application Deadline", "Interview Dates", "Status"],
        "Intake calendar managed by Academic Admissions Board."
      )}`
    ),
  ].join("\n");
}

/** LEARN-009: Conditional admission acceptance / Learner dashboard */
function renderLearn009(screen: IAScreen, ctx: IAGatedPageContext): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-dashboard-overview",
      "Learner Academic Portal & Competency Progression",
      html`<div class="provenance-notice" role="note">
        <strong>Learner Profile Active:</strong> Logged in as <code>${ctx.user.email}</code>. Coursework, submission deadlines, and portfolio assessments are held under student confidentiality covenants.
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Enrolled Programme</div>
          <div class="text-xl font-bold mt-1">Broadcast Production</div>
          <p class="text-xs text-muted mt-1">Cohort 2026-Alpha &bull; Status: Active In-Session</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Competency Milestone</div>
          <div class="text-xl font-bold mt-1">Level 4 Certified</div>
          <p class="text-xs text-muted mt-1">8 of 12 modular rubrics completed and instructor-signed.</p>
        </div>
        <div class="card p-3">
          <div class="text-sm font-semibold text-muted">Verifiable Certificate</div>
          <div class="text-xl font-bold text-success mt-1">Cryptographic Seal</div>
          <p class="text-xs text-muted mt-1">Final diploma issued with SHA-256 tamper-proof credential.</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a class="btn btn-primary" href="/workspace/academy/cohort-calendar-and-timetable">Cohort Timetable</a>
        <a class="btn btn-outline" href="/workspace/academy/assignments-and-portfolio-tasks">Assignments & Tasks</a>
        <a class="btn btn-outline" href="/workspace/academy/portfolio-evidence-submission">Submit Portfolio Evidence</a>
      </div>`
    ),
  ].join("\n");
}

/** LEARN-011: Cohort calendar and timetable */
function renderLearn011(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-calendar-timetable",
      "Academic Sessions, Masterclasses & Studio Practical Timetable",
      html`<p class="text-muted mb-3">Live lecture schedules, studio lab bookings, and production mentoring sessions.</p>
      ${pendingTable(
        "Current Academic Week Schedule (WAT)",
        ["Date / Day", "Time Window", "Module Name", "Studio / Room", "Lead Instructor", "Attendance Mode"],
        "Timetable synchronized with master academy calendar."
      )}`
    ),
  ].join("\n");
}

/** LEARN-013: Assignments and portfolio tasks */
function renderLearn013(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-assignments-tasks",
      "Creative Briefs, Practical Tasks & Submission Deadlines",
      html`<div class="card mb-3">
        <h3>Objective Rubric Grading</h3>
        <p>All student assignments are graded using public, published rubrics measuring technical proficiency, creative originality, narrative structure, and adherence to professional delivery guidelines.</p>
      </div>
      ${pendingTable(
        "Coursework Deliverables",
        ["Task Code", "Module Title", "Deliverable Type", "Submission Due", "Weighting", "Grading Status"],
        "Coursework tracking active for current semester."
      )}`
    ),
  ].join("\n");
}

/** LEARN-014: Portfolio evidence submission */
function renderLearn014(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-portfolio-submission",
      "Portfolio Artifact Upload & Role Attribution Declaration",
      html`<div class="card mb-3">
        <h3>Role Attribution & Anti-Plagiarism Standard</h3>
        <p>In accordance with Academic Integrity policy, submissions must clearly attribute exact individual roles in collaborative production pieces (e.g., Director, Editor, DP, Sound Recordist). False attribution results in immediate disqualification.</p>
      </div>
      ${sourceNotConnected("Raw media assets (ProRes / DNxHR / WAV) must be delivered via designated academy media ingest bucket.")}
      ${pendingTable(
        "Submitted Portfolio Assets",
        ["Asset Code", "Artifact Name", "Declared Role", "File Hash (SHA-256)", "Submission Date", "Moderation Status"],
        "Artifact integrity verified upon storage arrival."
      )}`
    ),
  ].join("\n");
}

/** LEARN-017: Private provisional assessment result */
function renderLearn017(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-assessment-result",
      "Provisional Grades & Instructor Evaluator Feedback",
      html`<div class="card mb-3">
        <h3>Confidential Grade Notification</h3>
        <p>Provisional results are released to the individual learner following first-marker review. Final certification is subject to ratification by the External Moderation Board.</p>
      </div>
      ${pendingTable(
        "Module Competency Breakdown",
        ["Competency Code", "Evaluation Rubric", "Max Points", "Score Awarded", "Faculty Comments", "Moderation Result"],
        "Evaluator comments signed by Course Faculty Lead."
      )}`
    ),
  ].join("\n");
}

/** LEARN-024: Programme completion and progression */
function renderLearn024(screen: IAScreen): string {
  return [
    gatedHeader(screen, CRUMB),
    section(
      "learn-completion-progression",
      "Graduation Clearance, Credential Issuance & Industry Handoff",
      html`<div class="card mb-3">
        <h3>Creative Industry Placement</h3>
        <p>Graduating students are onboarded to the VTM Talent Marketplace and Creative Hub with verified skill credentials and eligible for broadcast commissioning on TEN channels.</p>
      </div>
      ${pendingTable(
        "Graduation Clearance Checklist",
        ["Clearance Area", "Requirement", "Status", "Authorized Examiner", "Certificate Ready"],
        "Clearance signed off by Academic Registrar."
      )}`
    ),
  ].join("\n");
}

/** Primary dispatcher for LEARN journey */
export function renderLearnBody(screen: IAScreen, ctx: IAGatedPageContext): string | undefined {
  switch (screen.id) {
    case "LEARN-001":
      return renderLearn001(screen);
    case "LEARN-002":
    case "LEARN-003":
    case "LEARN-004":
    case "LEARN-006":
      return renderLearn002(screen);
    case "LEARN-009":
      return renderLearn009(screen, ctx);
    case "LEARN-011":
    case "LEARN-012":
      return renderLearn011(screen);
    case "LEARN-013":
      return renderLearn013(screen);
    case "LEARN-014":
    case "LEARN-015":
      return renderLearn014(screen);
    case "LEARN-017":
    case "LEARN-018":
    case "LEARN-020":
    case "LEARN-022":
      return renderLearn017(screen);
    case "LEARN-024":
    case "LEARN-025":
    case "LEARN-026":
    case "LEARN-027":
    case "LEARN-028":
    case "LEARN-030":
      return renderLearn024(screen);
    default:
      return undefined;
  }
}
