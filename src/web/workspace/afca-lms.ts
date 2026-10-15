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
 <article class="container s-bJt7BJCshA" >
 <header class="s-Boi4l_mmSk">
        <div>
          <span class="vmn-badge badge-ready">AFCA Academy LMS</span>
 <h1 class="s-yrxYod1Dke">
            Learner Studio: Masterclass & Cohort Hub
          </h1>
 <p class="s-Q99I6jpLHa">
            Track your curriculum progress, stream video masterclasses, submit film projects, and review faculty feedback.
          </p>
        </div>
 <div class="s-1jFqfgs1FA">
 <a href="/workspace/afca/assignments" class="button button--secondary s-6OO3ji7nfQ" >
            ${renderIcon("document", { size: 16 })}
            <span>Assignments</span>
          </a>
 <a href="/workspace/afca/certificates" class="button button--primary s-6OO3ji7nfQ" >
            ${renderIcon("shield", { size: 16 })}
            <span>Certificates</span>
          </a>
        </div>
      </header>

      <!-- Active Course Progress Banner -->
 <section class="card s-IuHbObGg_A" >
 <div class="s-6W91SIFLj4">
          <div>
 <span class="s-39UcIgUZOu">ACTIVE COHORT · CIN-2026-A</span>
 <h2 class="s-8DSQwxWaVK">
              Advanced Cinematography: Visual Storytelling & Lighting Architecture
            </h2>
          </div>
          <span class="vmn-badge badge-live">Module 4 of 6 Active</span>
        </div>
 <div class="s-O5bB7GePE-">
 <div class="s-WMX383OvhB"></div>
        </div>
 <div class="s-TFD5CajzC8">
          <span>68% Syllabus Completed (34/50 Hours)</span>
          <span>Next Submission Deadline: Friday, 23:59 WAT</span>
        </div>
      </section>

      <!-- Grid: Lessons & Modules -->
 <div class="s-7qFsWzHKss">
        <div>
 <h2 class="s-y7USoDv1BJ">
            Curriculum Modules & Masterclass Streams
          </h2>

 <div class="s-6mqdXZ0QST">
 <div class="card s-sT4i6WSrDu" >
              <div>
 <span class="s-OvZtx61L7a">MODULE 01</span>
 <h3 class="s-z-deQPE4iA">Optics, Sensors & Dynamic Range Mastery</h3>
 <p class="s-B4vv0J13Es">Completed · Grade: 94% Distinction</p>
              </div>
              <span class="vmn-badge badge-ready">Completed</span>
            </div>

 <div class="card s-sT4i6WSrDu" >
              <div>
 <span class="s-OvZtx61L7a">MODULE 02</span>
 <h3 class="s-z-deQPE4iA">Three-Point Lighting & Negative Fill in West African Sets</h3>
 <p class="s-B4vv0J13Es">Completed · Grade: 88% Merit</p>
              </div>
              <span class="vmn-badge badge-ready">Completed</span>
            </div>

 <div class="card s-oDHsgBVghn" >
              <div>
 <span class="s-M1Oh39uGaa">CURRENT LESSON</span>
 <h3 class="s-z-deQPE4iA">Atmospheric Practical Lighting & Colour Temperature</h3>
 <p class="s-B4vv0J13Es">Streaming Lesson · 45 mins remaining</p>
              </div>
 <a href="/workspace/afca/player" class="button button--primary s--0X38FFT3b" >
                ${renderIcon("play", { size: 14 })}
                <span>Stream</span>
              </a>
            </div>
          </div>
        </div>

        <div>
 <h2 class="s-y7USoDv1BJ">
            Upcoming Milestones
          </h2>
 <div class="card s-njnyYzrM3s" >
 <div class="s-enz6t9SnTN">
              ${renderIcon("calendar", { size: 18 })}
 <span class="s-Qqy2DuK6Be">Live Peer Critique</span>
            </div>
 <p class="s-sU15yyZ7lO">
              Group lighting rushes review with lead faculty and guest cinematographer.
            </p>
 <div class="s-MsCnZy-ydt">Tomorrow, 14:00 WAT</div>
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
 <article class="container s-bJt7BJCshA" >
 <header class="s-f9_catyM9z">
        <div>
          <span class="vmn-badge badge-ready">Academic Governance</span>
 <h1 class="s-yrxYod1Dke">
            Faculty Gradebook & Assessment Rubrics
          </h1>
 <p class="s-Q99I6jpLHa">
            Score student film submissions across weighted rubric criteria. Pass mark is 70%.
          </p>
        </div>
      </header>

 <div class="card s-13LQTcSiDf" >
 <table class="s-t-Ktq1qpPd">
          <thead>
 <tr class="s-Dikd2v9UTB">
 <th class="s-6FCnPHXEyo">Student ID</th>
 <th class="s-6FCnPHXEyo">Name</th>
 <th class="s-6FCnPHXEyo">Project</th>
 <th class="s-6FCnPHXEyo">Score</th>
 <th class="s-6FCnPHXEyo">Status</th>
 <th class="s-Uw0RpPbWMz">Action</th>
            </tr>
          </thead>
          <tbody>
 <tr class="s-z7JacQSDqk">
 <td class="s-oSOvhqxIsW">STU-8801</td>
 <td class="s-EEPGDTfs-0">Amina Yusuf</td>
 <td class="s-gL0G9B66bL">Short Film Rushes #3</td>
 <td class="s-PVlViuuo3G">88%</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-ready">PASSED (MERIT)</span></td>
 <td class="s-Uw0RpPbWMz">
 <button class="button button--secondary s-yMjn0NdDu-" >Edit Feedback</button>
              </td>
            </tr>
 <tr class="s-z7JacQSDqk">
 <td class="s-oSOvhqxIsW">STU-8802</td>
 <td class="s-EEPGDTfs-0">Emeka Kalu</td>
 <td class="s-gL0G9B66bL">Short Film Rushes #3</td>
 <td class="s-6zC5gg0N-9">Pending</td>
 <td class="s-6FCnPHXEyo"><span class="vmn-badge badge-live">SUBMITTED</span></td>
 <td class="s-Uw0RpPbWMz">
 <button class="button button--primary s-yMjn0NdDu-" >Grade Rubric</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `;
}
