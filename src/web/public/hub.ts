/**
 * Creative Economy Hub Public Showcases & Inquiry Capture Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8 / docs/decisions/design-task-de-citation.md (legacy "design-task" DT reference)
 *
 * Public showcase definitions for ten Hub topic areas.
 * Preliminary enquiry capture; storage, CRM routing, delivery, and retention are environment-local or unverified.
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
    tagline: "Talent Programme Enquiries",
    description: "Enquire about potential talent opportunities. Onboarding, credential checks, deployments, and partner locations are not verified here.",
    callToAction: "Apply for Talent Onboarding",
    inquiryType: "TALENT_APPLICATION",
    route: "/hub/talent",
  },
  AFCA_ACADEMY: {
    vertical: "AFCA_ACADEMY",
    title: "African Film & Creative Arts Academy",
    tagline: "Film & Media Learning Enquiries",
    description: "Enquire about potential learning opportunities. Course availability, accreditation, mentors, and credentials require current confirmation.",
    callToAction: "Explore Academic Cohorts",
    inquiryType: "ACADEMY_ADMISSION",
    route: "/hub/afca",
  },
  AFRO_FUSION_COMMUNITY: {
    vertical: "AFRO_FUSION_COMMUNITY",
    title: "Afro-Fusion Creatives",
    tagline: "Creative Community Enquiries",
    description: "Enquire about potential community and workspace opportunities. Locations, facilities, and availability require confirmation.",
    callToAction: "Join the Guild / Book a Desk",
    inquiryType: "COMMUNITY_MEMBERSHIP",
    route: "/hub/community",
  },
  VTM_MANAGEMENT: {
    vertical: "VTM_MANAGEMENT",
    title: "Virtual Talent Management (VTM)",
    tagline: "Talent Engagement Enquiries",
    description: "Submit an enquiry about potential talent opportunities. Credentials, rates, contract terms, and payment protection require case-specific confirmation.",
    callToAction: "Enquire About Talent",
    inquiryType: "CASTING_BRIEF",
    route: "/hub/vtm",
  },
  VCF_CONTENT_FUND: {
    vertical: "VCF_CONTENT_FUND",
    title: "Virtual Content Fund (VCF)",
    tagline: "African Storytelling Development Enquiries",
    description: "Submit a pitch enquiry. Funding availability, eligibility, rights, and any recoupment terms require separate review and agreement.",
    callToAction: "Submit a Film / Series Pitch",
    inquiryType: "PITCH_SUBMISSION",
    route: "/hub/vcf",
  },
  ONE_STUDIOS: {
    vertical: "ONE_STUDIOS",
    title: "ONE Studios",
    tagline: "Production Services Enquiries",
    description: "Enquire about production services. Facility specifications, equipment, availability, and rates require current confirmation.",
    callToAction: "Enquire About Production",
    inquiryType: "STUDIO_BOOKING",
    route: "/hub/onestudios",
  },
  FUSION_EVENTS: {
    vertical: "FUSION_EVENTS",
    title: "Fusion Events",
    tagline: "Events & Partnership Enquiries",
    description: "Enquire about potential event partnerships. Event schedules, ticketing, security, and availability are not represented as verified here.",
    callToAction: "Enquire About Events",
    inquiryType: "EVENT_PARTNERSHIP",
    route: "/hub/events",
  },
  TEND_DISTRIBUTION: {
    vertical: "TEND_DISTRIBUTION",
    title: "The Entertainment Network Distribution (TEND)",
    tagline: "Content Distribution Enquiries",
    description: "Ask about content distribution. Catalogue availability, rights, territories, windows, and platform terms require title-specific confirmation.",
    callToAction: "Enquire About Distribution",
    inquiryType: "CONTENT_LICENSING",
    route: "/hub/distribution",
  },
  HEADSPACE_NG: {
    vertical: "HEADSPACE_NG",
    title: "HeadspaceNG Strategic Intelligence",
    tagline: "Research Enquiries",
    description: "Enquire about research and reference materials; publication catalogue, currency, and availability are unverified.",
    callToAction: "Access Research Portal",
    inquiryType: "RESEARCH_INQUIRY",
    route: "/insights",
  },
  CR8TECH_NG: {
    vertical: "CR8TECH_NG",
    title: "Cr8TechNG",
    tagline: "Technology Service Enquiries",
    description: "Enquire about potential technology services; product capabilities, performance, and availability are unverified.",
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

    const acknowledgmentMessage = `Dear ${params.fullName}, thank you for submitting an enquiry to VMN ${showcase.title}. Reference: ${inquiryId}. This is an environment-local reference only; routing, delivery, response timing, and durable retention are not confirmed.`;

    const initialStatus: InquiryStatus = "RECEIVED";

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
            ? `<span class="text-xs text-muted">Awaiting manual review; no downstream routing is confirmed.</span>`
            : inq.status === "ROUTED_TO_CRM"
            ? `<button class="btn btn-sm btn-success" data-action="mark-contacted" data-id="${inq.id}">Mark Contacted</button>`
 : `<span class="text-xs text-success s-8njpykOsjk" >${renderIcon("check", { size: 14 })} Completed</span>`
        }
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div class="workspace-crm-queue p-6">
      <div class="header mb-6">
        <h1 class="text-2xl font-bold">Local Inquiry Review Queue</h1>
        <p class="text-muted">This process-local view is not a CRM connection; delivery, routing, and retention are not guaranteed.</p>
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
 * Renders a preliminary Enquiry / Submission Form. Accessibility conformance and privacy terms require review.
 */
