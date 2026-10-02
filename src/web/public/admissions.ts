/**
 * AFCA Admissions Screen Views (UX-APP-001 to UX-APP-008)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.3 / tasks.md Phase 5
 *
 * Implements applicant submission workspace, tracking status screen,
 * and staff admissions review queue with full WCAG 2.2 Level AA conformance.
 */

import { renderIcon } from "../components/index.js";
import { ApplicationSubmission } from "../../modules/hub/afca/admissions.js";

/**
 * UX-APP-001 to 005: Multi-step Application Flow
 */
export function renderAdmissionsApplicationHtml(initialTrack?: string): string {
  const tracks = [
    { id: "CINEMATOGRAPHY", name: "Cinematography & Lighting", duration: "12 Months", badge: "Accredited" },
    { id: "DIRECTING", name: "Film Directing & Storytelling", duration: "12 Months", badge: "Accredited" },
    { id: "SCREENWRITING", name: "Screenwriting & Narrative Dev", duration: "9 Months", badge: "Intensive" },
    { id: "SOUND_ENGINEERING", name: "Sound Design & Audio Post", duration: "9 Months", badge: "Practical" },
    { id: "CREATIVE_PRODUCING", name: "Creative Producing & Finance", duration: "12 Months", badge: "Executive" },
    { id: "ANIMATION_VFX", name: "3D Animation & Visual Effects", duration: "12 Months", badge: "Technical" },
  ];

  const trackCards = tracks
    .map(
      (t) => `
      <label class="card" style="display: block; cursor: pointer; padding: var(--vmn-space-4); border: 2px solid ${initialTrack === t.id ? "var(--vmn-primary)" : "var(--vmn-color-border-subtle)"}; position: relative;">
        <input type="radio" name="creativeTrack" value="${t.id}" ${initialTrack === t.id || (!initialTrack && t.id === "CINEMATOGRAPHY") ? "checked" : ""} style="position: absolute; opacity: 0;" />
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="font-weight: 700; color: var(--vmn-text-primary); font-size: 1rem;">${t.name}</span>
          <span class="vmn-badge badge-ready" style="font-size: 0.75rem;">${t.badge}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--vmn-text-secondary); display: flex; align-items: center; gap: 6px;">
          ${renderIcon("clock", { size: 14 })}
          <span>Duration: ${t.duration}</span>
        </div>
      </label>
    `
    )
    .join("\n");

  return `
    <article class="container" style="max-width: 900px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8); text-align: center;">
        <span class="vmn-badge badge-ready">AFCA Academy Cohort Admissions</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin: var(--vmn-space-3) 0;">
          Learner Application & Creative Portfolio
        </h1>
        <p style="color: var(--vmn-text-secondary); font-size: 1rem; max-width: 650px; margin: 0 auto;">
          Step into professional African cinema and television production. Complete your application dossier below.
        </p>
      </header>

      <!-- Step Progress Bar -->
      <nav aria-label="Application Progress" style="display: flex; justify-content: space-between; margin-bottom: var(--vmn-space-8); background: var(--vmn-color-surface-subtle); padding: 12px 24px; border-radius: 8px;">
        <div style="font-weight: 700; color: var(--vmn-primary); display: flex; align-items: center; gap: 8px;">
          ${renderIcon("check", { size: 16 })}
          <span>1. Track Selection</span>
        </div>
        <div style="font-weight: 700; color: var(--vmn-primary); display: flex; align-items: center; gap: 8px;">
          ${renderIcon("check", { size: 16 })}
          <span>2. Bio & Experience</span>
        </div>
        <div style="font-weight: 700; color: var(--vmn-primary); display: flex; align-items: center; gap: 8px;">
          ${renderIcon("check", { size: 16 })}
          <span>3. Portfolio</span>
        </div>
        <div style="font-weight: 700; color: var(--vmn-primary); display: flex; align-items: center; gap: 8px;">
          ${renderIcon("check", { size: 16 })}
          <span>4. Review & Submit</span>
        </div>
      </nav>

      <form method="POST" action="/api/v1/applications/submit" class="card" style="padding: var(--vmn-space-8); display: flex; flex-direction: column; gap: var(--vmn-space-6);">
        <fieldset style="border: none; padding: 0; margin: 0;">
          <legend style="font-weight: 700; font-size: 1.25rem; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
            Step 1: Choose Your Creative Specialization
          </legend>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--vmn-space-4);">
            ${trackCards}
          </div>
        </fieldset>

        <fieldset style="border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--vmn-space-4);">
          <legend style="font-weight: 700; font-size: 1.25rem; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
            Step 2: Personal Profile & Background
          </legend>

          <div>
            <label for="fullName" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Full Legal Name <span style="color: var(--vmn-semantic-error);">*</span>
            </label>
            <input type="text" id="fullName" name="fullName" required placeholder="e.g. Babatunde Olumide" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--vmn-space-4);">
            <div>
              <label for="email" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
                Email Address <span style="color: var(--vmn-semantic-error);">*</span>
              </label>
              <input type="email" id="email" name="email" required placeholder="babatunde@creative.ng" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
            </div>
            <div>
              <label for="phone" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
                Phone Number
              </label>
              <input type="tel" id="phone" name="phone" placeholder="+234 802 345 6789" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
            </div>
          </div>

          <div>
            <label for="experienceLevel" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Current Experience Level
            </label>
            <select id="experienceLevel" name="experienceLevel" class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;">
              <option value="BEGINNER">Beginner (Foundational passion, no formal credit)</option>
              <option value="INTERMEDIATE" selected>Intermediate (1-3 short films or crew credits)</option>
              <option value="ADVANCED">Advanced (Industry professional seeking masterclass)</option>
            </select>
          </div>
        </fieldset>

        <fieldset style="border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--vmn-space-4);">
          <legend style="font-weight: 700; font-size: 1.25rem; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
            Step 3: Creative Portfolio & Vision
          </legend>

          <div>
            <label for="portfolioUrl" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Portfolio / Showreel URL (YouTube, Vimeo, Google Drive, Behance)
            </label>
            <input type="url" id="portfolioUrl" name="portfolioUrl" placeholder="https://vimeo.com/showreel/..." class="input" style="width: 100%; min-height: 44px; padding: 8px 12px;" />
          </div>

          <div>
            <label for="statementOfIntent" style="display: block; font-weight: 700; margin-bottom: 6px; color: var(--vmn-text-primary);">
              Statement of Creative Intent <span style="color: var(--vmn-semantic-error);">*</span>
            </label>
            <textarea id="statementOfIntent" name="statementOfIntent" required rows="5" placeholder="Describe the stories you want to tell and why AFCA Academy is your chosen institution..." class="input" style="width: 100%; padding: 12px;"></textarea>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="financialAidRequested" name="financialAidRequested" value="true" style="width: 20px; height: 20px;" />
            <label for="financialAidRequested" style="font-size: 0.9rem; color: var(--vmn-text-primary);">
              I wish to be considered for AFCA Tuition Merit Grants & Industry Sponsorships.
            </label>
          </div>
        </fieldset>

        <div style="background: var(--vmn-color-surface-subtle); padding: 16px; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px;">
          <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required style="width: 20px; height: 20px; margin-top: 2px;" />
          <label for="ndprConsent" style="font-size: 0.85rem; color: var(--vmn-text-secondary); line-height: 1.5;">
            <strong>Affirmation & Data Consent:</strong> I certify that all artistic submissions and academic statements are my authentic work. I authorize VMNL/AFCA to review these materials for admission purposes under the NDPA/NDPR.
          </label>
        </div>

        <button type="submit" class="btn btn-primary button button--primary" style="min-height: 48px; font-size: 1rem; font-weight: 700;">
          Submit Application Dossier
        </button>
      </form>
    </article>
  `;
}

