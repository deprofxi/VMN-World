/**
 * The Entertainment Network Distribution (TEND) Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §34 / VMNL-AZP-VMN-CCPP-001 §14
 *
 * Core Mandate:
 * External licensing, syndication marketplace, and avails calculation.
 * Computes rights availability by territory, medium, and time window.
 * Invariant: Prevents overlapping exclusive licenses in the same territory and medium.
 */

export type DistributionMedium = "FREE_TV" | "PAY_TV" | "SVOD" | "AVOD" | "AIRLINE_INFLIGHT" | "THEATRICAL";
export type TerritoryCode = "NG" | "GH" | "WEST_AFRICA" | "PAN_AFRICA" | "UK_DIASPORA" | "NORTH_AMERICA" | "GLOBAL";

export interface CatalogueTitle {
  id: string;
  title: string;
  originalLanguage: string;
  subtitlesAvailable: string[];
  runningTimeMinutes: number;
  genre: string;
  masterDeliveryStatus: "PENDING_DELIVERY" | "QC_APPROVED" | "READY_FOR_DELIVERY";
  trailerUrl?: string;
  screenerUrl?: string;
  minimumLicenseFeeUsd: number;
}

export interface DistributionLicense {
  id: string;
  titleId: string;
  licenseeOrgId: string;
  licenseeName: string;
  territory: TerritoryCode;
  medium: DistributionMedium;
  isExclusive: boolean;
  startDate: Date;
  endDate: Date;
  licenseFeeUsd: number;
  withholdingTaxPercent: number; // e.g. 10%
  netReceivableUsd: number;
  paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID";
  createdAt: Date;
}

export interface RoyaltyStatement {
  id: string;
  licenseId: string;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  reportedViewsOrAdImpressions: number;
  grossRoyaltyUsd: number;
  distributorCommissionUsd: number; // e.g. 20%
  withholdingTaxUsd: number;
  netPayableToRightsHolderUsd: number;
  ingestedAt: Date;
}

export interface AvailsQuery {
  titleId: string;
  territory: TerritoryCode;
  medium: DistributionMedium;
  startDate: Date;
  endDate: Date;
}

export class TendDistributionEngine {
  private catalogue = new Map<string, CatalogueTitle>();
  private licenses = new Map<string, DistributionLicense>();
  private statements = new Map<string, RoyaltyStatement>();

  public registerTitle(title: CatalogueTitle): CatalogueTitle {
    if (this.catalogue.has(title.id)) {
      throw new Error(`[TEND-TIT-01] Title '${title.id}' already registered.`);
    }
    this.catalogue.set(title.id, title);
    return title;
  }

  public getTitle(id: string): CatalogueTitle | undefined {
    return this.catalogue.get(id);
  }

  public getCatalogueTitles(): CatalogueTitle[] {
    return Array.from(this.catalogue.values());
  }

  /**
   * Evaluates if a title is available for licensing in a specific territory, medium, and window.
   */
  public checkAvails(query: AvailsQuery): { available: boolean; conflictReason?: string } {
    if (query.endDate <= query.startDate) {
      throw new Error("[TEND-AVL-01] End date must be strictly after start date.");
    }

    if (!this.catalogue.has(query.titleId)) {
      throw new Error(`[TEND-AVL-02] Title '${query.titleId}' not found in catalogue.`);
    }

    // Find any conflicting active license
    for (const license of this.licenses.values()) {
      if (license.titleId !== query.titleId) continue;

      // Check territory overlap
      const territoryOverlap =
        license.territory === "GLOBAL" ||
        query.territory === "GLOBAL" ||
        license.territory === query.territory ||
        (license.territory === "PAN_AFRICA" && ["NG", "GH", "WEST_AFRICA"].includes(query.territory)) ||
        (license.territory === "WEST_AFRICA" && ["NG", "GH"].includes(query.territory));

      if (!territoryOverlap) continue;

      // Check medium match
      if (license.medium !== query.medium) continue;

      // Check date window overlap
      const dateOverlap = query.startDate < license.endDate && query.endDate > license.startDate;
      if (!dateOverlap) continue;

      // Conflict if either license is exclusive
      if (license.isExclusive) {
        return {
          available: false,
          conflictReason: `Conflict: Already licensed exclusively to '${license.licenseeName}' in ${license.territory} via ${license.medium} from ${license.startDate.toISOString().substring(0, 10)} to ${license.endDate.toISOString().substring(0, 10)}.`,
        };
      }
    }

    return { available: true };
  }

