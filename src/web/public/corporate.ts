/**
 * Public VMN Corporate Portal Pages & Structured Metadata
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §9 / VMNL-AZP-VMN-CCPP-001 §8
 *
 * Provides public company, service-concept, and directory profile content.
 * Leadership and operational claims require approved source records before publication.
 */

import { escapeHtml } from "../components/escape.js";

export interface CorporatePillar {
  name: string;
  tagline: string;
  description: string;
  keyAssets: string[];
  route: string;
}

export const VMN_ENTERPRISE_PILLARS: CorporatePillar[] = [
  {
    name: "Linear Television Channel Profiles",
    tagline: "Channel profiles — carriage and live status unverified",
    description:
      "Nigezie Xtreme, Orisun, and Isi Mbido channel profiles. Carriage and transmission details require independent verification.",
    keyAssets: ["Nigezie Xtreme (NXTR)", "Orisun (ORIS)", "Isi Mbido (IMBD)"],
    route: "/channels",
  },
  {
    name: "Creative Economy Hub",
    tagline: "Creative-Economy Programme Areas (Availability Unverified)",
    description:
      "The Creative Economy Hub describes proposed programme areas. Accreditation, facilities, funding, services, and distribution availability require current independent confirmation.",
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
    name: "Azeebo+ Federated Service",
    tagline: "Federated Digital Entertainment Service Information",
    description:
      "Azeebo+ is a separate federated service. Its catalogue, features, availability, and audience attribution are not verified by this site.",
    keyAssets: ["Azeebo+ service information (federated; availability unverified)"],
    // TSK-35: this is a public page, not a federation endpoint. It points at the
    // internal Azeebo+ information page, which itself prints an outbound link only
    // when a deployment configures AZEEBO_PLUS_UNIVERSAL_URL.
    route: "/azeebo",
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
    bio: "Public biography, appointment, and association with the company have not been independently verified for this directory.",
  },
  {
    name: "Chief Operating Officer",
    title: "Chief Operating Officer",
    bio: "Role profile only; identity, appointment, responsibilities, and external carriage relationships are not verified for publication.",
  },
  {
    name: "Academy & Talent Leadership",
    title: "Role profile — appointment unverified",
    bio: "Appointment, accreditations, and partner hub operations are not verified for publication.",
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
      title: "Virtual Media Network Limited (VMNL) | Company Information",
      description:
        "Virtual Media Network Limited company information and preliminary service profiles. Broadcast, service availability, and federation status require independent confirmation.",
      canonicalUrl: "https://vmnl.ng",
      openGraph: {
        "og:type": "website",
        "og:title": "Virtual Media Network Limited (VMNL)",
        "og:description": "Company information and preliminary service profiles. Broadcast, reach, service availability, and federation status require independent confirmation.",
        "og:image": "https://vmnl.ng/assets/og-vmnl-master.png",
        "og:url": "https://vmnl.ng",
      },
    };
  }

  public static renderOverviewHtml(): string {
    const pillarsHtml = VMN_ENTERPRISE_PILLARS.map(
      (p) => `
      <article class="vmn-pillar-card">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="vmn-pillar-tagline"><strong>${escapeHtml(p.tagline)}</strong></p>
        <p>${escapeHtml(p.description)}</p>
        <ul>${p.keyAssets.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
      </article>`
    ).join("");

    return `
<section class="vmn-corporate-overview" aria-labelledby="vmn-mission-heading">
  <h1 id="vmn-mission-heading">Virtual Media Network Limited</h1>
  <p class="vmn-hero-lead">Company information and preliminary service profiles. Operational reach, availability, and federation status require independent confirmation.</p>
  <div class="vmn-pillars-grid">${pillarsHtml}</div>
</section>`.trim();
  }
}
