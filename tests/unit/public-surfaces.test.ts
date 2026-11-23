import { describe, expect, it } from "vitest";
import { effectiveTouchTargetPx } from "../helpers/stylesheet.js";
import {
  validateControlAccessibility,
  ComponentRenderer,
  renderStyleguideHtml,
} from "../../src/web/components/index.js";
import { renderMasterLayout } from "../../src/web/public/dashboard.js";
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
  renderHomePageHtml,
  renderChannelsPageHtml,
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
      expect(defaultBtn).toContain('class="vmn-btn vmn-btn-primary vmn-btn-state-default');
      // DT-202 (docs/decisions/design-task-de-citation.md) / TSK-04: the 44px floor is delivered by a generated utility
      // class in the shipped stylesheet, not an inline attribute. Assert the
      // rule the browser actually receives.
      const target = effectiveTouchTargetPx(defaultBtn);
      expect(target.minWidth).toBeGreaterThanOrEqual(44);
      expect(target.minHeight).toBeGreaterThanOrEqual(44);

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
    it("ships the mobile trigger and its no-JS fallback, not a second copy of the nav", () => {
      const html = renderMasterLayout("Public Page", "<p>Body</p>", "/");

      // The trigger is a real button in the header, and it is not removed from
      // the tab order (the old assertion guarded a `tabindex="-1"` regression).
      expect(html).toContain('id="vmn-mobile-menu-btn"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).not.toContain('tabindex="-1"');

      // The drawer, its backdrop and the sticky action bar are built by
      // /assets/app.js from the header nav, so the server ships neither the
      // elements nor an aria-controls pointing at one that does not exist yet.
      expect(html).not.toContain('id="vmn-mobile-drawer"');
      expect(html).not.toContain('id="vmn-drawer-backdrop"');
      expect(html).not.toContain('aria-controls');
      expect(html).not.toContain('vmn-mobile-action-bar');
      expect(html).not.toContain('vmn-drawer-link');

      // One nav list, in the header, is the only copy of the nine destinations.
      expect((html.match(/nav class="vmn-nav-links"/g) ?? []).length).toBe(1);

      // No-JS: the stylesheet's collapsed nav comes back as a wrapped list and
      // the trigger disappears rather than sitting there unable to open anything.
      expect(html).toContain("<noscript><style>");
      expect(html).toContain("nav.vmn-nav-links{display:flex!important");
      expect(html).toContain(".vmn-hamburger-btn{display:none!important}");
    });

  it("provides SEO structured metadata and three enterprise pillars overview", () => {
      const seo = CorporatePortalService.getSeoMetadata();
      expect(seo.title).toContain("Virtual Media Network Limited");
      expect(seo.openGraph["og:type"]).toBe("website");
      expect(seo.description).not.toContain("24/7 linear broadcast");

      const html = CorporatePortalService.renderOverviewHtml();
      expect(html).toContain("Linear Television Channel Profiles");
      expect(html).toContain("Carriage and transmission details require independent verification");
      expect(html).not.toContain("Ch 428 DTT");
      expect(html).toContain("Creative Economy Hub");
      expect(html).toContain("Azeebo+ Federated Service");
    });
  });

  describe("TASK-P7-02: Linear Television Public Channels Hub", () => {
    it("retrieves channel parameters and renders live On-Air-Now and Up-Next EPG widgets", () => {
      const nxtr = PublicChannelsHub.getChannel("NXTR");
      expect(nxtr.dttChannel).toBeUndefined();
      expect(nxtr.dthChannel).toBeUndefined();
      expect(nxtr.isProvisional).toBe(true);

      const orisun = PublicChannelsHub.getChannel("ORIS");
      expect(orisun.dttChannel).toBeUndefined();
      expect(orisun.isProvisional).toBe(true);

      const imbd = PublicChannelsHub.getChannel("IMBD");
      expect(imbd.dttChannel).toBeUndefined();
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

      expect(widgetHtml).toContain("Carriage verification does not establish live transmission status");
      expect(widgetHtml).toContain("approved schedule and verified live source are connected");
      expect(widgetHtml).not.toContain("ON AIR NOW");
      expect(widgetHtml).not.toContain("StarTimes Ch 428");
      expect(widgetHtml).not.toContain("Afrobeat Top 10 Countdown");
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
      expect(inquiry.status).toBe("RECEIVED");
      expect(inquiry.acknowledgmentMessage).toContain("environment-local reference only");
      expect(inquiry.acknowledgmentMessage).not.toContain("routed to our operations team");
      expect(inquiry.acknowledgmentMessage).not.toContain("within 24 business hours");
      expect(hubService.getInquiries().length).toBe(1);
    });

    it("enforces inquiry status transitions and queues a non-promissory notification acknowledgment (T-23, B-22)", () => {
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
      expect(enqueuedJobs[0].payload.htmlContent).toContain("routing, delivery, response timing, and durable retention are not confirmed");

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
      expect(html).toContain("Local Inquiry Review Queue");
      expect(html).toContain("not a CRM connection");
      expect(html).toContain("Emeka Okafor");
      expect(html).toContain("ONE_STUDIOS");
      expect(html).toContain("RECEIVED");
      expect(html).toContain("Awaiting manual review; no downstream routing is confirmed");
      expect(html).not.toContain("Mark Contacted");
    });
  });

  describe("Broadcast Operational Screen Surfaces (SCR-BCST-01 to 33)", () => {
    it("renders the 33-screen operational surface catalog with filters and badges", () => {
      const allScreensHtml = renderScreensCatalogHtml();
      expect(allScreensHtml).toContain("Broadcast Operational Screen Inventory");
      expect(allScreensHtml).toContain("SCR-BCST-01");
      expect(allScreensHtml).toContain("SCR-BCST-33");
      // TSK-25 measured 0/33 surfaces serving engine data, so the catalog states that
      // instead of claiming readiness. The fabricated badge must stay absent.
      expect(allScreensHtml).toContain("0 fully engine-sourced");
      expect(allScreensHtml).not.toContain("33 of 33 Screens Ready");
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

    it("renders a truthful unavailable state when no approved public schedule is connected", () => {
      const html = renderPublicScheduleHtml();
      expect(html).toContain("Linear Broadcast Schedule & EPG");
      expect(html).toContain("Schedule not verified");
      expect(html).toContain("No approved, source-backed schedule is connected");
      expect(html).not.toContain("ON AIR NOW");
      expect(html).not.toContain("Morning Afro-Beats Digest");
      expect(html).not.toContain("DTT Ch. 428");
    });

    it("does not publish unverified carriage numbers or live status on channel surfaces", () => {
      const homeHtml = renderHomePageHtml();
      const channelsHtml = renderChannelsPageHtml();
      expect(homeHtml).toContain("Carriage details unverified");
      expect(homeHtml).not.toMatch(/Ch 42[0-9] DTT/);
      expect(homeHtml).not.toContain("Live On Air");
      expect(homeHtml).not.toContain("broadcast in HD 1080i50");
      expect(homeHtml).toContain("programming, transmission format, and operating status are not verified");
      expect(channelsHtml).toContain("Carriage details unverified");
      expect(channelsHtml).toContain("Live transmission status is not available from a verified source");
      expect(channelsHtml).not.toContain("StarTimes DTT 428");
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
      expect(html).toContain("A hash alone does not establish");
      expect(html).not.toContain("immutable cryptographic reference hash");
    });

    it("labels the preliminary privacy information as unreviewed and avoids unsupported security claims", () => {
      const html = renderPrivacyPageHtml();
      expect(html).toContain("Privacy Policy & Data Protection Notice");
      expect(html).toContain("not a reviewed privacy notice");
      expect(html).toContain("require approval by VMNL's accountable privacy and legal reviewers");
      expect(html).not.toContain("AES-256");
      expect(html).not.toContain("TLS 1.3");
      expect(html).not.toContain("Compliant with the Nigeria Data Protection Act");
    });

    it("states the accessibility target without asserting unverified conformance", () => {
      const html = renderAccessibilityPageHtml();
      expect(html).toContain("Accessibility Statement — Conformance Not Yet Assessed");
      expect(html).toContain("WCAG 2.2 Level AA is a target, not a verified conformance claim");
      expect(html).toContain("Keyboard-only, screen-reader, contrast, zoom/reflow, and mobile reviews are outstanding");
      expect(html).not.toContain("Complete keyboard traversal");
    });
  });
});
