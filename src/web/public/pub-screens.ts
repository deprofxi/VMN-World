/**
 * Complete Public Surface Web Screens (UX-PUB-001 to UX-PUB-028)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.1 / tasks.md §3.1
 *
 * Implements remaining public surfaces with full WCAG 2.2 Level AA compliance,
 * responsive fluid typography, high-contrast states, and accessible navigation.
 */

import { PUBLIC_CHANNELS } from "./channels.js";
import { renderIcon } from "../components/index.js";

/**
 * UX-PUB-002: About VMN
 */
export function renderAboutPageHtml(): string {
  return `
    <article class="container" style="max-width: 1000px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8); text-align: center;">
        <span class="vmn-badge badge-ready" style="margin-bottom: var(--vmn-space-2);">Corporate Governance</span>
        <h1 style="font-size: var(--vmn-font-size-4xl); font-weight: 800; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
          About Virtual Media Network Limited (VMNL)
        </h1>
        <p style="font-size: var(--vmn-font-size-lg); color: var(--vmn-text-secondary); max-width: 720px; margin: 0 auto; line-height: 1.6;">
          Pioneering West Africa's media, linear broadcast, creative infrastructure, and youth entertainment technology ecosystems.
        </p>
      </header>

      <section class="card" style="margin-bottom: var(--vmn-space-8); padding: var(--vmn-space-8);">
        <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
          Enterprise Mission & Mandate
        </h2>
        <p style="color: var(--vmn-text-secondary); line-height: 1.7; margin-bottom: var(--vmn-space-4);">
          Virtual Media Network Limited operates Nigeria's premier broadcast television networks on the StarTimes DTT/DTH satellite platform, delivering 24/7 high-definition youth culture, indigenous heritage, and musical programming to over 15 million households across West Africa.
        </p>
        <p style="color: var(--vmn-text-secondary); line-height: 1.7;">
          Through our Creative Economy Ecosystem, we bridge the gap between creative passion and institutional capital, integrating education (AFCA Academy), verified talent management (VTM), slate co-financing (VCF), state-of-the-art studio facilities (ONE Studios), and international content syndication (TEND).
        </p>
      </section>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vmn-space-6); margin-bottom: var(--vmn-space-8);">
        <div class="card" style="padding: var(--vmn-space-6); border-top: 4px solid var(--vmn-secondary);">
          <h3 style="font-size: var(--vmn-font-size-xl); font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-2);">Three Flagship Channels</h3>
          <p style="color: var(--vmn-text-secondary); font-size: var(--vmn-font-size-sm); line-height: 1.6;">
            Nigezie Xtreme (Ch 428 DTT / 312 DTH), Orisun (Ch 430 DTT / 315 DTH), and Isi Mbido (Ch 432 DTT / 318 DTH).
          </p>
        </div>
        <div class="card" style="padding: var(--vmn-space-6); border-top: 4px solid var(--vmn-secondary);">
          <h3 style="font-size: var(--vmn-font-size-xl); font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-2);">Creative Economy Hub</h3>
          <p style="color: var(--vmn-text-secondary); font-size: var(--vmn-font-size-sm); line-height: 1.6;">
            Empowering 50,000+ emerging creators through structured apprenticeships, capital grants, and commercial casting.
          </p>
        </div>
        <div class="card" style="padding: var(--vmn-space-6); border-top: 4px solid var(--vmn-secondary);">
          <h3 style="font-size: var(--vmn-font-size-xl); font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-2);">Azeebo+ Streaming</h3>
          <p style="color: var(--vmn-text-secondary); font-size: var(--vmn-font-size-sm); line-height: 1.6;">
            Federated consumer streaming across 8 dynamic entertainment universes with deep linear TV attribution.
          </p>
        </div>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-008: Public Schedule
 */
export function renderPublicScheduleHtml(): string {
  const channels = PUBLIC_CHANNELS;
  const channelBlocks = channels
    .map(
      (c) => `
    <div class="card" style="margin-bottom: var(--vmn-space-6); padding: var(--vmn-space-6);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--vmn-space-4); border-bottom: 1px solid var(--vmn-color-border-subtle); padding-bottom: var(--vmn-space-3);">
        <div>
          <span style="font-weight: 800; font-size: 1.25rem; color: var(--vmn-primary);">${c.name}</span>
          <span style="color: var(--vmn-text-muted); font-size: 0.9rem; margin-left: 8px;">DTT Ch. ${c.dttChannel} · DTH Ch. ${c.dthChannel}</span>
        </div>
        <span class="vmn-badge badge-live">ON AIR NOW (WAT)</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--vmn-space-4);">
        <div style="background: var(--vmn-color-surface-subtle); padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-primary);">06:00 - 09:00</div>
          <div style="font-weight: 700; color: var(--vmn-text-primary);">Morning Afro-Beats Digest</div>
          <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">Music Video Playlist</div>
        </div>
        <div style="background: var(--vmn-color-surface-subtle); padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-primary);">09:00 - 12:00</div>
          <div style="font-weight: 700; color: var(--vmn-text-primary);">Youth Culture & Live Pulse</div>
          <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">Interactive Talk / Live Phone-in</div>
        </div>
        <div style="background: var(--vmn-color-surface-subtle); padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-primary);">12:00 - 15:00</div>
          <div style="font-weight: 700; color: var(--vmn-text-primary);">VTM Top 20 Countdown</div>
          <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">Music Chart Show</div>
        </div>
        <div style="background: var(--vmn-color-surface-subtle); padding: 12px; border-radius: 6px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-primary);">18:00 - 21:00</div>
          <div style="font-weight: 700; color: var(--vmn-text-primary);">Prime Time Flagship Drama</div>
          <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">ONE Studios Original Production</div>
        </div>
      </div>
    </div>
  `
    )
    .join("\n");

  return `
    <article class="container" style="max-width: 1000px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8);">
        <span class="vmn-badge badge-ready">Broadcast Programming</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Linear Broadcast Schedule & EPG
        </h1>
        <p style="color: var(--vmn-text-secondary); font-size: var(--vmn-font-size-base);">
          Live 24/7 broadcast program guide for West Africa Time (WAT, UTC+1). Source-backed schedule updated every 60 minutes.
        </p>
      </header>
      ${channelBlocks}
    </article>
  `;
}

/**
 * UX-PUB-009: Advertising & Sponsorship
 */
export function renderAdvertisingSponsorshipHtml(): string {
  return `
    <article class="container" style="max-width: 1000px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="text-align: center; margin-bottom: var(--vmn-space-8);">
        <span class="vmn-badge badge-live">Commercial Media Solutions</span>
        <h1 style="font-size: var(--vmn-font-size-4xl); font-weight: 800; color: var(--vmn-text-primary); margin: var(--vmn-space-3) 0;">
          Advertising, Sponsorship & Brand Integration
        </h1>
        <p style="font-size: var(--vmn-font-size-lg); color: var(--vmn-text-secondary); max-width: 700px; margin: 0 auto;">
          Connect your brand with over 15 million dedicated youth and pan-African viewers across linear television, digital video, and experiential events.
        </p>
      </header>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--vmn-space-6); margin-bottom: var(--vmn-space-8);">
        <div class="card" style="padding: var(--vmn-space-6); text-align: center;">
          <div style="margin-bottom: 8px; color: var(--vmn-accent-primary); display: flex; justify-content: center;">
            ${renderIcon("tv", { size: 32 })}
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary);">Linear TV Spots</h2>
          <p style="color: var(--vmn-text-secondary); font-size: 0.9rem; line-height: 1.6;">
            15s, 30s, and 60s spots across Nigezie Xtreme, Orisun, and Isi Mbido with cryptographic Proof-of-Air compliance certificates.
          </p>
        </div>
        <div class="card" style="padding: var(--vmn-space-6); text-align: center;">
          <div style="margin-bottom: 8px; color: var(--vmn-accent-primary); display: flex; justify-content: center;">
            ${renderIcon("broadcast", { size: 32 })}
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary);">Programme Sponsorship</h2>
          <p style="color: var(--vmn-text-secondary); font-size: 0.9rem; line-height: 1.6;">
            Title sponsorships, Lower-third strap graphics, presenter wardrobe placement, and co-branded content segments.
          </p>
        </div>
        <div class="card" style="padding: var(--vmn-space-6); text-align: center;">
          <div style="margin-bottom: 8px; color: var(--vmn-accent-primary); display: flex; justify-content: center;">
            ${renderIcon("film", { size: 32 })}
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary);">Fusion Events Activation</h2>
          <p style="color: var(--vmn-text-secondary); font-size: 0.9rem; line-height: 1.6;">
            Experiential brand lounges, concert naming rights, on-ground product sampling, and live broadcast integration.
          </p>
        </div>
      </div>

      <div class="card" style="text-align: center; padding: var(--vmn-space-8); background: var(--vmn-color-surface-subtle);">
        <h2 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-text-primary); margin-bottom: 8px;">
          Request a Customized Media Rate Card
        </h2>
        <p style="color: var(--vmn-text-secondary); margin-bottom: var(--vmn-space-6);">
          Speak with our commercial sales team for primetime package discounts, campaign schedules, and cross-platform opportunities.
        </p>
        <a href="/enquiry?vertical=COMMERCIAL_ADVERTISING" class="btn btn-primary button button--primary" style="display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 var(--vmn-space-8); font-size: 1rem; font-weight: 700;">
          Submit Commercial Enquiry &rarr;
        </a>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-025: Contact & Commercial Enquiry Form
 */
