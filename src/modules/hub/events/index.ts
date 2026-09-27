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

export class FusionEventsEngine {
  private events = new Map<string, FusionEvent>();
  private tickets = new Map<string, IssuedTicket>();
  private secretKey: string;

  constructor(secretKey: string = "fusion-events-secure-hmac-secret-vmnl") {
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
}
