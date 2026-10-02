/**
 * Creative Economy Hub Public Showcases & Inquiry Capture Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Core Mandate:
 * Public showcase definitions for all 8 Hub verticals.
 * Controlled inquiry capture pipeline with automated CRM categorization and acknowledgment.
 */

export type HubVertical =
  | "TALENT_ACCELERATOR"
  | "AFCA_ACADEMY"
  | "AFRO_FUSION_COMMUNITY"
  | "VTM_MANAGEMENT"
  | "VCF_CONTENT_FUND"
  | "ONE_STUDIOS"
  | "FUSION_EVENTS"
  | "TEND_DISTRIBUTION"
  | "HEADSPACE_NG"
  | "CR8TECH_NG";

import { renderIcon } from "../components/index.js";

export interface HubShowcase {
  vertical: HubVertical;
  title: string;
  tagline: string;
  description: string;
  callToAction: string;
  inquiryType: string;
  route: string;
}

export const HUB_SHOWCASES: Record<HubVertical, HubShowcase> = {
  TALENT_ACCELERATOR: {
    vertical: "TALENT_ACCELERATOR",
    title: "Talent Accelerator Network",
    tagline: "Unlocking Africa's Next Generation of Creative Stars",
    description: "Multi-tier onboarding, verified credentials, and nationwide partner hub pathways across Nigeria.",
    callToAction: "Apply for Talent Onboarding",
    inquiryType: "TALENT_APPLICATION",
    route: "/hub/talent",
  },
  AFCA_ACADEMY: {
    vertical: "AFCA_ACADEMY",
    title: "African Film & Creative Arts Academy",
    tagline: "World-Class Film & Media Education",
    description: "Structured cohort learning, industry mentor rubrics, and digitally verifiable professional certifications.",
    callToAction: "Explore Academic Cohorts",
    inquiryType: "ACADEMY_ADMISSION",
    route: "/hub/afca",
  },
  AFRO_FUSION_COMMUNITY: {
    vertical: "AFRO_FUSION_COMMUNITY",
    title: "Afro-Fusion Creatives",
    tagline: "The Creative Guild & Co-Working Community",
    description: "Meeting rooms, podcast studios, editing suites, and community guilds across Nigeria.",
    callToAction: "Join the Guild / Book a Desk",
    inquiryType: "COMMUNITY_MEMBERSHIP",
    route: "/hub/community",
  },
  VTM_MANAGEMENT: {
    vertical: "VTM_MANAGEMENT",
    title: "Virtual Talent Management (VTM)",
    tagline: "Verified Talent, Protected Deals, Escrow Security",
    description: "Automated opportunity matching, standardized rate cards, and transparent milestone escrow protection.",
    callToAction: "Book Verified Talent",
    inquiryType: "CASTING_BRIEF",
    route: "/hub/vtm",
  },
  VCF_CONTENT_FUND: {
    vertical: "VCF_CONTENT_FUND",
    title: "Virtual Content Fund (VCF)",
    tagline: "Catalyzing High-Impact African Storytelling",
    description: "Slate financing, pitch evaluation, and transparent distribution recoupment waterfalls.",
    callToAction: "Submit a Film / Series Pitch",
    inquiryType: "PITCH_SUBMISSION",
    route: "/hub/vcf",
  },
  ONE_STUDIOS: {
    vertical: "ONE_STUDIOS",
    title: "ONE Studios",
    tagline: "State-of-the-Art Production Stages & Gear",
    description: "5,000 sq ft soundproof soundstages, green screen cycs, and ARRI/RED cinema camera packages.",
    callToAction: "Reserve Studio Stage / Gear",
    inquiryType: "STUDIO_BOOKING",
    route: "/hub/onestudios",
  },
  FUSION_EVENTS: {
    vertical: "FUSION_EVENTS",
    title: "Fusion Events",
    tagline: "Iconic Live Concerts, Festivals & Industry Galas",
    description: "Unforgettable physical experiences with cryptographically secure digital ticketing.",
    callToAction: "View Upcoming Festivals",
    inquiryType: "EVENT_PARTNERSHIP",
    route: "/hub/events",
  },
  TEND_DISTRIBUTION: {
    vertical: "TEND_DISTRIBUTION",
    title: "The Entertainment Network Distribution (TEND)",
    tagline: "Taking African Cinema & Formats to the World",
    description: "Global licensing, airline inflight distribution, and automated avails rights management.",
    callToAction: "License Catalogue Content",
    inquiryType: "CONTENT_LICENSING",
    route: "/hub/distribution",
  },
  HEADSPACE_NG: {
    vertical: "HEADSPACE_NG",
    title: "HeadspaceNG Strategic Intelligence",
    tagline: "Central Enterprise Intelligence & African Media Research",
    description: "IP bibles, legal precedents, and regulatory compendiums.",
    callToAction: "Access Research Portal",
    inquiryType: "RESEARCH_INQUIRY",
    route: "/insights",
  },
  CR8TECH_NG: {
    vertical: "CR8TECH_NG",
    title: "Cr8TechNG",
    tagline: "AI Workflows & Next-Gen Creative Toolkits",
    description: "Automated indigenous language subtitling and intelligent broadcast social clipping.",
    callToAction: "Integrate Toolkits",
    inquiryType: "TECH_PARTNERSHIP",
    route: "/hub/technology",
  },
};

