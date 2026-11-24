/**
 * AFCA Admissions Screen Views (UX-APP-001 to UX-APP-008)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.3 / tasks.md Phase 5
 *
 * Implements applicant submission workspace, tracking status screen,
 * and staff admissions review queue; complete WCAG 2.2 AA conformance is not assessed here.
 */

import { renderIcon, escapeHtml } from "../components/index.js";
import { ApplicationSubmission } from "../../modules/hub/afca/admissions.js";

export function formatCreativeTrackName(track: string): string {
  switch (track) {
    case "CINEMATOGRAPHY":
      return "Cinematography & Lighting";
    case "DIRECTING":
      return "Film Directing & Storytelling";
    case "SCREENWRITING":
      return "Screenwriting & Narrative Dev";
    case "SOUND_ENGINEERING":
      return "Sound Design & Audio Post";
    case "CREATIVE_PRODUCING":
      return "Creative Producing & Finance";
    case "ANIMATION_VFX":
      return "3D Animation & Visual Effects";
    default:
      return track.replace(/_/g, " ");
  }
}

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
      <label class="card vmn-interactive-row block cursor-pointer p-5 bg-[#080c14] rounded-lg relative ${initialTrack === t.id ? "border-2 border-primary" : "border-2 border-[#1a2234]"}">
        <input type="radio" name="creativeTrack" value="${escapeHtml(t.id)}" ${initialTrack === t.id || (!initialTrack && t.id === "CINEMATOGRAPHY") ? "checked" : ""} class="s-aGRs9SMLGj accent-blue-500 absolute top-5 right-5" />
        <div class="s-QBgwgYUD6o s-hWM9EwXyw-">
          <span class="s-nEWyYJ6F8_ s-ptX0Vl711o">${escapeHtml(t.name)}</span>
          <span class="vmn-badge badge-ready s-orRLFYu8o-">${escapeHtml(t.badge)}</span>
        </div>
        <div class="s-WVn6kGOaHQ s-Qyjh8hKdci">
          ${renderIcon("clock", { size: 14 })}
          <span>Duration: ${escapeHtml(t.duration)}</span>
        </div>
      </label>
    `
    )
    .join("\n");

  return `
    <article class="container s-Gq1CYI3m9m s-rbAAUenm5h">
      <header class="s-2udxTC4LQH s-CY4XSC3BLE">
        <span class="vmn-badge badge-ready s-x7OYcwftt2">AFCA Academy Cohort Admissions</span>
        <h1 class="s-jy1nuvWOw7 s-0TijWy9XkZ">
          Learner Application & Creative Portfolio
        </h1>
        <p class="s-vZjt3ceVdI s-_PeHSOZsc3">
          Step into professional African cinema and television production. Complete your application dossier below.
        </p>
      </header>

      <!-- Multi-step Application Wizard Container -->
      <div class="vmn-stepper-container s-e-P44oULsV">
        <!-- Stepper Navigation Track -->
        <nav aria-label="Application Progress" class="vmn-stepper-nav s-T9-QtvQ2ZE">
          <div class="vmn-stepper-track">
            <div class="vmn-stepper-progress s-wVslv8OEV0"></div>
          </div>
          <div class="vmn-step-item active s-1kbAFK-M4K" data-step="1">
            <div class="vmn-step-circle">1</div>
            <div class="vmn-step-label">1. Track Selection</div>
          </div>
          <div class="vmn-step-item s-1kbAFK-M4K" data-step="2">
            <div class="vmn-step-circle">2</div>
            <div class="vmn-step-label">2. Bio &amp; Experience</div>
          </div>
          <div class="vmn-step-item s-1kbAFK-M4K" data-step="3">
            <div class="vmn-step-circle">3</div>
            <div class="vmn-step-label">3. Portfolio</div>
          </div>
          <div class="vmn-step-item s-1kbAFK-M4K" data-step="4">
            <div class="vmn-step-circle">4</div>
            <div class="vmn-step-label">4. Review &amp; Submit</div>
          </div>
        </nav>

        <form method="POST" action="/api/v1/applications/submit" class="card s-MA4ZJlhVMG s-jZCORxML1q">
          <!-- Step 1: Choose Your Creative Specialization -->
          <div class="vmn-step-pane active" data-step="1">
            <fieldset class="s-qmPEWUDwo7 s-W_jO4FbLis">
              <legend class="s-STj5RDidwF s-f0PXhcH6UV">
                Step 1: Choose Your Creative Specialization
              </legend>
              <div class="s-t0G_1102O4 s-11kn1dwNLg">
                ${trackCards}
              </div>
            </fieldset>

            <div class="s-HzyKqjqBq_">
              <button type="button" class="btn btn-primary" data-wizard-next>
                Continue to Personal Profile &rarr;
              </button>
            </div>
          </div>

          <!-- Step 2: Personal Profile & Background -->
          <div class="vmn-step-pane" data-step="2">
            <fieldset class="s-_I-ArztF2F s-W_jO4FbLis">
              <legend class="s-STj5RDidwF s-f0PXhcH6UV">
                Step 2: Personal Profile &amp; Background
              </legend>

              <div class="s-wzvsZWh_8m">
                <label for="fullName" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Full Legal Name <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
                </label>
                <input type="text" id="fullName" name="fullName" required placeholder="e.g. Babatunde Olumide" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
              </div>

              <div class="s-ZINITLBrbS s-3z8GFau31E">
                <div>
                  <label for="email" class="s-oMHwiwajnC s-TFvOhjaMln">
                    Email Address <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
                  </label>
                  <input type="email" id="email" name="email" required placeholder="babatunde@creative.ng" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
                </div>
                <div>
                  <label for="phone" class="s-oMHwiwajnC s-TFvOhjaMln">
                    Phone Number
                  </label>
                  <input type="tel" id="phone" name="phone" placeholder="+234 802 345 6789" class="input s-UPrN9pHjcM s-1qG5mzS73L" />
                </div>
              </div>

              <div>
                <label for="experienceLevel" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Current Experience Level
                </label>
                <select id="experienceLevel" name="experienceLevel" class="input s-UPrN9pHjcM s-1qG5mzS73L">
                  <option value="BEGINNER">Beginner (Foundational passion, no formal credit)</option>
                  <option value="INTERMEDIATE" selected>Intermediate (1-3 short films or crew credits)</option>
                  <option value="ADVANCED">Advanced (Industry professional seeking masterclass)</option>
                </select>
              </div>
            </fieldset>

            <div class="s-ipvhDaxPWK">
              <button type="button" class="btn btn-outline" data-wizard-prev>
                &larr; Back
              </button>
              <button type="button" class="btn btn-primary" data-wizard-next>
                Continue to Portfolio &rarr;
              </button>
            </div>
          </div>

          <!-- Step 3: Creative Portfolio & Vision -->
          <div class="vmn-step-pane" data-step="3">
            <fieldset class="s-_I-ArztF2F s-W_jO4FbLis">
              <legend class="s-STj5RDidwF s-f0PXhcH6UV">
                Step 3: Creative Portfolio &amp; Vision
              </legend>

              <div class="s-wzvsZWh_8m">
                <label for="portfolioUrl" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Portfolio / Showreel URL (YouTube, Vimeo, Google Drive, Behance)
                </label>
                <input type="url" id="portfolioUrl" name="portfolioUrl" placeholder="https://vimeo.com/showreel/..." class="input s-UPrN9pHjcM s-1qG5mzS73L" />
              </div>

              <!-- Dropzone Upload Surface -->
              <div class="vmn-dropzone s-vxMshhk8nC cursor-pointer" role="button" tabindex="0" aria-label="Attach treatment PDF or script draft">
                <input type="file" id="apply-treatment-file" class="sr-only" accept=".pdf,.doc,.docx,.zip" />
                <div class="s-l8PYDZV7eA">&#8682;</div>
                <div class="s-YXzpjH-v6x">Click or drag to select supporting treatment PDF or script draft</div>
                <div class="s-AABDHlDgnE">Maximum size 25MB • PDF, DOCX, or ZIP (or paste link above)</div>
              </div>

              <div class="s-wzvsZWh_8m">
                <label for="statementOfIntent" class="s-oMHwiwajnC s-TFvOhjaMln">
                  Statement of Creative Intent <span class="s-R3NEaqY8J- s-3f1gZC2I-8">*</span>
                </label>
                <textarea id="statementOfIntent" name="statementOfIntent" required rows="5" placeholder="Describe the stories you want to tell and why AFCA Academy is your chosen institution..." class="input s-zCt9vSwGkS s-Eh9lTVkcu3"></textarea>
              </div>

              <div class="s--5BXthbePa s-hUacvt9JO_">
                <input type="checkbox" id="financialAidRequested" name="financialAidRequested" value="true" class="s-P3N4Pxhfzm s-sKm32ee-yS" />
                <label for="financialAidRequested" class="s-lBygm5HqzS s-TkOPxAisnl">
                  I wish to be considered for AFCA Tuition Merit Grants &amp; Industry Sponsorships.
                </label>
              </div>
            </fieldset>

            <div class="s-ipvhDaxPWK">
              <button type="button" class="btn btn-outline" data-wizard-prev>
                &larr; Back
              </button>
              <button type="button" class="btn btn-primary" data-wizard-next>
                Review &amp; Finalize &rarr;
              </button>
            </div>
          </div>

          <!-- Step 4: Review & Submit -->
          <div class="vmn-step-pane" data-step="4">
            <h3 class="s-yVREB9eKGK">
              Step 4: Dossier Review &amp; Statutory Declaration
            </h3>

            <div class="s-g2--ZVzXgB">
              <div class="s-_vhCzsFO1y">Admissions Governance Notice</div>
              <p class="s-41dPoKfx8N">
                All applications undergo independent evaluation by the AFCA Academic Board. Shortlisted applicants will be invited for portfolio defense and technical interview.
              </p>
            </div>

            <div class="s-uaYMBvJysP s-RLfdRzYL44">
              <input type="checkbox" id="ndprConsent" name="ndprConsent" value="true" required class="s-9Isrvn5gw2 s-4ntcb2HZ-l" />
              <label for="ndprConsent" class="s-EIgsbg6jRv s-ZSPrh-feXC">
                <strong>Submission acknowledgement:</strong> I confirm that the materials are my own. Submission handling and privacy terms require review; do not submit sensitive personal information through this preliminary form.
              </label>
            </div>

            <div class="s-ipvhDaxPWK">
              <button type="button" class="btn btn-outline" data-wizard-prev>
                &larr; Back
              </button>
              <button type="submit" class="btn btn-primary button button--primary s-HDpEMjHOpj">
                Submit Application Dossier
              </button>
            </div>
          </div>
        </form>
      </div>
    </article>
  `;
}

/**
 * UX-APP-006: Application Confirmation & Status Tracker
 */
export function renderApplicationStatusHtml(app: ApplicationSubmission | null, queryRef?: string): string {
  if (!app) {
    return `
      <article class="container s-A65hkIXB8q s-5U6ZLnpqKJ">
        <div class="card s-Y3C4xiw9jf">
          <span class="vmn-badge badge-warning s-fzy69kMBd1 s-syLBYXx-nq">Status Tracker</span>
          <h1 class="s-gKYAebnSS_ s-VXXCvt8V8E">
            Application Not Found
          </h1>
          <p class="s-UeMEfz3ag8 s-ndHKSq-z3u">
            We could not locate an active admission record for reference: <code>${escapeHtml(queryRef || "Unknown")}</code>.
          </p>
          <a href="/apply" class="btn btn-primary button button--primary s-9SzUrcfC1J">
            Start New Application
          </a>
        </div>
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
    <article class="container s-PtELTuqHWM s-FtaGAPsgy2">
      <header class="s-S_I6YpSsii s-CY4XSC3BLE">
        <span class="vmn-badge ${badgeClass} mb-3 inline-block">${escapeHtml(app.status)}</span>
        <h1 class="s-yrxYod1Dke s-CepB0Vu663">
          Application Status: ${escapeHtml(app.reference)}
        </h1>
        <p class="s-58Gu8QFAOn s-Yb8iOr8gyg">
          Submitted on ${new Date(app.submittedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
        </p>
      </header>

      <!-- Stepper Status Tracker Bar -->
      <div class="s-U6WQM6Uwq4">
        <div class="s-dpmOZ3-pWr">
          <div class="s-gg2CPcel9q">
            <div class="s-F9G5uLF3PF">&#10003;</div>
            <div class="s-DykyAlXIS7">Dossier Received</div>
          </div>
          <div class="s-OUWV6R-zsM"></div>
          <div class="s-gg2CPcel9q">
            <div class="s-5sPzAJdqwB">2</div>
            <div class="s-0C0muK6dal">Board Evaluation</div>
          </div>
          <div class="s-OUWV6R-zsM"></div>
          <div class="s-gg2CPcel9q">
            <div class="s-06IgyNf2kF">3</div>
            <div class="s-bqrTSV_ZII">Admissions Decision</div>
          </div>
        </div>
      </div>

      <div class="card s-Fcmd9e1EAr s-U6WQM6Uwq4">
        <h2 class="s-Om0jVh9g2w s-O2tHiXGc88">
          Applicant Summary
        </h2>
        <dl class="s-C1EvQpP6Yb s--6YqY3hOkN">
          <dt class="s-F7gY5MEZDy s-4nbEsPap0-">Applicant:</dt>
          <dd class="s-DwKwdeUqE1 s-Sgct-1J-VD">${escapeHtml(app.fullName)}</dd>
          <dt class="s-F7gY5MEZDy s-4nbEsPap0-">Track:</dt>
          <dd class="s-tR1NYl3ZY2 s-FC76NXBlkl">${escapeHtml(formatCreativeTrackName(app.creativeTrack))} <span class="sr-only">${escapeHtml(app.creativeTrack)}</span></dd>
          <dt class="s-F7gY5MEZDy s-4nbEsPap0-">Email:</dt>
          <dd class="s-DwKwdeUqE1 s-Sgct-1J-VD">${escapeHtml(app.email)}</dd>
          <dt class="s-F7gY5MEZDy s-4nbEsPap0-">Financial Aid:</dt>
          <dd class="s-DwKwdeUqE1 s-Sgct-1J-VD">${app.financialAidRequested ? "Grant Consideration Requested" : "Self-Funded"}</dd>
        </dl>
      </div>

      ${
        app.reviewerNotes
          ? `
        <div class="card s-G3i2o_tpf8 s-HR8s4bxfN9">
          <h2 class="s-e56k5oFe-Z s-1rbO1LvkN0">
            Admissions Committee Notice
          </h2>
          <p class="s-lqGt58CvEW s-m8E1CUuV6l">
            ${escapeHtml(app.reviewerNotes)}
          </p>
        </div>
      `
          : `
        <div class="card s-79pSfGSO76 s-CGRJ9LSC2l">
          <p class="s-_yJ9BjIJay s-m8E1CUuV6l">Your submission is under technical review by the AFCA Academic Board. Estimated review time is 3-5 business days.</p>
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
      <tr class="s-z7JacQSDqk s-2iAKfjS3h7">
        <td class="s-oSOvhqxIsW s-SZqnVTz2pE">
          <a href="/admissions/review/${escapeHtml(a.reference)}" class="s-GjEhvizFw_ text-sky-400 font-semibold font-mono no-underline">
            ${escapeHtml(a.reference)}
          </a>
        </td>
        <td class="s-sXA7D6oVHL s-ATcc5XOiuD">${escapeHtml(a.fullName)}</td>
        <td class="s-gL0G9B66bL s-yWPwnH-BpZ">${escapeHtml(formatCreativeTrackName(a.creativeTrack))} <span class="sr-only">${escapeHtml(a.creativeTrack)}</span></td>
        <td class="s-6FCnPHXEyo s-SZqnVTz2pE">
          <span class="vmn-badge ${a.status === "ACCEPTED" ? "badge-ready" : a.status === "REJECTED" ? "badge-danger" : "badge-live"}">
            ${escapeHtml(a.status)}
          </span>
        </td>
        <td class="s-puXXpILa1L s-TnuLgXBwJp">
          ${new Date(a.submittedAt).toLocaleDateString("en-GB")}
        </td>
        <td class="s-Uw0RpPbWMz s-SZqnVTz2pE">
          <a href="/admissions/review/${escapeHtml(a.reference)}" class="btn btn-secondary button button--secondary s-4xXOufUUcH px-3 py-1.5 text-sm">
            Assess Dossier
          </a>
        </td>
      </tr>
    `
    )
    .join("\n");

  return `
    <article class="container s-bJt7BJCshA s--U9ECeFmBI">
      <header class="s-f9_catyM9z s-5xGwstGm16">
        <div>
          <span class="vmn-badge badge-ready s-c5O6EWa3V8">Academic Governance</span>
          <h1 class="s-yrxYod1Dke s-CepB0Vu663">
            AFCA Admissions Evaluation Queue
          </h1>
          <p class="s-Q99I6jpLHa s-v4nLDuXij2">
            Review incoming learner portfolios, assign rubric scores, and record admission outcomes.
          </p>
        </div>
        <div class="s--YnigKqw8j font-mono s-i2IbBkRbg9">
          ${escapeHtml(applications.length)} Submissions Active
        </div>
      </header>

      <div class="card s-13LQTcSiDf s-Q0xxqY45hR">
        <table class="s-t-Ktq1qpPd s-VEey9u5L6r">
          <thead>
            <tr class="s-Dikd2v9UTB s-pWzc5lHKYP">
              <th class="s-6FCnPHXEyo s-NCvw0GZEPx">Reference</th>
              <th class="s-6FCnPHXEyo s-NCvw0GZEPx">Applicant</th>
              <th class="s-6FCnPHXEyo s-NCvw0GZEPx">Track</th>
              <th class="s-6FCnPHXEyo s-NCvw0GZEPx">Status</th>
              <th class="s-6FCnPHXEyo s-NCvw0GZEPx">Submitted</th>
              <th class="s-Uw0RpPbWMz s-NCvw0GZEPx">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="6" class="s-O9Jt0Gp7WU s-aLnFL5T5u-">No applications currently pending evaluation.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>
  `;
}
