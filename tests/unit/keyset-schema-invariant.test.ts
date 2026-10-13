/**
 * TSK-22 — keyset paging schema invariant.
 *
 * The repository's two keyset list methods page by unique ordering columns:
 *   listProgrammes  → ORDER BY "code" ASC, WHERE channelCode = $1 AND code > $2
 *   listEpisodes    → ORDER BY "episodeCode" ASC, WHERE programmeCode = $1 AND episodeCode > $2
 *
 * For these queries to be served efficiently at catalogue scale, the Prisma
 * schema must declare indexes whose leading column(s) cover the equality filter
 * and whose trailing column matches the ORDER BY. This test reads the schema
 * source and asserts that both models carry the required composite indexes.
 *
 * If someone removes or renames an index, this test fails before the defect
 * reaches production — measured in TSK-22 as the difference between a full
 * table scan with filter waste (30,153 round-trips at 15k programmes, 74–107 s
 * boot refresh) and an index-backed plan (1,353 round-trips if batched, 7–9 s
 * refresh with indexes alone).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SCHEMA_PATH = path.join(REPO_ROOT, "prisma/schema.prisma");

function parseModelIndexes(schema: string): Map<string, string[]> {
  const indexes = new Map<string, string[]>();
  for (const block of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
    const model = block[1];
    const body = block[2];
    const found: string[] = [];
    for (const idx of body.matchAll(/@@index\(\[(.*?)\]\)/g)) {
      found.push(idx[1].replace(/\s+/g, ""));
    }
    indexes.set(model, found);
  }
  return indexes;
}

describe("keyset paging schema invariant (TSK-22)", () => {
  it("Programme carries @@index([channelCode, code]) for listProgrammes keyset", () => {
    const schema = readFileSync(SCHEMA_PATH, "utf8");
    const indexes = parseModelIndexes(schema);
    const programmeIndexes = indexes.get("Programme") ?? [];
    expect(
      programmeIndexes.some((idx) => idx === "channelCode,code"),
      `Programme must have @@index([channelCode, code]) for keyset paging; found: ${programmeIndexes.join(", ")}`
    ).toBe(true);
  });

  it("BroadcastEpisode carries @@index([programmeCode, episodeCode]) for listEpisodes keyset", () => {
    const schema = readFileSync(SCHEMA_PATH, "utf8");
    const indexes = parseModelIndexes(schema);
    const episodeIndexes = indexes.get("BroadcastEpisode") ?? [];
    expect(
      episodeIndexes.some((idx) => idx === "programmeCode,episodeCode"),
      `BroadcastEpisode must have @@index([programmeCode, episodeCode]) for keyset paging; found: ${episodeIndexes.join(", ")}`
    ).toBe(true);
  });
});
