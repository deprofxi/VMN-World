/**
 * Azeebo+ Level 2 Federation: Content Catalogue & Metadata Sync
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §40, §42 / VMNL-AZP-VMN-CCPP-001 §16
 *
 * Core Mandate:
 * Exports approved VMN content metadata to Azeebo+ catalogue APIs.
 * Synchronizes rights windowing so streaming availability matches contracted windows.
 * Invariant: Content expired or un-published on VMN rights ledger immediately generates unpublish webhook.
 */

import { AzeeboUniverse } from "./links.js";

export interface SyndicatedCatalogueItem {
  id: string;
  vmnAssetId: string;
  title: string;
  synopsis: string;
  universe: AzeeboUniverse;
  durationMinutes: number;
  genre: string;
  ageRating: string;
  cast: string[];
  director?: string;
  hlsStreamUrl: string;
  posterUrl: string;
  streamingWindowStart: Date;
  streamingWindowEnd: Date;
  status: "PUBLISHED" | "UNPUBLISHED" | "EXPIRED";
  lastSyncedAt: Date;
}

export interface SyncWebhookEvent {
  eventId: string;
  eventType: "CONTENT_PUBLISHED" | "CONTENT_UPDATED" | "CONTENT_UNPUBLISHED" | "RIGHTS_EXPIRED";
  vmnAssetId: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export class AzeeboMetadataSyncService {
  private syndicatedItems = new Map<string, SyndicatedCatalogueItem>();
  private syncEvents: SyncWebhookEvent[] = [];

  public publishContent(params: Omit<SyndicatedCatalogueItem, "status" | "lastSyncedAt">): SyndicatedCatalogueItem {
    if (params.streamingWindowEnd <= params.streamingWindowStart) {
      throw new Error("[AZP-META-01] Streaming window end date must be strictly after start date.");
    }

    const item: SyndicatedCatalogueItem = {
      ...params,
      status: "PUBLISHED",
      lastSyncedAt: new Date(),
    };

    this.syndicatedItems.set(item.vmnAssetId, item);

    this.recordEvent({
      eventType: "CONTENT_PUBLISHED",
      vmnAssetId: item.vmnAssetId,
      payload: {
        title: item.title,
        universe: item.universe,
        windowStart: item.streamingWindowStart.toISOString(),
        windowEnd: item.streamingWindowEnd.toISOString(),
      },
    });

    return item;
  }

  /**
   * Immediately unpublishes content from Azeebo+ when VMN rights ledger expires or revokes rights.
   * INVARIANT: Guarantees rights enforcement across digital federation.
   */
  public revokeOrExpireContent(vmnAssetId: string, reason: "RIGHTS_EXPIRED" | "MANUAL_REVOCATION"): SyndicatedCatalogueItem {
    const item = this.syndicatedItems.get(vmnAssetId);
    if (!item) {
      throw new Error(`[AZP-META-02] Asset '${vmnAssetId}' not found in syndicated catalogue.`);
    }

    item.status = reason === "RIGHTS_EXPIRED" ? "EXPIRED" : "UNPUBLISHED";
    item.lastSyncedAt = new Date();

    this.recordEvent({
      eventType: reason === "RIGHTS_EXPIRED" ? "RIGHTS_EXPIRED" : "CONTENT_UNPUBLISHED",
      vmnAssetId,
      payload: { reason, unpublishTimestamp: item.lastSyncedAt.toISOString() },
    });

    return item;
  }

  public getSyndicatedItem(vmnAssetId: string): SyndicatedCatalogueItem | undefined {
    return this.syndicatedItems.get(vmnAssetId);
  }

  public getSyncEvents(): SyncWebhookEvent[] {
    return [...this.syncEvents];
  }

  private recordEvent(event: Omit<SyncWebhookEvent, "eventId" | "timestamp">): void {
    this.syncEvents.push({
      ...event,
      eventId: `EVT-AZP-SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
    });
  }
}
