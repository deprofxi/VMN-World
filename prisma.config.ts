import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://vmn_user:vmn_password@localhost:5432/vmn_db",
  },
});
