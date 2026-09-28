/**
 * VMN Public Verification Surface: AFCA Academy & Proof-of-Air Certificates
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A (§9, §10, §19) / VMNL-AZP-VMN-CCPP-001 §19, §21
 *
 * Implements public audit and verification pages:
 * - /verify/afca/:id  (AFCA Competency & Academy Graduate Certificates)
 * - /verify/poa/:id   (Broadcast Performance & Proof-of-Air Audit Certificates)
 *
 * Adheres strictly to WCAG 2.2 AA contrast, accessible semantic structure, and mobile-first ergonomics.
 */

import { AfcaCertificate } from "../../modules/hub/afca/index.js";
import { ProofOfAirCertificate } from "../../modules/broadcast/asrun/index.js";

export function renderAfcaVerificationHtml(result: {
  valid: boolean;
  certificate?: AfcaCertificate;
  id: string;
}): string {
  const { valid, certificate, id } = result;

  if (!valid || !certificate) {
    return `
<section class="vmn-verification-container" style="max-width: 800px; margin: 40px auto; padding: 0 16px;">
  <div class="vmn-card" style="background: var(--vmn-surface); border: 2px solid var(--vmn-error); border-radius: var(--vmn-radius-lg); padding: 36px 28px; text-align: center; box-shadow: var(--vmn-shadow);">
    <div style="width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center; font-size: 32px;" aria-hidden="true">
      ❌
    </div>
    <span class="vmn-badge" style="background: #FEE2E2; color: #991B1B; font-weight: 700; padding: 6px 14px; border-radius: 9999px; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">
      Certificate Not Found
    </span>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 16px 0 8px; color: var(--vmn-text-main);">
      AFCA Certificate Verification Failed
    </h1>
    <p style="color: var(--vmn-text-muted); font-size: 1rem; max-width: 540px; margin: 0 auto 24px;">
      The certificate identifier <strong style="font-family: monospace; color: var(--vmn-text-main);">${escapeHtml(id)}</strong> does not correspond to any active, accredited graduation record in the AFCA Academy Registry.
    </p>
    <div style="background: var(--vmn-surface-alt); border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.875rem; color: var(--vmn-text-muted);">
      <p style="margin-bottom: 8px;"><strong>Possible Reasons:</strong></p>
      <ul style="padding-left: 20px; line-height: 1.6;">
        <li>The certificate ID was mistyped or truncated.</li>
        <li>The student's final assessment portfolio is still under academic review.</li>
        <li>The credential has been superseded or administratively revoked.</li>
      </ul>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/hub/afca" class="vmn-btn vmn-btn-primary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; background: var(--vmn-secondary); color: white;">
        Visit AFCA Academy
      </a>
      <a href="/careers" class="vmn-btn vmn-btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; border: 1px solid var(--vmn-surface-border); background: var(--vmn-surface); color: var(--vmn-text-main);">
        Contact Registrar
      </a>
    </div>
  </div>
</section>
    `.trim();
  }

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const distinctionColor =
    certificate.distinction === "DISTINCTION"
      ? "#059669"
      : certificate.distinction === "MERIT"
      ? "#0284C7"
      : "#4B5563";

  return `
<section class="vmn-verification-container" style="max-width: 860px; margin: 40px auto; padding: 0 16px;">
  <!-- Breadcrumb -->
  <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
    <a href="/" style="color: var(--vmn-secondary); text-decoration: none;">Home</a> &gt; 
    <a href="/hub" style="color: var(--vmn-secondary); text-decoration: none;">Creative Hub</a> &gt; 
    <a href="/hub/afca" style="color: var(--vmn-secondary); text-decoration: none;">AFCA Academy</a> &gt; 
    <span aria-current="page" style="color: var(--vmn-text-main); font-weight: 600;">Certificate Verification</span>
  </nav>

  <div class="vmn-card" style="background: var(--vmn-surface); border: 1px solid var(--vmn-surface-border); border-top: 6px solid var(--vmn-success); border-radius: var(--vmn-radius-lg); padding: 40px 32px; box-shadow: var(--vmn-shadow);">
    <!-- Verification Status Banner -->
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--vmn-surface-border);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #DCFCE7; display: flex; align-items: center; justify-content: center; font-size: 26px;" aria-hidden="true">
          ✓
        </div>
        <div>
          <span class="vmn-badge" style="background: #DCFCE7; color: #166534; font-weight: 700; padding: 4px 12px; border-radius: 9999px; font-size: 0.8125rem; letter-spacing: 0.05em; text-transform: uppercase;">
            Authentic &amp; Accredited
          </span>
          <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-text-main); margin-top: 4px;">
            Official AFCA Graduation Credential
          </h1>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block;">Certificate ID</span>
        <span style="font-family: monospace; font-size: 0.95rem; font-weight: 700; color: var(--vmn-text-main);">${escapeHtml(certificate.certificateId)}</span>
      </div>
    </div>

    <!-- Credential Details Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Graduate / Student ID</span>
        <strong style="font-size: 1.1rem; color: var(--vmn-text-main); font-family: monospace;">${escapeHtml(certificate.studentId)}</strong>
      </div>
      
      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Academic Programme</span>
        <strong style="font-size: 1.05rem; color: var(--vmn-text-main);">${escapeHtml(certificate.courseTitle)}</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Cohort Class</span>
        <strong style="font-size: 1.05rem; color: var(--vmn-text-main); font-family: monospace;">${escapeHtml(certificate.cohortCode)}</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Distinction / Classification</span>
        <strong style="font-size: 1.1rem; color: ${distinctionColor};">${escapeHtml(certificate.distinction)} (${certificate.finalScorePercent}%)</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Date of Graduation</span>
        <strong style="font-size: 1rem; color: var(--vmn-text-main);">${formattedDate}</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Issuing Authority</span>
        <strong style="font-size: 0.95rem; color: var(--vmn-text-main);">AFCA Academy &amp; VMNL Governance</strong>
      </div>
    </div>

    <!-- Cryptographic Proof & QR Section -->
    <div style="background: #0F172A; color: #F8FAFC; border-radius: var(--vmn-radius-md); padding: 24px; margin-bottom: 28px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; font-weight: 600;">
          Tamper-Evident SHA-256 Digest
        </span>
        <span style="font-size: 0.75rem; color: #38BDF8; font-family: monospace;">FIPS 180-4 Compliant</span>
      </div>
      <div style="background: #1E293B; padding: 12px 14px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; word-break: break-all; color: #34D399; margin-bottom: 16px;">
        ${escapeHtml(certificate.verificationTokenSha256)}
      </div>
      <p style="font-size: 0.8125rem; color: #94A3B8; line-height: 1.5; margin: 0;">
        This cryptographic fingerprint is immutably generated from student identity, rubric project scores, and graduation timestamp. Any unauthorized alteration to certificate data invalidates this verification token.
      </p>
    </div>

    <!-- Actions -->
    <div style="display: flex; gap: 14px; justify-content: flex-end; flex-wrap: wrap;">
      <a href="/hub/afca" class="vmn-btn" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; border: 1px solid var(--vmn-surface-border); background: var(--vmn-surface); color: var(--vmn-text-main);">
        AFCA Academy Home
      </a>
      <a href="/hub/vtm" class="vmn-btn" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; background: var(--vmn-secondary); color: white;">
        View Verified Talent on VTM &rarr;
      </a>
    </div>
  </div>
</section>
  `.trim();
}

