/**
 * Golden Test Datasets Compilation
 * Authority: VMNL-AZP-VMN-CCPP-001 §15 / VMNL-AZP-VMN-BRD-PRD-001 — R1.2A
 *
 * Deterministic datasets for:
 * - 3 Linear Channels (NXTR, ORIS, IMBD)
 * - 50 Programmes across Drama, Music, Culture, News, and Formats
 * - 200 Episodes with complete metadata and version records
 * - 14 Full Days of 24/7 broadcast schedule grids
 * - 10 Commercial Campaigns with spot bookings and rate cards
 * - 10 As-Run Logs with clean airings, preemptions, and discrepancies
 * - 20 Talent Profiles, 5 AFCA Courses, 10 VCF Slates, and 5 TEND Distribution Deals
 */

export interface GoldenDataset {
  // AUD-09: dtt/dth carriage numbers are optional and unset in golden data —
  // no fabricated StarTimes carriage facts (CLAUDE.md broadcast law).
  channels: Array<{ id: string; name: string; code: string; dtt?: number; dth?: number }>;
  programmes: Array<{ id: string; title: string; genre: string; totalEpisodes: number }>;
  episodes: Array<{ id: string; programmeId: string; episodeNumber: number; durationSeconds: number }>;
  schedules: Array<{ date: string; channelId: string; itemCount: number }>;
  commercialCampaigns: Array<{ id: string; clientName: string; brandCategory: string; spotCount: number }>;
  asRunLogs: Array<{ id: string; date: string; channelId: string; matchRatePercent: number }>;
  talentProfiles: Array<{ id: string; fullName: string; primarySkill: string; tier: string }>;
  afcaCourses: Array<{ id: string; courseCode: string; title: string; credits: number }>;
  vcfSlates: Array<{ id: string; title: string; budgetNgn: number; stage: string }>;
  tendDeals: Array<{ id: string; title: string; territory: string; feeUsd: number }>;
}

export function generateGoldenDataset(): GoldenDataset {
  // 1. Channels
  const channels = [
    { id: "CHN-NXTR", name: "Nigezie Xtreme", code: "NXTR" },
    { id: "CHN-ORIS", name: "Orisun", code: "ORIS" },
    { id: "CHN-IMBD", name: "Isi Mbido", code: "IMBD" },
  ];

  // 2. 50 Programmes
  const genres = ["Afrobeat Music", "Yoruba Drama", "Igbo Culture", "Youth Lifestyle", "Documentary"];
  const programmes: GoldenDataset["programmes"] = [];
  for (let i = 1; i <= 50; i++) {
    const genre = genres[i % genres.length];
    programmes.push({
      id: `PRG-GOLDEN-${String(i).padStart(3, "0")}`,
      title: `VMN Flagship Show ${i} (${genre})`,
      genre,
      totalEpisodes: 4,
    });
  }

  // 3. 200 Episodes (4 episodes per programme)
  const episodes: GoldenDataset["episodes"] = [];
  let epCounter = 1;
  for (const prog of programmes) {
    for (let ep = 1; ep <= 4; ep++) {
      episodes.push({
        id: `EP-${String(epCounter).padStart(4, "0")}`,
        programmeId: prog.id,
        episodeNumber: ep,
        durationSeconds: 1800, // 30 minutes
      });
      epCounter++;
    }
  }

  // 4. 14 Full Days of Schedules
  const schedules: GoldenDataset["schedules"] = [];
  for (let day = 1; day <= 14; day++) {
    const dateStr = `2026-05-${String(day).padStart(2, "0")}`;
    for (const ch of channels) {
      schedules.push({
        date: dateStr,
        channelId: ch.id,
        itemCount: 48, // 48 half-hour slots per 24 hours
      });
    }
  }

  // 5. 10 Commercial Campaigns
  const categories = ["BANKING", "TELECOMS", "FMCG_BEVERAGES", "AUTOMOTIVE", "FINTECH"];
  const commercialCampaigns: GoldenDataset["commercialCampaigns"] = [];
  for (let c = 1; c <= 10; c++) {
    commercialCampaigns.push({
      id: `CMP-GOLDEN-${c}`,
      clientName: `Corporate Client ${c}`,
      brandCategory: categories[c % categories.length],
      spotCount: 60,
    });
  }

  // 6. 10 As-Run Logs
  const asRunLogs: GoldenDataset["asRunLogs"] = [];
  for (let a = 1; a <= 10; a++) {
    asRunLogs.push({
      id: `ASRUN-LOG-2026-05-${String(a).padStart(2, "0")}`,
      date: `2026-05-${String(a).padStart(2, "0")}`,
      channelId: channels[a % channels.length].id,
      matchRatePercent: a === 8 ? 96.5 : 100, // Log 8 has minor discrepancy for drill
    });
  }

  // 7. 20 Talent Profiles
  const skills = ["ACTING", "DIRECTING", "CINEMATOGRAPHY", "EDITING", "SOUND_DESIGN"];
  const tiers = ["EMERGING", "VERIFIED", "PROFESSIONAL", "MASTER"];
  const talentProfiles: GoldenDataset["talentProfiles"] = [];
  for (let t = 1; t <= 20; t++) {
    talentProfiles.push({
      id: `TAL-GOLDEN-${t}`,
      fullName: `Talent Artist ${t}`,
      primarySkill: skills[t % skills.length],
      tier: tiers[t % tiers.length],
    });
  }

  // 8. 5 AFCA Courses
  const afcaCourses = [
    { id: "CRS-DIR-101", courseCode: "AFCA-DIR-101", title: "Directing Foundations", credits: 12 },
    { id: "CRS-CIN-201", courseCode: "AFCA-CIN-201", title: "Advanced Cinematography", credits: 16 },
    { id: "CRS-SCR-101", courseCode: "AFCA-SCR-101", title: "Screenwriting Masterclass", credits: 10 },
    { id: "CRS-EDT-201", courseCode: "AFCA-EDT-201", title: "Post-Production & Editing", credits: 14 },
    { id: "CRS-SND-101", courseCode: "AFCA-SND-101", title: "Broadcast Audio & Sound Design", credits: 12 },
  ];

  // 9. 10 VCF Slates
  const vcfSlates: GoldenDataset["vcfSlates"] = [];
  const stages = ["DEVELOPMENT", "PRE_PRODUCTION", "PRODUCTION", "POST_PRODUCTION", "DELIVERY"];
  for (let s = 1; s <= 10; s++) {
    vcfSlates.push({
      id: `SLT-GOLDEN-${s}`,
      title: `Slate Project ${s}`,
      budgetNgn: 35000000 + s * 5000000,
      stage: stages[s % stages.length],
    });
  }

  // 10. 5 TEND Deals
  const tendDeals = [
    { id: "LIC-TEND-01", title: "Delta Warriors", territory: "WEST_AFRICA", feeUsd: 25000 },
    { id: "LIC-TEND-02", title: "Lagos Nightlife", territory: "GLOBAL", feeUsd: 50000 },
    { id: "LIC-TEND-03", title: "Heritage of Oduduwa", territory: "UK_DIASPORA", feeUsd: 18000 },
    { id: "LIC-TEND-04", title: "Igbo Masquerade", territory: "PAN_AFRICA", feeUsd: 22000 },
    { id: "LIC-TEND-05", title: "Afrobeat Icons", territory: "NORTH_AMERICA", feeUsd: 40000 },
  ];

  return {
    channels,
    programmes,
    episodes,
    schedules,
    commercialCampaigns,
    asRunLogs,
    talentProfiles,
    afcaCourses,
    vcfSlates,
    tendDeals,
  };
}
