/**
 * Public VMN Corporate Portal Pages & Structured Metadata
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §9 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Core Mandate:
 * Executive leadership, corporate governance, three enterprise pillars overview,
 * investor relations, RFP submissions, and 100/100 Lighthouse performance.
 */

export interface CorporatePillar {
  name: string;
  tagline: string;
  description: string;
  keyAssets: string[];
  route: string;
}

export const VMN_ENTERPRISE_PILLARS: CorporatePillar[] = [
  {
    name: "Linear Television & Broadcast Operations",
    tagline: "24/7 Premium DTT/DTH Channels Reaching Millions",
    description:
      "Operator of Nigeria's flagship television networks on StarTimes: Nigezie Xtreme (Ch 428 DTT / 312 DTH), Orisun (Ch 430 DTT / 315 DTH), and Isi Mbido (Ch 432 DTT / 318 DTH).",
    keyAssets: ["Nigezie Xtreme (NXTR)", "Orisun (ORIS)", "Isi Mbido (IMBD)"],
    route: "/channels",
  },
  {
    name: "Creative Economy Hub",
    tagline: "End-to-End Infrastructure for African Creators",
    description:
      "A comprehensive ecosystem integrating talent development, formal academy certification, professional studio facilities, slate financing, and international syndication.",
    keyAssets: [
      "Talent Accelerator",
      "AFCA Academy",
      "Afro-Fusion Creatives",
      "VTM",
      "VCF Slate Fund",
      "ONE Studios",
      "Fusion Events",
      "TEND Distribution",
    ],
    route: "/hub",
  },
  {
    name: "Azeebo+ Direct-to-Consumer Ecosystem",
    tagline: "Federated Digital Entertainment Across 8 Universes",
    description:
      "External consumer streaming and social video platform spanning Vertical, Movies, Lifestyle, Comedy, Creator, Reality, Games, and Sports.",
    keyAssets: ["Azeebo+ Streaming App", "Universe Gateways", "Broadcast QR Attribution"],
    route: "https://azeebo.plus",
  },
];

export interface LeadershipMember {
  name: string;
  title: string;
  bio: string;
  linkedInUrl?: string;
}

export const VMN_LEADERSHIP: LeadershipMember[] = [
  {
    name: "Femi Aderibigbe (Kwame)",
    title: "Chief Executive Officer & Founder",
    bio: "Pioneer in Nigerian television and music entertainment, creator of Nigezie and architect of Virtual Media Network Limited.",
  },
  {
    name: "Chief Operating Officer",
    title: "Chief Operating Officer",
    bio: "Directs broadcast engineering, StarTimes carriage relationships, and commercial operations across linear and digital units.",
  },
  {
    name: "Head of Academy & Talent",
    title: "Director, AFCA & Talent Accelerator",
    bio: "Oversees curriculum development, industry guild accreditations, and national partner hub operations.",
  },
];

export class CorporatePortalService {
  public static getSeoMetadata(): {
    title: string;
    description: string;
    canonicalUrl: string;
    openGraph: Record<string, string>;
  } {
    return {
      title: "Virtual Media Network Limited (VMNL) | Africa's Premier Media & Creative Hub",
      description:
        "Virtual Media Network Limited (VMNL) orchestrates 24/7 linear broadcast television (Nigezie Xtreme, Orisun, Isi Mbido), the VMN Creative Economy Hub, and the federated Azeebo+ ecosystem.",
      canonicalUrl: "https://vmnl.ng",
      openGraph: {
        "og:type": "website",
        "og:title": "Virtual Media Network Limited (VMNL)",
        "og:description": "Powering the African Creative Economy through Linear Broadcast, Hub Infrastructure, and Azeebo+.",
        "og:image": "https://vmnl.ng/assets/og-vmnl-master.jpg",
        "og:url": "https://vmnl.ng",
      },
    };
  }

  public static renderOverviewHtml(): string {
    const pillarsHtml = VMN_ENTERPRISE_PILLARS.map(
      (p) => `
      <article class="vmn-pillar-card">
        <h3>${p.name}</h3>
        <p class="vmn-pillar-tagline"><strong>${p.tagline}</strong></p>
        <p>${p.description}</p>
        <ul>${p.keyAssets.map((a) => `<li>${a}</li>`).join("")}</ul>
      </article>`
    ).join("");

    return `
<section class="vmn-corporate-overview" aria-labelledby="vmn-mission-heading">
  <h1 id="vmn-mission-heading">Virtual Media Network Limited</h1>
  <p class="vmn-hero-lead">Unifying broadcast excellence, creative talent acceleration, and next-generation consumer distribution.</p>
  <div class="vmn-pillars-grid">${pillarsHtml}</div>
</section>`.trim();
  }
}
