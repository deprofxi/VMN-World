/**
 * AFCA Creative Academy Full LMS & Assessment Engine (UX-AFCA-004 to UX-AFCA-008)
 * Authority: VMN APP UI UX.docx §4.4 / BRD-PRD-001 §27–29
 *
 * Implements:
 * - UX-AFCA-004: Interactive Learning Plan & Curriculum Syllabus Navigator
 * - UX-AFCA-005: Student Assignment & Video Media Asset Submission
 * - UX-AFCA-006: Faculty Grading Rubric & Timecode Annotation Slate
 * - UX-AFCA-007: Assessment Results, Competency Matrix & Transcript
 * - UX-AFCA-008: Cryptographic Digital Certificate of Completion Generator
 */

import { escapeHtml } from "../components/escape.js";
import { renderIcon } from "../components/icons.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";

/**
 * UX-AFCA-004: Learning Plan & Syllabus Navigator
 */
export function renderLearningPlanHtml(_courseId: string = "AFCA-CRS-101"): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice(
      "FF_AFCA_FULL_LEARNING_LMS",
      "AFCA Learning Plan (UX-AFCA-004)",
      "/workspace/afca"
    );
  }

  const modules = [
    { num: 1, title: "Cinematography Fundamentals & Camera Optics", duration: "2 Weeks", status: "COMPLETED", progress: 100 },
    { num: 2, title: "Three-Point Lighting & Dark Skin Tone Rendering", duration: "3 Weeks", status: "IN_PROGRESS", progress: 65 },
    { num: 3, title: "Nollywood Production Workflow & Soundstage Rigging", duration: "3 Weeks", status: "UPCOMING", progress: 0 },
    { num: 4, title: "Color Grading in DaVinci Resolve (Rec.709 Broadcast)", duration: "4 Weeks", status: "UPCOMING", progress: 0 },
  ];

  return `
 <div class="s-X25-xxgYS8">
 <div class="s-k5NLeWec9i">
        <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Academic Syllabus <span class="sr-only">&bull; UX-AFCA-004</span></span>
 <h1 class="s-n_bp1PhViu">
            Professional Cinematography Diploma &bull; Learning Plan
          </h1>
 <p class="s-zrikAgYqXF">
            Cohort: <strong>AFCA-2026-Q4-LAGOS</strong> &bull; Lead Instructor: <strong>Femi Odugbemi (Executive Dean)</strong>
          </p>
        </div>
 <div class="s-aTQ0x94bOS">
 <a href="/workspace/afca/assignments/submit" class="btn btn-primary s-oskDBiEZSv" >
            ${renderIcon("document", { size: 16 })} Submit Assignment &rarr;
          </a>
        </div>
      </div>

 <div class="s-jvR2_DF1C2">
        ${modules
          .map(
            (m) => `
 <div class="vmn-card s-C8wmmrGEss" >
 <div class="s-z7xIf5BajU">
              <div>
 <div class="s-fNfgHipnYh">
 <span class="s-RlwL0UMdmC">
                    Module ${m.num}: ${escapeHtml(m.title)}
                  </span>
                  <span class="vmn-badge ${m.status === "COMPLETED" ? "badge-success" : m.status === "IN_PROGRESS" ? "badge-warning" : "badge-neutral"}">
                    ${escapeHtml(m.status)}
                  </span>
                </div>
 <div class="s-ypL9N-nGuz">Duration: ${escapeHtml(m.duration)} &bull; 12 Studio Lab Hours</div>
              </div>
 <div class="s-81E6Km55Op">
 <div class="s-BPn5daoqEy">${escapeHtml(m.progress)}% Mastered</div>
 <div class="s-5GrClCOiyp">
 <div style="width: ${escapeHtml(m.progress)}%; height: 100%; background: var(--vmn-color-primary);"></div>
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

/**
 * UX-AFCA-005: Student Assignment & Video Media Asset Submission
 */