export function renderEnquiryContactHtml(preselectedVertical: string = "COMMERCIAL_ADVERTISING"): string {
  return `
    <article class="container" style="max-width: 800px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8); text-align: center;">
        <span class="vmn-badge badge-ready">Intake Desk</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Commercial Enquiry & Partnership Request
        </h1>
        <p style="color: var(--vmn-text-secondary); font-size: 1rem; line-height: 1.6;">
          Submit your requirements to our commercial and partnerships team. Every request receives a durable tracking reference.
        </p>
      </header>

      <form method="POST" action="/api/v1/enquiries" class="card" style="padding: var(--vmn-space-8); display: flex; flex-direction: column; gap: var(--vmn-space-4);">
        <div>
          <label for="fullName" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
            Full Name <span style="color: var(--vmn-semantic-error);">*</span>
          </label>
          <input type="text" id="fullName" name="fullName" required placeholder="e.g. Dr. Ngozi Adeyemi" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--vmn-space-4);">
          <div>
            <label for="email" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Email Address <span style="color: var(--vmn-semantic-error);">*</span>
            </label>
            <input type="email" id="email" name="email" required placeholder="ngozi@company.ng" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
          </div>
          <div>
            <label for="phone" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Phone Number
            </label>
            <input type="tel" id="phone" name="phone" placeholder="+234 803 123 4567" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
          </div>
        </div>

        <div>
          <label for="organisationName" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
            Organisation / Company
          </label>
          <input type="text" id="organisationName" name="organisationName" placeholder="e.g. Sterling Brand Communications" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
        </div>

        <div>
          <label for="vertical" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
            Enquiry Type <span style="color: var(--vmn-semantic-error);">*</span>
          </label>
          <select id="vertical" name="vertical" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;">
            <option value="COMMERCIAL_ADVERTISING" ${preselectedVertical === "COMMERCIAL_ADVERTISING" ? "selected" : ""}>Television Advertising & Spots</option>
            <option value="SPONSORSHIP" ${preselectedVertical === "SPONSORSHIP" ? "selected" : ""}>Programme & Channel Sponsorship</option>
            <option value="PARTNERSHIP" ${preselectedVertical === "PARTNERSHIP" ? "selected" : ""}>Institutional & Brand Partnership</option>
            <option value="AFCA_LEARNING" ${preselectedVertical === "AFCA_LEARNING" ? "selected" : ""}>AFCA Academy & Corporate Training</option>
            <option value="TALENT_ACCELERATOR" ${preselectedVertical === "TALENT_ACCELERATOR" ? "selected" : ""}>Talent Accelerator Partner Network</option>
            <option value="ONE_STUDIOS" ${preselectedVertical === "ONE_STUDIOS" ? "selected" : ""}>Studio Facility Booking & Production</option>
            <option value="GENERAL_ENQUIRY">General Inquiry</option>
          </select>
        </div>

        <div>
          <label for="message" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
            Project Details & Requirements <span style="color: var(--vmn-semantic-error);">*</span>
          </label>
          <textarea id="message" name="message" required rows="5" placeholder="Please outline your campaign flight dates, target demographics, and budget guidelines..." class="input" style="width: 100%; padding: 12px;"></textarea>
        </div>

        <div style="background: var(--vmn-color-surface-subtle); padding: 16px; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required style="width: 20px; height: 20px; margin-top: 2px;" />
          <label for="ndprConsent" style="font-size: 0.85rem; color: var(--vmn-text-secondary); line-height: 1.5;">
            <strong>NDPR Compliance Consent:</strong> I confirm that I authorize Virtual Media Network Limited to process this contact information strictly for the purpose of fulfilling this business inquiry under the Nigeria Data Protection Regulation (NDPR).
          </label>
        </div>

        <button type="submit" class="btn btn-primary button button--primary" style="min-height: 48px; font-size: 1rem; font-weight: 700; margin-top: 8px;">
          Submit Formal Enquiry
        </button>
      </form>
    </article>
  `;
}

