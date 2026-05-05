import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

function enabled() {
  return process.env.NODE_ENV !== "production" || process.env.DEV_AUTH_BYPASS === "true";
}

function present(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  if (!enabled()) {
    return NextResponse.json({ error: "Debug auth disabled" }, { status: 404 });
  }

  const checks: Array<{ name: string; ok: boolean; details?: unknown; error?: string }> = [];

  try {
    const result = await db.execute(sql`select now() as now`);
    checks.push({ name: "database_connection", ok: true, details: result });
  } catch (error) {
    checks.push({ name: "database_connection", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  const tables = ["user", "session", "account", "verificationToken", "account_token"];
  for (const table of tables) {
    try {
      const result = await db.execute(sql`
        select exists (
          select from information_schema.tables
          where table_schema = 'public' and table_name = ${table}
        ) as exists
      `);
      checks.push({ name: `table_${table}`, ok: true, details: result });
    } catch (error) {
      checks.push({ name: `table_${table}`, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  try {
    const result = await db.execute(sql`select count(*)::int as count from "user"`);
    checks.push({ name: "users_count", ok: true, details: result });
  } catch (error) {
    checks.push({ name: "users_count", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const result = await db.execute(sql`select count(*)::int as count from "session"`);
    checks.push({ name: "sessions_count", ok: true, details: result });
  } catch (error) {
    checks.push({ name: "sessions_count", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  return NextResponse.json({
    ok: checks.every((check) => check.ok),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: present(process.env.DATABASE_URL),
      authSecret: present(process.env.AUTH_SECRET),
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      devAuthBypass: process.env.DEV_AUTH_BYPASS ?? null,
      adminEmail: process.env.ADMIN_EMAIL ?? null,
      mailDriver: process.env.MAIL_DRIVER ?? null,
      resendApiKey: present(process.env.RESEND_API_KEY),
      mailFrom: process.env.MAIL_FROM ?? null,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      supabasePublishableKey: present(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    },
    checks,
  });
}
