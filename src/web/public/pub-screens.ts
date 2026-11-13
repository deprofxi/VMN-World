/**
 * Complete Public Surface Web Screens (UX-PUB-001 to UX-PUB-028)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.1 / tasks.md §3.1
 *
 * Implements public surfaces with accessibility-minded markup; conformance requires
 * verification against the rendered experience and is not claimed by this module.
 */

import { PUBLIC_CHANNELS } from "./channels.js";
import { renderIcon, renderEpisodeMasterSummaryHtml } from "../components/index.js";
import { listEpisodeMasters } from "../../modules/broadcast/episode-masters.js";

/**
 * UX-PUB-002: About VMN
 */
export function renderAboutPageHtml(): string {
  return `
 <article class="container s-2nHGlX-U0t" >
 <header class="s-2udxTC4LQH">
 <span class="vmn-badge badge-ready s-tPnc4j8Rfj" >Corporate Governance</span>
 <h1 class="s-7wOXUA0Lid">
          About Virtual Media Network Limited (VMNL)
        </h1>
 <p class="s-K0k-rvOz9S">
          A media company with public profiles for linear channels and proposed creative-economy programme areas. Operational reach and service availability require verification.
        </p>
      </header>

 <section class="card s-Kk_TX9a-yW" >
 <h2 class="s-y7lMjPUysy">
          Enterprise Mission & Mandate
        </h2>
 <p class="s-gLpm1d0BEF">
          Virtual Media Network Limited develops linear channel profiles, creative infrastructure, and media services. Carriage, audience reach, and live transmission claims require independent verification.
        </p>
 <p class="s-RStw7YfZ3A">
          The Creative Economy Hub describes potential areas including learning, talent, production, funding, events, and distribution enquiries. Accreditation, talent verification, funding, facilities, rights, and service availability are not established by this page.
        </p>
      </section>

 <div class="s-bjVu6Z7Rt5">
 <div class="card s-PCC97mWQBM" >
 <h3 class="s-wIa9aAsAdX">Three Flagship Channels</h3>
 <p class="s-3R0tLWTHcB">
            Nigezie Xtreme, Orisun, and Isi Mbido. Carriage numbers and transmission status are not asserted here.
          </p>
        </div>
 <div class="card s-PCC97mWQBM" >
 <h3 class="s-wIa9aAsAdX">Creative Economy Hub</h3>
 <p class="s-3R0tLWTHcB">
            Creative-economy programmes and opportunities are described in this prototype; participation, grants, placements, and reach are not verified here.
          </p>
        </div>
 <div class="card s-PCC97mWQBM" >
 <h3 class="s-wIa9aAsAdX">Azeebo+ Streaming</h3>
 <p class="s-3R0tLWTHcB">
            Azeebo+ is a federated service. Availability, catalogues, and audience attribution depend on its separately operated systems.
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
 <div class="card s-aOQEhVcQ_B" >
 <div class="s-Kgr3QucRG7">
        <div>
 <span class="s-qNsmp8l7l6">${c.name}</span>
 <span class="s-hVWSD2LpPP">${c.isProvisional ? "Carriage details unverified" : `DTT Ch. ${c.dttChannel ?? "—"} · DTH Ch. ${c.dthChannel ?? "—"}`}</span>
        </div>
        <span class="vmn-badge badge-info">Schedule not verified</span>
      </div>
 <div class="card" role="note" >
        No approved, source-backed schedule is connected. Programme entries are not published as operational listings.
      </div>
      ${renderEpisodeMasterSummaryHtml(listEpisodeMasters(c.code))}
    </div>
  `
    )
    .join("\n");

  return `
 <article class="container s-2nHGlX-U0t" >
 <header class="s-8KqcJvoCxL">
        <span class="vmn-badge badge-ready">Broadcast Programming</span>
 <h1 class="s-yrxYod1Dke">
          Linear Broadcast Schedule & EPG
        </h1>
 <p class="s-_Ozz6dYSwY">
          Schedule data is shown only when an approved, source-backed programme schedule is available.
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
 <article class="container s-2nHGlX-U0t" >
 <header class="s-LGES5Rz7dF">
        <span class="vmn-badge badge-live">Commercial Media Solutions</span>
 <h1 class="s-gjfPYbnwwq">
          Advertising, Sponsorship & Brand Integration
        </h1>
 <p class="s-tV7d4vigIM">
          Contact the commercial team to discuss potential placements and request current, source-backed reach and terms for your brief.
        </p>
      </header>

 <div class="s-bjVu6Z7Rt5">
 <div class="card s-VXNSD_KFY5" >
 <div class="s-49lsVfsW0o">
            ${renderIcon("tv", { size: 32 })}
          </div>
 <h2 class="s-F_XTn6m8wX">Linear TV Spots</h2>
 <p class="s-iLZxUGepNI">
            Ask the commercial team about availability. Any placement, schedule, carriage, pricing, and proof-of-air terms require confirmation against current records.
          </p>
        </div>
 <div class="card s-VXNSD_KFY5" >
 <div class="s-49lsVfsW0o">
            ${renderIcon("broadcast", { size: 32 })}
          </div>
 <h2 class="s-F_XTn6m8wX">Programme Sponsorship</h2>
 <p class="s-iLZxUGepNI">
            These are illustrative placement categories only. Inventory, schedule, talent participation, rights clearance, and commercial terms require current confirmation.
          </p>
        </div>
 <div class="card s-VXNSD_KFY5" >
 <div class="s-49lsVfsW0o">
            ${renderIcon("film", { size: 32 })}
          </div>
 <h2 class="s-F_XTn6m8wX">Fusion Events Activation</h2>
 <p class="s-iLZxUGepNI">
            These are illustrative activation categories only. Events, venues, naming rights, permissions, and broadcast integration are not confirmed.
          </p>
        </div>
      </div>

 <div class="card s-wpOGH5ukU_" >
 <h2 class="s-DITO9sm-WL">
          Request a Customized Media Rate Card
        </h2>
 <p class="s-z7WHKvYK0h">
          Speak with our commercial sales team for primetime package discounts, campaign schedules, and cross-platform opportunities.
        </p>
 <a href="/enquiry?vertical=COMMERCIAL_ADVERTISING" class="btn btn-primary button button--primary s-1OZuJEopSQ" >
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
 <article class="container s-0VRn54WLCl" >
 <header class="s-2udxTC4LQH">
        <span class="vmn-badge badge-ready">Intake Desk</span>
 <h1 class="s-yrxYod1Dke">
          Commercial Enquiry & Partnership Request
        </h1>
 <p class="s-F2VYtMRxsW">
          Submit an enquiry. Response timing and durable tracking are not guaranteed in this environment; please do not include sensitive personal information.
        </p>
      </header>

 <form method="POST" action="/api/v1/enquiries" class="card s-sqzC72lluV" >
        <div>
 <label for="fullName" class="s-oMHwiwajnC">
 Full Name <span class="s-R3NEaqY8J-">*</span>
          </label>
 <input type="text" id="fullName" name="fullName" required placeholder="e.g. Dr. Ngozi Adeyemi" class="input s-UPrN9pHjcM" />
        </div>

 <div class="s-ZINITLBrbS">
          <div>
 <label for="email" class="s-oMHwiwajnC">
 Email Address <span class="s-R3NEaqY8J-">*</span>
            </label>
 <input type="email" id="email" name="email" required placeholder="ngozi@company.ng" class="input s-UPrN9pHjcM" />
          </div>
          <div>
 <label for="phone" class="s-oMHwiwajnC">
              Phone Number
            </label>
 <input type="tel" id="phone" name="phone" placeholder="+234 803 123 4567" class="input s-UPrN9pHjcM" />
          </div>
        </div>

        <div>
 <label for="organisationName" class="s-oMHwiwajnC">
            Organisation / Company
          </label>
 <input type="text" id="organisationName" name="organisationName" placeholder="e.g. Sterling Brand Communications" class="input s-UPrN9pHjcM" />
        </div>

        <div>
 <label for="vertical" class="s-oMHwiwajnC">
 Enquiry Type <span class="s-R3NEaqY8J-">*</span>
          </label>
 <select id="vertical" name="vertical" class="input s-UPrN9pHjcM" >
            <option value="COMMERCIAL_ADVERTISING" ${preselectedVertical === "COMMERCIAL_ADVERTISING" ? "selected" : ""}>Television Advertising & Spots</option>
            <option value="SPONSORSHIP" ${preselectedVertical === "SPONSORSHIP" ? "selected" : ""}>Programme & Channel Sponsorship</option>
            <option value="PARTNERSHIP" ${preselectedVertical === "PARTNERSHIP" ? "selected" : ""}>Institutional & Brand Partnership</option>
            <option value="AFCA_LEARNING" ${preselectedVertical === "AFCA_LEARNING" ? "selected" : ""}>AFCA Academy & Corporate Training</option>
            <option value="TALENT_ACCELERATOR" ${preselectedVertical === "TALENT_ACCELERATOR" ? "selected" : ""}>Talent Accelerator Partner Network</option>
            <option value="ONE_STUDIOS" ${preselectedVertical === "ONE_STUDIOS" ? "selected" : ""}>Studio Facility Booking & Production</option>
            <option value="GENERAL_ENQUIRY" ${preselectedVertical === "GENERAL_ENQUIRY" ? "selected" : ""}>General Inquiry</option>
          </select>
        </div>

        <div>
 <label for="message" class="s-oMHwiwajnC">
 Project Details & Requirements <span class="s-R3NEaqY8J-">*</span>
          </label>
 <textarea id="message" name="message" required rows="5" placeholder="Please outline your campaign flight dates, target demographics, and budget guidelines..." class="input s-zCt9vSwGkS" ></textarea>
        </div>

 <div class="s-uaYMBvJysP">
 <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required class="s-9Isrvn5gw2" />
 <label for="ndprConsent" class="s-EIgsbg6jRv">
            <strong>Enquiry acknowledgement:</strong> I understand that the information I submit is provided to VMNL for this enquiry. The privacy notice and handling details require review before they can be represented here as complete.
          </label>
        </div>

 <button type="submit" class="btn btn-primary button button--primary s-jZKe1VmC9A" >
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
 <article class="container s-Gq1CYI3m9m" >
 <header class="s-2udxTC4LQH">
        <span class="vmn-badge badge-info">Support Center</span>
 <h1 class="s-yrxYod1Dke">
          VMN Help & Resource Directory
        </h1>
 <p class="s-AuP1EyxEBf">
          Frequently asked questions, broadcast reception guides, admissions help, and technical support.
        </p>
      </header>

 <div class="s-6mqdXZ0QST">
 <details class="card s-njnyYzrM3s" open>
 <summary class="s-nCsaVwVLOM">
            How can I find verified reception and carriage information for VMNL channels?
          </summary>
 <p class="s-WUIZpJO7QW">
            Carriage numbers are not verified in this environment. Please check current information with StarTimes or the broadcaster before tuning.
          </p>
        </details>

 <details class="card s-njnyYzrM3s" >
 <summary class="s-nCsaVwVLOM">
            How do I apply for the AFCA Film & Creative Arts Academy?
          </summary>
 <p class="s-WUIZpJO7QW">
 The <a href="/apply" class="s-cHOzN4N0WC">admissions page</a> provides an enquiry route. Course offerings, cohort availability, application windows, and admission decisions require current confirmation; submitting an enquiry does not guarantee admission.
          </p>
        </details>

 <details class="card s-njnyYzrM3s" >
 <summary class="s-nCsaVwVLOM">
            How can artists submit music videos for broadcast review?
          </summary>
 <p class="s-WUIZpJO7QW">
            A connected creator upload and review workflow is not available from this public site. Ask through the enquiry page about current submission routes; review, rights clearance, regulatory review, and scheduling must not be assumed.
          </p>
        </details>

 <details class="card s-njnyYzrM3s" >
 <summary class="s-nCsaVwVLOM">
            Where can I verify an AFCA Certificate or Proof-of-Air Report?
          </summary>
 <p class="s-WUIZpJO7QW">
 The verification pages report records available in this environment. A hash alone does not establish that a source record, credential, transmission, or underlying evidence is authentic or current. <a href="/verify/afca" class="s-cHOzN4N0WC">/verify/afca</a> and <a href="/verify/poa" class="s-cHOzN4N0WC">/verify/poa</a> are record lookup paths.
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
 <article class="container s-Gq1CYI3m9m" >
 <header class="s-MCZWkljUQG">
        <span class="vmn-badge badge-ready">Legal & Privacy Governance</span>
 <h1 class="s-yrxYod1Dke">
          Privacy Policy & Data Protection Notice
        </h1>
 <p class="s-58Gu8QFAOn">
          This page is a preliminary information surface, not a reviewed privacy notice or a representation of legal compliance. Retention, lawful basis, data-subject processes, and contact details require approval by VMNL's accountable privacy and legal reviewers.
        </p>
      </header>

 <div class="card s-twPUsMLc3n" >
 <h2 class="s-aMXDq93VWh">1. Information We Collect</h2>
 <p class="s-BFqsiZ1_zP">
          The forms on this site may request contact and enquiry information. The purposes, retention periods, recipients, and data-subject process for each workflow have not been confirmed in this page; avoid submitting sensitive personal information until an approved notice is published.
        </p>

 <h2 class="s-aMXDq93VWh">2. Lawful Basis for Processing</h2>
 <p class="s-BFqsiZ1_zP">
          This page does not determine or represent a lawful basis for any processing. That basis and the associated notice require review and approval by VMNL's accountable privacy and legal reviewers.
        </p>

 <h2 class="s-aMXDq93VWh">3. Data Security & Storage</h2>
 <p class="s-BFqsiZ1_zP">
          This page does not make claims about encryption, access controls, data sharing, or security certification. Those controls and any no-sale representation require verification against deployed systems and an approved privacy notice.
        </p>

 <h2 class="s-aMXDq93VWh">4. Data Protection Officer</h2>
        <p>
          A verified privacy contact and complete data-subject request process have not been confirmed for publication. Do not rely on this preliminary page as instructions for exercising privacy rights.
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
 <article class="container s-Gq1CYI3m9m" >
 <header class="s-MCZWkljUQG">
        <span class="vmn-badge badge-ready">Digital Inclusion</span>
 <h1 class="s-yrxYod1Dke">
          Accessibility Statement — Conformance Not Yet Assessed
        </h1>
 <p class="s-58Gu8QFAOn">
          Accessibility is an engineering target. Manual keyboard, screen-reader, mobile, and WCAG 2.2 AA conformance reviews remain outstanding; this page does not claim conformance.
        </p>
      </header>

 <div class="card s-twPUsMLc3n" >
 <h2 class="s-aMXDq93VWh">Conformance Standard</h2>
 <p class="s-BFqsiZ1_zP">
          WCAG 2.2 Level AA is a target, not a verified conformance claim. Coverage across public and authenticated workflows has not been established by a complete manual and assistive-technology assessment.
        </p>

 <h2 class="s-aMXDq93VWh">Key Accessibility Implementations</h2>
 <ul class="s-bG9yzdLYMU">
          <li>Accessibility checks and design tokens exist in parts of the application; they are not evidence that every rendered page or workflow meets a conformance criterion.</li>
          <li>Keyboard-only, screen-reader, contrast, zoom/reflow, and mobile reviews are outstanding and must be completed before a conformance claim is made.</li>
        </ul>

 <h2 class="s-aMXDq93VWh">Feedback & Assistance</h2>
        <p>
 If you encounter any accessibility barriers on our digital platforms, please reach out to our team at <code class="s-FgPBD5MSYz">accessibility@vmnl.ng</code>.
        </p>
      </div>
    </article>
  `;
}
