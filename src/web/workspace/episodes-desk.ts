/**
 * VMN Programme & Episode Master Linkage Desk (Wave 1 & Wave 2)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45, §48 / SCR-03 Master DAM Linkage
 *
 * Governs programme episode catalogues, deterministic DAM master linkage,
 * and 48-hour schedule day lifecycle locking.
 */

import { escapeHtml } from "../components/escape.js";
import type { ProgrammeRecord, BroadcastEpisodeRecord } from "../../core/database/repositories/schedule.repository.js";
import type { BroadcastScheduleDayEntity } from "../../core/database/repositories/broadcast.repository.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface EpisodesDeskContext {
  programmes: ProgrammeRecord[];
  episodes: BroadcastEpisodeRecord[];
  scheduleDays?: BroadcastScheduleDayEntity[];
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
}

export function renderEpisodesDeskHtml(ctx: EpisodesDeskContext): string {
  const programmes = ctx.programmes || [];
  const episodes = ctx.episodes || [];
  const scheduleDays = ctx.scheduleDays || [];

  const linkedCount = episodes.filter((e) => Boolean(e.mediaAssetId)).length;
  const unlinkedCount = episodes.filter((e) => !e.mediaAssetId).length;

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/broadcast/episodes" class="text-primary font-mono no-underline">Broadcast Library</a> <span>&gt;</span>
        <span aria-current="page" class="text-slate-100 font-semibold">Programme Masters</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          DAM LINKAGE VERIFIED
        </span>
        <span class="font-mono text-xs text-muted">BCST-003</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">BROADCAST CATALOGUE</span>
          <span class="vmn-badge badge-outline text-xs font-mono">EPISODE MASTERS</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="#new-episode-modal" class="btn btn-primary btn-sm text-xs font-bold">+ Register New Episode</a>
          <a href="/broadcast/schedule/review" class="btn btn-outline btn-sm text-xs">Schedule Review &rarr;</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Programme &amp; Episode Master Index</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        Canonical repository linking broadcast schedule slots to registered digital master files in the DAM, enforcing segment timecodes and broadcast certification ratings.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TOTAL PROGRAMMES</span>
          <span class="text-base font-bold block mt-0.5 text-primary">${escapeHtml(programmes.length)} Series</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Across 3 channels</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EPISODES REGISTERED</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">${escapeHtml(episodes.length)} Episodes</span>
          <span class="text-xs text-muted block mt-0.5 font-mono">Catalogue total</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">DAM MASTER LINKED</span>
          <span class="text-base font-bold block mt-0.5 text-success">${escapeHtml(linkedCount)} Verified</span>
          <span class="text-xs text-muted block mt-0.5">Ready for playout</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">UNLINKED / PENDING QC</span>
          <span class="text-base font-bold block mt-0.5 text-warning">${escapeHtml(unlinkedCount)} Missing</span>
          <span class="text-xs text-muted block mt-0.5">Requires master file</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Episodes Registry Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Broadcast Episodes Registry</h2>
          <p class="text-xs text-muted m-0">Canonical BroadcastEpisode records with linked digital video master assets</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">EPISODE CODE</th>
              <th class="p-2.5">EPISODE TITLE</th>
              <th class="p-2.5">SERIES</th>
              <th class="p-2.5">DURATION</th>
              <th class="p-2.5">SEGMENTS</th>
              <th class="p-2.5">RATING</th>
              <th class="p-2.5">DAM MASTER FILE</th>
              <th class="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${
              episodes.length === 0
                ? `<tr><td colspan="8" class="p-4 text-center text-muted">No episodes registered yet. Register your first episode below.</td></tr>`
                : episodes
                    .map((ep) => {
                      const minutes = Math.floor(ep.durationSeconds / 60);
                      const seconds = ep.durationSeconds % 60;
                      return `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-semibold">${escapeHtml(ep.episodeCode)}</td>
                <td class="p-2.5 font-bold text-slate-100">${escapeHtml(ep.title)}</td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(ep.programmeCode)} (Ep ${escapeHtml(ep.episodeNumber)})</td>
                <td class="p-2.5 font-mono">${escapeHtml(minutes)}m ${escapeHtml(seconds)}s</td>
                <td class="p-2.5 font-mono">${escapeHtml(ep.segmentCount || 1)} seg</td>
                <td class="p-2.5">
                  <span class="vmn-badge badge-outline text-xs">${escapeHtml(ep.complianceRating || "PG")}</span>
                </td>
                <td class="p-2.5">
                  ${
                    ep.mediaAssetId
                      ? `<span class="vmn-badge badge-ready font-mono text-xs">${escapeHtml(ep.mediaAssetId)}</span>`
                      : `<span class="vmn-badge badge-warning text-xs">NO MASTER LINKED</span>`
                  }
                </td>
                <td class="p-2.5 text-right">
                  <button type="button" class="btn btn-outline btn-xs" data-toast="Inspecting ${escapeHtml(ep.episodeCode)}..." data-toast-type="info">
                    Inspect
                  </button>
                </td>
              </tr>
            `;
                    })
                    .join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Schedule Day 48h Lock Controller Section -->
    <section class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">48-Hour Schedule Day Lifecycle Controller</h2>
          <p class="text-xs text-muted m-0">Authority: BCST-03 schedule lock invariant — freezes day grid against amendments 48 hours prior to playout</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">LOCK CONTROLLER</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        ${
          scheduleDays.length === 0
            ? `<div class="p-3 text-muted col-span-3">No active schedule days in memory. Lock controls will arm upon schedule generation.</div>`
            : scheduleDays
                .map((day) => `
          <div class="p-3 rounded-lg bg-slate-900 border border-muted/10 flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-100 block">${escapeHtml(day.channelId)} Schedule</span>
              <span class="text-muted block font-mono text-xs">${escapeHtml(day.scheduleDate ? day.scheduleDate.toISOString().split("T")[0] : "Today")}</span>
              <span class="vmn-badge ${day.isLocked ? "badge-ready" : "badge-warning"} text-xs mt-1">
                ${day.isLocked ? "LOCKED (48H FROZEN)" : "UNLOCKED (DRAFT)"}
              </span>
            </div>
            <form method="POST" action="/api/v1/broadcast/schedule/lock">
              <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">
              <input type="hidden" name="scheduleDayId" value="${escapeHtml(day.id)}">
              <button type="submit" class="btn btn-outline btn-xs font-bold" ${day.isLocked ? "disabled" : ""}>
                ${day.isLocked ? "Locked" : "Freeze Grid"}
              </button>
            </form>
          </div>
        `).join("")
        }
      </div>
    </section>

    <!-- Register New Episode Form -->
    <section id="new-episode-modal" class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Register New Broadcast Episode</h2>
          <p class="text-xs text-muted m-0">Link an episode to a parent programme and registered DAM master asset ID</p>
        </div>
        <span class="vmn-badge badge-info text-xs font-mono">NEW EPISODE</span>
      </div>

      <form method="POST" action="/api/v1/broadcast/episodes" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="programmeCode">Parent Programme Code *</label>
          <input type="text" id="programmeCode" name="programmeCode" required placeholder="e.g. PRG-NXTR-001 or LAGOS_RUSH" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="episodeCode">Episode Code *</label>
          <input type="text" id="episodeCode" name="episodeCode" required placeholder="e.g. LR-S02E05" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="title">Episode Title *</label>
          <input type="text" id="title" name="title" required placeholder="e.g. The Grand Reunion" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="episodeNumber">Episode Number *</label>
          <input type="number" id="episodeNumber" name="episodeNumber" required min="1" value="1" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="durationSeconds">Duration (Seconds) *</label>
          <input type="number" id="durationSeconds" name="durationSeconds" required min="30" step="1" value="1800" placeholder="e.g. 1800 for 30 minutes" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="mediaAssetId">DAM Master Asset Reference</label>
          <input type="text" id="mediaAssetId" name="mediaAssetId" placeholder="e.g. dam_ast_8820 or leave blank if pending QC" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="complianceRating">Broadcast Compliance Rating *</label>
          <select id="complianceRating" name="complianceRating" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="G">G - General Audience</option>
            <option value="PG" selected>PG - Parental Guidance</option>
            <option value="15">15 - Suitable for 15+</option>
            <option value="18">18 - Adults Only (Post-Watershed 22:00-05:00)</option>
          </select>
        </div>

        <div class="flex items-end justify-end gap-2 pt-2">
          <button type="reset" class="btn btn-ghost btn-sm text-xs">Reset</button>
          <button type="submit" class="btn btn-primary btn-sm text-xs font-bold">+ Register Episode</button>
        </div>
      </form>
    </section>
  </article>
  `;
}
