/**
 * VMNL Broadcast Rights Context — TSK-14 (report.md CA-32)
 * Authority: VMNL-AZP-VMN-BRD-PRD-001 — R1.2A §45 (§62 C-1 override wording is
 * HD-02 and is deliberately not implemented here), CCPP-001 §15.
 *
 * One context owns both halves of the rights domain:
 * - `./clearance.js`       — the gate: does a RightsRecord permit this transmission?
 * - `./review-request.js`  — the workflow: tracking a request *about* a blocked record.
 *
 * They used to be two unrelated modules — the request lifecycle sat under
 * `src/core/rights`, imported by nothing, while the gate read a caller-supplied
 * record. A reader could not tell request tracking from clearance, and the
 * domain looked covered while the gate was fed nothing. Now a cleared review
 * writes through `RightsRepository` into the same RightsRecord the gate reads,
 * and both are exported from this module only.
 *
 * TSK-10 added the two files that make the gate authoritative rather than
 * advisory: `./registry.js` (the durable records the gate decides on, loaded
 * from the store rather than handed over by the caller) and
 * `./schedule-clearance.js` (per-entry clearance for schedule commit and EPG
 * export). Nothing outside this context may construct a rights record to check.
 */

export * from "./clearance.js";
export * from "./registry.js";
export * from "./review-request.js";
export * from "./schedule-clearance.js";
