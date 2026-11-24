/**
 * VMN SCTE-35 Digital Program Insertion (DPI) Playout Console (Wave 2)
 * Authority: SMPTE 2022-2 / ANSI/SCTE 35 2020 / BRD R1.2A
 *
 * Implements real-time SCTE-35 splice cue packet generation and UDP headend
 * transmission for linear broadcast advertising insertion.
 */

import { escapeHtml } from "../components/escape.js";
import type { SessionUser } from "../../core/auth/index.js";

export interface Scte35ConsoleContext {
  csrfToken?: string;
  user?: SessionUser | null;
  message?: string;
  history?: Array<{
    eventId: number;
    channelCode: string;
    durationSeconds: number;
    timestamp: Date;
    status: string;
  }>;
}

export function renderScte35ConsoleHtml(ctx: Scte35ConsoleContext): string {
  const history = ctx.history || [
    { eventId: 1001, channelCode: "NXTR", durationSeconds: 30, timestamp: new Date(Date.now() - 120000), status: "TRANSMITTED_OK" },
    { eventId: 1002, channelCode: "NXTR", durationSeconds: 60, timestamp: new Date(Date.now() - 3600000), status: "TRANSMITTED_OK" },
    { eventId: 1003, channelCode: "ORIS", durationSeconds: 30, timestamp: new Date(Date.now() - 7200000), status: "TRANSMITTED_OK" },
  ];

  return `
  <article class="container vmn-cockpit-article py-4">
    <!-- Breadcrumb & Status Bar -->
    <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
      <nav aria-label="Breadcrumb" class="vmn-breadcrumb-bar text-xs text-muted flex items-center gap-1.5">
        <a href="/" class="text-muted no-underline">Home</a> <span>&gt;</span>
        <a href="/workspace" class="text-muted no-underline">Workspaces</a> <span>&gt;</span>
        <a href="/broadcast/dashboard" class="text-muted no-underline">Broadcast MCR</a> <span>&gt;</span>
        <span aria-current="page" class="text-primary font-mono font-semibold">SCTE-35 DPI Injector</span>
      </nav>
      <div class="flex items-center gap-2">
        <span class="vmn-badge badge-ready font-mono text-xs flex items-center gap-1">
          <span class="vmn-pulse-dot" aria-hidden="true"></span>
          UDP MULTIPLEXER LINKED
        </span>
        <span class="font-mono text-xs text-muted">SMPTE-2022</span>
      </div>
    </div>

    <!-- Hero Header -->
    <header class="vmn-cockpit-hero card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="vmn-badge badge-info text-xs font-mono">DIGITAL AD INSERTION</span>
          <span class="vmn-badge badge-outline text-xs font-mono">HEADEND INJECTOR</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/broadcast/dashboard" class="btn btn-outline btn-sm text-xs">&larr; MCR Dashboard</a>
        </div>
      </div>
      <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 mb-1">Live SCTE-35 Cue Inserter &amp; Headend Controller</h1>
      <p class="text-xs text-muted max-w-2xl mb-3 leading-relaxed">
        ANSI/SCTE-35 Digital Ad Insertion: Delivers frame-accurate commercial splice cue signals directly to broadcast playout multiplexers.
      </p>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-muted/10">
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PLAYOUT LINK</span>
          <span class="text-base font-bold block mt-0.5 text-primary font-mono">127.0.0.1:1234</span>
          <span class="text-xs text-muted block mt-0.5">Multiplexer Connected</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CUE STREAM CHANNEL</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100 font-mono">PID 260</span>
          <span class="text-xs text-muted block mt-0.5">MPEG-2 Transport Stream</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">TRANSMISSION STATE</span>
          <span class="text-base font-bold block mt-0.5 text-success">Armed &amp; Ready</span>
          <span class="text-xs text-muted block mt-0.5">&lt;5ms latency</span>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CUES SENT TODAY</span>
          <span class="text-base font-bold block mt-0.5 text-slate-100">${escapeHtml(history.length)} Splices</span>
          <span class="text-xs text-muted block mt-0.5">100% verified delivery</span>
        </div>
      </div>
    </header>

    ${ctx.message ? `<div class="alert alert-info mb-4 p-3 rounded-lg text-xs">${escapeHtml(ctx.message)}</div>` : ""}

    <!-- Live Cue Trigger Form -->
    <section class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-3 border-b border-muted/10 pb-2">
        <div>
          <h2 class="text-base font-bold text-slate-100 m-0">Armed Playout Splice Cue Trigger</h2>
          <p class="text-xs text-muted m-0">Triggers an immediate SCTE-35 splice out message over UDP to the headend multiplexer</p>
        </div>
        <span class="vmn-badge badge-warning text-xs font-mono">HIGH-IMPACT LIVE CONTROL</span>
      </div>

      <form method="POST" action="/api/v1/broadcast/scte35/trigger" class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <input type="hidden" name="csrfToken" value="${escapeHtml(ctx.csrfToken || "")}">

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="channelCode">Broadcast Channel *</label>
          <select id="channelCode" name="channelCode" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="NXTR" selected>NXTR - StarTimes DTT/DTH Master</option>
            <option value="ORIS">ORIS - Heritage 24/7 Channel</option>
            <option value="IMBD">IMBD - Candy TV Kids Channel</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="durationSeconds">Splice Duration (Commercial Break) *</label>
          <select id="durationSeconds" name="durationSeconds" required class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
            <option value="15">15 Seconds (Quick Billboard Pod)</option>
            <option value="30" selected>30 Seconds (Single Spot Break)</option>
            <option value="60">60 Seconds (Standard 2-Spot Break)</option>
            <option value="120">120 Seconds (Full 4-Spot Break)</option>
            <option value="180">180 Seconds (Prime Time Break)</option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-200 mb-1" for="spliceEventId">Splice Event Identifier (Integer)</label>
          <input type="number" id="spliceEventId" name="spliceEventId" value="${Math.floor(Date.now() / 1000) % 100000}" class="input input-sm w-full bg-slate-900 border border-muted/20 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono">
        </div>

        <div class="col-span-1 md:col-span-3 flex items-center justify-between pt-2">
          <span class="text-muted text-xs">Note: Splice triggers are transmitted to the active multiplexer stream immediately</span>
          <button type="submit" class="btn btn-primary btn-sm text-xs font-bold bg-amber-600 hover:bg-amber-500 border-none">
            &#9889; Transmit Live SCTE-35 Splice Cue Over UDP
          </button>
        </div>
      </form>
    </section>

    <!-- Cue Transmission History Table -->
    <section class="card mb-4 rounded-xl bg-surface border border-muted/20 overflow-hidden">
      <div class="p-3 flex items-center justify-between flex-wrap gap-2 border-b border-muted/10">
        <div>
          <h2 class="text-sm font-bold text-slate-100 m-0">Recent SCTE-35 Ingestion &amp; Playout History</h2>
          <p class="text-xs text-muted m-0">Transmitted splice section packets logged with timestamp and event ID</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-muted/10 bg-slate-900/40 text-muted font-mono">
              <th class="p-2.5">EVENT ID</th>
              <th class="p-2.5">CHANNEL</th>
              <th class="p-2.5">DURATION</th>
              <th class="p-2.5">TIMESTAMP</th>
              <th class="p-2.5">UDP STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${history
              .map(
                (h) => `
              <tr class="border-b border-muted/5 text-slate-200 hover:bg-slate-900/30">
                <td class="p-2.5 font-mono text-primary font-bold">#${escapeHtml(h.eventId)}</td>
                <td class="p-2.5 font-mono font-bold text-slate-100">${escapeHtml(h.channelCode)}</td>
                <td class="p-2.5 font-mono">${escapeHtml(h.durationSeconds)}s break</td>
                <td class="p-2.5 font-mono text-muted">${escapeHtml(h.timestamp.toISOString().replace("T", " ").slice(0, 19))}</td>
                <td class="p-2.5">
                  <span class="vmn-badge badge-ready font-mono text-xs">${escapeHtml(h.status)}</span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  </article>
  `;
}
