// Standalone migration runner: `pnpm db:migrate`.
// Reads compiled SQL files from ./drizzle and applies them to the Postgres DB.
// Env is loaded by tsx via --env-file=.env.local (see package.json script).
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log(`✓ migrations applied (${url})`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
