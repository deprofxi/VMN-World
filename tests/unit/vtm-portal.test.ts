import { describe, expect, it, beforeEach } from "vitest";
import {
  renderVtmTermsReviewHtml,
  renderVtmMarketplaceHtml,
  MockVtmContract,
} from "../../src/web/portal/vtm-portal.js";
import { setFeatureFlagOverride } from "../../src/core/feature-flags/index.js";

describe("Phase 6: VTM Talent Marketplace & Engagement Terms", () => {
  beforeEach(() => {
    setFeatureFlagOverride("FF_VTM_MARKETPLACE_DEPLOYMENT", true);
  });

  const sampleContract: MockVtmContract = {
    id: "ctr-2026-vtm-001",
    contractNumber: "VTM-CTR-2026-0042",
    projectName: "Lagos Noir Season 2",
    productionCompany: "ONE Studios Africa",
    roleTitle: "Lead Cinematographer",
    totalCompensationNgn: 5000000,
    netTalentAmountNgn: 4250000, // 85%
    platformCommissionNgn: 750000, // 15%
    startDate: "15 Oct 2026",
    endDate: "30 Nov 2026",
    isSigned: false,
    milestones: [
      {
        title: "Pre-production & Lighting Rig Design",
        amountNgn: 1500000,
        deliverable: "Approved Rigging Specs",
        status: "FUNDS_ESCROWED",
      },
      {
        title: "Principal Photography Wrap",
        amountNgn: 3500000,
        deliverable: "Raw Graded Rushes",
        status: "FUNDS_ESCROWED",
      },
    ],
  };

  describe("Engagement Terms Review Screen (UX-VTM-008, 009)", () => {
    it("renders contract details and production information", () => {
      const html = renderVtmTermsReviewHtml(sampleContract);
      expect(html).toContain("VTM-CTR-2026-0042");
      expect(html).toContain("Lagos Noir Season 2");
      expect(html).toContain("ONE Studios Africa");
      expect(html).toContain("Lead Cinematographer");
    });

    it("strictly displays the 85/15 economic compensation breakdown (UX-VTM-009)", () => {
      const html = renderVtmTermsReviewHtml(sampleContract);
      // Verify Gross
      expect(html).toContain("₦5,000,000");
      // Verify 85% Net
      expect(html).toContain("₦4,250,000");
      expect(html).toContain("Net Talent Payout (85%)");
      // Verify 15% Commission
      expect(html).toContain("₦750,000");
      expect(html).toContain("Platform Fee (15%)");
      // Verify Escrow Guarantee
      expect(html).toContain("VMN Restricted Escrow");

      // Verify mathematical invariant
      expect(sampleContract.netTalentAmountNgn + sampleContract.platformCommissionNgn).toBe(
        sampleContract.totalCompensationNgn
      );
      expect(sampleContract.netTalentAmountNgn / sampleContract.totalCompensationNgn).toBe(0.85);
    });

    it("renders unsigned digital signature acceptance form (UX-VTM-010)", () => {
      const html = renderVtmTermsReviewHtml(sampleContract);
      expect(html).toContain('name="legalSignature"');
      expect(html).toContain('name="termsAffirmation"');
      expect(html).toContain("Sign & Execute Engagement Contract");
    });

    it("renders verified digital signature seal when contract is signed", () => {
      const signedContract: MockVtmContract = {
        ...sampleContract,
        isSigned: true,
        signedAt: "2026-09-29 14:30 WAT",
        signedHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      };

      const html = renderVtmTermsReviewHtml(signedContract);
      expect(html).toContain("Legally Binding Signature Executed");
      expect(html).toContain("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
      expect(html).not.toContain("Sign & Execute Engagement Contract");
    });
  });

  describe("Talent Opportunity Matching & Marketplace (UX-VTM-005, 006)", () => {
    const mockOpps = [
      {
        id: "opp-1",
        title: "Feature Film Steadicam Operator",
        production: "Azeebo Pictures",
        category: "Cinematography",
        matchScore: 94,
        budgetPerDayNgn: 300000,
        buyoutTier: "GLOBAL_ALL_MEDIA" as const,
      },
    ];

    it("renders opportunity cards with match score and daily rate", () => {
      const html = renderVtmMarketplaceHtml(mockOpps);
      expect(html).toContain("Feature Film Steadicam Operator");
      expect(html).toContain("94% Match Score");
      expect(html).toContain("₦300,000 / day");
      expect(html).toContain("2.5x Multiplier");
    });

    it("displays feature disabled notice when FF_VTM_MARKETPLACE_DEPLOYMENT is disabled", () => {
      setFeatureFlagOverride("FF_VTM_MARKETPLACE_DEPLOYMENT", false);
      const html = renderVtmMarketplaceHtml(mockOpps);
      expect(html).toContain("Currently Inactive");
      expect(html).toContain("FF_VTM_MARKETPLACE_DEPLOYMENT");
    });
  });
});
