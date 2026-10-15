import { defineConfig } from "prisma/config";

const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && isProduction) {
  throw new Error("[VMNL-PRISMA-CONFIG-ERROR] DATABASE_URL is required in production/staging environment");
}

export default defineConfig({
  datasource: {
    url: databaseUrl || (process.env.NODE_ENV === "test" ? "postgresql://localhost:5432/vmn_test" : ""),
    // TSK-06: Prisma 7 removed `--shadow-database-url` from `migrate diff`; a
    // migrations-directory diff is only possible through this config key. It is
    // optional everywhere else (migrate deploy does not use a shadow database).
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
