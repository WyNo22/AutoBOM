// Standalone migration runner: `pnpm db:migrate`.
// Reads compiled SQL files from ./drizzle and applies them to the libSQL DB.
// Env is loaded by tsx via --env-file=.env.local (see package.json script).
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./autbom.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const client = createClient({ url, authToken });
  await client.execute("PRAGMA foreign_keys = ON;").catch(() => {});

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log(`✓ migrations applied (${url})`);
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
