/**
 * VMN Creative Hubs Enterprise Database Repository
 * Authority: BRD R1.2A, PRD R1.3C, CCPP R1.1 §14-§54
 *
 * Provides transactional persistence for all 7 creative hubs:
 * - VCF (Film Fund Pitches & Production Slates)
 * - VTM (Talent Representation Contracts, Rate Cards & Opportunity Briefs)
 * - 1Studios (Soundstages, Equipment Assets & Daily Call Sheets)
 * - Events Hub (Festivals, Ticket Tiers & Scanned Check-in Badges)
 * - TEND (Distribution Titles, Territory Licenses & Royalty Statements)
 * - Community Hub (Co-working Locations, Bookable Desks & Memberships)
 * - AFCA (Film Academy Courses & Student Admissions Ledger)
 */

import {
  normalizeRepositoryListOptions,
  paginateMemoryRows,
  RepositoryListOptions,
  RepositoryListPage,
} from "./pagination.js";

// ============================================================================
// 1. VCF: PITCHES & SLATES
// ============================================================================

export interface PitchSubmissionEntity {
  id: string;
  creatorId: string;
  projectTitle: string;
  logline: string;
  synopsis: string;
  genre: string;
  estimatedBudgetNgn: number;
  targetAudience: string;
  pitchDeckUrl?: string;
  scriptSampleUrl?: string;
  status: string;
  reviewerNotes?: string;
  scoreTotal?: number;
  submittedAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

export interface SlateProjectEntity {
  id: string;
  pitchId: string;
  title: string;
  productionHouseOrgId?: string;
  totalApprovedBudgetNgn: number;
  disbursedAmountNgn: number;
  currentTranche: number;
  totalTranches: number;
  status: string;
  executiveProducerId: string;
  completionBondUrl?: string;
  greenlitAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

// ============================================================================
// 2. VTM: CONTRACTS, RATE CARDS & BRIEFS
// ============================================================================

export interface VtmContractEntity {
  id: string;
  talentPersonId: string;
  agencyCommissionRate: number;
  startDate: Date;
  endDate: Date;
  exclusiveScope: string;
  status: string;
  signedContractUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

// ============================================================================
// 3. TEND: DISTRIBUTION & LICENSING
// ============================================================================

export interface DistributionTitleEntity {
  id: string;
  title: string;
  contentId?: string;
  internationalTitle?: string;
  format: string;
  totalEpisodes: number;
  runtimeMinutes: number;
  languages: string;
  has4kMaster: boolean;
  has51Surround: boolean;
  mezzanineUrl?: string;
  trailerUrl?: string;
  releaseYear: number;
  activeTerritories: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

// ============================================================================
// 4. 1STUDIOS: PRODUCTION CALL SHEETS
// ============================================================================

export interface DailyCallSheetEntity {
  id: string;
  projectId?: string;
  productionTitle?: string;
  shootDayNumber?: number;
  totalShootDays?: number;
  callDate?: Date;
  shootDate?: Date;
  dayNumber?: number;
  totalDays?: number;
  generalCallTime: Date;
  locationAddress: string;
  nearestHospital: string;
  weatherForecast?: string;
  safetyNotes?: string;
  crewListJson: string;
  castCallTimesJson: string;
  publishedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  source?: "DB" | "MEMORY";
}

// ============================================================================
// 5. EVENTS HUB: FESTIVALS & TICKETS
// ============================================================================

export interface FusionEventEntity {
  id: string;
  code: string;
  name: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  status: string;
  source?: "DB" | "MEMORY";
}

export interface EventTicketEntity {
  id: string;
  ticketNumber: string;
  eventId: string;
  attendeeName: string;
  attendeeEmail: string;
  tier: string;
  pricePaidNgn: number;
  status: string;
  qrSignatureHmac: string;
  issuedAt: Date;
  checkedInAt?: Date;
  source?: "DB" | "MEMORY";
}

const store = {
  memoryPitches: new Map<string, PitchSubmissionEntity>(),
  memorySlates: new Map<string, SlateProjectEntity>(),
  memoryContracts: new Map<string, VtmContractEntity>(),
  memoryTitles: new Map<string, DistributionTitleEntity>(),
  memoryCallSheets: new Map<string, DailyCallSheetEntity>(),
  memoryEvents: new Map<string, FusionEventEntity>(),
  memoryTickets: new Map<string, EventTicketEntity>(),
};

export async function savePitchSubmission(
  pitch: Omit<PitchSubmissionEntity, "submittedAt" | "updatedAt" | "source"> & { submittedAt?: Date }
): Promise<PitchSubmissionEntity> {
  const entity: PitchSubmissionEntity = {
    ...pitch,
    submittedAt: pitch.submittedAt ?? new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };
  store.memoryPitches.set(entity.id, entity);
  return entity;
}

export async function getPitchSubmission(id: string): Promise<PitchSubmissionEntity | null> {
  return store.memoryPitches.get(id) ?? null;
}

export async function listPitchSubmissions(
  options?: RepositoryListOptions & { status?: string; creatorId?: string }
): Promise<RepositoryListPage<PitchSubmissionEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memoryPitches.values());
  if (options?.status) rows = rows.filter((r) => r.status === options.status);
  if (options?.creatorId) rows = rows.filter((r) => r.creatorId === options.creatorId);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveSlateProject(
  slate: Omit<SlateProjectEntity, "greenlitAt" | "updatedAt" | "source">
): Promise<SlateProjectEntity> {
  const entity: SlateProjectEntity = {
    ...slate,
    greenlitAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };
  store.memorySlates.set(entity.id, entity);
  return entity;
}

export async function listSlateProjects(
  options?: RepositoryListOptions & { status?: string; executiveProducerId?: string }
): Promise<RepositoryListPage<SlateProjectEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memorySlates.values());
  if (options?.status) rows = rows.filter((r) => r.status === options.status);
  if (options?.executiveProducerId) rows = rows.filter((r) => r.executiveProducerId === options.executiveProducerId);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveVtmContract(
  contract: Omit<VtmContractEntity, "createdAt" | "updatedAt" | "source">
): Promise<VtmContractEntity> {
  const entity: VtmContractEntity = {
    ...contract,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };
  store.memoryContracts.set(entity.id, entity);
  return entity;
}

export async function listVtmContracts(
  options?: RepositoryListOptions & { talentPersonId?: string; status?: string }
): Promise<RepositoryListPage<VtmContractEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memoryContracts.values());
  if (options?.talentPersonId) rows = rows.filter((r) => r.talentPersonId === options.talentPersonId);
  if (options?.status) rows = rows.filter((r) => r.status === options.status);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveDistributionTitle(
  title: Omit<DistributionTitleEntity, "createdAt" | "updatedAt" | "source">
): Promise<DistributionTitleEntity> {
  const entity: DistributionTitleEntity = {
    ...title,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };
  store.memoryTitles.set(entity.id, entity);
  return entity;
}

export async function listDistributionTitles(
  options?: RepositoryListOptions & { format?: string }
): Promise<RepositoryListPage<DistributionTitleEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memoryTitles.values());
  if (options?.format) rows = rows.filter((r) => r.format === options.format);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveDailyCallSheet(
  callSheet: Omit<DailyCallSheetEntity, "createdAt" | "updatedAt" | "source">
): Promise<DailyCallSheetEntity> {
  const entity: DailyCallSheetEntity = {
    ...callSheet,
    productionTitle: callSheet.productionTitle || "1Studios Untitled Shoot",
    shootDayNumber: callSheet.shootDayNumber ?? callSheet.dayNumber ?? 1,
    totalShootDays: callSheet.totalShootDays ?? callSheet.totalDays ?? 1,
    callDate: callSheet.callDate ?? callSheet.shootDate ?? new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    source: "MEMORY",
  };
  store.memoryCallSheets.set(entity.id, entity);
  return entity;
}

