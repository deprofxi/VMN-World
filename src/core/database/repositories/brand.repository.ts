/**
 * VMN Brand Operations Enterprise Database Repository
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A / VMN World IA R1.1 (BRI Journey)
 *
 * Provides PostgreSQL persistence and querying for all 35 owner-approved
 * brand instances across the 4 primary brand families (TEN, Nigezie, Candy TV, Games 360).
 */

import { getPrismaClient } from "../index.js";

export interface BrandRecord {
  id: string;
  code: string;
  slug: string;
  name: string;
  familySlug: string;
  familyName: string;
  screenId: string;
  primaryAction: string;
  dataClass: string;
  sourceOffice: string;
  recoveryRoute: string;
  operatingStatus: string;
  isApproved: boolean;
  description?: string;
}

export interface BrandFamilyGroup {
  familySlug: string;
  familyName: string;
  screenId: string;
  route: string;
  instances: BrandRecord[];
}

/** Canonical list of all 35 owner-approved brand instances. */
export const CANONICAL_BRANDS: ReadonlyArray<BrandRecord> = [
  { id: "BRI-001", code: "TEN-01", slug: "ten-urban", name: "TEN Urban", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-001", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-002", code: "TEN-02", slug: "ten-naija", name: "TEN Naija", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-002", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-003", code: "TEN-03", slug: "ten-orisun", name: "TEN Orisun", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-003", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-004", code: "TEN-04", slug: "ten-isi-mbido", name: "TEN Isi Mbido", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-004", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-005", code: "TEN-05", slug: "ten-tushe", name: "TEN Tushe", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-005", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-006", code: "TEN-06", slug: "ten-prime", name: "TEN Prime", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-006", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-007", code: "TEN-07", slug: "ten-movies", name: "TEN Movies", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-007", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-008", code: "TEN-08", slug: "ten-news", name: "TEN News", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-008", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-009", code: "TEN-09", slug: "ten-originals", name: "TEN Originals", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-009", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-010", code: "TEN-10", slug: "ten-events", name: "TEN Events", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-010", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-011", code: "TEN-11", slug: "ten-live", name: "TEN Live", familySlug: "ten", familyName: "TEN Family", screenId: "BRI-011", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-012", code: "NIG-01", slug: "nigezie-xtreme", name: "Nigezie Xtreme", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-012", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-013", code: "NIG-02", slug: "nigezie-xplore", name: "Nigezie Xplore", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-013", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-014", code: "NIG-03", slug: "nigezie-revolution", name: "Nigezie Revolution", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-014", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-015", code: "NIG-04", slug: "nigezie-reality", name: "Nigezie Reality", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-015", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-016", code: "NIG-05", slug: "nigezie-live", name: "Nigezie Live", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-016", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-017", code: "NIG-06", slug: "nigezie-originals", name: "Nigezie Originals", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-017", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-018", code: "NIG-07", slug: "nigezie-next-wave", name: "Nigezie Next Wave", familySlug: "nigezie", familyName: "Nigezie Family", screenId: "BRI-018", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-019", code: "CTV-01", slug: "candy-ville", name: "Candy Ville", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-019", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-020", code: "CTV-02", slug: "candy-store", name: "Candy Store", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-020", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-021", code: "CTV-03", slug: "candy-models", name: "Candy Models", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-021", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-022", code: "CTV-04", slug: "candy-reality", name: "Candy Reality", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-022", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-023", code: "CTV-05", slug: "candy-play", name: "Candy Play", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-023", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-024", code: "CTV-06", slug: "candy-confessions", name: "Candy Confessions", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-024", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-025", code: "CTV-07", slug: "candy-style", name: "Candy Style", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-025", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-026", code: "CTV-08", slug: "candy-street", name: "Candy Street", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-026", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-027", code: "CTV-09", slug: "candy-plus", name: "Candy Plus", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-027", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-028", code: "CTV-10", slug: "candy-live", name: "Candy Live", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-028", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-029", code: "CTV-11", slug: "candy-cast", name: "Candy Cast", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-029", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-030", code: "CTV-12", slug: "candy-academy", name: "Candy Academy", familySlug: "candy-tv", familyName: "Candy TV Family", screenId: "BRI-030", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-031", code: "G360-01", slug: "games-radio", name: "Games Radio", familySlug: "games-360", familyName: "Games 360 Family", screenId: "BRI-031", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-032", code: "G360-02", slug: "games-tv", name: "Games TV", familySlug: "games-360", familyName: "Games 360 Family", screenId: "BRI-032", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-033", code: "G360-03", slug: "games-bet", name: "Games Bet", familySlug: "games-360", familyName: "Games 360 Family", screenId: "BRI-033", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-034", code: "G360-04", slug: "games-lotto", name: "Games Lotto", familySlug: "games-360", familyName: "Games 360 Family", screenId: "BRI-034", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
  { id: "BRI-035", code: "G360-05", slug: "games-community", name: "Games Community", familySlug: "games-360", familyName: "Games 360 Family", screenId: "BRI-035", primaryAction: "Read the brand profile and follow only a verified action", dataClass: "PUBLIC", sourceOffice: "Group Brand Steward / authorised publisher", recoveryRoute: "Display truthful status and direct accessible contact/approved alternate without revealing private records.", operatingStatus: "OPERATING_STATUS_NOT_PUBLISHED", isApproved: true },
];

export const BRAND_FAMILIES_META: ReadonlyArray<{ familySlug: string; familyName: string; screenId: string; route: string }> = [
  { familySlug: "ten", familyName: "TEN Family Overview", screenId: "BRD-002", route: "/brands/ten" },
  { familySlug: "nigezie", familyName: "Nigezie Family Overview", screenId: "BRD-003", route: "/brands/nigezie" },
  { familySlug: "candy-tv", familyName: "Candy TV Family Overview", screenId: "BRD-004", route: "/brands/candy-tv" },
  { familySlug: "games-360", familyName: "Games 360 Family Overview", screenId: "BRD-005", route: "/brands/games-360" },
];

// In-memory registry cache (hydrated from DB at boot or canonical fallback)
const brandMemoryStore = new Map<string, BrandRecord>();
for (const brand of CANONICAL_BRANDS) {
  brandMemoryStore.set(brand.slug, { ...brand });
}

/** Ensure Postgres table exists. */
export async function ensureBrandTable(): Promise<boolean> {
  const prisma = getPrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "brands" (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        family_slug TEXT NOT NULL,
        family_name TEXT NOT NULL,
        screen_id TEXT NOT NULL,
        primary_action TEXT,
        data_class TEXT,
        source_office TEXT,
        recovery_route TEXT,
        operating_status TEXT NOT NULL DEFAULT 'OPERATING_STATUS_NOT_PUBLISHED',
        is_approved BOOLEAN NOT NULL DEFAULT true,
        description TEXT,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "brands_family_slug_idx" ON "brands"("family_slug");
      CREATE INDEX IF NOT EXISTS "brands_code_idx" ON "brands"("code");
    `);
    return true;
  } catch {
    return false;
  }
}

/** Save a brand record into PostgreSQL and update in-memory cache. */
export async function persistBrandToDatabase(record: BrandRecord): Promise<void> {
  brandMemoryStore.set(record.slug, { ...record });
  const prisma = getPrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "brands" (id, code, slug, name, family_slug, family_name, screen_id, primary_action, data_class, source_office, recovery_route, operating_status, is_approved, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         family_slug = EXCLUDED.family_slug,
         family_name = EXCLUDED.family_name,
         screen_id = EXCLUDED.screen_id,
         primary_action = EXCLUDED.primary_action,
         data_class = EXCLUDED.data_class,
         source_office = EXCLUDED.source_office,
         recovery_route = EXCLUDED.recovery_route,
         operating_status = EXCLUDED.operating_status,
         is_approved = EXCLUDED.is_approved,
         description = EXCLUDED.description,
         updated_at = CURRENT_TIMESTAMP`,
      record.id,
      record.code,
      record.slug,
      record.name,
      record.familySlug,
      record.familyName,
      record.screenId,
      record.primaryAction,
      record.dataClass,
      record.sourceOffice,
      record.recoveryRoute,
      record.operatingStatus,
      record.isApproved,
      record.description ?? null
    );
  } catch {
    // Non-blocking in test/memory mode
  }
}

