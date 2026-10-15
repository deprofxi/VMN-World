/**
 * Broadcast Sponsorship Engine & On-Air Entitlement Fulfillment Tracker
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §32, §42
 *
 * Core Mandate:
 * Models sponsor brand entitlements (opening billboards, lower-third overlays, verbal mentions,
 * co-branded segments) and automatically audits playout fulfillment against contracted minimums.
 */

import { registerDurableStore, stageDurableWrite } from "../../../core/database/durable-journal.js";
import {
  loadSponsorBindings,
  loadSponsorFulfillments,
  persistSponsorBinding,
  persistSponsorFulfillment,
} from "../../../core/database/repositories/release-critical.repository.js";

/**
 * TSK-17 (report.md CA-12): a sponsor binding is a contracted obligation and a
 * fulfilment record is the evidence it was met, so both live in
 * `SponsorBindingRecord` / `SponsorFulfillmentRecord` rather than in one
 * process's Maps. Entitlement delivery counters are deliberately not staged
 * here: they are derived from impression logs the entitlement owner replays, and
 * CA-12 lists the binding, not the entitlement.
 */
registerDurableStore<SponsorBinding>("sponsorBinding", persistSponsorBinding);
registerDurableStore<SponsorBindingFulfillment>("sponsorFulfillment", persistSponsorFulfillment);

export interface SponsorEntitlement {
  id: string;
  sponsorName: string;
  brand: string;
  channelCode: string;
  programmeCode: string;
  campaignCode: string;
  contractedOnScreenSeconds: number;
  contractedBillboardsCount: number;
  contractedLowerThirdsCount: number;
  deliveredOnScreenSeconds: number;
  deliveredBillboardsCount: number;
  deliveredLowerThirdsCount: number;
  status: "ACTIVE" | "COMPLETED" | "UNDER_DELIVERED" | "BREACH";
  startDate: Date;
  endDate: Date;
}

export interface SponsorImpressionLog {
  entitlementId: string;
  asRunLogId: string;
  impressionType: "BILLBOARD" | "LOWER_THIRD" | "SEGMENT_SPONSOR" | "GRAPHIC_BUG";
  durationSeconds: number;
  loggedAt: Date;
}

export class SponsorshipEngine {
  private entitlements = new Map<string, SponsorEntitlement>();
  private impressions: SponsorImpressionLog[] = [];
  private bindings = new Map<string, SponsorBinding>();
  private fulfillmentRecords: SponsorBindingFulfillment[] = [];

  public createEntitlement(entitlement: Omit<SponsorEntitlement, "deliveredOnScreenSeconds" | "deliveredBillboardsCount" | "deliveredLowerThirdsCount" | "status">): SponsorEntitlement {
    const fullEntitlement: SponsorEntitlement = {
      ...entitlement,
      deliveredOnScreenSeconds: 0,
      deliveredBillboardsCount: 0,
      deliveredLowerThirdsCount: 0,
      status: "ACTIVE",
    };
    this.entitlements.set(fullEntitlement.id, fullEntitlement);
    return fullEntitlement;
  }

  public logImpression(log: SponsorImpressionLog): { entitlement: SponsorEntitlement; fulfillmentPercent: number } {
    const entitlement = this.entitlements.get(log.entitlementId);
    if (!entitlement) {
      throw new Error(`[SPONSOR-01] Entitlement '${log.entitlementId}' not found.`);
    }

    this.impressions.push(log);
    entitlement.deliveredOnScreenSeconds += log.durationSeconds;

    if (log.impressionType === "BILLBOARD") {
      entitlement.deliveredBillboardsCount += 1;
    } else if (log.impressionType === "LOWER_THIRD") {
      entitlement.deliveredLowerThirdsCount += 1;
    }

    const secRatio = entitlement.contractedOnScreenSeconds > 0
      ? entitlement.deliveredOnScreenSeconds / entitlement.contractedOnScreenSeconds
      : 1.0;
    const bbRatio = entitlement.contractedBillboardsCount > 0
      ? entitlement.deliveredBillboardsCount / entitlement.contractedBillboardsCount
      : 1.0;
    const ltRatio = entitlement.contractedLowerThirdsCount > 0
      ? entitlement.deliveredLowerThirdsCount / entitlement.contractedLowerThirdsCount
      : 1.0;

    const fulfillmentPercent = Math.min(100, Math.round(((secRatio + bbRatio + ltRatio) / 3) * 100));

    if (fulfillmentPercent >= 100) {
      entitlement.status = "COMPLETED";
    }

    return { entitlement, fulfillmentPercent };
  }

  public getEntitlement(id: string): SponsorEntitlement | undefined {
    return this.entitlements.get(id);
  }

