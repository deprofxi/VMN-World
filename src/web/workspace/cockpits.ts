/**
 * Enterprise Workspace Operational Cockpits
 * Authority: VMNL-AZP-VMN-CCPP-001 (§8–§25) / PRD R1.3C / Nielsen Norman Usability Heuristics
 *
 * Provides real-time interactive operational cockpits for mission-critical desks:
 * - MCR Playout Supervisor (Multiviewer, SCTE-35 DPI Cue Inserter, EBU R128 LUFS Meter)
 * - Broadcast Traffic & Spot Placement Planner (Break Pod Capacity, Conflict Protection, Make-Goods)
 * - Consolidated 7-Pillar Finance Dashboard (Double-Entry Ledger, Kobo Balancing, MT940 Reconciler)
 * - Talent Payouts & Nigerian WHT Ledger (Dual-Authorization Workflow, Statutory Deductions)
 * - VCF Film Fund (4-Factor Pitch Evaluation Rubric & Slate Financing Tranches)
 * - 1Studios Production Tracker (Daily Call Sheet Generator & Gear Locker)
 * - Fusion Events (Gate Ticket Check-in Scanner & Capacity Rings)
 * - AOS Agentic OS (Law 13 Human Proposal Approval Queue & Emergency Kill Switch)
 */

import { renderIcon } from "../components/index.js";
import {
  renderExecutiveCockpit,
  renderIamCockpit,
  renderOrganisationsCockpit,
  renderProjectsCockpit,
  renderRiskCockpit,
  renderBoardCockpit,
  renderProcurementCockpit,
  renderAuditCockpit,
  renderEsgCockpit,
  renderCommsCockpit,
  renderHrCockpit,
  renderLegalCockpit,
} from "./cockpits-executive.js";
import {
  renderEpgCockpit,
  renderAsrunCockpit,
  renderUplinkCockpit,
  renderIngestCockpit,
  renderGraphicsCockpit,
  renderScteCockpit,
  renderDisasterCockpit,
  renderAudioCockpit,
  renderInterstitialCockpit,
  renderTransmissionCockpit,
} from "./cockpits-broadcast.js";
import {
  renderTalentCockpit,
  renderAfcaCockpit,
  renderCommunityCockpit,
  renderVtmCockpit,
  renderTendCockpit,
  renderSoundstageCockpit,
  renderGearCockpit,
  renderPostproductionCockpit,
  renderAlumniCockpit,
} from "./cockpits-hub.js";
import {
  renderCrmCockpit,
  renderQuotesCockpit,
  renderContractsCockpit,
  renderBankreconCockpit,
  renderHeadspaceCockpit,
  renderCr8techCockpit,
  renderRightsCockpit,
  renderPrivacyCockpit,
  renderSecurityCockpit,
} from "./cockpits-commercial.js";

export function renderDeskCockpitHtml(deskKey: string): string {
  switch (deskKey.toLowerCase()) {
    // Pillar 1: Executive & Core Governance
    case "executive":
      return renderExecutiveCockpit();
    case "iam":
      return renderIamCockpit();
    case "organisations":
      return renderOrganisationsCockpit();
    case "projects":
      return renderProjectsCockpit();
    case "risk":
      return renderRiskCockpit();
    case "board":
      return renderBoardCockpit();
    case "procurement":
      return renderProcurementCockpit();
    case "audit":
      return renderAuditCockpit();
    case "esg":
      return renderEsgCockpit();
    case "comms":
      return renderCommsCockpit();
    case "hr":
      return renderHrCockpit();
    case "legal":
      return renderLegalCockpit();

    // Pillar 2: Broadcast Linear Operations
    case "mcr":
      return renderMcrCockpit();
    case "traffic":
      return renderTrafficCockpit();
    case "epg":
      return renderEpgCockpit();
    case "asrun":
      return renderAsrunCockpit();
    case "uplink":
      return renderUplinkCockpit();
    case "ingest":
      return renderIngestCockpit();
    case "graphics":
      return renderGraphicsCockpit();
    case "scte":
      return renderScteCockpit();
    case "disaster":
      return renderDisasterCockpit();
    case "audio":
      return renderAudioCockpit();
    case "interstitial":
      return renderInterstitialCockpit();
    case "transmission":
      return renderTransmissionCockpit();

    // Pillar 3: Creative Hub, Talent & Production
    case "talent":
      return renderTalentCockpit();
    case "afca":
      return renderAfcaCockpit();
    case "community":
      return renderCommunityCockpit();
    case "vtm":
      return renderVtmCockpit();
    case "vcf":
      return renderVcfCockpit();
    case "onestudios":
      return renderOneStudiosCockpit();
    case "events":
      return renderEventsCockpit();
    case "tend":
      return renderTendCockpit();
    case "soundstage":
      return renderSoundstageCockpit();
    case "gear":
      return renderGearCockpit();
    case "postproduction":
      return renderPostproductionCockpit();
    case "alumni":
      return renderAlumniCockpit();

    // Pillar 4: Commercial, Finance, Tech & Governance
    case "crm":
      return renderCrmCockpit();
    case "quotes":
      return renderQuotesCockpit();
    case "contracts":
      return renderContractsCockpit();
    case "finance":
      return renderFinanceCockpit();
    case "payouts":
      return renderPayoutsCockpit();
    case "bankrecon":
      return renderBankreconCockpit();
    case "headspace":
      return renderHeadspaceCockpit();
    case "cr8tech":
      return renderCr8techCockpit();
    case "rights":
      return renderRightsCockpit();
    case "privacy":
      return renderPrivacyCockpit();
    case "security":
      return renderSecurityCockpit();
    case "aos":
      return renderAosCockpit();

    default:
      return "";
  }
}