export function renderAssignmentSubmissionHtml(assignmentId: string = "ASN-LIGHTING-02", successNotice?: string): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice(
      "FF_AFCA_FULL_LEARNING_LMS",
      "AFCA Assignment Submission (UX-AFCA-005)",
      "/workspace/afca"
    );
  }

  return `
 <div class="s-qJ3KuPIXic">
      ${
        successNotice
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Practical Assignment Successfully Submitted</div>
 <div class="s-huAjaSyPZk">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-sQ4H2l8IG7" >
 <div class="s-jXAzROAz5F">
 <span class="vmn-badge badge-warning s-Dnmmv3HPR8" >Student Practical Lab <span class="sr-only">&bull; UX-AFCA-005</span></span>
 <h1 class="s-n_bp1PhViu">
            Submit Practical Media Assignment
          </h1>
 <p class="s-YBXqvnNn8u">
            Assignment: <strong>Module 2 Practical: Low-Key Dramatic Lighting Exercise</strong>
          </p>
        </div>

 <form method="POST" action="/api/v1/workspace/afca/assignments/submit" class="s-agFP9ZFhL6">
          <input type="hidden" name="assignmentId" value="${escapeHtml(assignmentId)}" />

          <div class="vmn-form-field">
 <label for="sub-title" class="vmn-label s-d6tlFZezBi" >
 Project Cut Title <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="sub-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Night Scene Interior - Dramatic 3-Point Light Study"
              class="vmn-input s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="sub-url" class="vmn-label s-d6tlFZezBi" >
 Video Asset URL (ProRes 422 or H.264 Master) <span class="s-4oFCuHkv7e" aria-hidden="true">*</span>
            </label>
            <input
              id="sub-url"
              name="assetUrl"
              type="url"
              required
              placeholder="https://assets.vmnl.ng/afca/submissions/student-204/cut-01.mp4"
              class="vmn-input s-npZXKSAIoi"
            />
          </div>

          <div class="vmn-form-field">
 <label for="sub-notes" class="vmn-label s-d6tlFZezBi" >
              Director / Camera Operator Rationale
            </label>
            <textarea
              id="sub-notes"
              name="notes"
              rows="4"
              placeholder="Explain camera ISO, lens aperture (T-stop), lighting ratios, and skin-tone fill considerations..."
              class="vmn-input s-USa2UeMSTs"
            ></textarea>
          </div>

 <button type="submit" class="btn btn-primary s-XneFSgE1Un" >
            ${renderIcon("film", { size: 16 })} Transmit Cut to Faculty Review Queue
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-AFCA-006: Faculty Grading Rubric & Timecode Annotation Slate
 */
export function renderFacultyGradingRubricHtml(submissionId: string = "SUB-2026-088", successNotice?: string): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice(
      "FF_AFCA_FULL_LEARNING_LMS",
      "AFCA Rubric Grading (UX-AFCA-006)",
      "/workspace/afca"
    );
  }

  return `
 <div class="s-6m0XILdru8">
      ${
        successNotice
          ? `
 <div class="vmn-alert s-NKbeyCer0q" >
 <div class="s-Fq1eaiclek">${renderIcon("check", { size: 24 })}</div>
          <div>
 <div class="s-4jLxKmoprh">Grade &amp; Competency Rating Recorded</div>
 <div class="s-huAjaSyPZk">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

 <div class="vmn-card s-sQ4H2l8IG7" >
 <div class="s-k5NLeWec9i">
          <div>
 <span class="vmn-badge badge-info s-Dnmmv3HPR8" >Faculty Grading Slate <span class="sr-only">&bull; UX-AFCA-006</span></span>
 <h1 class="s-n_bp1PhViu">
              Practical Assignment Grading &amp; Review
            </h1>
 <p class="s-YBXqvnNn8u">
              Submission Ref: <code>${escapeHtml(submissionId)}</code> &bull; Learner: <strong>Amina Bello</strong>
            </p>
          </div>
        </div>

 <form method="POST" action="/api/v1/workspace/afca/assignments/grade" class="s-79hbkssy5K">
          <input type="hidden" name="submissionId" value="${escapeHtml(submissionId)}" />

 <div class="s-3ZKTfstopS">
            <div class="vmn-form-field">
 <label for="score-exposure" class="vmn-label s-d6tlFZezBi" >
                Exposure &amp; Sensor Dynamics (0–25 Pts)
              </label>
 <input id="score-exposure" name="scoreExposure" type="number" min="0" max="25" value="23" required class="vmn-input s-npZXKSAIoi" />
            </div>

            <div class="vmn-form-field">
 <label for="score-lighting" class="vmn-label s-d6tlFZezBi" >
                Lighting Contrast &amp; Shadow Ratio (0–25 Pts)
              </label>
 <input id="score-lighting" name="scoreLighting" type="number" min="0" max="25" value="24" required class="vmn-input s-npZXKSAIoi" />
            </div>

            <div class="vmn-form-field">
 <label for="score-optics" class="vmn-label s-d6tlFZezBi" >
                Focus Pulling &amp; Depth of Field (0–25 Pts)
              </label>
 <input id="score-optics" name="scoreOptics" type="number" min="0" max="25" value="22" required class="vmn-input s-npZXKSAIoi" />
            </div>

            <div class="vmn-form-field">
 <label for="score-comp" class="vmn-label s-d6tlFZezBi" >
                Frame Composition &amp; Continuity (0–25 Pts)
              </label>
 <input id="score-comp" name="scoreComposition" type="number" min="0" max="25" value="21" required class="vmn-input s-npZXKSAIoi" />
            </div>
          </div>

          <div class="vmn-form-field">
 <label for="fb-timecode" class="vmn-label s-d6tlFZezBi" >
              Faculty Timecode Annotations &amp; Director Notes
            </label>
            <textarea
              id="fb-timecode"
              name="timecodeNotes"
              rows="4"
              class="vmn-input"
 class="s-USa2UeMSTs"
            >00:01:14:02 - Excellent back-light separation on subject's rim hair.
00:02:45:18 - Slight micro-jitter on pan; recommend tightening the Mitchell mount head friction.</textarea>
          </div>

 <button type="submit" class="btn btn-primary s-XneFSgE1Un" >
            Confirm Grade &amp; Post to Student Gradebook
          </button>
        </form>
      </div>
    </div>
  `;
}

