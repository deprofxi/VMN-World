/**
 * Surface B & C — Broadcast Linear Operations Cockpits (Desks 15–24)
 * Authority: VMNL-AZP-VMN-CCPP-001 (§13–§19) / PRD §15
 */

import { renderIcon } from "../components/icons.js";

// ----------------------------------------------------------------------------
// 15. EPG PROGRAMMING & SCHEDULE COCKPIT
// ----------------------------------------------------------------------------
export function renderEpgCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">LINEAR SCHEDULE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">EPG Programming, Dayparting &amp; Schedule Manager</h2>
        </div>
        <div class="flex items-center gap-2">
          <form method="POST" action="/api/v1/broadcast/schedule/lock" class="inline">
            <button type="submit" class="btn btn-primary btn-sm text-xs font-bold" data-confirm="Confirm 48-hour schedule lock? No non-emergency amendments permitted once locked." data-toast="48-hour schedule day grid frozen and locked" data-toast-type="success">
              ${renderIcon("lock", { size: 14 })}
              <span>Lock 48h Grid</span>
            </button>
          </form>
          <a href="/broadcast/episodes" class="btn btn-outline btn-sm text-xs font-bold">Manage Episode Masters &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SCHEDULE STATE</span>
          <span class="text-lg font-bold block mt-1 text-success">48H FROZEN</span>
          <span class="text-xs text-muted block mt-0.5">T-48 Lock Active</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SLOTS PROGRAMMED</span>
          <span class="text-lg font-bold block mt-1 text-primary">144 Slots / 24h</span>
          <span class="text-xs text-muted block mt-0.5">NXTR / ORIS / IMBD</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RIGHTS BLOCKED</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">0 Overlaps</span>
          <span class="text-xs text-success block mt-0.5">100% Cleared</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">XMLTV SYNDICATION</span>
          <span class="text-lg font-bold block mt-1 text-success">StarTimes Synced</span>
          <span class="text-xs text-muted block mt-0.5">EPG Ingested</span>
        </div>
      </div>

      <!-- Linear Daypart Schedule Grid -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-200">24-Hour Broadcast Daypart Grid</span>
            <span class="vmn-badge badge-outline text-xs">Date: Today</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-muted">Channels:</span>
            <span class="vmn-badge badge-primary text-xs">NXTR Ch 101</span>
            <span class="vmn-badge badge-outline text-xs">ORIS Ch 102</span>
            <span class="vmn-badge badge-outline text-xs">IMBD Ch 103</span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Time Slot</th>
                <th class="py-2">Channel</th>
                <th class="py-2">Programme Title</th>
                <th class="py-2">Episode Ref</th>
                <th class="py-2">Rights Status</th>
                <th class="py-2">Master DAM Asset</th>
                <th class="py-2 text-right">Lock State</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">06:00 - 08:30</td>
                <td><span class="vmn-badge badge-primary text-xs">NXTR</span></td>
                <td class="font-bold text-slate-100">Good Morning Nigeria Live</td>
                <td class="font-mono text-muted">LIVE-FEED-01</td>
                <td><span class="vmn-badge badge-success text-xs">Cleared</span></td>
                <td class="font-mono text-xs text-muted">LIVE-SDI-01</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Locked</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">08:30 - 10:00</td>
                <td><span class="vmn-badge badge-primary text-xs">NXTR</span></td>
                <td class="font-bold text-slate-100">Nigezie Top 10 Countdown</td>
                <td class="font-mono text-muted">EP-NXTR-088</td>
                <td><span class="vmn-badge badge-success text-xs">Cleared</span></td>
                <td class="font-mono text-xs text-muted">dam_ast_882</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Locked</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">10:00 - 12:00</td>
                <td><span class="vmn-badge badge-primary text-xs">NXTR</span></td>
                <td class="font-bold text-slate-100">Lagos Rush Season 2</td>
                <td class="font-mono text-muted">EP-NXTR-004</td>
                <td><span class="vmn-badge badge-success text-xs">Cleared</span></td>
                <td class="font-mono text-xs text-muted">dam_ast_1701</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Locked</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">14:00 - 16:30</td>
                <td><span class="vmn-badge badge-primary text-xs">NXTR</span></td>
                <td class="font-bold text-slate-100">Afrobeats Mega Concert Special</td>
                <td class="font-mono text-muted">EP-NXTR-012</td>
                <td><span class="vmn-badge badge-success text-xs">Cleared</span></td>
                <td class="font-mono text-xs text-muted">dam_ast_1702</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Locked</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-slate-300">20:00 - 22:30</td>
                <td><span class="vmn-badge badge-primary text-xs">NXTR</span></td>
                <td class="font-bold text-slate-100">OneStudios Prime Cinema Feature</td>
                <td class="font-mono text-muted">MOV-NXTR-102</td>
                <td><span class="vmn-badge badge-success text-xs">Cleared</span></td>
                <td class="font-mono text-xs text-muted">dam_ast_1704</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">Locked</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 16. AS-RUN INGESTION & PROOF-OF-AIR COCKPIT
