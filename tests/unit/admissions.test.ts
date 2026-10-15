import { describe, expect, it, beforeEach } from "vitest";
import {
  AfcaAdmissionsService,
  generateApplicationReference,
} from "../../src/modules/hub/afca/admissions.js";
import {
  renderAdmissionsApplicationHtml,
  renderApplicationStatusHtml,
  renderAdmissionsQueueHtml,
} from "../../src/web/public/admissions.js";
import { setFeatureFlagOverride } from "../../src/core/feature-flags/index.js";

describe("Phase 5: AFCA Admissions Service & Learner Workspaces", () => {
  beforeEach(() => {
    AfcaAdmissionsService._resetLedger();
    setFeatureFlagOverride("FF_AFCA_ADMISSIONS_ENABLED", true);
  });

  describe("Application Reference Generation", () => {
    it("generates deterministic and formatted reference codes", () => {
      const ref = generateApplicationReference();
      expect(ref).toMatch(/^APP-\d{8}-\d{4}$/);
    });
  });

  describe("Application Drafting & Submission", () => {
    it("allows prospective learners to save an application draft (UX-APP-001 to 005)", async () => {
      const draft = await AfcaAdmissionsService.saveDraft({
        fullName: "Amaka Okafor",
        email: "amaka@example.ng",
        creativeTrack: "CINEMATOGRAPHY",
        stepCompleted: 2,
      });

      expect(draft.draftToken).toMatch(/^DRAFT-/);
      expect(draft.reference).toMatch(/^APP-/);
      expect(draft.status).toBe("DRAFT");
    });

    it("submits complete application dossier with tracking reference (UX-APP-005, 006)", async () => {
      const application = await AfcaAdmissionsService.submitApplication({
        fullName: "Tunde Bakare",
        email: "tunde@afca.ng",
        phone: "+234 801 234 5678",
        creativeTrack: "DIRECTING",
        experienceLevel: "INTERMEDIATE",
        portfolioUrl: "https://vimeo.com/showreel/tunde",
        statementOfIntent: "I want to revolutionize African cinema narrative structures.",
        financialAidRequested: true,
        stepCompleted: 5,
      });

      expect(application.reference).toMatch(/^APP-/);
      expect(application.status).toBe("SUBMITTED");
      expect(application.financialAidRequested).toBe(true);
      expect(application.submittedAt).toBeInstanceOf(Date);

      // Verify retrieval by reference
      const fetched = await AfcaAdmissionsService.getByReference(application.reference);
      expect(fetched).not.toBeNull();
      expect(fetched?.fullName).toBe("Tunde Bakare");
    });

    it("enforces idempotency on duplicate submission submissions", async () => {
      const payload = {
        fullName: "Chidi Anozie",
        email: "chidi@films.ng",
        phone: "+234 809 111 2233",
        creativeTrack: "SCREENWRITING" as const,
        experienceLevel: "BEGINNER" as const,
        statementOfIntent: "Exploring Igbo historical folklore on screen.",
        financialAidRequested: false,
        stepCompleted: 5,
        idempotencyKey: "idem-chidi-001",
      };

      const first = await AfcaAdmissionsService.submitApplication(payload);
      const second = await AfcaAdmissionsService.submitApplication(payload);

      expect(first.reference).toBe(second.reference);
      expect(first.id).toBe(second.id);
    });

    it("rejects invalid submissions lacking required statement or email", async () => {
      await expect(
        AfcaAdmissionsService.submitApplication({
          fullName: "Incomplete User",
          email: "",
          phone: "",
          creativeTrack: "SOUND_ENGINEERING",
          experienceLevel: "BEGINNER",
          statementOfIntent: "",
          financialAidRequested: false,
          stepCompleted: 1,
        })
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("Admissions Review Queue & Decision Recording", () => {
    it("lists active queue and filters by track or status (UX-APP-007)", async () => {
      await AfcaAdmissionsService.submitApplication({
        fullName: "Candidate One",
        email: "cand1@afca.ng",
        phone: "+234 800 000 0001",
        creativeTrack: "DIRECTING",
        experienceLevel: "INTERMEDIATE",
        statementOfIntent: "Statement 1",
        financialAidRequested: false,
        stepCompleted: 5,
      });

      await AfcaAdmissionsService.submitApplication({
        fullName: "Candidate Two",
        email: "cand2@afca.ng",
        phone: "+234 800 000 0002",
        creativeTrack: "ANIMATION_VFX",
        experienceLevel: "ADVANCED",
        statementOfIntent: "Statement 2",
        financialAidRequested: true,
        stepCompleted: 5,
      });

      const all = await AfcaAdmissionsService.listQueue();
      expect(all.length).toBe(2);

      const directingOnly = await AfcaAdmissionsService.listQueue({ creativeTrack: "DIRECTING" });
      expect(directingOnly.length).toBe(1);
      expect(directingOnly[0].creativeTrack).toBe("DIRECTING");
    });

    it("records reviewer scores and final admissions decision (UX-APP-008)", async () => {
      const app = await AfcaAdmissionsService.submitApplication({
        fullName: "Candidate Three",
        email: "cand3@afca.ng",
        phone: "+234 800 000 0003",
        creativeTrack: "PRODUCING" as any,
        experienceLevel: "INTERMEDIATE",
        statementOfIntent: "Statement 3",
        financialAidRequested: false,
        stepCompleted: 5,
      });

      const reviewed = await AfcaAdmissionsService.recordDecision({
        reference: app.reference,
        reviewerId: "USR-ACAD-01",
        decision: "ACCEPTED",
        notes: "Outstanding artistic voice and strong foundational reel.",
        scores: {
          portfolioScore: 92,
          statementScore: 88,
          overallRating: 90,
        },
      });

      expect(reviewed.status).toBe("ACCEPTED");
      expect(reviewed.reviewedBy).toBe("USR-ACAD-01");
      expect(reviewed.reviewScores?.overallRating).toBe(90);
    });
  });

  describe("Feature Flag Gating", () => {
    it("blocks admissions submission when FF_AFCA_ADMISSIONS_ENABLED is false", async () => {
      setFeatureFlagOverride("FF_AFCA_ADMISSIONS_ENABLED", false);

      await expect(
        AfcaAdmissionsService.submitApplication({
          fullName: "Blocked Candidate",
          email: "blocked@afca.ng",
          phone: "+234 800 999 9999",
          creativeTrack: "CINEMATOGRAPHY",
          experienceLevel: "BEGINNER",
          statementOfIntent: "Blocked intent",
          financialAidRequested: false,
          stepCompleted: 5,
        })
      ).rejects.toThrow("FF_AFCA_ADMISSIONS_ENABLED");
    });
  });

  describe("Admissions UI Screen Views", () => {
    it("renders application form (UX-APP-001 to 005) with accessible inputs and track cards", () => {
      const html = renderAdmissionsApplicationHtml("DIRECTING");
      expect(html).toContain("Learner Application & Creative Portfolio");
      expect(html).toContain("Film Directing & Storytelling");
      expect(html).toContain('name="creativeTrack"');
      expect(html).toContain('name="statementOfIntent"');
      expect(html).toContain('name="ndprConsent"');
    });

    it("renders application status tracker (UX-APP-006)", () => {
      const mockApp = {
        id: "app-1",
        reference: "APP-20260929-1001",
        fullName: "Test Candidate",
        email: "test@afca.ng",
        phone: "+234 800 123 4567",
        creativeTrack: "DIRECTING" as const,
        experienceLevel: "BEGINNER" as const,
        statementOfIntent: "Test intent",
        financialAidRequested: false,
        status: "SUBMITTED" as const,
        stepCompleted: 5,
        submittedAt: new Date(),
      };

      const html = renderApplicationStatusHtml(mockApp);
      expect(html).toContain("APP-20260929-1001");
      expect(html).toContain("SUBMITTED");
      expect(html).toContain("Test Candidate");
    });

    it("escapes untrusted application values in status and staff queue HTML", () => {
      const unsafe = {
        id: "app-xss",
        reference: `APP-<img src=x onerror=alert(1)>`,
        fullName: `<script>alert("name")</script>`,
        email: `person@example.ng"><img src=x>`,
        phone: "",
        creativeTrack: "DIRECTING" as const,
        experienceLevel: "BEGINNER" as const,
        statementOfIntent: "private text",
        financialAidRequested: false,
        status: "CHANGES_REQUESTED" as const,
        reviewerNotes: `<svg onload=alert(1)>review notes`,
        stepCompleted: 5,
        submittedAt: new Date(),
      };

      const statusHtml = renderApplicationStatusHtml(unsafe);
      expect(statusHtml).toContain("&lt;script&gt;");
      expect(statusHtml).toContain("&lt;svg onload=alert(1)&gt;");
      expect(statusHtml).not.toContain("<script>");
      expect(statusHtml).not.toContain("<svg onload=");

      const notFoundHtml = renderApplicationStatusHtml(null, `<img src=x onerror=alert(1)>`);
      expect(notFoundHtml).toContain("&lt;img src=x onerror=alert(1)&gt;");
      expect(notFoundHtml).not.toContain("<img src=x");

      const queueHtml = renderAdmissionsQueueHtml([unsafe]);
      expect(queueHtml).toContain("APP-&lt;img src=x onerror=alert(1)&gt;");
      expect(queueHtml).not.toContain("href=\"/admissions/review/APP-<img");
    });

    it("renders admissions queue table (UX-APP-007)", () => {
      const mockList = [
        {
          id: "app-1",
          reference: "APP-20260929-1001",
          fullName: "Test Candidate",
          email: "test@afca.ng",
          phone: "+234 800 123 4567",
          creativeTrack: "DIRECTING" as const,
          experienceLevel: "BEGINNER" as const,
          statementOfIntent: "Test intent",
          financialAidRequested: false,
          status: "SUBMITTED" as const,
          stepCompleted: 5,
          submittedAt: new Date(),
        },
      ];

      const html = renderAdmissionsQueueHtml(mockList);
      expect(html).toContain("AFCA Admissions Evaluation Queue");
      expect(html).toContain("APP-20260929-1001");
      expect(html).toContain("Assess Dossier");
    });
  });
});