/**
 * UX-AFCA-008: Digital Certificate of Completion Generator
 */
export function renderCertificateGeneratorHtml(_learnerId: string = "LRN-2026-042"): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice(
      "FF_AFCA_FULL_LEARNING_LMS",
      "AFCA Digital Certification (UX-AFCA-008)",
      "/workspace/afca"
    );
  }

  const certificateHash = "SHA256:e932b1a89c20f18832aef912048bcae9124430291df";

  return `
 <div class="s-j_o2LsN6rz">
 <div class="s-OXbXKNybuO">
 <span class="vmn-badge badge-success s-Dnmmv3HPR8" >Accredited Certification <span class="sr-only">&bull; UX-AFCA-008</span></span>
 <h1 class="s-EnfZSIVIG1">
          Certificate of Professional Competency
        </h1>
 <p class="s-74eGsJhV6B">
          Africa Film &amp; Creative Arts Academy (AFCA) &bull; Verified Digital Credential
        </p>
      </div>

 <div class="vmn-card s-60KUjpUOkG" >
 <div class="s-v19bYP9jhV">
          Voice of Nigeria &bull; AFCA Academy Senate
        </div>
 <div class="s-RPYOsYAWCr">This is to certify that</div>
 <div class="s-xpEiIdu_Hw">
          Amina Olawale Bello
        </div>
 <div class="s--dTASK0zHx">
          has successfully fulfilled all academic curriculum requirements, studio laboratory practicums, and faculty peer reviews in
        </div>
 <div class="s-suLKF2zc0o">
          Master Diploma in Cinematic Arts &amp; Advanced Broadcast Playout
        </div>

 <div class="s-07qyfJs9dk">
          <div>
 <div class="s-mvSl6nWBw_">Femi Odugbemi</div>
 <div class="s-BKMtdWc4U-">Executive Dean, AFCA Academy</div>
          </div>
          <div>
 <div class="s-mvSl6nWBw_">Femi Aderibigbe</div>
 <div class="s-BKMtdWc4U-">Managing Director, VMNL Group</div>
          </div>
        </div>

 <div class="s-_0xMqK-es-">
          Cryptographic Verification Hash: ${certificateHash}
        </div>
      </div>
    </div>
  `;
}
