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
}
