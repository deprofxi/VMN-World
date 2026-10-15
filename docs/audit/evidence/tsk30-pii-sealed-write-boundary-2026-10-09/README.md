# TSK-30 · Enforce PII/MFA sealing at the write boundary *(CA-18, `audit.md` AUD-06)* — 2026-10-09

Baseline: `ce098f8`, **uncommitted**. Nothing here is pushed; commit and push remain the owner's
decision, so the migration and the code below are live only on this working tree and on the two
local databases (see `migrations.txt`).

## What was enforced, and where

Two layers, because one of them alone was the finding.

1. **Application choke point.** `src/core/auth/index.ts:232` `persistUserToSharedStore()` is now the
   *only* writer of `user:*` keys in the shared KV store (call sites `:512` seed, `:548`
   `updateUserMfaEnrollment`, `:575` `registerUser`). Before the write it calls
   `assertSealedForStorage("User.mfaSecret", …)` (`src/core/websecurity/index.ts:413`), which throws
   `[VMNL-PII-01]` on anything that is not a well-formed `enc:v1:<ct>:<iv>:<tag>` envelope. Sealing
   itself goes through `sealSensitiveField()` (`:396`), which refuses to seal a value that is already
   sealed (`[VMNL-PII-02]`, `:398`) — double-encryption produced seeds the reader could never open.
2. **The database refuses the value, not the convention.** Migration
   `prisma/migrations/20261009200000_add_pii_sealed_envelope_checks/migration.sql` adds
   `Person_nationalId_sealed_envelope` (`:17`) and `User_mfaSecret_sealed_envelope` (`:20`): each
   column must be `NULL` or match the same envelope regex. Prisma has no `CHECK` syntax, so
   `prisma/schema.prisma:90-100` and `:118-121` carry the pointer comment naming the constraint and
   `SEALED_FIELD_ENVELOPE` (`src/core/websecurity/index.ts:383`) — format and constraint change together.

Read path: `decryptUserSecretsFromStore()` (`src/core/auth/index.ts:261`) opens through
`openSealedField()` (`:432`), which returns an outcome (`opened` | `malformed` | `auth_failed`)
instead of throwing, logs the access, and hands back `mfaSecret: null` on any failure. A malformed
store value can no longer surface as a "secret".

## What the tests prove (not what they assert about strings)

`tests/unit/auth.test.ts` — 15 tests, `focused-run.txt`:

- *Envelope recognition* — only the AES-256-GCM shape passes `isSealedFieldValue`; sealing a sealed
  value throws `[VMNL-PII-02]`.
- *Write boundary* — `assertSealedForStorage` rejects a plaintext TOTP seed with `[VMNL-PII-01]` and
  accepts `null`/`undefined`/an envelope. This is the fail-closed behaviour the box asked for, rather
  than a convention in a comment.
- *Decryption access logged* — an open produces an `auth.mfa_secret_decrypted` entry on the tamper-
  evident ledger (`src/core/audit/index.ts:140` `recordAuditLog` — re-pinned to `:185` on
  2026-10-12, where TSK-18's rewrite of the module moved it) carrying
  `changes.outcome` and `algorithm: "aes-256-gcm"`, and the serialised entry contains neither the
  plaintext seed nor the ciphertext slice. A refused open produces `auth.mfa_secret_decrypt_refused`
  with `outcome: "malformed"` and no usable secret.
- *Real Postgres* (`describe.skipIf(!WITH_DB)`, and `WITH_DB` was true for this run) — both
  constraints exist in `pg_constraint`, `person.create` with a plaintext `nationalId` fails with
  code `23514` on `Person_nationalId_sealed_envelope`, a sealed value is accepted, and the same pair
  holds for `user.create` on `User_mfaSecret_sealed_envelope`. `migrations.txt` repeats it in plain
  SQL inside rolled-back transactions and confirms zero rows were left behind.

## Gates on this tree

`gates.txt` — typecheck 0 · lint 0 · build 0 · `pnpm test` 65 files / **753** tests, 0 failed, 0
skipped · `pnpm test:coverage` 0 at **78.51 / 69.94 / 82.25 / 79.77** against floors 73/62/77/72,
then `pnpm test` again once the register and handoff prose had landed (`full-suite-final.txt`,
65 files / 753 tests, exit 0) — those documents are parsed by `tests/unit/register-inheritance.test.ts`
and `tests/unit/canonical-model.test.ts`, so prose edits are inside the gate, not outside it.
Module coverage: `core/auth` 76.31/60.64/75.51/79.25, `core/websecurity` 81.94/70.21/92.30/82.81.

## What this does **not** claim

- **Box 3 stays open and blocked.** The envelope carries a `v1` marker, but there is no key
  versioning/rotation procedure and no named owner — that is `HD-05` (DPO). `PII_ENCRYPTION_KEY` is
  still a single secret, and `getFieldEncryptionKey` only *refuses to start* without it in
  production/staging (`src/core/websecurity/index.ts`). Sealing a value with a key that has no
  rotation plan is not key management.
- **Two columns, not "PII is encrypted".** `CommercialEnquiry.phone`/`fullName`/`email`,
  `Person.phone`, talent KYC free text and the ledger's `changes` payloads are untouched. The register
  box named `Person.nationalId` and `User.mfaSecret`; expanding to the rest is a scoping decision for
  the owner, not something to slip into a security closure.
- **The `User` CHECK guards a table the application never writes.** `docs/domain/systems-of-record.md`
  §2 records `User` as one of the 13 models with no accessors, so today the only real writer of
  `mfaSecret` is the KV mirror behind `persistUserToSharedStore`. The constraint is defence for any
  future write (and for direct SQL), and it is tested as such — not a claim that the Prisma table is
  in the live path.
- **`Person.nationalId` has no application write path at all** (the only `Person` writer,
  `src/db/migrate-and-seed.ts:158`, never sets it), so the constraint is enforced where the value
  *would* land rather than where it currently does. Both columns are empty in every local database
  (`measurements.txt` §6), which is also why an additive `CHECK` was safe to deploy.
- **The audit entry has no FK-valid `userId`.** `recordSecretAccess` writes `userId: null` on purpose:
  `AuditLog_userId_fkey` rejects the synthetic ids the in-process identity uses, and a durable audit
  identity is TSK-20's open item. The entry identifies the subject by `resource: "User.mfaSecret"` +
  `resourceId: <email>`. Before this was understood, the FK violation silently dropped exactly the
  entries this box asked for.
- **Deployment is local.** The migration is applied to `vmnl_enterprise` (via `prisma migrate deploy`)
  and to the test database `vmn_enterprise` (via `psql -f`; that database has no `_prisma_migrations`
  bookkeeping, so `migrate deploy` refuses it with `P3005`). No shared or production environment has
  been touched.

## Documents touched

`tasks.md` (TSK-30 closure), `prisma/schema.prisma` (pointer comments), `docs/domain/data-dictionary.md`
(183/24/192 census + re-pinned cites), `docs/domain/canonical-model.md`, `docs/domain/systems-of-record.md`,
`docs/domain/state-machines.md`, `docs/handoffs/LATEST.md` (cites re-pinned by measurement;
`measurements.txt` §4-5 lists every old→new pair), `tests/unit/canonical-model.test.ts` (guard re-pin).
Schema cites inside older `docs/audit/evidence/**` were left at their measurement-date values —
they now read 11 lines low.
