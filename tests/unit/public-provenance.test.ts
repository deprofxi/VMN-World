import { describe, expect, it } from "vitest";
import { reconcileAsRunLogs } from "../../src/modules/broadcast/asrun/index.js";
import { PublicChannelsHub } from "../../src/web/public/channels.js";
import { renderAccessibilityPageHtml, renderAdvertisingSponsorshipHtml, renderHelpPageHtml, renderPrivacyPageHtml, renderEnquiryContactHtml } from "../../src/web/public/pub-screens.js";
import { renderChannelDetailPageHtml, renderPublicProgrammeDetailHtml, renderAzeeboGatewayPageHtml } from "../../src/web/public/surface-a.js";
import { renderPrototypesViewerHtml } from "../../src/web/public/prototypes.js";
import { renderPoaVerificationHtml } from "../../src/web/public/verification.js";
import { HubShowcaseService, renderEnquiryFormHtml, renderVerticalLandingPageHtml } from "../../src/web/public/hub.js";
import { renderHomePageHtml, renderHubPageHtml } from "../../src/web/public/dashboard.js";
import { CorporatePortalService } from "../../src/web/public/corporate.js";

describe("public provenance claims", () => {
  it("does not mark an as-run-only PoA record verified or render it as a public proof", () => {
    const [certificate] = reconcileAsRunLogs("NXTR", [{
      spotId: "SPOT-PROV-1",
      clientName: "Sample Client",
      campaignId: "CAMPAIGN-PROV-1",
      actualStartTime: new Date("2026-10-01T12:00:00Z"),
      actualDurationSeconds: 30,
      expectedDurationSeconds: 30,
      status: "AIRED_FULL",
    }]).certificates;

    expect(certificate.isVerified).toBe(false);
    expect(certificate.carrierLockVerified).toBeUndefined();
    const html = renderPoaVerificationHtml({ valid: true, certificate, id: certificate.certificateId });
    expect(html).toContain("No source-verified Proof-of-Air record is available");
    expect(html).not.toContain("Proof-of-Air Record Matched");
    expect(html).not.toContain("Download PDF Certificate");
  });

  it("keeps caller-supplied programme data unavailable without a source adapter", () => {
    const html = PublicChannelsHub.renderNowAndNextWidget("NXTR", {
      title: "Unapproved Sample", startTime: "12:00", endTime: "13:00", synopsis: "Sample", rating: "G",
    }, {
      title: "Unapproved Next", startTime: "13:00", endTime: "14:00", synopsis: "Sample", rating: "G",
    });
    expect(html).toContain("Carriage verification does not establish live transmission status");
    expect(html).not.toContain("ON AIR NOW");
    expect(html).not.toContain("Unapproved Sample");
  });

  it("keeps schedule, programme, and federation pages clear of unsupported operational claims", () => {
    const schedule = renderChannelDetailPageHtml("NXTR");
    const programme = renderPublicProgrammeDetailHtml("PRG-SAMPLE");
    const azeebo = renderAzeeboGatewayPageHtml();
    expect(schedule).toContain("No approved, source-backed schedule is connected");
    expect(schedule).toContain("Carriage:</strong> Details unverified");
    expect(programme).toContain("Programme details are unavailable until an approved catalogue record is connected");
    expect(programme).toContain("Channel association is not available from a verified programme record");
    expect(programme).not.toContain("Broadcast on <strong>Nigezie Xtreme");
    expect(programme).not.toContain("highest-energy daily");
    expect(azeebo).toContain("gateway — status unavailable");
    expect(azeebo).not.toContain("Federated Gateway Active");
  });

  it("labels material and commercial prototype scenarios as illustrative and unverified", () => {
    const terms = renderPrototypesViewerHtml({ screen: "terms" });
    const client = renderPrototypesViewerHtml({ screen: "client" });
    const proof = renderPrototypesViewerHtml({ screen: "proof" });
    const vtm = renderVerticalLandingPageHtml("VTM_MANAGEMENT");
    const studios = renderVerticalLandingPageHtml("ONE_STUDIOS");
    const fund = renderVerticalLandingPageHtml("VCF_CONTENT_FUND");
    const ads = renderAdvertisingSponsorshipHtml();
    const help = renderHelpPageHtml();
    const home = renderHomePageHtml();
    const hub = renderHubPageHtml();

    expect(terms).toContain("no actual rights grant, commercial terms, tax treatment, escrow, or acceptance");
    expect(terms).toContain("Prototype only — acceptance unavailable");
    expect(terms).not.toContain("Perpetual, worldwide broadcast exploitation rights");
    expect(client).toContain("not a client commitment");
    expect(proof).toContain("No operator authorization is represented");
    expect(proof).not.toContain("Make-Good Approved");
    expect(vtm).toContain("Rates, briefs, escrow availability, and commercial terms are not verified");
    expect(studios).toContain("Illustrative service concepts and sample scenarios only");
    expect(fund).toContain("not an approved term");
    expect(vtm).not.toContain("100% funds held in Tier-1 custody");
    expect(vtm).not.toContain("₦350,000 / day");
    expect(fund).not.toContain("20% preferred IRR hurdle");
    expect(studios).not.toContain("24ft x 18ft x 10m");
    expect(renderVerticalLandingPageHtml("TEND_DISTRIBUTION")).not.toContain("Licensed (Virgin/BA)");
    expect(renderVerticalLandingPageHtml("AFRO_FUSION_COMMUNITY")).toContain("capacity, access, and availability are not verified");
    expect(renderVerticalLandingPageHtml("FUSION_EVENTS")).not.toContain("Upcoming Event");
    expect(renderVerticalLandingPageHtml("HEADSPACE_NG")).toContain("no compendium or compliance advice is represented");
    expect(renderVerticalLandingPageHtml("CR8TECH_NG")).toContain("product capability, testing, security, and availability are not verified");
    expect(ads).toContain("request current, source-backed reach and terms");
    expect(help).toContain("A hash alone does not establish");
    expect(home).toContain("programming, transmission format, and operating status are not verified");
    expect(home).not.toContain("HD 1080i50");
    expect(hub).toContain("service availability, training, financing, rights, and monetization are not verified");
    expect(CorporatePortalService.renderOverviewHtml()).toContain("Accreditation, facilities, funding, services, and distribution availability require current independent confirmation");
  });

  it("does not represent inquiry routing or turnaround as an established service", () => {
    const service = new HubShowcaseService();
    const inquiry = service.submitInquiry({
      vertical: "TALENT_ACCELERATOR",
      fullName: "Sample User",
      email: "sample@example.invalid",
      message: "This is a provenance test inquiry.",
    });
    expect(inquiry.status).toBe("RECEIVED");
    expect(inquiry.acknowledgmentMessage).toContain("environment-local reference only");
    expect(inquiry.acknowledgmentMessage).not.toContain("within 24 business hours");
    expect(renderEnquiryFormHtml("TALENT_ACCELERATOR", "Sample")).toContain("response timing, and durable tracking are not guaranteed");
    expect(renderEnquiryContactHtml()).toContain("durable tracking are not guaranteed");
  });

  it("does not claim privacy or accessibility compliance before review", () => {
    const privacy = renderPrivacyPageHtml();
    const accessibility = renderAccessibilityPageHtml();
    expect(privacy).toContain("not a reviewed privacy notice");
    expect(privacy).not.toContain("AES-256");
    expect(privacy).not.toContain("TLS 1.3");
    expect(accessibility).toContain("Conformance Not Yet Assessed");
    expect(accessibility).toContain("target, not a verified conformance claim");
    expect(accessibility).not.toContain("Complete keyboard traversal");
  });
});
