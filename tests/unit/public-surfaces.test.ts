import { describe, expect, it } from "vitest";
import {
  validateControlAccessibility,
  ComponentRenderer,
  renderStyleguideHtml,
} from "../../src/web/components/index.js";
import {
  CorporatePortalService,
  PublicChannelsHub,
  HubShowcaseService,
  renderScreensCatalogHtml,
  renderScreenDetailHtml,
  renderCrmQueueWorkspaceHtml,
  renderAboutPageHtml,
  renderPublicScheduleHtml,
  renderAdvertisingSponsorshipHtml,
  renderEnquiryContactHtml,
  renderHelpPageHtml,
  renderPrivacyPageHtml,
  renderAccessibilityPageHtml,
} from "../../src/web/public/index.js";
import { getConfig } from "../../src/core/config/index.js";

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
      const config = getConfig();
      const nxtr = PublicChannelsHub.getChannel("NXTR");
      expect(nxtr.dttChannel).toBe(config.NXTR_DTT_CHANNEL);
      expect(nxtr.dthChannel).toBe(config.NXTR_DTH_CHANNEL);
      expect(nxtr.isProvisional).toBe(true);

      const orisun = PublicChannelsHub.getChannel("ORIS");
      expect(orisun.dttChannel).toBe(config.ORIS_DTT_CHANNEL);
      expect(orisun.isProvisional).toBe(true);

      const imbd = PublicChannelsHub.getChannel("IMBD");
      expect(imbd.dttChannel).toBe(config.IMBD_DTT_CHANNEL);
      expect(imbd.isProvisional).toBe(true);

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

    it("enforces inquiry status transitions and enqueues notification acknowledgment (T-23, B-22)", () => {
      const enqueuedJobs: any[] = [];
      const mockQueue = {
        enqueue: (type: string, payload: any) => {
          enqueuedJobs.push({ type, payload });
          return { id: "job-001", type, status: "QUEUED" };
        },
      };

      const hubService = new HubShowcaseService({ queueWorker: mockQueue });
      const inq = hubService.submitInquiry({
        vertical: "TALENT_ACCELERATOR",
        fullName: "Chidinma Nwosu",
        email: "chidinma@soundstage.ng",
        message: "Applying for the 2026 AFCA Sound Engineering Masterclass.",
        autoRouteToCrm: false,
      });

      expect(inq.status).toBe("RECEIVED");
      expect(enqueuedJobs.length).toBe(1);
      expect(enqueuedJobs[0].type).toBe("NOTIFICATION_DELIVERY");
      expect(enqueuedJobs[0].payload.to).toBe("chidinma@soundstage.ng");

      // State transition 1: RECEIVED -> ROUTED_TO_CRM
      const routed = hubService.transitionStatus(inq.id, "ROUTED_TO_CRM");
      expect(routed.status).toBe("ROUTED_TO_CRM");

      // Invalid transition: ROUTED_TO_CRM -> RECEIVED (not allowed)
      expect(() => hubService.transitionStatus(inq.id, "RECEIVED")).toThrow(/Invalid inquiry status transition/);

      // State transition 2: ROUTED_TO_CRM -> CONTACTED
      const contacted = hubService.transitionStatus(inq.id, "CONTACTED");
      expect(contacted.status).toBe("CONTACTED");

      // Invalid transition from terminal state
      expect(() => hubService.transitionStatus(inq.id, "ROUTED_TO_CRM")).toThrow(/Invalid inquiry status transition/);
    });

    it("renders CRM operations queue workspace view (T-23, B-22)", () => {
      const hubService = new HubShowcaseService();
      hubService.submitInquiry({
        vertical: "ONE_STUDIOS",
        fullName: "Emeka Okafor",
        email: "emeka@filmworks.ng",
        message: "Studio 2 soundstage reservation for 3-day commercial shoot.",
      });

      const html = renderCrmQueueWorkspaceHtml(hubService.getInquiries());
      expect(html).toContain("CRM Inquiry & Onboarding Operations Queue");
      expect(html).toContain("Emeka Okafor");
      expect(html).toContain("ONE_STUDIOS");
      expect(html).toContain("ROUTED_TO_CRM");
      expect(html).toContain("Mark Contacted");
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

    it("renders the living styleguide surface (DT-206)", () => {
      const styleguideHtml = renderStyleguideHtml();
      expect(styleguideHtml).toContain("VMNL Living Design System & Styleguide");
      expect(styleguideHtml).toContain("Button State Matrix");
      expect(styleguideHtml).toContain("Status Chips");
    });
  });

  describe("Expanded Public Surface Screens (UX-PUB-002 to 028)", () => {
    it("renders About page (UX-PUB-002) with governance and corporate mission", () => {
      const html = renderAboutPageHtml();
      expect(html).toContain("Virtual Media Network Limited");
      expect(html).toContain("Corporate Governance");
      expect(html).toContain("Enterprise Mission & Mandate");
    });

    it("renders Public Schedule page (UX-PUB-008) across broadcast channels", () => {
      const html = renderPublicScheduleHtml();
      expect(html).toContain("Linear Broadcast Schedule & EPG");
      expect(html).toContain("ON AIR NOW (WAT)");
      expect(html).toContain("Morning Afro-Beats Digest");
    });

    it("renders Advertising & Sponsorship page (UX-PUB-009) with rate cards and packages", () => {
      const html = renderAdvertisingSponsorshipHtml();
      expect(html).toContain("Advertising, Sponsorship & Brand Integration");
      expect(html).toContain("Linear TV Spots");
      expect(html).toContain("Programme Sponsorship");
      expect(html).toContain("Fusion Events Activation");
    });

    it("renders Commercial Enquiry and Contact page (UX-PUB-025) with intake form", () => {
      const html = renderEnquiryContactHtml();
      expect(html).toContain("Commercial Enquiry & Partnership Request");
      expect(html).toContain('name="fullName"');
      expect(html).toContain('name="email"');
      expect(html).toContain('name="vertical"');
    });

    it("renders Help Center (UX-PUB-026) with searchable FAQs and support links", () => {
      const html = renderHelpPageHtml();
      expect(html).toContain("VMN Help & Resource Directory");
      expect(html).toContain("StarTimes");
      expect(html).toContain("AFCA Film & Creative Arts Academy");
      expect(html).toContain("Proof-of-Air Report");
    });

    it("renders Privacy Policy (UX-PUB-027) with NDPR compliance", () => {
      const html = renderPrivacyPageHtml();
      expect(html).toContain("Privacy Policy & Data Protection Notice");
      expect(html).toContain("Nigeria Data Protection Act (NDPA)");
      expect(html).toContain("Data Protection Officer");
    });

    it("renders Accessibility Statement (UX-PUB-028) with WCAG 2.2 Level AA conformance", () => {
      const html = renderAccessibilityPageHtml();
      expect(html).toContain("Accessibility Statement");
      expect(html).toContain("WCAG 2.2 Level AA");
      expect(html).toContain("Keyboard Navigation");
      expect(html).toContain("Color Contrast");
    });
  });
});