export type InquiryStatus = "RECEIVED" | "ROUTED_TO_CRM" | "CONTACTED";

export interface PublicInquiry {
  id: string;
  vertical: HubVertical;
  fullName: string;
  email: string;
  phone?: string;
  organisationName?: string;
  message: string;
  status: InquiryStatus;
  receivedAt: Date;
  acknowledgmentMessage: string;
}

const VALID_INQUIRY_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  RECEIVED: ["ROUTED_TO_CRM"],
  ROUTED_TO_CRM: ["CONTACTED"],
  CONTACTED: [],
};

export interface HubShowcaseServiceOptions {
  queueWorker?: {
    enqueue: (type: any, payload: any) => any;
  };
}

export class HubShowcaseService {
  private inquiries: PublicInquiry[] = [];
  private queueWorker?: { enqueue: (type: string, payload: any) => any };

  constructor(options: HubShowcaseServiceOptions = {}) {
    this.queueWorker = options.queueWorker;
  }

  public static getShowcase(vertical: HubVertical): HubShowcase {
    const sc = HUB_SHOWCASES[vertical];
    if (!sc) {
      throw new Error(`[HUB-404] Hub showcase '${vertical}' not found.`);
    }
    return sc;
  }

  public submitInquiry(params: {
    vertical: HubVertical;
    fullName: string;
    email: string;
    phone?: string;
    organisationName?: string;
    message: string;
    autoRouteToCrm?: boolean;
  }): PublicInquiry {
    if (!params.email || !params.email.includes("@")) {
      throw new Error("[HUB-INQ-01] Valid email address is required.");
    }
    if (!params.message || params.message.trim().length < 10) {
      throw new Error("[HUB-INQ-02] Inquiry message must be at least 10 characters.");
    }

    const showcase = HubShowcaseService.getShowcase(params.vertical);
    const inquiryId = `INQ-${params.vertical.substring(0, 4)}-${Date.now().toString(36).toUpperCase()}`;

    const acknowledgmentMessage = `Dear ${params.fullName}, thank you for contacting VMN ${showcase.title}. Your inquiry (Reference: ${inquiryId}) has been routed to our operations team. A representative will contact you within 24 business hours.`;

    const initialStatus: InquiryStatus = params.autoRouteToCrm !== false ? "ROUTED_TO_CRM" : "RECEIVED";

    const inquiry: PublicInquiry = {
      id: inquiryId,
      vertical: params.vertical,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      organisationName: params.organisationName,
      message: params.message,
      status: initialStatus,
      receivedAt: new Date(),
      acknowledgmentMessage,
    };

    this.inquiries.push(inquiry);

    // Enqueue acknowledgment notification if queueWorker is configured (T-23, B-22)
    if (this.queueWorker) {
      this.queueWorker.enqueue("NOTIFICATION_DELIVERY", {
        to: inquiry.email,
        subject: `Inquiry Confirmation: VMN ${showcase.title} [${inquiry.id}]`,
        htmlContent: `<p>${inquiry.acknowledgmentMessage}</p>`,
        channel: "EMAIL",
      });
    }

    return inquiry;
  }

  public transitionStatus(inquiryId: string, targetStatus: InquiryStatus): PublicInquiry {
    const inquiry = this.inquiries.find((i) => i.id === inquiryId);
    if (!inquiry) {
      throw new Error(`[CRM-ERR-404] Inquiry with ID '${inquiryId}' not found.`);
    }

    const allowed = VALID_INQUIRY_TRANSITIONS[inquiry.status];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`[CRM-STATE-01] Invalid inquiry status transition from '${inquiry.status}' to '${targetStatus}'. Allowed: ${allowed.join(", ") || "none"}`);
    }

    inquiry.status = targetStatus;
    return inquiry;
  }

  public getInquiries(): PublicInquiry[] {
    return [...this.inquiries];
  }

  public getInquiryById(id: string): PublicInquiry | undefined {
    return this.inquiries.find((i) => i.id === id);
  }
}

/**
 * Renders the CRM Operations Queue Workspace view (T-23, B-22).
 */
