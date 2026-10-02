/**
 * Commercial Rate Cards & Pricing Matrix Configuration
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §42, §70
 *
 * PROVISIONAL / UNVERIFIED NOTICE (F-9-12, T9-14):
 * Commercial rate cards, spot multipliers, and advertising prices are negotiated commercial facts
 * owned exclusively by Finance and Ad Sales. The figures below are strictly marked PROVISIONAL / UNVERIFIED
 * for platform operation and testing pending formal commercial rate card gazetting by the Commercial Director.
 */

import { DaypartClassification } from "./index.js";

export interface RateCardEntry {
  channelCode: string;
  daypart: DaypartClassification;
  baseRate30sNgn: number;
  premiumMultiplier: number;
  currency: string;
  isProvisional: boolean;
  notes: string;
}

export const PROVISIONAL_RATE_CARDS: RateCardEntry[] = [
  // NXTR (Nigezie Xtreme)
  {
    channelCode: "NXTR",
    daypart: "PRIME_TIME",
    baseRate30sNgn: 450_000,
    premiumMultiplier: 1.25,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "NXTR",
    daypart: "DAYTIME",
    baseRate30sNgn: 250_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "NXTR",
    daypart: "LATE_NIGHT",
    baseRate30sNgn: 150_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "NXTR",
    daypart: "EARLY_MORNING",
    baseRate30sNgn: 180_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "NXTR",
    daypart: "EARLY_FRINGE",
    baseRate30sNgn: 280_000,
    premiumMultiplier: 1.1,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },

  // ORIS (Orisun)
  {
    channelCode: "ORIS",
    daypart: "PRIME_TIME",
    baseRate30sNgn: 450_000,
    premiumMultiplier: 1.25,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "ORIS",
    daypart: "DAYTIME",
    baseRate30sNgn: 250_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "ORIS",
    daypart: "LATE_NIGHT",
    baseRate30sNgn: 150_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "ORIS",
    daypart: "EARLY_MORNING",
    baseRate30sNgn: 180_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "ORIS",
    daypart: "EARLY_FRINGE",
    baseRate30sNgn: 280_000,
    premiumMultiplier: 1.1,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },

  // IMBD (Isi Mbido)
  {
    channelCode: "IMBD",
    daypart: "PRIME_TIME",
    baseRate30sNgn: 450_000,
    premiumMultiplier: 1.25,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "IMBD",
    daypart: "DAYTIME",
    baseRate30sNgn: 250_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "IMBD",
    daypart: "LATE_NIGHT",
    baseRate30sNgn: 150_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "IMBD",
    daypart: "EARLY_MORNING",
    baseRate30sNgn: 180_000,
    premiumMultiplier: 1.0,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
  {
    channelCode: "IMBD",
    daypart: "EARLY_FRINGE",
    baseRate30sNgn: 280_000,
    premiumMultiplier: 1.1,
    currency: "NGN",
    isProvisional: true,
    notes: "PROVISIONAL / UNVERIFIED - Subject to Finance/Ad Sales sign-off",
  },
];
