/**
 * TSK-16 (report.md CA-16) + TSK-33 (FIN-07): the Proof-of-Air exception
 * register and the ledger behind its credit remedy.
 *
 * These are the executable business-behaviour tests behind the
 * `/broadcast/asrun/exceptions` desk: an exception exists only because an
 * as-run reconciliation measured a shortfall, and it closes only through the
 * engine that owns the remedy. The failure half matters as much as the success
 * half — a refused rebooking must leave the obligation owed, not "resolved",
 * and a credit that was never journaled must not read as settled.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BroadcastTrafficEngine } from "../../src/modules/broadcast/traffic/index.js";
import { BroadcastBillingEngine } from "../../src/modules/broadcast/billing/index.js";
import { LedgerPostingService } from "../../src/modules/finance/ledger/posting.js";
import { SevenWayLedgerEngine } from "../../src/modules/finance/ledger/index.js";
import {
  _resetPoaExceptionsForTesting,
  getPoaException,
  listPoaExceptions,
  raisePoaExceptionsFromAsRun,
  resolvePoaException,
  totalOpenShortfallSeconds,
  type PoaAsRunInputItem,
} from "../../src/modules/broadcast/asrun/exceptions.js";
import { renderPoaExceptionsWorkbenchHtml } from "../../src/web/workspace/governance-and-operations.js";

function asRunItem(overrides: Partial<PoaAsRunInputItem> = {}): PoaAsRunInputItem {
  return {
    spotId: "SPT-CLIP-01",
    campaignId: "CMP-DAG-2026",
    clientName: "Dangote Group",
    actualStartTime: new Date("2026-10-01T19:00:00Z"),
    actualDurationSeconds: 22,
    expectedDurationSeconds: 30,
    status: "AIRED_PARTIAL",
    daypart: "PRIME_TIME",
    brandCategory: "FMCG_FOOD",
    qcStatus: "APPROVED",
    ...overrides,
  };
}

function fixtures() {
  const traffic = new BroadcastTrafficEngine();
  const billing = new BroadcastBillingEngine();
  const ledger = new LedgerPostingService(new SevenWayLedgerEngine());
  return { traffic, billing, ledger };
}

describe("TSK-16: Proof-of-Air delivery exception register", () => {
  beforeEach(() => {
    _resetPoaExceptionsForTesting();
  });

  it("raises one exception per measured shortfall, linked to the billing make-good", () => {
    const { traffic, billing } = fixtures();
    const result = raisePoaExceptionsFromAsRun({
      channelCode: "NXTR",
      items: [
        asRunItem(),
        asRunItem({ spotId: "SPT-FULL-01", status: "AIRED_FULL", actualDurationSeconds: 30 }),
        asRunItem({ spotId: "SPT-PRE-01", status: "PREEMPTED", actualDurationSeconds: 0 }),
      ],
      traffic,
      billing,
    });

    expect(result.raised).toBe(2);
    expect(result.discrepancies).toBe(2);
    expect(listPoaExceptions()).toHaveLength(2);

    const clip = getPoaException("EXP-CMP-DAG-2026-SPT-CLIP-01")!;
    expect(clip.nature).toBe("UNDER_DELIVERY_TIME");
    expect(clip.plannedDurationSeconds).toBe(30);
    expect(clip.airedDurationSeconds).toBe(22);
    expect(clip.shortfallSeconds).toBe(8);
    expect(clip.status).toBe("OPEN");

    const pre = getPoaException("EXP-CMP-DAG-2026-SPT-PRE-01")!;
    expect(pre.nature).toBe("SPOT_PREEMPTED");
    expect(pre.shortfallSeconds).toBe(30);

    // The linkage is the billing engine's own obligation, priced on its card.
    expect(clip.makeGoodId).toBe("MG-CMP-DAG-2026-SPT-CLIP-01");
    expect(billing.listMakeGoods({ status: "OPEN" })).toHaveLength(2);
    expect(clip.makeGoodValueNgn).toBe(billing.listMakeGoods()[0].valueNgn);
    expect(clip.makeGoodValueNgn).toBeGreaterThan(0);

    // And the inventory obligation the traffic engine owes.
    expect(traffic.getMakeGoodQueue().map((q) => q.spotId)).toEqual(["SPT-CLIP-01", "SPT-PRE-01"]);
    expect(traffic.getMakeGoodQueue()[0].durationSeconds).toBe(8);
    expect(totalOpenShortfallSeconds()).toBe(38);
  });

  it("re-ingesting the same log raises nothing and never re-opens a settled obligation", () => {
    const { traffic, billing, ledger } = fixtures();
    const items = [asRunItem()];
    expect(raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items, traffic, billing }).raised).toBe(1);

    const second = raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items, traffic, billing });
    expect(second.raised).toBe(0);
    expect(listPoaExceptions()).toHaveLength(1);
    // The queue holds one obligation, not two claims for the same shortfall.
    expect(traffic.getMakeGoodQueue()).toHaveLength(1);

    // Closing it once posts one journal; a second ingestion cannot post a second.
    resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });
    expect(raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items, traffic, billing }).raised).toBe(0);
    expect(ledger.getLedger().getEntries()).toHaveLength(1);
  });

  it("closes by rebooking only when the traffic engine actually takes inventory", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });
    traffic.createBreak({ id: "BRK-PRIME-02", channelId: "CHN-NXTR", daypart: "PRIME_TIME", maxDurationSeconds: 60 });

    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "APPROVE_MAKE_GOOD",
      actor: "usr-traffic-officer",
      targetBreakId: "BRK-PRIME-02",
      traffic,
      billing,
      ledger,
    });

    expect(resolved.status).toBe("MAKE_GOOD_REBOOKED");
    expect(resolved.allocatedBreakId).toBe("BRK-PRIME-02");
    expect(resolved.resolvedBy).toBe("usr-traffic-officer");
    expect(totalOpenShortfallSeconds()).toBe(0);
    expect(traffic.getMakeGoodQueue()).toHaveLength(0);
    // Inventory remedies move no money: rebooking posts nothing to the ledger.
    expect(ledger.getLedger().getEntries()).toHaveLength(0);
    // The 8s is genuinely booked — the same authority that gates a first booking.
    expect(() =>
      traffic.scheduleSpot({
        breakId: "BRK-PRIME-02",
        spotId: "SPT-CLIP-01",
        campaignId: "CMP-DAG-2026",
        brandCategory: "FMCG_FOOD",
        brandName: "Dangote Group",
        durationSeconds: 8,
        qcStatus: "APPROVED",
      })
    ).toThrow("[TRAFFIC-DUP-01]");
  });

  it("closes by credit note only when the billing engine issues it, and withdraws the inventory claim", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });

    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });

    expect(resolved.status).toBe("CREDIT_NOTE_ISSUED");
    expect(resolved.creditNoteId).toBe("CN-CMP-DAG-2026-SPT-CLIP-01");
    expect(billing.listCreditNotes()).toHaveLength(1);
    expect(billing.listMakeGoods({ status: "CREDITED" })).toHaveLength(1);
    expect(billing.listMakeGoods({ status: "OPEN" })).toHaveLength(0);
    // The client has been paid; the queue must stop offering the same seconds.
    expect(traffic.getMakeGoodQueue()).toHaveLength(0);
    expect(totalOpenShortfallSeconds()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // TSK-33 (FIN-07): the credit remedy is a financial fact, so it is journaled.
  // -------------------------------------------------------------------------
  it("posts the credit note to the ledger as a balanced contra entry before closing", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });

    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });

    const entries = ledger.getLedger().getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("CREDIT:CN-CMP-DAG-2026-SPT-CLIP-01");
    expect(entries[0].reference).toBe("MG:CMP-DAG-2026:SPT-CLIP-01");
    expect(entries[0].isBalanced).toBe(true);
    expect(entries[0].lines.map((l) => l.accountCode)).toEqual([
      "4090_CONTRA_REVENUE_ALLOWANCES",
      "2400_CLIENT_CREDIT_PAYABLE",
    ]);
    expect(entries[0].totalDebitNgn).toBe(billing.listCreditNotes()[0].valueNgn);
    expect(entries[0].totalCreditNgn).toBe(entries[0].totalDebitNgn);
    expect(resolved.journalEntryId).toBe(entries[0].id);
    expect(ledger.getCreditedMakeGoodsNgn()).toBe(entries[0].totalDebitNgn);
  });

  it("canonical law 5: a make-good credit never becomes revenue", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });
    resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });

    // No pillar moves: the credit is a contra allowance and an obligation to the
    // counterparty, not invoiced/recognised revenue and not an internal allocation.
    const snapshot = ledger.getLedger().getSnapshot();
    expect({
      contractValueNgn: snapshot.contractValueNgn,
      gmvNgn: snapshot.gmvNgn,
      invoicedRevenueNgn: snapshot.invoicedRevenueNgn,
      recognizedRevenueNgn: snapshot.recognizedRevenueNgn,
      cashCollectionsNgn: snapshot.cashCollectionsNgn,
      talentPayablesNgn: snapshot.talentPayablesNgn,
      partnerSplitsNgn: snapshot.partnerSplitsNgn,
      internalAllocationsNgn: snapshot.internalAllocationsNgn,
    }).toEqual({
      contractValueNgn: 0,
      gmvNgn: 0,
      invoicedRevenueNgn: 0,
      recognizedRevenueNgn: 0,
      cashCollectionsNgn: 0,
      talentPayablesNgn: 0,
      partnerSplitsNgn: 0,
      internalAllocationsNgn: 0,
    });
  });

  it("an exception with no approved creative identity cannot be invented into inventory", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({
      channelCode: "NXTR",
      items: [asRunItem({ qcStatus: undefined, brandCategory: undefined })],
      traffic,
      billing,
    });
    traffic.createBreak({ id: "BRK-PRIME-02", channelId: "CHN-NXTR", daypart: "PRIME_TIME", maxDurationSeconds: 60 });

    expect(() =>
      resolvePoaException({
        exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
        resolutionType: "APPROVE_MAKE_GOOD",
        actor: "usr-traffic-officer",
        targetBreakId: "BRK-PRIME-02",
        traffic,
        billing,
        ledger,
      })
    ).toThrow("[MG-03]");

    // The credit route is still available: the obligation is not stranded.
    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });
    expect(resolved.status).toBe("CREDIT_NOTE_ISSUED");
    expect(ledger.getLedger().getEntries()).toHaveLength(1);
  });

  it("a refused rebooking leaves the exception OPEN — no silent resolution", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });

    expect(() =>
      resolvePoaException({
        exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
        resolutionType: "APPROVE_MAKE_GOOD",
        actor: "usr-traffic-officer",
        targetBreakId: "BRK-MISSING",
        traffic,
        billing,
        ledger,
      })
    ).toThrow("[MG-04]");

    expect(getPoaException("EXP-CMP-DAG-2026-SPT-CLIP-01")!.status).toBe("OPEN");
    expect(traffic.getMakeGoodQueue()).toHaveLength(1);
    expect(totalOpenShortfallSeconds()).toBe(8);
    expect(ledger.getLedger().getEntries()).toHaveLength(0);
  });

  it("rejects an unknown exception, a re-resolution, and a make-good with no target break", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });

    expect(() =>
      resolvePoaException({
        exceptionId: "EXP-NOPE",
        resolutionType: "ISSUE_CREDIT_NOTE",
        actor: "a",
        traffic,
        billing,
        ledger,
      })
    ).toThrow("[POA-EXP-01]");
    expect(ledger.getLedger().getEntries()).toHaveLength(0);

    expect(() =>
      resolvePoaException({
        exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
        resolutionType: "APPROVE_MAKE_GOOD",
        actor: "a",
        traffic,
        billing,
        ledger,
      })
    ).toThrow("[POA-EXP-03]");

    resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "a",
      traffic,
      billing,
      ledger,
    });
    expect(() =>
      resolvePoaException({
        exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
        resolutionType: "ISSUE_CREDIT_NOTE",
        actor: "a",
        traffic,
        billing,
        ledger,
      })
    ).toThrow("[POA-EXP-02]");
    // One credit note, one journal entry — the refused replay posted nothing.
    expect(ledger.getLedger().getEntries()).toHaveLength(1);
  });

  it("a zero-second shortfall never feeds a make-good the queue would refuse", () => {
    const { traffic, billing, ledger } = fixtures();
    const result = raisePoaExceptionsFromAsRun({
      channelCode: "NXTR",
      // Full length on air, flagged PARTIAL by the automation log: nothing is
      // owed as inventory, but the discrepancy is still registered.
      items: [asRunItem({ status: "AIRED_PARTIAL", actualDurationSeconds: 30, expectedDurationSeconds: 30 })],
      traffic,
      billing,
    });

    expect(result.raised).toBe(1);
    expect(getPoaException("EXP-CMP-DAG-2026-SPT-CLIP-01")!.shortfallSeconds).toBe(0);
    expect(traffic.getMakeGoodQueue()).toHaveLength(0);
    expect(totalOpenShortfallSeconds()).toBe(0);

    // Credit note is the only remedy, and it works.
    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });
    expect(resolved.status).toBe("CREDIT_NOTE_ISSUED");
    expect(ledger.getLedger().getEntries()).toHaveLength(1);
  });

  it("the workbench renders measured shortfall and real linkage, and an honest empty state", () => {
    const empty = renderPoaExceptionsWorkbenchHtml({ exceptions: [] });
    expect(empty).toContain("No delivery exception has been raised");
    expect(empty).not.toContain("EXP-2026-081");
    expect(empty).not.toMatch(/logged to ledger/i);

    const { traffic, billing } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });
    const html = renderPoaExceptionsWorkbenchHtml();
    expect(html).toContain("EXP-CMP-DAG-2026-SPT-CLIP-01");
    expect(html).toContain("Plan: 30s");
    expect(html).toContain("-8s owed");
    expect(html).toContain("MG-CMP-DAG-2026-SPT-CLIP-01");
    expect(html).toContain("Queued for rebooking");
    expect(html).toContain("name=\"targetBreakId\"");
    expect(html).toContain("<strong>8</strong>s of commercial inventory still owed");
  });

  it("the workbench reports what the engine actually did, not a canned success", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });
    traffic.createBreak({ id: "BRK-PRIME-02", channelId: "CHN-NXTR", daypart: "PRIME_TIME", maxDurationSeconds: 60 });
    resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "APPROVE_MAKE_GOOD",
      actor: "usr-traffic-officer",
      targetBreakId: "BRK-PRIME-02",
      traffic,
      billing,
      ledger,
    });

    const html = renderPoaExceptionsWorkbenchHtml({ resolvedId: "EXP-CMP-DAG-2026-SPT-CLIP-01" });
    expect(html).toContain("Make-good booked into inventory");
    expect(html).toContain("BRK-PRIME-02");
    expect(html).not.toMatch(/slot reserved/i);

    const refused = renderPoaExceptionsWorkbenchHtml({ resolutionError: "[MG-04] Target break 'BRK-X' does not exist." });
    expect(refused).toContain("Remedy refused");
    expect(refused).toContain("MG-04");
  });

  it("a closed credit row names the journal entry the ledger actually holds", () => {
    const { traffic, billing, ledger } = fixtures();
    raisePoaExceptionsFromAsRun({ channelCode: "NXTR", items: [asRunItem()], traffic, billing });
    const resolved = resolvePoaException({
      exceptionId: "EXP-CMP-DAG-2026-SPT-CLIP-01",
      resolutionType: "ISSUE_CREDIT_NOTE",
      actor: "finance-controller-1",
      traffic,
      billing,
      ledger,
    });

    const html = renderPoaExceptionsWorkbenchHtml({ resolvedId: resolved.id });
    expect(html).toContain("Credit note issued");
    expect(html).toContain("Posted to the seven-way ledger as journal entry");
    expect(html).toContain("CREDIT:CN-CMP-DAG-2026-SPT-CLIP-01");
    expect(html).toContain("never revenue");
    expect(resolved.journalEntryId).toBe(ledger.getLedger().getEntries()[0].id);
  });
});
