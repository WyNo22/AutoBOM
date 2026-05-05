"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { consumeAccountToken } from "@/lib/account-email";
import { createAuthSession } from "@/lib/auth-session";

export type VerifyState = { error: string } | null;

export async function confirmEmailVerification(prevState: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Lien invalide." };

  const accountToken = await consumeAccountToken(token, "email_verification");
  if (!accountToken) return { error: "Lien invalide ou expiré. Reconnecte-toi pour recevoir un nouveau lien." };

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, accountToken.userId));
  await createAuthSession(accountToken.userId);
  redirect("/projects");
}
