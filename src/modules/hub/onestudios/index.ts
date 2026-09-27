/**
 * ONE Studios Production Facilities & Inventory Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §32 / VMNL-AZP-VMN-CCPP-001 §13
 *
 * Core Mandate:
 * Professional and premium production execution.
 * Studio stage management, camera/lighting gear inventory, double-booking prevention,
 * check-out/check-in lifecycle, call sheets, and damage/loss logging against security deposits.
 */

export type StudioAssetCategory =
  | "SOUNDSTAGE"
  | "GREEN_SCREEN_CYC"
  | "CAMERA_PACKAGE"
  | "LIGHTING_KIT"
  | "GRIP_SUPPORT"
  | "AUDIO_PACKAGE";

export type AssetCondition = "PRISTINE" | "GOOD" | "FAIR" | "UNDER_MAINTENANCE" | "DAMAGED";
export type StudioBookingStatus = "RESERVED" | "CHECKED_OUT" | "RETURNED" | "CANCELLED";

export interface ProductionAsset {
  id: string;
  assetTag: string; // e.g. "CAM-ARRI-01", "STG-STAGE-A"
  name: string;
  category: StudioAssetCategory;
  model: string;
  dailyRateNgn: number;
  condition: AssetCondition;
  isAvailable: boolean;
  maintenanceIntervalDays: number;
  lastMaintainedAt: Date;
}

export interface ProductionBooking {
  id: string;
  productionName: string;
  producerId: string;
  assetIds: string[];
  startDate: Date;
  endDate: Date;
  securityDepositNgn: number;
  damageDeductionNgn: number;
  status: StudioBookingStatus;
  checkedOutAt?: Date;
  returnedAt?: Date;
  damageReport?: string;
  createdAt: Date;
}

export interface DailyCallSheet {
  id: string;
  productionName: string;
  shootDate: Date;
  generalCallTime: string; // e.g. "06:30"
  location: string;
  weatherForecast?: string;
  keyCast: Array<{ character: string; actorName: string; callTime: string }>;
  keyCrew: Array<{ department: string; name: string; callTime: string }>;
  scenesToShoot: Array<{ sceneNumber: string; dayNight: "DAY" | "NIGHT"; description: string }>;
  nearestHospital: string;
  safetyNotes?: string;
  publishedAt: Date;
}

export class OneStudiosEngine {
  private assets = new Map<string, ProductionAsset>();
  private bookings = new Map<string, ProductionBooking>();
  private callSheets = new Map<string, DailyCallSheet>();

  constructor() {
    this.seedDefaultAssets();
  }

  private seedDefaultAssets(): void {
    const defaultAssets: ProductionAsset[] = [
      {
        id: "AST-STG-A",
        assetTag: "STG-MAIN-A",
        name: "Soundstage A (5,000 sq ft Soundproof)",
        category: "SOUNDSTAGE",
        model: "Acoustic Treated Grid 24ft",
        dailyRateNgn: 450000,
        condition: "PRISTINE",
        isAvailable: true,
        maintenanceIntervalDays: 90,
        lastMaintainedAt: new Date(),
      },
      {
        id: "AST-CYC-01",
        assetTag: "CYC-GREEN-01",
        name: "Cyclorama Green Screen Stage",
        category: "GREEN_SCREEN_CYC",
        model: "Infinite Green Cyc 18ft",
        dailyRateNgn: 250000,
        condition: "GOOD",
        isAvailable: true,
        maintenanceIntervalDays: 60,
        lastMaintainedAt: new Date(),
      },
      {
        id: "AST-CAM-ARRI-01",
        assetTag: "CAM-ALEXA-MINI",
        name: "ARRI Alexa Mini LF Package",
        category: "CAMERA_PACKAGE",
        model: "Alexa Mini LF + Signature Primes",
        dailyRateNgn: 300000,
        condition: "PRISTINE",
        isAvailable: true,
        maintenanceIntervalDays: 30,
        lastMaintainedAt: new Date(),
      },
      {
        id: "AST-LGT-APUTURE-01",
        assetTag: "LGT-APUT-1200D",
        name: "Aputure 1200d Pro Daylight Kit",
        category: "LIGHTING_KIT",
        model: "1200d + Bowens Mount Accessories",
        dailyRateNgn: 75000,
        condition: "GOOD",
        isAvailable: true,
        maintenanceIntervalDays: 45,
        lastMaintainedAt: new Date(),
      },
    ];

    for (const asset of defaultAssets) {
      this.assets.set(asset.id, asset);
    }
  }

