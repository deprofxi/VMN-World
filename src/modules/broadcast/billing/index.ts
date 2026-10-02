/**
 * Linear Broadcast Commercial Billing & Rate Card Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §14, §42, §70
 *
 * Core Mandate:
 * Dynamic daypart rate cards, spot-to-contract binding, billing schedule generation,
 * and reconciliation of aired commercial inventory to legally enforceable invoices.
 */

import { PROVISIONAL_RATE_CARDS, RateCardEntry } from "./rate-cards.config.js";
export { RateCardEntry, PROVISIONAL_RATE_CARDS };

export type DaypartClassification = "EARLY_MORNING" | "DAYTIME" | "EARLY_FRINGE" | "PRIME_TIME" | "LATE_NIGHT";

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

/** TODO-FIN-07: missed-spot obligation raised from as-run reconciliation. */
export interface BillingMakeGood {
  id: string;
  campaignCode: string;
  spotId: string;
  reason: "PREEMPTED" | "TECHNICAL_ERROR" | "SHORT_AIR" | "NOT_AIRED";
  valueNgn: number;
  status: "OPEN" | "CREDITED";
  creditNoteId?: string;
  createdAt: Date;
}

/** TODO-FIN-07: contra document for a missed spot — never revenue. */
export interface CreditNote {
  id: string;
  campaignCode: string;
  spotId: string;
  makeGoodId: string;
  valueNgn: number;
  reason: BillingMakeGood["reason"];
  issuedBy: string;
  note?: string;
  issuedAt: Date;
}

export class BroadcastBillingEngine {
  private rateCards = new Map<string, RateCardEntry>();
  private billingSchedules = new Map<string, CommercialBillingSchedule>();
  private makeGoods = new Map<string, BillingMakeGood>();
  private creditNotes = new Map<string, CreditNote>();

  constructor(initialRateCards: RateCardEntry[] = PROVISIONAL_RATE_CARDS) {
    this.seedRateCards(initialRateCards);
  }

  public seedRateCards(cards: RateCardEntry[]): void {
    for (const card of cards) {
      this.rateCards.set(`${card.channelCode}:${card.daypart}`, card);
    }
  }