// ----------------------------------------------------------------------------
// 1. MCR (MASTER CONTROL ROOM) COCKPIT
// ----------------------------------------------------------------------------
function renderMcrCockpit(): string {
  return `
    <div class="card mb-4 s-0VsXzJWSrV">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-live">LIVE TRANSMISSION MCR</span>
          <h2 class="text-xl font-bold m-0">Linear Broadcast Supervisor Cockpit</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/api/v1/broadcast/playout/telemetry-stream" target="_blank" class="btn btn-outline btn-sm">
            ${renderIcon("broadcast", { size: 14 })}
            <span>Live SSE Stream</span>
          </a>
        </div>
      </div>

      <!-- 3-Channel Multiviewer Grid -->
      <h3 class="text-sm text-muted font-bold mb-2">Linear Channel Multiviewer (StarTimes DTT / DTH)</h3>
      <div class="grid grid-3 gap-3 mb-4">
        <!-- Channel 1: NXTR -->
        <div class="card p-3 vmn-interactive-row s-UjtUGW7tr6" data-inspect-title="NXTR Playout Carrier" data-field-channel="NXTR HD (Ch 101)" data-field-carrier-status="LOCKED: -48.5 dBm" data-field-program-stream="PID 0x0100 (1080i50 / 50Hz)" data-field-scte35-pid="PID 0x0104" data-field-carriage="StarTimes DTT 586MHz" data-field-som="14:28:42:18">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-sm s-_0oFd6CAK5">NXTR HD (Ch 101)</span>
            <div class="flex items-center gap-2">
              <div class="vmn-vu-meter" title="Audio Levels">
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
              </div>
              <span class="vmn-badge badge-success text-xs">LOCKED: -48.5 dBm</span>
            </div>
          </div>
          <div class="p-3 mb-2 text-center s-KX2BzMtbnt">
            <div class="text-xs text-muted mb-1">PROGRAM STREAM PID 0x0100</div>
            <div class="text-base font-bold text-success">Nigezie Xtreme Live Feed</div>
            <div class="text-xs text-muted mt-1 font-mono">1080i50 / 50Hz • SOM 14:28:42:18</div>
          </div>
          <div class="flex justify-between text-xs text-muted">
            <span>SCTE-35: <strong>PID 0x0104</strong></span>
            <span>Carriage: <strong>StarTimes DTT</strong></span>
          </div>
        </div>

        <!-- Channel 2: ORIS -->
        <div class="card p-3 vmn-interactive-row s-UjtUGW7tr6" data-inspect-title="ORIS Playout Carrier" data-field-channel="ORIS HD (Ch 102)" data-field-carrier-status="LOCKED: -46.2 dBm" data-field-program-stream="PID 0x0100 (1080i50 / 50Hz)" data-field-scte35-pid="PID 0x0104" data-field-carriage="StarTimes DTH 11.2GHz" data-field-som="14:28:42:18">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-sm s-w7n9QFIhfO">ORIS HD (Ch 102)</span>
            <div class="flex items-center gap-2">
              <div class="vmn-vu-meter" title="Audio Levels">
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
              </div>
              <span class="vmn-badge badge-success text-xs">LOCKED: -46.2 dBm</span>
            </div>
          </div>
          <div class="p-3 mb-2 text-center s-KX2BzMtbnt">
            <div class="text-xs text-muted mb-1">PROGRAM STREAM PID 0x0100</div>
            <div class="text-base font-bold text-success">Orisun Cinema Showcase</div>
            <div class="text-xs text-muted mt-1 font-mono">1080i50 / 50Hz • SOM 14:28:42:18</div>
          </div>
          <div class="flex justify-between text-xs text-muted">
            <span>SCTE-35: <strong>PID 0x0104</strong></span>
            <span>Carriage: <strong>StarTimes DTH</strong></span>
          </div>
        </div>

        <!-- Channel 3: IMBD -->
        <div class="card p-3 vmn-interactive-row s-UjtUGW7tr6" data-inspect-title="IMBD Playout Carrier" data-field-channel="IMBD HD (Ch 103)" data-field-carrier-status="LOCKED: -49.1 dBm" data-field-program-stream="PID 0x0100 (1080i50 / 50Hz)" data-field-scte35-pid="PID 0x0104" data-field-carriage="StarTimes DTT 586MHz" data-field-som="14:28:42:18">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-sm s-QPRA9mVJ2K">IMBD HD (Ch 103)</span>
            <div class="flex items-center gap-2">
              <div class="vmn-vu-meter" title="Audio Levels">
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
                <div class="vmn-vu-bar"></div>
              </div>
              <span class="vmn-badge badge-success text-xs">LOCKED: -49.1 dBm</span>
            </div>
          </div>
          <div class="p-3 mb-2 text-center s-KX2BzMtbnt">
            <div class="text-xs text-muted mb-1">PROGRAM STREAM PID 0x0100</div>
            <div class="text-base font-bold text-success">Isi Mbido Cultural Hour</div>
            <div class="text-xs text-muted mt-1 font-mono">1080i50 / 50Hz • SOM 14:28:42:18</div>
          </div>
          <div class="flex justify-between text-xs text-muted">
            <span>SCTE-35: <strong>PID 0x0104</strong></span>
            <span>Carriage: <strong>StarTimes DTT</strong></span>
          </div>
        </div>
      </div>

      <!-- EBU R128 Audio Loudness & SCTE-35 Injection Console -->
      <div class="grid grid-2 gap-4">
        <!-- EBU R128 Meter -->
        <div class="card p-3 s-3zot8ocgAl">
          <h4 class="font-bold text-sm mb-3">Audio Loudness Compliance (EBU R128 / ITU-R BS.1770)</h4>
          <div class="flex justify-between text-xs mb-1">
            <span>Target Loudness: <strong>-23.0 LUFS</strong></span>
            <span>Current Integrated: <strong class="text-success">-23.2 LUFS</strong></span>
          </div>
          <div class="w-full bg-surface mb-3 s-vKS9CpUbV4">
            <div class="s-6kv4foifv2"></div>
          </div>
          <div class="flex justify-between text-xs text-muted font-mono">
            <span>True Peak: -1.2 dBFS</span>
            <span>Loudness Range: 7.4 LU</span>
            <span>Momentary Max: -21.8 LUFS</span>
          </div>
        </div>

        <!-- SCTE-35 DPI Cue Trigger -->
        <div class="card p-3 s-3zot8ocgAl">
          <h4 class="font-bold text-sm mb-2">Digital Ad Insertion (ANSI/SCTE-35 2020)</h4>
          <p class="text-xs text-muted mb-3">Injects real-time splice_insert cues over UDP/IP socket to headend edge multiplexers.</p>
          <div class="flex flex-wrap gap-2">
            <form class="s-hpgMMOqwDM" method="POST" action="/api/v1/broadcast/headend/scte35-cue">
              <input type="hidden" name="channelCode" value="NXTR" />
              <input type="hidden" name="durationSeconds" value="60" />
              <button type="submit" class="btn btn-primary btn-sm" data-confirm="Inject 60-second SCTE-35 commercial break cue into linear broadcast stream?" data-toast="SCTE-35 60s splice cue dispatched to headend edge multiplexer" data-toast-type="success">
                <span>Inject 60s Break Cue</span>
              </button>
            </form>
            <form class="s-hpgMMOqwDM" method="POST" action="/api/v1/broadcast/headend/return-cue">
              <input type="hidden" name="channelCode" value="NXTR" />
              <button type="submit" class="btn btn-outline btn-sm" data-toast="Return-to-network splice cue transmitted" data-toast-type="info">
                <span>Return to Network (Cue In)</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. BROADCAST TRAFFIC & AD SPOT PLANNER COCKPIT
// ----------------------------------------------------------------------------
function renderTrafficCockpit(): string {
  return `
    <div class="card mb-4 s-iXOSygMEgb">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-info">LINEAR TRAFFIC &amp; AD SALES</span>
          <h2 class="text-xl font-bold m-0">Commercial Break Pod Planner (24-Hour Grid)</h2>
        </div>
        <span class="text-xs text-muted">Category Separation Rules: <strong>ACTIVE</strong></span>
      </div>

      <div class="table-responsive mb-4">
        <table class="table w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left">
              <th class="py-2">Daypart / Time</th>
              <th class="py-2">Programme Block</th>
              <th class="py-2">Pod Capacity</th>
              <th class="py-2">Booked Spots (Brand Separation Checked)</th>
              <th class="py-2 text-right">Yield (₦)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Break Pod 14:15:00 (NXTR)" data-field-daypart-time="14:15:00 WAT" data-field-programme="Nigezie Top 10 Countdown" data-field-pod-capacity="120s / 120s (100% Full)" data-field-booked-spots="GTBank (30s) • MTN 5G (30s) • Indomie (30s) • Peak Milk (30s)" data-field-gross-yield="₦1,800,000" data-field-brand-separation="Verified (Guinness &amp; NB >= 15m barrier)">
              <td class="py-3 font-mono">14:15:00</td>
              <td><strong>Nigezie Top 10 Countdown</strong></td>
              <td>
                <span class="vmn-badge badge-live">120s / 120s (100% FULL)</span>
              </td>
              <td>GTBank (30s) • MTN 5G (30s) • Indomie (30s) • Peak Milk (30s)</td>
              <td class="py-3 text-right font-mono font-bold">₦1,800,000</td>
            </tr>
            <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Break Pod 14:30:00 (NXTR)" data-field-daypart-time="14:30:00 WAT" data-field-programme="Nigezie Top 10 Countdown" data-field-pod-capacity="90s / 120s (75% - 30s Open)" data-field-booked-spots="Airtel Smart (30s) • Guinness Smooth (30s) • Flutterwave (30s)" data-field-gross-yield="₦1,350,000" data-field-inventory-status="30s Avail for Spot Insertion">
              <td class="py-3 font-mono">14:30:00</td>
              <td><strong>Nigezie Top 10 Countdown</strong></td>
              <td>
                <span class="vmn-badge badge-warning">90s / 120s (75% - 30s OPEN)</span>
              </td>
              <td>Airtel Smart (30s) • Guinness Smooth (30s) • Flutterwave (30s)</td>
              <td class="py-3 text-right font-mono font-bold">₦1,350,000</td>
            </tr>
            <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Break Pod 14:45:00 (NXTR)" data-field-daypart-time="14:45:00 WAT" data-field-programme="Afro-Beats Chart Show" data-field-pod-capacity="60s / 120s (50% - 60s Open)" data-field-booked-spots="Coca-Cola Naija (30s) • Nigerian Breweries (30s)" data-field-gross-yield="₦900,000" data-field-inventory-status="60s Avail for Spot Insertion">
              <td class="py-3 font-mono">14:45:00</td>
              <td><strong>Afro-Beats Chart Show</strong></td>
              <td>
                <span class="vmn-badge badge-success">60s / 120s (50% - 60s OPEN)</span>
              </td>
              <td>Coca-Cola Naija (30s) • Nigerian Breweries (30s)</td>
              <td class="py-3 text-right font-mono font-bold">₦900,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card p-3 flex items-center justify-between flex-wrap gap-2 s-3zot8ocgAl">
        <div>
          <span class="text-xs font-bold text-warning">AD SEPARATION GUARD:</span>
          <span class="text-xs text-muted ml-2">Guinness Smooth and Nigerian Breweries are separated by >= 15 minutes of linear playout.</span>
        </div>
        <a href="/workspace/asrun" class="btn btn-outline btn-sm">Inspect As-Run Proofs &rarr;</a>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. CONSOLIDATED 7-PILLAR FINANCE COCKPIT
// ----------------------------------------------------------------------------
function renderFinanceCockpit(): string {
  return `
    <div class="card mb-4 s-J-qlZ3lDg9">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready">CANONICAL LEDGER</span>
          <h2 class="text-xl font-bold m-0">Consolidated 7-Pillar Financial Separation</h2>
        </div>
        <span class="vmn-badge badge-success">DOUBLE-ENTRY BALANCED (KOBO ACCURATE)</span>
      </div>

      <!-- Seven-Pillar Financial Separation Cards -->
      <div class="grid grid-4 gap-3 mb-4">
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 1: Contract Value (Legal)" data-field-pillar="Contract Value" data-field-value="₦1,248,500,000" data-field-definition="Fully executed commercial contracts &amp; client commitments" data-field-authority="DoA Level 1 Signoff">
          <div class="text-xs text-muted">1. Contract Value (Legal)</div>
          <div class="text-lg font-bold font-mono">₦1,248,500,000</div>
          <div class="text-xs text-success">Committed agreements</div>
        </div>
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 2: Gross Merchandise Value" data-field-pillar="Gross Merchandise Value" data-field-value="₦982,340,000" data-field-definition="Total marketplace transaction volume across VTM &amp; Azeebo+" data-field-rule="Never recognized as revenue (Law 07)">
          <div class="text-xs text-muted">2. Gross Merchandise Value</div>
          <div class="text-lg font-bold font-mono">₦982,340,000</div>
          <div class="text-xs text-muted">Throughput (never revenue)</div>
        </div>
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 3: Invoiced Revenue" data-field-pillar="Invoiced Revenue" data-field-value="₦740,120,000" data-field-definition="Commercial invoices dispatched with payment terms" data-field-aging="₦45M > 30 Days">
          <div class="text-xs text-muted">3. Invoiced Revenue</div>
          <div class="text-lg font-bold font-mono">₦740,120,000</div>
          <div class="text-xs text-info">Accounts receivable</div>
        </div>
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 4: Recognized Revenue" data-field-pillar="Recognized Revenue" data-field-value="₦620,890,000" data-field-definition="Earned revenue backed by verified transmission proof of air" data-field-standard="IFRS 15 Compliant">
          <div class="text-xs text-muted">4. Recognized Revenue</div>
          <div class="text-lg font-bold font-mono">₦620,890,000</div>
          <div class="text-xs text-success">Delivery-gated earned</div>
        </div>
      </div>

      <div class="grid grid-3 gap-3 mb-4">
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 5: Cash Collections" data-field-pillar="Cash Collections" data-field-value="₦594,450,000" data-field-bank-recon="MT940 Bank Statement Matched" data-field-status="Verified in Vault">
          <div class="text-xs text-muted">5. Cash Collections</div>
          <div class="text-lg font-bold font-mono text-success">₦594,450,000</div>
          <div class="text-xs text-muted">Verified bank deposits</div>
        </div>
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 6: Talent Payables" data-field-pillar="Talent Payables" data-field-value="₦184,200,000" data-field-wht-liability="₦18,420,000 (10% Statutory)" data-field-status="Escrow Protected">
          <div class="text-xs text-muted">6. Talent Payables</div>
          <div class="text-lg font-bold font-mono text-warning">₦184,200,000</div>
          <div class="text-xs text-muted">Owed to cast &amp; crew</div>
        </div>
        <div class="card p-3 vmn-interactive-row" data-inspect-title="Pillar 7: Partner Splits" data-field-pillar="Partner Splits" data-field-value="₦92,600,000" data-field-recipients="StarTimes Carriage &amp; Syndication Partners" data-field-status="Monthly Settlement">
          <div class="text-xs text-muted">7. Partner Splits</div>
          <div class="text-lg font-bold font-mono">₦92,600,000</div>
          <div class="text-xs text-muted">Carriage &amp; syndication</div>
        </div>
      </div>

      <!-- Balanced Journal Entry Inspector -->
      <div class="card p-3 s-3zot8ocgAl">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-bold text-sm m-0">Recent General Ledger Postings (PostgreSQL Immutable Journal)</h4>
          <span class="text-xs text-muted font-mono">Sum(Dr) ₦594,450,000 == Sum(Cr) ₦594,450,000</span>
        </div>
        <div class="text-xs text-muted mb-2">Internal unit allocations are eliminated on consolidation per Canonical Law 07.</div>
        <div class="table-responsive">
          <table class="table w-full text-xs font-mono">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="py-1">Voucher ID</th>
                <th class="py-1">Reference</th>
                <th class="py-1">Description</th>
                <th class="py-1 text-right">Debit (₦)</th>
                <th class="py-1 text-right">Credit (₦)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Journal Voucher JRN-2026-0982" data-field-voucher="JRN-2026-0982" data-field-reference="QTC:DEAL-0441" data-field-client="MTN Nigeria Communications" data-field-debit="₦12,500,000.00" data-field-credit="₦12,500,000.00" data-field-status="Posted &amp; Immutable">
                <td class="py-2">JRN-2026-0982</td>
                <td>QTC:DEAL-0441</td>
                <td>Linear ad placement billing (MTN 5G Campaign)</td>
                <td class="py-2 text-right">₦12,500,000.00</td>
                <td class="py-2 text-right">₦12,500,000.00</td>
              </tr>
              <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Journal Voucher JRN-2026-0983" data-field-voucher="JRN-2026-0983" data-field-reference="PAY:BATCH-0112" data-field-production="Sugar Girl Series (Cast &amp; Crew)" data-field-debit="₦4,200,000.00" data-field-credit="₦4,200,000.00" data-field-status="Posted &amp; Immutable">
                <td class="py-2">JRN-2026-0983</td>
                <td>PAY:BATCH-0112</td>
                <td>Cast talent disbursement (Sugar Girl Series)</td>
                <td class="py-2 text-right">₦4,200,000.00</td>
                <td class="py-2 text-right">₦4,200,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. TALENT PAYOUTS & NIGERIAN WHT COCKPIT
// ----------------------------------------------------------------------------
function renderPayoutsCockpit(): string {
  return `
    <div class="card mb-4 s-rGzceLgh3f">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-warning">TALENT PAYOUTS</span>
          <h2 class="text-xl font-bold m-0">Nigerian WHT &amp; Creator Disbursal Chamber</h2>
        </div>
        <div class="flex items-center gap-2">
          <a href="/portal/vtm/release-wizard" class="btn btn-primary btn-sm text-xs font-bold">Escrow Release Wizard &rarr;</a>
          <a href="/workspace/finance/payouts" class="btn btn-outline btn-sm text-xs font-bold">Payouts Ledger &rarr;</a>
        </div>
      </div>

      <!-- Statutory Summary KPI Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-muted block font-semibold">TOTAL ESCROW HELD</span>
          <span class="text-lg font-bold block mt-1 font-mono text-slate-100">₦184,200,000</span>
          <span class="text-muted block mt-0.5">Commercial Contracts</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-muted block font-semibold">STATUTORY WHT (10%)</span>
          <span class="text-lg font-bold block mt-1 font-mono text-warning">₦18,420,000</span>
          <span class="text-xs text-warning block mt-0.5">FIRS / LIRS Remittance</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-muted block font-semibold">NET DISBURSABLE</span>
          <span class="text-lg font-bold block mt-1 font-mono text-success">₦165,780,000</span>
          <span class="text-xs text-success block mt-0.5">Net to Cast &amp; Crew</span>
        </div>
        <div class="p-3 rounded-lg bg-slate-900/60 border border-muted/10">
          <span class="text-muted block font-semibold">SETTLEMENT RAIL</span>
          <span class="text-lg font-bold block mt-1 text-primary font-mono">NIBSS NIP</span>
          <span class="text-muted block mt-0.5">Direct Bank Deposit</span>
        </div>
      </div>

      <div class="table-responsive mb-4">
        <table class="table w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left">
              <th class="py-2">Batch Number</th>
              <th class="py-2">Talent Count</th>
              <th class="py-2 text-right">Gross Amount</th>
              <th class="py-2 text-right">WHT Withheld (10%)</th>
              <th class="py-2 text-right">Net Payable</th>
              <th class="py-2 text-center">Status</th>
              <th class="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Talent Payout Batch PAY-2026-11-B01" data-field-batch-id="PAY-2026-11-B01" data-field-beneficiaries="24 Creatives" data-field-gross-amount="₦42,500,000" data-field-wht-withheld="₦4,250,000 (10% Statutory)" data-field-net-payable="₦38,250,000" data-field-bank-rail="NIBSS Instant Payment (NIP)" data-field-status="Disbursed &amp; Reconciled">
              <td class="py-3 font-mono font-bold">PAY-2026-11-B01</td>
              <td>24 Creatives</td>
              <td class="py-3 text-right font-mono">₦42,500,000</td>
              <td class="py-3 text-right font-mono text-warning">₦4,250,000</td>
              <td class="py-3 text-right font-mono font-bold text-success">₦38,250,000</td>
              <td class="py-3 text-center"><span class="vmn-badge badge-success text-xs">APPROVED</span></td>
              <td class="py-3 text-right">
                <button type="button" class="btn btn-outline btn-sm" disabled>Disbursed via NIP</button>
              </td>
            </tr>
            <tr class="border-b border-border vmn-interactive-row" data-inspect-title="Talent Payout Batch PAY-2026-11-B02" data-field-batch-id="PAY-2026-11-B02" data-field-beneficiaries="18 Creatives" data-field-gross-amount="₦18,900,000" data-field-wht-withheld="₦1,890,000 (10% Statutory)" data-field-net-payable="₦17,010,000" data-field-authorization="Pending CFO Key 2 Signature">
              <td class="py-3 font-mono font-bold">PAY-2026-11-B02</td>
              <td>18 Creatives</td>
              <td class="py-3 text-right font-mono">₦18,900,000</td>
              <td class="py-3 text-right font-mono text-warning">₦1,890,000</td>
              <td class="py-3 text-right font-mono font-bold text-success">₦17,010,000</td>
              <td class="py-3 text-center"><span class="vmn-badge badge-warning text-xs">PENDING KEY 2</span></td>
              <td class="py-3 text-right">
                <button type="button" class="btn btn-primary btn-sm" data-confirm="Authorize second-key cryptographic approval for talent disbursement batch PAY-2026-11-B02?" data-toast="Second-key authorization verified: ₦17,010,000 queued for NIP transfer" data-toast-type="success">
                  <span>Authorize Disbursal</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. VCF FILM FUND & SLATE FINANCING COCKPIT
// ----------------------------------------------------------------------------
function renderVcfCockpit(): string {
  return `
    <div class="card mb-4 s-FxMdjlFtxZ">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-info">VCF FILM FUND</span>
          <h2 class="text-xl font-bold m-0">Pitch Pipeline &amp; Slate Financing Milestones</h2>
        </div>
        <a href="#pitch-modal" class="btn btn-primary btn-sm">
          ${renderIcon("film", { size: 14 })}
          <span>Submit Pitch Treatment</span>
        </a>
      </div>

      <div class="grid grid-3 gap-3 mb-4">
        <div class="card p-3">
          <div class="text-xs text-muted">Active Pitches Under Review</div>
          <div class="text-2xl font-bold font-mono">42</div>
          <div class="text-xs text-info">4-factor rubric scoring active</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-muted">Greenlit Slate Productions</div>
          <div class="text-2xl font-bold font-mono">11</div>
          <div class="text-xs text-success">Tranche-gated funding</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-muted">Total Committed Capital</div>
          <div class="text-2xl font-bold font-mono">₦450,000,000</div>
          <div class="text-xs text-muted">Completion bonds secured</div>
        </div>
      </div>

      <!-- 4-Factor Rubric Spec -->
      <div class="card p-3 s-3zot8ocgAl">
        <h4 class="font-bold text-sm mb-2">VCF Investment Evaluation Rubric (PRD §31 Weighted Matrix)</h4>
        <div class="grid grid-4 gap-2 text-xs">
          <div class="card p-2"><strong>Commercial Viability:</strong> 35% Weight</div>
          <div class="card p-2"><strong>Cultural Relevance:</strong> 25% Weight</div>
          <div class="card p-2"><strong>Distribution Potential:</strong> 25% Weight</div>
          <div class="card p-2"><strong>Feasibility:</strong> 15% Weight</div>
        </div>
        <div class="text-xs text-muted mt-2">Scores >= 75 auto-qualify for Executive Greenlight review.</div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 6. 1STUDIOS PRODUCTION & CALL SHEET COCKPIT
// ----------------------------------------------------------------------------
function renderOneStudiosCockpit(): string {
  return `
    <div class="card mb-4 s-xBIRJmOAU_">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-ready">1STUDIOS PRODUCTION</span>
          <h2 class="text-xl font-bold m-0">Production Facilities &amp; Daily Call Sheet Deck</h2>
        </div>
        <span class="vmn-badge badge-live">SOUNDSTAGE A &amp; B: ACTIVE SHOOT</span>
      </div>

      <div class="grid grid-2 gap-4">
        <!-- Daily Call Sheet -->
        <div class="card p-3">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-bold text-sm m-0">Daily Call Sheet: Project "Oloibiri Rising"</h4>
            <span class="vmn-badge badge-info text-xs">Day 14 of 32</span>
          </div>
          <div class="text-xs text-muted mb-2 font-mono">Shoot Date: Today • General Call: 06:30 WAT</div>
          <div class="p-2 mb-2 bg-surface text-xs font-mono s-BCCNLMbzhO">
            <div><strong>Location:</strong> 1Studios Soundstage A, Lekki, Lagos</div>
            <div><strong>Nearest Hospital:</strong> Reddington Hospital, Victoria Island</div>
            <div><strong>Safety:</strong> Pyrotechnic safety officer on set. Ear protection required.</div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-outline btn-sm">Export Call Sheet PDF</button>
            <button type="button" class="btn btn-primary btn-sm">Send SMS Call Alerts</button>
          </div>
        </div>

        <!-- Gear Locker -->
        <div class="card p-3">
          <h4 class="font-bold text-sm mb-2">Equipment Locker &amp; Camera Packages</h4>
          <div class="table-responsive">
            <table class="table w-full text-xs">
              <thead>
                <tr class="border-b border-border text-left">
                  <th class="py-1">Gear Asset</th>
                  <th class="py-1">Serial / Package</th>
                  <th class="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border">
                  <td class="py-2">ARRI Alexa Mini LF</td>
                  <td class="py-2 font-mono">PKG-CAM-01</td>
                  <td class="py-2"><span class="vmn-badge badge-live text-xs">CHECKED OUT</span></td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">Cooke Anamorphic /i Set</td>
                  <td class="py-2 font-mono">PKG-LENS-04</td>
                  <td class="py-2"><span class="vmn-badge badge-live text-xs">CHECKED OUT</span></td>
                </tr>
                <tr class="border-b border-border">
                  <td class="py-2">Aputure 1200d Pro Kit</td>
                  <td class="py-2 font-mono">PKG-LGT-09</td>
                  <td class="py-2"><span class="vmn-badge badge-success text-xs">AVAILABLE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 7. FUSION EVENTS & GATE CHECK-IN COCKPIT
// ----------------------------------------------------------------------------
function renderEventsCockpit(): string {
  return `
    <div class="card mb-4 s-4DLE76G8R7">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-live">LIVE EVENT GATE</span>
          <h2 class="text-xl font-bold m-0">Fusion Events Ticket Scanner &amp; Attendance Cockpit</h2>
        </div>
        <span class="vmn-badge badge-success">VENUE SAFETY PERMIT: VERIFIED</span>
      </div>

      <div class="grid grid-2 gap-4">
        <!-- Ticket Verification Input -->
        <div class="card p-3">
          <h4 class="font-bold text-sm mb-2">Anti-Fraud Gate Ticket Scanner</h4>
          <p class="text-xs text-muted mb-3">Scans cryptographically signed tickets with single-use replay prevention.</p>
          <form method="POST" action="/api/v1/hubs/events/ticket-checkin">
            <div class="form-group mb-3">
              <label class="text-xs font-bold mb-1 block" for="ticketNumber">Ticket Number / QR Token</label>
              <input type="text" id="ticketNumber" name="ticketNumber" class="vmn-input w-full font-mono" placeholder="EVT-NXTR-2026-..." required />
            </div>
            <button type="submit" class="btn btn-primary btn-sm w-full">
              <span>Validate &amp; Admit Attendee</span>
            </button>
          </form>
        </div>

        <!-- Tier Capacities -->
        <div class="card p-3">
          <h4 class="font-bold text-sm mb-2">Live Door Attendance &amp; Tier Allocation</h4>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>Regular (₦10,000): <strong>1,840 / 2,000 Checked In</strong></span>
                <span>92%</span>
              </div>
              <div class="w-full bg-surface s-I2LgdQy597">
                <div class="s-RySvfRa6ci"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>VIP (₦35,000): <strong>285 / 300 Checked In</strong></span>
                <span>95%</span>
              </div>
              <div class="w-full bg-surface s-I2LgdQy597">
                <div class="s-wogMjD7A6U"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span>VVIP Lounge (₦150,000): <strong>48 / 50 Checked In</strong></span>
                <span>96%</span>
              </div>
              <div class="w-full bg-surface s-I2LgdQy597">
                <div class="s-dOf8OBWdfh"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 8. AOS AGENTIC OS & LAW 13 REVIEW COCKPIT
// ----------------------------------------------------------------------------
function renderAosCockpit(): string {
  return `
    <div class="card mb-4 s-7BKJQOKQbF">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <span class="vmn-badge badge-warning">CANONICAL LAW 13</span>
          <h2 class="text-xl font-bold m-0">AOS Consequential Proposal Review &amp; AI Safety Chamber</h2>
        </div>
        <form class="s-YWPkqV3VsB" method="POST" action="/api/v1/intelligence/kill-switch">
          <input type="hidden" name="active" value="true" />
          <button type="submit" class="btn btn-secondary btn-sm s-B8oSu-MKDE" data-confirm="ENGAGE EMERGENCY AI KILL SWITCH? This immediately halts all autonomous subagent execution across the entire platform." data-toast="AOS Emergency AI Kill Switch Engaged" data-toast-type="error">
            <span>EMERGENCY AI KILL SWITCH</span>
          </button>
        </form>
      </div>

      <div class="card p-3 mb-4 s-Z9yCZ01wxI">
        <h4 class="font-bold text-sm mb-1">Autonomous Consequential Proposal Queue</h4>
        <p class="text-xs text-muted mb-3">Model-as-final-judge is strictly prohibited. Every proposed financial disbursal, rights amendment, or broadcast override requires non-delegable human operator authorization.</p>

        <div class="table-responsive">
          <table class="table w-full text-xs">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="py-2">Proposal ID</th>
                <th class="py-2">Agent Origin</th>
                <th class="py-2">Consequential Action</th>
                <th class="py-2">Model Rationale</th>
                <th class="py-2 text-right">Human Review Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border vmn-interactive-row" data-inspect-title="AOS Proposal PROP-2026-081" data-field-proposal-id="PROP-2026-081" data-field-origin-agent="agent-traffic-optimizer" data-field-consequential-action="Reschedule preempted spot for indomie to Prime Time Break 14:15" data-field-model-rationale="Minimizes advertiser credit notes by ₦450,000 without creating brand collision." data-field-canonical-law="Law 13 Human Authorization Required">
                <td class="py-2 font-mono font-bold">PROP-2026-081</td>
                <td>agent-traffic-optimizer</td>
                <td>Reschedule preempted spot for indomie to Prime Time Break 14:15</td>
                <td class="text-muted">Minimizes advertiser credit notes by ₦450,000 without creating brand collision.</td>
                <td class="py-2 text-right">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="btn btn-primary btn-sm" data-toast="Canonical Law 13 human signoff recorded for PROP-2026-081" data-toast-type="success">Approve</button>
                    <button type="button" class="btn btn-outline btn-sm" data-toast="Proposal PROP-2026-081 rejected by operator" data-toast-type="warning">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
