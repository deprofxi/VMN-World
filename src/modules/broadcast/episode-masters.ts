/**
 * Episode ↔ DAM Master Linkage — SCR-03 follow-on (broadcast views)
 * Authority: UIUX-001 §7.3 evidence-attachment contract; one rights truth.
 *
 * The canonical chain is:
 *   BroadcastChannel ← Programme.channelCode ← BroadcastEpisode.programmeCode
 *   → BroadcastEpisode.mediaAssetId → DAM registry (MediaAssetRecord)
 *
 * This module projects that chain into rows the EPG and channel schedule
 * surfaces render, and keeps an in-memory index refreshed at boot so the
 * synchronous web renderers never touch the database per request.
 *
 * Honesty contract:
 * - State is derived at READ time against the live DAM registry, so rows can
 *   never claim AVAILABLE for an asset that has since been quarantined,
 *   failed or de-registered.
 * - An episode with a persisted id that does not resolve in the registry is
 *   UNREGISTERED (never presented as a real master); an episode with no
 *   persisted id is NO_REFERENCE.
 * - resolveEpisodeMasterAssetId() returns an id ONLY when it resolves in the
 *   registry — the EPG feed therefore never syndicates a reference to an
 *   asset that is not registered (e.g. CLI/scheduler processes that never
 *   loaded the registry simply emit no episode-num).
 */

import { getMediaAsset } from "../../core/storage/index.js";
import { ScheduleRepository } from "../../core/database/repositories/schedule.repository.js";
import { getAllActiveChannels } from "./channels/index.js";

export type EpisodeMasterState = "AVAILABLE" | "QUARANTINED" | "FAILED" | "UNREGISTERED" | "NO_REFERENCE";

/**
 * A stored (indexed) row: persisted truth only — NO state. State is derived
 * at read time against the live DAM registry (deriveEpisodeMasterState), so
 * the index can never cache a stale access state.
 */
export type EpisodeMasterStoredRow = Omit<EpisodeMasterRow, "state" | "assetTitle">;

export interface EpisodeMasterRow {
  channelCode: string;
  programmeCode: string;
  programmeTitle: string;
  episodeCode: string;
  episodeNumber: number;
  episodeTitle: string;
  durationSeconds: number;
  /** Persisted truth on BroadcastEpisode (may be absent). */
  mediaAssetId?: string;
  /** Registry title, present only when the id resolves in the DAM. */
  assetTitle?: string;
  /** Derived at read time from the live DAM registry — never cached. */
  state: EpisodeMasterState;
}

export interface EpisodeMasterSourceProgramme {
  code: string;
  title: string;
  channelCode: string;
}

export interface EpisodeMasterSourceEpisode {
  programmeCode: string;
  episodeCode: string;
  episodeNumber: number;
  title: string;
  durationSeconds: number;
  mediaAssetId?: string;
}

/**
 * Pure join: attaches episodes to their programme and channel. Episodes whose
 * programme does not belong to the requested channel are never cross-listed.
 */
export function projectEpisodeMasters(params: {
  channelCode: string;
  programmes: EpisodeMasterSourceProgramme[];
  episodes: EpisodeMasterSourceEpisode[];
}): EpisodeMasterStoredRow[] {
  const channel = params.channelCode.toUpperCase();
  const programmesByCode = new Map(
    params.programmes.filter((p) => p.channelCode.toUpperCase() === channel).map((p) => [p.code, p])
  );

  const rows: EpisodeMasterStoredRow[] = [];
  for (const episode of params.episodes) {
    const programme = programmesByCode.get(episode.programmeCode);
    if (!programme) continue;
    rows.push({
      channelCode: channel,
      programmeCode: programme.code,
      programmeTitle: programme.title,
      episodeCode: episode.episodeCode,
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.title,
      durationSeconds: episode.durationSeconds,
      mediaAssetId: episode.mediaAssetId,
    });
  }

  rows.sort(
    (a, b) => a.programmeTitle.localeCompare(b.programmeTitle) || a.episodeNumber - b.episodeNumber
  );
  return rows;
}

/** Derives the live registry-backed state for a stored row (read-time, never cached). */
export function deriveEpisodeMasterState(row: EpisodeMasterStoredRow): EpisodeMasterRow {
  if (!row.mediaAssetId) {
    return { ...row, state: "NO_REFERENCE" };
  }
  const asset = getMediaAsset(row.mediaAssetId);
  if (!asset) {
    return { ...row, state: "UNREGISTERED" };
  }
  return { ...row, assetTitle: asset.title, state: asset.accessState };
}

const defaultRepository = new ScheduleRepository();