export function renderCrmQueueWorkspaceHtml(inquiries: PublicInquiry[]): string {
  const rows = inquiries
    .map(
      (inq) => `
    <tr class="crm-row">
      <td class="font-mono text-sm">${inq.id}</td>
      <td><strong>${inq.fullName}</strong><br><span class="text-muted text-xs">${inq.email}</span></td>
      <td><span class="badge badge-outline">${inq.vertical}</span></td>
      <td><span class="badge badge-${inq.status === "CONTACTED" ? "success" : inq.status === "ROUTED_TO_CRM" ? "warning" : "info"}">${inq.status}</span></td>
      <td class="text-xs text-muted">${inq.receivedAt.toISOString().split("T")[0]}</td>
      <td>
        ${
          inq.status === "RECEIVED"
            ? `<button class="btn btn-sm btn-primary" data-action="route-crm" data-id="${inq.id}">Route to CRM</button>`
            : inq.status === "ROUTED_TO_CRM"
            ? `<button class="btn btn-sm btn-success" data-action="mark-contacted" data-id="${inq.id}">Mark Contacted</button>`
            : `<span class="text-xs text-success" style="display:inline-flex; align-items:center; gap:4px;">${renderIcon("check", { size: 14 })} Completed</span>`
        }
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div class="workspace-crm-queue p-6">
      <div class="header mb-6">
        <h1 class="text-2xl font-bold">CRM Inquiry & Onboarding Operations Queue</h1>
        <p class="text-muted">Managed routing pipeline for corporate, talent, and production submissions.</p>
      </div>
      <div class="table-container bg-surface rounded shadow overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="p-3">Inquiry ID</th>
              <th class="p-3">Contact</th>
              <th class="p-3">Vertical</th>
              <th class="p-3">Status</th>
              <th class="p-3">Date</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="6" class="p-6 text-center text-muted">No inquiries currently in queue.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Renders the standardized, accessible Enquiry / Submission Form (DT-304).
 * Fulfills WCAG 2.2 AA (44px touch targets, labels, hints, validation slots, and NDPR compliance notice).
 */
export function renderEnquiryFormHtml(vertical: HubVertical, showcaseTitle: string): string {
  return `
    <section class="vmn-enquiry-section card" style="max-width: 760px; margin: 32px auto 0 auto; width: 100%;">
      <div style="margin-bottom: 20px;">
        <span class="vmn-badge badge-info" style="font-size: 0.75rem; text-transform: uppercase;">Official Channel</span>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-top: 6px;">Submit an Inquiry to ${showcaseTitle}</h2>
        <p style="font-size: 0.9rem; color: var(--vmn-text-muted); margin-top: 4px;">
          Direct routing to VMNL Creative Economy Hub operations. Inquiries receive an automated CRM tracking reference within 24 business hours.
        </p>
      </div>

      <form action="/api/v1/hub/inquiries" method="POST" class="vmn-enquiry-form" novalidate style="display: flex; flex-direction: column; gap: 16px;">
        <input type="hidden" name="vertical" value="${vertical}" />

        <!-- Error Summary Box (Accessible WCAG 2.2 Alert Slot) -->
        <div id="enquiry-error-summary-${vertical}" class="vmn-error-summary" role="alert" aria-live="assertive" style="display: none; padding: 12px 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; color: #991B1B;">
          <strong>Please address the following requirements:</strong>
          <ul style="margin-top: 6px; padding-left: 20px; font-size: 0.85rem;"></ul>
        </div>

        <div>
          <label for="enquiry-fullName-${vertical}" style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">
            Full Legal Name <span class="text-live" aria-hidden="true" style="color: var(--vmn-color-live-text);">*</span>
          </label>
          <input id="enquiry-fullName-${vertical}" type="text" name="fullName" required aria-required="true" aria-describedby="hint-fullName-${vertical}" placeholder="e.g. Babatunde Adeleke" style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-control-border); border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
          <span id="hint-fullName-${vertical}" style="display: block; font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">Official contact name for identity verification and official correspondence.</span>
        </div>

        <div>
          <label for="enquiry-email-${vertical}" style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">
            Email Address <span class="text-live" aria-hidden="true" style="color: var(--vmn-color-live-text);">*</span>
          </label>
          <input id="enquiry-email-${vertical}" type="email" name="email" required aria-required="true" aria-describedby="hint-email-${vertical}" placeholder="babatunde@example.com" style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-control-border); border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
          <span id="hint-email-${vertical}" style="display: block; font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">Automated reference tracking and inquiry status updates are routed to this email.</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
          <div>
            <label for="enquiry-phone-${vertical}" style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">
              Phone / WhatsApp Number
            </label>
            <input id="enquiry-phone-${vertical}" type="tel" name="phone" aria-describedby="hint-phone-${vertical}" placeholder="+234 800 000 0000" style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-control-border); border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
            <span id="hint-phone-${vertical}" style="display: block; font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">Optional phone contact for expedited onboarding communications.</span>
          </div>
          <div>
            <label for="enquiry-org-${vertical}" style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">
              Organisation / Studio / Guild
            </label>
            <input id="enquiry-org-${vertical}" type="text" name="organisationName" aria-describedby="hint-org-${vertical}" placeholder="Independent / Company Name" style="width: 100%; min-height: 44px; padding: 10px 14px; border: 1px solid var(--vmn-color-control-border); border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
            <span id="hint-org-${vertical}" style="display: block; font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">Agency, guild membership, or independent practitioner handle.</span>
          </div>
        </div>

        <div>
          <label for="enquiry-msg-${vertical}" style="display: block; font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">
            Inquiry Scope / Creative Brief <span class="text-live" aria-hidden="true" style="color: var(--vmn-color-live-text);">*</span>
          </label>
          <textarea id="enquiry-msg-${vertical}" name="message" required minlength="10" rows="4" aria-required="true" aria-describedby="hint-msg-${vertical}" placeholder="Provide details regarding your project, pitch, booking, or partnership request (minimum 10 characters)..." style="width: 100%; min-height: 100px; padding: 10px 14px; border: 1px solid var(--vmn-color-control-border); border-radius: 6px; font-size: 1rem; box-sizing: border-box;"></textarea>
          <span id="hint-msg-${vertical}" style="display: block; font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 4px;">Thorough information ensures rapid dispatch to the responsible desk officer.</span>
        </div>

        <!-- NDPR Compliance Notice Box (DT-304 / DD-4) -->
        <div class="vmn-ndpr-notice" style="background: var(--vmn-surface-alt); padding: 14px 16px; border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <input id="enquiry-consent-${vertical}" type="checkbox" name="ndprConsent" required aria-required="true" style="margin-top: 3px; width: 20px; height: 20px; accent-color: var(--vmn-color-primary);" />
            <label for="enquiry-consent-${vertical}" style="font-size: 0.85rem; color: var(--vmn-text-main); line-height: 1.45;">
              <strong>NDPR Data Protection Consent:</strong> I agree to the processing of my contact and submission information in accordance with the <strong>Nigeria Data Protection Regulation (NDPR) 2019</strong> and <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Data is processed solely for evaluating inquiries, verifying credentials, and managing enterprise communications. Details are never sold or shared with unauthorized entities.
            </label>
          </div>
          <p style="font-size: 0.75rem; color: var(--vmn-color-text-muted); margin-top: 8px; margin-left: 30px;">
            For privacy queries, subject access requests, or record erasure, contact the Data Protection Officer at <code>privacy@vmnl.ng</code>.
          </p>
        </div>

        <button type="submit" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 1rem; font-weight: 600;">
          ${renderIcon("send", { size: 18 })} Submit Inquiry to ${showcaseTitle} &rarr;
        </button>
      </form>
    </section>
  `;
}

/**
 * Renders the domain-specific interactive feature for a given vertical (DT-501..505).
 */
function renderVerticalDomainSection(vertical: HubVertical): string {
  switch (vertical) {
    case "TALENT_ACCELERATOR":
      return `
        <!-- DT-501: Talent Accelerator Verification Ladder & Showcase -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            National Talent Verification Ladder
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            A rigorous 5-level qualification rubric assuring production-readiness, verified identity, and broadcast safety.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px;">
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <div style="font-weight: 700; color: var(--vmn-text-muted); font-size: 0.8rem; text-transform: uppercase;">Tier 0</div>
              <div style="font-weight: 700; font-size: 1rem; margin-top: 4px;">Registered</div>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Basic contact & portfolio link received.</p>
            </div>
            <div style="padding: 14px; background: #F0F9FF; border-radius: 6px; border: 1px solid #BAE6FD;">
              <div style="font-weight: 700; color: #0369A1; font-size: 0.8rem; text-transform: uppercase;">Tier 1</div>
              <div style="font-weight: 700; font-size: 1rem; color: #075985; margin-top: 4px;">Identity Verified</div>
              <p style="font-size: 0.8rem; color: #075985; margin-top: 4px;">NIN & photo ID cryptographically validated.</p>
            </div>
            <div style="padding: 14px; background: #F0FDF4; border-radius: 6px; border: 1px solid #BBF7D0;">
              <div style="font-weight: 700; color: #166534; font-size: 0.8rem; text-transform: uppercase;">Tier 2</div>
              <div style="font-weight: 700; font-size: 1rem; color: #166534; margin-top: 4px;">Guild Vetted</div>
              <p style="font-size: 0.8rem; color: #15803D; margin-top: 4px;">Portfolio validated by peer guild masters.</p>
            </div>
            <div style="padding: 14px; background: #FEF3C7; border-radius: 6px; border: 1px solid #FDE68A;">
              <div style="font-weight: 700; color: #92400E; font-size: 0.8rem; text-transform: uppercase;">Tier 3</div>
              <div style="font-weight: 700; font-size: 1rem; color: #92400E; margin-top: 4px;">Audition Passed</div>
              <p style="font-size: 0.8rem; color: #92400E; margin-top: 4px;">Screen test & studio master rubric passed.</p>
            </div>
            <div style="padding: 14px; background: #FAF5FF; border-radius: 6px; border: 1px solid #E9D5FF;">
              <div style="font-weight: 700; color: #6B21A8; font-size: 0.8rem; text-transform: uppercase;">Tier 4</div>
              <div style="font-weight: 700; font-size: 1rem; color: #6B21A8; margin-top: 4px;">Broadcast Lead</div>
              <p style="font-size: 0.8rem; color: #6B21A8; margin-top: 4px;">Primetime linear & VTM lead representation.</p>
            </div>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">Active Verified Talent Spotlight</h3>
          <div class="grid-2" style="margin-top: 0;">
            <div style="padding: 16px; background: white; border: 1px solid var(--vmn-color-control-border); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <h4 style="font-weight: 700; font-size: 1.1rem;">Chioma Adebayo</h4>
                  <span style="font-size: 0.85rem; color: var(--vmn-text-muted);">Lead Nollywood Screenwriter &amp; Performer</span>
                </div>
                <span class="vmn-badge badge-ready">Tier 4 Lead</span>
              </div>
              <p style="font-size: 0.85rem; margin-top: 8px; color: var(--vmn-text-main);">
                Credits: <em>Lagos Street Stories</em> (NXTR Flagship Drama), <em>Midnight in Calabar</em> (AFCA Fellowship).
              </p>
            </div>
            <div style="padding: 16px; background: white; border: 1px solid var(--vmn-color-control-border); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <h4 style="font-weight: 700; font-size: 1.1rem;">Emeka Nnamdi</h4>
                  <span style="font-size: 0.85rem; color: var(--vmn-text-muted);">Director of Photography / Colorist</span>
                </div>
                <span class="vmn-badge badge-ready">Tier 3 Master</span>
              </div>
              <p style="font-size: 0.85rem; margin-top: 8px; color: var(--vmn-text-main);">
                Certified on ARRI LF &amp; RED V-Raptor packages at ONE Studios. 4K HDR mastering specialist.
              </p>
            </div>
          </div>
        </div>
      `;

    case "AFCA_ACADEMY":
      return `
        <!-- DT-502: AFCA Academy Catalogue, Gradebook & Verifiable Certificate -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Accredited Modular Academic Curriculum
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Dual broadcast-accredited curricula connecting creative technique with commercial and technical mastery.
          </p>

          <div class="grid-2" style="margin-top: 0; margin-bottom: 24px;">
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-ready">12-Week Intensive</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Broadcast Television Engineering</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                MCR playout automation, SMPTE-2067 QC, EBU R128 audio loudness compliance, and StarTimes transponder transmission.
              </p>
            </div>
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-ready">8-Week Studio Practical</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Cinematography &amp; Master Lighting</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                Soundstage setups at ONE Studios with ARRI/RED packages under veteran Nigerian DPs.
              </p>
            </div>
          </div>

          <!-- Printable Certificate Verification Preview -->
          <div style="padding: 24px; background: #FAFAFA; border: 2px dashed #CBD5E1; border-radius: 8px; text-align: center;">
            <span class="vmn-badge badge-info" style="margin-bottom: 8px;">Digitally Verifiable Credential</span>
            <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--vmn-primary); margin-top: 4px;">
              Certificate of Broadcast Competency
            </h3>
            <p style="font-size: 0.9rem; color: var(--vmn-text-muted); margin-top: 4px;">
              African Film &amp; Creative Arts Academy (AFCA) in partnership with VMNL Broadcast Network.
            </p>
            <div style="margin-top: 16px; font-family: monospace; font-size: 0.8rem; background: white; padding: 10px; border-radius: 6px; border: 1px solid #E2E8F0; display: inline-block;">
              VERIFICATION HASH: SHA256:7B8F9A01C2E34D56E7F8901234567890ABCDEF1234567890ABCDEF1234567890
            </div>
            <div style="margin-top: 14px;">
              <a href="/verify/cert/AFCA-2026-0042" class="btn btn-outline" style="min-height: 40px; font-size: 0.85rem; padding: 0 16px;">
                ${renderIcon("document", { size: 16 })} Verify Sample Certificate &rarr;
              </a>
            </div>
          </div>
        </div>
      `;

    case "VTM_MANAGEMENT":
      return `
        <!-- DT-503: VTM Opportunity Board, Rate Cards & Escrow Timeline -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            VTM Opportunity Board &amp; Escrow Security
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Standardized day rates, verified casting briefs, and 100% escrow-backed commercial protection.
          </p>

          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">Standardized Talent Rate Cards</h3>
          <div class="table-container" style="overflow-x: auto; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--vmn-surface-border); background: var(--vmn-surface-alt);">
                  <th style="padding: 10px 12px;">Discipline / Role</th>
                  <th style="padding: 10px 12px;">Standard Day Rate</th>
                  <th style="padding: 10px 12px;">Broadcast Buyout</th>
                  <th style="padding: 10px 12px;">Escrow Deposit</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 600;">Lead Performer (Tier 4)</td>
                  <td style="padding: 10px 12px;">₦350,000 / day</td>
                  <td style="padding: 10px 12px;">₦3,500,000 / slate</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">100% Secured</span></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 600;">Director of Photography</td>
                  <td style="padding: 10px 12px;">₦450,000 / day</td>
                  <td style="padding: 10px 12px;">₦4,200,000 / feature</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">100% Secured</span></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 600;">Senior Screenwriter</td>
                  <td style="padding: 10px 12px;">₦200,000 / session</td>
                  <td style="padding: 10px 12px;">₦2,800,000 / script</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">100% Secured</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px;">Milestone Escrow Payout Lifecycle</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div style="padding: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px;">
              <span style="font-weight: 700; color: #166534; font-size: 0.8rem;">Stage 1</span>
              <div style="font-weight: 700; font-size: 0.95rem; color: #166534;">Contract &amp; Deposit</div>
              <p style="font-size: 0.8rem; color: #15803D; margin-top: 4px;">100% funds held in Tier-1 custody.</p>
            </div>
            <div style="padding: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px;">
              <span style="font-weight: 700; color: #166534; font-size: 0.8rem;">Stage 2</span>
              <div style="font-weight: 700; font-size: 0.95rem; color: #166534;">Production Wrap</div>
              <p style="font-size: 0.8rem; color: #15803D; margin-top: 4px;">50% released on director sign-off.</p>
            </div>
            <div style="padding: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px;">
              <span style="font-weight: 700; color: #166534; font-size: 0.8rem;">Stage 3</span>
              <div style="font-weight: 700; font-size: 0.95rem; color: #166534;">QC Acceptance</div>
              <p style="font-size: 0.8rem; color: #15803D; margin-top: 4px;">Final 50% released upon technical QC.</p>
            </div>
            <div style="padding: 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px;">
              <span style="font-weight: 700; color: #1D4ED8; font-size: 0.8rem;">Dispute Protection</span>
              <div style="font-weight: 700; font-size: 0.95rem; color: #1D4ED8;">Arbitration Gate</div>
              <p style="font-size: 0.8rem; color: #1E40AF; margin-top: 4px;">Arbitrated under Nigerian Arbitration Act.</p>
            </div>
          </div>
        </div>
      `;

    case "VCF_CONTENT_FUND":
      return `
        <!-- DT-504: VCF Slate Tracking & 4-Tier Recoupment Waterfall -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            4-Tier Recoupment Waterfall Visualisation
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Audited financial waterfall ensuring institutional investor confidence and transparent talent profit participation.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <div style="padding: 16px; background: #FEF2F2; border-left: 6px solid #DC2626; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span style="color: #991B1B;">Priority 1: Senior Debt &amp; P&amp;A Capital</span>
                <span style="color: #991B1B;">₦50,000,000 (100% First-Out)</span>
              </div>
              <p style="font-size: 0.85rem; color: #7F1D1D; margin-top: 4px;">
                Direct marketing, cinema prints, and senior capital loans repaid prior to any equity participation.
              </p>
            </div>

            <div style="padding: 16px; background: #EFF6FF; border-left: 6px solid #2563EB; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span style="color: #1E40AF;">Priority 2: Lead Equity Investors</span>
                <span style="color: #1E40AF;">₦180,000,000 (120% Return Hurdle)</span>
              </div>
              <p style="font-size: 0.85rem; color: #1E3A8A; margin-top: 4px;">
                Institutional and co-production equity recoupment plus 20% preferred IRR hurdle.
              </p>
            </div>

            <div style="padding: 16px; background: #FEF9C3; border-left: 6px solid #CA8A04; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span style="color: #854D0E;">Priority 3: VCF Development Re-Investment Pool</span>
                <span style="color: #854D0E;">15% Net Proceeds (₦30,000,000 Target)</span>
              </div>
              <p style="font-size: 0.85rem; color: #713F12; margin-top: 4px;">
                Evergreen fund allocation financing next-generation African creator format development.
              </p>
            </div>

            <div style="padding: 16px; background: #F0FDF4; border-left: 6px solid #16A34A; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span style="color: #166534;">Priority 4: Creative Talent &amp; Producer Profit Share</span>
                <span style="color: #166534;">85% Net Pool (₦90,000,000 Projected)</span>
              </div>
              <p style="font-size: 0.85rem; color: #14532D; margin-top: 4px;">
                Transparent backend points disbursed directly to writers, directors, and cast.
              </p>
            </div>
          </div>
        </div>
      `;

    case "ONE_STUDIOS":
      return `
        <!-- DT-505: ONE Studios Soundstages & Gear Locker -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Production Soundstages &amp; Cinema Gear Locker
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Acoustically isolated soundstages, continuous backup power, and tier-1 cinema camera packages in Lagos.
          </p>

          <div class="grid-3" style="margin-top: 0; margin-bottom: 24px;">
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-ready">5,000 sq ft</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Soundstage A (Flagship)</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                24ft grid height, soundproof NC-25 rating, silent air handling, and 500kVA dual synchronized generators.
              </p>
            </div>
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-info">3,200 sq ft</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Soundstage B (Green Screen)</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                Three-wall infinity cyclorama green screen, pre-rigged space lights, and DMX lighting control desk.
              </p>
            </div>
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-ready">Cinema Locker</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Camera Packages</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                ARRI Alexa Mini LF, RED V-Raptor 8K VV, Cooke Anamorphic Primes, and Fisher 10 Dolly systems.
              </p>
            </div>
          </div>
        </div>
      `;

    case "TEND_DISTRIBUTION":
      return `
        <!-- DT-505: TEND B2B Territorial Avails Matrix -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            B2B Territorial Rights &amp; Avails Matrix
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Cross-territory licensing exploitation across linear broadcast, premium SVOD, inflight, and international theatrical.
          </p>

          <div class="table-container" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--vmn-surface-border); background: var(--vmn-surface-alt);">
                  <th style="padding: 10px 12px;">Territory / Region</th>
                  <th style="padding: 10px 12px;">Linear TV</th>
                  <th style="padding: 10px 12px;">Pay TV</th>
                  <th style="padding: 10px 12px;">SVOD / OTT</th>
                  <th style="padding: 10px 12px;">Inflight &amp; Maritime</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 700;">West Africa (Anglophone)</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-live">NXTR / ORIS / IMBD</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">StarTimes Active</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">Azeebo+ Exclusive</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">Available</span></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 700;">Southern &amp; East Africa</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">MultiChoice / DStv</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Licensed (Air Peace)</span></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 700;">UK &amp; Europe Diaspora</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">FAST Channels</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">Azeebo+ Global</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Licensed (Virgin/BA)</span></td>
                </tr>
                <tr style="border-bottom: 1px solid var(--vmn-surface-border);">
                  <td style="padding: 10px 12px; font-weight: 700;">North America</td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-info">Azeebo+ Global</span></td>
                  <td style="padding: 10px 12px;"><span class="vmn-badge badge-ready">Available</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

    case "AFRO_FUSION_COMMUNITY":
      return `
        <!-- Afro-Fusion Community Co-Working & Guilds -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Nationwide Co-Working Hubs &amp; Creative Guilds
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Equipped workspace desks, editing suites, and podcast studios across 5 Nigerian creative hubs.
          </p>

          <div class="grid-3" style="margin-top: 0;">
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Lagos — Ikeja Central</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">40 Co-working desks, 2 podcast rooms, 4 edit suites.</p>
              <span class="vmn-badge badge-ready" style="margin-top: 8px;">Open 24/7</span>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Abuja — Wuse II</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">25 Co-working desks, screening lounge, meeting rooms.</p>
              <span class="vmn-badge badge-ready" style="margin-top: 8px;">Open 24/7</span>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Enugu — Independence</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">20 Creative desks, high-speed fiber, script reading hub.</p>
              <span class="vmn-badge badge-ready" style="margin-top: 8px;">Open 24/7</span>
            </div>
          </div>
        </div>
      `;

    case "FUSION_EVENTS":
      return `
        <!-- Fusion Events Digital Turnstile Verification -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Cryptographic Digital Turnstile Verification
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Single-use HMAC-SHA256 encrypted dynamic QR codes preventing counterfeit ticketing at stadium and festival gates.
          </p>

          <div class="grid-2" style="margin-top: 0;">
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-live">Upcoming Event</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Afro-Fusion Summer Fest 2026</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                Eko Atlantic City, Lagos. 3 Stages, 45 Performing Artists, Live Linear Broadcast on NXTR.
              </p>
            </div>
            <div style="padding: 16px; background: var(--vmn-surface-alt); border-radius: 8px; border: 1px solid var(--vmn-surface-border);">
              <span class="vmn-badge badge-info">Industry Gala</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-top: 8px;">Nollywood Screen Awards</h3>
              <p style="font-size: 0.85rem; color: var(--vmn-text-muted); margin-top: 4px;">
                Federal Palace Hotel, Victoria Island. Broadcast live across NXTR, ORIS, and IMBD.
              </p>
            </div>
          </div>
        </div>
      `;

    case "HEADSPACE_NG":
      return `
        <!-- HeadspaceNG Research & Knowledge -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Enterprise Research &amp; Regulatory Precedents
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            IP valuation bibles, NBC broadcast code compliance compendiums, and Nigerian creative economy market sizing.
          </p>

          <div class="grid-3" style="margin-top: 0;">
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">NBC 7th Edition Compendium</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Complete broadcast compliance rubric and watershed guidelines.</p>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Nollywood Market Report 2026</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Box office, SVOD commissioning budgets, and audience reach metrics.</p>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Copyright &amp; IP Valuation</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Frameworks for bankable IP collateral and format licensing.</p>
            </div>
          </div>
        </div>
      `;

    case "CR8TECH_NG":
      return `
        <!-- Cr8TechNG Multilingual AI & Toolkits -->
        <div class="card" style="margin-top: 0;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--vmn-primary);">
            Next-Gen Broadcast AI Toolkits
          </h2>
          <p style="font-size: 0.95rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
            Indigenous language speech-to-text subtitling, automated social clipping, and broadcast watermarking.
          </p>

          <div class="grid-3" style="margin-top: 0;">
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Indigenous Subtitling</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Frame-synced SRT/VTT subtitles in Yoruba, Igbo, Hausa, and Nigerian Pidgin.</p>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">AI Social Clipping</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Automated 9:16 vertical highlights extraction from 1080i50 linear broadcasts.</p>
            </div>
            <div style="padding: 14px; background: var(--vmn-surface-alt); border-radius: 6px; border: 1px solid var(--vmn-surface-border);">
              <h3 style="font-weight: 700; font-size: 1rem;">Forensic Watermarking</h3>
              <p style="font-size: 0.8rem; color: var(--vmn-text-muted); margin-top: 4px;">Imperceptible frame-level cryptographic watermarking for anti-piracy protection.</p>
            </div>
          </div>
        </div>
      `;

    default:
      return "";
  }
}

