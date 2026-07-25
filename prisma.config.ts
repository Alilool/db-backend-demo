import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Keep the Prisma CLI on the same local database that Next.js loads first.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
