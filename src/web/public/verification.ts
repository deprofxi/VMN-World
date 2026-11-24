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
import { renderIcon, escapeHtml } from "../components/index.js";

export function renderAfcaVerificationHtml(result: {
  valid: boolean;
  certificate?: AfcaCertificate;
  id: string;
}): string {
  const { valid, certificate, id } = result;

  if (!valid || !certificate) {
    return `
<section class="vmn-verification-container s-he7-rwfX00" >
 <div class="vmn-card s-puQKhfeYY2" >
 <div class="s-sKRYtaK6In" aria-hidden="true">
      ${renderIcon("alert", { size: 32 })}
    </div>
 <span class="vmn-badge s-RDV2bKzTGW" >
      Certificate Not Found
    </span>
 <h1 class="s-0hpcACP6zw">
      AFCA Certificate Verification Failed
    </h1>
 <p class="s-p2HD_Mnhnh">
 The certificate identifier <strong class="s-yk4tKD3mB3">${escapeHtml(id)}</strong> does not correspond to any active, accredited graduation record in the AFCA Academy Registry.
    </p>
 <div class="s-utdLEncdZu">
 <p class="s-fzy69kMBd1"><strong>Possible Reasons:</strong></p>
 <ul class="s-FpvrCB11o4">
        <li>The certificate ID was mistyped or truncated.</li>
        <li>The student's final assessment portfolio is still under academic review.</li>
        <li>The credential has been superseded or administratively revoked.</li>
      </ul>
    </div>
 <div class="s-wt_QBGg-Bt">
 <a href="/hub/afca" class="vmn-btn vmn-btn-primary s-N9RnccLDF5" >
        Visit AFCA Academy
      </a>
 <a href="/careers" class="vmn-btn vmn-btn-secondary s-V3gR6858B1" >
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
<section class="vmn-verification-container s-HOvaVzHAlJ" >
  <!-- Breadcrumb -->
 <nav aria-label="Breadcrumb" class="s-E9ONBO6M1r">
 <a href="/" class="s-O9Z7O4KuIQ">Home</a> &gt; 
 <a href="/creative-economy-hub-overview" class="s-O9Z7O4KuIQ">Creative Hub</a> &gt; 
 <a href="/hub/afca" class="s-O9Z7O4KuIQ">AFCA Academy</a> &gt; 
 <span aria-current="page" class="s-AMflIswjLr">Certificate Verification</span>
  </nav>

 <div class="vmn-card s-k5HdVgyBgc" >
    <!-- Verification Status Banner -->
 <div class="s-xsga6eBaBD">
 <div class="s-uZB0rvzbTa">
 <div class="s-blT23fpuBK" aria-hidden="true">
          ${renderIcon("check", { size: 28 })}
        </div>
        <div>
 <span class="vmn-badge s-TrisTDIU3_" >
            Authentic &amp; Accredited
          </span>
 <h1 class="s-iafSeK7WcX">
            Official AFCA Graduation Credential
          </h1>
        </div>
      </div>
 <div class="s-E8vgO5r8HT">
 <span class="s-bLNq8BJUpu">Certificate ID</span>
 <span class="s--5v0EmT5fF">${escapeHtml(certificate.certificateId)}</span>
      </div>
    </div>

    <!-- Credential Details Grid -->
 <div class="s-Z3vVVnrfF7">
 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Graduate / Student ID</span>
 <strong class="s-i8ItQeSFYF">${escapeHtml(certificate.studentId)}</strong>
      </div>
      
 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Academic Programme</span>
 <strong class="s--tdIyvEtY5">${escapeHtml(certificate.courseTitle)}</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Cohort Class</span>
 <strong class="s-DAcIg5gbk4">${escapeHtml(certificate.cohortCode)}</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Distinction / Classification</span>
 <strong style="font-size: 1.1rem; color: ${distinctionColor};">${escapeHtml(certificate.distinction)} (${escapeHtml(certificate.finalScorePercent)}%)</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Date of Graduation</span>
 <strong class="s-mh7MYBU_EA">${escapeHtml(formattedDate)}</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Issuing Authority</span>
 <strong class="s-pD1roOgQ6T">AFCA Academy &amp; VMNL Governance</strong>
      </div>
    </div>

    <!-- Cryptographic Proof & QR Section -->
 <div class="s-h7yMH5nccC">
 <div class="s-Y8kD-MOVCW">
 <span class="s-H2miTkgJH5">
          Tamper-Evident SHA-256 Digest
        </span>
 <span class="s-v5PFDZ1ZsZ">FIPS 180-4 Compliant</span>
      </div>
 <div class="s-V6ZP0v9WVh">
        ${escapeHtml(certificate.verificationTokenSha256)}
      </div>
 <p class="s-04oMLtOrs-">
        This cryptographic fingerprint is immutably generated from student identity, rubric project scores, and graduation timestamp. Any unauthorized alteration to certificate data invalidates this verification token.
      </p>
    </div>

    <!-- Actions -->
 <div class="s-jWXDvP723a">
 <a href="/hub/afca" class="vmn-btn s-V3gR6858B1" >
        AFCA Academy Home
      </a>
 <a href="/hub/vtm" class="vmn-btn s-N9RnccLDF5" >
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

  if (!valid || !certificate || !certificate.isVerified || certificate.carrierLockVerified !== true) {
    return `
<section class="vmn-verification-container s-he7-rwfX00" >
 <div class="vmn-card s-puQKhfeYY2" >
 <div class="s-sKRYtaK6In" aria-hidden="true">
      ${renderIcon("alert", { size: 32 })}
    </div>
 <span class="vmn-badge s-RDV2bKzTGW" >
      Unverified Certificate
    </span>
 <h1 class="s-0hpcACP6zw">
      Proof-of-Air Performance Not Found
    </h1>
 <p class="s-p2HD_Mnhnh">
 No source-verified Proof-of-Air record is available for <strong class="s-yk4tKD3mB3">${escapeHtml(id)}</strong>. A record or cryptographic hash alone does not establish that a transmission occurred.
    </p>
 <div class="s-utdLEncdZu">
 <p class="s-fzy69kMBd1"><strong>Verification requirements:</strong></p>
 <ul class="s-FpvrCB11o4">
        <li>A record must be explicitly marked verified by the responsible process.</li>
        <li>Carrier lock evidence must be present; this page does not independently validate it.</li>
        <li>A certificate identifier or hash alone is not proof that transmission occurred.</li>
      </ul>
    </div>
 <div class="s-wt_QBGg-Bt">
 <a href="/workspace/mcr" class="vmn-btn vmn-btn-primary s-N9RnccLDF5" >
        Broadcast Operations
      </a>
 <a href="/partners" class="vmn-btn vmn-btn-secondary s-V3gR6858B1" >
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
    NXTR: "Nigezie Xtreme",
    ORIS: "Orisun — The Source",
    IMBD: "Isi Mbido — The Beginning",
  };
  const channelDisplay = channelNames[certificate.channelCode] || `Channel ${certificate.channelCode}`;

  return `
<section class="vmn-verification-container s-spP-ppCOPM" >
  <!-- Breadcrumb -->
 <nav aria-label="Breadcrumb" class="s-E9ONBO6M1r">
 <a href="/" class="s-O9Z7O4KuIQ">Home</a> &gt; 
 <a href="/media-and-audience-overview" class="s-O9Z7O4KuIQ">Linear TV</a> &gt; 
 <a href="/broadcast/dashboard" class="s-O9Z7O4KuIQ">Master Control</a> &gt; 
 <span aria-current="page" class="s-AMflIswjLr">Proof-of-Air Audit</span>
  </nav>

 <div class="vmn-card s-EOY-ff5M3A" >
    <!-- Verification Status Banner -->
 <div class="s-xsga6eBaBD">
 <div class="s-uZB0rvzbTa">
 <div class="s-ikh9VJ2UFd" aria-hidden="true">
          ${renderIcon("broadcast", { size: 28 })}
        </div>
        <div>
 <span class="vmn-badge s-TrisTDIU3_" >
            Proof-of-Air Record Matched
          </span>
 <h1 class="s-iafSeK7WcX">
            Certificate of Commercial Performance (Proof-of-Air)
          </h1>
        </div>
      </div>
 <div class="s-E8vgO5r8HT">
 <span class="s-bLNq8BJUpu">Certificate ID</span>
 <span class="s--5v0EmT5fF">${escapeHtml(certificate.certificateId)}</span>
      </div>
    </div>

    <!-- Proof-of-Air Grid -->
 <div class="s-DPmkn_7sYU">
 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Commercial Advertiser / Client</span>
 <strong class="s--tdIyvEtY5">${escapeHtml(certificate.clientName)}</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Broadcast Network</span>
 <strong class="s--tdIyvEtY5">${escapeHtml(channelDisplay)}</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Campaign &amp; Spot Identifiers</span>
 <div class="s-n-0i9cYOpa">
          <div>Campaign: <strong>${escapeHtml(certificate.campaignId)}</strong></div>
          <div>Spot ID: <strong>${escapeHtml(certificate.spotId)}</strong></div>
        </div>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Recorded Air Time</span>
 <div class="s-pD1roOgQ6T">
          <strong>${escapeHtml(airTimeWat)} (WAT)</strong>
 <div class="s-MsCnZy-ydt">${escapeHtml(airTimeUtc)}</div>
        </div>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">Aired Duration</span>
 <strong class="s-v9PqLYluAc">${escapeHtml(certificate.durationSeconds)} seconds</strong>
      </div>

 <div class="s-IzXuztZpWQ">
 <span class="s-YlS8HiIJf3">3-Way Carrier Match</span>
 <span class="vmn-badge" >
          Carrier lock evidence recorded; this page does not independently validate the source
        </span>
      </div>
    </div>

    <!-- Cryptographic Proof & Digital Signatures -->
 <div class="s-h7yMH5nccC">
 <div class="s-Y8kD-MOVCW">
 <span class="s-H2miTkgJH5">
          Certificate Record SHA-256 Digest
        </span>
 <span class="s-v5PFDZ1ZsZ">Record hash — not source verification</span>
      </div>
 <div class="s-tl6z-FmBOp">
        ${escapeHtml(certificate.cryptographicSignature)}
      </div>
 <p class="s-04oMLtOrs-">
        This digest identifies the certificate record; it does not independently authenticate playout logs, carrier telemetry, transmission occurrence, or a financial accounting treatment. Finance and relevant evidence owners remain authoritative.
      </p>
    </div>

    <!-- Actions & PDF Download -->
 <div class="s-jWXDvP723a">
      ${
        certificate.documentBase64
 ? `<a href="data:application/pdf;base64,${escapeHtml(certificate.documentBase64)}" download="PoA-${escapeHtml(certificate.certificateId)}.pdf" class="vmn-btn vmn-btn-secondary s-pY1QdE60oJ" >
              ${renderIcon("download", { size: 16 })} Download PDF Certificate
            </a>`
          : ""
      }
 <a href="/partners" class="vmn-btn vmn-btn-primary s-N9RnccLDF5" >
        Commercial Partnerships &rarr;
      </a>
    </div>
  </div>
</section>
  `.trim();
}

