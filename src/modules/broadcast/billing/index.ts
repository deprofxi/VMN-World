/**
 * Linear Broadcast Commercial Billing & Rate Card Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §42, §70
 *
 * Core Mandate:
 * Dynamic daypart rate cards, spot-to-contract binding, billing schedule generation,
 * and reconciliation of aired commercial inventory to legally enforceable invoices.
 */

export type DaypartClassification = "EARLY_MORNING" | "DAYTIME" | "EARLY_FRINGE" | "PRIME_TIME" | "LATE_NIGHT";

export interface RateCardEntry {
  channelCode: string;
  daypart: DaypartClassification;
  baseRate30sNgn: number;
  premiumMultiplier: number; // e.g. 1.35 for live events, 1.20 for top chart premieres
  currency: string;
}

export interface CommercialBillingSchedule {
  id: string;
  campaignCode: string;
  clientName: string;
  brand: string;
  channelCode: string;
  contractedSpots: number;
  airedSpotsMatched: number;
  totalContractValueNgn: number;
  recognizedRevenueNgn: number;
  billingStatus: "SCHEDULED" | "AIRING_IN_PROGRESS" | "READY_FOR_INVOICE" | "INVOICED" | "PAID";
  startDate: Date;
  endDate: Date;
}

export class BroadcastBillingEngine {
  private rateCards = new Map<string, RateCardEntry>();
  private billingSchedules = new Map<string, CommercialBillingSchedule>();

  constructor() {
    this.seedDefaultRateCards();
  }

  private seedDefaultRateCards(): void {
    const channels = ["NXTR", "ORIS", "IMBD"];
    for (const ch of channels) {
      this.rateCards.set(`${ch}:PRIME_TIME`, {
        channelCode: ch,
        daypart: "PRIME_TIME",
        baseRate30sNgn: 450_000,
        premiumMultiplier: 1.25,
        currency: "NGN",
      });
      this.rateCards.set(`${ch}:DAYTIME`, {
        channelCode: ch,
        daypart: "DAYTIME",
        baseRate30sNgn: 250_000,
        premiumMultiplier: 1.0,
        currency: "NGN",
      });
      this.rateCards.set(`${ch}:LATE_NIGHT`, {
        channelCode: ch,
        daypart: "LATE_NIGHT",
        baseRate30sNgn: 150_000,
        premiumMultiplier: 1.0,
        currency: "NGN",
      });
      this.rateCards.set(`${ch}:EARLY_MORNING`, {
        channelCode: ch,
        daypart: "EARLY_MORNING",
        baseRate30sNgn: 180_000,
        premiumMultiplier: 1.0,
        currency: "NGN",
      });
      this.rateCards.set(`${ch}:EARLY_FRINGE`, {
        channelCode: ch,
        daypart: "EARLY_FRINGE",
        baseRate30sNgn: 280_000,
        premiumMultiplier: 1.1,
        currency: "NGN",
      });
    }
  }

  public calculateSpotPrice(
    channelCode: string,
    daypart: DaypartClassification,
    durationSeconds: number = 30,
    specialEventMultiplier: number = 1.0
  ): number {
    const entry = this.rateCards.get(`${channelCode}:${daypart}`);
    const base = entry ? entry.baseRate30sNgn : 300_000;
    const daypartMultiplier = entry ? entry.premiumMultiplier : 1.0;
    const durationRatio = durationSeconds / 30;

    return Math.round(base * daypartMultiplier * specialEventMultiplier * durationRatio);
  }

  public createBillingSchedule(params: {
    campaignCode: string;
    clientName: string;
    brand: string;
    channelCode: string;
    spots: Array<{ daypart: DaypartClassification; durationSeconds: number }>;
    startDate: Date;
    endDate: Date;
  }): CommercialBillingSchedule {
    let totalValue = 0;
    for (const spot of params.spots) {
      totalValue += this.calculateSpotPrice(params.channelCode, spot.daypart, spot.durationSeconds);
    }

    const schedule: CommercialBillingSchedule = {
      id: `BIL-${params.campaignCode}-${Date.now().toString(36).toUpperCase()}`,
      campaignCode: params.campaignCode,
      clientName: params.clientName,
      brand: params.brand,
      channelCode: params.channelCode,
      contractedSpots: params.spots.length,
      airedSpotsMatched: 0,
      totalContractValueNgn: totalValue,
      recognizedRevenueNgn: 0,
      billingStatus: "SCHEDULED",
      startDate: params.startDate,
      endDate: params.endDate,
    };

    this.billingSchedules.set(params.campaignCode, schedule);
    return schedule;
  }

  public linkAiredSpotToContract(
    campaignCode: string,
    spotValueNgn: number
  ): { schedule: CommercialBillingSchedule; invoiceReady: boolean } {
    const schedule = this.billingSchedules.get(campaignCode);
    if (!schedule) {
      throw new Error(`[BIL-LINK-01] Commercial campaign schedule '${campaignCode}' not found.`);
    }

    schedule.airedSpotsMatched += 1;
    schedule.recognizedRevenueNgn += spotValueNgn;

    if (schedule.airedSpotsMatched >= schedule.contractedSpots) {
      schedule.billingStatus = "READY_FOR_INVOICE";
    } else {
      schedule.billingStatus = "AIRING_IN_PROGRESS";
    }

    return {
      schedule,
      invoiceReady: schedule.billingStatus === "READY_FOR_INVOICE",
    };
  }

  public getBillingSchedule(campaignCode: string): CommercialBillingSchedule | undefined {
    return this.billingSchedules.get(campaignCode);
  }
}