// ----------------------------------------------------------------------------
export function renderAsrunCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">PROOF-OF-AIR</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">As-Run Log Ingestion &amp; Make-Good Settlement</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/broadcast/asrun/reconcile" class="btn btn-outline btn-sm text-xs font-bold">Open Reconciler Wizard &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LOGS MATCHED</span>
          <span class="text-lg font-bold block mt-1 text-success">99.4% Match</span>
          <span class="text-xs text-muted block mt-0.5">Playout vs Playlist</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SHORT-AIR PREEMPTIONS</span>
          <span class="text-lg font-bold block mt-1 text-primary">1 Spot Preempted</span>
          <span class="text-xs text-muted block mt-0.5">Breaking News Cut</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MAKE-GOOD VALUE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">₦450,000 Credit</span>
          <span class="text-xs text-muted block mt-0.5">Voucher Issued</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">POA CERTIFICATES</span>
          <span class="text-lg font-bold block mt-1 text-success">42 Issued</span>
          <span class="text-xs text-muted block mt-0.5">Cryptographic Signature</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 17. SATELLITE UPLINK & CARRIER COCKPIT
// ----------------------------------------------------------------------------
export function renderUplinkCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-live font-mono text-xs">UPLINK CARRIER</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">StarTimes DTT/DTH Satellite Uplink Telemetry</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">RF SIGNAL (RX)</span>
          <span class="text-lg font-bold block mt-1 text-success">-48.5 dBm</span>
          <span class="text-xs text-success block mt-0.5">Target: -45 to -55 dBm</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CARRIER-TO-NOISE (C/N)</span>
          <span class="text-lg font-bold block mt-1 text-primary">14.6 dB</span>
          <span class="text-xs text-muted block mt-0.5">Margin: +4.2 dB</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">Carrier Signal Quality (Bit Error Rate)</span>
          <span class="text-lg font-bold block mt-1 text-success">&lt; 1.0e-9</span>
          <span class="text-xs text-success block mt-0.5">Quasi Error-Free</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CARRIER LOCK</span>
          <span class="text-lg font-bold block mt-1 text-success">LOCKED</span>
          <span class="text-xs text-muted block mt-0.5">DVB-T2 / 586 MHz</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 18. MEDIA INGEST & QC COCKPIT