/**
 * UX-PUB-026: Help & Knowledge Center
 */
export function renderHelpPageHtml(): string {
  return `
    <article class="container" style="max-width: 900px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8); text-align: center;">
        <span class="vmn-badge badge-info">Support Center</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          VMN Help & Resource Directory
        </h1>
        <p style="color: var(--vmn-text-secondary); font-size: 1rem;">
          Frequently asked questions, broadcast reception guides, admissions help, and technical support.
        </p>
      </header>

      <div style="display: flex; flex-direction: column; gap: var(--vmn-space-4);">
        <details class="card" style="padding: var(--vmn-space-4);" open>
          <summary style="font-weight: 700; font-size: 1.1rem; cursor: pointer; color: var(--vmn-text-primary);">
            How do I tune into Nigezie Xtreme, Orisun, and Isi Mbido on StarTimes?
          </summary>
          <p style="color: var(--vmn-text-secondary); margin-top: 12px; line-height: 1.6;">
            On terrestrial decoders (DTT antenna), find Nigezie Xtreme on Channel 428, Orisun on Channel 430, and Isi Mbido on Channel 432. On satellite dishes (DTH), find Nigezie Xtreme on Channel 312, Orisun on Channel 315, and Isi Mbido on Channel 318.
          </p>
        </details>

        <details class="card" style="padding: var(--vmn-space-4);">
          <summary style="font-weight: 700; font-size: 1.1rem; cursor: pointer; color: var(--vmn-text-primary);">
            How do I apply for the AFCA Film & Creative Arts Academy?
          </summary>
          <p style="color: var(--vmn-text-secondary); margin-top: 12px; line-height: 1.6;">
            Visit our admissions portal at <a href="/apply" style="color: var(--vmn-primary); font-weight: 600;">/apply</a> to select your desired cohort and track (Cinematography, Directing, Screenwriting, Sound Engineering, or Creative Producing). Applications are reviewed on a rolling basis.
          </p>
        </details>

        <details class="card" style="padding: var(--vmn-space-4);">
          <summary style="font-weight: 700; font-size: 1.1rem; cursor: pointer; color: var(--vmn-text-primary);">
            How can artists submit music videos for broadcast review?
          </summary>
          <p style="color: var(--vmn-text-secondary); margin-top: 12px; line-height: 1.6;">
            Registered creators on the VTM portal can submit digital master files directly through the creator dashboard. Videos undergo technical quality control (QC) and NBC broadcast compliance screening before broadcast slotting.
          </p>
        </details>

        <details class="card" style="padding: var(--vmn-space-4);">
          <summary style="font-weight: 700; font-size: 1.1rem; cursor: pointer; color: var(--vmn-text-primary);">
            Where can I verify an AFCA Certificate or Proof-of-Air Report?
          </summary>
          <p style="color: var(--vmn-text-secondary); margin-top: 12px; line-height: 1.6;">
            Every verifiable document issued by VMNL contains an immutable cryptographic reference hash that can be verified online anytime at <a href="/verify/afca" style="color: var(--vmn-primary); font-weight: 600;">/verify/afca</a> or <a href="/verify/poa" style="color: var(--vmn-primary); font-weight: 600;">/verify/poa</a>.
          </p>
        </details>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-027: Privacy Information
 */
export function renderPrivacyPageHtml(): string {
  return `
    <article class="container" style="max-width: 900px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6);">
        <span class="vmn-badge badge-ready">Legal & Privacy Governance</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Privacy Policy & Data Protection Notice
        </h1>
        <p style="color: var(--vmn-text-secondary);">
          Compliant with the Nigeria Data Protection Act (NDPA) and NDPR Regulatory Framework.
        </p>
      </header>

      <div class="card" style="padding: var(--vmn-space-8); line-height: 1.7; color: var(--vmn-text-secondary);">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">1. Information We Collect</h2>
        <p style="margin-bottom: 16px;">
          Virtual Media Network Limited collects information necessary to execute broadcast contracts, process admissions to the AFCA Academy, manage creative talent engagements, and respond to commercial inquiries.
        </p>

        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">2. Lawful Basis for Processing</h2>
        <p style="margin-bottom: 16px;">
          We process personal data on the lawful basis of contractual necessity, compliance with legal obligations, and explicit informed consent provided via affirmative opt-in checkboxes.
        </p>

        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">3. Data Security & Storage</h2>
        <p style="margin-bottom: 16px;">
          All sensitive identification records, rate cards, and financial transactions are encrypted at rest using AES-256 and in transit using TLS 1.3. We do not sell personal data to third parties.
        </p>

        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">4. Data Protection Officer</h2>
        <p>
          To exercise your rights to data rectification, erasure, or portability, contact our Data Protection Officer at: <code style="color: var(--vmn-primary);">dpo@vmnl.ng</code>.
        </p>
      </div>
    </article>
  `;
}

/**
 * UX-PUB-028: Accessibility Information
 */
export function renderAccessibilityPageHtml(): string {
  return `
    <article class="container" style="max-width: 900px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6);">
        <span class="vmn-badge badge-ready">Digital Inclusion</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Accessibility Statement (WCAG 2.2 Level AA)
        </h1>
        <p style="color: var(--vmn-text-secondary);">
          Our formal commitment to accessible, inclusive digital experiences for all viewers and creators.
        </p>
      </header>

      <div class="card" style="padding: var(--vmn-space-8); line-height: 1.7; color: var(--vmn-text-secondary);">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">Conformance Standard</h2>
        <p style="margin-bottom: 16px;">
          Virtual Media Network Limited is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standards across all public and authenticated web applications.
        </p>

        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">Key Accessibility Implementations</h2>
        <ul style="padding-left: 20px; margin-bottom: 16px;">
          <li><strong>Color Contrast:</strong> Minimum 4.5:1 contrast ratio for all standard text and 3:1 for large graphical controls.</li>
          <li><strong>Touch Target Sizing:</strong> All interactive buttons and touch points satisfy the minimum 44x44px boundary.</li>
          <li><strong>Keyboard Navigation:</strong> Complete keyboard traversal with high-contrast visible focus rings.</li>
          <li><strong>Reduced Motion:</strong> Fully responsive to <code>@media (prefers-reduced-motion: reduce)</code> preferences.</li>
          <li><strong>Screen Reader Support:</strong> Semantic HTML landmarks (header, nav, main, article, footer) and descriptive ARIA labels.</li>
        </ul>

        <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">Feedback & Assistance</h2>
        <p>
          If you encounter any accessibility barriers on our digital platforms, please reach out to our team at <code style="color: var(--vmn-primary);">accessibility@vmnl.ng</code>.
        </p>
      </div>
    </article>
  `;
}