export function renderPoaVerificationHtml(result: {
  valid: boolean;
  certificate?: ProofOfAirCertificate;
  id: string;
}): string {
  const { valid, certificate, id } = result;

  if (!valid || !certificate) {
    return `
<section class="vmn-verification-container" style="max-width: 800px; margin: 40px auto; padding: 0 16px;">
  <div class="vmn-card" style="background: var(--vmn-surface); border: 2px solid var(--vmn-error); border-radius: var(--vmn-radius-lg); padding: 36px 28px; text-align: center; box-shadow: var(--vmn-shadow);">
    <div style="width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center; font-size: 32px;" aria-hidden="true">
      ⚠️
    </div>
    <span class="vmn-badge" style="background: #FEE2E2; color: #991B1B; font-weight: 700; padding: 6px 14px; border-radius: 9999px; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">
      Unverified Certificate
    </span>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 16px 0 8px; color: var(--vmn-text-main);">
      Proof-of-Air Performance Not Found
    </h1>
    <p style="color: var(--vmn-text-muted); font-size: 1rem; max-width: 540px; margin: 0 auto 24px;">
      The broadcast performance record <strong style="font-family: monospace; color: var(--vmn-text-main);">${escapeHtml(id)}</strong> was not matched against transmission carrier logs or Master Control as-run archives.
    </p>
    <div style="background: var(--vmn-surface-alt); border-radius: var(--vmn-radius-md); padding: 16px; margin-bottom: 24px; text-align: left; font-size: 0.875rem; color: var(--vmn-text-muted);">
      <p style="margin-bottom: 8px;"><strong>Possible Reasons:</strong></p>
      <ul style="padding-left: 20px; line-height: 1.6;">
        <li>Commercial spot is scheduled for a future broadcast window.</li>
        <li>As-run logs for the selected broadcast day are pending carrier reconciliation.</li>
        <li>Certificate identifier is invalid or from a legacy sandbox run.</li>
      </ul>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/broadcast/screens" class="vmn-btn vmn-btn-primary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; background: var(--vmn-secondary); color: white;">
        Broadcast Operations
      </a>
      <a href="/partners" class="vmn-btn vmn-btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; border: 1px solid var(--vmn-surface-border); background: var(--vmn-surface); color: var(--vmn-text-main);">
        Commercial Operations
      </a>
    </div>
  </div>
</section>
    `.trim();
  }

  const airTimeUtc = new Date(certificate.airedTimestamp).toUTCString();
  const airTimeWat = new Date(certificate.airedTimestamp).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const channelNames: Record<string, string> = {
    NXTR: "Nigezie Xtreme (Ch 428 DTT / 312 DTH)",
    ORIS: "Orisun — The Source (Ch 430 DTT / 315 DTH)",
    IMBD: "Isi Mbido — The Beginning (Ch 432 DTT / 318 DTH)",
  };
  const channelDisplay = channelNames[certificate.channelCode] || `Channel ${certificate.channelCode}`;

  return `
<section class="vmn-verification-container" style="max-width: 880px; margin: 40px auto; padding: 0 16px;">
  <!-- Breadcrumb -->
  <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: var(--vmn-text-muted); margin-bottom: 20px;">
    <a href="/" style="color: var(--vmn-secondary); text-decoration: none;">Home</a> &gt; 
    <a href="/channels" style="color: var(--vmn-secondary); text-decoration: none;">Linear TV</a> &gt; 
    <a href="/broadcast/dashboard" style="color: var(--vmn-secondary); text-decoration: none;">Master Control</a> &gt; 
    <span aria-current="page" style="color: var(--vmn-text-main); font-weight: 600;">Proof-of-Air Audit</span>
  </nav>

  <div class="vmn-card" style="background: var(--vmn-surface); border: 1px solid var(--vmn-surface-border); border-top: 6px solid #0284C7; border-radius: var(--vmn-radius-lg); padding: 40px 32px; box-shadow: var(--vmn-shadow);">
    <!-- Verification Status Banner -->
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--vmn-surface-border);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 26px;" aria-hidden="true">
          📡
        </div>
        <div>
          <span class="vmn-badge" style="background: #DCFCE7; color: #166534; font-weight: 700; padding: 4px 12px; border-radius: 9999px; font-size: 0.8125rem; letter-spacing: 0.05em; text-transform: uppercase;">
            Broadcast Performance Verified
          </span>
          <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--vmn-text-main); margin-top: 4px;">
            Certificate of Commercial Performance (Proof-of-Air)
          </h1>
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block;">Certificate ID</span>
        <span style="font-family: monospace; font-size: 0.95rem; font-weight: 700; color: var(--vmn-text-main);">${escapeHtml(certificate.certificateId)}</span>
      </div>
    </div>

    <!-- Proof-of-Air Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 32px;">
      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Commercial Advertiser / Client</span>
        <strong style="font-size: 1.05rem; color: var(--vmn-text-main);">${escapeHtml(certificate.clientName)}</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Broadcast Network</span>
        <strong style="font-size: 1.05rem; color: var(--vmn-text-main);">${escapeHtml(channelDisplay)}</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Campaign &amp; Spot Identifiers</span>
        <div style="font-family: monospace; font-size: 0.95rem; color: var(--vmn-text-main);">
          <div>Campaign: <strong>${escapeHtml(certificate.campaignId)}</strong></div>
          <div>Spot ID: <strong>${escapeHtml(certificate.spotId)}</strong></div>
        </div>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Verified Air Time</span>
        <div style="font-size: 0.95rem; color: var(--vmn-text-main);">
          <strong>${escapeHtml(airTimeWat)} (WAT)</strong>
          <div style="font-size: 0.8rem; color: var(--vmn-text-muted);">${escapeHtml(airTimeUtc)}</div>
        </div>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">Aired Duration</span>
        <strong style="font-size: 1.1rem; color: var(--vmn-text-main);">${certificate.durationSeconds} seconds</strong>
      </div>

      <div style="background: var(--vmn-surface-alt); padding: 18px 20px; border-radius: var(--vmn-radius-md); border: 1px solid var(--vmn-surface-border);">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vmn-text-muted); display: block; margin-bottom: 4px;">3-Way Carrier Match</span>
        <span class="vmn-badge" style="background: #DCFCE7; color: #166534; font-weight: 700; padding: 4px 10px; border-radius: 4px; font-size: 0.8125rem;">
          ✓ StarTimes Uplink Lock Confirmed
        </span>
      </div>
    </div>

    <!-- Cryptographic Proof & Digital Signatures -->
    <div style="background: #0F172A; color: #F8FAFC; border-radius: var(--vmn-radius-md); padding: 24px; margin-bottom: 28px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; font-weight: 600;">
          Tamper-Evident SHA-256 Playout Hash
        </span>
        <span style="font-size: 0.75rem; color: #38BDF8; font-family: monospace;">SMPTE-2067 / BXF Reconciled</span>
      </div>
      <div style="background: #1E293B; padding: 12px 14px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; word-break: break-all; color: #38BDF8; margin-bottom: 16px;">
        ${escapeHtml(certificate.cryptographicSignature)}
      </div>
      <p style="font-size: 0.8125rem; color: #94A3B8; line-height: 1.5; margin: 0;">
        This cryptographic proof is bound to the linear playout server frame timestamps and StarTimes carrier telemetry. It is immutable and accepted as audit-grade verification for financial billing and revenue recognition under CCPP-001 §19.
      </p>
    </div>

    <!-- Actions & PDF Download -->
    <div style="display: flex; gap: 14px; justify-content: flex-end; flex-wrap: wrap;">
      ${
        certificate.documentBase64
          ? `<a href="data:application/pdf;base64,${certificate.documentBase64}" download="PoA-${escapeHtml(certificate.certificateId)}.pdf" class="vmn-btn vmn-btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; border: 1px solid var(--vmn-surface-border); background: var(--vmn-surface); color: var(--vmn-text-main);">
              📄 Download PDF Certificate
            </a>`
          : ""
      }
      <a href="/partners" class="vmn-btn vmn-btn-primary" style="display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 10px 20px; border-radius: var(--vmn-radius-md); text-decoration: none; font-weight: 600; background: var(--vmn-secondary); color: white;">
        Commercial Partnerships &rarr;
      </a>
    </div>
  </div>
</section>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