  public getAuditReport(id: string): {
    entitlement: SponsorEntitlement;
    fulfillmentPercent: number;
    isDeliveredFully: boolean;
    deficitSeconds: number;
  } {
    const entitlement = this.entitlements.get(id);
    if (!entitlement) {
      throw new Error(`[SPONSOR-02] Entitlement '${id}' not found.`);
    }

    const deficitSeconds = Math.max(0, entitlement.contractedOnScreenSeconds - entitlement.deliveredOnScreenSeconds);
    const fulfillmentPercent = entitlement.contractedOnScreenSeconds > 0
      ? Math.min(100, Math.round((entitlement.deliveredOnScreenSeconds / entitlement.contractedOnScreenSeconds) * 100))
      : 100;

    return {
      entitlement,
      fulfillmentPercent,
      isDeliveredFully: deficitSeconds === 0,
      deficitSeconds,
    };
  }

  // -------------------------------------------------------------------------
  // TODO-BCST-12: Promos/interstitials & sponsorship binding engine
  // (TASK-P2-07)
  //
  // A SponsorBinding ties a sponsor asset (sting, lower-third, billboard,
  // verbal mention) to a programme/daypart so playlist exports carry the
  // bound sponsor asset, and fulfillment reporting reconciles contracted vs
  // delivered placements per binding (not only per raw impression log).
  // -------------------------------------------------------------------------

  public createBinding(binding: {
    id: string;
    entitlementId: string;
    programmeCode: string;
    daypart: string;
    assetType: "STING" | "LOWER_THIRD" | "BILLBOARD" | "VERBAL_MENTION" | "GRAPHIC_BUG";
    assetId: string;
    assetDurationSeconds: number;
    requiredPlacementsPerEpisode: number;
  }): SponsorBinding {
    if (!this.entitlements.has(binding.entitlementId)) {
      throw new Error(`[SPONSOR-BIND-01] Binding '${binding.id}' references unknown entitlement '${binding.entitlementId}'.`);
    }
    if (binding.requiredPlacementsPerEpisode <= 0) {
      throw new Error(`[SPONSOR-BIND-02] Binding '${binding.id}' requires at least one placement per episode.`);
    }
    const full: SponsorBinding = { ...binding, fulfilledPlacements: 0 };
    this.bindings.set(full.id, full);
    this.stageBinding(full);
    return full;
  }

  private stageBinding(binding: SponsorBinding): void {
    stageDurableWrite<SponsorBinding>({
      store: "sponsorBinding",
      key: binding.id,
      payload: binding,
      rollback: () => {
        this.bindings.delete(binding.id);
      },
    });
  }

  /**
   * Boot hydration (TSK-17): adopt the durable bindings and their fulfilment
   * evidence. `entitlements` stay process-side (see the note above), so the
   * report resolves sponsor names only for entitlements the caller re-registers.
   */
  public hydrate(bindings: SponsorBinding[], fulfillments: SponsorBindingFulfillment[]): void {
    this.bindings = new Map(bindings.map((binding) => [binding.id, binding]));
    this.fulfillmentRecords = [...fulfillments];
  }

  public getBinding(id: string): SponsorBinding | undefined {
    return this.bindings.get(id);
  }

  public listBindings(params?: { programmeCode?: string; daypart?: string }): SponsorBinding[] {
    let all = [...this.bindings.values()];
    if (params?.programmeCode) all = all.filter((b) => b.programmeCode === params.programmeCode);
    if (params?.daypart) all = all.filter((b) => b.daypart === params.daypart);
    return all;
  }