  public registerAsset(asset: ProductionAsset): ProductionAsset {
    if (this.assets.has(asset.id)) {
      throw new Error(`[ONE-AST-01] Asset '${asset.id}' already exists.`);
    }
    this.assets.set(asset.id, asset);
    return asset;
  }

  public getAsset(id: string): ProductionAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Books studio stages or equipment packages.
   * INVARIANT: Double-booking prevention across overlapping time slots.
   */
  public createBooking(params: {
    id: string;
    productionName: string;
    producerId: string;
    assetIds: string[];
    startDate: Date;
    endDate: Date;
    securityDepositNgn: number;
  }): ProductionBooking {
    if (params.endDate <= params.startDate) {
      throw new Error("[ONE-BKG-01] End date must be strictly after start date.");
    }

    if (params.assetIds.length === 0) {
      throw new Error("[ONE-BKG-02] Booking must include at least one asset.");
    }

    // Check each asset exists and is available for the given timeframe
    for (const assetId of params.assetIds) {
      const asset = this.assets.get(assetId);
      if (!asset) {
        throw new Error(`[ONE-BKG-03] Asset '${assetId}' not found.`);
      }
      if (asset.condition === "UNDER_MAINTENANCE" || asset.condition === "DAMAGED") {
        throw new Error(`[ONE-BKG-04] Asset '${asset.name}' is currently ${asset.condition} and unavailable.`);
      }

      // Check conflict
      const hasConflict = this.hasConflictingBooking(assetId, params.startDate, params.endDate);
      if (hasConflict) {
        throw new Error(
          `[ONE-BKG-05] Asset '${asset.name}' is already reserved for the requested dates.`
        );
      }
    }

    const booking: ProductionBooking = {
      ...params,
      damageDeductionNgn: 0,
      status: "RESERVED",
      createdAt: new Date(),
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  public checkOut(bookingId: string): ProductionBooking {
    const booking = this.getBookingOrThrow(bookingId);
    if (booking.status !== "RESERVED") {
      throw new Error(`[ONE-CO-01] Cannot check out booking in '${booking.status}' state. Must be 'RESERVED'.`);
    }

    booking.status = "CHECKED_OUT";
    booking.checkedOutAt = new Date();
    return booking;
  }

  public checkIn(
    bookingId: string,
    damages?: { damageReport: string; damageCostNgn: number }
  ): { booking: ProductionBooking; depositRefundNgn: number } {
    const booking = this.getBookingOrThrow(bookingId);
    if (booking.status !== "CHECKED_OUT") {
      throw new Error(`[ONE-CI-01] Cannot check in booking in '${booking.status}' state. Must be 'CHECKED_OUT'.`);
    }

    booking.status = "RETURNED";
    booking.returnedAt = new Date();

    if (damages) {
      booking.damageReport = damages.damageReport;
      booking.damageDeductionNgn = Math.min(booking.securityDepositNgn, damages.damageCostNgn);
    }

    const depositRefundNgn = booking.securityDepositNgn - booking.damageDeductionNgn;
    return { booking, depositRefundNgn };
  }

  public publishCallSheet(callSheet: DailyCallSheet): DailyCallSheet {
    this.callSheets.set(callSheet.id, callSheet);
    return callSheet;
  }

  public getCallSheet(id: string): DailyCallSheet | undefined {
    return this.callSheets.get(id);
  }

  private hasConflictingBooking(assetId: string, start: Date, end: Date): boolean {
    return Array.from(this.bookings.values()).some((b) => {
      if (!b.assetIds.includes(assetId) || b.status === "CANCELLED" || b.status === "RETURNED") {
        return false;
      }
      return start < b.endDate && end > b.startDate;
    });
  }

  private getBookingOrThrow(id: string): ProductionBooking {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error(`[ONE-ERR-404] Booking '${id}' not found.`);
    }
    return booking;
  }
}
