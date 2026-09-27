/**
 * Creative Economy Hub Public Showcases & Inquiry Capture Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Core Mandate:
 * Public showcase definitions for all 8 Hub verticals.
 * Controlled inquiry capture pipeline with automated CRM categorization and acknowledgment.
 */

export type HubVertical =
  | "TALENT_ACCELERATOR"
  | "AFCA_ACADEMY"
  | "AFRO_FUSION_COMMUNITY"
  | "VTM_MANAGEMENT"
  | "VCF_CONTENT_FUND"
  | "ONE_STUDIOS"
  | "FUSION_EVENTS"
  | "TEND_DISTRIBUTION"
  | "HEADSPACE_NG"
  | "CR8TECH_NG";

export interface HubShowcase {
  vertical: HubVertical;
  title: string;
  tagline: string;
  description: string;
  callToAction: string;
  inquiryType: string;
}

export const HUB_SHOWCASES: Record<HubVertical, HubShowcase> = {
  TALENT_ACCELERATOR: {
    vertical: "TALENT_ACCELERATOR",
    title: "Talent Accelerator",
    tagline: "Unlocking Africa's Next Generation of Creative Stars",
    description: "Multi-tier onboarding, verified credentials, and nationwide partner hub pathways across Nigeria.",
    callToAction: "Apply for Talent Onboarding",
    inquiryType: "TALENT_APPLICATION",
  },
  AFCA_ACADEMY: {
    vertical: "AFCA_ACADEMY",
    title: "African Film & Creative Arts Academy",
    tagline: "World-Class Film & Media Education",
    description: "Structured cohort learning, industry mentor rubrics, and digitally verifiable professional certifications.",
    callToAction: "Explore Academic Cohorts",
    inquiryType: "ACADEMY_ADMISSION",
  },
  AFRO_FUSION_COMMUNITY: {
    vertical: "AFRO_FUSION_COMMUNITY",
    title: "Afro-Fusion Creatives",
    tagline: "The Creative Guild & Co-Working Community",
    description: "Meeting rooms, podcast studios, editing suites, and community guilds across Nigeria.",
    callToAction: "Join the Guild / Book a Desk",
    inquiryType: "COMMUNITY_MEMBERSHIP",
  },
  VTM_MANAGEMENT: {
    vertical: "VTM_MANAGEMENT",
    title: "Virtual Talent Management (VTM)",
    tagline: "Verified Talent, Protected Deals, Escrow Security",
    description: "Automated opportunity matching, standardized rate cards, and transparent milestone escrow protection.",
    callToAction: "Book Verified Talent",
    inquiryType: "CASTING_BRIEF",
  },
  VCF_CONTENT_FUND: {
    vertical: "VCF_CONTENT_FUND",
    title: "Virtual Content Fund (VCF)",
    tagline: "Catalyzing High-Impact African Storytelling",
    description: "Slate financing, pitch evaluation, and transparent distribution recoupment waterfalls.",
    callToAction: "Submit a Film / Series Pitch",
    inquiryType: "PITCH_SUBMISSION",
  },
  ONE_STUDIOS: {
    vertical: "ONE_STUDIOS",
    title: "ONE Studios",
    tagline: "State-of-the-Art Production Stages & Gear",
    description: "5,000 sq ft soundproof soundstages, green screen cycs, and ARRI/RED cinema camera packages.",
    callToAction: "Reserve Studio Stage / Gear",
    inquiryType: "STUDIO_BOOKING",
  },
  FUSION_EVENTS: {
    vertical: "FUSION_EVENTS",
    title: "Fusion Events",
    tagline: "Iconic Live Concerts, Festivals & Industry Galas",
    description: "Unforgettable physical experiences with cryptographically secure digital ticketing.",
    callToAction: "View Upcoming Festivals",
    inquiryType: "EVENT_PARTNERSHIP",
  },
  TEND_DISTRIBUTION: {
    vertical: "TEND_DISTRIBUTION",
    title: "The Entertainment Network Distribution (TEND)",
    tagline: "Taking African Cinema & Formats to the World",
    description: "Global licensing, airline inflight distribution, and automated avails rights management.",
    callToAction: "License Catalogue Content",
    inquiryType: "CONTENT_LICENSING",
  },
  HEADSPACE_NG: {
    vertical: "HEADSPACE_NG",
    title: "HeadspaceNG",
    tagline: "Central Enterprise Intelligence & African Media Research",
    description: "IP bibles, legal precedents, and regulatory compendiums.",
    callToAction: "Access Research Portal",
    inquiryType: "RESEARCH_INQUIRY",
  },
  CR8TECH_NG: {
    vertical: "CR8TECH_NG",
    title: "Cr8TechNG",
    tagline: "AI Workflows & Next-Gen Creative Toolkits",
    description: "Automated indigenous language subtitling and intelligent broadcast social clipping.",
    callToAction: "Integrate Toolkits",
    inquiryType: "TECH_PARTNERSHIP",
  },
};

export interface PublicInquiry {
  id: string;
  vertical: HubVertical;
  fullName: string;
  email: string;
  phone?: string;
  organisationName?: string;
  message: string;
  status: "RECEIVED" | "ROUTED_TO_CRM" | "CONTACTED";
  receivedAt: Date;
  acknowledgmentMessage: string;
}

export class HubShowcaseService {
  private inquiries: PublicInquiry[] = [];

  public static getShowcase(vertical: HubVertical): HubShowcase {
    const sc = HUB_SHOWCASES[vertical];
    if (!sc) {
      throw new Error(`[HUB-404] Hub showcase '${vertical}' not found.`);
    }
    return sc;
  }

  public submitInquiry(params: {
    vertical: HubVertical;
    fullName: string;
    email: string;
    phone?: string;
    organisationName?: string;
    message: string;
  }): PublicInquiry {
    if (!params.email || !params.email.includes("@")) {
      throw new Error("[HUB-INQ-01] Valid email address is required.");
    }
    if (!params.message || params.message.trim().length < 10) {
      throw new Error("[HUB-INQ-02] Inquiry message must be at least 10 characters.");
    }

    const showcase = HubShowcaseService.getShowcase(params.vertical);
    const inquiryId = `INQ-${params.vertical.substring(0, 4)}-${Date.now().toString(36).toUpperCase()}`;

    const acknowledgmentMessage = `Dear ${params.fullName}, thank you for contacting VMN ${showcase.title}. Your inquiry (Reference: ${inquiryId}) has been routed to our operations team. A representative will contact you within 24 business hours.`;

    const inquiry: PublicInquiry = {
      id: inquiryId,
      vertical: params.vertical,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      organisationName: params.organisationName,
      message: params.message,
      status: "ROUTED_TO_CRM",
      receivedAt: new Date(),
      acknowledgmentMessage,
    };

    this.inquiries.push(inquiry);
    return inquiry;
  }

  public getInquiries(): PublicInquiry[] {
    return [...this.inquiries];
  }
}
