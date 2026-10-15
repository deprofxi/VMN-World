-- TSK-30 (report.md CA-18, audit.md AUD-06 half-closed): the two sensitive
-- columns that prisma/schema.prisma documents as "envelope-only" get the same
-- rule enforced by the database, so sealing stops being a convention an
-- application writer can forget.
--
-- The pattern is the AES-256-GCM envelope produced by
-- src/core/websecurity `sealSensitiveField` (`SEALED_FIELD_ENVELOPE`):
--   enc:v1:<ciphertext-hex>:<12-byte-iv-hex>:<16-byte-authTag-hex>
-- A NULL is allowed (the column is optional); a plaintext value is refused.
--
-- Purely additive: no DROP, no backfill. Measured before writing — every
-- existing row in both columns is NULL in all local databases
-- (`select count(*) from "Person" where "nationalId" is not null` -> 0;
--  `select count(*) from "User" where "mfaSecret" is not null` -> 0), so the
-- constraints validate against the current data.

ALTER TABLE "Person" ADD CONSTRAINT "Person_nationalId_sealed_envelope"
  CHECK ("nationalId" IS NULL OR "nationalId" ~ '^enc:v1:[0-9a-f]+:[0-9a-f]{24}:[0-9a-f]{32}$');

ALTER TABLE "User" ADD CONSTRAINT "User_mfaSecret_sealed_envelope"
  CHECK ("mfaSecret" IS NULL OR "mfaSecret" ~ '^enc:v1:[0-9a-f]+:[0-9a-f]{24}:[0-9a-f]{32}$');
