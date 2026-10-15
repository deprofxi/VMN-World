/**
 * AFCA Admissions Screen Views (UX-APP-001 to UX-APP-008)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.3 / tasks.md Phase 5
 *
 * Implements applicant submission workspace, tracking status screen,
 * and staff admissions review queue; complete WCAG 2.2 AA conformance is not assessed here.
 */

import { renderIcon, escapeHtml } from "../components/index.js";
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
 <input type="radio" name="creativeTrack" value="${t.id}" ${initialTrack === t.id || (!initialTrack && t.id === "CINEMATOGRAPHY") ? "checked" : ""} class="s-aGRs9SMLGj" />
 <div class="s-QBgwgYUD6o">
 <span class="s-nEWyYJ6F8_">${t.name}</span>
 <span class="vmn-badge badge-ready s-orRLFYu8o-" >${t.badge}</span>
        </div>
 <div class="s-WVn6kGOaHQ">
          ${renderIcon("clock", { size: 14 })}
          <span>Duration: ${t.duration}</span>
        </div>
      </label>
    `
    )
    .join("\n");

  return `
 <article class="container s-Gq1CYI3m9m" >
 <header class="s-2udxTC4LQH">
        <span class="vmn-badge badge-ready">AFCA Academy Cohort Admissions</span>
 <h1 class="s-jy1nuvWOw7">
          Learner Application & Creative Portfolio
        </h1>
 <p class="s-vZjt3ceVdI">
          Step into professional African cinema and television production. Complete your application dossier below.
        </p>
      </header>

      <!-- Step Progress Bar -->
 <nav aria-label="Application Progress" class="s-T9-QtvQ2ZE">
 <div class="s-1kbAFK-M4K">
          ${renderIcon("check", { size: 16 })}
          <span>1. Track Selection</span>
        </div>
 <div class="s-1kbAFK-M4K">
          ${renderIcon("check", { size: 16 })}
          <span>2. Bio & Experience</span>
        </div>
 <div class="s-1kbAFK-M4K">
          ${renderIcon("check", { size: 16 })}
          <span>3. Portfolio</span>
        </div>
 <div class="s-1kbAFK-M4K">
          ${renderIcon("check", { size: 16 })}
          <span>4. Review & Submit</span>
        </div>
      </nav>

 <form method="POST" action="/api/v1/applications/submit" class="card s-MA4ZJlhVMG" >
 <fieldset class="s-qmPEWUDwo7">
 <legend class="s-STj5RDidwF">
            Step 1: Choose Your Creative Specialization
          </legend>
 <div class="s-t0G_1102O4">
            ${trackCards}
          </div>
        </fieldset>

 <fieldset class="s-_I-ArztF2F">
 <legend class="s-STj5RDidwF">
            Step 2: Personal Profile & Background
          </legend>

          <div>
 <label for="fullName" class="s-oMHwiwajnC">
 Full Legal Name <span class="s-R3NEaqY8J-">*</span>
            </label>
 <input type="text" id="fullName" name="fullName" required placeholder="e.g. Babatunde Olumide" class="input s-UPrN9pHjcM" />
          </div>

 <div class="s-ZINITLBrbS">
            <div>
 <label for="email" class="s-oMHwiwajnC">
 Email Address <span class="s-R3NEaqY8J-">*</span>
              </label>
 <input type="email" id="email" name="email" required placeholder="babatunde@creative.ng" class="input s-UPrN9pHjcM" />
            </div>
            <div>
 <label for="phone" class="s-oMHwiwajnC">
                Phone Number
              </label>
 <input type="tel" id="phone" name="phone" placeholder="+234 802 345 6789" class="input s-UPrN9pHjcM" />
            </div>
          </div>

          <div>
 <label for="experienceLevel" class="s-oMHwiwajnC">
              Current Experience Level
            </label>
 <select id="experienceLevel" name="experienceLevel" class="input s-UPrN9pHjcM" >
              <option value="BEGINNER">Beginner (Foundational passion, no formal credit)</option>
              <option value="INTERMEDIATE" selected>Intermediate (1-3 short films or crew credits)</option>
              <option value="ADVANCED">Advanced (Industry professional seeking masterclass)</option>
            </select>
          </div>
        </fieldset>

 <fieldset class="s-_I-ArztF2F">
 <legend class="s-STj5RDidwF">
            Step 3: Creative Portfolio & Vision
          </legend>

          <div>
 <label for="portfolioUrl" class="s-oMHwiwajnC">
              Portfolio / Showreel URL (YouTube, Vimeo, Google Drive, Behance)
            </label>
 <input type="url" id="portfolioUrl" name="portfolioUrl" placeholder="https://vimeo.com/showreel/..." class="input s-UPrN9pHjcM" />
          </div>

          <div>
 <label for="statementOfIntent" class="s-oMHwiwajnC">
 Statement of Creative Intent <span class="s-R3NEaqY8J-">*</span>
            </label>
 <textarea id="statementOfIntent" name="statementOfIntent" required rows="5" placeholder="Describe the stories you want to tell and why AFCA Academy is your chosen institution..." class="input s-zCt9vSwGkS" ></textarea>
          </div>

 <div class="s--5BXthbePa">
 <input type="checkbox" id="financialAidRequested" name="financialAidRequested" value="true" class="s-P3N4Pxhfzm" />
 <label for="financialAidRequested" class="s-lBygm5HqzS">
              I wish to be considered for AFCA Tuition Merit Grants & Industry Sponsorships.
            </label>
          </div>
        </fieldset>

 <div class="s-uaYMBvJysP">
 <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required class="s-9Isrvn5gw2" />
 <label for="ndprConsent" class="s-EIgsbg6jRv">
            <strong>Submission acknowledgement:</strong> I confirm that the materials are my own. Submission handling and privacy terms require review; do not submit sensitive personal information through this preliminary form.
          </label>
        </div>

 <button type="submit" class="btn btn-primary button button--primary s-HDpEMjHOpj" >
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
 <article class="container s-A65hkIXB8q" >
 <span class="vmn-badge badge-warning s-fzy69kMBd1" >Status Tracker</span>
 <h1 class="s-gKYAebnSS_">
          Application Not Found
        </h1>
 <p class="s-UeMEfz3ag8">
          We could not locate an active admission record for reference: <code>${escapeHtml(queryRef || "Unknown")}</code>.
        </p>
 <a href="/apply" class="btn btn-primary button button--primary s-9SzUrcfC1J" >
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
 <article class="container s-PtELTuqHWM" >
 <header class="s-S_I6YpSsii">
        <span class="vmn-badge ${badgeClass}">${escapeHtml(app.status)}</span>
 <h1 class="s-yrxYod1Dke">
          Application Status: ${escapeHtml(app.reference)}
        </h1>
 <p class="s-58Gu8QFAOn">
          Submitted on ${new Date(app.submittedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
        </p>
      </header>

 <div class="card s-Fcmd9e1EAr" >
 <h2 class="s-Om0jVh9g2w">
          Applicant Summary
        </h2>
 <dl class="s-C1EvQpP6Yb">
 <dt class="s-F7gY5MEZDy">Applicant:</dt>
 <dd class="s-DwKwdeUqE1">${escapeHtml(app.fullName)}</dd>
 <dt class="s-F7gY5MEZDy">Track:</dt>
 <dd class="s-tR1NYl3ZY2">${escapeHtml(app.creativeTrack)}</dd>
 <dt class="s-F7gY5MEZDy">Email:</dt>
 <dd class="s-DwKwdeUqE1">${escapeHtml(app.email)}</dd>
 <dt class="s-F7gY5MEZDy">Financial Aid:</dt>
 <dd class="s-DwKwdeUqE1">${app.financialAidRequested ? "Grant Consideration Requested" : "Self-Funded"}</dd>
        </dl>
      </div>

      ${
        app.reviewerNotes
          ? `
 <div class="card s-G3i2o_tpf8" >
 <h2 class="s-e56k5oFe-Z">
            Admissions Committee Notice
          </h2>
 <p class="s-lqGt58CvEW">
            ${escapeHtml(app.reviewerNotes)}
          </p>
        </div>
      `
          : `
 <div class="card s-79pSfGSO76" >
 <p class="s-_yJ9BjIJay">Your submission is under technical review by the AFCA Academic Board. Estimated review time is 3-5 business days.</p>
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
 <tr class="s-z7JacQSDqk">
 <td class="s-oSOvhqxIsW">
 <a href="/admissions/review/${escapeHtml(a.reference)}" class="s-GjEhvizFw_">
          ${escapeHtml(a.reference)}
        </a>
      </td>
 <td class="s-sXA7D6oVHL">${escapeHtml(a.fullName)}</td>
 <td class="s-gL0G9B66bL">${escapeHtml(a.creativeTrack)}</td>
 <td class="s-6FCnPHXEyo">
        <span class="vmn-badge ${a.status === "ACCEPTED" ? "badge-ready" : a.status === "REJECTED" ? "badge-danger" : "badge-live"}">
          ${escapeHtml(a.status)}
        </span>
      </td>
 <td class="s-puXXpILa1L">
        ${new Date(a.submittedAt).toLocaleDateString("en-GB")}
      </td>
 <td class="s-Uw0RpPbWMz">
 <a href="/admissions/review/${escapeHtml(a.reference)}" class="btn btn-secondary button button--secondary s-4xXOufUUcH" >
          Assess Dossier
        </a>
      </td>
    </tr>
  `
    )
    .join("\n");

  return `
 <article class="container s-bJt7BJCshA" >
 <header class="s-f9_catyM9z">
        <div>
          <span class="vmn-badge badge-ready">Academic Governance</span>
 <h1 class="s-yrxYod1Dke">
            AFCA Admissions Evaluation Queue
          </h1>
 <p class="s-Q99I6jpLHa">
            Review incoming learner portfolios, assign rubric scores, and record admission outcomes.
          </p>
        </div>
 <div class="s--YnigKqw8j">
          ${applications.length} Submissions Active
        </div>
      </header>

 <div class="card s-13LQTcSiDf" >
 <table class="s-t-Ktq1qpPd">
          <thead>
 <tr class="s-Dikd2v9UTB">
 <th class="s-6FCnPHXEyo">Reference</th>
 <th class="s-6FCnPHXEyo">Applicant</th>
 <th class="s-6FCnPHXEyo">Track</th>
 <th class="s-6FCnPHXEyo">Status</th>
 <th class="s-6FCnPHXEyo">Submitted</th>
 <th class="s-Uw0RpPbWMz">Action</th>
            </tr>
          </thead>
          <tbody>
 ${rows || `<tr><td colspan="6" class="s-O9Jt0Gp7WU">No applications currently pending evaluation.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>
  `;
}
