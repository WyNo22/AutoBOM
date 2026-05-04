"use server";

import { db, users } from "@/lib/db";
import { consumeAccountToken } from "@/lib/account-email";
import { hashPassword } from "@/lib/password";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type ResetState = { error: string } | null;

export async function resetPassword(prevState: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!token) return { error: "Lien invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  const accountToken = await consumeAccountToken(token, "password_reset");
  if (!accountToken) return { error: "Lien invalide ou expiré. Recommence la procédure." };

  await db
    .update(users)
    .set({ passwordHash: hashPassword(password), emailVerified: new Date() })
    .where(eq(users.id, accountToken.userId));
  redirect("/login");
}
