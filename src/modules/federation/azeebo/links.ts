/**
 * Azeebo+ Level 1 Federation: Universal Deep Links & Broadcast QR Gateway
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §40, §41 / VMNL-AZP-VMN-CCPP-001 §16
 *
 * Core Mandate:
 * Cross-platform referral into Azeebo+ 8 consumer universes:
 * Vertical, Movies, Lifestyle, Comedy, Creator, Reality, Games, Sports.
 * Dynamic broadcast QR code generator with UTM attribution parameters and link telemetry.
 */

export type AzeeboUniverse =
  | "VERTICAL"
  | "MOVIES"
  | "LIFESTYLE"
  | "COMEDY"
  | "CREATOR"
  | "REALITY"
  | "GAMES"
  | "SPORTS";

export interface DeepLinkParams {
  universe: AzeeboUniverse;
  contentId: string;
  channelId?: "NXTR" | "ORIS" | "IMBD";
  campaignId: string;
  utmSource?: string;
  utmMedium?: string;
}

export interface GeneratedDeepLink {
  universalUrl: string; // <configured AZEEBO_PLUS_UNIVERSAL_URL>/u/...
  appSchemeUrl: string; // azeeboplus://u/...
  qrPayload: string;
  trackingId: string;
  createdAt: Date;
}

export interface ScanTelemetry {
  trackingId: string;
  deviceType: "IOS" | "ANDROID" | "DESKTOP" | "OTHER";
  ipHashSha256: string;
  userAgent?: string;
  scannedAt: Date;
}

export interface AzeeboLinkGatewayOptions {
  /**
   * Partner-supplied universal link origin. CLAUDE.md `<azeebo>` forbids this
   * module from inventing one: when it is absent, link generation fails closed
   * instead of falling back to a guessed production domain.
   */
  universalBaseUrl?: string;
  appScheme?: string;
}

export class AzeeboLinkGateway {
  private activeLinks = new Map<string, GeneratedDeepLink>();
  private scans: ScanTelemetry[] = [];
  private universalBaseUrl?: string;
  private appScheme: string;

  constructor(options?: AzeeboLinkGatewayOptions) {
    const base = options?.universalBaseUrl?.replace(/\/+$/, "");
    this.universalBaseUrl = base ? base : undefined;
    this.appScheme = options?.appScheme?.replace(/:\/\/?$/, "") || "azeeboplus";
  }

  public isConfigured(): boolean {
    return this.universalBaseUrl !== undefined;
  }

  public createUniversalLink(params: DeepLinkParams): GeneratedDeepLink {
    const universalBaseUrl = this.universalBaseUrl;
    if (!universalBaseUrl) {
      throw new Error("[LINK-01] Azeebo+ universal link origin is not configured (AZEEBO_PLUS_UNIVERSAL_URL); no endpoint may be invented.");
    }
    const trackingId = `TRK-${params.universe.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const source = params.utmSource || (params.channelId ? `vmn_${params.channelId.toLowerCase()}` : "vmn_broadcast");
    const medium = params.utmMedium || "linear_qr";
    const universeSlug = params.universe.toLowerCase();

    const queryParams = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: params.campaignId,
      trk: trackingId,
    });

    const universalUrl = `${universalBaseUrl}/u/${universeSlug}/${params.contentId}?${queryParams.toString()}`;
    const appSchemeUrl = `${this.appScheme}://u/${universeSlug}/${params.contentId}?${queryParams.toString()}`;

    const link: GeneratedDeepLink = {
      universalUrl,
      appSchemeUrl,
      qrPayload: universalUrl,
      trackingId,
      createdAt: new Date(),
    };

    this.activeLinks.set(trackingId, link);
    return link;
  }

  public recordScan(scan: ScanTelemetry): { success: boolean; targetUrl?: string } {
    const link = this.activeLinks.get(scan.trackingId);
    if (!link) {
      return { success: false };
    }

    this.scans.push(scan);
    return { success: true, targetUrl: link.universalUrl };
  }

  public getScanCount(trackingId: string): number {
    return this.scans.filter((s) => s.trackingId === trackingId).length;
  }

  public getLink(trackingId: string): GeneratedDeepLink | undefined {
    return this.activeLinks.get(trackingId);
  }
}
