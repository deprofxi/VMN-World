import { describe, expect, it } from "vitest";
import {
  HeadspaceKnowledgeEngine,
  Cr8TechCreativeEngine,
  AgenticOperatingSystem,
} from "../../src/modules/intelligence/index.js";

describe("Phase 5: Knowledge, Creative Tech & Agentic OS (AOS)", () => {
  describe("TASK-P5-01: HeadspaceNG Knowledge Base & Media Intelligence", () => {
    it("manages enterprise IP, regulatory rules, and enforces confidentiality access", () => {
      const headspace = new HeadspaceKnowledgeEngine();

      // 1. Internal user can access internal document
      const nbcDoc = headspace.getDocument("DOC-NBC-CODE-01", "INTERNAL");
      expect(nbcDoc.title).toContain("Nigeria Broadcasting Code");

      // 2. Invariant: Internal user cannot access executive-only document
      expect(() => headspace.getDocument("DOC-IP-NIGEZIE-BIBLE", "INTERNAL")).toThrow(
        "[HSP-AUTH-01] Access denied: User level 'INTERNAL' cannot access 'EXECUTIVE_ONLY' documents."
      );

      // 3. Executive user can access executive document
      const execDoc = headspace.getDocument("DOC-IP-NIGEZIE-BIBLE", "EXECUTIVE_ONLY");
      expect(execDoc.title).toContain("Nigezie Xtreme Channel Master Brand");

      // 4. Search filtered by confidentiality
      const internalSearch = headspace.search("Nigezie StarTimes", "INTERNAL");
      // Executive doc should be omitted for internal user
      expect(internalSearch.some((r) => r.document.id === "DOC-IP-NIGEZIE-BIBLE")).toBe(false);

      const execSearch = headspace.search("Nigezie StarTimes", "EXECUTIVE_ONLY");
      expect(execSearch.some((r) => r.document.id === "DOC-IP-NIGEZIE-BIBLE")).toBe(true);
      expect(execSearch[0].matchedSnippet).toBeDefined();
    });
  });

  describe("TASK-P5-02: Cr8TechNG Creative Toolkits & AI Workflows", () => {
    it("generates broadcast-compliant subtitles and social clips with mandatory watermarks", () => {
      const cr8tech = new Cr8TechCreativeEngine();

      // 1. Generate WebVTT subtitles in Nigerian Pidgin
      const vttTrack = cr8tech.generateSubtitles({
        id: "SUB-PIDGIN-01",
        assetId: "AST-SERIES-EP01",
        language: "PCM",
        format: "WEBVTT",
        cues: [
          { startTimeSec: 0, endTimeSec: 2.5, text: "How una dey people of Nigeria" },
          {
            startTimeSec: 2.5,
            endTimeSec: 6.0,
            text: "Today on Nigezie Xtreme we bring you the hottest street music and pure afrobeat vibes direct from Lagos mainland.",
          },
        ],
      });

      expect(vttTrack.format).toBe("WEBVTT");
      expect(vttTrack.renderedContent).toContain("WEBVTT");
      expect(vttTrack.renderedContent).toContain("00:00:00.000 --> 00:00:02.500");
      expect(vttTrack.cues[1].text.includes("\n")).toBe(true); // Verifies auto-wrap under 42 chars

      // 2. Generate SRT format
      const srtTrack = cr8tech.generateSubtitles({
        id: "SUB-YORUBA-01",
        assetId: "AST-ORISUN-EP01",
        language: "YOR",
        format: "SRT",
        cues: [{ startTimeSec: 10, endTimeSec: 14.5, text: "E kaabo si orisun tv loni" }],
      });

      expect(srtTrack.format).toBe("SRT");
      expect(srtTrack.renderedContent).toContain("00:00:10,000 --> 00:00:14,500");

      // 3. Social clipping tool with mandatory watermark
      const clipJob = cr8tech.createSocialClipJob({
        id: "CLIP-ORIS-PROMO-01",
        sourceAssetId: "AST-ORISUN-EP01",
        title: "Orisun Cultural Promo 15s",
        startTimeSec: 120,
        durationSec: 15,
        aspectRatio: "PORTRAIT_9_16",
        watermarkBrand: "ORIS",
      });

      expect(clipJob.status).toBe("COMPLETED");
      expect(clipJob.watermarkBrand).toBe("ORIS");
      expect(clipJob.outputUrl).toContain("CLIP-ORIS-PROMO-01_ORIS_PORTRAIT_9_16.mp4");
    });
  });

  describe("TASK-P5-03: Agentic Operating System (AOS) Governance & Supervisors", () => {
    it("enforces agent kill switches, supervisor review queues, and blocks unsupervised sensitive actions", () => {
      const aos = new AgenticOperatingSystem();

      // 1. Register Autonomous Agent
      aos.registerAgent({
        id: "AGENT-SCHED-01",
        name: "Broadcast Schedule Optimization Assistant",
        role: "SCHEDULE_OPTIMIZER",
        operationalScope: "Generates recommended schedule grid updates to minimize break gaps.",
        allowedTools: ["analyzeScheduleGaps", "proposeScheduleAmendment"],
        maxDailyActions: 50,
        actionsPerformedToday: 0,
        status: "ACTIVE",
        killSwitchEngaged: false,
        registeredAt: new Date(),
      });

      // 2. Hard Policy Gate: Agent direct unsupervised execution of HIGH or CRITICAL actions is BLOCKED
      expect(() => aos.executeDirectAction("AGENT-SCHED-01", "HIGH_SCHEDULE")).toThrow(
        "[AOS-GATE-01] HARD POLICY BLOCK: Action criticality 'HIGH_SCHEDULE' requires human supervisor approval."
      );

      expect(() => aos.executeDirectAction("AGENT-SCHED-01", "CRITICAL_FINANCIAL")).toThrow(
        "[AOS-GATE-01] HARD POLICY BLOCK: Action criticality 'CRITICAL_FINANCIAL' requires human supervisor approval."
      );

      // 3. Agent submits proposal instead into HITL review queue
      const proposal = aos.submitProposal({
        id: "PROP-SCHED-001",
        agentId: "AGENT-SCHED-01",
        criticality: "HIGH_SCHEDULE",
        targetDomain: "BROADCAST",
        proposedAction: "Shift Orisun Prime Time movie back by 120 seconds to fit breaking news ident",
        payload: { channel: "ORIS", slotStart: "20:00", adjustmentSeconds: 120 },
      });

      expect(proposal.status).toBe("PENDING_SUPERVISOR_APPROVAL");
      expect(proposal.auditHashSha256).toBeDefined();
      expect(aos.getPendingProposals().length).toBe(1);

      // 4. Human supervisor approves proposal
      const reviewed = aos.supervisorReview({
        proposalId: "PROP-SCHED-001",
        supervisorId: "HUMAN-TRAFFIC-DIRECTOR-01",
        decision: "APPROVE",
        notes: "Approved: News bulletin extension verified with master control.",
      });

      expect(reviewed.status).toBe("APPROVED");
      expect(reviewed.approvedBy).toBe("HUMAN-TRAFFIC-DIRECTOR-01");
      expect(aos.getPendingProposals().length).toBe(0);

      // 5. Global Kill Switch engagement
      aos.engageGlobalKillSwitch("Suspected anomaly in schedule optimizer tool calls");

      // Agent cannot submit any proposals while kill switch is engaged
      expect(() =>
        aos.submitProposal({
          id: "PROP-SCHED-002",
          agentId: "AGENT-SCHED-01",
          criticality: "LOW_INFORMATIONAL",
          targetDomain: "BROADCAST",
          proposedAction: "Log warning",
          payload: {},
        })
      ).toThrow("[AOS-EXEC-01] Proposal rejected: Global Agent Kill Switch is engaged.");

      // Disengage global kill switch
      aos.disengageGlobalKillSwitch();
      expect(aos.getAgent("AGENT-SCHED-01")?.status).toBe("ACTIVE");

      // Verify audit trail logged everything
      const auditLog = aos.getAuditTrail();
      expect(auditLog.length).toBeGreaterThanOrEqual(4);
      expect(auditLog.some((a) => a.actionTaken.includes("GLOBAL_KILL_SWITCH_ENGAGED"))).toBe(true);
      expect(auditLog.some((a) => a.wasBlocked === true)).toBe(true);
    });
  });
});