export function renderVerificationLookupHtml(kind: "afca" | "poa"): string {
  const isAfca = kind === "afca";
  const title = isAfca ? "AFCA Certificate Lookup" : "Proof-of-Air Verification Lookup";
  const subtitle = isAfca
    ? "Enter an AFCA Academy graduate certificate ID to check whether a verified credential exists in this registry."
    : "Enter a Proof-of-Air certificate ID to verify recorded linear broadcast delivery details.";
  const action = isAfca ? "/verify/afca" : "/verify/poa";
  const placeholder = isAfca ? "e.g. AFCA-2026-0001" : "e.g. POA-DEAL-001";

  return `
<section class="vmn-verification-container container py-8 max-w-2xl mx-auto">
  <nav aria-label="Breadcrumb" class="text-xs text-muted mb-4">
    <a href="/" class="text-muted">Home</a> &gt;
    <a href="/support" class="text-muted">Support</a> &gt;
    <span aria-current="page">${escapeHtml(title)}</span>
  </nav>
  <div class="vmn-card card p-6 rounded-2xl">
    <span class="vmn-badge badge-info mb-2">${isAfca ? "Academy Registry" : "Broadcast Compliance"}</span>
    <h1 class="text-2xl font-bold mb-2">${escapeHtml(title)}</h1>
    <p class="text-sm text-muted mb-6">${escapeHtml(subtitle)}</p>
    <form method="GET" action="${action}" class="flex flex-col sm:flex-row gap-3">
      <label for="verify-cert-id" class="sr-only">Certificate Identifier</label>
      <input
        id="verify-cert-id"
        name="id"
        type="text"
        required
        placeholder="${escapeHtml(placeholder)}"
        class="vmn-input flex-1 px-3 py-2 rounded-lg"
      />
      <button type="submit" class="btn btn-primary">Verify Record</button>
    </form>
    <div class="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-3 text-xs">
      <a href="/support" class="btn btn-outline btn-sm">&larr; Back to Help Center</a>
      <a href="${isAfca ? "/hub/afca" : "/media-and-audience-overview"}" class="btn btn-outline btn-sm">
        ${isAfca ? "Explore AFCA Academy" : "Explore Linear Channels"}
      </a>
    </div>
  </div>
</section>
  `.trim();
}