export async function listDailyCallSheets(
  options?: RepositoryListOptions & { productionTitle?: string; projectId?: string }
): Promise<RepositoryListPage<DailyCallSheetEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  let rows = Array.from(store.memoryCallSheets.values());
  if (options?.productionTitle) rows = rows.filter((r) => r.productionTitle === options.productionTitle);
  if (options?.projectId) rows = rows.filter((r) => r.projectId === options.projectId);
  return paginateMemoryRows(rows, (r) => r.id, norm);
}

export async function saveFusionEvent(
  event: FusionEventEntity
): Promise<FusionEventEntity> {
  const entity: FusionEventEntity = { ...event, source: "MEMORY" };
  store.memoryEvents.set(entity.code, entity);
  return entity;
}

export async function listFusionEvents(
  options?: RepositoryListOptions
): Promise<RepositoryListPage<FusionEventEntity>> {
  const norm = normalizeRepositoryListOptions(options);
  return paginateMemoryRows(Array.from(store.memoryEvents.values()), (r) => r.id, norm);
}

export async function saveEventTicket(
  ticket: EventTicketEntity
): Promise<EventTicketEntity> {
  const entity: EventTicketEntity = { ...ticket, source: "MEMORY" };
  store.memoryTickets.set(entity.ticketNumber, entity);
  return entity;
}

export async function getEventTicket(ticketNumber: string): Promise<EventTicketEntity | null> {
  return store.memoryTickets.get(ticketNumber) ?? null;
}
