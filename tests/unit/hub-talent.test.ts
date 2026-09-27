import { describe, expect, it } from "vitest";
import {
  TalentAcceleratorRegistry,
  AfcaAcademyService,
  AfroFusionCommunityHub,
  VirtualTalentManagementEngine,
  Course,
  AssessmentProject,
} from "../../src/modules/hub/index.js";

describe("Phase 3: Creative Economy Hub — Talent & Learning", () => {
  describe("TASK-P3-01: Talent Accelerator Platform / Network", () => {
    it("manages the complete talent lifecycle from onboarding to verification", () => {
      const registry = new TalentAcceleratorRegistry();

      // 1. National Hubs check
      const hubs = registry.listHubs();
      expect(hubs.length).toBeGreaterThanOrEqual(6);
      expect(hubs.some((h) => h.city === "Lagos")).toBe(true);

      // 2. Register new talent
      const talent = registry.registerTalent({
        id: "TAL-001",
        personId: "PER-001",
        fullName: "Chinedu Ibe",
        stageName: "Ned Ibe",
        primaryCategory: "CINEMATOGRAPHY",
        secondaryCategories: ["EDITING"],
        locationCity: "Lagos",
        locationState: "Lagos",
        partnerHubId: "HUB-LOS-001",
        dayRateNgn: 45000,
      });

      expect(talent.tier).toBe("EMERGING");
      expect(talent.status).toBe("DRAFT");

      // 3. Invariant: Cannot submit without portfolio
      expect(() => registry.submitForReview("TAL-001")).toThrow(
        "[TALENT-STATE-02] Cannot submit for review without at least one portfolio item."
      );

      // 4. Add portfolio item
      registry.addPortfolioItem("TAL-001", {
        title: "Showreel 2025",
        role: "CINEMATOGRAPHY",
        mediaUrl: "https://vmnl.ng/dam/showreels/ned_2025.mp4",
        year: 2025,
        verifiedCredit: true,
      });

      // 5. Submit for review
      registry.submitForReview("TAL-001");
      expect(registry.getProfile("TAL-001")?.status).toBe("SUBMITTED");

      // 6. Start review
      registry.startReview("TAL-001");
      expect(registry.getProfile("TAL-001")?.status).toBe("UNDER_REVIEW");

      // 7. Invariant: Cannot verify without assessment
      expect(() => registry.verifyTalent("TAL-001", "VERIFIED", "VERIFIER-01")).toThrow(
        "[TALENT-VERIFY-03] Cannot verify profile without at least one recorded assessment."
      );

      // 8. Record skills assessment
      registry.recordAssessment("TAL-001", {
        category: "CINEMATOGRAPHY",
        score: 88,
        assessedBy: "LEAD-INSTRUCTOR-01",
        assessedAt: new Date(),
        notes: "Exemplary lighting and camera framing capability.",
      });

      // 9. Successfully verify talent
      const badge = registry.verifyTalent("TAL-001", "VERIFIED", "VERIFIER-01");
      expect(badge.tier).toBe("VERIFIED");
      expect(badge.tokenId).toContain("BADGE-");
      expect(badge.checksumSha256).toBeDefined();

      const updated = registry.getProfile("TAL-001");
      expect(updated?.status).toBe("VERIFIED");
      expect(updated?.kycStatus).toBe("VERIFIED");
      expect(updated?.badge?.tokenId).toBe(badge.tokenId);
    });

    it("filters talent by skill category, tier, rate, and assessment score", () => {
      const registry = new TalentAcceleratorRegistry();

      registry.registerTalent({
        id: "T1",
        personId: "P1",
        fullName: "Amaka Eze",
        primaryCategory: "ACTING",
        locationCity: "Lagos",
        locationState: "Lagos",
        dayRateNgn: 50000,
      });

      registry.registerTalent({
        id: "T2",
        personId: "P2",
        fullName: "Emeka Okafor",
        primaryCategory: "DIRECTING",
        locationCity: "Enugu",
        locationState: "Enugu",
        dayRateNgn: 120000,
      });

      const actingTalent = registry.filterTalent({ category: "ACTING" });
      expect(actingTalent.length).toBe(1);
      expect(actingTalent[0].id).toBe("T1");

      const enuguTalent = registry.filterTalent({ state: "Enugu" });
      expect(enuguTalent.length).toBe(1);
      expect(enuguTalent[0].id).toBe("T2");

      const affordableTalent = registry.filterTalent({ maxDayRateNgn: 60000 });
      expect(affordableTalent.length).toBe(1);
      expect(affordableTalent[0].id).toBe("T1");
    });
  });

  describe("TASK-P3-02: African Film & Creative Arts Academy (AFCA)", () => {
    it("enforces rubric grading and blocks certificate generation if assessments fail", () => {
      const afca = new AfcaAcademyService();

      // 1. Create Course
      const course: Course = {
        id: "CRS-DIR-101",
        courseCode: "AFCA-DIR-101",
        title: "Screen Directing Foundations",
        description: "Core visual storytelling, scene blocking, and directing actors.",
        level: "FOUNDATION",
        totalCredits: 12,
        passingScore: 70,
        prerequisiteCourseIds: [],
        modules: [
          {
            id: "MOD-1",
            moduleCode: "SBN-1",
            title: "Scene Blocking",
            syllabus: "Spatial awareness, camera axis, and 180-degree rule.",
            learningHours: 20,
          },
        ],
        createdAt: new Date(),
      };
      afca.createCourse(course);

      // 2. Create Assessment Project with weighted rubric
      const project: AssessmentProject = {
        id: "PRJ-DIR-FINAL",
        courseId: "CRS-DIR-101",
        title: "3-Minute Narrative Scene Shoot",
        description: "Direct a 3-minute dramatic scene adhering to continuity rules.",
        submissionDeadline: new Date(Date.now() + 86400000 * 14),
        rubric: [
          { id: "R1", name: "Dramatic Blocking", description: "Movement of actors", maxScore: 50, weight: 0.5 },
          { id: "R2", name: "Visual Continuity", description: "180 rule and coverage", maxScore: 50, weight: 0.5 },
        ],
      };
      afca.createAssessmentProject(project);

      // 3. Create Cohort
      const cohort = afca.createCohort({
        id: "COH-2026-01",
        cohortCode: "AFCA-2026-DIR-C1",
        courseId: "CRS-DIR-101",
        leadInstructorId: "INST-01",
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-06-01"),
        capacity: 25,
      });

      // 4. Enroll Student
      afca.enrollStudent(cohort.id, "STU-001");

      // 5. Invariant: Cannot issue certificate before submission
      expect(() => afca.issueCertificate(cohort.id, "STU-001")).toThrow(
        "[AFCA-CERT-04] Cannot issue certificate: Required assessment '3-Minute Narrative Scene Shoot' has not been submitted."
      );

      // 6. Submit Deliverable
      const submission = afca.submitProjectDeliverable({
        id: "SUB-001",
        projectId: "PRJ-DIR-FINAL",
        studentId: "STU-001",
        cohortId: cohort.id,
        deliverableUrl: "https://vmnl.ng/dam/submissions/stu001_scene.mp4",
      });

      // 7. Invariant: Cannot issue certificate while grading pending
      expect(() => afca.issueCertificate(cohort.id, "STU-001")).toThrow(
        "[AFCA-CERT-05] Cannot issue certificate: Assessment '3-Minute Narrative Scene Shoot' is pending evaluation."
      );

      // 8. Grade failing score first
      afca.gradeProjectSubmission(submission.id, "INST-01", [
        { criterionId: "R1", score: 20 }, // 40%
        { criterionId: "R2", score: 25 }, // 50% -> overall 45% < 70%
      ]);

      // Invariant: Cannot issue certificate if assessment failed
      expect(() => afca.issueCertificate(cohort.id, "STU-001")).toThrow(
        "[AFCA-CERT-06] Cannot issue certificate: Assessment '3-Minute Narrative Scene Shoot' failed"
      );

      // 9. Re-grade with distinction score
      afca.gradeProjectSubmission(submission.id, "INST-01", [
        { criterionId: "R1", score: 45 }, // 90%
        { criterionId: "R2", score: 48 }, // 96% -> overall 93%
      ]);

      // 10. Issue Certificate
      const cert = afca.issueCertificate(cohort.id, "STU-001");
      expect(cert.certificateId).toContain("AFCA-CERT-");
      expect(cert.distinction).toBe("DISTINCTION");
      expect(cert.finalScorePercent).toBe(93);
      expect(cert.verificationTokenSha256).toBeDefined();

      // 11. Verify issued certificate
      const verifyResult = afca.verifyCertificate(cert.certificateId);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.certificate?.studentId).toBe("STU-001");
    });
  });

  describe("TASK-P3-03: Afro-Fusion Creatives Co-Working Hub", () => {
    it("handles space booking, enforces tier access, and prevents double bookings", () => {
      const hub = new AfroFusionCommunityHub();

      // Register resources
      hub.addResource({
        id: "RES-POD-01",
        hubLocationId: "LOC-LOS-HQ",
        name: "Lagos Podcast Studio A",
        type: "PODCAST_STUDIO",
        capacity: 4,
        hourlyRateNgn: 15000,
        minimumTierRequired: "CREATOR",
        isActive: true,
      });

      // Register Members
      hub.registerMember({
        id: "MEM-FREE",
        personId: "P-100",
        fullName: "Free Member",
        email: "free@vmnl.ng",
        tier: "COMMUNITY",
        status: "ACTIVE",
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000 * 30),
        guilds: ["Writers"],
      });

      hub.registerMember({
        id: "MEM-PRO",
        personId: "P-200",
        fullName: "Pro Creator",
        email: "pro@vmnl.ng",
        tier: "CREATOR",
        status: "ACTIVE",
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000 * 30),
        guilds: ["Podcasters", "Directors"],
      });

      const slotStart = new Date("2026-04-10T10:00:00Z");
      const slotEnd = new Date("2026-04-10T12:00:00Z");

      // Invariant: Member tier too low for Podcast Studio (requires CREATOR)
      expect(() =>
        hub.bookResource({
          id: "BKG-01",
          resourceId: "RES-POD-01",
          memberId: "MEM-FREE",
          startTime: slotStart,
          endTime: slotEnd,
        })
      ).toThrow("[COMM-BKG-04] Insufficient tier: Resource requires 'CREATOR', member has 'COMMUNITY'.");

      // Successful booking by Pro Creator
      const booking = hub.bookResource({
        id: "BKG-02",
        resourceId: "RES-POD-01",
        memberId: "MEM-PRO",
        startTime: slotStart,
        endTime: slotEnd,
      });

      expect(booking.status).toBe("RESERVED");
      expect(booking.totalCostNgn).toBe(30000); // 2 hours * 15,000 NGN

      // Invariant: Double booking conflict detection
      expect(() =>
        hub.bookResource({
          id: "BKG-03",
          resourceId: "RES-POD-01",
          memberId: "MEM-PRO",
          startTime: new Date("2026-04-10T11:00:00Z"), // Overlaps with 10:00-12:00
          endTime: new Date("2026-04-10T13:00:00Z"),
        })
      ).toThrow("[COMM-BKG-06] Resource 'Lagos Podcast Studio A' is already booked for the requested time window.");

      // Check-in
      const checkedIn = hub.checkIn("BKG-02");
      expect(checkedIn.status).toBe("CHECKED_IN");
      expect(checkedIn.checkedInAt).toBeDefined();
    });
  });

  describe("TASK-P3-04: Virtual Talent Management (VTM) Engine", () => {
    it("handles rate cards, opportunity matching, digital contracts, and milestone escrow release", () => {
      const vtm = new VirtualTalentManagementEngine();

      // 1. Register Rate Card
      const rateCard = vtm.registerRateCard({
        talentId: "TAL-001",
        baseDayRateNgn: 100000,
      });

      expect(rateCard.halfDayRateNgn).toBe(60000);
      expect(rateCard.buyoutRates.GLOBAL_ALL_MEDIA).toBe(250000); // 2.5x multiplier

      // 2. Create Opportunity Brief
      vtm.createBrief({
        id: "BRF-001",
        title: "Lead Cinematographer for Feature Film",
        productionOrgId: "ORG-ONE-STUDIOS",
        roleCategory: "CINEMATOGRAPHY",
        roleDescription: "Director of Photography for Nollywood feature",
        requiredTier: "VERIFIED",
        locationCity: "Lagos",
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-30"),
        budgetPerDayNgn: 120000,
        buyoutTier: "REGIONAL_PAYTV",
        isOpen: true,
      });

      // 3. Automated Talent Match
      const matches = vtm.matchTalent("BRF-001", [
        {
          id: "TAL-001",
          primaryCategory: "CINEMATOGRAPHY",
          secondaryCategories: ["EDITING"],
          tier: "VERIFIED",
          locationCity: "Lagos",
        },
        {
          id: "TAL-002",
          primaryCategory: "ACTING",
          secondaryCategories: [],
          tier: "EMERGING",
          locationCity: "Lagos",
        },
      ]);

      expect(matches.length).toBe(1); // Only TAL-001 matches Cinematography
      expect(matches[0].talentId).toBe("TAL-001");
      expect(matches[0].matchScorePercent).toBeGreaterThanOrEqual(90);

      // 4. Create Standard Contract
      const contract = vtm.createStandardContract({
        contractNumber: "VTM-CTR-2026-001",
        briefId: "BRF-001",
        talentId: "TAL-001",
        clientId: "ORG-ONE-STUDIOS",
        milestones: [
          {
            id: "M1",
            title: "Principal Photography Week 1",
            description: "Delivery of raw dailies for first week",
            amountNgn: 500000,
            dueDate: new Date("2026-05-07"),
          },
        ],
      });

      expect(contract.totalValueNgn).toBe(500000);
      expect(contract.isFullySigned).toBe(false);

      // 5. Invariant: Cannot escrow until fully signed
      expect(() => vtm.depositMilestoneEscrow(contract.id, "M1")).toThrow(
        "[VTM-ESC-01] Cannot deposit escrow into contract that is not fully signed."
      );

      // 6. Signatures
      vtm.signContract(contract.id, "TALENT");
      vtm.signContract(contract.id, "CLIENT");
      expect(vtm.getContract(contract.id)?.isFullySigned).toBe(true);

      // 7. Deposit Escrow
      vtm.depositMilestoneEscrow(contract.id, "M1");
      expect(vtm.getContract(contract.id)?.milestones[0].status).toBe("FUNDS_ESCROWED");

      // 8. Invariant: Cannot release escrow before deliverable is submitted
      expect(() => vtm.releaseMilestoneEscrow(contract.id, "M1", "CLIENT-SIGN-OFF")).toThrow(
        "[VTM-ESC-06] Cannot release escrow funds for milestone in state 'FUNDS_ESCROWED'. Must be 'MILESTONE_SUBMITTED'."
      );

      // 9. Submit Deliverable
      vtm.submitMilestoneDeliverable(contract.id, "M1", "https://vmnl.ng/dam/dailies/w1.tar.gz");
      expect(vtm.getContract(contract.id)?.milestones[0].status).toBe("MILESTONE_SUBMITTED");

      // 10. Release Escrow with sign-off
      const released = vtm.releaseMilestoneEscrow(contract.id, "M1", "CLIENT-APPROVER-001");
      expect(released.status).toBe("APPROVED_RELEASED");
      expect(released.platformCommissionNgn).toBe(75000); // 15% of 500k
      expect(released.talentDisbursedAmountNgn).toBe(425000); // 85% of 500k
    });
  });
});
