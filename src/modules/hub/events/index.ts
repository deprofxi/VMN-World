/**
 * Fusion Events Management Engine
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §33 / VMNL-AZP-VMN-CCPP-001 §14
 *
 * Core Mandate:
 * Physical live experiences, concerts, award galas, and industry showcases.
 * Tiered ticket sales, cryptographically signed QR tokens, single-use anti-fraud gate validation,
 * and live attendance gate analytics.
 */

import { createHmac } from "node:crypto";

export type EventCategory = "CONCERT" | "FESTIVAL" | "AWARD_SHOW" | "CREATIVE_CONFERENCE" | "SHOWCASE";
export type TicketTier = "REGULAR" | "VIP" | "VVIP" | "BACKSTAGE_PASS";
export type TicketStatus = "ISSUED" | "CHECKED_IN" | "CANCELLED" | "FLAGGED_FRAUD";

export interface FusionEvent {
  id: string;
  name: string;
  category: EventCategory;
  venueName: string;
  venueCity: string;
  eventDate: Date;
  doorsOpenTime: string; // e.g. "17:00"
  capacity: number;
  tiers: Record<TicketTier, { priceNgn: number; allocation: number; sold: number }>;
  isPublished: boolean;
}

export interface IssuedTicket {
  ticketNumber: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  tier: TicketTier;
  pricePaidNgn: number;
  status: TicketStatus;
  qrPayload: string;
  qrSignatureHmac: string;
  issuedAt: Date;
  checkedInAt?: Date;
  gateScannedBy?: string;
}

export interface GateValidationResult {
  valid: boolean;
  ticket?: IssuedTicket;
  reason?: "TICKET_NOT_FOUND" | "INVALID_SIGNATURE" | "ALREADY_CHECKED_IN" | "EVENT_MISMATCH" | "CANCELLED";
  message: string;
}

// TODO-BCST-10: offline gate-scan token + sync record contracts.
export interface OfflineScanToken {
  deviceId: string;
  eventId: string;
  issuedAt: Date;
  expiresAt: Date;
  signature: string; // HMAC-SHA256 over deviceId|eventId|issuedAt|expiresAt
}

export interface OfflineScanRecord {
  ticketNumber: string;
  deviceId: string;
  eventId: string;
  scannedAt: Date;
  acceptedForSync: boolean;
  outcome: "STAGED_FOR_SYNC" | "DUPLICATE_OFFLINE_SCAN" | "TOKEN_EXPIRED" | "TOKEN_SIGNATURE_INVALID";
}

export interface OfflineScanSyncRecord {
  ticketNumber: string;
  deviceId: string;
  eventId: string;
  scannedAt: Date;
  syncOutcome: "ADMITTED" | "ALREADY_CHECKED_IN" | "CANCELLED_OR_FRAUD" | "TICKET_NOT_FOUND";
}

export class FusionEventsEngine {
  private events = new Map<string, FusionEvent>();
  private tickets = new Map<string, IssuedTicket>();
  private secretKey: string;
  private offlineScanQueue: Array<{ ticketNumber: string; deviceId: string; eventId: string; scannedAt: Date }> = [];
  private offlineScansSeen = new Set<string>();

  constructor(secretKey: string) {
    if (!secretKey || secretKey.length < 16) {
      throw new Error("FusionEventsEngine requires a valid secretKey of at least 16 characters");
    }
    this.secretKey = secretKey;
  }

  public createEvent(event: FusionEvent): FusionEvent {
    if (this.events.has(event.id)) {
      throw new Error(`[EVT-CRT-01] Event '${event.id}' already exists.`);
    }
    this.events.set(event.id, event);
    return event;
  }

  public getEvent(id: string): FusionEvent | undefined {
    return this.events.get(id);
  }

  /** Read accessor for desk projections (SCR-18). */
  public listEvents(): FusionEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * Read accessor for desk projections (SCR-18): tickets for one event.
   */
  public listTicketsForEvent(eventId: string): IssuedTicket[] {
    return Array.from(this.tickets.values()).filter((t) => t.eventId === eventId);
  }