// ----------------------------------------------------------------------------
export function renderIngestCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">MEDIA INGEST</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Broadcast Media Ingest, Transcode &amp; QC Slating</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/workspace/content/media-picker" class="btn btn-primary btn-sm text-xs font-bold">
            ${renderIcon("folder", { size: 14 })}
            <span>DAM Media Vault &rarr;</span>
          </a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">QC PASS RATE</span>
          <span class="text-lg font-bold block mt-1 text-success">98.5%</span>
          <span class="text-xs text-muted block mt-0.5">Auto &amp; Manual Checks</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">EBU R128 LOUDNESS</span>
          <span class="text-lg font-bold block mt-1 text-primary">-23.0 LUFS</span>
          <span class="text-xs text-muted block mt-0.5">±0.5 LU Target</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">COLOR GAMUT</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">ITU-R BT.709</span>
          <span class="text-xs text-muted block mt-0.5">Broadcast Safe</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PENDING TRANSCODE</span>
          <span class="text-lg font-bold block mt-1 text-primary">2 Assets</span>
          <span class="text-xs text-muted block mt-0.5">XDCAM HD422 50Mbps</span>
        </div>
      </div>

      <!-- Ingest Register & Slating Table -->
      <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10 mb-4">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span class="text-xs font-bold text-slate-200">Broadcast Master Media Register (DAM Ingest)</span>
          <span class="vmn-badge badge-outline text-xs">MinIO S3 Secured</span>
        </div>
        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-muted/20 text-left text-muted">
                <th class="py-2">Asset Code</th>
                <th class="py-2">File Name</th>
                <th class="py-2">Format / Codec</th>
                <th class="py-2">Resolution</th>
                <th class="py-2">QC Audio</th>
                <th class="py-2">Provenance</th>
                <th class="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">dam_ast_1701</td>
                <td class="font-bold text-slate-100">lagos_rush_s02e04.mov</td>
                <td class="font-mono text-muted">ProRes 422 HQ</td>
                <td>1080i50 HD</td>
                <td><span class="vmn-badge badge-success text-xs">-23.1 LUFS</span></td>
                <td class="text-muted">OneStudios Master</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">QC PASS</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">dam_ast_1702</td>
                <td class="font-bold text-slate-100">afrobeats_fest_art.png</td>
                <td class="font-mono text-muted">PNG (RGBA)</td>
                <td>3840x2160 4K</td>
                <td><span class="text-muted">N/A (Visual)</span></td>
                <td class="text-muted">VCF Format Lab</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">QC PASS</span></td>
              </tr>
              <tr class="border-b border-muted/10 hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">dam_ast_1704</td>
                <td class="font-bold text-slate-100">sugar_candy_ep01.mp4</td>
                <td class="font-mono text-muted">H.264 / AAC</td>
                <td>1080p25 HD</td>
                <td><span class="vmn-badge badge-success text-xs">-23.4 LUFS</span></td>
                <td class="text-muted">Candy TV Prodn</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">QC PASS</span></td>
              </tr>
              <tr class="hover:bg-slate-900/40">
                <td class="py-2.5 font-mono text-primary">dam_ast_1719</td>
                <td class="font-bold text-slate-100">advert_telecom_30s.mov</td>
                <td class="font-mono text-muted">ProRes 422 HQ</td>
                <td>1080i50 HD</td>
                <td><span class="vmn-badge badge-success text-xs">-22.9 LUFS</span></td>
                <td class="text-muted">Agency Master</td>
                <td class="text-right"><span class="vmn-badge badge-ready text-xs">QC PASS</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Media Register Form -->
      <div class="card p-3 rounded-lg bg-slate-900/40 border border-muted/10 text-xs">
        <h3 class="font-bold text-slate-200 mb-2">Ingest New Broadcast Master Asset</h3>
        <form method="POST" action="/api/v1/cms/media-assets" class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-muted mb-1 font-semibold">Asset Title</label>
            <input type="text" name="title" required placeholder="e.g. Lagos Rush S02E05 Master" class="w-full p-2 rounded bg-slate-950 border border-muted/30 text-slate-100 text-xs" />
          </div>
          <div>
            <label class="block text-muted mb-1 font-semibold">Asset Storage Key</label>
            <input type="text" name="assetKey" required placeholder="masters/2026/ep05.mov" class="w-full p-2 rounded bg-slate-950 border border-muted/30 text-slate-100 text-xs font-mono" />
          </div>
          <div>
            <label class="block text-muted mb-1 font-semibold">MIME Format</label>
            <select name="mimeType" class="w-full p-2 rounded bg-slate-950 border border-muted/30 text-slate-100 text-xs">
              <option value="video/quicktime">video/quicktime (Apple ProRes)</option>
              <option value="video/mp4">video/mp4 (H.264 / AVC)</option>
              <option value="audio/vnd.wave">audio/vnd.wave (24-bit PCM)</option>
              <option value="image/png">image/png (Master Artwork)</option>
            </select>
          </div>
          <div class="flex items-end">
            <input type="hidden" name="sizeBytes" value="4500000000" />
            <input type="hidden" name="checksumSha256" value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />
            <input type="hidden" name="provenance" value="ONE_STUDIOS_MASTER" />
            <input type="hidden" name="virusScanPassed" value="true" />
            <button type="submit" class="btn btn-primary w-full text-xs font-bold" data-toast="Broadcast asset registered in DAM vault" data-toast-type="success">
              ${renderIcon("check", { size: 14 })}
              <span>Register Ingest Master</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 19. GRAPHICS & BRANDING COCKPIT
// ----------------------------------------------------------------------------
export function renderGraphicsCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">ON-AIR GRAPHICS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Broadcast Channel Branding &amp; Lower-Third Graphics</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">CHANNEL BUGS</span>
          <span class="text-lg font-bold block mt-1 text-success">Active On-Air</span>
          <span class="text-xs text-muted block mt-0.5">NXTR / ORIS / IMBD</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">NEWS TICKER CRAWL</span>
          <span class="text-lg font-bold block mt-1 text-primary">Live Rolling</span>
          <span class="text-xs text-muted block mt-0.5">Headline Ingest OK</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">SPONSOR L-BARS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">Armed</span>
          <span class="text-xs text-muted block mt-0.5">Triggered via SCTE-35</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PLAYOUT OVERLAY</span>
          <span class="text-lg font-bold block mt-1 text-success">Key &amp; Fill Synced</span>
          <span class="text-xs text-muted block mt-0.5">0 Frame Latency</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 20. SCTE-35 DPI CUE INSERTER COCKPIT
