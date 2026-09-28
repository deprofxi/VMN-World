/**
 * VMNL Enterprise Production Core & Background Infrastructure Unit Tests
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §15, §19, §21, §46
 */

import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  TalentRepository,
  CampaignRepository,
  ScheduleRepository,
  InvoiceRepository,
} from "../../src/core/database/repositories/index.js";
import { EnterpriseQueueWorker } from "../../src/core/queue/index.js";
import { NotificationService } from "../../src/core/notifications/index.js";
import {
  buildBinaryProofOfAirPdf,
  generateProofOfAirDocument,
  registerProofOfAirCertificate,
  getProofOfAirCertificate,
} from "../../src/modules/broadcast/asrun/index.js";
import {
  renderAfcaVerificationHtml,
  renderPoaVerificationHtml,
} from "../../src/web/public/verification.js";
import {
  ENTERPRISE_WORKSPACES,
  renderWorkspaceDirectoryHtml,
  renderWorkspaceDeskHtml,
} from "../../src/web/workspace/surface-bc.js";

describe("Production Core & Background Infrastructure", () => {
  describe("1. Database Repositories (Prisma CRUD with Resilient Fallback)", () => {
    it("manages Talent Profiles with complete lifecycle", async () => {
      const repo = new TalentRepository();
      const talent = await repo.createTalent({
        personId: "per-001",
        stageName: "DJ Xtreme",
        tier: "VERIFIED",
        skills: ["DJing", "Music Production"],
        rateCardAmount: 250000,
        rateCardCurrency: "NGN",
      });

      expect(talent.id).toBeDefined();
      expect(talent.stageName).toBe("DJ Xtreme");
      expect(talent.verificationStatus).toBe("PENDING");

      const fetched = await repo.getTalentById(talent.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.stageName).toBe("DJ Xtreme");

      const byPerson = await repo.getTalentByPersonId("per-001");
      expect(byPerson?.id).toBe(talent.id);

      const verified = await repo.updateVerification(talent.id, "VERIFIED");
      expect(verified?.verificationStatus).toBe("VERIFIED");
      expect(verified?.verifiedAt).toBeDefined();

      const list = await repo.listTalent({ tier: "VERIFIED" });
      expect(list.length).toBe(1);

      const deleted = await repo.deleteTalent(talent.id);
      expect(deleted).toBe(true);
      expect(await repo.getTalentById(talent.id)).toBeNull();
    });

    it("manages Commercial Campaigns with status transitions", async () => {
      const repo = new CampaignRepository();
      const campaign = await repo.createCampaign({
        campaignCode: "CMP-NIG-2026-001",
        clientName: "Guaranty Trust Holding Company",
        brand: "GTCO Digital",
        bookedSpots: 50,
        totalContractValueNgn: 15000000,
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-31"),
      });

      expect(campaign.campaignCode).toBe("CMP-NIG-2026-001");
      expect(campaign.status).toBe("BOOKED");

      const found = await repo.getCampaignByCode("CMP-NIG-2026-001");
      expect(found?.clientName).toBe("Guaranty Trust Holding Company");

      const updated = await repo.updateStatus("CMP-NIG-2026-001", "ACTIVE");
      expect(updated?.status).toBe("ACTIVE");

      const activeList = await repo.listCampaigns("ACTIVE");
      expect(activeList.length).toBe(1);

      await repo.deleteCampaign("CMP-NIG-2026-001");
      expect(await repo.getCampaignByCode("CMP-NIG-2026-001")).toBeNull();
    });

    it("manages Programmes, Episodes, and As-Run log records", async () => {
      const repo = new ScheduleRepository();
      const programme = await repo.createProgramme({
        code: "PRG-URBAN-01",
        title: "Urban Beats Live",
        channelCode: "NXTR",
        category: "Music",
        totalEpisodes: 24,
      });

      expect(programme.title).toBe("Urban Beats Live");

      const episode = await repo.createEpisode({
        episodeCode: "EP-URBAN-101",
        programmeCode: "PRG-URBAN-01",
        episodeNumber: 1,
        title: "Afro-Beats Countdown Episode 1",
        durationSeconds: 3600,
      });

      expect(episode.episodeCode).toBe("EP-URBAN-101");
      const epList = await repo.listEpisodes("PRG-URBAN-01");
      expect(epList.length).toBe(1);

      const asRun = await repo.recordAsRun({
        channelCode: "NXTR",
        transmissionDate: new Date(),
        totalPlannedSpots: 10,
        totalAiredSpots: 10,
        matchedSpots: 10,
        discrepancyCount: 0,
        reconciliationStatus: "VERIFIED_ALL_MATCHED",
        certificateHashSha256: "abcdef123456",
      });

      expect(asRun.reconciliationStatus).toBe("VERIFIED_ALL_MATCHED");
      const records = await repo.listAsRunRecords("NXTR");
      expect(records.length).toBe(1);
    });

    it("enforces 7-Way Financial Separation in Contracts & Settlements", async () => {
      const repo = new InvoiceRepository();
      const contract = await repo.createContract({
        contractNumber: "CNT-2026-AD-001",
        title: "Quarterly StarTimes Broadcast Sponsorship",
        contractValue: 50000000,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-03-31"),
        status: "SIGNED",
      });

      expect(contract.contractNumber).toBe("CNT-2026-AD-001");

      const settlement = await repo.createSettlement({
        settlementNumber: "SET-2026-001",
        contractId: contract.id,
        contractValue: 50000000,
        gmvAmount: 50000000,
        invoicedAmount: 50000000,
        recognizedAmount: 45000000,
        cashCollectedAmount: 50000000,
        talentPayableAmount: 15000000,
        partnerShareAmount: 10000000,
        status: "PENDING",
      });

      expect(settlement.invoicedAmount).toBe(50000000);
      expect(settlement.talentPayableAmount).toBe(15000000);

      const reconciled = await repo.updateSettlementStatus("SET-2026-001", "RECONCILED");
      expect(reconciled?.status).toBe("RECONCILED");
      expect(reconciled?.reconciledAt).toBeDefined();
    });
  });

  describe("2. Background Queue Worker (BullMQ Compatible)", () => {
    it("enqueues and processes background tasks with concurrency and retries", async () => {
      const queue = new EnterpriseQueueWorker({ concurrency: 2 });
      let processedCount = 0;

      queue.registerHandler<{ channelCode: string }, any>("EPG_GENERATION", async (job) => {
        processedCount++;
        return { generatedFor: job.payload.channelCode, timestamp: new Date() };
      });

      const job1 = queue.enqueue("EPG_GENERATION", { channelCode: "NXTR" });
      const job2 = queue.enqueue("EPG_GENERATION", { channelCode: "ORIS" });

      expect(job1.status).toBe("QUEUED");
      expect(job2.status).toBe("QUEUED");

      const processed = await queue.processNextBatch();
      expect(processed).toBe(2);
      expect(processedCount).toBe(2);
      expect(queue.getJob(job1.id)?.status).toBe("COMPLETED");

      const metrics = queue.getMetrics();
      expect(metrics.totalProcessed).toBe(2);
      expect(metrics.totalFailed).toBe(0);
    });

    it("sends failed jobs exceeding maxRetries to Dead-Letter Queue (DLQ)", async () => {
      const queue = new EnterpriseQueueWorker();
      queue.registerHandler("WEBHOOK_DISPATCH", async () => {
        throw new Error("Target webhook endpoint returned HTTP 504 Gateway Timeout");
      });

      const failingJob = queue.enqueue(
        "WEBHOOK_DISPATCH",
        { endpoint: "https://partner.com/webhook" },
        { maxRetries: 1 }
      );

      // Attempt 1 -> re-queued
      await queue.processNextBatch();
      expect(queue.getJob(failingJob.id)?.status).toBe("QUEUED");
      expect(queue.getJob(failingJob.id)?.attempts).toBe(1);

      // Attempt 2 -> exceeded maxRetries (1) -> DEAD_LETTER
      await queue.processNextBatch();
      expect(queue.getJob(failingJob.id)?.status).toBe("DEAD_LETTER");
      expect(queue.getJob(failingJob.id)?.lastError).toContain("504 Gateway Timeout");

      const metrics = queue.getMetrics();
      expect(metrics.totalDeadLetter).toBe(1);
    });
  });

  describe("3. Unified Notification Delivery Service (SMTP/SES & Termii)", () => {
    it("dispatches transactional email with sandbox fallback and unique messageId", async () => {
      const service = new NotificationService();
      const res = await service.sendEmail({
        to: "sponsor@brand.com",
        subject: "Proof-of-Air Performance Certificate Ready",
        htmlContent: "<h1>Your commercial has aired on Nigezie Xtreme</h1>",
      });

      expect(res.success).toBe(true);
      expect(res.channel).toBe("EMAIL");
      expect(res.messageId).toContain("msg-eml-");
      expect(res.recipient).toBe("sponsor@brand.com");
    });

    it("normalizes Nigerian phone numbers and dispatches SMS", async () => {
      const service = new NotificationService();
      const res = await service.sendSms({
        to: "08031234567",
        message: "Your AFCA Academy interview is confirmed for tomorrow 10am.",
      });

      expect(res.success).toBe(true);
      expect(res.channel).toBe("SMS");
      expect(res.recipient).toBe("2348031234567"); // Normalized to E.164 without plus
      expect(res.messageId).toContain("msg-sms-");
    });
  });

  describe("4. Binary PDF Generation for Proof-of-Air Certificates", () => {
    it("builds a standards-compliant PDF-1.4 binary buffer with xref and trailer", () => {
      const now = new Date();
      const payload = "NXTR:CMP-001:SPT-001:" + now.toISOString();
      const sig = crypto.createHash("sha256").update(payload).digest("hex");

      const pdfBuffer = buildBinaryProofOfAirPdf({
        certificateId: "POA-TEST-001",
        channelCode: "NXTR",
        clientName: "Cadbury Nigeria",
        campaignId: "CMP-001",
        spotId: "SPT-001",
        airedTimestamp: now,
        durationSeconds: 30,
        cryptographicSignature: sig,
        carrierLockVerified: true,
        generatedAt: now,
        verificationUrl: "http://localhost:4000/verify/poa/POA-TEST-001",
      });

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      const pdfText = pdfBuffer.toString("binary");
      expect(pdfText.startsWith("%PDF-1.4")).toBe(true);
      expect(pdfText).toContain("xref");
      expect(pdfText).toContain("trailer");
      expect(pdfText.trim().endsWith("%%EOF")).toBe(true);
      expect(pdfText).toContain("CERTIFICATE OF BROADCAST PERFORMANCE & PROOF-OF-AIR");
      expect(pdfText).toContain("Cadbury Nigeria");
      expect(pdfText).toContain("POA-TEST-001");
    });

    it("generates Proof-of-Air document containing base64 and registers in registry", () => {
      const now = new Date();
      const certData = {
        certificateId: "POA-REG-999",
        channelCode: "ORIS",
        clientName: "MTN Nigeria",
        campaignId: "CMP-MTN-01",
        spotId: "SPT-MTN-01",
        airedTimestamp: now,
        durationSeconds: 60,
        cryptographicSignature: "hash1234567890",
        isVerified: true,
        generatedAt: now,
      };

      const doc = generateProofOfAirDocument(certData);
      expect(doc.documentBase64).toBeDefined();
      expect(doc.verificationUrl).toContain("/verify/poa/POA-REG-999");

      // Verify base64 decodes back to PDF
      const decoded = Buffer.from(doc.documentBase64, "base64").toString("binary");
      expect(decoded.startsWith("%PDF-1.4")).toBe(true);

      registerProofOfAirCertificate({
        ...certData,
        documentBase64: doc.documentBase64,
        verificationUrl: doc.verificationUrl,
      });

      const retrieved = getProofOfAirCertificate("POA-REG-999");
      expect(retrieved).toBeDefined();
      expect(retrieved?.clientName).toBe("MTN Nigeria");
    });
  });

  describe("5. Public Verification HTML Renderers (WCAG 2.2 AA)", () => {
    it("renders authentic AFCA certificate verification view", () => {
      const html = renderAfcaVerificationHtml({
        valid: true,
        id: "AFCA-CERT-2026-XYZ",
        certificate: {
          certificateId: "AFCA-CERT-2026-XYZ",
          studentId: "stu-001",
          courseId: "crs-001",
          courseTitle: "Afro-Beats Sound Engineering Masterclass",
          cohortId: "coh-001",
          cohortCode: "AFCA-2026-C1",
          issueDate: new Date(),
          finalScorePercent: 92,
          distinction: "DISTINCTION",
          verificationTokenSha256: "sha256token1234567890",
          verificationUrl: "https://vmng.tv/verify/afca/AFCA-CERT-2026-XYZ",
          qrPayload: "{}",
        },
      });

      expect(html).toContain("Official AFCA Graduation Credential");
      expect(html).toContain("DISTINCTION (92%)");
      expect(html).toContain("stu-001");
      expect(html).toContain("Afro-Beats Sound Engineering Masterclass");
      expect(html).toContain("sha256token1234567890");
    });

    it("renders unverified AFCA certificate fallback with error styling", () => {
      const html = renderAfcaVerificationHtml({
        valid: false,
        id: "AFCA-UNKNOWN-000",
      });

      expect(html).toContain("Certificate Not Found");
      expect(html).toContain("AFCA Certificate Verification Failed");
      expect(html).toContain("AFCA-UNKNOWN-000");
    });

    it("renders audit-grade Proof-of-Air verification view with download button", () => {
      const html = renderPoaVerificationHtml({
        valid: true,
        id: "POA-3WAY-NXTR-001",
        certificate: {
          certificateId: "POA-3WAY-NXTR-001",
          channelCode: "NXTR",
          clientName: "Nigerian Breweries Plc",
          campaignId: "CMP-BEER-01",
          spotId: "SPT-001",
          airedTimestamp: new Date(),
          durationSeconds: 45,
          cryptographicSignature: "playout_hash_987654321",
          isVerified: true,
          generatedAt: new Date(),
          documentBase64: "JVBERi0xLjQK...",
        },
      });

      expect(html).toContain("Certificate of Commercial Performance (Proof-of-Air)");
      expect(html).toContain("Nigerian Breweries Plc");
      expect(html).toContain("Nigezie Xtreme");
      expect(html).toContain("Download PDF Certificate");
      expect(html).toContain("StarTimes Uplink Lock Confirmed");
      expect(html).toContain("playout_hash_987654321");
    });
  });

  describe("6. Expanded Specialist Workspaces (48 Desks per R1.2A §46)", () => {
    it("contains exactly 48 operational desks across 5 specialist domains", () => {
      expect(ENTERPRISE_WORKSPACES.length).toBe(48);

      const keys = ENTERPRISE_WORKSPACES.map((d) => d.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(48); // Zero duplicate keys

      // Ensure key broadcast & playout desks are present
      expect(keys).toContain("mcr");
      expect(keys).toContain("traffic");
      expect(keys).toContain("epg");
      expect(keys).toContain("asrun");
      expect(keys).toContain("uplink");
      expect(keys).toContain("scte");
      expect(keys).toContain("soundstage");
      expect(keys).toContain("payouts");
      expect(keys).toContain("bankrecon");
    });

    it("renders the 48-desk directory HTML with category sections", () => {
      const html = renderWorkspaceDirectoryHtml();
      expect(html).toContain("48 of 48 Desks Operational");
      expect(html).toContain("Executive & Core");
      expect(html).toContain("Broadcast Operations");
      expect(html).toContain("Hub Specialist");
      expect(html).toContain("Commercial & Finance");
      expect(html).toContain("Tech & Governance");
    });

    it("renders individual desk HTML for any valid desk key", () => {
      const mcrHtml = renderWorkspaceDeskHtml("mcr");
      expect(mcrHtml).toContain("Master Control Room (MCR) Playout Supervisor");
      expect(mcrHtml).toContain("MCRSupervisor");
      expect(mcrHtml).toContain("/workspace/mcr");

      const soundstageHtml = renderWorkspaceDeskHtml("soundstage");
      expect(soundstageHtml).toContain("Studio Soundstage, Acoustical & Set Operations");
      expect(soundstageHtml).toContain("StudioManager");

      const invalidHtml = renderWorkspaceDeskHtml("non-existent-desk");
      expect(invalidHtml).toContain("Workspace Desk Not Found");
    });
  });
});