  /**
   * Records fulfillment of a bound sponsor placement for one episode airing.
   * Counts toward the binding and (for seconds-based types) the entitlement's
   * delivered seconds so the existing audit report stays authoritative.
   */
  public recordBindingFulfillment(params: { bindingId: string; episodeCode: string; asRunLogId: string; airedAt: Date }): SponsorBindingFulfillment {
    const binding = this.bindings.get(params.bindingId);
    if (!binding) {
      throw new Error(`[SPONSOR-BIND-03] Binding '${params.bindingId}' not found.`);
    }
    binding.fulfilledPlacements += 1;

    // VERBAL_MENTION has no impression-type analogue in the entitlement log
    // (it is fulfilled by count on the binding, not by on-screen seconds).
    const impressionType: SponsorImpressionLog["impressionType"] | null =
      binding.assetType === "STING"
        ? "BILLBOARD"
        : binding.assetType === "VERBAL_MENTION"
          ? null
          : (binding.assetType as SponsorImpressionLog["impressionType"]);
    if (impressionType) {
      this.logImpression({
        entitlementId: binding.entitlementId,
        asRunLogId: params.asRunLogId,
        impressionType,
        durationSeconds: binding.assetDurationSeconds,
        loggedAt: params.airedAt,
      });
    }

    const required = binding.requiredPlacementsPerEpisode;
    const fulfilled = binding.fulfilledPlacements;
    const fulfillmentPercent = Math.min(100, Math.round((fulfilled / required) * 100));
    const record: SponsorBindingFulfillment = {
      bindingId: binding.id,
      episodeCode: params.episodeCode,
      asRunLogId: params.asRunLogId,
      airedAt: params.airedAt,
      placementsFulfilled: 1,
      placementsRequired: required,
      isComplete: fulfilled >= required,
      fulfillmentPercent,
    };
    this.fulfillmentRecords.push(record);
    // The binding's counter moved with this record, so both rows are staged:
    // a restart must not bring back a binding whose evidence is missing, or
    // evidence that a counter nobody persisted claims is complete.
    this.stageBinding(binding);
    stageDurableWrite<SponsorBindingFulfillment>({
      store: "sponsorFulfillment",
      key: `${record.bindingId}:${record.asRunLogId}`,
      payload: record,
      rollback: () => {
        this.fulfillmentRecords = this.fulfillmentRecords.filter(
          (posted) => !(posted.bindingId === record.bindingId && posted.asRunLogId === record.asRunLogId)
        );
        if (binding.fulfilledPlacements > 0) binding.fulfilledPlacements -= 1;
      },
    });
    return record;
  }

  /**
   * Fulfillment report per binding: contracted placements vs delivered,
   * shortfall count, and the bound asset identity for playlist exports.
   */
  public getFulfillmentReport(params?: { programmeCode?: string; daypart?: string }): Array<{
    binding: SponsorBinding;
    entitlement?: SponsorEntitlement;
    placementsRequiredTotal: number;
    placementsDelivered: number;
    shortfall: number;
    fulfillmentPercent: number;
    isFulfilled: boolean;
  }> {
    const bindings = this.listBindings(params);
    return bindings.map((binding) => {
      const records = this.fulfillmentRecords.filter((r) => r.bindingId === binding.id);
      const delivered = records.reduce((s, r) => s + r.placementsFulfilled, 0);
      const requiredTotal = binding.requiredPlacementsPerEpisode * Math.max(1, records.length === 0 ? 1 : new Set(records.map((r) => r.episodeCode)).size);
      const shortfall = Math.max(0, requiredTotal - delivered);
      return {
        binding,
        entitlement: this.entitlements.get(binding.entitlementId),
        placementsRequiredTotal: requiredTotal,
        placementsDelivered: delivered,
        shortfall,
        fulfillmentPercent: requiredTotal > 0 ? Math.min(100, Math.round((delivered / requiredTotal) * 100)) : 100,
        isFulfilled: shortfall === 0,
      };
    });
  }

  /** Playlist-export helper: sponsor assets bound to a programme/daypart. */
  public exportBoundSponsorAssets(params: { programmeCode: string; daypart: string }): Array<{ assetId: string; assetType: string; assetDurationSeconds: number; entitlementId: string; sponsorName?: string }> {
    return this.listBindings({ programmeCode: params.programmeCode, daypart: params.daypart }).map((b) => {
      const entitlement = this.entitlements.get(b.entitlementId);
      return {
        assetId: b.assetId,
        assetType: b.assetType,
        assetDurationSeconds: b.assetDurationSeconds,
        entitlementId: b.entitlementId,
        sponsorName: entitlement?.sponsorName,
      };
    });
  }
}

export interface SponsorBinding {
  id: string;
  entitlementId: string;
  programmeCode: string;
  daypart: string;
  assetType: "STING" | "LOWER_THIRD" | "BILLBOARD" | "VERBAL_MENTION" | "GRAPHIC_BUG";
  assetId: string;
  assetDurationSeconds: number;
  requiredPlacementsPerEpisode: number;
  fulfilledPlacements: number;
}

export interface SponsorBindingFulfillment {
  bindingId: string;
  episodeCode: string;
  asRunLogId: string;
  airedAt: Date;
  placementsFulfilled: number;
  placementsRequired: number;
  isComplete: boolean;
  fulfillmentPercent: number;
}

/**
 * Boot hydration (TSK-17) for the engine a server actually serves with: the
 * desk holds the instance, so the durable rows are loaded into that instance
 * rather than into a module-level copy nobody reads.
 */
export async function hydrateSponsorshipEngine(
  engine: SponsorshipEngine
): Promise<{ bindings: number; fulfillments: number }> {
  const [bindings, fulfillments] = await Promise.all([loadSponsorBindings(), loadSponsorFulfillments()]);
  engine.hydrate(bindings, fulfillments);
  return { bindings: bindings.length, fulfillments: fulfillments.length };
}
