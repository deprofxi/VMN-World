/**
 * AFCA LMS Learning Engine Screen Views (UX-AFCA-001 to UX-AFCA-008)
 * Authority: VMNL-AZP-VMN-UIUX-001 §4.3 / tasks.md Phase 5
 *
 * Implements full LMS learner portal, video lesson streaming, rubric evaluation,
 * instructor grading, and certificate console gated by FF_AFCA_FULL_LEARNING_LMS.
 */

import { renderIcon } from "../components/index.js";
import { isFeatureEnabled, renderFeatureDisabledNotice } from "../../core/feature-flags/index.js";

/**
 * UX-AFCA-001: Learner Dashboard & Course Hub
 */
export function renderAfcaLearnerDashboardHtml(): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice("FF_AFCA_FULL_LEARNING_LMS", "AFCA Full LMS Learning Engine");
  }

  return `
    <article class="container" style="max-width: 1200px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-8); display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
        <div>
          <span class="vmn-badge badge-ready">AFCA Academy LMS</span>
          <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
            Learner Studio: Masterclass & Cohort Hub
          </h1>
          <p style="color: var(--vmn-text-secondary); margin: 0;">
            Track your curriculum progress, stream video masterclasses, submit film projects, and review faculty feedback.
          </p>
        </div>
        <div style="display: flex; gap: 12px;">
          <a href="/workspace/afca/assignments" class="button button--secondary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 8px;">
            ${renderIcon("document", { size: 16 })}
            <span>Assignments</span>
          </a>
          <a href="/workspace/afca/certificates" class="button button--primary" style="min-height: 44px; display: inline-flex; align-items: center; gap: 8px;">
            ${renderIcon("shield", { size: 16 })}
            <span>Certificates</span>
          </a>
        </div>
      </header>

      <!-- Active Course Progress Banner -->
      <section class="card" style="margin-bottom: var(--vmn-space-8); padding: var(--vmn-space-6); background: var(--vmn-color-surface-subtle); border-left: 4px solid var(--vmn-primary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--vmn-primary);">ACTIVE COHORT · CIN-2026-A</span>
            <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--vmn-text-primary); margin: 4px 0;">
              Advanced Cinematography: Visual Storytelling & Lighting Architecture
            </h2>
          </div>
          <span class="vmn-badge badge-live">Module 4 of 6 Active</span>
        </div>
        <div style="background: var(--vmn-surface-card); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: var(--vmn-primary); width: 68%; height: 100%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--vmn-text-secondary);">
          <span>68% Syllabus Completed (34/50 Hours)</span>
          <span>Next Submission Deadline: Friday, 23:59 WAT</span>
        </div>
      </section>

      <!-- Grid: Lessons & Modules -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--vmn-space-6);">
        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
            Curriculum Modules & Masterclass Streams
          </h2>

          <div style="display: flex; flex-direction: column; gap: var(--vmn-space-4);">
            <div class="card" style="padding: var(--vmn-space-4); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-text-muted);">MODULE 01</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--vmn-text-primary); margin: 2px 0;">Optics, Sensors & Dynamic Range Mastery</h3>
                <p style="font-size: 0.85rem; color: var(--vmn-text-secondary); margin: 0;">Completed · Grade: 94% Distinction</p>
              </div>
              <span class="vmn-badge badge-ready">Completed</span>
            </div>

            <div class="card" style="padding: var(--vmn-space-4); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-text-muted);">MODULE 02</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--vmn-text-primary); margin: 2px 0;">Three-Point Lighting & Negative Fill in West African Sets</h3>
                <p style="font-size: 0.85rem; color: var(--vmn-text-secondary); margin: 0;">Completed · Grade: 88% Merit</p>
              </div>
              <span class="vmn-badge badge-ready">Completed</span>
            </div>

            <div class="card" style="padding: var(--vmn-space-4); display: flex; justify-content: space-between; align-items: center; border: 2px solid var(--vmn-primary);">
              <div>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--vmn-primary);">CURRENT LESSON</span>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--vmn-text-primary); margin: 2px 0;">Atmospheric Practical Lighting & Colour Temperature</h3>
                <p style="font-size: 0.85rem; color: var(--vmn-text-secondary); margin: 0;">Streaming Lesson · 45 mins remaining</p>
              </div>
              <a href="/workspace/afca/player" class="button button--primary" style="min-height: 36px; padding: 4px 14px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                ${renderIcon("play", { size: 14 })}
                <span>Stream</span>
              </a>
            </div>
          </div>
        </div>

        <div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--vmn-text-primary); margin-bottom: var(--vmn-space-4);">
            Upcoming Milestones
          </h2>
          <div class="card" style="padding: var(--vmn-space-4);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--vmn-primary);">
              ${renderIcon("calendar", { size: 18 })}
              <span style="font-weight: 700;">Live Peer Critique</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--vmn-text-secondary); line-height: 1.5; margin-bottom: 12px;">
              Group lighting rushes review with lead faculty and guest cinematographer.
            </p>
            <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">Tomorrow, 14:00 WAT</div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * UX-AFCA-005: Faculty Gradebook & Rubric Evaluation
 */
export function renderAfcaGradebookHtml(): string {
  if (!isFeatureEnabled("FF_AFCA_FULL_LEARNING_LMS")) {
    return renderFeatureDisabledNotice("FF_AFCA_FULL_LEARNING_LMS", "AFCA Full LMS Learning Engine");
  }

  return `
    <article class="container" style="max-width: 1200px; margin: 0 auto; padding: var(--vmn-space-8) var(--vmn-space-4);">
      <header style="margin-bottom: var(--vmn-space-6); display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <span class="vmn-badge badge-ready">Academic Governance</span>
          <h1 style="font-size: var(--vmn-font-size-3xl); font-weight: 800; color: var(--vmn-text-primary); margin-top: 8px;">
            Faculty Gradebook & Assessment Rubrics
          </h1>
          <p style="color: var(--vmn-text-secondary); margin: 0;">
            Score student film submissions across weighted rubric criteria. Pass mark is 70%.
          </p>
        </div>
      </header>

      <div class="card" style="padding: 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
          <thead>
            <tr style="background: var(--vmn-color-surface-subtle); border-bottom: 2px solid var(--vmn-color-border-subtle); color: var(--vmn-text-secondary);">
              <th style="padding: 12px;">Student ID</th>
              <th style="padding: 12px;">Name</th>
              <th style="padding: 12px;">Project</th>
              <th style="padding: 12px;">Score</th>
              <th style="padding: 12px;">Status</th>
              <th style="padding: 12px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--vmn-color-border-subtle);">
              <td style="padding: 12px; font-weight: 700;">STU-8801</td>
              <td style="padding: 12px; font-weight: 600; color: var(--vmn-text-primary);">Amina Yusuf</td>
              <td style="padding: 12px; color: var(--vmn-text-secondary);">Short Film Rushes #3</td>
              <td style="padding: 12px; font-weight: 700; color: var(--vmn-primary);">88%</td>
              <td style="padding: 12px;"><span class="vmn-badge badge-ready">PASSED (MERIT)</span></td>
              <td style="padding: 12px; text-align: right;">
                <button class="button button--secondary" style="min-height: 36px; padding: 4px 12px; font-size: 0.85rem;">Edit Feedback</button>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid var(--vmn-color-border-subtle);">
              <td style="padding: 12px; font-weight: 700;">STU-8802</td>
              <td style="padding: 12px; font-weight: 600; color: var(--vmn-text-primary);">Emeka Kalu</td>
              <td style="padding: 12px; color: var(--vmn-text-secondary);">Short Film Rushes #3</td>
              <td style="padding: 12px; font-weight: 700; color: var(--vmn-text-muted);">Pending</td>
              <td style="padding: 12px;"><span class="vmn-badge badge-live">SUBMITTED</span></td>
              <td style="padding: 12px; text-align: right;">
                <button class="button button--primary" style="min-height: 36px; padding: 4px 12px; font-size: 0.85rem;">Grade Rubric</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `;
}