export function renderEnquiryFormHtml(vertical: HubVertical, showcaseTitle: string): string {
  return `
 <section class="vmn-enquiry-section card s-1yijgBaO-w" >
 <div class="s-t1-tAAl8Ne"> <span class="vmn-badge badge-info" >Preliminary Enquiry Form</span>

 <h2 class="s-nUdG7Wj9Ig">Submit an Inquiry to ${showcaseTitle}</h2>
 <p class="s-c1hKNIfX99">
          Enquiry handling, delivery, response timing, and durable tracking are not guaranteed in this environment. This form is not connected to a verified CRM; please do not include sensitive personal information.
        </p>
      </div>

 <form action="/api/v1/hub/inquiries" method="POST" class="vmn-enquiry-form s-jvR2_DF1C2" novalidate >
        <input type="hidden" name="vertical" value="${vertical}" />

        <!-- Error Summary Box (Accessible WCAG 2.2 Alert Slot) -->
 <div id="enquiry-error-summary-${vertical}" class="vmn-error-summary s-vLW93rxYPe" role="alert" aria-live="assertive" >
          <strong>Please address the following requirements:</strong>
 <ul class="s-hMHVeuC0d-"></ul>
        </div>

        <div>
 <label for="enquiry-fullName-${vertical}" class="s-aifeWEAxxk">
 Full Legal Name <span class="text-live s-PWN9_25rCg" aria-hidden="true" >*</span>
          </label>
 <input id="enquiry-fullName-${vertical}" type="text" name="fullName" required aria-required="true" aria-describedby="hint-fullName-${vertical}" placeholder="e.g. Babatunde Adeleke" class="s-Gf3ZZQde5S" />
 <span id="hint-fullName-${vertical}" class="s-NxbziXC3hS">Official contact name for identity verification and official correspondence.</span>
        </div>

        <div>
 <label for="enquiry-email-${vertical}" class="s-aifeWEAxxk">
 Email Address <span class="text-live s-PWN9_25rCg" aria-hidden="true" >*</span>
          </label>
 <input id="enquiry-email-${vertical}" type="email" name="email" required aria-required="true" aria-describedby="hint-email-${vertical}" placeholder="babatunde@example.com" class="s-Gf3ZZQde5S" />
 <span id="hint-email-${vertical}" class="s-NxbziXC3hS">A reference may be shown for this environment-local submission; tracking and status delivery are not guaranteed.</span>
        </div>

 <div class="s-4qBYC5pvY8">
          <div>
 <label for="enquiry-phone-${vertical}" class="s-aifeWEAxxk">
              Phone / WhatsApp Number
            </label>
 <input id="enquiry-phone-${vertical}" type="tel" name="phone" aria-describedby="hint-phone-${vertical}" placeholder="+234 800 000 0000" class="s-Gf3ZZQde5S" />
 <span id="hint-phone-${vertical}" class="s-NxbziXC3hS">Optional phone contact for expedited onboarding communications.</span>
          </div>
          <div>
 <label for="enquiry-org-${vertical}" class="s-aifeWEAxxk">
              Organisation / Studio / Guild
            </label>
 <input id="enquiry-org-${vertical}" type="text" name="organisationName" aria-describedby="hint-org-${vertical}" placeholder="Independent / Company Name" class="s-Gf3ZZQde5S" />
 <span id="hint-org-${vertical}" class="s-NxbziXC3hS">Agency, guild membership, or independent practitioner handle.</span>
          </div>
        </div>

        <div>
 <label for="enquiry-msg-${vertical}" class="s-aifeWEAxxk">
 Inquiry Scope / Creative Brief <span class="text-live s-PWN9_25rCg" aria-hidden="true" >*</span>
          </label>
 <textarea id="enquiry-msg-${vertical}" name="message" required minlength="10" rows="4" aria-required="true" aria-describedby="hint-msg-${vertical}" placeholder="Provide details regarding your project, pitch, booking, or partnership request (minimum 10 characters)..." class="s-_MEf3I0ZQi"></textarea>
 <span id="hint-msg-${vertical}" class="s-NxbziXC3hS">Thorough information ensures rapid dispatch to the responsible desk officer.</span>
        </div>

        <!-- NDPR Compliance Notice Box (DT-304 / DD-4) -->
 <div class="vmn-ndpr-notice s-t594uuT5Ag" >
 <div class="s-VwxjWfRdaC">
 <input id="enquiry-consent-${vertical}" type="checkbox" name="ndprConsent" required aria-required="true" class="s-8zFwqKw-lq" />
 <label for="enquiry-consent-${vertical}" class="s-gaxdlTgcds">
              <strong>Submission acknowledgement:</strong> I understand information entered here may be processed by this service. The privacy notice and handling details require review; do not submit sensitive personal information.
            </label>
          </div>
 <p class="s-4lw5YN1WG9">
            A verified privacy contact and complete data-subject request process have not been confirmed for publication. Avoid submitting sensitive personal information.
          </p>
        </div>

 <button type="submit" class="btn btn-primary s-6T2UvhilmF" >
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
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Illustrative Talent Onboarding Concepts
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative onboarding concepts only — no identity verification, qualification outcome, deployment readiness, or broadcast-safety assessment is represented.
          </p>

 <div class="s-8_1VIuXAbq">
 <div class="s-vNAP7rSzOA">
 <div class="s-K5RZwJyv0Y">Tier 0</div>
 <div class="s-8206NkZugl">Registered</div>
 <p class="s-_Tgvu1eVfJ">Basic contact & portfolio link received.</p>
            </div>
 <div class="s-vQ8LlSIdcD">
 <div class="s-SGGqh7sHkE">Tier 1 — Illustrative</div>
 <div class="s-Q5WxJJakHB">Identity Review</div>
 <p class="s-Z3FgauS_zT">Example status only — no identity verification is represented.</p>
            </div>
 <div class="s-82YU5E_zbv">
 <div class="s-V2suo3Tl05">Tier 2</div>
 <div class="s-oxcC3afBXl">Sample Portfolio Review</div>
 <p class="s-_u7s4I3vf3">Illustrative status only — no peer validation is represented.</p>
            </div>
 <div class="s-M0eSB8jBk2">
 <div class="s-GANLM_CBk0">Tier 3</div>
 <div class="s-3vD3i-p_x3">Sample Assessment</div>
 <p class="s-qhRReaWMOk">Illustrative status only — no assessment outcome is represented.</p>
            </div>
 <div class="s-f4tYsFOMAW">
 <div class="s-kYVz6JmKkx">Tier 4</div>
 <div class="s-qOdH1fklYd">Sample Senior Tier</div>
 <p class="s-iesZYPy3dr">Illustrative concept only — not a deployment or representation status.</p>
            </div>
          </div>

 <h3 class="s-kFV4BDu_MR">Illustrative Talent Profile Examples — Not Verified</h3>
 <div class="grid-2 s-wxIomRKg8S" >
 <div class="s-6fJLYYpGcN">
 <div class="s-M1O53rBksg">
                <div>
 <h4 class="s-oUWNN5us3J">Sample Talent Profile</h4>
 <span class="s-mDq7g3w0iF">Lead Nollywood Screenwriter &amp; Performer</span>
                </div>
                <span class="vmn-badge badge-info">Sample profile</span>
              </div>
 <p class="s-1G951GBgPG">
                Sample biography only — no real person, engagement, credits, or affiliation is represented.
              </p>
            </div>
 <div class="s-6fJLYYpGcN">
 <div class="s-M1O53rBksg">
                <div>
 <h4 class="s-oUWNN5us3J">Sample Production Profile</h4>
 <span class="s-mDq7g3w0iF">Director of Photography / Colorist</span>
                </div>
                <span class="vmn-badge badge-info">Sample profile</span>
              </div>
 <p class="s-1G951GBgPG">
                Sample biography only — credentials and credits are not verified.
              </p>
            </div>
          </div>
        </div>
      `;

    case "AFCA_ACADEMY":
      return `
        <!-- DT-502: Illustrative AFCA Academy catalogue and certificate preview -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Illustrative Modular Curriculum Concepts
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Sample curriculum concepts only — accreditation and course availability require independent confirmation.
          </p>

 <div class="grid-2 s-6X8cYdo3sE" >
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Sample course duration</span>
 <h3 class="s-TU7qtfbl72">Broadcast Television Engineering</h3>
 <p class="s-6h1bkfKlAr">
                MCR workflow concepts, media QC, and broadcast engineering training; vendor-specific transmission details require independent verification.
              </p>
            </div>
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Sample course duration</span>
 <h3 class="s-TU7qtfbl72">Cinematography &amp; Master Lighting</h3>
 <p class="s-6h1bkfKlAr">
                Illustrative course topic only — facilities, equipment, instructors, and course availability are not verified.
              </p>
            </div>
          </div>            <!-- Printable illustrative certificate preview; no credential is issued -->
 <div class="s-PxI5Sa74ao"> <span class="vmn-badge badge-info" >Illustrative certificate preview</span>
 <h3 class="s-1A2Vx6CV39">
              Certificate of Broadcast Competency
            </h3>
 <p class="s-c1hKNIfX99">
              Illustrative layout only — no issued or accredited credential is represented.
            </p>
 <div class="s-S3UdE38cOu">
              SAMPLE ONLY — NO ISSUED CREDENTIAL
            </div>
 <div class="s-smrs69HMBJ">
 <a href="/verify/cert/AFCA-2026-0042" class="btn btn-outline s--zUf_5R1zr" >
                ${renderIcon("document", { size: 16 })} Certificate lookup information &rarr;
              </a>
            </div>
          </div>
        </div>
      `;

    case "VTM_MANAGEMENT":
      return `
        <!-- DT-503: Illustrative VTM opportunity board, rate and payment concepts -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            VTM Engagement Enquiry Concepts
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative deal-flow concepts only. Rates, briefs, escrow availability, and commercial terms are not verified.
          </p>

 <h3 class="s-kFV4BDu_MR">Illustrative Deal-Flow Schema</h3>
          <div class="card s-UNW5i_E0iy" role="note">Role, rate, buyout, rights, tax, payment-protection, and timing details are intentionally omitted. No offer or commercial term is represented.</div>
 <div class="table-container" >
 <table class="s-fzAoGce9Zz">
              <thead>
 <tr class="s-hpaTch9Hgc">
 <th class="s-lr_pOFE4_J">Example workflow step</th>
 <th class="s-lr_pOFE4_J">Current terms</th>
 <th class="s-lr_pOFE4_J">Payment protection</th>
                </tr>
              </thead>
              <tbody>
 <tr class="s-qt0hlWQgu9">
 <td class="s-oikozTowEq">Engagement proposal</td>
 <td class="s-lr_pOFE4_J">Not available from verified source</td>
 <td class="s-lr_pOFE4_J">Not established</td>
                </tr>
 <tr class="s-qt0hlWQgu9">
 <td class="s-oikozTowEq">Rights and scope review</td>
 <td class="s-lr_pOFE4_J">Requires case-specific review</td>
 <td class="s-lr_pOFE4_J">Not established</td>
                </tr>
 <tr class="s-qt0hlWQgu9">
 <td class="s-oikozTowEq">Delivery and settlement</td>
 <td class="s-lr_pOFE4_J">No agreed terms represented</td>
 <td class="s-lr_pOFE4_J">Not established</td>
                </tr>
              </tbody>
            </table>
          </div>

 <h3 class="s-kFV4BDu_MR">Illustrative Payment Workflow — Not Evidence of Escrow</h3>
 <div class="s-9VdguOP48p">
 <div class="s-pbKykg5lIX">
 <span class="s-iW8g4ukqbS">Stage 1</span>
 <div class="s-OfTGbiVQm3">Contract &amp; Deposit</div>
 <p class="s-_u7s4I3vf3">Illustrative workflow step only — no custody or payment protection is represented.</p>
            </div>
 <div class="s-pbKykg5lIX">
 <span class="s-iW8g4ukqbS">Stage 2</span>
 <div class="s-OfTGbiVQm3">Production Wrap</div>
 <p class="s-_u7s4I3vf3">Illustrative milestone only — no payment release is represented.</p>
            </div>
 <div class="s-pbKykg5lIX">
 <span class="s-iW8g4ukqbS">Stage 3</span>
 <div class="s-OfTGbiVQm3">QC Acceptance</div>
 <p class="s-_u7s4I3vf3">Illustrative milestone only — no payment release is represented.</p>
            </div>
 <div class="s-HEIs5ke-6o">
 <span class="s-_xEx-4ucWl">Dispute Protection</span>
 <div class="s-IXSRWXYHY-">Arbitration Gate</div>
 <p class="s-IdF9vv6dtH">Illustrative concept only — no dispute-resolution term is represented.</p>
            </div>
          </div>
        </div>
      `;

    case "VCF_CONTENT_FUND":
      return `
        <!-- DT-504: Illustrative VCF waterfall scenario, not approved terms -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            4-Tier Recoupment Waterfall Visualisation
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative waterfall scenario only — no audited or approved investment terms are represented.
          </p>

 <div class="s-BQPJ7iVqtH">
 <div class="s-NDvzk7gsCL">
 <div class="s-X4ZWvC6K1J">
 <span class="s-bmiGIgC5Pn">Priority 1: Senior Debt &amp; P&amp;A Capital</span>
 <span class="s-bmiGIgC5Pn">Illustrative amount — not an offer</span>
              </div>
 <p class="s-Hg_grGkrIn">
                Direct marketing, cinema prints, and senior capital loans repaid prior to any equity participation.
              </p>
            </div>

 <div class="s-_oCghho1WV">
 <div class="s-X4ZWvC6K1J">
 <span class="s-jfMLyiV-I9">Priority 2: Lead Equity Investors</span>
 <span class="s-jfMLyiV-I9">Illustrative amount — not an offer</span>
              </div>
 <p class="s-HFgJl_wJJ7">
                Illustrative sequencing only — no return hurdle, investment offer, or recoupment term is represented.
              </p>
            </div>

 <div class="s-NZpdq10itV">
 <div class="s-X4ZWvC6K1J">
 <span class="s-NnzIrQ0Aaf">Priority 3: VCF Development Re-Investment Pool</span>
 <span class="s-NnzIrQ0Aaf">Illustrative share — not an approved term</span>
              </div>
 <p class="s-HINULBlqzI">
                Evergreen fund allocation financing next-generation African creator format development.
              </p>
            </div>

 <div class="s-bp8rWOCjDz">
 <div class="s-X4ZWvC6K1J">
 <span class="s-S6hdiwNFZl">Priority 4: Creative Talent &amp; Producer Profit Share</span>
 <span class="s-S6hdiwNFZl">Illustrative share — not an approved term</span>
              </div>
 <p class="s-inR6WRNXGN">
                Transparent backend points disbursed directly to writers, directors, and cast.
              </p>
            </div>
          </div>
        </div>
      `;

    case "ONE_STUDIOS":
      return `
        <!-- DT-505: Illustrative production facility and equipment examples -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Sample Production Facility Profiles
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative facility and equipment examples only; location, specifications, inventory, and availability require current confirmation.
          </p>

 <div class="grid-3 s-6X8cYdo3sE" >
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Sample facility profile</span>
 <h3 class="s-TU7qtfbl72">Soundstage A (Flagship)</h3>
 <p class="s-6h1bkfKlAr">
                Sample facility description only — specifications and current inventory are not verified.
              </p>
            </div>
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Sample facility profile</span>
 <h3 class="s-TU7qtfbl72">Soundstage B (Green Screen)</h3>
 <p class="s-6h1bkfKlAr">
                Sample facility description only — specifications and current inventory are not verified.
              </p>
            </div>
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Sample equipment list</span>
 <h3 class="s-TU7qtfbl72">Camera Packages</h3>
 <p class="s-6h1bkfKlAr">
                Sample equipment list only — specifications and availability are not verified.
              </p>
            </div>
          </div>
        </div>
      `;

    case "TEND_DISTRIBUTION":
      return `
        <!-- DT-505: TEND B2B Territorial Avails Matrix -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Illustrative Distribution Rights Categories
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative rights-query categories only. No territory, platform, window, exclusivity, licence, carriage, or availability is represented; confirm title-specific rights before exploitation.
          </p>

 <div class="table-container s-QtRFDAL0Yl" >
 <table class="s-fzAoGce9Zz">
              <thead>
 <tr class="s-hpaTch9Hgc">
 <th class="s-lr_pOFE4_J">Territory / Region</th>
 <th class="s-lr_pOFE4_J">Linear TV</th>
 <th class="s-lr_pOFE4_J">Pay TV</th>
 <th class="s-lr_pOFE4_J">SVOD / OTT</th>
 <th class="s-lr_pOFE4_J">Inflight &amp; Maritime</th>
                </tr>
              </thead>
              <tbody>
 <tr class="s-qt0hlWQgu9">
 <td class="s-Hwfj1V3-5C">West Africa (Anglophone)</td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Carriage unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights/availability unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Availability unverified</span></td>
                </tr>
 <tr class="s-qt0hlWQgu9">
 <td class="s-Hwfj1V3-5C">Southern &amp; East Africa</td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Carriage unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
                </tr>
 <tr class="s-qt0hlWQgu9">
 <td class="s-Hwfj1V3-5C">UK &amp; Europe Diaspora</td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
                </tr>
 <tr class="s-qt0hlWQgu9">
 <td class="s-Hwfj1V3-5C">North America</td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
 <td class="s-lr_pOFE4_J"><span class="vmn-badge badge-info">Rights unverified</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

    case "AFRO_FUSION_COMMUNITY":
      return `
        <!-- Afro-Fusion Community Co-Working & Guilds -->
 <div class="card" > <h2 class="s-oGyOq4afLc">
            Creative Community Workspace Enquiries

          </h2>
 <p class="s-Hk5RLc-Lnh">
            Sample hub profiles only — location, facilities, capacity, access, and availability are not verified.
          </p>

 <div class="grid-3 s-wxIomRKg8S" >
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Sample Hub Profile A</h3>
 <p class="s-_Tgvu1eVfJ">No location, facility, capacity, or access details are verified.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Sample Hub Profile B</h3>
 <p class="s-_Tgvu1eVfJ">No location, facility, capacity, or access details are verified.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Sample Hub Profile C</h3>
 <p class="s-_Tgvu1eVfJ">No location, facility, capacity, or access details are verified.</p>
            </div>
          </div>
        </div>
      `;

    case "FUSION_EVENTS":
      return `
        <!-- Fusion Events Digital Turnstile Verification -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Illustrative Event Entry Concepts
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative ticketing and entry-verification concepts only; no deployed ticketing, cryptographic control, event, or anti-fraud outcome is represented.
          </p>

 <div class="grid-2 s-wxIomRKg8S" >
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Illustrative event scenario</span>
 <h3 class="s-TU7qtfbl72">Sample Event Profile</h3>
 <p class="s-6h1bkfKlAr">
                No event, venue, artist lineup, ticketing, or broadcast booking is represented.
              </p>
            </div>
 <div class="s-CxGPIFLqP2">
              <span class="vmn-badge badge-info">Illustrative event scenario</span>
 <h3 class="s-TU7qtfbl72">Sample Industry Event</h3>
 <p class="s-6h1bkfKlAr">
                No event, venue, event schedule, or transmission is represented.
              </p>
            </div>
          </div>
        </div>
      `;

    case "HEADSPACE_NG":
      return `
        <!-- HeadspaceNG Research & Knowledge -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Potential Research Topics
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Potential research topics only. No current publication, legal advice, regulatory interpretation, or market dataset is represented.
          </p>

 <div class="grid-3 s-wxIomRKg8S" >
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Broadcast Regulation Research</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — no compendium or compliance advice is represented.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Creative Economy Research</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — no report, current market data, or audience metrics are represented.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Rights &amp; IP Research Topics</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — no legal advice, valuation, or financing framework is represented.</p>
            </div>
          </div>
        </div>
      `;

    case "CR8TECH_NG":
      return `
        <!-- Cr8TechNG Multilingual AI & Toolkits -->
 <div class="card s-wxIomRKg8S" >
 <h2 class="s-oGyOq4afLc">
            Illustrative Technology Topics
          </h2>
 <p class="s-Hk5RLc-Lnh">
            Illustrative technology topics only — product capability, testing, security, and availability are not verified.
          </p>

 <div class="grid-3 s-wxIomRKg8S" >
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Indigenous Subtitling</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — language coverage and subtitle quality are not verified.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">AI Social Clipping</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — supported formats, automation, and output quality are not verified.</p>
            </div>
 <div class="s-vNAP7rSzOA">
 <h3 class="s-xc9aS5FPdd">Forensic Watermarking</h3>
 <p class="s-_Tgvu1eVfJ">Illustrative topic only — watermarking capability and anti-piracy effectiveness are not verified.</p>
            </div>
          </div>
        </div>
      `;

    default:
      return "";
  }
}

/**
 * Universal landing page template for Hub topic areas (DT-303).
 * Accessibility and content conformance require separate review.
 */
export function renderVerticalLandingPageHtml(vertical: HubVertical): string {
  const showcase = HubShowcaseService.getShowcase(vertical);

  return `
 <section class="s-SsEggQq8MR">
    <!-- Breadcrumb Navigation -->
 <nav aria-label="Breadcrumb" class="s-mDq7g3w0iF">
 <a href="/" class="s-Dy2KG-sms9">Home</a> &gt; 
 <a href="/hub" class="s-Dy2KG-sms9">Creative Hub</a> &gt; 
 <span class="s-AMflIswjLr">${showcase.title}</span>
    </nav>

    <!-- Hero Header Banner -->
 <div class="card s-fIrAVmMnCe" >
 <div class="s-GdqqA-3ley">
 <div class="s-GWpu2umRuF">
 <div class="s-0as_Yyb8jh">
 <span class="vmn-badge badge-info s-NPkTOUTw6y" >
              Preliminary Service Concept
            </span>
            <span class="vmn-badge badge-info">Service profile — availability unverified</span>
          </div>
 <h1 class="s-ebGKQtSLqv">
            ${showcase.title}
          </h1>
 <p class="s-kYZr9q8aEw">
            ${showcase.tagline}
          </p>
 <p class="s-GsAFOFj_rF">
            ${showcase.description}
          </p>
        </div>
 <div class="s-RksozYn_b3">
 <a href="#inquiry-form" class="btn btn-primary s-Ege95lsQ9P" >
            ${showcase.callToAction} &rarr;
          </a>
 <a href="/hub" class="btn btn-outline s-Ege95lsQ9P" >
            &larr; All Hub Verticals
          </a>
        </div>
      </div>
    </div>
    <div class="card" role="note">Illustrative service concepts and sample scenarios only. This page does not verify accreditation, active personnel, facilities, escrow or fund availability, rates, rights, events, or operational service readiness. Confirm current source records and approved terms before relying on them.</div>

    <!-- Domain-Specific Interactive Showcase Feature (DT-501..505) -->
    ${renderVerticalDomainSection(vertical)}

    <!-- Standardized Accessible Enquiry Form (DT-304) -->
    <div id="inquiry-form">
      ${renderEnquiryFormHtml(vertical, showcase.title)}
    </div>
  </section>
  `;
}