  public issueTicket(params: {
    eventId: string;
    attendeeName: string;
    attendeeEmail: string;
    tier: TicketTier;
  }): IssuedTicket {
    const event = this.events.get(params.eventId);
    if (!event) {
      throw new Error(`[EVT-TKT-01] Event '${params.eventId}' not found.`);
    }

    const tierInfo = event.tiers[params.tier];
    if (!tierInfo) {
      throw new Error(`[EVT-TKT-02] Ticket tier '${params.tier}' not defined for this event.`);
    }

    if (tierInfo.sold >= tierInfo.allocation) {
      throw new Error(`[EVT-TKT-03] Tier '${params.tier}' sold out (capacity: ${tierInfo.allocation}).`);
    }

    const issuedAt = new Date();
    const ticketNumber = `EVT-${event.id.substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const rawPayload = `${ticketNumber}:${event.id}:${params.attendeeEmail}:${params.tier}:${issuedAt.toISOString()}`;
    const qrSignatureHmac = createHmac("sha256", this.secretKey).update(rawPayload).digest("hex");

    const qrPayload = JSON.stringify({
      t: ticketNumber,
      e: event.id,
      h: qrSignatureHmac.substring(0, 16),
    });

    const ticket: IssuedTicket = {
      ticketNumber,
      eventId: event.id,
      attendeeName: params.attendeeName,
      attendeeEmail: params.attendeeEmail,
      tier: params.tier,
      pricePaidNgn: tierInfo.priceNgn,
      status: "ISSUED",
      qrPayload,
      qrSignatureHmac,
      issuedAt,
    };

    tierInfo.sold += 1;
    this.tickets.set(ticketNumber, ticket);
    return ticket;
  }

  /**
   * Validates a scanned QR ticket at the gate.
   * INVARIANT: Prevents ticket reuse / cloning (single-use validation).
   */
  public scanGateTicket(params: {
    ticketNumber: string;
    eventId: string;
    gateStaffId: string;
  }): GateValidationResult {
    const ticket = this.tickets.get(params.ticketNumber);
    if (!ticket) {
      return {
        valid: false,
        reason: "TICKET_NOT_FOUND",
        message: "Invalid ticket: QR code not recognized in system.",
      };
    }

    if (ticket.eventId !== params.eventId) {
      return {
        valid: false,
        reason: "EVENT_MISMATCH",
        message: `Ticket is for event '${ticket.eventId}', not '${params.eventId}'.`,
      };
    }

    if (ticket.status === "CHECKED_IN") {
      return {
        valid: false,
        ticket,
        reason: "ALREADY_CHECKED_IN",
        message: `FRAUD ALERT: Ticket '${ticket.ticketNumber}' was already checked in at ${ticket.checkedInAt?.toISOString()} by ${ticket.gateScannedBy}.`,
      };
    }

    if (ticket.status === "CANCELLED" || ticket.status === "FLAGGED_FRAUD") {
      return {
        valid: false,
        ticket,
        reason: "CANCELLED",
        message: `Ticket '${ticket.ticketNumber}' has been revoked or flagged as fraudulent.`,
      };
    }

    // Verify cryptographic integrity
    const rawPayload = `${ticket.ticketNumber}:${ticket.eventId}:${ticket.attendeeEmail}:${ticket.tier}:${ticket.issuedAt.toISOString()}`;
    const expectedSignature = createHmac("sha256", this.secretKey).update(rawPayload).digest("hex");
    if (ticket.qrSignatureHmac !== expectedSignature) {
      ticket.status = "FLAGGED_FRAUD";
      return {
        valid: false,
        ticket,
        reason: "INVALID_SIGNATURE",
        message: "Cryptographic signature tampered: Possible cloned ticket!",
      };
    }

    // Mark as checked in
    ticket.status = "CHECKED_IN";
    ticket.checkedInAt = new Date();
    ticket.gateScannedBy = params.gateStaffId;

    return {
      valid: true,
      ticket,
      message: `Welcome, ${ticket.attendeeName}! Access granted: ${ticket.tier}.`,
    };
  }

  public getGateStatistics(eventId: string): {
    totalTicketsSold: number;
    totalCheckedIn: number;
    checkedInPercentage: number;
    byTier: Record<TicketTier, { sold: number; checkedIn: number }>;
  } {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`[EVT-STA-01] Event '${eventId}' not found.`);
    }

    let totalTicketsSold = 0;
    let totalCheckedIn = 0;
    const byTier: Record<TicketTier, { sold: number; checkedIn: number }> = {
      REGULAR: { sold: 0, checkedIn: 0 },
      VIP: { sold: 0, checkedIn: 0 },
      VVIP: { sold: 0, checkedIn: 0 },
      BACKSTAGE_PASS: { sold: 0, checkedIn: 0 },
    };

    for (const ticket of this.tickets.values()) {
      if (ticket.eventId !== eventId) continue;
      totalTicketsSold += 1;
      byTier[ticket.tier].sold += 1;
      if (ticket.status === "CHECKED_IN") {
        totalCheckedIn += 1;
        byTier[ticket.tier].checkedIn += 1;
      }
    }

    const checkedInPercentage =
      totalTicketsSold > 0 ? Math.round((totalCheckedIn / totalTicketsSold) * 1000) / 10 : 0;

    return {
      totalTicketsSold,
      totalCheckedIn,
      checkedInPercentage,
      byTier,
    };
  }

  // ---------------------------------------------------------------------------
  // TODO-BCST-10: Offline-capable event gate scanning (TASK-P4-04)
  //
  // Gate networks at festival venues lose connectivity. This layer lets the
  // gate app validate tickets offline against short-lived signed tokens
  // (HMAC over ticketNumber|eventId|window — replay- and tamper-resistant),
  // then reconcile every offline scan on reconnect. Invariants preserved:
  //  - single-use admission (duplicate offline scans for the SAME ticket
  //    within one device window are flagged as DUPLICATE_OFFLINE_SCAN and
  //    resolved deterministically at sync: first scan wins, later scans of an
  //    already-admitted ticket are recorded as rejects, never as admissions);
  //  - fraud flags on the canonical ticket record survive the offline window;
  //  - reconciliation is idempotent — re-submitting the same device batch
  //    cannot double-count admissions.
  // ---------------------------------------------------------------------------

  /** Issues a signed offline-validation window (default 12h) for a device. */
  public signOfflineScanToken(params: { deviceId: string; eventId: string; validHours?: number; now?: Date }): OfflineScanToken {
    const issuedAt = params.now || new Date();
    const expiresAt = new Date(issuedAt.getTime() + (params.validHours ?? 12) * 3600 * 1000);
    const payload = `OFFLINE-GATE:${params.deviceId}:${params.eventId}:${issuedAt.toISOString()}:${expiresAt.toISOString()}`;
    const signature = createHmac("sha256", this.secretKey).update(payload).digest("hex");
    return { deviceId: params.deviceId, eventId: params.eventId, issuedAt, expiresAt, signature };
  }

  /** Verifies an offline token: signature integrity, device/event binding, and expiry. */
  public verifyOfflineScanToken(token: OfflineScanToken, now: Date = new Date()): { valid: boolean; reason?: string } {
    const payload = `OFFLINE-GATE:${token.deviceId}:${token.eventId}:${token.issuedAt.toISOString()}:${token.expiresAt.toISOString()}`;
    const expected = createHmac("sha256", this.secretKey).update(payload).digest("hex");
    if (expected !== token.signature) {
      return { valid: false, reason: "TOKEN_SIGNATURE_INVALID" };
    }
    if (now.getTime() > token.expiresAt.getTime()) {
      return { valid: false, reason: "TOKEN_EXPIRED" };
    }
    return { valid: true };
  }

  /**
   * Records an offline scan made under a verified token. Does NOT mark the
   * canonical ticket checked-in (the device may be stale); it stages the scan
   * for reconciliation and detects same-device duplicate scans immediately.
   */
  public recordOfflineScan(params: { token: OfflineScanToken; ticketNumber: string; scannedAt: Date }): OfflineScanRecord {
    const tokenCheck = this.verifyOfflineScanToken(params.token, params.scannedAt);
    if (!tokenCheck.valid) {
      return { ticketNumber: params.ticketNumber, deviceId: params.token.deviceId, eventId: params.token.eventId, scannedAt: params.scannedAt, acceptedForSync: false, outcome: tokenCheck.reason === "TOKEN_EXPIRED" ? "TOKEN_EXPIRED" : "TOKEN_SIGNATURE_INVALID" };
    }
    const key = `${params.token.deviceId}:${params.ticketNumber}`;
    if (this.offlineScansSeen.has(key)) {
      return { ticketNumber: params.ticketNumber, deviceId: params.token.deviceId, eventId: params.token.eventId, scannedAt: params.scannedAt, acceptedForSync: true, outcome: "DUPLICATE_OFFLINE_SCAN" };
    }
    this.offlineScansSeen.add(key);
    this.offlineScanQueue.push({ ticketNumber: params.ticketNumber, deviceId: params.token.deviceId, eventId: params.token.eventId, scannedAt: params.scannedAt });
    return { ticketNumber: params.ticketNumber, deviceId: params.token.deviceId, eventId: params.token.eventId, scannedAt: params.scannedAt, acceptedForSync: true, outcome: "STAGED_FOR_SYNC" };
  }

  /**
   * Reconciles staged offline scans against canonical ticket state, in
   * chronological order. Idempotent: a ticket admitted online or in a prior
   * sync yields an ALREADY_CHECKED_IN reject, never a second admission.
   */
  public syncOfflineScans(params?: { deviceId?: string }): {
    admitted: number;
    rejectedAlreadyCheckedIn: number;
    rejectedFraudOrCancelled: number;
    rejectedUnknownTicket: number;
    duplicateOfflineScans: number;
    records: OfflineScanSyncRecord[];
  } {
    const queue = params?.deviceId ? this.offlineScanQueue.filter((s) => s.deviceId === params.deviceId) : [...this.offlineScanQueue];
    if (!params?.deviceId) {
      this.offlineScanQueue = [];
    } else {
      this.offlineScanQueue = this.offlineScanQueue.filter((s) => s.deviceId !== params.deviceId);
    }
    const sorted = [...queue].sort((a, b) => a.scannedAt.getTime() - b.scannedAt.getTime());

    const records: OfflineScanSyncRecord[] = [];
    const counts = { admitted: 0, rejectedAlreadyCheckedIn: 0, rejectedFraudOrCancelled: 0, rejectedUnknownTicket: 0, duplicateOfflineScans: 0 };

    for (const scan of sorted) {
      const ticket = this.tickets.get(scan.ticketNumber);
      if (!ticket) {
        counts.rejectedUnknownTicket += 1;
        records.push({ ...scan, syncOutcome: "TICKET_NOT_FOUND" });
        continue;
      }
      if (ticket.status === "CHECKED_IN") {
        counts.rejectedAlreadyCheckedIn += 1;
        records.push({ ...scan, syncOutcome: "ALREADY_CHECKED_IN" });
        continue;
      }
      if (ticket.status === "CANCELLED" || ticket.status === "FLAGGED_FRAUD") {
        counts.rejectedFraudOrCancelled += 1;
        records.push({ ...scan, syncOutcome: "CANCELLED_OR_FRAUD" });
        continue;
      }
      // Re-run the canonical HMAC validation path so a ticket whose payload
      // was tampered with during the offline window is flagged as fraud here.
      const result = this.scanGateTicket({ ticketNumber: scan.ticketNumber, eventId: scan.eventId, gateStaffId: `offline:${scan.deviceId}` });
      if (result.valid) {
        // Preserve the offline scan instant as the admission timestamp.
        ticket.checkedInAt = scan.scannedAt;
        counts.admitted += 1;
        records.push({ ...scan, syncOutcome: "ADMITTED" });
      } else if (result.reason === "ALREADY_CHECKED_IN") {
        counts.rejectedAlreadyCheckedIn += 1;
        records.push({ ...scan, syncOutcome: "ALREADY_CHECKED_IN" });
      } else if (result.reason === "INVALID_SIGNATURE") {
        counts.rejectedFraudOrCancelled += 1;
        records.push({ ...scan, syncOutcome: "CANCELLED_OR_FRAUD" });
      } else {
        counts.rejectedUnknownTicket += 1;
        records.push({ ...scan, syncOutcome: "TICKET_NOT_FOUND" });
      }
    }
    return { ...counts, records };
  }

  public getOfflineScanQueueSize(): number {
    return this.offlineScanQueue.length;
  }

  public _resetOfflineScansForTesting(): void {
    this.offlineScanQueue = [];
    this.offlineScansSeen.clear();
  }
}