let storedRows: EpisodeMasterStoredRow[] = [];
let rowsByChannel = new Map<string, EpisodeMasterStoredRow[]>();
let mediaAssetByEpisodeCode = new Map<string, string>();

function reindex(): void {
  rowsByChannel = new Map();
  mediaAssetByEpisodeCode = new Map();
  for (const row of storedRows) {
    const list = rowsByChannel.get(row.channelCode);
    if (list) list.push(row);
    else rowsByChannel.set(row.channelCode, [row]);
    if (row.mediaAssetId) mediaAssetByEpisodeCode.set(row.episodeCode, row.mediaAssetId);
  }
}

/**
 * AUD-15: runs `fn` over `items` with bounded concurrency, preserving input
 * order in the results. Caps concurrent DB round-trips so a burst of pages
 * cannot exhaust the pool, while removing the strict-sequential wall clock.
 */
const MAX_CONCURRENT_DB_PAGES = 8;

async function mapWithBoundedConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Rebuilds the in-memory index from the canonical repository (DB when
 * connected, the repository's memory fallback otherwise). Called once at
 * server boot after the golden DAM assets are registered; tests may call it
 * with an injected repository fixture.
 */
export async function refreshEpisodeMasterIndex(
  options: { repository?: ScheduleRepository } = {}
): Promise<{ channels: number; programmes: number; episodes: number }> {
  const repository = options.repository ?? defaultRepository;
  let programmeCount = 0;
  let episodeCount = 0;

  // AUD-15: channels and per-programme episode listings run with bounded
  // concurrency instead of strict-sequential round-trips. Cursor paging within
  // a single list stays sequential (cursors are ordered); per-list results are
  // re-joined in input order so projection and counts are deterministic.
  const channels = getAllActiveChannels();
  const perChannelRows = await mapWithBoundedConcurrency(channels, MAX_CONCURRENT_DB_PAGES, async (channel) => {
    const programmes: Awaited<ReturnType<typeof repository.listProgrammes>>["rows"] = [];
    let programmeCursor: string | undefined;
    do {
      const page = await repository.listProgrammes(channel.code, { after: programmeCursor });
      programmes.push(...page.rows);
      programmeCursor = page.nextCursor;
    } while (programmeCursor);

    const episodeLists = await mapWithBoundedConcurrency(programmes, MAX_CONCURRENT_DB_PAGES, async (programme) => {
      const episodes: EpisodeMasterSourceEpisode[] = [];
      let episodeCursor: string | undefined;
      do {
        const page = await repository.listEpisodes(programme.code, { after: episodeCursor });
        episodes.push(...page.rows);
        episodeCursor = page.nextCursor;
      } while (episodeCursor);
      return episodes;
    });
    const episodes = episodeLists.flat();

    programmeCount += programmes.length;
    episodeCount += episodes.length;
    return projectEpisodeMasters({ channelCode: channel.code, programmes, episodes });
  });

  storedRows = perChannelRows.flat();
  reindex();
  return { channels: channels.length, programmes: programmeCount, episodes: episodeCount };
}

/** Sync read for web renderers. Omit channelCode for all channels (EPG inspector). */
export function listEpisodeMasters(channelCode?: string): EpisodeMasterRow[] {
  const rows = channelCode ? rowsByChannel.get(channelCode.toUpperCase()) ?? [] : storedRows;
  return rows.map(deriveEpisodeMasterState);
}

/**
 * Single-row lookup for schedule presentation: the indexed master for a
 * channel + episode pair, with state derived live at read time. Returns
 * undefined when the episode is not indexed, so callers can render an honest
 * "not indexed" state instead of inventing a reference.
 */
export function findEpisodeMaster(channelCode: string, episodeCode: string): EpisodeMasterRow | undefined {
  const rows = rowsByChannel.get(channelCode.toUpperCase());
  const row = rows?.find((r) => r.episodeCode === episodeCode);
  return row ? deriveEpisodeMasterState(row) : undefined;
}

/**
 * The registered DAM master id for an episode code, or null. Returns an id
 * ONLY when it resolves in the live DAM registry (see module honesty
 * contract) — this is the resolver the XMLTV generator uses.
 */
export function resolveEpisodeMasterAssetId(episodeCode: string): string | null {
  const mediaAssetId = mediaAssetByEpisodeCode.get(episodeCode);
  if (!mediaAssetId) return null;
  return getMediaAsset(mediaAssetId) ? mediaAssetId : null;
}

export function _resetEpisodeMasterIndexForTesting(): void {
  storedRows = [];
  rowsByChannel = new Map();
  mediaAssetByEpisodeCode = new Map();
}
