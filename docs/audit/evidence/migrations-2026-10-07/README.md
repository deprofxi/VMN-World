# TSK-06 — Migration deploy verification (VMNL-AZP-VMN-TODO-002)

Measured 2026-10-07 on commit tree `ce098f8` + working tree. PostgreSQL 18.3 on
`localhost:5432`, Prisma CLI 7.10.0. Every figure below is reproducible with the
command printed above it.

## 1. Clean deploy

```
createdb vmn_tsk06_deploy
DATABASE_URL=postgresql://root@localhost:5432/vmn_tsk06_deploy npx prisma migrate deploy
```

Result: `4 migrations found` → all four applied → `All migrations have been
successfully applied.` See `deploy-from-empty.txt` (renamed 2026-10-09 from
`deploy-from-empty.log`; `.gitignore:3` hid the original from `git status`, so
this artifact could not otherwise be committed).

**The delegated P3006 / P2022 claim is false.** `prisma migrate deploy` from an
empty database succeeds, including the `0_init` baseline whose name has no
timestamp prefix.

## 2. Model coverage

```
psql vmn_tsk06_deploy -tAc "select count(*) from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE'"        -> 28
grep -c '^model ' prisma/schema.prisma                             -> 27
```

28 tables = 27 models + `_prisma_migrations`. `grep -vxF` of the model-name list
against the deployed table list returns **zero** missing tables — all **27**
models are created by the migration chain.

## 3. Drift

```
npx prisma migrate diff --from-migrations ./prisma/migrations \
  --to-schema prisma/schema.prisma --exit-code                     -> exit 0, "No difference detected."
DATABASE_URL=.../vmn_tsk06_deploy npx prisma migrate diff \
  --from-config-datasource --to-schema prisma/schema.prisma --exit-code -> exit 0, "No difference detected."
```

Both directions empty: replaying the migrations from empty produces exactly the
declared schema, and the deployed scratch database matches it.

Prisma 7 removed `--from-url`, `--to-schema-datamodel` and
`--shadow-database-url` from `migrate diff`; a migrations-directory diff must be
configured through `datasource.shadowDatabaseUrl`. `prisma.config.ts` now reads
`SHADOW_DATABASE_URL` for that purpose (optional — `migrate deploy` never uses a
shadow database).

## 4. Fix applied while verifying

`20261002150000_add_finance_event_indexes/migration.sql` created 8 indexes in
raw SQL that `prisma/schema.prisma` never declared, so the first drift run
returned 8 `DROP INDEX` statements. The schema now carries the matching
`@@index` blocks on `BankStatementRecord`, `CommercialCampaign`,
`TalentPayoutBatch`, `EventTicket` and `FusionEvent`. No migration and no new
SQL was written: the indexes already exist in every deployed database, and the
declaration simply makes the datamodel match reality. The nine indexes from
`20261002140000_add_read_path_indexes` were already declared.

## 5. The "20–26 undeployed `Person` columns" claim

```
psql vmn_tsk06_deploy -tAc "select string_agg(column_name, ', ' order by ordinal_position)
  from information_schema.columns where table_name='Person'"
```

`id, email, phone, firstName, lastName, kycStatus, nationalId, createdAt,
updatedAt` — **9** scalar columns, **all deployed**. The remaining five `Person`
fields in the datamodel (`user`, `talentProfile`, `creatorProfile`, `contracts`)
are relation fields and have no column by design. The claim is false.

## 6. Remaining gate

`prisma/migrations/20261002140000_*`, `20261002150000_*`,
`20261006120000_*` and `migration_lock.toml` are still untracked
(`git status --porcelain prisma/migrations`). Committing them is TSK-09's
checkbox "Untracked migrations committed (gate for TSK-06)" and needs the
owner's sign-off on the commit series.

## 7. Status

`VERIFIED-DEPLOYS-CLEAN` — deploy, model coverage and both diff directions
measured green. NOT closed in `tasks.md` until the untracked migrations are
committed under TSK-09.
