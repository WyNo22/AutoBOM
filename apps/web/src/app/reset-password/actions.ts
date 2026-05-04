"use server";

import { db, users } from "@/lib/db";
import { consumeAccountToken } from "@/lib/account-email";
import { hashPassword } from "@/lib/password";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!token || password.length < 8 || password !== confirm) return;

  const accountToken = await consumeAccountToken(token, "password_reset");
  if (!accountToken) redirect("/forgot-password");

  await db
    .update(users)
    .set({ passwordHash: hashPassword(password), emailVerified: new Date() })
    .where(eq(users.id, accountToken.userId));
  redirect("/login");
}
