import { describe, it, expect, beforeEach } from "vitest";
import {
  isFeatureEnabled,
  setFeatureFlagOverride,
  clearFeatureFlagOverride,
  resetAllFeatureFlagOverrides,
  getFeatureFlagState,
  getAllFeatureFlags,
  assertFeatureEnabled,
} from "../../src/core/feature-flags/index.js";

describe("Feature Flag Engine & Dual-Track Gating (TASK-01-02)", () => {
  beforeEach(() => {
    resetAllFeatureFlagOverrides();
  });

  it("should define all 28 feature flags with comprehensive metadata", () => {
    const allFlags = getAllFeatureFlags();
    const flagKeys = Object.keys(allFlags);
    expect(flagKeys.length).toBe(28);

    // Verify un-deferred flags are correctly marked
    expect(allFlags.FF_BROADCAST_WRITES_ENABLED.isUndeferred).toBe(true);
    expect(allFlags.FF_TALENT_ACCELERATOR_OPS.isUndeferred).toBe(true);
    expect(allFlags.FF_AFCA_FULL_LEARNING_LMS.isUndeferred).toBe(true);
    expect(allFlags.FF_VCF_CREATOR_MISSIONS.isUndeferred).toBe(true);
    expect(allFlags.FF_AGENTIC_OS_AUTOMATION.isUndeferred).toBe(true);
  });

  it("should evaluate default development environment flags correctly", () => {
    // In dev/test, public surface is enabled
    expect(isFeatureEnabled("FF_PUBLIC_SURFACE_ENABLED")).toBe(true);
    expect(isFeatureEnabled("FF_PUBLIC_ENQUIRY_INTAKE")).toBe(true);

    // Un-deferred operations default to enabled in dev
    expect(isFeatureEnabled("FF_BROADCAST_WRITES_ENABLED")).toBe(true);
    expect(isFeatureEnabled("FF_VCF_CREATOR_MISSIONS")).toBe(true);
  });

  it("should allow runtime overriding of a feature flag with audit logging", async () => {
    expect(isFeatureEnabled("FF_PUBLIC_ENQUIRY_INTAKE")).toBe(true);

    // Admin toggles off public intake via kill switch
    await setFeatureFlagOverride(
      "FF_PUBLIC_ENQUIRY_INTAKE",
      false,
      "admin@vmnl.ng",
      "Emergency intake suspension for DDOS mitigation"
    );

    expect(isFeatureEnabled("FF_PUBLIC_ENQUIRY_INTAKE")).toBe(false);

    const state = getFeatureFlagState("FF_PUBLIC_ENQUIRY_INTAKE");
    expect(state.enabled).toBe(false);
    expect(state.source).toBe("OVERRIDE");
    expect(state.override?.updatedBy).toBe("admin@vmnl.ng");
    expect(state.override?.reason).toContain("Emergency intake suspension");
  });

  it("should clear overrides and revert to environment default", async () => {
    await setFeatureFlagOverride("FF_BROADCAST_PLAYOUT_CONTROL", true);
    expect(isFeatureEnabled("FF_BROADCAST_PLAYOUT_CONTROL")).toBe(true);

    clearFeatureFlagOverride("FF_BROADCAST_PLAYOUT_CONTROL");
    const state = getFeatureFlagState("FF_BROADCAST_PLAYOUT_CONTROL");
    expect(state.source).not.toBe("OVERRIDE");
  });

  it("assertFeatureEnabled should throw HTTP 403 when feature is disabled", async () => {
    await setFeatureFlagOverride("FF_BROADCAST_PLAYOUT_CONTROL", false);

    expect(() =>
      assertFeatureEnabled("FF_BROADCAST_PLAYOUT_CONTROL", "Live source switching")
    ).toThrowError(/is currently disabled by governance flag/);

    try {
      assertFeatureEnabled("FF_BROADCAST_PLAYOUT_CONTROL", "Live source switching");
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FEATURE_DISABLED");
      expect(err.flagKey).toBe("FF_BROADCAST_PLAYOUT_CONTROL");
    }
  });
});
