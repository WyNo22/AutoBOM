import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  // For local libSQL file we use the sqlite dialect. To switch to Turso cloud
  // for migrations, change dialect to "turso" and provide TURSO_AUTH_TOKEN.
  dialect: "sqlite",
  dbCredentials: {
    url: (process.env.DATABASE_URL ?? "file:./autbom.db").replace(/^file:/, ""),
  },
  verbose: true,
  strict: true,
});
