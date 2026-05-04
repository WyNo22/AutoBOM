"use server";

import { db, users } from "@/lib/db";
import { createAuthSession } from "@/lib/auth-session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function registerWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !firstName || !lastName || password.length < 8 || password !== confirm) return;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return;

  const [user] = await db
    .insert(users)
    .values({
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      passwordHash: hashPassword(password),
      emailVerified: new Date(),
    })
    .returning({ id: users.id });

  await createAuthSession(user.id);
  redirect("/projects");
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !verifyPassword(password, user.passwordHash)) return;

  await createAuthSession(user.id);
  redirect("/projects");
}