/** Save all 35 brands into PostgreSQL database. */
export async function seedAllBrandsToDatabase(): Promise<BrandRecord[]> {
  await ensureBrandTable();
  const seeded: BrandRecord[] = [];
  for (const b of CANONICAL_BRANDS) {
    await persistBrandToDatabase(b);
    seeded.push(b);
  }
  return seeded;
}

/** Hydrate memory cache from PostgreSQL if connected. */
export async function hydrateBrandsFromDatabase(): Promise<void> {
  const prisma = getPrismaClient();
  try {
    await ensureBrandTable();
    interface DbBrandRow {
      id: string;
      code: string;
      slug: string;
      name: string;
      family_slug: string;
      family_name: string;
      screen_id: string;
      primary_action: string | null;
      data_class: string | null;
      source_office: string | null;
      recovery_route: string | null;
      operating_status: string;
      is_approved: boolean;
      description: string | null;
    }
    const rows = await prisma.$queryRawUnsafe<DbBrandRow[]>(
      `SELECT id, code, slug, name, family_slug, family_name, screen_id, primary_action, data_class, source_office, recovery_route, operating_status, is_approved, description FROM "brands" ORDER BY code ASC`
    );
    if (rows && rows.length > 0) {
      for (const r of rows) {
        brandMemoryStore.set(r.slug, {
          id: r.id,
          code: r.code,
          slug: r.slug,
          name: r.name,
          familySlug: r.family_slug,
          familyName: r.family_name,
          screenId: r.screen_id,
          primaryAction: r.primary_action ?? "",
          dataClass: r.data_class ?? "PUBLIC",
          sourceOffice: r.source_office ?? "",
          recoveryRoute: r.recovery_route ?? "",
          operatingStatus: r.operating_status,
          isApproved: r.is_approved,
          description: r.description ?? undefined,
        });
      }
    } else {
      // Seed if table is empty
      await seedAllBrandsToDatabase();
    }
  } catch {
    // Database offline; memory store remains active
  }
}

/** Get all brand records (synchronous memory read backed by DB). */
export function getAllBrands(): readonly BrandRecord[] {
  return Array.from(brandMemoryStore.values());
}

/** Get single brand record by slug. */
export function getBrandBySlug(slug: string): BrandRecord | undefined {
  return brandMemoryStore.get(slug);
}

/** Get all brands belonging to a family. */
export function getBrandsByFamily(familySlug: string): readonly BrandRecord[] {
  return Array.from(brandMemoryStore.values()).filter((b) => b.familySlug === familySlug);
}

/** Get structured brand families with their instances. */
export function getBrandFamilyGroups(): readonly BrandFamilyGroup[] {
  return BRAND_FAMILIES_META.map((meta) => ({
    ...meta,
    instances: Array.from(brandMemoryStore.values()).filter((b) => b.familySlug === meta.familySlug),
  }));
}