// ----------------------------------------------------------------------------
export function renderScteCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-live font-mono text-xs">DYNAMIC INSERTION</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">SCTE-35 Digital Ad Insertion &amp; Dynamic Cue Desk</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/broadcast/scte35" class="btn btn-primary btn-sm text-xs font-bold">Open Full Playout Console &rarr;</a>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">UDP TARGET</span>
          <span class="text-lg font-bold block mt-1 text-primary">127.0.0.1:1234</span>
          <span class="text-xs text-muted block mt-0.5">Headend MCO</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">Ad Insertion Stream ID (SCTE-35 PID)</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">PID 0x0104</span>
          <span class="text-xs text-muted block mt-0.5">MPEG-2 Transport</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LAST SPLICE EVENT</span>
          <span class="text-lg font-bold block mt-1 text-success">SPLICE-1001</span>
          <span class="text-xs text-muted block mt-0.5">30s Break Triggered</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">Ad Insertion Uptime (DPI)</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Executed</span>
          <span class="text-xs text-muted block mt-0.5">Zero Missed Cues</span>
        </div>
      </div>

      <!-- Quick Cue Trigger & Headend Simulator -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
          <h3 class="font-bold text-xs text-slate-200 mb-2">Manual Commercial Splice Cue Trigger <span class="sr-only">(SMPTE 2022-2)</span></h3>
          <form method="POST" action="/api/v1/broadcast/scte35/trigger" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-muted mb-1 font-semibold">Channel</label>
                <select name="channelCode" class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs">
                  <option value="NXTR">NXTR (Channel 101)</option>
                  <option value="ORIS">ORIS (Channel 102)</option>
                  <option value="IMBD">IMBD (Channel 103)</option>
                </select>
              </div>
              <div>
                <label class="block text-muted mb-1 font-semibold">Break Duration</label>
                <select name="durationSeconds" class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs">
                  <option value="15">15 Seconds (Station Sting)</option>
                  <option value="30" selected>30 Seconds (Single Spot)</option>
                  <option value="60">60 Seconds (Standard Pod)</option>
                  <option value="120">120 Seconds (Extended Break)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-muted mb-1 font-semibold">Splice Event ID</label>
              <input type="number" name="spliceEventId" value="1004" required class="w-full p-2 rounded bg-slate-900 border border-muted/30 text-slate-100 text-xs font-mono" />
            </div>
            <button type="submit" class="btn btn-primary w-full text-xs font-bold" data-confirm="Confirm immediate SCTE-35 splice insertion? Playout multiplexer will switch to commercial insert." data-toast="SCTE-35 splice cue dispatched to UDP headend multiplexer" data-toast-type="success">
              ${renderIcon("send", { size: 14 })}
              <span>Inject SCTE-35 Splice Out</span>
            </button>
          </form>
        </div>

        <div class="card p-3 rounded-lg bg-slate-950/60 border border-muted/10">
          <h3 class="font-bold text-xs text-slate-200 mb-2">Recent Commercial Splice Transmissions</h3>
          <div class="table-responsive">
            <table class="table w-full text-xs">
              <thead>
                <tr class="border-b border-muted/20 text-left text-muted">
                  <th class="py-1">Event</th>
                  <th class="py-1">Ch</th>
                  <th class="py-1">Duration</th>
                  <th class="py-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-mono text-primary">#1001</td>
                  <td>NXTR</td>
                  <td>30s</td>
                  <td class="text-right"><span class="vmn-badge badge-success text-xs">TRANSMITTED</span></td>
                </tr>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-mono text-primary">#1002</td>
                  <td>NXTR</td>
                  <td>60s</td>
                  <td class="text-right"><span class="vmn-badge badge-success text-xs">TRANSMITTED</span></td>
                </tr>
                <tr class="border-b border-muted/10">
                  <td class="py-1.5 font-mono text-primary">#1003</td>
                  <td>ORIS</td>
                  <td>30s</td>
                  <td class="text-right"><span class="vmn-badge badge-success text-xs">TRANSMITTED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-muted text-xs mt-2 flex items-center justify-between">
            <span>Encapsulation: <strong>MPEG-2 TS 188B</strong></span>
            <span>Latency: <strong>&lt; 4ms</strong></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 21. DISASTER RECOVERY & AUTOMATION FAILOVER COCKPIT
