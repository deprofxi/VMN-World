import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const OUTPUT_PDF = path.resolve("pages.pdf");

// Read screen register
const screenRegister = JSON.parse(fs.readFileSync("docs/decisions/screen-register.json", "utf8"));
const broadcastScreensRaw = fs.readFileSync("src/modules/broadcast/screens/index.ts", "utf8");

// Extract 33 broadcast screens
const broadcastScreens = [...broadcastScreensRaw.matchAll(/\{\s*screenNumber:\s*(\d+),\s*screenId:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*route:\s*"([^"]+)",\s*primaryRole:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*permittedActions:\s*\[([^\]]+)\]\s*\}/g)].map(m => ({
  screenNumber: parseInt(m[1]),
  screenId: m[2],
  name: m[3],
  route: m[4],
  primaryRole: m[5],
  description: m[6],
  permittedActions: m[7].split(",").map(s => s.trim().replace(/"/g, ""))
}));

// Build comprehensive inventory data
const inventory = [
  {
    group: "Public Marketing, Channel Showcases & Discovery (UX-PUB)",
    authority: "UIUX-001 §4.1 / VMNL-AZP-VMN-BRD-PRD-001 R1.2A (§8–§10)",
    summary: "28 public-facing web experience surfaces covering linear TV networks (NXTR, Orisun, Isi Mbido), programme catalogues, corporate portal, and 10 Creative Economy Hub showcases.",
    screens: [
      {
        id: "UX-PUB-001",
        name: "Corporate Portal Front Door & Ecosystem Showcase",
        route: "/",
        sourceFile: "src/web/public/dashboard.ts",
        renderer: "renderHomePageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "Navbar (Brand Logo, MegaMenu, Mobile Drawer Toggle)",
          "HeroBanner (Network Headline, CTA Buttons)",
          "FeaturedChannelsCarousel (NXTR, Orisun, Isi Mbido Badges)",
          "HubDirectoryGrid (10 Hub Verticals)",
          "CorporateMetricsRow (Channels, Hours, Community Reach)",
          "Footer (Legal Disclaimer, Navigation Links, Design System Links)",
          "MobileDrawer (Slide-out Responsive Navigation)"
        ],
        description: "Primary corporate homepage presenting VMNL identity, linear channels, and creative economy gateways."
      },
      {
        id: "UX-PUB-002",
        name: "Linear Channels Overview & Portfolio",
        route: "/channels",
        sourceFile: "src/web/public/dashboard.ts",
        renderer: "renderChannelsPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ChannelPortfolioHeader",
          "ChannelCardGrid (Interactive Profile Cards)",
          "BouquetTierBadges (DTT / DTH / Streaming)",
          "FrequencyParameterCard (Satellite, Transponder, PIDs)",
          "StarTimesChannelIndicator",
          "Footer"
        ],
        description: "Portfolio hub listing all three linear broadcast stations with carriage parameters."
      },
      {
        id: "UX-PUB-003",
        name: "Nigezie Xtreme (NXTR) Channel Profile",
        route: "/channels/nxtr",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderChannelDetailPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ChannelHeaderBanner (Brand identity, Urban Youth theme)",
          "NowNextWidget (Live On-Air & Upcoming Programmes)",
          "ProgrammeGuideGrid (Urban culture, Music, Lifestyle)",
          "CarriagePlatformCard (StarTimes DTT 136 / DTH 428)",
          "InteractiveEPGTimeline (Broadcast schedule preview)"
        ],
        description: "Dedicated profile and schedule for Nigezie Xtreme linear youth channel."
      },
      {
        id: "UX-PUB-004",
        name: "Orisun TV Channel Profile",
        route: "/channels/orisun",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderChannelDetailPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ChannelHeaderBanner (Yoruba Heritage & Culture theme)",
          "NowNextWidget (Live Broadcast & Upcoming Show)",
          "CulturalProgrammeCardGrid (Drama, Folklore, News)",
          "StarTimesCarriageCard (Channel ID & Dial parameters)",
          "CulturalScheduleViewer"
        ],
        description: "Dedicated profile and broadcast guide for Orisun TV (Yoruba culture and drama)."
      },
      {
        id: "UX-PUB-005",
        name: "Isi Mbido TV Channel Profile",
        route: "/channels/isimbido",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderChannelDetailPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ChannelHeaderBanner (Igbo Heritage & Tradition theme)",
          "NowNextWidget (Real-time Broadcast Indicator)",
          "HeritageProgrammeCardGrid (Customs, Language, Entertainment)",
          "StarTimesCarriageCard (Transmission Details)",
          "RegionalViewerGuide"
        ],
        description: "Dedicated profile and broadcast guide for Isi Mbido TV (Igbo culture and lifestyle)."
      },
      {
        id: "UX-PUB-006",
        name: "Public Programme Detail View",
        route: "/programmes/:id",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderPublicProgrammeDetailHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ProgrammeHeroHeader (Title, Genre, Rating, Synopsis)",
          "EpisodeMastersTable (List of Broadcast Versions & QC Flags)",
          "BroadcastSlotsGrid (Transmission Times by Channel)",
          "CastAndCrewRoster",
          "RelatedProgrammesCarousel"
        ],
        description: "Public catalogue entry displaying programme synopsis, episode list, and transmission slots."
      },
      {
        id: "UX-PUB-007",
        name: "Creative Economy Hub Portal",
        route: "/hub",
        sourceFile: "src/web/public/dashboard.ts",
        renderer: "renderHubPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "HubIntroHeader (Ecosystem Vision & Directory)",
          "VerticalCardsGrid (10 Hub Verticals with Direct Links)",
          "EcosystemMetricsBadge (Creators, Funding, Productions)",
          "InquiryIntakeBanner (Lead Capture CTA)"
        ],
        description: "Overview of VMNL's 10 creative industries initiatives and industry accelerator vertical gateways."
      },
      {
        id: "UX-PUB-008",
        name: "Talent Accelerator Network Showcase",
        route: "/hub/talent",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderTalentAcceleratorPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "VerticalHeroHeader (Talent Accelerator Mission)",
          "IntakeApplicationForm (Creative Roster Intake)",
          "CurriculumPreviewGrid",
          "IndustryPartnerBadges (Studio Affiliates)"
        ],
        description: "Public landing page for emerging talent discovery, masterclasses, and cohort intake."
      },
      {
        id: "UX-PUB-009",
        name: "AFCA Creative Academy Public Showcase",
        route: "/hub/afca",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderAfcaAcademyPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "AcademyHeroBanner (Creative Arts Accreditation)",
          "CourseCurriculumAccordion (Film, Audio, Screenwriting)",
          "TuitionAndScholarshipTable",
          "ApplyNowActionCard (/apply deep link)",
          "AccreditationBadge"
        ],
        description: "Official educational academy showcase detailing courses, faculties, and enrollment pathways."
      },
      {
        id: "UX-PUB-010",
        name: "Creators & Talent Gateway",
        route: "/hub/creators",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderCreatorsGatewayPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "CreatorPillarsGrid (IP Protection, Distribution, Monetisation)",
          "PitchIntakeForm (Creative concept submission)",
          "RoyaltySplitModelCard (Transparent payment structure)",
          "FAQAccordion (Content creators guide)"
        ],
        description: "Onboarding and IP licensing portal for independent creators and rights owners."
      },
      {
        id: "UX-PUB-011",
        name: "Afro-Fusion Community Presence",
        route: "/hub/community",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderCommunityPresencePageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "CommunityHero (Guilds of Directors, Writers, Editors)",
          "GuildDirectoryList",
          "UpcomingMeetupsCalendar",
          "CommunityJoinForm",
          "DiscordAndSocialLinks"
        ],
        description: "Creative guilds, collaborative forums, and networking directory for media practitioners."
      },
      {
        id: "UX-PUB-012",
        name: "Verified Talent Marketplace (VTM) Public Landing",
        route: "/hub/vtm",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderVtmMarketplacePageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "VtmHeroHeader (Verified African Creative Marketplace)",
          "TalentCategoryFilter (Acting, Directing, Technical Crew)",
          "VettedBadgeExplanatoryCard (Escrow & contract guarantees)",
          "HireTalentCTA (/vtm/marketplace link)"
        ],
        description: "Public marketplace showcasing vetted actors, voice talent, directors, and technical crew."
      },
      {
        id: "UX-PUB-013",
        name: "Production Gateway (ONE Studios & VCF)",
        route: "/hub/production",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderProductionPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ProductionPipelineStepper (Development to Delivery)",
          "StudioFacilitiesPreview",
          "CoProductionInquiryForm",
          "VCFSynergyCard"
        ],
        description: "End-to-end production ecosystem combining physical studios and development financing."
      },
      {
        id: "UX-PUB-014",
        name: "Virtual Content Fund (VCF) Public Showcase",
        route: "/hub/vcf",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderVcfPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "FundMandateHeader (African storytelling investment)",
          "EligibilityCriteriaCard",
          "ActiveSlatePreviewGallery",
          "SubmissionWindowCountdown",
          "InvestorInquiryForm"
        ],
        description: "Investment criteria and pitch pipeline for film, episodic, and digital content slate."
      },
      {
        id: "UX-PUB-015",
        name: "ONE Studios Infrastructure & Facilities",
        route: "/hub/onestudios",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderOneStudiosPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "SoundstageSpecificationsTable",
          "GearLockerInventoryPreview (Cameras, Lighting, Sound)",
          "VirtualProductionLEDCapabilities",
          "StudioBookingInquiryForm"
        ],
        description: "Physical facilities, equipment rental locker, and soundstage specifications."
      },
      {
        id: "UX-PUB-016",
        name: "Fusion Events & Festivals Showcase",
        route: "/hub/events",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderEventsPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "UpcomingFestivalsCalendar",
          "TicketTierPricingCard",
          "SponsorshipActivationShowcase",
          "EventOrganiserInquiryForm"
        ],
        description: "Live experience division showcasing cultural festivals, award shows, and stage events."
      },
      {
        id: "UX-PUB-017",
        name: "Cr8TechNG Technology & Playout Platform",
        route: "/hub/technology",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderTechnologyPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "BroadcastingCloudArchitectureOverview",
          "PlayoutAutomationFeaturesList",
          "APIIntegrationCapabilitiesCard",
          "TechnologyPartnersBadges"
        ],
        description: "Broadcast engineering, playout automation, and cloud delivery technology platform."
      },
      {
        id: "UX-PUB-018",
        name: "TEND Distribution & Syndication Showcase",
        route: "/hub/distribution",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderDistributionPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "GlobalSyndicationTerritoryMap",
          "ContentCatalogueFilter (Genre, Language, Format)",
          "LicensingAvailsExplanation",
          "BuyerRegistrationForm"
        ],
        description: "International distribution and syndication arm representing African IP worldwide."
      },
      {
        id: "UX-PUB-019",
        name: "Commercial Partners & Sponsors Portal",
        route: "/partners",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderPartnersPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "BrandSponsorshipPillarsCard",
          "AudienceDemographicsMetrics",
          "AdvertisingRateCardDownloadCTA",
          "PartnerInquiryForm"
        ],
        description: "Partnership opportunities for advertisers, corporate brands, and carriage providers."
      },
      {
        id: "UX-PUB-020",
        name: "HeadspaceNG Industry Insights & Research",
        route: "/insights",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderInsightsPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "MediaIntelligenceReportGrid",
          "WhitepaperDownloadCards",
          "AudienceViewingTrendCharts",
          "IntelligenceBriefingNewsletterSignup"
        ],
        description: "Media research publications, audience analytics reports, and thought leadership articles."
      },
      {
        id: "UX-PUB-021",
        name: "VMNL Careers & Culture Directory",
        route: "/careers",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderCareersPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "CompanyCultureHero",
          "OpenPositionsTable (Department, Location, Role)",
          "EmployeeBenefitsGrid",
          "GeneralApplicationModal"
        ],
        description: "Career vacancies across broadcasting, engineering, content production, and operations."
      },
      {
        id: "UX-PUB-022",
        name: "Azeebo+ Ecosystem Information Gateway",
        route: "/azeebo",
        sourceFile: "src/web/public/surface-a.ts",
        renderer: "renderAzeeboGatewayPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "AzeeboEcosystemHero (OTT Streaming & Web3 Federation)",
          "AppStoreAndGooglePlayBadges",
          "CrossPlatformConversionExplanation",
          "WebTVPlayerPreviewCard"
        ],
        description: "Consumer information gateway for the Azeebo+ streaming platform and mobile apps."
      },
      {
        id: "UX-PUB-023",
        name: "About Virtual Media Network Limited",
        route: "/about",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderAboutPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "CorporateVisionHero",
          "MilestonesTimeline (Broadcasting pioneers)",
          "ExecutiveLeadershipBoardGrid",
          "GovernanceAndValuesCard"
        ],
        description: "Corporate history, leadership profile, mission statement, and governance commitments."
      },
      {
        id: "UX-PUB-024",
        name: "Comprehensive Linear 24/7 Schedule Guide",
        route: "/schedule",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderPublicScheduleHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "ChannelTabSelector (NXTR, Orisun, Isi Mbido)",
          "DayOfWeekPicker",
          "DaypartFilter (Morning, Prime, Late)",
          "ScheduleTable (Airtime, Programme, Episode, Synopsis)",
          "TimeZoneIndicator (WAT default)"
        ],
        description: "Full electronic programme schedule across all broadcast channels for viewers."
      },
      {
        id: "UX-PUB-025",
        name: "Advertising & Commercial Opportunities",
        route: "/advertising",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderAdvertisingSponsorshipHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "AdInventoryBreakdown (Spot 30s, L-bars, Bugs, Stings)",
          "DaypartYieldRatesSummary",
          "CampaignBookingSteps",
          "TrafficEnquiryForm"
        ],
        description: "Commercial rate card overview, ad inventory structures, and booking guidelines."
      },
      {
        id: "UX-PUB-026",
        name: "Enquiry & General Contact Desk",
        route: "/enquiry, /contact",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderEnquiryContactHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "EnquiryIntakeForm (Name, Email, Category, Message)",
          "PhysicalStudioAddressCard",
          "DepartmentDirectLines",
          "IdempotentSubmissionHandler"
        ],
        description: "Official public contact and lead intake form with server-side validation and audit."
      },
      {
        id: "UX-PUB-027",
        name: "Public Help, FAQs & Knowledge Base",
        route: "/help",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderHelpPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "HelpSearchInput",
          "FAQAccordion (Viewing StarTimes, Pitching, Academy)",
          "SupportTicketTrigger",
          "KnowledgeBaseDirectory"
        ],
        description: "Frequently asked questions and public customer service troubleshooting guides."
      },
      {
        id: "UX-PUB-028",
        name: "Privacy Policy, Compliance & Accessibility",
        route: "/privacy, /accessibility",
        sourceFile: "src/web/public/pub-screens.ts",
        renderer: "renderPrivacyPageHtml(), renderAccessibilityPageHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-PUBLIC shell)",
          "LegalProseContainer (NDPR / GDPR compliance text)",
          "DataSubjectRightsList (Access, Erasure, Correction)",
          "AccessibilityConformanceStatement (WCAG 2.2 AA)",
          "DataProtectionOfficerContactCard"
        ],
        description: "Statutory legal documentation, privacy rights notices, and digital accessibility statement."
      }
    ]
  },
  {
    group: "Identity, Authentication & Session Security (UX-SYS)",
    authority: "UIUX-001 §8.4 / VMNL-AZP-VMN-CCPP-001 §2 (Canonical Auth)",
    summary: "14 identity, security, session governance, and profile configuration surfaces with BCrypt/JWT, TOTP MFA, anti-enumeration, and role authorization.",
    screens: [
      {
        id: "UX-SYS-001",
        name: "Operator Sign In",
        route: "/sign-in, /login",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderSignInHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "BrandLogoGroup",
          "SignInCard (Email input, Password input with toggle)",
          "SubmitButton (Sign In to Workstation)",
          "AccountRecoveryLink (/auth/recovery)",
          "RoleHelpCallout"
        ],
        description: "Primary authentication screen validating credentials against canonical user database with bcrypt."
      },
      {
        id: "UX-SYS-002",
        name: "Multi-Factor Authentication (MFA / Step-Up)",
        route: "/auth/mfa",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderMfaStepUpHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "MfaCard (6-digit TOTP code input with auto-advance)",
          "VerifyCodeButton",
          "BackupCodesTriggerLink",
          "TimeoutCountdownTimer",
          "SessionContextBadge"
        ],
        description: "Time-based One-Time Password verification for privileged roles (SuperAdmin, FinanceController)."
      },
      {
        id: "UX-SYS-003",
        name: "Account Recovery & Password Reset",
        route: "/auth/recovery",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderAccountRecoveryHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "RecoveryCard (Email address input)",
          "AntiEnumerationNotice (Uniform success feedback)",
          "SendResetLinkButton",
          "BackToSignInLink"
        ],
        description: "Secure recovery workflow sending tokenized reset links via NotificationService without user leakage."
      },
      {
        id: "UX-SYS-004",
        name: "Invitation Acceptance & Password Setup",
        route: "/auth/invitation, /auth/invitation/accept",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderInvitationAcceptanceHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "InvitationWelcomeHeader (Inviter & Tenant name)",
          "PasswordCreationFields (Strength meter, confirmation)",
          "TermsAcceptanceCheckbox",
          "CompleteOnboardingButton"
        ],
        description: "New operator account activation validating cryptographic invitation token."
      },
      {
        id: "UX-SYS-005",
        name: "First-Use Operator Profile Configuration",
        route: "/auth/profile-setup",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderFirstUseProfileHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "ProfileSetupForm (Display Name, Department, Phone, Timezone)",
          "TimezoneSelector (WAT / GMT / CAT)",
          "SaveAndEnterWorkspaceButton",
          "AuditNotificationCallout"
        ],
        description: "Mandatory first-use profile onboarding persisting operator timezone and contact details."
      },
      {
        id: "UX-SYS-006",
        name: "Workspace Selection Desk",
        route: "/select-workspace",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderWorkspaceSelectionHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "WorkspaceCardGrid (Broadcast, Commercial, LMS, Finance)",
          "RolePermissionsBadge",
          "TenantSwitcherSelect",
          "DirectAccessButton"
        ],
        description: "Multi-tenant workspace selector allowing operators to choose their active operational context."
      },
      {
        id: "UX-SYS-007",
        name: "Session Expired Warning & Re-auth",
        route: "/auth/session-expired",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderSessionExpiredHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "SessionTimeoutAlertCard",
          "ReauthenticateButton",
          "ReturnUrlPreservationHandler"
        ],
        description: "Security boundary displayed when JWT tokens expire or are revoked server-side."
      },
      {
        id: "UX-SYS-008",
        name: "Access Denied (403 RBAC Barrier)",
        route: "/access-denied",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderAccessDeniedHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "ForbiddenNoticeCard",
          "RequiredRoleCallout (e.g., ExecutiveLeader required)",
          "AccessElevationRequestButton (/access-request)",
          "ReturnHomeLink"
        ],
        description: "RBAC violation screen explaining required roles and offering elevation request workflows."
      },
      {
        id: "UX-SYS-009",
        name: "Access Request & Elevation Form",
        route: "/access-request",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderAccessRequestHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "ElevationTargetRoleSelect",
          "BusinessJustificationTextarea",
          "FourEyesApprovalNotice",
          "SubmitElevationButton"
        ],
        description: "Self-service role elevation request submitted to SuperAdmin and Compliance queue."
      },
      {
        id: "UX-SYS-010",
        name: "Sign Out & Token Revocation",
        route: "/sign-out, /logout",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "POST /api/v1/auth/logout -> redirect /sign-in",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "TokenRevocationHandler",
          "SessionClearConfirmation",
          "RedirectToSignInCTA"
        ],
        description: "Cryptographically revokes JWT session tokens in memory and Redis cache, clearing cookies."
      },
      {
        id: "UX-SYS-011",
        name: "Account Profile & Security Settings",
        route: "/account/profile",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderAccountSettingsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "ProfileInformationCard",
          "PasswordChangeForm",
          "MfaEnrollmentCard (QR Code, Backup keys)",
          "SaveSettingsButton"
        ],
        description: "User self-service portal for password update, personal contact details, and TOTP MFA setup."
      },
      {
        id: "UX-SYS-012",
        name: "Notification Preferences Desk",
        route: "/account/notifications",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderNotificationPreferencesHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "ChannelsCheckboxGroup (Email, In-App, SMS)",
          "CategoryToggles (Critical Alerts, Approvals, System Updates)",
          "SavePreferencesButton"
        ],
        description: "Granular delivery settings for system alerts, approval notifications, and broadcast events."
      },
      {
        id: "UX-SYS-013",
        name: "Active Sessions & Device Registry",
        route: "/account/sessions",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderActiveSessionsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "CurrentSessionBadge (IP, User Agent, Location)",
          "OtherActiveSessionsTable",
          "RevokeSingleSessionButton",
          "RevokeAllOtherSessionsButton"
        ],
        description: "Operator security dashboard auditing all active logins with remote termination capability."
      },
      {
        id: "UX-SYS-014",
        name: "Contextual Operator Help Desk",
        route: "/help/operator",
        sourceFile: "src/web/public/auth-screens.ts",
        renderer: "renderContextualHelpHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-IDENTITY shell)",
          "RoleGuidanceCards (Traffic, Broadcast, Playout, Rights)",
          "StandardOperatingProceduresLinks",
          "EmergencyIncidentHotlineCard"
        ],
        description: "Internal operator assistance documentation tailored to the logged-in role."
      }
    ]
  },
  {
    group: "Shared Work Navigation & Enterprise Hub (UX-HUB)",
    authority: "UIUX-001 §8.5 / VMNL-AZP-VMN-BRD-PRD-001 §14",
    summary: "5 core operator workspace screens providing unified work queues, cross-domain search, notifications, live management overview, and directory.",
    screens: [
      {
        id: "UX-HUB-001",
        name: "My Work Queue (Unified Operator Workbench)",
        route: "/workspace/my-work",
        sourceFile: "src/web/workspace/work-hub.ts",
        renderer: "renderMyWorkHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-WORK shell)",
          "TaskStatusFilters (ALL, PENDING, IN_PROGRESS, BLOCKED)",
          "PriorityTaskTable (Due Date, Domain, Assignee, Actions)",
          "DirectResolveButton",
          "TaskGraphSummaryWidget"
        ],
        description: "Aggregates actionable items (approvals, QC reviews, schedule exceptions) assigned to the user."
      },
      {
        id: "UX-HUB-002",
        name: "Authorised Cross-Domain Search",
        route: "/workspace/search",
        sourceFile: "src/web/workspace/work-hub.ts",
        renderer: "renderSearchResultsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-WORK shell)",
          "SearchInputBar (Query string + Domain Filter)",
          "DomainCategoryPills (Programmes, Contracts, Assets, Talent)",
          "SearchResultsList (Ranked items with access badges)",
          "TotalResultsCount"
        ],
        description: "Role-scoped search across programme catalogue, talent records, contracts, and media assets."
      },
      {
        id: "UX-HUB-003",
        name: "In-App Notifications Centre",
        route: "/workspace/notifications",
        sourceFile: "src/web/workspace/work-hub.ts",
        renderer: "renderNotificationsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-WORK shell)",
          "NotificationFeedList (Unread/Read state)",
          "NotificationCategoryBadge (Urgent, Info, Decision)",
          "MarkAllAsReadButton",
          "DeepLinkActionButton"
        ],
        description: "Real-time activity feed alerting operators to four-eyes reviews, rights deadlines, and playout alerts."
      },
      {
        id: "UX-HUB-004",
        name: "Executive Management Overview",
        route: "/workspace/management/overview",
        sourceFile: "src/web/workspace/counterparty-portals.ts",
        renderer: "renderManagementOverviewHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-WORK shell)",
          "ExecutiveKpiRow (Live Channels, Carriage Up-time, Ad Yield)",
          "QuoteToCashPipelineWidget (Distinct recognised vs cash revenue)",
          "ActiveTalentCountCard",
          "BroadcastHealthMatrix"
        ],
        description: "Executive cockpit aggregating telemetry across broadcast transmission, commercial sales, and talent."
      },
      {
        id: "UX-HUB-005",
        name: "Enterprise Workspace Directory",
        route: "/workspace",
        sourceFile: "src/web/workspace/surface-bc.ts",
        renderer: "renderWorkspaceDirectoryHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout (S-WORK shell)",
          "WorkspaceCategoryTabs (Executive, Commercial, Creative, Operations)",
          "WorkspaceCardsGrid (48 Enterprise Workspaces)",
          "RoleAccessLockIndicator",
          "DeskLaunchButton"
        ],
        description: "Master navigation launchpad listing all 48 enterprise workspaces across VMNL business units."
      }
    ]
  },
  {
    group: "Commercial & Project Management (UX-COM / UX-PRJ)",
    authority: "UIUX-001 §5.3 / VMNL-AZP-VMN-CCPP-001 §5 (Quote to Cash)",
    summary: "6 commercial operations surfaces including Lead Intake, Proposal Builder, Quote Review with Dual-Authorisation, and Delivery Overviews.",
    screens: [
      {
        id: "UX-COM-001..003",
        name: "Commercial Overview & CRM Account Directory",
        route: "/workspace/commercial, /workspace/organisations",
        sourceFile: "src/web/workspace/surface-bc.ts",
        renderer: "renderWorkspaceDeskHtml()",
        status: "MOCK",
        provenance: "NOT_CONNECTED",
        components: [
          "WorkspaceShell",
          "SalesPipelineOverviewCard",
          "ClientOrganisationDirectoryTable",
          "CreditStandingIndicator",
          "AccountOwnerBadge"
        ],
        description: "Commercial operations shell presenting client accounts and CRM pipeline."
      },
      {
        id: "UX-COM-004",
        name: "Commercial Lead Intake & Enquiry Store",
        route: "/enquiry + GET /api/v1/enquiries",
        sourceFile: "src/modules/hub/enquiry/index.ts",
        renderer: "renderEnquiryContactHtml() / API",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "EnquirySubmissionForm",
          "IdempotencyKeyGenerator",
          "LeadRoutingDispatcher",
          "DurableEnquiryStore"
        ],
        description: "Durable intake capturing inbound commercial leads with deduplication and routing."
      },
      {
        id: "UX-COM-005..009",
        name: "Proposal Builder, Dual-Authorisation Quote Review & Contracts",
        route: "/workspace/commercial/proposals/builder, /workspace/commercial/proposals/:id/quote",
        sourceFile: "src/web/workspace/commercial-proposal.ts",
        renderer: "renderProposalBuilderHtml(), renderQuoteReviewHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ProposalHeaderForm (Client selection, validity dates)",
          "DeliverableItemsTable (Spots, sponsorships, rates)",
          "computeProposalTotals (Subtotal, VAT, WHT schedule)",
          "DualAuthorisationStatus (Legal & Finance sign-off required)",
          "AcceptProposalButton",
          "ContractHandoffTrigger"
        ],
        description: "Proposal creation and multi-control quote acceptance engine with WHT calculations."
      },
      {
        id: "UX-COM-010",
        name: "Commercial Delivery Overview",
        route: "/portal/client/:orgId/projects/:projectId",
        sourceFile: "src/web/portal/client-portal.ts",
        renderer: "renderClientProjectDetailHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "ContractCommitmentsTable",
          "DeliveredSpotsCounter",
          "PendingMilestonesIndicator",
          "ProofOfAirDownloadLink"
        ],
        description: "Contract delivery tracking proving spot airing and project deliverables to counterparties."
      },
      {
        id: "UX-PRJ-001",
        name: "Project Portfolio Desk",
        route: "/workspace/projects (surface-bc)",
        sourceFile: "src/web/workspace/surface-bc.ts",
        renderer: "renderWorkspaceDeskHtml()",
        status: "MOCK",
        provenance: "NOT_CONNECTED",
        components: [
          "WorkspaceShell",
          "ProjectPortfolioList",
          "BudgetVsActualGauge",
          "StatusSummaryBadges"
        ],
        description: "High-level production project portfolio presentation shell."
      },
      {
        id: "UX-PRJ-002",
        name: "Project Workspace & Deliverable Milestones",
        route: "/portal/client/:orgId/projects/:projectId",
        sourceFile: "src/web/portal/client-portal.ts",
        renderer: "renderClientProjectDetailHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "ProjectHeaderCard",
          "MilestoneTimelineView",
          "DeliverableAssetsList",
          "InquirySubmissionForm"
        ],
        description: "Org-isolated client project workspace verifying milestone completion and deliverables."
      }
    ]
  },
  {
    group: "Broadcast Operations & Playout Infrastructure (UX-BR / SCR-BCST)",
    authority: "UIUX-001 §4.3 / VMNL-AZP-VMN-BRD-PRD-001 R1.2A (§46)",
    summary: "33 operational console surfaces covering executive oversight, programming, QC, scheduling grid, traffic logs, live playout, as-run reconciliation, and carriage.",
    screens: broadcastScreens.map(s => ({
      id: s.screenId,
      name: s.name,
      route: s.route,
      sourceFile: "src/web/broadcast/index.ts",
      renderer: `renderBroadcastScreenHtml() [${s.screenId}]`,
      status: (s.screenId === "SCR-BCST-12" || s.screenId === "SCR-BCST-23" || s.screenId === "SCR-BCST-22" || s.screenId === "SCR-BCST-24" || s.screenId === "SCR-BCST-14" || s.screenId === "SCR-BCST-31") ? "IMPLEMENTED" : "MOCK",
      provenance: (s.screenId === "SCR-BCST-12" || s.screenId === "SCR-BCST-23" || s.screenId === "SCR-BCST-22" || s.screenId === "SCR-BCST-24" || s.screenId === "SCR-BCST-14" || s.screenId === "SCR-BCST-31") ? "DOMAIN_ENGINE" : "MOCK",
      components: [
        "MasterLayout (S-WORK shell)",
        "BroadcastConsoleHeader (Screen ID, Gate clearance badge)",
        "RoleAuthorizationGate (Role requirement: " + s.primaryRole + ")",
        "DecisionDataBar (Operational status, KPIs, SLA compliance)",
        "PermittedActionButtons (" + s.permittedActions.join(", ") + ")",
        s.screenId === "SCR-BCST-12" ? "renderScheduleGridTimelineHtml (Interactive timeline grid)" :
        s.screenId === "SCR-BCST-23" ? "renderLivePlayoutMonitorHtml (On-air status, filler switcher)" :
        s.screenId === "SCR-BCST-22" ? "renderPlaylistLockViewHtml (Frame-accurate playlist lock)" :
        s.screenId === "SCR-BCST-24" ? "renderAsRunReconciliationDiffHtml (3-way match plan vs air)" :
        s.screenId === "SCR-BCST-14" ? "renderEpgInspectorDiffHtml (XMLTV feed diff & export)" :
        s.screenId === "SCR-BCST-31" ? "renderBroadcastYieldAnalyticsHtml (Revenue per daypart)" :
        "DomainRecordsTable (Screen KPIs, Telemetry entries, Audit controls)"
      ],
      description: s.description
    }))
  },
  {
    group: "Governance, Audit & Regulatory Evidence (UX-GOV)",
    authority: "UIUX-001 §5.4, §5.6, §8.14 / VMNL-AZP-VMN-CCPP-001 §7",
    summary: "10 compliance, four-eyes approval, rights clearance, financial reference, and privacy/security case registers.",
    screens: [
      {
        id: "UX-GOV-001..002",
        name: "Four-Eyes Approval Queue & Decision Review",
        route: "/workspace/approvals",
        sourceFile: "src/web/workspace/governance-and-operations.ts",
        renderer: "renderApprovalReviewHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ApprovalQueueTable (Schedule locks, expenditures, contracts)",
          "SegregationOfDutiesGate (Author cannot approve)",
          "ApproveButton",
          "RejectWithReasonModal",
          "AuditLogTrail"
        ],
        description: "Four-eyes decision console enforcing Segregation of Duties before critical actions execute."
      },
      {
        id: "UX-GOV-003",
        name: "Rights Source Record Projection",
        route: "/workspace/governance/records?tab=rights",
        sourceFile: "src/web/workspace/governance-registers.ts",
        renderer: "projectRightsSourceRecord -> renderProjectionTable()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RightsRecordTable (Territory, Channel Scope, Expiry Date)",
          "ClearanceBadge (CLEARED / PENDING / EXPIRED)",
          "ContractReferenceLink",
          "ExportEvidenceButton"
        ],
        description: "Read-only legal ledger projecting verified rights clearance records for broadcast."
      },
      {
        id: "UX-GOV-004",
        name: "Rights Review Request & Exception Workflow",
        route: "/broadcast/rights/review-request",
        sourceFile: "src/web/workspace/governance-and-operations.ts",
        renderer: "renderRightsReviewRequestHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RightsRequestForm (Programme ID, Target Channel, Window)",
          "MissingWindowWarningCard",
          "SubmitForLegalReviewButton",
          "ResolutionAuditHistory"
        ],
        description: "Workflow to resolve uncleared broadcast rights without bypassing clearance gates."
      },
      {
        id: "UX-GOV-005",
        name: "Financial Reference & 7-Way Split Record",
        route: "/workspace/governance/records?tab=finance",
        sourceFile: "src/web/workspace/governance-registers.ts",
        renderer: "projectFinancialReference -> renderProjectionTable()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "FinancialReferenceTable (Deal ID, Total Value, Settlement State)",
          "SevenWaySplitBreakdownCard",
          "WithholdingTaxBadge",
          "EscrowStatusIndicator"
        ],
        description: "Financial projection maintaining strict separation between recognised revenue and cash."
      },
      {
        id: "UX-GOV-006",
        name: "Delivery Exception & Proof-of-Air Workbench",
        route: "/broadcast/asrun/exceptions",
        sourceFile: "src/web/workspace/governance-and-operations.ts",
        renderer: "renderPoaExceptionsWorkbenchHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ExceptionListTable (Shortfall spots, preempted airings)",
          "ReconciliationStatusBadge",
          "MakegoodScheduleButton",
          "CreditNoteTriggerButton"
        ],
        description: "Resolves broadcast airtime discrepancies between scheduled traffic and as-run logs."
      },
      {
        id: "UX-GOV-007",
        name: "Immutable Evidence Viewer",
        route: "/workspace/governance/records?tab=evidence",
        sourceFile: "src/web/workspace/governance-registers.ts",
        renderer: "projectEvidence -> renderProjectionTable()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "EvidenceRecordTable (Evidence Type, SHA256 Hash, S3 URI)",
          "CryptographicVerificationIndicator",
          "DownloadVerifiedArtifactButton"
        ],
        description: "Audit ledger displaying signed certificates, affidavits, and transmission captures."
      },
      {
        id: "UX-GOV-008",
        name: "Authorised Activity & Audit Trail",
        route: "/workspace/governance/records?tab=audit",
        sourceFile: "src/web/workspace/governance-registers.ts",
        renderer: "projectAuditEntry -> renderProjectionTable()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "AuditLogTable (Timestamp, Operator, Action, Target, IP)",
          "RoleFilter",
          "TamperEvidenceProofBadge",
          "ExportAuditCsvButton"
        ],
        description: "Immutable security trail accessible only to InternalAuditor and SuperAdmin roles."
      },
      {
        id: "UX-GOV-009",
        name: "Data Privacy & Subject Request Case Desk",
        route: "/workspace/cases/privacy",
        sourceFile: "src/core/cases/index.ts / src/api/router.ts",
        renderer: "renderMasterLayout(PrivacyCaseDesk)",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RestrictedCaseQueue (DPO & Legal Counsel only)",
          "SubjectRequestStatus (ERASURE, ACCESS, RECTIFICATION)",
          "SLAClockCountdown (NDPR 30-day mandate)",
          "ExecutionActionButtons"
        ],
        description: "Restricted queue managing citizen data subject requests under statutory privacy laws."
      },
      {
        id: "UX-GOV-010",
        name: "Security Vulnerability & Incident Case Desk",
        route: "/workspace/cases/security",
        sourceFile: "src/core/cases/index.ts / src/api/router.ts",
        renderer: "renderMasterLayout(SecurityCaseDesk)",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "HighSeverityIncidentQueue (Security Operations only)",
          "ThreatLevelBadge (P0 Critical, P1 High)",
          "24HourSLAResponseIndicator",
          "ContainmentAndPostMortemForm"
        ],
        description: "Encrypted case desk for confidential incident tracking and emergency mitigation."
      }
    ]
  },
  {
    group: "Content Operations & Media Management (UX-CMS)",
    authority: "UIUX-001 §5.5, §8.13",
    summary: "8 content curation, metadata editorial, approved media picker, and external syndication config surfaces.",
    screens: [
      {
        id: "UX-CMS-001..006",
        name: "Content Review Queue, Metadata Editor & Media Asset Picker",
        route: "/workspace/content/review, /workspace/content/editor, /workspace/content/media-picker",
        sourceFile: "src/web/workspace/content-editor.ts, src/web/workspace/media-picker.ts",
        renderer: "renderContentReviewAndPublicationHtml(), renderContentEditorFormHtml(), renderMediaPickerHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ContentReviewQueueTable (Pending, In Review, Published)",
          "ContentEditorForm (Title, Synopsis, Genre, Episode fields)",
          "MediaPickerModal (Approved MediaAssetRecord registry)",
          "MediaRefBadges (Provenance + Access state)",
          "MultiSelectMediaAssetIds (Server-validated [CMS-11])",
          "PublicationTriggerButton"
        ],
        description: "Complete editorial workstation with media picker bound to canonical digital asset registry."
      },
      {
        id: "UX-CMS-007",
        name: "Azeebo+ Destination Federation Registry",
        route: "/api/v1/federation/destinations",
        sourceFile: "src/core/federation/destinations.ts",
        renderer: "renderFederationGatewayHtml() / API",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "FederationShell",
          "DestinationAllowlistTable",
          "EndpointHealthStatusBadge",
          "FallbackCircuitBreakerState",
          "AuditDestinationButton"
        ],
        description: "Authorised destinations allowlist controlling media exports to Azeebo+ universes."
      },
      {
        id: "UX-CMS-008",
        name: "Commercial Enquiry Routing Rules Config",
        route: "/api/v1/enquiries/routing-config",
        sourceFile: "src/core/federation/destinations.ts",
        renderer: "API + Admin Console",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RoutingRuleEditorTable (Topic -> Department email)",
          "FallbackHandlerConfiguration",
          "SaveRoutingRulesButton"
        ],
        description: "Dynamic configuration directing public inquiries to appropriate business desks."
      }
    ]
  },
  {
    group: "System Administration & Technical Health (UX-ADM)",
    authority: "UIUX-001 §5.7, §5.8",
    summary: "4 administrative consoles managing operator access, runtime integration health, approved routing mappings, and feature flags.",
    screens: [
      {
        id: "UX-ADM-001",
        name: "Access & Membership Governance Console",
        route: "/workspace/admin/access",
        sourceFile: "src/web/workspace/admin-consoles.ts",
        renderer: "renderAccessAdminConsoleHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RolePermissionMatrixTable",
          "ActiveSessionsDirectory (Read-only security view)",
          "SuperAdminGuardIndicator",
          "IdPDelegationNotice"
        ],
        description: "Audits system memberships, assigned permissions, and active sessions (SuperAdmin only)."
      },
      {
        id: "UX-ADM-002",
        name: "Integration Health & Runtime Telemetry",
        route: "/workspace/cr8tech/operations",
        sourceFile: "src/web/workspace/intelligence-and-tech.ts",
        renderer: "renderCr8TechOperationsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RuntimeAdapterStatusCard (Azeebo circuit, Redis queue)",
          "IntegrationHealthBadges (CONNECTED vs NOT_CONFIGURED)",
          "HeartbeatLatencyMeter",
          "SystemIncidentLog"
        ],
        description: "Authoritative health state of external adapters without fabricated mock pings."
      },
      {
        id: "UX-ADM-003",
        name: "Approved Routing & Source Mappings Console",
        route: "/workspace/admin/source-mappings",
        sourceFile: "src/web/workspace/admin-consoles.ts",
        renderer: "renderSourceMappingsConsoleHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ApprovedSourceTable (HX-01 to HX-14 canonical mappings)",
          "DataClassificationBadge (STRICT / PUBLIC)",
          "OwnerDesignationCard",
          "SuperAdminVerificationSeal"
        ],
        description: "Renders canonical data-source routing tables governing external API and database handoffs."
      },
      {
        id: "UX-ADM-004",
        name: "Release Availability & Feature Flags Console",
        route: "/admin/feature-flags, /workspace/admin/feature-flags",
        sourceFile: "src/web/public/admin-feature-flags.ts",
        renderer: "renderAdminFeatureFlagsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "FeatureFlagToggleTable (Flag Key, Status, Environment)",
          "RolloutPercentageSlider",
          "AuditChangeConfirmationModal",
          "SaveFeatureFlagsButton"
        ],
        description: "Controls deployment availability toggles and canary releases across the platform."
      }
    ]
  },
  {
    group: "Shared Canonical Records Projections (UX-REC)",
    authority: "UIUX-001 §5.4 / VMNL-AZP-VMN-CCPP-001 §4",
    summary: "6 canonical entity projections covering Person, Asset, Job, Risk, Issue, and Incident registers.",
    screens: [
      {
        id: "UX-REC-001..006",
        name: "Person, Asset, Job, Risk, Issue & Incident Canonical Projections",
        route: "/workspace/governance/records, /workspace/governance/risks, /workspace/governance/issues",
        sourceFile: "src/web/workspace/governance-registers.ts, src/web/workspace/counterparty-portals.ts",
        renderer: "renderGovernanceRecordsHtml(), renderRiskRegisterHtml(), renderIssueTrackerHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RecordTabsSelector (Person, Asset, Job, Incident, Risk, Issue)",
          "renderProjectionTable (Type-safe schema projection)",
          "RiskMatrixScorecard (Impact vs Likelihood)",
          "IssueTrackerTable (Severity, Owner, Escalate CTA)"
        ],
        description: "Shared governance consoles projecting core system-of-record entities with honest empty states."
      }
    ]
  },
  {
    group: "AFCA Academy & Admissions Journey (UX-AFCA / UX-APP)",
    authority: "UIUX-001 §7 / VMNL-AZP-VMN-CCPP-001 §8",
    summary: "16 educational and applicant surfaces spanning learner dashboard, gradebook, digital certificates, public verification, and candidate journey.",
    screens: [
      {
        id: "UX-AFCA-001..008",
        name: "AFCA Learning Management System (LMS) Surfaces",
        route: "/workspace/afca, /workspace/afca/gradebook, /workspace/afca/learning-plan, /workspace/afca/assignments/submit, /workspace/afca/grading/rubric, /workspace/afca/certificates/:id, /verify/afca/:certId, /admissions/queue",
        sourceFile: "src/web/workspace/afca-lms.ts, src/web/workspace/afca-extended-lms.ts, src/web/public/verification.ts, src/web/public/admissions.ts",
        renderer: "renderAfcaLearnerDashboardHtml(), renderAfcaGradebookHtml(), renderLearningPlanHtml(), renderAssignmentSubmissionHtml(), renderFacultyGradingRubricHtml(), renderCertificateGeneratorHtml(), renderAfcaVerificationHtml(), renderAdmissionsQueueHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell / PublicShell",
          "LearnerCourseCardsGrid",
          "GradebookSummaryTable (GPA calculation)",
          "LearningTrackMilestoneStepper",
          "AssignmentUploadDropzone",
          "FacultyGradingRubricTable",
          "DigitalCertificateViewer (SHA-256 verification)",
          "PublicCertificateVerificationCard (/verify/afca/:certId)",
          "AdmissionsQueueEvaluationTable"
        ],
        description: "Comprehensive educational suite from applicant scoring to learning management and cryptographic diploma issuance."
      },
      {
        id: "UX-APP-001..008",
        name: "Academy Admissions Application Journey",
        route: "/apply, /apply/status/:ref",
        sourceFile: "src/modules/hub/afca/admissions.ts, src/web/public/admissions.ts",
        renderer: "renderAdmissionsApplicationHtml(), renderApplicationStatusHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PublicShell",
          "ApplicationStepProgressBar (Track, Profile, Background, Portfolio, Review)",
          "TrackSelectionCards (Film Production, Audio Engineering, Screenwriting)",
          "DemographicsAndContactFields",
          "PortfolioShowreelInputs",
          "DigitalDeclarationSignature",
          "ApplicationStatusTracker (/apply/status/:ref)"
        ],
        description: "End-to-end multi-step student application journey with reference tracking and durable admissions state."
      }
    ]
  },
  {
    group: "Extended Creative Workspaces (Specialist Desks)",
    authority: "UIUX-001 §6 / DEC-RL1-SCOPE-001 / SCR-18 & SCR-20",
    summary: "12 specialised creative desks covering Talent Accelerator, Afro-Fusion Guilds, VTM Portal & Payment Visibility, VCF Slate, ONE Studios, Events, TEND, Headspace, Cr8Tech, and Agentic OS.",
    screens: [
      {
        id: "UX-ACC-001..008",
        name: "Talent Accelerator Operational Desk",
        route: "/workspace/accelerator, /workspace/accelerator/desk",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderTalentAcceleratorDeskHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "AcceleratorMetricsRow (Hubs, Active Cohorts, Placements)",
          "TalentRosterTable (Status: VERIFIED, SUBMITTED)",
          "HubRegistrationForm",
          "PlacementTrackerCard"
        ],
        description: "Operational desk projected over TalentAcceleratorRegistry managing cohorts and talent pipelines."
      },
      {
        id: "UX-AFC-001..006",
        name: "Afro-Fusion Creative Community Guilds Desk",
        route: "/workspace/community/guilds, /workspace/guilds",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderCommunityGuildsDeskHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "GuildMembershipTable (Directors, Writers, Actors)",
          "CommunityResourceBookingCalendar",
          "LocationHubDirectory",
          "MemberRegistrationAction"
        ],
        description: "Community operations desk bound to AfroFusionCommunityHub for resource booking and membership records."
      },
      {
        id: "UX-VTM-001..009",
        name: "Virtual Talent Management (VTM) Marketplace & Matching",
        route: "/vtm/marketplace, /workspace/vtm/match",
        sourceFile: "src/web/portal/vtm-portal.ts, src/web/workspace/creative-hub-extended.ts",
        renderer: "renderVtmMarketplaceHtml(), renderVtmMatchingWorkbenchHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell / WorkspaceShell",
          "TalentCandidateCardsGrid",
          "MatchingWorkbenchScorecard (Role requirements vs talent skills)",
          "MatchProposalGenerator",
          "ContractDraftingButton"
        ],
        description: "Talent booking and algorithmic role-matching engine connecting productions with verified artists."
      },
      {
        id: "UX-VTM-010",
        name: "Engagement Acceptance & Digital Signature (Deployment Readiness)",
        route: "/vtm/terms, /portal/vtm/terms",
        sourceFile: "src/web/portal/vtm-portal.ts",
        renderer: "renderVtmTermsReviewHtml()",
        status: "ALIAS",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "ContractTermsProseCard",
          "MilestoneScheduleTable",
          "DigitalSignatureInput",
          "SignAndSubmitAction (POST /api/v1/vtm/contracts/:id/sign)"
        ],
        description: "Legal acceptance console with cryptographic digital signature and audit logging."
      },
      {
        id: "UX-VTM-011",
        name: "Talent Payment Visibility & 7-Way Split Console",
        route: "/portal/vtm/payment-visibility",
        sourceFile: "src/web/portal/vtm-payment-visibility.ts",
        renderer: "renderVtmPaymentVisibilityHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "PaymentBatchSummaryCard",
          "SevenWaySplitBreakdownTable (Talent, Agent, Guild, Tax, Escrow)",
          "MilestoneReadinessIndicator",
          "EscrowReleaseTrigger"
        ],
        description: "Real-time payout visibility projected from VirtualTalentManagementEngine and TalentPayoutEngine."
      },
      {
        id: "UX-VCF-001..008",
        name: "Virtual Content Fund (VCF) Missions & Slate Desk",
        route: "/workspace/vcf/missions, /workspace/foundry/missions",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderVcfCreatorMissionsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ActiveSlateKanbanBoard",
          "PitchPipelineReviewTable",
          "WaterfallsCalculationCard",
          "GreenlightDecisionButton"
        ],
        description: "Investment desk tracking pitch submissions, milestone waterfall disbursements, and greenlit slates."
      },
      {
        id: "UX-ONE-001..009",
        name: "ONE Studios Production & Gear Locker Desk",
        route: "/workspace/production/desk, /workspace/onestudios/desk",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderOneStudiosProductionDeskHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "GearLockerAssetTable (Cameras, Grip, Sound availability)",
          "CallSheetPublisherForm (Durable persistence via publishCallSheet)",
          "SoundstageBookingGrid",
          "ProductionCrewRoster"
        ],
        description: "Physical production control managing equipment locker, soundstage allocations, and call sheets."
      },
      {
        id: "UX-EVT-001..008",
        name: "Fusion Events Stage & Gate Operations Desk",
        route: "/workspace/events/desk, /workspace/fusion-events",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderFusionEventsDeskHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "LiveGateStatisticsCounter",
          "SingleUseTicketScanner (Real HMAC verification via scanGateTicket)",
          "DuplicateScanAlertBanner",
          "AttendeeCapacityGauge"
        ],
        description: "Live event gate desk executing single-use ticket scans with cryptographic HMAC validation."
      },
      {
        id: "UX-TEND-001..008",
        name: "TEND Rights Distribution & Catalogue Desk",
        route: "/workspace/tend/catalogue, /workspace/syndication/catalogue",
        sourceFile: "src/web/workspace/creative-hub-extended.ts",
        renderer: "renderTendRightsDistributionHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "ContentCatalogueTable",
          "LicenceAvailsMatrix (Territory vs Exclusivity Window)",
          "TitleRegistrationForm",
          "SyndicationDealBuilder"
        ],
        description: "International distribution console bound to TendDistributionEngine for rights licensing."
      },
      {
        id: "UX-HSP-001..008",
        name: "HeadspaceNG Industry Intelligence Desk",
        route: "/workspace/headspace/intelligence, /workspace/market-intelligence",
        sourceFile: "src/web/workspace/intelligence-and-tech.ts",
        renderer: "renderHeadspaceIntelligenceHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "KnowledgeEngineCatalogueTable",
          "ConfidentialityClassificationBadge (RESTRICTED / PUBLIC)",
          "ResearchDocumentUploader",
          "MarketTrendSearchQuery"
        ],
        description: "Proprietary market research repository enforcing role-scoped document confidentiality."
      },
      {
        id: "UX-CR8-001..008",
        name: "Cr8TechNG DevOps & Infrastructure Operations",
        route: "/workspace/cr8tech/operations, /workspace/devops/console",
        sourceFile: "src/web/workspace/intelligence-and-tech.ts",
        renderer: "renderCr8TechOperationsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "RuntimeAdapterStatusCard",
          "PlayoutEngineHeartbeatMonitor",
          "QueueWorkerMetricsCard",
          "SaaSIntegrationsExplicitState (Displays NOT_CONFIGURED for unconfigured services)"
        ],
        description: "Engineering operations console displaying authentic runtime adapter telemetry."
      },
      {
        id: "UX-AGT-001..009",
        name: "Agentic OS (AOS) Automation Console",
        route: "/workspace/aos/console, /workspace/agentic-os",
        sourceFile: "src/web/workspace/intelligence-and-tech.ts",
        renderer: "renderAgenticOsConsoleHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "WorkspaceShell",
          "AgentSwarmActivityFeed",
          "HumanInTheLoop (HITL) DecisionApprovalCard",
          "EmergencyKillswitchButton (POST /api/v1/workspace/aos/killswitch)",
          "AgentAuditTrailLog"
        ],
        description: "AI agent orchestrator featuring real-time human-in-the-loop oversight and emergency killswitches."
      }
    ]
  },
  {
    group: "Counterparty Portals & External Relationships (UX-POR)",
    authority: "UIUX-001 §5.6 / VMNL-AZP-VMN-CCPP-001 §6",
    summary: "5 dedicated counterparty portals providing client, partner, creator, and vendor access with strict tenant isolation.",
    screens: [
      {
        id: "UX-POR-001",
        name: "Client Relationship Portal Home",
        route: "/portal/client/:orgId/projects",
        sourceFile: "src/web/portal/client-portal.ts",
        renderer: "renderClientProjectsListHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "OrganisationHeaderCard",
          "ActiveProjectsGrid (Contracted deliverables & status)",
          "RelationshipVerificationCheck (SEC-07 org isolation)",
          "SubmitInquiryButton"
        ],
        description: "Client portal landing listing contracted projects with strict organisation-level data isolation."
      },
      {
        id: "UX-POR-002",
        name: "Client Delivery Inquiry & Question Desk",
        route: "POST /api/v1/client/projects/:id/questions",
        sourceFile: "src/api/router.ts, src/web/workspace/counterparty-portals.ts",
        renderer: "API + Client Portal Modal",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "QuestionSubmissionModal",
          "DeliverableContextSelect",
          "AuditLoggedResponseHandler",
          "SupportTicketIndicator"
        ],
        description: "Structured communication channel for clients to query project deliverables and airing times."
      },
      {
        id: "UX-POR-003",
        name: "Commercial Partner Portal",
        route: "/portal/partner/:orgId",
        sourceFile: "src/web/workspace/counterparty-portals.ts",
        renderer: "renderPartnerPortalHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "PartnerOrganisationHero",
          "QuoteToCashDealsTable (Scoped via getClientOrgRelationship)",
          "CrossOrgForbiddenGuard (403 on mismatch)",
          "ContractDocumentsList"
        ],
        description: "Brand and advertising partner portal showing active campaigns and contractual agreements."
      },
      {
        id: "UX-POR-004",
        name: "Creator Royalties & Payout Portal",
        route: "/portal/creator/:id",
        sourceFile: "src/web/workspace/counterparty-portals.ts",
        renderer: "renderCreatorPortalHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "CreatorIdentityCard",
          "SettlementLinesTable (Projected from TalentPayoutEngine)",
          "SevenWayMeasuresSplitView",
          "BankPayoutAccountDetails"
        ],
        description: "Creator portal rendering verified royalty distributions and payout settlement history."
      },
      {
        id: "UX-POR-005",
        name: "Vendor & Procurement Portal",
        route: "/portal/vendor/:id",
        sourceFile: "src/web/workspace/counterparty-portals.ts",
        renderer: "renderVendorPortalHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "PortalShell",
          "VendorProfileCard",
          "PurchaseOrdersTable (Canonical PO records only)",
          "ExplicitDeferredStateNotice (PO domain deferred under DEC-RL1-SCOPE-001)",
          "InvoiceUploadForm"
        ],
        description: "Supplier portal presenting truthful empty states for deferred procurement modules."
      }
    ]
  },
  {
    group: "API Documentation, Styleguide & Visual Verification Surfaces",
    authority: "VMNL Engineering Standard / WCAG 2.2 AA Conformance",
    summary: "Supporting architectural verification surfaces ensuring code quality, contract stability, and design token compliance.",
    screens: [
      {
        id: "UX-DEV-001",
        name: "OpenAPI Interactive API Documentation",
        route: "/docs, /api/docs",
        sourceFile: "src/api/docs.ts",
        renderer: "renderDocsHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "Swagger/OpenAPIExplorer",
          "EndpointCategorySidebar",
          "SchemaDefinitionTables",
          "DownloadSpecButton (/api/v1/openapi.json)"
        ],
        description: "Comprehensive REST API contract explorer documenting all enterprise endpoints."
      },
      {
        id: "UX-DEV-002",
        name: "Design System Styleguide & Component Showcase",
        route: "/styleguide",
        sourceFile: "src/web/components/index.ts",
        renderer: "renderStyleguideHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "TokenSwatchesGrid (Primary, Neutral, Status colors)",
          "TypographyScaleViewer",
          "ComponentStateMatrix (renderButton, renderInputField, renderStatusChip, renderLoadingSkeleton, renderEmptyState, renderErrorState)",
          "AccessibleTouchTargetChecker (44x44px minimum)"
        ],
        description: "Living design system styleguide validating WCAG 2.2 Level AA accessibility tokens."
      },
      {
        id: "UX-DEV-003",
        name: "UI/UX Representative Prototypes Viewer",
        route: "/prototypes",
        sourceFile: "src/web/public/prototypes.ts",
        renderer: "renderPrototypesViewerHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "ScenarioController (normal, stale, blocked, recovery)",
          "ScreenSelectorPills (8 First-Release Critical Screens)",
          "RenderScreenSimulator",
          "ProvenanceWarningNotice"
        ],
        description: "Interactive prototype workbench testing critical release screens across failure scenarios."
      },
      {
        id: "UX-DEV-004",
        name: "Broadcast Operational Screens Visual Catalog",
        route: "/broadcast/screens",
        sourceFile: "src/web/public/screens-view.ts",
        renderer: "renderScreensCatalogHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "RoleFilterButtons (ExecutiveLeader, BroadcastDirector, RightsManager, TrafficManager, PlayoutOperator, FinanceController)",
          "ScreenCardsGrid (All 33 Broadcast Consoles)",
          "GateClearanceBadges",
          "DirectConsoleLink"
        ],
        description: "Visual grid catalog organizing all 33 broadcast operational screens by operational role."
      },
      {
        id: "UX-DEV-005",
        name: "Broadcast Operational Screen Detail & Inspector",
        route: "/broadcast/screens/:id",
        sourceFile: "src/web/public/screens-view.ts",
        renderer: "renderScreenDetailHtml()",
        status: "IMPLEMENTED",
        provenance: "DOMAIN_ENGINE",
        components: [
          "MasterLayout",
          "ScreenHeaderWithRoleBadge",
          "PermittedActionsList",
          "SimulatedStateControls (default, loading, error, empty)",
          "DirectLaunchButton (/broadcast/:route)"
        ],
        description: "Diagnostic inspector testing simulated component states for any broadcast console."
      }
    ]
  }
];

