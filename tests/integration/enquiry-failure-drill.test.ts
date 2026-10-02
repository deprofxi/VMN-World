import { describe, it, expect, beforeEach } from "vitest";
import {
  submitCommercialEnquiry,
  recoverEnquiryOutcome,
  getEnquiryByReference,
  listEnquiries,
  retryDownstreamRouting,
  setDownstreamRoutingAvailable,
  resetEnquiryStoreForTesting,
} from "../../src/modules/hub/enquiry/index.js";
import {
  setFeatureFlagOverride,
  resetAllFeatureFlagOverrides,
} from "../../src/core/feature-flags/index.js";

describe("Commercial Enquiry Vertical Slice (VS-RL1-01 / J-RL1-03 / HX-01)", () => {
  beforeEach(() => {
    resetEnquiryStoreForTesting();
    resetAllFeatureFlagOverrides();
  });

  // AC-UI-RL1-R03-01
  it("AC-01: valid input creates one durable intake record and returns a receipt reference", async () => {
    const res = await submitCommercialEnquiry({
      fullName: "Ngozi Adeyemi",
      email: "ngozi@adeyemimedia.ng",
      phone: "+2348031234567",
      organisationName: "Adeyemi Brand Communications",
      message: "We want to sponsor primetime spots on Orisun TV and Nigezie Xtreme.",
      ndprConsent: true,
    });

    expect(res.duplicate).toBe(false);
    expect(res.enquiry.reference).toMatch(/^ENQ-\d{8}-[A-F0-9]{4}$/);
    expect(res.enquiry.submissionStatus).toBe("RECEIVED");
    expect(res.enquiry.fullName).toBe("Ngozi Adeyemi");
  });

  // AC-UI-RL1-R03-02
  it("AC-02: invalid input creates no accepted record and identifies corrective action", async () => {
    // Missing full name
    await expect(
      submitCommercialEnquiry({
        fullName: "",
        email: "test@example.com",
        message: "Hello",
        ndprConsent: true,
      })
    ).rejects.toThrowError(/Full name is required/);

    // Invalid email
    await expect(
      submitCommercialEnquiry({
        fullName: "Test User",
        email: "invalid-email",
        message: "Hello world",
        ndprConsent: true,
      })
    ).rejects.toThrowError(/valid email address is required/);

    // Missing NDPR consent
    await expect(
      submitCommercialEnquiry({
        fullName: "Test User",
        email: "test@example.com",
        message: "Hello world inquiry",
        ndprConsent: false,
      })
    ).rejects.toThrowError(/NDPR data-processing consent is required/);

    expect(listEnquiries().length).toBe(0);
  });

  // AC-UI-RL1-R03-03
  it("AC-03: repeating the same operation with same payload does not create duplicate", async () => {
    const key = "client-tx-12345";
    const payload = {
      fullName: "Tunde Bakare",
      email: "tunde@brandhaus.ng",
      message: "Q4 Advertising slot reservation request.",
      ndprConsent: true,
      idempotencyKey: key,
    };

    const first = await submitCommercialEnquiry(payload);
    expect(first.duplicate).toBe(false);

    const second = await submitCommercialEnquiry(payload);
    expect(second.duplicate).toBe(true);
    expect(second.enquiry.reference).toBe(first.enquiry.reference);
    expect(listEnquiries().length).toBe(1);
  });

  // AC-UI-RL1-R03-04
  it("AC-04: lost response after acceptance can be recovered without duplicate effect", async () => {
    const key = "lost-response-key-999";
    const res = await submitCommercialEnquiry({
      fullName: "Chioma Okonjo",
      email: "chioma@vmnl-partner.ng",
      message: "Partnership expansion inquiry for talent accelerator.",
      ndprConsent: true,
      idempotencyKey: key,
    });

    const recovered = recoverEnquiryOutcome(key);
    expect(recovered).not.toBeNull();
    expect(recovered?.reference).toBe(res.enquiry.reference);
    expect(recovered?.fullName).toBe("Chioma Okonjo");
  });

  // AC-UI-RL1-R03-05
  it("AC-05: downstream routing failure preserves the accepted enquiry in operator queue", async () => {
    setDownstreamRoutingAvailable(false);

    const res = await submitCommercialEnquiry({
      fullName: "Farouk Al-Hassan",
      email: "farouk@kanomedia.ng",
      message: "Broadcast distribution inquiry for Northern Nigeria coverage.",
      ndprConsent: true,
    });

    expect(res.enquiry.submissionStatus).toBe("RECEIVED");
    expect(res.enquiry.routingStatus).toBe("ROUTING_FAILED");
    expect(res.enquiry.routingError).toContain("timeout");

    // Persisted in operator queue
    const inQueue = getEnquiryByReference(res.enquiry.reference);
    expect(inQueue).not.toBeNull();
    expect(inQueue?.routingStatus).toBe("ROUTING_FAILED");
  });

  // AC-UI-RL1-R03-06
  it("AC-06: authorised operator can find enquiry, inspect state and queue position", async () => {
    const res = await submitCommercialEnquiry({
      fullName: "Funke Akindele",
      email: "funke@scenone.ng",
      vertical: "ONE_STUDIOS",
      message: "Co-production facility booking enquiry.",
      ndprConsent: true,
    });

    const queue = listEnquiries("ONE_STUDIOS");
    expect(queue.length).toBe(1);
    expect(queue[0].reference).toBe(res.enquiry.reference);
  });

  // AC-UI-RL1-R03-08
  it("AC-08: retry after routing recovery preserves receipt and completes downstream handoff", async () => {
    setDownstreamRoutingAvailable(false);
    const res = await submitCommercialEnquiry({
      fullName: "Emeka Ike",
      email: "emeka@filmhouse.ng",
      message: "Cinema and TV distribution query.",
      ndprConsent: true,
    });
    expect(res.enquiry.routingStatus).toBe("ROUTING_FAILED");

    // Network restored
    setDownstreamRoutingAvailable(true);
    const updated = await retryDownstreamRouting(res.enquiry.reference);

    expect(updated.routingStatus).toBe("ROUTED");
    expect(updated.downstreamLeadId).toBeDefined();
    expect(updated.reference).toBe(res.enquiry.reference);
    expect(updated.retryCount).toBe(1);
  });

  // AC-UI-RL1-R03-11
  it("AC-11: disabling new intake prevents acceptance cleanly while preserving existing enquiries", async () => {
    // 1. Submit valid enquiry while enabled
    const valid = await submitCommercialEnquiry({
      fullName: "Prior Enquirer",
      email: "prior@example.com",
      message: "Submitted before maintenance window.",
      ndprConsent: true,
    });
    expect(valid.enquiry.submissionStatus).toBe("RECEIVED");

    // 2. Kill switch triggered
    await setFeatureFlagOverride("FF_PUBLIC_ENQUIRY_INTAKE", false, "admin@vmnl.ng", "Downtime");

    // 3. New submission rejected with HTTP 403
    await expect(
      submitCommercialEnquiry({
        fullName: "Blocked Enquirer",
        email: "blocked@example.com",
        message: "Attempt during maintenance.",
        ndprConsent: true,
      })
    ).rejects.toThrowError(/is currently disabled by governance flag/);

    // 4. Prior record remains durable and accessible
    const preserved = getEnquiryByReference(valid.enquiry.reference);
    expect(preserved).not.toBeNull();
    expect(preserved?.fullName).toBe("Prior Enquirer");
  });

  // Mandatory 10-Step Operational Deliberate Failure Drill (§5.7 / §8.3)
  it("Mandatory Failure Drill: 10-step complete verification drill", async () => {
    const drillKey = "failure-drill-tx-001";

    // Step 1: Submit synthetic enquiry with downstream failure simulation
    setDownstreamRoutingAvailable(false);
    const submitResult = await submitCommercialEnquiry({
      fullName: "Drill Test Participant",
      email: "drill@vmnl-resilience.ng",
      phone: "+2348099887766",
      organisationName: "Resilience Testing Labs",
      message: "Synthetic enquiry for operational failure drill verification.",
      ndprConsent: true,
      idempotencyKey: drillKey,
    });

    // Step 2 & 3: Simulate response loss and recover original operation
    const recovered = recoverEnquiryOutcome(drillKey);
    expect(recovered).not.toBeNull();

    // Step 4: Confirm exactly one accepted record exists
    expect(listEnquiries().length).toBe(1);
    expect(recovered?.reference).toBe(submitResult.enquiry.reference);

    // Step 5 & 6: Verify record is visible in operator queue with ROUTING_FAILED
    const queueRecord = getEnquiryByReference(recovered!.reference);
    expect(queueRecord?.routingStatus).toBe("ROUTING_FAILED");

    // Step 7: Restore downstream routing
    setDownstreamRoutingAvailable(true);

    // Step 8 & 9: Retry original handoff and confirm single downstream record
    const retried = await retryDownstreamRouting(recovered!.reference);
    expect(retried.routingStatus).toBe("ROUTED");
    expect(retried.downstreamLeadId).toMatch(/^CRM-LEAD-/);

    // Step 10: Verify state integrity
    expect(retried.retryCount).toBe(1);
    expect(listEnquiries().length).toBe(1);
  });
});