// ----------------------------------------------------------------------------
export function renderDisasterCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">DISASTER RECOVERY</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Disaster Recovery &amp; Playout Automation Failover</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PLAYOUT SERVERS</span>
          <span class="text-lg font-bold block mt-1 text-success">A / B Dual Hot</span>
          <span class="text-xs text-muted block mt-0.5">Synchronous Heartbeat</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">AUTO CUTOVER</span>
          <span class="text-lg font-bold block mt-1 text-primary">Armed (&lt; 200ms)</span>
          <span class="text-xs text-muted block mt-0.5">Black Frame / Silence Detect</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">BACKUP POWER</span>
          <span class="text-lg font-bold block mt-1 text-success">100% Online</span>
          <span class="text-xs text-muted block mt-0.5">Dual 250kVA Cat Gensets</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">OFF-AIR SLATE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">Standby (Loaded)</span>
          <span class="text-xs text-muted block mt-0.5">Emergency Test Card</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 22. AUDIO LOUDNESS & EBU R128 COCKPIT
// ----------------------------------------------------------------------------
export function renderAudioCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">AUDIO COMPLIANCE</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Audio Loudness &amp; EBU R128 Compliance Console</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">INTEGRATED LOUDNESS</span>
          <span class="text-lg font-bold block mt-1 text-success">-23.1 LUFS</span>
          <span class="text-xs text-muted block mt-0.5">Complies with EBU R128</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">MAX TRUE PEAK</span>
          <span class="text-lg font-bold block mt-1 text-primary">-1.2 dBTP</span>
          <span class="text-xs text-muted block mt-0.5">Limit: -1.0 dBTP</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LOUDNESS RANGE (LRA)</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">8.4 LU</span>
          <span class="text-xs text-muted block mt-0.5">Dynamic Range Nominal</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PHASE CORRELATION</span>
          <span class="text-lg font-bold block mt-1 text-success">+0.88</span>
          <span class="text-xs text-muted block mt-0.5">Solid Mono Compatibility</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 23. INTERSTITIAL & PROMO OPTIMIZATION COCKPIT
// ----------------------------------------------------------------------------
export function renderInterstitialCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready font-mono text-xs">INTERSTITIALS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Promo &amp; Filler Inventory Optimization Desk</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ACTIVE PROMOS</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">42 Assets</span>
          <span class="text-xs text-muted block mt-0.5">15s, 30s, 60s Cuts</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">AUTO-FILL ROTATION</span>
          <span class="text-lg font-bold block mt-1 text-primary">Weighted Algorithm</span>
          <span class="text-xs text-muted block mt-0.5">Fills Unsold Pod Seconds</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">STATION IDS</span>
          <span class="text-lg font-bold block mt-1 text-success">Scheduled (Top of Hour)</span>
          <span class="text-xs text-muted block mt-0.5">NBC Mandate Active</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">BURN RATE</span>
          <span class="text-lg font-bold block mt-1 text-slate-100">Optimal (8x / Day)</span>
          <span class="text-xs text-muted block mt-0.5">Prevents Viewer Fatigue</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 24. TRANSMISSION TELEMETRY & SIGNAL HUB COCKPIT
// ----------------------------------------------------------------------------
export function renderTransmissionCockpit(): string {
  return `
    <div class="card mb-4 p-4 rounded-xl bg-surface border border-muted/20">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-live font-mono text-xs">TRANSMITTERS</span>
          <h2 class="text-xl font-bold m-0 text-slate-100">Transmission Telemetry &amp; Signal Quality Hub</h2>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">LAGOS (TEJUOSHO)</span>
          <span class="text-lg font-bold block mt-1 text-success">10.0 kW (Nominal)</span>
          <span class="text-xs text-success block mt-0.5">VSWR: 1.05:1</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">ABUJA (GIRI HILLS)</span>
          <span class="text-lg font-bold block mt-1 text-success">8.5 kW (Nominal)</span>
          <span class="text-xs text-success block mt-0.5">VSWR: 1.08:1</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">PORT HARCOURT</span>
          <span class="text-lg font-bold block mt-1 text-success">5.0 kW (Nominal)</span>
          <span class="text-xs text-success block mt-0.5">VSWR: 1.04:1</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-xs text-muted block font-semibold">NETWORK UPTIME</span>
          <span class="text-lg font-bold block mt-1 text-success">99.98%</span>
          <span class="text-xs text-muted block mt-0.5">Zero Unplanned Outages</span>
        </div>
      </div>
    </div>
  `;
}