/**
 * UX-APP-006: Application Confirmation & Status Tracker
 */
export function renderApplicationStatusHtml(app: ApplicationSubmission | null, queryRef?: string): string {
  if (!app) {
    return `
      <article class="container" style="max-width: 600px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4); text-align: center;">
        <span class="vmn-badge badge-warning" style="margin-bottom: 8px;">Status Tracker</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-text-primary); margin-bottom: 12px;">
          Application Not Found
        </h1>
        <p style="color: var(--vmn-text-secondary); margin-bottom: 24px;">
          We could not locate an active admission record for reference: <code>${queryRef || "Unknown"}</code>.
        </p>
        <a href="/apply" class="btn btn-primary button button--primary" style="min-height: 44px; display: inline-flex; align-items: center; justify-content: center;">
          Start New Application
        </a>
      </article>
    `;
  }

  const badgeClass =
    app.status === "ACCEPTED"
      ? "badge-ready"
      : app.status === "REJECTED"
      ? "badge-danger"
      : app.status === "CHANGES_REQUESTED"
      ? "badge-warning"
      : "badge-live";

  return `
    <article class="container" style="max-width: 750px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6); text-align: center;">
        <span class="vmn-badge ${badgeClass}">${app.status}</span>
        <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
          Application Status: ${app.reference}
        </h1>
        <p style="color: var(--vmn-text-secondary);">
          Submitted on ${new Date(app.submittedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
        </p>
      </header>

      <div class="card" style="padding: var(--vmn-space-6); margin-bottom: var(--vmn-space-6);">
        <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 16px; border-bottom: 1px solid var(--vmn-color-border-subtle); padding-bottom: 8px;">
          Applicant Summary
        </h2>
        <dl style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin: 0; font-size: 0.95rem;">
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Applicant:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0;">${app.fullName}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Track:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0; font-weight: 600;">${app.creativeTrack}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Email:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0;">${app.email}</dd>
          <dt style="font-weight: 700; color: var(--vmn-text-secondary);">Financial Aid:</dt>
          <dd style="color: var(--vmn-text-primary); margin: 0;">${app.financialAidRequested ? "Grant Consideration Requested" : "Self-Funded"}</dd>
        </dl>
      </div>

      ${
        app.reviewerNotes
          ? `
        <div class="card" style="padding: var(--vmn-space-6); background: var(--vmn-color-surface-subtle); border-left: 4px solid var(--vmn-primary);">
          <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: 8px;">
            Admissions Committee Notice
          </h2>
          <p style="color: var(--vmn-text-secondary); line-height: 1.6; margin: 0;">
            ${app.reviewerNotes}
          </p>
        </div>
      `
          : `
        <div class="card" style="padding: var(--vmn-space-6); text-align: center; color: var(--vmn-text-secondary);">
          <p style="margin: 0;">Your submission is under technical review by the AFCA Academic Board. Estimated review time is 3-5 business days.</p>
        </div>
      `
      }
    </article>
  `;
}

