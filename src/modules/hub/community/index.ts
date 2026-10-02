/**
 * Afro-Fusion Creatives Co-Working & Community Hub
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §29 / VMNL-AZP-VMN-CCPP-001 §11
 *
 * Core Mandate:
 * Community, guilds, mentorship, and physical/virtual hub operations.
 * Workspace and studio resource booking with conflict prevention and membership access gates.
 */

export type MembershipTier = "COMMUNITY" | "STUDENT" | "CREATOR" | "RESIDENT" | "ENTERPRISE";
export type MembershipStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED";
export type ResourceType =
  | "HOT_DESK"
  | "DEDICATED_DESK"
  | "PODCAST_STUDIO"
  | "EDITING_SUITE"
  | "SCREENING_ROOM"
  | "MEETING_ROOM";

export type BookingStatus = "RESERVED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";

export interface HubLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  operatingHours: { open: string; close: string }; // e.g. "08:00", "22:00"
}

export interface HubResource {
  id: string;
  hubLocationId: string;
  name: string;
  type: ResourceType;
  capacity: number;
  hourlyRateNgn: number;
  minimumTierRequired: MembershipTier;
  isActive: boolean;
}

export interface HubMember {
  id: string;
  personId: string;
  fullName: string;
  email: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinedAt: Date;
  expiresAt: Date;
  guilds: string[];
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  memberId: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  totalCostNgn: number;
  notes?: string;
  checkedInAt?: Date;
  createdAt: Date;
}

const TIER_HIERARCHY: Record<MembershipTier, number> = {
  COMMUNITY: 0,
  STUDENT: 1,
  CREATOR: 2,
  RESIDENT: 3,
  ENTERPRISE: 4,
};

export class AfroFusionCommunityHub {
  private locations = new Map<string, HubLocation>();
  private resources = new Map<string, HubResource>();
  private members = new Map<string, HubMember>();
  private bookings = new Map<string, ResourceBooking>();

  constructor() {
    // Seed flagship location
    this.addLocation({
      id: "LOC-LOS-HQ",
      name: "VMN Creative Campus Lagos",
      city: "Lagos",
      address: "Plot 12 Commercial Avenue, Ikeja, Lagos",
      operatingHours: { open: "08:00", close: "22:00" },
    });
  }

  public addLocation(location: HubLocation): HubLocation {
    this.locations.set(location.id, location);
    return location;
  }

  public getLocations(): HubLocation[] {
    return Array.from(this.locations.values());
  }

  public addResource(resource: HubResource): HubResource {
    if (!this.locations.has(resource.hubLocationId)) {
      throw new Error(`[COMM-RES-01] Location '${resource.hubLocationId}' not found.`);
    }
    this.resources.set(resource.id, resource);
    return resource;
  }

  public registerMember(member: HubMember): HubMember {
    this.members.set(member.id, member);
    return member;
  }

  public getMember(id: string): HubMember | undefined {
    return this.members.get(id);
  }

  /** Read accessor for guild-desk projections (SCR-18). */
  public listMembers(): HubMember[] {
    return Array.from(this.members.values());
  }

  /** Read accessor for guild-desk projections (SCR-18). */
  public listResources(): HubResource[] {
    return Array.from(this.resources.values());
  }

  /** Read accessor for guild-desk projections (SCR-18). */
  public listBookings(): ResourceBooking[] {
    return Array.from(this.bookings.values());
  }

  public bookResource(params: {
    id: string;
    resourceId: string;
    memberId: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }): ResourceBooking {
    const resource = this.resources.get(params.resourceId);
    if (!resource || !resource.isActive) {
      throw new Error(`[COMM-BKG-01] Resource '${params.resourceId}' is not available.`);
    }

    const member = this.members.get(params.memberId);
    if (!member) {
      throw new Error(`[COMM-BKG-02] Member '${params.memberId}' not found.`);
    }

    if (member.status !== "ACTIVE" || member.expiresAt < new Date()) {
      throw new Error(`[COMM-BKG-03] Member '${params.memberId}' does not have an active membership.`);
    }

    // Verify tier access
    const requiredLevel = TIER_HIERARCHY[resource.minimumTierRequired];
    const memberLevel = TIER_HIERARCHY[member.tier];
    if (memberLevel < requiredLevel) {
      throw new Error(
        `[COMM-BKG-04] Insufficient tier: Resource requires '${resource.minimumTierRequired}', member has '${member.tier}'.`
      );
    }

    if (params.endTime <= params.startTime) {
      throw new Error("[COMM-BKG-05] End time must be strictly after start time.");
    }

    // Check for double booking
    const hasOverlap = this.hasConflictingBooking(params.resourceId, params.startTime, params.endTime);
    if (hasOverlap) {
      throw new Error(`[COMM-BKG-06] Resource '${resource.name}' is already booked for the requested time window.`);
    }

    const durationHours = (params.endTime.getTime() - params.startTime.getTime()) / (1000 * 60 * 60);
    const totalCostNgn = Math.round(durationHours * resource.hourlyRateNgn);

    const booking: ResourceBooking = {
      id: params.id,
      resourceId: params.resourceId,
      memberId: params.memberId,
      startTime: params.startTime,
      endTime: params.endTime,
      status: "RESERVED",
      totalCostNgn,
      notes: params.notes,
      createdAt: new Date(),
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  public checkIn(bookingId: string): ResourceBooking {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`[COMM-CHK-01] Booking '${bookingId}' not found.`);
    }
    if (booking.status !== "RESERVED") {
      throw new Error(`[COMM-CHK-02] Cannot check in booking with status '${booking.status}'.`);
    }

    booking.status = "CHECKED_IN";
    booking.checkedInAt = new Date();
    return booking;
  }

  public cancelBooking(bookingId: string): ResourceBooking {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`[COMM-CNC-01] Booking '${bookingId}' not found.`);
    }
    if (booking.status === "COMPLETED") {
      throw new Error("[COMM-CNC-02] Cannot cancel an already completed booking.");
    }

    booking.status = "CANCELLED";
    return booking;
  }

  public listBookingsForResource(resourceId: string): ResourceBooking[] {
    return Array.from(this.bookings.values()).filter((b) => b.resourceId === resourceId);
  }

  private hasConflictingBooking(resourceId: string, start: Date, end: Date): boolean {
    return Array.from(this.bookings.values()).some((b) => {
      if (b.resourceId !== resourceId || b.status === "CANCELLED") {
        return false;
      }
      return start < b.endTime && end > b.startTime;
    });
  }
}
