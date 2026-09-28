import { defineConfig } from "prisma/config";

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && isProduction) {
  throw new Error("[VMNL-PRISMA-CONFIG-ERROR] DATABASE_URL is required in production environment");
}

export default defineConfig({
  datasource: {
    url: databaseUrl || "postgresql://vmn_user:vmn_password@localhost:5432/vmn_db",
  },
});
