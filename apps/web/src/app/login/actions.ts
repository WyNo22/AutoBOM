"use server";

import { db, users } from "@/lib/db";
import { createAuthSession } from "@/lib/auth-session";
import { sendEmailVerification, sendPasswordReset } from "@/lib/account-email";
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
    })
    .returning({ id: users.id });

  await sendEmailVerification(user.id);
  redirect("/login/check-email");
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !verifyPassword(password, user.passwordHash)) return;
  if (!user.emailVerified) {
    await sendEmailVerification(user.id);
    redirect("/login/check-email");
  }

  await createAuthSession(user.id);
  redirect("/projects");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot-password/check-email");
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (user) await sendPasswordReset(user.id);
  redirect("/forgot-password/check-email");
}