/**
 * Universal Landing Page Template for all 10 Hub Verticals (DT-303).
 * Fulfills one unified, accessible, content-driven template standard.
 */
export function renderVerticalLandingPageHtml(vertical: HubVertical): string {
  const showcase = HubShowcaseService.getShowcase(vertical);

  return `
  <section style="display: flex; flex-direction: column; gap: 24px;">
    <!-- Breadcrumb Navigation -->
    <nav aria-label="Breadcrumb" style="font-size: 0.85rem; color: var(--vmn-text-muted);">
      <a href="/" style="color: var(--vmn-color-primary); text-decoration: none;">Home</a> &gt; 
      <a href="/hub" style="color: var(--vmn-color-primary); text-decoration: none;">Creative Hub</a> &gt; 
      <span style="color: var(--vmn-text-main); font-weight: 600;">${showcase.title}</span>
    </nav>

    <!-- Hero Header Banner -->
    <div class="card" style="border-left: 6px solid var(--vmn-color-primary); background: linear-gradient(to right, #FFFFFF, var(--vmn-surface-alt)); padding: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div style="max-width: 680px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span class="vmn-badge badge-info" style="font-size: 0.75rem; text-transform: uppercase;">
              Hub Pillar
            </span>
            <span class="vmn-badge badge-ready">Enterprise Active</span>
          </div>
          <h1 style="font-size: 2.2rem; font-weight: 800; color: var(--vmn-primary); line-height: 1.2;">
            ${showcase.title}
          </h1>
          <p style="font-size: 1.15rem; font-weight: 600; color: var(--vmn-color-primary); margin-top: 8px;">
            ${showcase.tagline}
          </p>
          <p style="font-size: 1rem; color: var(--vmn-text-muted); margin-top: 8px; line-height: 1.5;">
            ${showcase.description}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <a href="#inquiry-form" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 20px;">
            ${showcase.callToAction} &rarr;
          </a>
          <a href="/hub" class="btn btn-outline" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 20px;">
            &larr; All Hub Verticals
          </a>
        </div>
      </div>
    </div>

    <!-- Domain-Specific Interactive Showcase Feature (DT-501..505) -->
    ${renderVerticalDomainSection(vertical)}

    <!-- Standardized Accessible Enquiry Form (DT-304) -->
    <div id="inquiry-form">
      ${renderEnquiryFormHtml(vertical, showcase.title)}
    </div>
  </section>
  `;
}

