import { defineConfig } from "drizzle-kit";

// Local SQL generation only: intentionally no database credentials.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  strict: true,
});
