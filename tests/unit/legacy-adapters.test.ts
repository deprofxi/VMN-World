import { describe, it, expect } from "vitest";
import { VmnlControlMigrationAdapter, VmnlTalentAcceleratorAdapter } from "../../src/core/legacy/index.js";

describe("Legacy Systems Migration & Adapters (CC-ARCH-001)", () => {

  it("should normalize legacy vmnl_control invoice with strict 7-way finance separation", () => {
    const legacyInvoice = {
      id: 42,
      invoice_number: "INV-LEGACY-0042",
      client_id: 101,
      client_name: "Dangote Group",
      total_amount: 10000000,
      vat_amount: 750000,
      status: "paid" as const,
      created_at: "2026-08-01",
      paid_at: "2026-08-15",
    };

    const normalized = VmnlControlMigrationAdapter.normalizeInvoice(legacyInvoice);
    expect(normalized.isCompliant7Way).toBe(true);
    expect(normalized.contractValueNgn).toBe(10000000);
    expect(normalized.talentPayableAmountNgn).toBe(6000000); // 60% talent split
    expect(normalized.partnerShareAmountNgn).toBe(1500000); // 15% partner split
    expect(normalized.cashCollectedAmountNgn).toBe(10000000);
    expect(normalized.status).toBe("SETTLED");
  });

  it("should verify migration readiness for all 43 enterprise tables in vmnl_control", () => {
    const readiness = VmnlControlMigrationAdapter.verifyMigrationReadiness();
    expect(readiness.totalLegacyTables).toBe(43);
    expect(readiness.readinessPercent).toBe(100);
    expect(readiness.criticalEntities).toContain("campaigns");
    expect(readiness.criticalEntities).toContain("equipment_checkouts");
  });

  it("should synchronize legacy talent records with canonical KYC and tier mapping", () => {
    const legacyTalent = {
      id: 77,
      full_name: "Burna Boy Live Session Player",
      stage_name: "AfroSaxMaster",
      email: "afrosax@vmn.ng",
      primary_skill: "Saxophone / Live Brass",
      experience_years: 9,
      cohort_name: "AFCA-COHORT-2024",
      kyc_verified: 1,
      created_at: "2024-05-10",
    };

    const synced = VmnlTalentAcceleratorAdapter.syncLegacyTalent(legacyTalent);
    expect(synced.stageName).toBe("AfroSaxMaster");
    expect(synced.tier).toBe("MASTER"); // >= 8 years
    expect(synced.kycStatus).toBe("VERIFIED");
    expect(synced.skills).toContain("Saxophone / Live Brass");
  });
});