  /**
   * Creates a distribution license agreement.
   * INVARIANT: Avails check must pass before creating an exclusive license!
   */
  public createLicense(params: {
    id: string;
    titleId: string;
    licenseeOrgId: string;
    licenseeName: string;
    territory: TerritoryCode;
    medium: DistributionMedium;
    isExclusive: boolean;
    startDate: Date;
    endDate: Date;
    licenseFeeUsd: number;
    withholdingTaxPercent?: number;
  }): DistributionLicense {
    if (this.licenses.has(params.id)) {
      throw new Error(`[TEND-LIC-01] License '${params.id}' already exists.`);
    }

    // Run avails check
    const avails = this.checkAvails({
      titleId: params.titleId,
      territory: params.territory,
      medium: params.medium,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    if (!avails.available && params.isExclusive) {
      throw new Error(`[TEND-LIC-02] Cannot create exclusive license: ${avails.conflictReason}`);
    }

    const whtPercent = params.withholdingTaxPercent ?? 10;
    const whtAmount = Math.round(params.licenseFeeUsd * (whtPercent / 100));
    const netReceivableUsd = params.licenseFeeUsd - whtAmount;

    const license: DistributionLicense = {
      ...params,
      withholdingTaxPercent: whtPercent,
      netReceivableUsd,
      paymentStatus: "PENDING",
      createdAt: new Date(),
    };

    this.licenses.set(license.id, license);
    return license;
  }

  public ingestRoyaltyStatement(params: {
    id: string;
    licenseId: string;
    reportingPeriodStart: Date;
    reportingPeriodEnd: Date;
    reportedViewsOrAdImpressions: number;
    grossRoyaltyUsd: number;
    commissionPercent?: number; // e.g. 20%
  }): RoyaltyStatement {
    const license = this.licenses.get(params.licenseId);
    if (!license) {
      throw new Error(`[TEND-ROY-01] License '${params.licenseId}' not found.`);
    }

    const commissionPercent = params.commissionPercent ?? 20;
    const distributorCommissionUsd = Math.round(params.grossRoyaltyUsd * (commissionPercent / 100));
    const withholdingTaxUsd = Math.round(params.grossRoyaltyUsd * (license.withholdingTaxPercent / 100));
    const netPayableToRightsHolderUsd = Math.max(
      0,
      params.grossRoyaltyUsd - distributorCommissionUsd - withholdingTaxUsd
    );

    const statement: RoyaltyStatement = {
      ...params,
      distributorCommissionUsd,
      withholdingTaxUsd,
      netPayableToRightsHolderUsd,
      ingestedAt: new Date(),
    };

    this.statements.set(statement.id, statement);
    return statement;
  }

  public getLicense(id: string): DistributionLicense | undefined {
    return this.licenses.get(id);
  }

  /** Read accessor for the syndication desk avails matrix (SCR-18). */
  public listLicenses(): DistributionLicense[] {
    return Array.from(this.licenses.values());
  }

  // ---------------------------------------------------------------------------
  // TODO-FIN-08: Distributor royalty statement CSV parser (TASK-P4-03)
  //
  // Accepts the standard distributor statement layout:
  //   statement_id,license_id,period_start,period_end,views_or_impressions,
  //   gross_royalty_usd[,commission_percent][,withholding_tax_percent]
  // Validation is row-by-row: bad rows are REJECTED with reasons and good
  // rows are ingested — one corrupt line never blocks the whole statement.
  // Withholding comes from the license (the executed agreement is the truth);
  // if the statement data carries a withholding_tax_percent that disagrees
  // with the license the row is rejected rather than silently substituted.
  // ---------------------------------------------------------------------------

  public parseRoyaltyStatementCsv(csvText: string, options?: { commissionPercent?: number }): ParsedRoyaltyStatement {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("[TEND-CSV-01] Royalty statement CSV must contain a header row and at least one data row.");
    }
    const header = parseRoyaltyCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    for (const col of ["statement_id", "license_id", "period_start", "period_end", "views_or_impressions", "gross_royalty_usd"]) {
      if (!header.includes(col)) {
        throw new Error(`[TEND-CSV-02] Missing required column '${col}'. Found: ${header.join(", ")}`);
      }
    }
    const idx = (col: string) => header.indexOf(col);
    const accepted: RoyaltyStatement[] = [];
    const rejected: Array<{ row: number; statementId: string; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseRoyaltyCsvLine(lines[i]);
      const get = (col: string) => (idx(col) >= 0 ? (cells[idx(col)] || "").trim() : "");
      const statementId = get("statement_id");
      try {
        if (!statementId) throw new Error("statement_id is empty");
        const licenseId = get("license_id");
        if (!licenseId) throw new Error("license_id is empty");
        const periodStart = parseRoyaltyUtcDate(get("period_start"));
        const periodEnd = parseRoyaltyUtcDate(get("period_end"));
        if (!periodStart || !periodEnd) {
          throw new Error(`unparseable period dates '${get("period_start")}'/'${get("period_end")}' (expected YYYY-MM-DD)`);
        }
        if (periodEnd <= periodStart) throw new Error("period_end must be after period_start");
        const views = Number(get("views_or_impressions"));
        if (!Number.isFinite(views) || views < 0) throw new Error(`invalid views_or_impressions '${get("views_or_impressions")}'`);
        const gross = Number(get("gross_royalty_usd"));
        if (!Number.isFinite(gross) || gross < 0) throw new Error(`invalid gross_royalty_usd '${get("gross_royalty_usd")}'`);

        const license = this.licenses.get(licenseId);
        if (!license) throw new Error(`[TEND-ROY-01] License '${licenseId}' not found.`);

        const commissionPercent = options?.commissionPercent ?? (get("commission_percent") ? Number(get("commission_percent")) : undefined);
        if (commissionPercent !== undefined && (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100)) {
          throw new Error("commission_percent must be 0..100");
        }

        const statedWht = get("withholding_tax_percent");
        if (statedWht) {
          const statedWhtNum = Number(statedWht);
          if (!Number.isFinite(statedWhtNum) || statedWhtNum < 0 || statedWhtNum > 100) {
            throw new Error("withholding_tax_percent must be 0..100");
          }
          if (statedWhtNum !== license.withholdingTaxPercent) {
            throw new Error(`withholding_tax_percent ${statedWhtNum} disagrees with license ${license.withholdingTaxPercent} — no silent substitution`);
          }
        }

        accepted.push(
          this.ingestRoyaltyStatement({
            id: statementId,
            licenseId,
            reportingPeriodStart: periodStart,
            reportingPeriodEnd: periodEnd,
            reportedViewsOrAdImpressions: Math.round(views),
            grossRoyaltyUsd: Math.round(gross * 100) / 100,
            commissionPercent,
          })
        );
      } catch (err: any) {
        rejected.push({ row: i + 1, statementId, error: String(err?.message || "unknown error") });
      }
    }

    return { accepted, rejected, totalRows: lines.length - 1 };
  }

  /** Read accessor for ingested statements (optionally by license). */
  public listRoyaltyStatements(licenseId?: string): RoyaltyStatement[] {
    const all = Array.from(this.statements.values());
    return licenseId ? all.filter((s) => s.licenseId === licenseId) : all;
  }
}

export interface ParsedRoyaltyStatement {
  accepted: RoyaltyStatement[];
  rejected: Array<{ row: number; statementId: string; error: string }>;
  totalRows: number;
}

function parseRoyaltyCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseRoyaltyUtcDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