/**
 * UX-APP-007: Admissions Staff Review Queue
 */
export function renderAdmissionsQueueHtml(applications: ApplicationSubmission[]): string {
  const rows = applications
    .map(
      (a) => `
    <tr style="border-bottom: 1px solid var(--vmn-color-border-subtle);">
      <td style="padding: 12px; font-weight: 700;">
        <a href="/admissions/review/${a.reference}" style="color: var(--vmn-primary); text-decoration: none;">
          ${a.reference}
        </a>
      </td>
      <td style="padding: 12px; color: var(--vmn-text-primary); font-weight: 600;">${a.fullName}</td>
      <td style="padding: 12px; color: var(--vmn-text-secondary);">${a.creativeTrack}</td>
      <td style="padding: 12px;">
        <span class="vmn-badge ${a.status === "ACCEPTED" ? "badge-ready" : a.status === "REJECTED" ? "badge-danger" : "badge-live"}">
          ${a.status}
        </span>
      </td>
      <td style="padding: 12px; color: var(--vmn-text-muted); font-size: 0.85rem;">
        ${new Date(a.submittedAt).toLocaleDateString("en-GB")}
      </td>
      <td style="padding: 12px; text-align: right;">
        <a href="/admissions/review/${a.reference}" class="btn btn-secondary button button--secondary" style="min-height: 44px; padding: 8px 14px; font-size: 0.85rem; display: inline-flex; align-items: center; justify-content: center;">
          Assess Dossier
        </a>
      </td>
    </tr>
  `
    )
    .join("\n");

  return `
    <article class="container" style="max-width: 1200px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6); display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span class="vmn-badge badge-ready">Academic Governance</span>
          <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
            AFCA Admissions Evaluation Queue
          </h1>
          <p style="color: var(--vmn-text-secondary); margin: 0;">
            Review incoming learner portfolios, assign rubric scores, and record admission outcomes.
          </p>
        </div>
        <div style="font-weight: 700; color: var(--vmn-primary);">
          ${applications.length} Submissions Active
        </div>
      </header>

      <div class="card" style="padding: 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: var(--vmn-color-surface-subtle); border-bottom: 2px solid var(--vmn-color-border-subtle); color: var(--vmn-text-secondary);">
              <th style="padding: 12px;">Reference</th>
              <th style="padding: 12px;">Applicant</th>
              <th style="padding: 12px;">Track</th>
              <th style="padding: 12px;">Status</th>
              <th style="padding: 12px;">Submitted</th>
              <th style="padding: 12px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="6" style="padding: 32px; text-align: center; color: var(--vmn-text-muted);">No applications currently pending evaluation.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>
  `;
}
