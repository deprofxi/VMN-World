import { describe, expect, it } from "vitest";
import {
  DESIGN_TOKENS,
  validateControlAccessibility,
  ComponentRenderer,
} from "../../src/web/components/index.js";
import {
  CorporatePortalService,
  PublicChannelsHub,
  HubShowcaseService,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
} from "../../src/web/public/index.js";

describe("Phase 7: Public Digital Surfaces & User Experience", () => {
  describe("TASK-P7-04: UI/UX Component System & Accessibility Conformance", () => {
    it("enforces WCAG 2.2 AA touch targets, complete state matrix, and accessible HTML", () => {
      // 1. Accessibility validator checks
      const validControl = validateControlAccessibility({
        widthPx: 48,
        heightPx: 44,
        hasAccessibleLabel: true,
        hasAriaState: true,
      });
      expect(validControl.compliant).toBe(true);

      const invalidControl = validateControlAccessibility({
        widthPx: 32, // Under 44px
        heightPx: 32,
        hasAccessibleLabel: false,
        hasAriaState: false,
      });
      expect(invalidControl.compliant).toBe(false);
      expect(invalidControl.errors.length).toBeGreaterThanOrEqual(2);

      // 2. Render Button with complete states
      const defaultBtn = ComponentRenderer.renderButton({
        label: "Submit Application",
        variant: "primary",
      });
      expect(defaultBtn).toContain('class="vmn-btn vmn-btn-primary vmn-btn-state-default"');
      expect(defaultBtn).toContain("min-width: 44px; min-height: 44px;");

      const loadingBtn = ComponentRenderer.renderButton({
        label: "Processing",
        variant: "primary",
        state: "loading",
      });
      expect(loadingBtn).toContain('aria-busy="true"');
      expect(loadingBtn).toContain('aria-disabled="true"');
      expect(loadingBtn).toContain("vmn-spinner");

      const disabledBtn = ComponentRenderer.renderButton({
        label: "Locked",
        variant: "secondary",
        state: "disabled",
      });
      expect(disabledBtn).toContain('aria-disabled="true"');

      // 3. Render Input field with error state and aria-invalid
      const errorInput = ComponentRenderer.renderInputField({
        id: "email",
        label: "Email Address",
        value: "bad-email",
        state: "error",
        errorMessage: "Please enter a valid business email address.",
        required: true,
      });
      expect(errorInput).toContain('aria-invalid="true"');
      expect(errorInput).toContain('role="alert"');
      expect(errorInput).toContain("Please enter a valid business email address.");

      // 4. Render Empty state
      const emptyState = ComponentRenderer.renderEmptyState(
        "No Active Broadcast Outages",
        "All StarTimes DTT and DTH carriers are operating normally.",
        "Refresh Status"
      );
      expect(emptyState).toContain('role="status"');
      expect(emptyState).toContain("No Active Broadcast Outages");
      expect(emptyState).toContain("Refresh Status");
    });
  });

  describe("TASK-P7-01: Public VMN Corporate Portal", () => {
    it("provides SEO structured metadata and three enterprise pillars overview", () => {
      const seo = CorporatePortalService.getSeoMetadata();
      expect(seo.title).toContain("Virtual Media Network Limited");
      expect(seo.openGraph["og:type"]).toBe("website");

      const html = CorporatePortalService.renderOverviewHtml();
      expect(html).toContain("Linear Television & Broadcast Operations");
      expect(html).toContain("Creative Economy Hub");
      expect(html).toContain("Azeebo+ Direct-to-Consumer Ecosystem");
    });
  });

  describe("TASK-P7-02: Linear Television Public Channels Hub", () => {
    it("retrieves channel parameters and renders live On-Air-Now and Up-Next EPG widgets", () => {
      const nxtr = PublicChannelsHub.getChannel("NXTR");
      expect(nxtr.dttChannel).toBe(428);
      expect(nxtr.dthChannel).toBe(312);

      const orisun = PublicChannelsHub.getChannel("ORIS");
      expect(orisun.dttChannel).toBe(430);

      const imbd = PublicChannelsHub.getChannel("IMBD");
      expect(imbd.dttChannel).toBe(432);

      // Render On Air Now Widget
      const widgetHtml = PublicChannelsHub.renderNowAndNextWidget(
        "NXTR",
        {
          title: "Afrobeat Top 10 Countdown",
          episodeTitle: "Episode 24",
          startTime: "20:00",
          endTime: "21:00",
          synopsis: "The hottest ten tracks in West Africa ranked by weekly audience streams.",
          rating: "PG-13",
        },
        {
          title: "Street Jam Live Sessions",
          startTime: "21:00",
          endTime: "22:00",
          synopsis: "Live acoustic performances from emerging Lagos artists.",
          rating: "16+",
        }
      );

      expect(widgetHtml).toContain("ON AIR NOW");
      expect(widgetHtml).toContain("Afrobeat Top 10 Countdown — Episode 24");
      expect(widgetHtml).toContain("COMING UP NEXT (21:00)");
      expect(widgetHtml).toContain("Street Jam Live Sessions");
      expect(widgetHtml).toContain("StarTimes Ch 428 DTT / 312 DTH");
    });
  });

  describe("TASK-P7-03: Creative Economy Hub Public Showcases & Inquiries", () => {
    it("retrieves showcases and captures inquiries with CRM routing and acknowledgment", () => {
      const hubService = new HubShowcaseService();

      const afcaShowcase = HubShowcaseService.getShowcase("AFCA_ACADEMY");
      expect(afcaShowcase.title).toBe("African Film & Creative Arts Academy");

      // Invariant: Invalid email throws
      expect(() =>
        hubService.submitInquiry({
          vertical: "TALENT_ACCELERATOR",
          fullName: "John Doe",
          email: "invalid-email",
          message: "I want to apply for talent onboarding.",
        })
      ).toThrow("[HUB-INQ-01] Valid email address is required.");

      // Invariant: Short message throws
      expect(() =>
        hubService.submitInquiry({
          vertical: "TALENT_ACCELERATOR",
          fullName: "John Doe",
          email: "john@example.com",
          message: "short",
        })
      ).toThrow("[HUB-INQ-02] Inquiry message must be at least 10 characters.");

      // Successful inquiry
      const inquiry = hubService.submitInquiry({
        vertical: "VCF_CONTENT_FUND",
        fullName: "Adebayo Salami",
        email: "adebayo@nollywoodfilms.ng",
        organisationName: "Royal Arts Media",
        message: "We have an episodic period drama seeking slate co-financing and StarTimes/Azeebo+ distribution.",
      });

      expect(inquiry.id).toContain("INQ-VCF_");
      expect(inquiry.status).toBe("ROUTED_TO_CRM");
      expect(inquiry.acknowledgmentMessage).toContain("A representative will contact you within 24 business hours.");
      expect(hubService.getInquiries().length).toBe(1);
    });
  });

  describe("Broadcast Operational Screen Surfaces (SCR-BCST-01 to 33)", () => {
    it("renders the 33-screen operational surface catalog with filters and badges", () => {
      const allScreensHtml = renderScreensCatalogHtml();
      expect(allScreensHtml).toContain("Broadcast Operational Screen Inventory");
      expect(allScreensHtml).toContain("SCR-BCST-01");
      expect(allScreensHtml).toContain("SCR-BCST-33");
      expect(allScreensHtml).toContain("33 of 33 Screens Ready");
      expect(allScreensHtml).toContain("All (33)");

      // Filter by role
      const playoutScreensHtml = renderScreensCatalogHtml("PlayoutOperator");
      expect(playoutScreensHtml).toContain("SCR-BCST-22");
      expect(playoutScreensHtml).toContain("SCR-BCST-23");
      expect(playoutScreensHtml).not.toContain("SCR-BCST-01"); // ExecutiveLeader
    });

    it("renders individual screen detail view with RBAC, routes, and navigation", () => {
      const detailHtml = renderScreenDetailHtml("SCR-BCST-23");
      expect(detailHtml).toContain("Live Playout Status Monitor");
      expect(detailHtml).toContain("PlayoutOperator");
      expect(detailHtml).toContain("/broadcast/playout/live");
      expect(detailHtml).toContain("trigger_filler");
      expect(detailHtml).toContain("manual_override");
      expect(detailHtml).toContain("Screen #23 of 33");

      // Invalid screen ID
      const notFoundHtml = renderScreenDetailHtml("SCR-UNKNOWN-99");
      expect(notFoundHtml).toContain("Screen Surface Not Found");
      expect(notFoundHtml).toContain("SCR-UNKNOWN-99");
    });
  });
});
