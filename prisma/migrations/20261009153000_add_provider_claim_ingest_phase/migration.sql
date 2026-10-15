-- TSK-19: make the provider-event replay claim two-phase.
-- A claim written before ingestion but never stamped is an abandoned attempt,
-- so a provider retry must be able to take it over instead of being refused and
-- leaving the payment unrecorded. Purely additive: nullable column, no backfill,
-- no DROP and no ALTER of an existing constraint.
ALTER TABLE "ProviderEventClaim" ADD COLUMN "ingestedAt" TIMESTAMP(3);
