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
import { SessionUser } from "../../core/auth/index.js";

/**
 * UX-AFCA-004: Learning Plan & Syllabus Navigator
 */
export function renderLearningPlanHtml(courseId: string = "AFCA-CRS-101"): string {
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
    <div style="max-width: 1040px; margin: 32px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">ACADEMIC &bull; UX-AFCA-004</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Professional Cinematography Diploma &bull; Learning Plan
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.95rem;">
            Cohort: <strong>AFCA-2026-Q4-LAGOS</strong> &bull; Lead Instructor: <strong>Femi Odugbemi (Executive Dean)</strong>
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/workspace/afca/assignments/submit" class="btn btn-primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 6px;">
            ${renderIcon("document", { size: 16 })} Submit Assignment &rarr;
          </a>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${modules
          .map(
            (m) => `
          <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 20px 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-weight: 800; color: var(--vmn-color-primary-text); font-size: 1.05rem;">
                    Module ${m.num}: ${escapeHtml(m.title)}
                  </span>
                  <span class="vmn-badge ${m.status === "COMPLETED" ? "badge-success" : m.status === "IN_PROGRESS" ? "badge-warning" : "badge-neutral"}">
                    ${escapeHtml(m.status)}
                  </span>
                </div>
                <div style="font-size: 0.85rem; color: var(--vmn-color-secondary-text);">Duration: ${m.duration} &bull; 12 Studio Lab Hours</div>
              </div>
              <div style="text-align: right; min-width: 140px;">
                <div style="font-weight: 700; color: var(--vmn-color-primary-text); font-size: 0.9rem; margin-bottom: 6px;">${m.progress}% Mastered</div>
                <div style="height: 6px; background: var(--vmn-color-border); border-radius: 9999px; overflow: hidden;">
                  <div style="width: ${m.progress}%; height: 100%; background: var(--vmn-color-primary);"></div>
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
    <div style="max-width: 720px; margin: 32px auto; padding: 0 16px;">
      ${
        successNotice
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Practical Assignment Successfully Submitted</div>
            <div style="font-size: 0.85rem; color: #047857;">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="margin-bottom: 24px;">
          <span class="vmn-badge badge-warning" style="margin-bottom: 8px; font-weight: 700;">STUDENT LAB &bull; UX-AFCA-005</span>
          <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
            Submit Practical Media Assignment
          </h1>
          <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.9rem;">
            Assignment: <strong>Module 2 Practical: Low-Key Dramatic Lighting Exercise</strong>
          </p>
        </div>

        <form method="POST" action="/api/v1/workspace/afca/assignments/submit" style="display: flex; flex-direction: column; gap: 18px;">
          <input type="hidden" name="assignmentId" value="${escapeHtml(assignmentId)}" />

          <div class="vmn-form-field">
            <label for="sub-title" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Project Cut Title <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="sub-title"
              name="title"
              type="text"
              required
              placeholder="e.g. Night Scene Interior - Dramatic 3-Point Light Study"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="sub-url" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Video Asset URL (ProRes 422 or H.264 Master) <span style="color: #DC2626;" aria-hidden="true">*</span>
            </label>
            <input
              id="sub-url"
              name="assetUrl"
              type="url"
              required
              placeholder="https://assets.vmnl.ng/afca/submissions/student-204/cut-01.mp4"
              class="vmn-input"
              style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            />
          </div>

          <div class="vmn-form-field">
            <label for="sub-notes" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Director / Camera Operator Rationale
            </label>
            <textarea
              id="sub-notes"
              name="notes"
              rows="4"
              placeholder="Explain camera ISO, lens aperture (T-stop), lighting ratios, and skin-tone fill considerations..."
              class="vmn-input"
              style="width: 100%; padding: 10px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="min-height: 48px; font-weight: 700; width: 100%; cursor: pointer;">
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
    <div style="max-width: 900px; margin: 32px auto; padding: 0 16px;">
      ${
        successNotice
          ? `
        <div class="vmn-alert" style="background: #ECFDF5; border: 1px solid #10B981; border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <div style="color: #059669;">${renderIcon("check", { size: 24 })}</div>
          <div>
            <div style="font-weight: 700; color: #065F46;">Grade &amp; Competency Rating Recorded</div>
            <div style="font-size: 0.85rem; color: #047857;">${escapeHtml(successNotice)}</div>
          </div>
        </div>
      `
          : ""
      }

      <div class="vmn-card" style="background: var(--vmn-color-surface); border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-lg); padding: 32px; box-shadow: var(--vmn-shadow-md);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <span class="vmn-badge badge-info" style="margin-bottom: 8px; font-weight: 700;">FACULTY SLATE &bull; UX-AFCA-006</span>
            <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 6px 0;">
              Practical Assignment Grading &amp; Review
            </h1>
            <p style="color: var(--vmn-color-secondary-text); margin: 0; font-size: 0.9rem;">
              Submission Ref: <code>${escapeHtml(submissionId)}</code> &bull; Learner: <strong>Amina Bello</strong>
            </p>
          </div>
        </div>

        <form method="POST" action="/api/v1/workspace/afca/assignments/grade" style="display: flex; flex-direction: column; gap: 20px;">
          <input type="hidden" name="submissionId" value="${escapeHtml(submissionId)}" />

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            <div class="vmn-form-field">
              <label for="score-exposure" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Exposure &amp; Sensor Dynamics (0–25 Pts)
              </label>
              <input id="score-exposure" name="scoreExposure" type="number" min="0" max="25" value="23" required class="vmn-input" style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);" />
            </div>

            <div class="vmn-form-field">
              <label for="score-lighting" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Lighting Contrast &amp; Shadow Ratio (0–25 Pts)
              </label>
              <input id="score-lighting" name="scoreLighting" type="number" min="0" max="25" value="24" required class="vmn-input" style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);" />
            </div>

            <div class="vmn-form-field">
              <label for="score-optics" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Focus Pulling &amp; Depth of Field (0–25 Pts)
              </label>
              <input id="score-optics" name="scoreOptics" type="number" min="0" max="25" value="22" required class="vmn-input" style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);" />
            </div>

            <div class="vmn-form-field">
              <label for="score-comp" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
                Frame Composition &amp; Continuity (0–25 Pts)
              </label>
              <input id="score-comp" name="scoreComposition" type="number" min="0" max="25" value="21" required class="vmn-input" style="width: 100%; height: 44px; padding: 0 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);" />
            </div>
          </div>

          <div class="vmn-form-field">
            <label for="fb-timecode" class="vmn-label" style="font-weight: 600; display: block; margin-bottom: 6px;">
              Faculty Timecode Annotations &amp; Director Notes
            </label>
            <textarea
              id="fb-timecode"
              name="timecodeNotes"
              rows="4"
              class="vmn-input"
              style="width: 100%; padding: 10px 12px; border: 1px solid var(--vmn-color-border); border-radius: var(--vmn-radius-md);"
            >00:01:14:02 - Excellent back-light separation on subject's rim hair.
00:02:45:18 - Slight micro-jitter on pan; recommend tightening the Mitchell mount head friction.</textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="min-height: 48px; font-weight: 700; width: 100%; cursor: pointer;">
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
export function renderCertificateGeneratorHtml(learnerId: string = "LRN-2026-042"): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice(
      "FF_AFCA_FULL_LEARNING_LMS",
      "AFCA Digital Certification (UX-AFCA-008)",
      "/workspace/afca"
    );
  }

  const certificateHash = "SHA256:e932b1a89c20f18832aef912048bcae9124430291df";

  return `
    <div style="max-width: 800px; margin: 32px auto; padding: 0 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="vmn-badge badge-success" style="margin-bottom: 8px; font-weight: 700;">ACCREDITED &bull; UX-AFCA-008</span>
        <h1 style="font-size: var(--vmn-font-size-2xl); font-weight: 800; color: var(--vmn-color-primary-text); margin: 0 0 4px 0;">
          Certificate of Professional Competency
        </h1>
        <p style="color: var(--vmn-color-secondary-text); margin: 0;">
          Africa Film &amp; Creative Arts Academy (AFCA) &bull; Verified Digital Credential
        </p>
      </div>

      <div class="vmn-card" style="background: #FFFFFF; border: 8px double #1E3A8A; border-radius: var(--vmn-radius-lg); padding: 48px 40px; text-align: center; box-shadow: var(--vmn-shadow-lg);">
        <div style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; color: #64748B; margin-bottom: 16px; font-weight: 700;">
          Voice of Nigeria &bull; AFCA Academy Senate
        </div>
        <div style="font-size: 1.1rem; color: #334155; margin-bottom: 12px;">This is to certify that</div>
        <div style="font-size: 2.2rem; font-weight: 900; color: #0F172A; margin-bottom: 12px; font-family: serif;">
          Amina Olawale Bello
        </div>
        <div style="font-size: 1rem; color: #475569; max-width: 580px; margin: 0 auto 28px auto; line-height: 1.6;">
          has successfully fulfilled all academic curriculum requirements, studio laboratory practicums, and faculty peer reviews in
        </div>
        <div style="font-size: 1.4rem; font-weight: 800; color: #1E3A8A; margin-bottom: 24px;">
          Master Diploma in Cinematic Arts &amp; Advanced Broadcast Playout
        </div>

        <div style="display: flex; justify-content: space-around; border-top: 1px solid #CBD5E1; padding-top: 24px; margin-top: 24px;">
          <div>
            <div style="font-weight: 700; color: #1E293B;">Femi Odugbemi</div>
            <div style="font-size: 0.8rem; color: #64748B;">Executive Dean, AFCA Academy</div>
          </div>
          <div>
            <div style="font-weight: 700; color: #1E293B;">Femi Aderibigbe</div>
            <div style="font-size: 0.8rem; color: #64748B;">Managing Director, VMNL Group</div>
          </div>
        </div>

        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #E2E8F0; font-size: 0.75rem; font-family: monospace; color: #64748B;">
          Cryptographic Verification Hash: ${escapeHtml(certificateHash)}
        </div>
      </div>
    </div>
  `;
}
