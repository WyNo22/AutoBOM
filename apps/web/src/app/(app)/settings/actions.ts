"use server";

import { db, users } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) return;
  await db
    .update(users)
    .set({ firstName, lastName, name: `${firstName} ${lastName}` })
    .where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function updatePassword(formData: FormData) {
  const userId = await requireUserId();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8 || password !== confirm) return;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;
  if (user.passwordHash && !verifyPassword(current, user.passwordHash)) return;

  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId));
  revalidatePath("/settings");
}

export async function deleteAccount() {
  const userId = await requireUserId();
  await db.delete(users).where(eq(users.id, userId));
  const jar = await cookies();
  jar.delete("session");
  redirect("/login");
}
