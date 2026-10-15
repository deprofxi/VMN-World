/**
 * TSK-05: parent-record fixtures for the DB-backed repository tests.
 *
 * `TalentProfile.personId` and `Programme.channelCode` are real foreign keys,
 * so a repository write in fail-closed mode legitimately 503s unless the parent
 * exists. These helpers seed the parents first — in the same dependency order
 * the schema requires — instead of relaxing the fail-closed policy.
 *
 * When no database is reachable the repositories degrade to their in-memory
 * store, so these helpers no-op in that case rather than masking the mode the
 * test is actually exercising.
 */

import { checkDatabaseConnection, getPrismaClient } from "../../src/core/database/index.js";

/** Channels referenced by repository fixtures; mirrors the seed dataset codes. */
export const FIXTURE_CHANNELS: ReadonlyArray<{ code: string; name: string }> = [
  { code: "NXTR", name: "Naija Xtreme" },
  { code: "ORIS", name: "Oris Legacy" },
  { code: "IMBD", name: "Igbone Media" },
];

export async function ensureFixtureChannels(
  codes: readonly string[] = FIXTURE_CHANNELS.map((c) => c.code),
): Promise<void> {
  const db = await checkDatabaseConnection();
  if (!db.connected) return;
  const prisma = getPrismaClient();
  for (const code of codes) {
    const seed = FIXTURE_CHANNELS.find((c) => c.code === code);
    if (!seed) throw new Error(`[FIXTURE] Unknown channel code '${code}' — add it to FIXTURE_CHANNELS.`);
    await prisma.broadcastChannel.upsert({
      where: { code },
      update: {},
      create: {
        code: seed.code,
        name: seed.name,
        tagline: `${seed.name} - fixture channel`,
        primaryLanguage: seed.code === "ORIS" ? "Yoruba" : seed.code === "IMBD" ? "Igbo" : "English / Pidgin",
        isProvisional: true,
      },
    });
  }
}

/** Creates the `Person` a `TalentProfile` foreign key points at. Idempotent. */
export async function ensureFixturePerson(
  personId: string,
  names: { firstName: string; lastName: string },
): Promise<void> {
  const db = await checkDatabaseConnection();
  if (!db.connected) return;
  const prisma = getPrismaClient();
  await prisma.person.upsert({
    where: { id: personId },
    update: {},
    create: {
      id: personId,
      email: `fixture+${personId}@vmnl.test`,
      firstName: names.firstName,
      lastName: names.lastName,
    },
  });
}

/**
 * Removes fixture children before their parents, in schema FK order
 * (episode -> programme -> channel, talent -> person). Called from both
 * `beforeAll` and `afterAll` so an interrupted run cannot leave rows that make
 * a later run's counts non-deterministic.
 */
export async function deleteFixtureRows(scope: {
  episodeCodes?: readonly string[];
  programmeCodes?: readonly string[];
  personIds?: readonly string[];
  channelCodes?: readonly string[];
  asRunCertificateHashes?: readonly string[];
  dealIds?: readonly string[];
}): Promise<void> {
  const db = await checkDatabaseConnection();
  if (!db.connected) return;
  const prisma = getPrismaClient();
  if (scope.dealIds?.length) {
    // TSK-60 box 3: deals created through POST /api/v1/finance/deals are durable
    // rows, so a fixture id a previous run left behind would make this run's POST
    // a duplicate-id refusal instead of the stage progression under test.
    await prisma.salesDealRecord.deleteMany({ where: { id: { in: [...scope.dealIds] } } });
  }
  if (scope.asRunCertificateHashes?.length) {
    // Scoped by the fixture's own certificate hash: AsRunLog ids are random, so
    // this is the only handle that reaches rows a previous run left behind.
    await prisma.asRunLogRecord.deleteMany({
      where: { certificateHashSha256: { in: [...scope.asRunCertificateHashes] } },
    });
  }
  if (scope.episodeCodes?.length || scope.programmeCodes?.length) {
    await prisma.broadcastEpisode.deleteMany({
      where: {
        OR: [
          ...(scope.episodeCodes?.length ? [{ episodeCode: { in: [...scope.episodeCodes] } }] : []),
          ...(scope.programmeCodes?.length ? [{ programmeCode: { in: [...scope.programmeCodes] } }] : []),
        ],
      },
    });
  }
  if (scope.programmeCodes?.length) {
    await prisma.programme.deleteMany({ where: { code: { in: [...scope.programmeCodes] } } });
  }
  if (scope.personIds?.length) {
    await prisma.talentProfile.deleteMany({ where: { personId: { in: [...scope.personIds] } } });
    await prisma.person.deleteMany({ where: { id: { in: [...scope.personIds] } } });
  }
  if (scope.channelCodes?.length) {
    await prisma.broadcastChannel.deleteMany({ where: { code: { in: [...scope.channelCodes] } } });
  }
}
