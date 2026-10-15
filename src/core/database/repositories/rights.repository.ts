/**
 * VMNL Rights Record Database Repository — TSK-14
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45, CCPP-001 §15
 *
 * `RightsRecord` is the row the broadcast clearance gate decides on, so it is
 * also the row a resolved rights review request has to write. Before this file
 * the two halves of the rights domain each carried their own copy of the truth:
 * the gate read a client-supplied record (`POST /api/v1/broadcast/rights/validate`)
 * and the review-request module kept request state in a Map, so a "cleared"
 * review could not change what the gate saw. One repository, one record.
 *
 * Resilience follows the established policy (`repository-mode.ts`): in
 * `fail_closed` mode a Prisma failure raises `RepositoryUnavailableError`
 * (HTTP 503) rather than pretending the write landed.
 */

import { RightsRecordEntity, RightsType } from "../../domain/types.js";
import { checkDatabaseConnection, getPrismaClient } from "../index.js";
import { handleRepoError } from "../repository-mode.js";

export interface StoredRightsRecord extends RightsRecordEntity {
  source?: "DB" | "MEMORY";
}

export interface RightsRecordWrite {
  id: string;
  assetId: string;
  title: string;
  rightsType: RightsType;
  territory: string;
  mediaType: string;
  channelCode?: string | null;
  granterOrgId?: string | null;
  granteeOrgId?: string | null;
  exclusivity: boolean;
  startDate: Date;
  expiryDate: Date;
  subLicensable: boolean;
}

const RIGHTS_TYPES: readonly RightsType[] = ["BROADCAST_LINEAR", "DIGITAL_STREAMING", "SYNDICATION", "DERIVATIVE"];

export function isRightsType(value: unknown): value is RightsType {
  return (RIGHTS_TYPES as readonly string[]).includes(value as string);
}

export class RightsRepository {
  private records = new Map<string, StoredRightsRecord>();

  constructor(
    private readonly hooks: { onWritten?: (record: StoredRightsRecord) => void } = {}
  ) {}

  public getInMemoryRecordsCount(): number {
    return this.records.size;
  }

  public async upsert(data: RightsRecordWrite): Promise<StoredRightsRecord> {
    if (!data.id) throw new Error("[VMNL-RIGHTS-REPO] Rights record id is required.");
    if (data.expiryDate <= data.startDate) {
      throw new Error(`[VMNL-RIGHTS-ERROR] Invalid RightsRecord '${data.id}': expiryDate must be after startDate`);
    }

    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const saved = await client.rightsRecord.upsert({
          where: { id: data.id },
          update: {
            assetId: data.assetId,
            title: data.title,
            rightsType: data.rightsType,
            territory: data.territory,
            mediaType: data.mediaType,
            channelCode: data.channelCode ?? null,
            granterOrgId: data.granterOrgId ?? null,
            granteeOrgId: data.granteeOrgId ?? null,
            exclusivity: data.exclusivity,
            startDate: data.startDate,
            expiryDate: data.expiryDate,
            subLicensable: data.subLicensable,
          },
          create: {
            id: data.id,
            assetId: data.assetId,
            title: data.title,
            rightsType: data.rightsType,
            territory: data.territory,
            mediaType: data.mediaType,
            channelCode: data.channelCode ?? null,
            granterOrgId: data.granterOrgId ?? null,
            granteeOrgId: data.granteeOrgId ?? null,
            exclusivity: data.exclusivity,
            startDate: data.startDate,
            expiryDate: data.expiryDate,
            subLicensable: data.subLicensable,
          },
        });
        return this.publish({ ...toEntity(saved), source: "DB" });
      } catch (err: unknown) {
        await handleRepoError("rightsRecord", "write", err);
      }
    }

    const now = new Date();
    const memoryRecord: StoredRightsRecord = { ...data, channelCode: data.channelCode ?? null, granterOrgId: data.granterOrgId ?? null, granteeOrgId: data.granteeOrgId ?? null, createdAt: now, updatedAt: now, source: "MEMORY" };
    this.records.set(memoryRecord.id, memoryRecord);
    return this.publish({ ...memoryRecord });
  }

  /**
   * Every registered record, for boot hydration of the gate's read index.
   * Fail-closed like the single read: with the database connected a Prisma error
   * raises `RepositoryUnavailableError` rather than handing back a partial list
   * that would make unregistered records look absent-but-harmless.
   */
  public async listAll(): Promise<StoredRightsRecord[]> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const rows = await client.rightsRecord.findMany({ orderBy: { id: "asc" } });
        return rows.map((row) => ({ ...toEntity(row), source: "DB" as const }));
      } catch (err: unknown) {
        await handleRepoError("rightsRecord", "list", err);
      }
    }
    return [...this.records.values()].map((record) => ({ ...record, source: "MEMORY" as const }));
  }

  private publish(record: StoredRightsRecord): StoredRightsRecord {
    this.hooks.onWritten?.(record);
    return record;
  }

  public async findById(id: string): Promise<StoredRightsRecord | null> {
    const db = await checkDatabaseConnection();
    if (db.connected) {
      try {
        const client = getPrismaClient();
        const found = await client.rightsRecord.findUnique({ where: { id } });
        if (found) return { ...toEntity(found), source: "DB" };
      } catch (err: unknown) {
        await handleRepoError("rightsRecord", "read", err);
      }
    }
    const mem = this.records.get(id);
    return mem ? { ...mem, source: "MEMORY" } : null;
  }

  /**
   * Applies a cleared review window to the record the gate reads. This is the
   * only write path a review request may take, and callers must have already
   * required authoritative evidence (`[RRR-05]/[RRR-06]`).
   */
  public async applyReviewWindow(id: string, expiryDate: Date): Promise<StoredRightsRecord | null> {
    const current = await this.findById(id);
    if (!current) return null;
    if (!(expiryDate > current.startDate)) {
      throw new Error(`[VMNL-RIGHTS-ERROR] Review window for '${id}' must end after the rights start date`);
    }
    return this.upsert({
      id: current.id,
      assetId: current.assetId,
      title: current.title,
      rightsType: current.rightsType,
      territory: current.territory,
      mediaType: current.mediaType,
      channelCode: current.channelCode ?? null,
      granterOrgId: current.granterOrgId ?? null,
      granteeOrgId: current.granteeOrgId ?? null,
      exclusivity: current.exclusivity,
      startDate: current.startDate,
      expiryDate,
      subLicensable: current.subLicensable,
    });
  }
}

function toEntity(row: {
  id: string;
  assetId: string;
  title: string;
  granterOrgId: string | null;
  granteeOrgId: string | null;
  rightsType: RightsType;
  territory: string;
  mediaType: string;
  channelCode: string | null;
  exclusivity: boolean;
  startDate: Date;
  expiryDate: Date;
  subLicensable: boolean;
  createdAt: Date;
  updatedAt: Date;
}): StoredRightsRecord {
  return {
    id: row.id,
    assetId: row.assetId,
    title: row.title,
    granterOrgId: row.granterOrgId,
    granteeOrgId: row.granteeOrgId,
    rightsType: row.rightsType,
    territory: row.territory,
    mediaType: row.mediaType,
    channelCode: row.channelCode,
    exclusivity: row.exclusivity,
    startDate: row.startDate,
    expiryDate: row.expiryDate,
    subLicensable: row.subLicensable,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
