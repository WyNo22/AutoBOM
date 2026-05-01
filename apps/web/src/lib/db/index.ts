import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// DATABASE_URL examples:
//   - local file:    file:./autbom.db   (default)
//   - Turso cloud:   libsql://<db>.turso.io  (with TURSO_AUTH_TOKEN)
const url = process.env.DATABASE_URL ?? "file:./autbom.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });
// FK enforcement is set at migration time via the migration runner; libSQL
// connections are short-lived from Drizzle's pov, so a top-level pragma
// would not stick. See migrate.ts for the one-shot pragma.

export const db = drizzle(client, { schema });
export * from "./schema";