  public getRateCard(channelCode: string, daypart: DaypartClassification): RateCardEntry | undefined {
    return this.rateCards.get(`${channelCode}:${daypart}`);
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

  // ---------------------------------------------------------------------------
  // TODO-FIN-07: Broadcast billing ← as-run linkage (TASK-P2-11)
  //
  // Revenue recognition for linear commercials is delivery-based: a spot
  // earns contract value only when a matched as-run record proves it aired
  // in full (tamper-evident certificates live in the as-run module). Missed
  // spots (PREEMPTED / TECHNICAL_ERROR / absent from the log) become
  // make-good obligations that resolve into credit notes — a credit note is
  // a contra item, never revenue (canonical law 5 / FIN-01 labelling).
  // ---------------------------------------------------------------------------

  public generateBillingScheduleFromAsRun(params: {
    campaignCode: string;
    clientName: string;
    brand: string;
    channelCode: string;
    contractedSpots: number;
    asRunItems: Array<{
      spotId: string;
      campaignId: string;
      status: "AIRED_FULL" | "PARTIAL" | "PREEMPTED" | "TECHNICAL_ERROR";
      expectedDurationSeconds: number;
      actualDurationSeconds?: number;
      daypart?: DaypartClassification;
    }>;
    startDate: Date;
    endDate: Date;
  }): { schedule: CommercialBillingSchedule; makeGoods: BillingMakeGood[]; matchedCount: number; missedCount: number } {
    if (params.asRunItems.length === 0) {
      throw new Error("[BIL-ASRUN-01] No as-run records supplied — billing cannot be generated without delivery evidence.");
    }
    if (params.contractedSpots <= 0) {
      throw new Error("[BIL-ASRUN-02] contractedSpots must be positive.");
    }

    const seenSpotIds = new Set<string>();
    let matchedValueNgn = 0;
    let matchedCount = 0;
    const makeGoods: BillingMakeGood[] = [];

    for (const item of params.asRunItems) {
      if (seenSpotIds.has(item.spotId)) {
        throw new Error(`[BIL-ASRUN-03] Duplicate as-run spot '${item.spotId}' — each spot may appear once per campaign reconciliation.`);
      }
      seenSpotIds.add(item.spotId);

      const spotValueNgn = this.calculateSpotPrice(params.channelCode, item.daypart ?? "DAYTIME", item.expectedDurationSeconds);
      const airedFull = item.status === "AIRED_FULL" && (item.actualDurationSeconds ?? 0) >= item.expectedDurationSeconds;

      if (airedFull) {
        matchedCount += 1;
        matchedValueNgn += spotValueNgn;
      } else {
        const reason: BillingMakeGood["reason"] =
          item.status === "PREEMPTED" ? "PREEMPTED" : item.status === "TECHNICAL_ERROR" ? "TECHNICAL_ERROR" : item.status === "PARTIAL" ? "SHORT_AIR" : "NOT_AIRED";
        makeGoods.push({
          id: `MG-${params.campaignCode}-${item.spotId}`,
          campaignCode: params.campaignCode,
          spotId: item.spotId,
          reason,
          valueNgn: spotValueNgn,
          status: "OPEN",
          createdAt: new Date(),
        });
      }
    }

    // Delivery-based recognition: only matched as-run value is recognised.
    // The pre-existing createBillingSchedule path stays for contracted-value
    // scheduling; this path records delivered value, not contract value.
    const schedule: CommercialBillingSchedule = {
      id: `BIL-${params.campaignCode}-ASRUN-${Date.now().toString(36).toUpperCase()}`,
      campaignCode: params.campaignCode,
      clientName: params.clientName,
      brand: params.brand,
      channelCode: params.channelCode,
      contractedSpots: params.contractedSpots,
      airedSpotsMatched: matchedCount,
      totalContractValueNgn: 0, // contract value lives on the commercial deal; this projection is delivery-based
      recognizedRevenueNgn: matchedValueNgn,
      billingStatus: matchedCount >= params.contractedSpots ? "READY_FOR_INVOICE" : "AIRING_IN_PROGRESS",
      startDate: params.startDate,
      endDate: params.endDate,
    };
    this.billingSchedules.set(params.campaignCode, schedule);
    for (const mg of makeGoods) {
      this.makeGoods.set(mg.id, mg);
    }

    return { schedule, makeGoods, matchedCount, missedCount: makeGoods.length };
  }

  /** Issues a credit note against an OPEN make-good obligation. */
  public issueCreditNoteForMakeGood(params: { makeGoodId: string; issuedBy: string; note?: string }): CreditNote {
    const makeGood = this.makeGoods.get(params.makeGoodId);
    if (!makeGood) {
      throw new Error(`[BIL-MG-01] Make-good '${params.makeGoodId}' not found.`);
    }
    if (makeGood.status !== "OPEN") {
      throw new Error(`[BIL-MG-02] Make-good '${params.makeGoodId}' is already '${makeGood.status}'.`);
    }
    if (!params.issuedBy || params.issuedBy.trim().length === 0) {
      throw new Error("[BIL-MG-03] issuedBy is mandatory (auditable credit authority). Finance owns the credit treatment.");
    }
    const note: CreditNote = {
      id: `CN-${makeGood.campaignCode}-${makeGood.spotId}`,
      campaignCode: makeGood.campaignCode,
      spotId: makeGood.spotId,
      makeGoodId: makeGood.id,
      valueNgn: makeGood.valueNgn,
      reason: makeGood.reason,
      issuedBy: params.issuedBy.trim(),
      note: params.note,
      issuedAt: new Date(),
    };
    makeGood.status = "CREDITED";
    makeGood.creditNoteId = note.id;
    this.creditNotes.set(note.id, note);
    return note;
  }

  public listMakeGoods(params?: { campaignCode?: string; status?: BillingMakeGood["status"] }): BillingMakeGood[] {
    let all = [...this.makeGoods.values()];
    if (params?.campaignCode) all = all.filter((m) => m.campaignCode === params.campaignCode);
    if (params?.status) all = all.filter((m) => m.status === params.status);
    return all;
  }

  public listCreditNotes(campaignCode?: string): CreditNote[] {
    const all = [...this.creditNotes.values()];
    return campaignCode ? all.filter((c) => c.campaignCode === campaignCode) : all;
  }
}