// Calculate totals
let totalScreensCount = 0;
inventory.forEach(g => totalScreensCount += g.screens.length);

console.log(`Inventory compiled: ${inventory.length} groups, ${totalScreensCount} total screens.`);

// Helper to escape HTML
function escape(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Generate Beautiful Document HTML
function generateHtml() {
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  
  let groupsHtml = "";
  let tocHtml = "";

  inventory.forEach((group, gIdx) => {
    const groupId = `group-${gIdx + 1}`;
    tocHtml += `
      <div class="toc-item">
        <a href="#${groupId}" class="toc-link">
          <span class="toc-num">${gIdx + 1}.</span>
          <span class="toc-title">${escape(group.group)}</span>
          <span class="toc-badge">${group.screens.length} screens</span>
        </a>
      </div>
    `;

    let screensHtml = "";
    group.screens.forEach((screen, sIdx) => {
      const statusBadgeClass = screen.status === "IMPLEMENTED" ? "badge-implemented" :
                               screen.status === "MOCK" ? "badge-mock" : "badge-alias";
      const provBadgeClass = screen.provenance === "DOMAIN_ENGINE" ? "badge-engine" : "badge-prov";

      const componentsListHtml = screen.components.map(c => `
        <li class="component-item">
          <span class="component-bullet">&bull;</span>
          <span class="component-name">${escape(c)}</span>
        </li>
      `).join("");

      screensHtml += `
        <div class="screen-card">
          <div class="screen-card-header">
            <div class="screen-title-group">
              <span class="screen-id">${escape(screen.id)}</span>
              <h4 class="screen-name">${escape(screen.name)}</h4>
            </div>
            <div class="screen-badges">
              <span class="badge ${statusBadgeClass}">${escape(screen.status)}</span>
              <span class="badge ${provBadgeClass}">${escape(screen.provenance)}</span>
            </div>
          </div>
          
          <div class="screen-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Route URL:</span>
              <code class="meta-code">${escape(screen.route)}</code>
            </div>
            <div class="meta-item">
              <span class="meta-label">Source File Location:</span>
              <code class="meta-code">${escape(screen.sourceFile)}</code>
            </div>
            <div class="meta-item full-width">
              <span class="meta-label">Handler / Renderer:</span>
              <code class="meta-code text-accent">${escape(screen.renderer)}</code>
            </div>
          </div>

          <p class="screen-description">${escape(screen.description)}</p>

          <div class="components-container">
            <div class="components-heading">Components Needed for this Page:</div>
            <ul class="components-list">
              ${componentsListHtml}
            </ul>
          </div>
        </div>
      `;
    });

    groupsHtml += `
      <section id="${groupId}" class="group-section">
        <div class="group-header">
          <div class="group-num">SECTION ${gIdx + 1}</div>
          <h2 class="group-title">${escape(group.group)}</h2>
          <div class="group-authority"><strong>Authority / Specification:</strong> ${escape(group.authority)}</div>
          <p class="group-summary">${escape(group.summary)}</p>
        </div>
        <div class="screens-container">
          ${screensHtml}
        </div>
      </section>
    `;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VMNL Pages Directory — Architectural Specification</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #64748B;
      }
      @bottom-left {
        content: "Virtual Media Network Limited · Confidential & Proprietary · pages.pdf";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #64748B;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      line-height: 1.45;
      font-size: 9.5pt;
      -webkit-font-smoothing: antialiased;
    }

    /* Cover Page */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 250mm;
      padding: 25mm 10mm 15mm 10mm;
      background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%);
      border: 1px solid #E2E8F0;
      border-radius: 6px;
    }

    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284C7;
      padding-bottom: 12px;
    }

    .brand-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 9pt;
      color: #0284C7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-badge {
      background: #0F172A;
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .cover-middle {
      margin: 30mm 0;
    }

    .main-doc-title {
      font-size: 28pt;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 12px;
    }

    .main-doc-sub {
      font-size: 13pt;
      color: #475569;
      font-weight: 400;
      line-height: 1.4;
      margin-bottom: 20px;
    }

    .exec-summary-box {
      background: #F0F9FF;
      border-left: 4px solid #0284C7;
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      margin-top: 15px;
    }

    .exec-summary-title {
      font-size: 10pt;
      font-weight: 700;
      color: #0369A1;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .exec-summary-text {
      font-size: 9pt;
      color: #334155;
      line-height: 1.5;
    }

    .kpi-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 25px;
    }

    .kpi-metric-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .kpi-metric-num {
      font-size: 20pt;
      font-weight: 800;
      color: #0284C7;
      line-height: 1;
      margin-bottom: 4px;
    }

    .kpi-metric-label {
      font-size: 8pt;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cover-bottom {
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #64748B;
    }

    /* Table of Contents */
    .toc-page {
      page-break-after: always;
      padding: 10mm 5mm;
    }

    .section-heading {
      font-size: 16pt;
      font-weight: 800;
      color: #0F172A;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .toc-item {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px 12px;
      transition: all 0.15s ease;
    }

    .toc-link {
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: inherit;
    }

    .toc-num {
      font-weight: 800;
      color: #0284C7;
      margin-right: 8px;
      font-size: 10pt;
    }

    .toc-title {
      font-weight: 600;
      color: #1E293B;
      font-size: 9pt;
      flex: 1;
    }

    .toc-badge {
      background: #E2E8F0;
      color: #475569;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      margin-left: 6px;
      white-space: nowrap;
    }

    /* Content Groups */
    .group-section {
      margin-bottom: 25px;
    }

    .group-header {
      background: #0F172A;
      color: #FFFFFF;
      padding: 14px 18px;
      border-radius: 6px;
      margin-bottom: 14px;
      page-break-after: avoid;
    }

    .group-num {
      font-size: 8pt;
      font-weight: 700;
      color: #38BDF8;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .group-title {
      font-size: 14pt;
      font-weight: 800;
      margin-bottom: 4px;
      line-height: 1.25;
    }

    .group-authority {
      font-size: 8pt;
      color: #94A3B8;
      margin-bottom: 6px;
    }

    .group-summary {
      font-size: 8.5pt;
      color: #E2E8F0;
      line-height: 1.4;
    }

    /* Screen Card */
    .screen-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    .screen-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .screen-title-group {
      flex: 1;
      margin-right: 12px;
    }

    .screen-id {
      display: inline-block;
      font-size: 8pt;
      font-weight: 800;
      color: #0284C7;
      background: #E0F2FE;
      padding: 1px 6px;
      border-radius: 3px;
      margin-bottom: 3px;
    }

    .screen-name {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.25;
    }

    .screen-badges {
      display: flex;
      gap: 5px;
    }

    .badge {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 2px 7px;
      border-radius: 3px;
      white-space: nowrap;
    }

    .badge-implemented { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
    .badge-mock { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
    .badge-alias { background: #F3E8FF; color: #6B21A8; border: 1px solid #D8B4FE; }
    .badge-engine { background: #E0F2FE; color: #075985; border: 1px solid #BAE6FD; }
    .badge-prov { background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }

    .screen-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
      margin-bottom: 8px;
      font-size: 8.5pt;
      background: #F8FAFC;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #F1F5F9;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
    }

    .meta-item.full-width {
      grid-column: 1 / -1;
    }

    .meta-label {
      color: #64748B;
      font-weight: 600;
      font-size: 7.5pt;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .meta-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      color: #0F172A;
      background: #FFFFFF;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #E2E8F0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-accent {
      color: #0369A1;
      font-weight: 600;
    }

    .screen-description {
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .components-container {
      border-top: 1px dashed #E2E8F0;
      padding-top: 8px;
    }

    .components-heading {
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .components-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3px 12px;
      list-style: none;
    }

    .component-item {
      display: flex;
      align-items: baseline;
      font-size: 8pt;
      color: #1E293B;
      line-height: 1.35;
    }

    .component-bullet {
      color: #0284C7;
      font-weight: bold;
      margin-right: 5px;
    }

    .component-name {
      font-weight: 500;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-top">
      <div>
        <div class="brand-title">Virtual Media Network Limited</div>
        <div class="brand-sub">Enterprise Engineering & Broadcast Architecture</div>
      </div>
      <div class="doc-badge">DOC-PAGES-001 / R1.2</div>
    </div>

    <div class="cover-middle">
      <h1 class="main-doc-title">Project Pages, Locations & Component Specification</h1>
      <p class="main-doc-sub">A comprehensive master directory and component breakdown for all public, operational, workspace, broadcast, and governance pages across the VMNL ecosystem.</p>

      <div class="exec-summary-box">
        <div class="exec-summary-title">Architecture & Reconciliation Basis</div>
        <p class="exec-summary-text">
          Grounded directly in the verified Screen Register (<code>docs/decisions/screen-register.json</code>, verified by <code>tests/unit/screen-register-verification.test.ts</code>), the 33 Broadcast Operational Screen Inventory (R1.2A §46), and the production API router (<code>src/api/router.ts</code>). Every page item details its exact route URI, source implementation location, server-side HTML renderer, authority specification, and the full matrix of UI components required for assembly.
        </p>
      </div>

      <div class="kpi-metrics-grid">
        <div class="kpi-metric-card">
          <div class="kpi-metric-num">${totalScreensCount}</div>
          <div class="kpi-metric-label">Documented Screens</div>
        </div>
        <div class="kpi-metric-card">
          <div class="kpi-metric-num">${inventory.length}</div>
          <div class="kpi-metric-label">Functional Domains</div>
        </div>
        <div class="kpi-metric-card">
          <div class="kpi-metric-num">33</div>
          <div class="kpi-metric-label">Broadcast Consoles</div>
        </div>
        <div class="kpi-metric-card">
          <div class="kpi-metric-num">111+</div>
          <div class="kpi-metric-label">Reachable HTML Paths</div>
        </div>
      </div>
    </div>

    <div class="cover-bottom">
      <div>Generated: ${dateStr} · Engine: Node.js & Playwright Chromium</div>
      <div>WCAG 2.2 Level AA · Design Token Disciplined</div>
    </div>
  </div>

  <!-- Table of Contents Page -->
  <div class="toc-page">
    <div class="section-heading">
      <span>Table of Contents</span>
      <span style="font-size: 9pt; color: #64748B; font-weight: 500;">Master Domain Classification</span>
    </div>

    <div class="toc-grid">
      ${tocHtml}
    </div>

    <div style="margin-top: 25px; padding: 14px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px;">
      <h4 style="font-size: 9.5pt; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Component State & WCAG 2.2 AA Standards</h4>
      <p style="font-size: 8.5pt; color: #475569; line-height: 1.45;">
        Every interactive component documented herein implements complete state handling (<code>default</code>, <code>hover</code>, <code>active</code>, <code>focus-visible</code>, <code>disabled</code>, <code>loading</code>, <code>error</code>, <code>empty</code>) adhering to the 4px/8px design token grid, high-contrast palette (&ge;4.5:1 text, &ge;3:1 UI controls), minimum 44&times;44px touch targets, and full ARIA semantics without arbitrary inline overrides.
      </p>
    </div>
  </div>

  <!-- Content Sections -->
  ${groupsHtml}

</body>
</html>
  `;
}

// Generate PDF via Playwright
async function buildPdf() {
  console.log("Generating document HTML...");
  const html = generateHtml();
  const tempHtmlPath = path.resolve("pages_temp.html");
  fs.writeFileSync(tempHtmlPath, html, "utf8");
  console.log(`Wrote temporary HTML to ${tempHtmlPath}`);

  console.log("Launching Chromium browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Loading page content into browser...");
  await page.setContent(html, { waitUntil: "networkidle" });
  
  console.log("Rendering pages.pdf...");
  await page.pdf({
    path: OUTPUT_PDF,
    format: "A4",
    printBackground: true,
    margin: {
      top: "16mm",
      bottom: "16mm",
      left: "14mm",
      right: "14mm"
    }
  });

  await browser.close();
  
  // Cleanup temp HTML
  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }

  const stat = fs.statSync(OUTPUT_PDF);
  console.log(`\n======================================================`);
  console.log(`SUCCESS: pages.pdf created successfully!`);
  console.log(`Location: ${OUTPUT_PDF}`);
  console.log(`Size: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`Total documented screens catalogued: ${totalScreensCount}`);
  console.log(`======================================================\n`);
}

buildPdf().catch(err => {
  console.error("FATAL ERROR creating PDF:", err);
  process.exit(1);
});
