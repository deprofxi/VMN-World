import { describe, it, expect } from "vitest";
import {
  RightsRecordEntity,
  SettlementEntity,
  isRightsActive,
  validateSettlementInvariants,
} from "../../src/core/domain/types.js";

describe("Canonical Domain Invariants & Rules (TASK-P1-01)", () => {
  it("should validate that rights are active within valid start and expiry dates", () => {
    const validRights: RightsRecordEntity = {
      id: "rights-001",
      assetId: "asset-100",
      title: "Nigezie Top 10 Countdown - Ep 4",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      exclusivity: true,
      startDate: new Date("2026-01-01T00:00:00Z"),
      expiryDate: new Date("2026-12-31T23:59:59Z"),
      subLicensable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const midYear = new Date("2026-06-15T12:00:00Z");
    expect(isRightsActive(validRights, midYear)).toBe(true);

    const pastExpiry = new Date("2027-01-01T00:00:00Z");
    expect(isRightsActive(validRights, pastExpiry)).toBe(false);

    const beforeStart = new Date("2025-12-31T23:59:59Z");
    expect(isRightsActive(validRights, beforeStart)).toBe(false);
  });

  it("should reject rights records where expiry date is before or equal to start date", () => {
    const invertedRights: RightsRecordEntity = {
      id: "rights-bad",
      assetId: "asset-101",
      title: "Bad Rights",
      rightsType: "BROADCAST_LINEAR",
      territory: "NG",
      mediaType: "LINEAR_TV",
      exclusivity: true,
      startDate: new Date("2026-12-31T00:00:00Z"),
      expiryDate: new Date("2026-01-01T00:00:00Z"),
      subLicensable: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => isRightsActive(invertedRights)).toThrowError(/expiryDate must be after startDate/);
  });

  it("should enforce mandatory 7-way financial separation invariants", () => {
    const validSettlement: SettlementEntity = {
      id: "stl-001",
      settlementNumber: "VMNL-STL-2026-0001",
      contractId: "ctr-001",
      status: "PENDING",
      contractValue: 5000000,
      gmvAmount: 5000000,
      invoicedAmount: 5000000,
      recognizedAmount: 2500000,
      cashCollectedAmount: 2500000, // <= invoiced
      talentPayableAmount: 1500000,
      partnerShareAmount: 1000000, // 1.5M + 1.0M = 2.5M <= 5M GMV
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateSettlementInvariants(validSettlement);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("should detect invalid financial conditions (cash collected > invoiced amount)", () => {
    const invalidSettlement: SettlementEntity = {
      id: "stl-invalid",
      settlementNumber: "VMNL-STL-2026-0002",
      status: "PENDING",
      contractValue: 1000000,
      gmvAmount: 1000000,
      invoicedAmount: 500000,
      recognizedAmount: 500000,
      cashCollectedAmount: 800000, // Cannot collect more than invoiced without unbilled credit!
      talentPayableAmount: 200000,
      partnerShareAmount: 100000,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateSettlementInvariants(invalidSettlement);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Cash collected cannot exceed invoiced amount");
  });

  // TSK-59: the rule this function carried until 2026-10-09 was
  // `talent + partner > gmv && gmv > 0`, so a settlement that recorded no gross value at all waived
  // the sum rule silently and every such row passed. Zero GMV is a value, not an exemption.
  it("refuses a zero-GMV settlement that still owes talent or a rightsholder", () => {
    const zeroGmv: SettlementEntity = {
      id: "stl-zero-gmv",
      settlementNumber: "VMNL-STL-2026-0003",
      status: "PENDING",
      contractValue: 0,
      gmvAmount: 0,
      invoicedAmount: 0,
      recognizedAmount: 0,
      cashCollectedAmount: 0,
      talentPayableAmount: 250000,
      partnerShareAmount: 0,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = validateSettlementInvariants(zeroGmv);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Talent payables and partner share cannot exceed GMV");
  });

  it("still accepts a zero-GMV settlement that owes nothing", () => {
    const nothingOwed: SettlementEntity = {
      id: "stl-zero-everything",
      settlementNumber: "VMNL-STL-2026-0004",
      status: "PENDING",
      contractValue: 0,
      gmvAmount: 0,
      invoicedAmount: 0,
      recognizedAmount: 0,
      cashCollectedAmount: 0,
      talentPayableAmount: 0,
      partnerShareAmount: 0,
      currency: "NGN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(validateSettlementInvariants(nothingOwed).valid).toBe(true);
  });
});
