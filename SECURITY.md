# Security Policy — VMNL Enterprise Platform

**Authority:** `VMNL-AZP-VMN-CCPP-001 — R1.1` §Security · `CLAUDE.md` `<security>`
**Owner:** Executive Chairman & Broadcast Authority, acting as security owner until a named
Security Lead is appointed (`tasks.md` HD-05 is the adjacent open decision).
**Status:** Interim. A dedicated security mailbox and an on-call rotation are still outstanding.

---

## 1. Reporting a vulnerability

Do **not** open a public issue, pull request or discussion for a suspected vulnerability.

Report privately to **deprof@rave.com.ng** with the subject line `[SECURITY] <short summary>`.
This is the repository owner's existing address, used as an interim route while a dedicated
security mailbox is established; it is recorded here rather than left implicit so that a
reporter is never guessing.

Include, as far as you can:

- the affected component (route, module, or deployment artefact) and version or commit SHA;
- the class of issue (authorization, injection, secret exposure, PII disclosure, denial of service…);
- reproduction steps or a proof of concept;
- the impact you believe it has, and whether you have seen it exploited;
- how you would like to be credited, or `anonymous`.

**Never include live secrets, real personal data, or production database dumps in a report.**
Redact credentials and use synthetic records. If a secret may have leaked, say so in the first
sentence without repeating the value.

## 2. What to expect

| Stage | Target |
|:---|:---|
| Acknowledgement of receipt | 2 business days |
| Initial triage and severity assessment | 5 business days |
| Fix or documented mitigation for Critical / High | 30 days |
| Fix or documented mitigation for Moderate / Low | 90 days |
| Disclosure coordination | By agreement after a fix ships |

These are targets, not a warranty. If a finding is disputed or needs a business decision
(for example rights, privacy or accounting treatment), the response will say so explicitly and
name the accountable authority rather than closing the report.

## 3. Scope

**In scope** — the application code in this repository, the HTTP surface it serves, the release
and CI configuration, and the container/compose definitions.

**Out of scope** — third-party providers (StarTimes carriage systems, Azeebo+ federation,
payment providers, object storage vendors) whose own disclosure programmes should be used; social
engineering of staff; physical security; and findings that require a compromised host or
already-privileged credentials as the sole precondition.

## 4. Safe harbour

Good-faith research that respects this policy — no data exfiltration, no privacy violation, no
service degradation beyond what a proof of concept needs, no testing against real personal data —
will not be pursued legally by VMNL. Stop and report as soon as you have demonstrated impact.

## 5. Handling commitments on our side

- Reports are triaged against the threat model in [`docs/security/threat-model.md`](docs/security/threat-model.md).
- A confirmed finding gets a register entry with an owner and a date, in the same discipline as
  every other open item in this repository.
- Restricted data is not copied into tickets, logs or chat while investigating; access follows
  least privilege.
- A fix ships with a regression test that fails without it.
